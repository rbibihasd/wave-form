import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Bed, Users, Calendar as CalendarIcon, 
  Search, Filter, Eye, Plus, MessageCircle, Edit, CheckCircle, 
  AlertTriangle, X, TrendingUp, Sparkles, RefreshCw, Clock
} from 'lucide-react';
import { Booking, HostelSettings, Room, SurfAddOn, WaitlistEntry } from '../../types';
import { addDaysToString, formatDisplayDate, formatShortDate, getTodayString } from '../../utils/date';
import { calculateRoomAvailability } from '../../utils/availability';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { BookingEditModal } from './BookingEditModal';

interface CalendarGridProps {
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

type DisplayMetricMode = 'beds' | 'percent' | 'guests';
type RoomCategoryFilter = 'all' | 'dorm_mixed' | 'dorm_female' | 'private';
type RangeDaysOption = 7 | 14 | 21 | 28 | 30;

export const CalendarGrid: React.FC<CalendarGridProps> = ({ 
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

  // State Controls
  const [startDate, setStartDate] = useState<string>(today);
  const [daysToShow, setDaysToShow] = useState<RangeDaysOption>(14);
  const [displayMode, setDisplayMode] = useState<DisplayMetricMode>('beds');
  const [categoryFilter, setCategoryFilter] = useState<RoomCategoryFilter>('all');
  const [roomSearch, setRoomSearch] = useState<string>('');
  const [availabilityOnly, setAvailabilityOnly] = useState<boolean>(false);

  // Inspector & Edit states
  const [selectedCell, setSelectedCell] = useState<{ room: Room; date: string } | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Generate dynamic date array
  const dateList: string[] = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < daysToShow; i++) {
      list.push(addDaysToString(startDate, i));
    }
    return list;
  }, [startDate, daysToShow]);

  // Navigation handlers
  const handlePrev = () => {
    setStartDate((prev) => addDaysToString(prev, -daysToShow));
  };

  const handleNext = () => {
    setStartDate((prev) => addDaysToString(prev, daysToShow));
  };

  const handleToday = () => {
    setStartDate(today);
  };

  const handleJumpToWeekend = () => {
    // Jump to the upcoming Friday
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 5 = Fri
    let daysUntilFriday = (5 - currentDayOfWeek + 7) % 7;
    if (daysUntilFriday === 0) daysUntilFriday = 7;
    setStartDate(addDaysToString(today, daysUntilFriday));
  };

  const handleJumpPlusMonth = () => {
    setStartDate((prev) => addDaysToString(prev, 30));
  };

  // Filtered rooms based on controls
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Search filter
      if (roomSearch.trim() && !room.name.toLowerCase().includes(roomSearch.toLowerCase())) {
        return false;
      }

      // Category filter
      if (categoryFilter === 'dorm_mixed' && room.type !== 'dorm_mixed') return false;
      if (categoryFilter === 'dorm_female' && room.type !== 'dorm_female') return false;
      if (categoryFilter === 'private' && !room.type.startsWith('private')) return false;

      // Availability filter: must have at least one open slot in the selected date range
      if (availabilityOnly) {
        const hasOpenSlot = dateList.some((d) => {
          const nextD = addDaysToString(d, 1);
          const av = calculateRoomAvailability(room, d, nextD, bookings);
          return av.availableBeds > 0;
        });
        if (!hasOpenSlot) return false;
      }

      return true;
    });
  }, [rooms, roomSearch, categoryFilter, availabilityOnly, dateList, bookings]);

  // Summary Metrics across the selected window
  const windowMetrics = useMemo(() => {
    let totalBedNightsCapacity = 0;
    let totalBedNightsBooked = 0;
    const dailyOccupancyMap: Record<string, { booked: number; capacity: number }> = {};

    dateList.forEach((d) => {
      dailyOccupancyMap[d] = { booked: 0, capacity: 0 };
    });

    rooms.forEach((room) => {
      if (!room.isActive) return;
      dateList.forEach((d) => {
        const nextD = addDaysToString(d, 1);
        const av = calculateRoomAvailability(room, d, nextD, bookings);
        totalBedNightsCapacity += room.capacity;
        totalBedNightsBooked += av.bookedBeds;

        dailyOccupancyMap[d].booked += av.bookedBeds;
        dailyOccupancyMap[d].capacity += room.capacity;
      });
    });

    const averageOccupancy =
      totalBedNightsCapacity > 0
        ? Math.round((totalBedNightsBooked / totalBedNightsCapacity) * 100)
        : 0;

    // Find peak occupancy day
    let peakDay = dateList[0];
    let peakPercent = 0;

    Object.entries(dailyOccupancyMap).forEach(([dateStr, stats]) => {
      const pct = stats.capacity > 0 ? (stats.booked / stats.capacity) * 100 : 0;
      if (pct > peakPercent) {
        peakPercent = pct;
        peakDay = dateStr;
      }
    });

    return {
      averageOccupancy,
      totalBedNightsCapacity,
      totalBedNightsBooked,
      peakDay,
      peakPercent: Math.round(peakPercent),
    };
  }, [rooms, dateList, bookings]);

  // Find bookings active on selected cell for inspector
  const activeBookingsForSelectedCell = useMemo(() => {
    if (!selectedCell) return [];
    const { room, date } = selectedCell;

    return bookings.filter(
      (b) =>
        b.roomId === room.id &&
        b.status !== 'cancelled' &&
        date >= b.checkInDate &&
        date < b.checkOutDate
    );
  }, [selectedCell, bookings]);

  return (
    <div className="space-y-4">
      {/* 1. PRIMARY TIMELINE & DATE CONTROLS BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header Title & Date Range Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-200/60 shrink-0">
              <CalendarIcon className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-extrabold text-base text-slate-900">
                  Occupancy & Availability Grid
                </h3>
                <span className="text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full">
                  {daysToShow}-Day Timeline
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Window: <span className="font-bold text-slate-800">{formatShortDate(startDate)}</span> through <span className="font-bold text-slate-800">{formatShortDate(dateList[dateList.length - 1])}</span>
              </p>
            </div>
          </div>

          {/* Date Step Navigators & Direct Date Picker Control */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Start Date Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">From:</span>
              <input
                id="grid-start-date-picker"
                type="date"
                value={startDate}
                onChange={(e) => {
                  if (e.target.value) setStartDate(e.target.value);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Quick Jumps */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={handleToday}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  startDate === today ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleJumpToWeekend}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors"
                title="Jump to the upcoming Friday"
              >
                Weekend
              </button>
              <button
                type="button"
                onClick={handleJumpPlusMonth}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors"
                title="Jump forward +30 days"
              >
                +30d
              </button>
            </div>

            {/* Arrow Navigators */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                title={`Previous ${daysToShow} days`}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                title={`Next ${daysToShow} days`}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. SECONDARY CONTROLS: WINDOW SIZE, METRIC DISPLAY MODE & FILTERS */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Left: Window Length & Display Mode Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Window Horizon Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5">View:</span>
              {([7, 14, 21, 28, 30] as RangeDaysOption[]).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDaysToShow(days)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    daysToShow === days
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            {/* Metric Display Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5">Show:</span>
              {[
                { id: 'beds', label: 'Beds Ratio' },
                { id: 'percent', label: 'Occupancy %' },
                { id: 'guests', label: 'Guest Roster' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setDisplayMode(m.id as DisplayMetricMode)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    displayMode === m.id
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Search & Room Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter room name..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 w-36 sm:w-44"
              />
              {roomSearch && (
                <button
                  type="button"
                  onClick={() => setRoomSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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

            {/* Only Available Toggle */}
            <button
              type="button"
              onClick={() => setAvailabilityOnly(!availabilityOnly)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                availabilityOnly
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle className={`w-3.5 h-3.5 ${availabilityOnly ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Free Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ROLLING WINDOW STATS & PERFORMANCE STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Window Avg. Occupancy
          </div>
          <div className="text-xl font-heading font-black text-slate-900 mt-0.5">
            {windowMetrics.averageOccupancy}%
          </div>
          <div className="text-[10px] text-teal-600 font-semibold mt-0.5">
            Across {daysToShow} selected days
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Bed-Nights Booked
          </div>
          <div className="text-xl font-heading font-black text-slate-900 mt-0.5">
            {windowMetrics.totalBedNightsBooked} <span className="text-xs font-normal text-slate-400">/ {windowMetrics.totalBedNightsCapacity}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Total capacity demand
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Peak Demand Date
          </div>
          <div className="text-xl font-heading font-black text-slate-900 mt-0.5 truncate">
            {formatShortDate(windowMetrics.peakDay)}
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
            {windowMetrics.peakPercent}% hostel load
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Spaces Showing
          </div>
          <div className="text-xl font-heading font-black text-slate-900 mt-0.5">
            {filteredRooms.length} <span className="text-xs font-normal text-slate-400">/ {rooms.length}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Filtered inventory spaces
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE MATRIX TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-900 text-white select-none">
                {/* Fixed Room Title Column */}
                <th className="py-3.5 px-4 text-left font-bold w-52 sticky left-0 bg-slate-900 z-20 shadow-md">
                  <div className="flex items-center justify-between">
                    <span>Room & Category</span>
                    <span className="text-[10px] text-slate-400 font-normal">Cap</span>
                  </div>
                </th>

                {/* Day Columns */}
                {dateList.map((d) => {
                  const isCurrentDay = d === today;
                  const dateObj = new Date(d + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
                  const dayNum = dateObj.getDate();
                  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  const dayOfWeekNum = dateObj.getDay();
                  const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6; // Sunday or Saturday

                  return (
                    <th
                      key={d}
                      className={`py-2 px-1 text-center font-semibold border-l border-slate-800 transition-colors ${
                        isCurrentDay
                          ? 'bg-teal-700/80 text-white'
                          : isWeekend
                          ? 'bg-slate-800/80 text-slate-200'
                          : 'bg-slate-900'
                      }`}
                    >
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                        {dayName}
                      </div>
                      <div className={`text-xs font-extrabold ${isCurrentDay ? 'text-teal-200' : 'text-slate-100'}`}>
                        {dayNum}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">
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
                    No rooms or spaces found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const isDorm = room.type.startsWith('dorm');

                  return (
                    <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Room Info Sticky Cell */}
                      <td className="py-3 px-4 font-bold text-slate-900 sticky left-0 bg-white shadow-2xs z-10 border-r border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[150px] font-extrabold" title={room.name}>
                            {room.name}
                          </span>
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {room.capacity}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5 flex items-center justify-between">
                          <span className="capitalize text-slate-400">{room.typeLabel}</span>
                          <span className="font-semibold text-slate-700">{currencySymbol}{room.pricePerNight}</span>
                        </div>
                      </td>

                      {/* Day Cells */}
                      {dateList.map((dateStr) => {
                        const nextDate = addDaysToString(dateStr, 1);
                        const avail = calculateRoomAvailability(room, dateStr, nextDate, bookings);
                        const isTodayCell = dateStr === today;
                        const isSelected = selectedCell?.room.id === room.id && selectedCell?.date === dateStr;

                        // Find active bookings on this date for cell display
                        const cellBookings = bookings.filter(
                          (b) =>
                            b.roomId === room.id &&
                            b.status !== 'cancelled' &&
                            dateStr >= b.checkInDate &&
                            dateStr < b.checkOutDate
                        );

                        const free = avail.availableBeds;
                        const isFull = free === 0;
                        const isLow = free <= 2 && free > 0;

                        // Determine cell content by Display Mode
                        let cellLabel = '';
                        if (displayMode === 'beds') {
                          cellLabel = isDorm
                            ? free === 0 ? 'Full' : `${free}/${room.capacity}`
                            : !avail.isAvailable ? 'Booked' : 'Free';
                        } else if (displayMode === 'percent') {
                          cellLabel = `${avail.occupancyPercent}%`;
                        } else {
                          // Guests mode
                          if (cellBookings.length === 0) {
                            cellLabel = 'Free';
                          } else if (cellBookings.length === 1) {
                            cellLabel = cellBookings[0].guest.firstName.slice(0, 5);
                          } else {
                            cellLabel = `${cellBookings.length} Guests`;
                          }
                        }

                        return (
                          <td
                            key={dateStr}
                            onClick={() => setSelectedCell({ room, date: dateStr })}
                            className={`py-2 px-1 text-center border-l border-slate-100 cursor-pointer transition-all relative ${
                              isSelected
                                ? 'bg-teal-100/70 ring-2 ring-teal-600 ring-inset z-10'
                                : isTodayCell
                                ? 'bg-teal-50/30 hover:bg-teal-100/40'
                                : 'hover:bg-slate-100/70'
                            }`}
                          >
                            <div
                              title={`Click to inspect: ${room.name} on ${dateStr} (${free} beds free)`}
                              className={`py-1.5 px-1 rounded-lg text-[10px] font-extrabold truncate transition-transform active:scale-95 ${
                                isFull
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200/50'
                              }`}
                            >
                              {cellLabel}
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

        {/* Legend & Interactive Hints Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-700">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
              <span>Available Space</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
              <span>Low Availability (≤ 2 beds)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
              <span>Fully Booked</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-teal-700 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Click any date cell to inspect bookings or add reservation</span>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE CELL INSPECTOR DRAWER / MODAL */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  Occupancy & Availability Control
                </span>
                <h3 className="text-base sm:text-lg font-heading font-extrabold text-white">
                  {selectedCell.room.name}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Date: <span className="font-bold text-teal-300">{formatDisplayDate(selectedCell.date)}</span> • {selectedCell.room.typeLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inspector Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Availability Stats Pill Card */}
              {(() => {
                const nextD = addDaysToString(selectedCell.date, 1);
                const av = calculateRoomAvailability(selectedCell.room, selectedCell.date, nextD, bookings);
                const activeQueueForRoom = waitlist.filter(
                  (w) => w.roomId === selectedCell.room.id && (w.status === 'waiting' || w.status === 'notified')
                );

                return (
                  <div className="space-y-2">
                    <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-slate-500">
                          Live Capacity for this Date
                        </div>
                        <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                          {av.availableBeds} of {selectedCell.room.capacity} Beds Free
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {av.bookedBeds} occupied ({av.occupancyPercent}% occupancy)
                        </div>
                      </div>

                      {/* Availability Triggered Action: Direct Reservation or Waitlist Queue */}
                      {av.availableBeds > 0 && onBookSlot ? (
                        <button
                          type="button"
                          onClick={() => {
                            onBookSlot(selectedCell.room.id, selectedCell.date);
                            setSelectedCell(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-teal-600/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Book for This Date</span>
                        </button>
                      ) : (
                        onAddToWaitlist && (
                          <button
                            type="button"
                            id="btn-calendar-add-waitlist"
                            onClick={() => {
                              onAddToWaitlist(selectedCell.room.id, selectedCell.date);
                              setSelectedCell(null);
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-600/20 transition-all"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Add to Waitlist Queue</span>
                          </button>
                        )
                      )}
                    </div>

                    {/* Waitlist Queue Indicator if room has guests waiting */}
                    {activeQueueForRoom.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{activeQueueForRoom.length} guest{activeQueueForRoom.length > 1 ? 's' : ''} in waitlist queue for this room</span>
                        </span>
                        {onViewWaitlist && (
                          <button
                            type="button"
                            onClick={() => {
                              onViewWaitlist(selectedCell.room.id);
                              setSelectedCell(null);
                            }}
                            className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 shrink-0"
                          >
                            View Queue →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Active Guests / Bookings Roster */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading font-extrabold text-sm text-slate-900">
                    Active Guests on this Date ({activeBookingsForSelectedCell.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Hostel Guest Roster
                  </span>
                </div>

                {activeBookingsForSelectedCell.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    No reservations booked in this space on this date.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {activeBookingsForSelectedCell.map((b, idx) => (
                        <motion.div
                          key={b.id}
                          layout
                          variants={{
                            hidden: { opacity: 0, y: 12, scale: 0.98 },
                            visible: (i: number) => ({
                              opacity: 1,
                              y: 0,
                              scale: 1,
                              transition: {
                                delay: i * 0.05,
                                type: 'spring',
                                stiffness: 300,
                                damping: 25,
                              },
                            }),
                            exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
                          }}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          custom={idx}
                          className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:border-teal-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-sm text-slate-900">
                                  {b.guest.firstName} {b.guest.lastName}
                                </h5>
                                <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/60">
                                  #{b.referenceNumber}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Stay: {formatDisplayDate(b.checkInDate)} → {formatDisplayDate(b.checkOutDate)} ({b.nights} nights)
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Phone: {b.guest.phone} • Surf: <span className="capitalize">{b.guest.surfLevel}</span> • Total: {currencySymbol}{b.totalAmount.toFixed(2)}
                              </p>
                            </div>

                            {/* Quick Actions for this guest */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* WhatsApp Direct Chat */}
                              <a
                                href={createWhatsAppUrl(b.guest.phone, `Hello ${b.guest.firstName}! WaveHaven Surf House reception checking in on your reservation #${b.referenceNumber}.`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                title="Open WhatsApp Chat with Guest"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>

                              {/* Edit Booking */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBooking(b);
                                  setSelectedCell(null);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="Modify Reservation"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Edit Modal if triggered from cell inspector */}
      {editingBooking && onUpdateBooking && (
        <BookingEditModal
          booking={editingBooking}
          rooms={rooms}
          addOns={addOns}
          currencySymbol={currencySymbol}
          onSave={(updated) => {
            onUpdateBooking(updated);
            setEditingBooking(null);
          }}
          onClose={() => setEditingBooking(null)}
        />
      )}
    </div>
  );
};
