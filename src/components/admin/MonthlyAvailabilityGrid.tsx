import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Bed, Users, 
  Search, Filter, CheckCircle2, Clock, AlertCircle, Sparkles, 
  Plus, MessageCircle, Edit3, X, Eye, ShieldCheck, Check, ArrowRight,
  TrendingUp, Download, RefreshCw
} from 'lucide-react';
import { Booking, BookingStatus, HostelSettings, Room, SurfAddOn, WaitlistEntry } from '../../types';
import { addDaysToString, formatDisplayDate, formatShortDate, getTodayString } from '../../utils/date';
import { calculateRoomAvailability } from '../../utils/availability';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { BookingEditModal } from './BookingEditModal';

interface MonthlyAvailabilityGridProps {
  rooms: Room[];
  bookings: Booking[];
  settings?: HostelSettings;
  addOns?: SurfAddOn[];
  waitlist?: WaitlistEntry[];
  onUpdateBooking?: (updated: Booking) => void;
  onBookSlot?: (roomId: string, date: string) => void;
  onAddToWaitlist?: (roomId: string, date: string) => void;
  onViewWaitlist?: (roomId?: string) => void;
}

type StatusFilterOption = 'all' | 'available' | 'confirmed' | 'checked_in' | 'pending' | 'checked_out';
type GridDensityMode = 'standard' | 'compact' | 'guests';
type RoomCategoryFilter = 'all' | 'dorm_mixed' | 'dorm_female' | 'private';

export const MonthlyAvailabilityGrid: React.FC<MonthlyAvailabilityGridProps> = ({
  rooms,
  bookings,
  settings,
  addOns = [],
  waitlist = [],
  onUpdateBooking,
  onBookSlot,
  onAddToWaitlist,
  onViewWaitlist,
}) => {
  const today = getTodayString();
  const currencySymbol = settings?.currencySymbol || '€';

  // 30 Days Timeline
  const [startDate, setStartDate] = useState<string>(today);
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [categoryFilter, setCategoryFilter] = useState<RoomCategoryFilter>('all');
  const [roomSearch, setRoomSearch] = useState<string>('');
  const [densityMode, setDensityMode] = useState<GridDensityMode>('standard');

  // Interactive Inspector & Edit Modal State
  const [selectedCell, setSelectedCell] = useState<{ room: Room; date: string } | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Generate continuous 30-day date array
  const dateList: string[] = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < 30; i++) {
      list.push(addDaysToString(startDate, i));
    }
    return list;
  }, [startDate]);

  const endDate = dateList[dateList.length - 1] || startDate;

  // Navigation handlers
  const handlePrev30Days = () => {
    setStartDate((prev) => addDaysToString(prev, -30));
  };

  const handleNext30Days = () => {
    setStartDate((prev) => addDaysToString(prev, 30));
  };

  const handleToday = () => {
    setStartDate(today);
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (roomSearch.trim() && !room.name.toLowerCase().includes(roomSearch.toLowerCase())) {
        return false;
      }
      if (categoryFilter === 'dorm_mixed' && room.type !== 'dorm_mixed') return false;
      if (categoryFilter === 'dorm_female' && room.type !== 'dorm_female') return false;
      if (categoryFilter === 'private' && !room.type.startsWith('private')) return false;
      return true;
    });
  }, [rooms, roomSearch, categoryFilter]);

  // Overall 30-Day Metrics Calculation
  const monthlyMetrics = useMemo(() => {
    let totalCapacityBedNights = 0;
    let confirmedBedNights = 0;
    let checkedInBedNights = 0;
    let pendingBedNights = 0;
    let availableBedNights = 0;

    dateList.forEach((dateStr) => {
      const nextDate = addDaysToString(dateStr, 1);
      rooms.forEach((room) => {
        totalCapacityBedNights += room.capacity;
        const avail = calculateRoomAvailability(room, dateStr, nextDate, bookings);
        availableBedNights += avail.availableBeds;

        // Group status counts for bookings active on this date
        const dayBookings = bookings.filter(
          (b) =>
            b.roomId === room.id &&
            b.status !== 'cancelled' &&
            dateStr >= b.checkInDate &&
            dateStr < b.checkOutDate
        );

        dayBookings.forEach((b) => {
          const guests = room.type.startsWith('private') ? room.capacity : (b.guestsCount || 1);
          if (b.status === 'checked_in') checkedInBedNights += guests;
          else if (b.status === 'confirmed') confirmedBedNights += guests;
          else if (b.status === 'pending') pendingBedNights += guests;
        });
      });
    });

    const bookedBedNights = confirmedBedNights + checkedInBedNights + pendingBedNights;
    const occupancyPercent = totalCapacityBedNights > 0 
      ? Math.min(100, Math.round((bookedBedNights / totalCapacityBedNights) * 100)) 
      : 0;

    return {
      totalCapacityBedNights,
      bookedBedNights,
      confirmedBedNights,
      checkedInBedNights,
      pendingBedNights,
      availableBedNights,
      occupancyPercent,
    };
  }, [dateList, rooms, bookings]);

  // Helper to evaluate room date status breakdown
  const getCellStatusData = (room: Room, dateStr: string) => {
    const nextDate = addDaysToString(dateStr, 1);
    const avail = calculateRoomAvailability(room, dateStr, nextDate, bookings);
    const isPrivate = room.type.startsWith('private');

    const dayBookings = bookings.filter(
      (b) =>
        b.roomId === room.id &&
        b.status !== 'cancelled' &&
        dateStr >= b.checkInDate &&
        dateStr < b.checkOutDate
    );

    const hasCheckedIn = dayBookings.some((b) => b.status === 'checked_in');
    const hasConfirmed = dayBookings.some((b) => b.status === 'confirmed');
    const hasPending = dayBookings.some((b) => b.status === 'pending');
    const hasCheckedOut = dayBookings.some((b) => b.status === 'checked_out');

    // Determine primary status for color coding
    let primaryStatus: BookingStatus | 'available' | 'partially_booked' = 'available';

    if (dayBookings.length === 0) {
      primaryStatus = 'available';
    } else if (isPrivate) {
      primaryStatus = dayBookings[0].status;
    } else {
      // Shared Dorm
      if (avail.availableBeds === 0) {
        if (hasCheckedIn) primaryStatus = 'checked_in';
        else if (hasConfirmed) primaryStatus = 'confirmed';
        else if (hasPending) primaryStatus = 'pending';
        else primaryStatus = 'checked_out';
      } else {
        primaryStatus = 'partially_booked';
      }
    }

    return {
      avail,
      dayBookings,
      primaryStatus,
      hasCheckedIn,
      hasConfirmed,
      hasPending,
      hasCheckedOut,
    };
  };

  // Color styles corresponding directly to booking status
  const getStatusColorClasses = (status: BookingStatus | 'available' | 'partially_booked') => {
    switch (status) {
      case 'checked_in':
        return {
          cellBg: 'bg-indigo-50/80 hover:bg-indigo-100/90 border-indigo-200/90',
          badgeBg: 'bg-indigo-600 text-white font-bold',
          badgeText: 'text-indigo-900 font-bold',
          dot: 'bg-indigo-600',
          label: 'Checked In',
        };
      case 'confirmed':
        return {
          cellBg: 'bg-sky-50/80 hover:bg-sky-100/90 border-sky-200/90',
          badgeBg: 'bg-sky-600 text-white font-bold',
          badgeText: 'text-sky-900 font-bold',
          dot: 'bg-sky-500',
          label: 'Confirmed',
        };
      case 'pending':
        return {
          cellBg: 'bg-amber-50/80 hover:bg-amber-100/90 border-amber-200/90',
          badgeBg: 'bg-amber-500 text-white font-bold',
          badgeText: 'text-amber-900 font-bold',
          dot: 'bg-amber-500',
          label: 'Pending',
        };
      case 'checked_out':
        return {
          cellBg: 'bg-slate-50 hover:bg-slate-100 border-slate-200',
          badgeBg: 'bg-slate-500 text-white font-bold',
          badgeText: 'text-slate-700 font-bold',
          dot: 'bg-slate-400',
          label: 'Checked Out',
        };
      case 'partially_booked':
        return {
          cellBg: 'bg-teal-50/70 hover:bg-teal-100/80 border-teal-200',
          badgeBg: 'bg-teal-600 text-white font-bold',
          badgeText: 'text-teal-900 font-bold',
          dot: 'bg-teal-500',
          label: 'Partial',
        };
      case 'available':
      default:
        return {
          cellBg: 'bg-emerald-50/50 hover:bg-emerald-100/70 border-emerald-200/60',
          badgeBg: 'bg-emerald-600 text-white font-bold',
          badgeText: 'text-emerald-800 font-bold',
          dot: 'bg-emerald-500',
          label: 'Available',
        };
    }
  };

  // Selected cell data for slide-over inspector
  const activeInspectorData = useMemo(() => {
    if (!selectedCell) return null;
    const { room, date } = selectedCell;
    const statusData = getCellStatusData(room, date);
    return {
      room,
      date,
      ...statusData,
    };
  }, [selectedCell, bookings]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. HEADER & HORIZON NAVIGATION */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-extrabold text-slate-900 flex items-center gap-2">
                  <span>30-Day Monthly Room Availability Grid</span>
                  <span className="text-[11px] font-bold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Next 30 Days
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Visual timeline from <span className="font-bold text-slate-800">{formatShortDate(startDate)}</span> through <span className="font-bold text-slate-800">{formatShortDate(endDate)}</span> color-coded by real-time reservation status.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Start Date Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">Start:</span>
              <input
                id="monthly-grid-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  if (e.target.value) setStartDate(e.target.value);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Quick Jumps */}
            <button
              type="button"
              onClick={handleToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                startDate === today
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Today
            </button>

            {/* Step 30-day buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrev30Days}
                title="Previous 30 days"
                className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-2xs transition-all flex items-center gap-1 text-xs font-semibold px-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>-30d</span>
              </button>
              <button
                type="button"
                onClick={handleNext30Days}
                title="Next 30 days"
                className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-2xs transition-all flex items-center gap-1 text-xs font-semibold px-2"
              >
                <span>+30d</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. COLOR LEGEND & STATUS FILTER BAR */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Color Legend with Interactive Filter Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
              Status Legend:
            </span>

            {[
              { id: 'all', label: 'All Statuses', dot: 'bg-slate-400' },
              { id: 'available', label: 'Available (Free)', dot: 'bg-emerald-500' },
              { id: 'confirmed', label: 'Confirmed', dot: 'bg-sky-500' },
              { id: 'checked_in', label: 'Checked In (In-House)', dot: 'bg-indigo-600' },
              { id: 'pending', label: 'Pending', dot: 'bg-amber-500' },
            ].map((st) => {
              const isSelected = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  id={`status-legend-${st.id}`}
                  onClick={() => setStatusFilter(st.id as StatusFilterOption)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${st.dot}`} />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Room Search, Category & Density */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search room..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 w-36 sm:w-44"
              />
              {roomSearch && (
                <button
                  type="button"
                  onClick={() => setRoomSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as RoomCategoryFilter)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Room Types</option>
              <option value="dorm_mixed">Mixed Dorms</option>
              <option value="dorm_female">Female Dorms</option>
              <option value="private">Private Suites</option>
            </select>

            {/* Density Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => setDensityMode('standard')}
                title="Standard detail view"
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  densityMode === 'standard' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setDensityMode('compact')}
                title="Compact density view for full 30-day snapshot"
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  densityMode === 'compact' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => setDensityMode('guests')}
                title="Guest roster view"
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  densityMode === 'guests' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Guests
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 30-DAY OCCUPANCY & BOOKING STATUS KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            30-Day Avg. Occupancy
          </div>
          <div className="text-xl font-heading font-black text-slate-900 mt-0.5">
            {monthlyMetrics.occupancyPercent}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-teal-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${monthlyMetrics.occupancyPercent}%` }} 
            />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Confirmed Beds</span>
          </div>
          <div className="text-xl font-heading font-black text-sky-950 mt-0.5">
            {monthlyMetrics.confirmedBedNights}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Booked bed-nights
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span>In-House Beds</span>
          </div>
          <div className="text-xl font-heading font-black text-indigo-950 mt-0.5">
            {monthlyMetrics.checkedInBedNights}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Checked-in active
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Pending Beds</span>
          </div>
          <div className="text-xl font-heading font-black text-amber-950 mt-0.5">
            {monthlyMetrics.pendingBedNights}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Awaiting payment
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Available Beds</span>
          </div>
          <div className="text-xl font-heading font-black text-emerald-950 mt-0.5">
            {monthlyMetrics.availableBedNights}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Free to sell
          </div>
        </div>
      </div>

      {/* 4. 30-DAY MONTHLY MATRIX TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] relative scrollbar-thin">
          <table className="w-full text-xs border-collapse min-w-[1350px]">
            <thead className="sticky top-0 z-30">
              <tr className="bg-slate-900 text-white select-none">
                {/* Fixed Room Title Column */}
                <th className="py-3 px-4 text-left font-bold w-52 sticky left-0 bg-slate-900 z-40 shadow-md border-r border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-300">Room / Bed</span>
                    <span className="text-[10px] text-teal-300 font-bold">Cap</span>
                  </div>
                </th>

                {/* 30 Day Columns */}
                {dateList.map((d) => {
                  const isCurrentDay = d === today;
                  const dateObj = new Date(d + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
                  const dayNum = dateObj.getDate();
                  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  const dayOfWeekNum = dateObj.getDay();
                  const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6;

                  return (
                    <th
                      key={d}
                      className={`py-2 px-1 text-center font-semibold border-l border-slate-800 transition-colors w-12 min-w-[46px] ${
                        isCurrentDay
                          ? 'bg-teal-700 text-white ring-1 ring-teal-400'
                          : isWeekend
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-900'
                      }`}
                    >
                      <div className="text-[9px] uppercase font-bold opacity-70">
                        {dayName}
                      </div>
                      <div className={`text-xs font-black leading-tight ${isCurrentDay ? 'text-teal-200 scale-110' : 'text-slate-100'}`}>
                        {dayNum}
                      </div>
                      <div className="text-[8px] uppercase tracking-tighter opacity-60">
                        {monthName}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={dateList.length + 1} className="py-12 text-center text-slate-400">
                    No rooms found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const isDorm = room.type.startsWith('dorm');

                  return (
                    <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Sticky Room Info Cell */}
                      <td className="py-2.5 px-4 font-bold text-slate-900 sticky left-0 bg-white shadow-2xs z-20 border-r border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[140px] font-extrabold text-xs text-slate-900" title={room.name}>
                            {room.name}
                          </span>
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {room.capacity} {isDorm ? 'b' : 'p'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center justify-between">
                          <span className="capitalize text-slate-400">{room.typeLabel}</span>
                          <span className="font-bold text-slate-700">{currencySymbol}{room.pricePerNight}</span>
                        </div>
                      </td>

                      {/* 30 Day Slots */}
                      {dateList.map((dateStr) => {
                        const statusData = getCellStatusData(room, dateStr);
                        const { avail, dayBookings, primaryStatus } = statusData;
                        const isTodayCell = dateStr === today;
                        const isSelected = selectedCell?.room.id === room.id && selectedCell?.date === dateStr;

                        // Check status filter
                        let matchesFilter = true;
                        if (statusFilter === 'available') {
                          matchesFilter = avail.availableBeds > 0;
                        } else if (statusFilter === 'confirmed') {
                          matchesFilter = statusData.hasConfirmed;
                        } else if (statusFilter === 'checked_in') {
                          matchesFilter = statusData.hasCheckedIn;
                        } else if (statusFilter === 'pending') {
                          matchesFilter = statusData.hasPending;
                        } else if (statusFilter === 'checked_out') {
                          matchesFilter = statusData.hasCheckedOut;
                        }

                        const colorStyles = getStatusColorClasses(primaryStatus);
                        const isFull = avail.availableBeds === 0;

                        // Determine cell content by density mode
                        let cellContent: React.ReactNode = null;

                        if (densityMode === 'compact') {
                          // Clean compact block
                          cellContent = (
                            <div className="w-full h-8 flex items-center justify-center">
                              <span
                                className={`w-3.5 h-3.5 rounded-md shadow-2xs transition-transform hover:scale-125 ${
                                  isFull
                                    ? primaryStatus === 'checked_in'
                                      ? 'bg-indigo-600'
                                      : primaryStatus === 'confirmed'
                                      ? 'bg-sky-500'
                                      : primaryStatus === 'pending'
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                    : avail.availableBeds < room.capacity
                                    ? 'bg-teal-500 ring-2 ring-teal-200'
                                    : 'bg-emerald-500'
                                }`}
                                title={`${room.name} on ${dateStr}: ${avail.availableBeds} beds free`}
                              />
                            </div>
                          );
                        } else if (densityMode === 'guests') {
                          // Guest name mode
                          if (dayBookings.length === 0) {
                            cellContent = (
                              <span className="text-[10px] text-emerald-700 font-semibold">Free</span>
                            );
                          } else if (dayBookings.length === 1) {
                            cellContent = (
                              <div className="truncate text-[10px] font-bold text-slate-800 max-w-[42px]">
                                {dayBookings[0].guest.firstName}
                              </div>
                            );
                          } else {
                            cellContent = (
                              <div className="text-[10px] font-extrabold text-slate-800">
                                {dayBookings.length}g
                              </div>
                            );
                          }
                        } else {
                          // Standard Mode: Pill with status code or bed ratio
                          if (isDorm) {
                            cellContent = (
                              <div className="flex flex-col items-center justify-center leading-tight">
                                <span className={`text-[10px] font-black ${
                                  isFull ? 'text-rose-700' : 'text-emerald-800'
                                }`}>
                                  {isFull ? 'Full' : `${avail.availableBeds}/${room.capacity}`}
                                </span>
                                {dayBookings.length > 0 && (
                                  <div className="flex items-center gap-0.5 mt-0.5">
                                    {statusData.hasCheckedIn && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" title="Checked In" />}
                                    {statusData.hasConfirmed && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Confirmed" />}
                                    {statusData.hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Pending" />}
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            // Private Room
                            if (dayBookings.length === 0) {
                              cellContent = (
                                <span className="text-[10px] font-bold text-emerald-800">Free</span>
                              );
                            } else {
                              const b = dayBookings[0];
                              cellContent = (
                                <div className="truncate text-[9px] font-black max-w-[42px] leading-tight">
                                  {b.status === 'checked_in' && <span className="text-indigo-800">In</span>}
                                  {b.status === 'confirmed' && <span className="text-sky-800">Conf</span>}
                                  {b.status === 'pending' && <span className="text-amber-800">Pend</span>}
                                  {b.status === 'checked_out' && <span className="text-slate-700">Out</span>}
                                </div>
                              );
                            }
                          }
                        }

                        return (
                          <td
                            key={dateStr}
                            onClick={() => setSelectedCell({ room, date: dateStr })}
                            className={`p-1 text-center border-l border-slate-100 cursor-pointer transition-all relative select-none ${
                              !matchesFilter ? 'opacity-25' : ''
                            } ${
                              isSelected
                                ? 'bg-teal-100 ring-2 ring-teal-600 ring-inset z-10'
                                : isTodayCell
                                ? 'ring-1 ring-teal-500 ring-inset'
                                : ''
                            }`}
                          >
                            <div
                              className={`py-1 px-0.5 rounded-lg border flex items-center justify-center transition-transform active:scale-95 ${colorStyles.cellBg}`}
                              title={`${room.name} • ${formatShortDate(dateStr)} • ${colorStyles.label} (${avail.availableBeds} beds available)`}
                            >
                              {cellContent}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Showing 30 Consecutive Days:</span>
            <span>{formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-teal-700 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Click any date cell to view reservation card or quick-book a walk-in</span>
            </span>
          </div>
        </div>
      </div>

      {/* 5. SLIDE-OVER / MODAL INSPECTOR FOR SELECTED CELL */}
      <AnimatePresence>
        {activeInspectorData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                      Room Availability Inspector
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                      {formatDisplayDate(activeInspectorData.date)}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-heading font-black text-white mt-1">
                    {activeInspectorData.room.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeInspectorData.room.typeLabel} • {activeInspectorData.room.capacity} beds capacity • {currencySymbol}{activeInspectorData.room.pricePerNight} / night
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Availability Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Available Beds</span>
                    <p className={`text-xl font-heading font-black mt-0.5 ${
                      activeInspectorData.avail.availableBeds > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {activeInspectorData.avail.availableBeds} / {activeInspectorData.room.capacity}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Day Load</span>
                    <p className="text-xl font-heading font-black text-slate-900 mt-0.5">
                      {activeInspectorData.avail.occupancyPercent}%
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                    <p className="text-xs font-bold text-teal-800 mt-1.5 capitalize">
                      {activeInspectorData.primaryStatus.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Bookings Active on this Date */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-600" />
                      <span>Reservations on this Date ({activeInspectorData.dayBookings.length})</span>
                    </h4>
                  </div>

                  {activeInspectorData.dayBookings.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 text-center text-emerald-800 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold">This space is fully available for reservations on this date!</p>
                      <p className="text-[11px] text-emerald-700">No active bookings recorded for {formatShortDate(activeInspectorData.date)}.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {activeInspectorData.dayBookings.map((booking) => {
                        const statusColor = getStatusColorClasses(booking.status);
                        const waUrl = settings?.whatsappReceptionNumber 
                          ? createWhatsAppUrl(booking.guest.phone, `Hi ${booking.guest.firstName}, regarding your stay at ${settings.name} (Ref: ${booking.referenceNumber})...`) 
                          : '';

                        return (
                          <div
                            key={booking.id}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 shadow-2xs transition-all space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{booking.guest.firstName} {booking.guest.lastName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({booking.referenceNumber})</span>
                                </span>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {formatShortDate(booking.checkInDate)} → {formatShortDate(booking.checkOutDate)} ({booking.nights} nights) • {booking.guestsCount} guests
                                </div>
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusColor.badgeBg}`}>
                                {statusColor.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                              <span className="font-semibold text-slate-600">
                                {currencySymbol}{booking.totalAmount.toFixed(0)} ({booking.paymentStatus})
                              </span>

                              <div className="flex items-center gap-1.5">
                                {waUrl && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1 text-[10px] font-bold"
                                    title="Open WhatsApp chat"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBooking(booking);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 text-[10px] font-bold"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-200">
                  {activeInspectorData.avail.availableBeds > 0 ? (
                    <button
                      type="button"
                      id="inspector-quick-book-btn"
                      onClick={() => {
                        const { room, date } = activeInspectorData;
                        setSelectedCell(null);
                        onBookSlot?.(room.id, date);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Quick Book Walk-In on {formatShortDate(activeInspectorData.date)}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="inspector-waitlist-btn"
                      onClick={() => {
                        const { room, date } = activeInspectorData;
                        setSelectedCell(null);
                        onAddToWaitlist?.(room.id, date);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Add to Standby Waitlist</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedCell(null)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. BOOKING EDIT MODAL */}
      {editingBooking && (
        <BookingEditModal
          booking={editingBooking}
          rooms={rooms}
          addOns={addOns}
          currencySymbol={currencySymbol}
          onSave={(updated) => {
            onUpdateBooking?.(updated);
            setEditingBooking(null);
          }}
          onClose={() => setEditingBooking(null)}
        />
      )}
    </div>
  );
};
