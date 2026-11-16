import React, { useState, useMemo } from 'react';
import {
  Bed,
  Users,
  Heart,
  Crown,
  Key,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  Wrench,
  X
} from 'lucide-react';
import { Booking, Room, RoomType } from '../../types';
import { calculateRoomAvailability } from '../../utils/availability';
import { addDaysToString, formatDisplayDate, getTodayString } from '../../utils/date';

export interface RoomTypeCapacityMeterProps {
  rooms: Room[];
  bookings: Booking[];
  selectedTypeFilter?: string | null;
  onSelectTypeFilter?: (roomType: string | null) => void;
  currencySymbol?: string;
  onSelectRoom?: (roomId: string) => void;
}

export interface RoomTypeStats {
  typeKey: string;
  label: string;
  rooms: Room[];
  totalRooms: number;
  totalBeds: number;
  bookedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  occupancyPercent: number;
  activeBookingsCount: number;
  activeBookings: {
    booking: Booking;
    roomName: string;
    bedsCount: number;
  }[];
  roomsBreakdown: {
    room: Room;
    bookedBeds: number;
    availableBeds: number;
    occupancyPercent: number;
    isMaintenance: boolean;
    isInactive: boolean;
  }[];
}

// Icon & Accent styling helper per room type
function getRoomTypeVisuals(typeKey: string) {
  switch (typeKey) {
    case 'dorm_mixed':
      return {
        icon: Users,
        label: 'Mixed Surf Dorm',
        accentBg: 'bg-teal-50',
        accentText: 'text-teal-700',
        border: 'border-teal-200',
        barColor: 'from-teal-500 to-cyan-500',
        badgeBg: 'bg-teal-100 text-teal-800',
      };
    case 'dorm_female':
      return {
        icon: Heart,
        label: 'Female-Only Dorm',
        accentBg: 'bg-rose-50',
        accentText: 'text-rose-700',
        border: 'border-rose-200',
        barColor: 'from-pink-500 to-rose-500',
        badgeBg: 'bg-rose-100 text-rose-800',
      };
    case 'private_double':
      return {
        icon: Key,
        label: 'Private Double Room',
        accentBg: 'bg-indigo-50',
        accentText: 'text-indigo-700',
        border: 'border-indigo-200',
        barColor: 'from-indigo-500 to-blue-500',
        badgeBg: 'bg-indigo-100 text-indigo-800',
      };
    case 'private_suite':
      return {
        icon: Crown,
        label: 'Deluxe Suite',
        accentBg: 'bg-amber-50',
        accentText: 'text-amber-800',
        border: 'border-amber-200',
        barColor: 'from-amber-500 to-orange-500',
        badgeBg: 'bg-amber-100 text-amber-900',
      };
    default:
      return {
        icon: Bed,
        label: typeKey.replace('_', ' ').toUpperCase(),
        accentBg: 'bg-slate-50',
        accentText: 'text-slate-700',
        border: 'border-slate-200',
        barColor: 'from-slate-600 to-teal-600',
        badgeBg: 'bg-slate-100 text-slate-800',
      };
  }
}

export const RoomTypeCapacityMeter: React.FC<RoomTypeCapacityMeterProps> = ({
  rooms,
  bookings,
  selectedTypeFilter = null,
  onSelectTypeFilter,
  currencySymbol = '€',
  onSelectRoom,
}) => {
  // Target date for active bookings calculation (defaults to today)
  const [targetDate, setTargetDate] = useState<string>(getTodayString());
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [includePending, setIncludePending] = useState<boolean>(false);

  const nextDay = useMemo(() => addDaysToString(targetDate, 1), [targetDate]);

  // Quick Date Shortcut buttons
  const todayStr = getTodayString();
  const tomorrowStr = addDaysToString(todayStr, 1);
  const in3DaysStr = addDaysToString(todayStr, 3);
  const in7DaysStr = addDaysToString(todayStr, 7);

  // Group rooms and compute occupancy by room type
  const roomTypeStatsList: RoomTypeStats[] = useMemo(() => {
    // Collect unique types from rooms list to preserve user-added room types
    const typeMap = new Map<string, Room[]>();
    rooms.forEach((r) => {
      const typeKey = r.type;
      if (!typeMap.has(typeKey)) {
        typeMap.set(typeKey, []);
      }
      typeMap.get(typeKey)!.push(r);
    });

    const stats: RoomTypeStats[] = [];

    typeMap.forEach((roomsOfType, typeKey) => {
      let totalBeds = 0;
      let totalBookedBeds = 0;
      let totalMaintenanceBeds = 0;
      const roomsBreakdown: RoomTypeStats['roomsBreakdown'] = [];
      const activeBookingsOfType: RoomTypeStats['activeBookings'] = [];
      const seenBookingIds = new Set<string>();

      // Label from first room's typeLabel or fallback
      const typeLabel = roomsOfType[0]?.typeLabel || getRoomTypeVisuals(typeKey).label;

      roomsOfType.forEach((room) => {
        totalBeds += room.capacity;

        // Calculate availability on target date
        const avail = calculateRoomAvailability(room, targetDate, nextDay, bookings);

        if (avail.isMaintenance || avail.isInactive) {
          totalMaintenanceBeds += room.capacity;
        } else {
          totalBookedBeds += avail.bookedBeds;
        }

        roomsBreakdown.push({
          room,
          bookedBeds: avail.bookedBeds,
          availableBeds: avail.availableBeds,
          occupancyPercent: avail.occupancyPercent,
          isMaintenance: avail.isMaintenance,
          isInactive: avail.isInactive,
        });

        // Find active bookings in this room for target date
        const roomBookings = bookings.filter((b) => {
          if (b.roomId !== room.id) return false;
          if (b.status === 'cancelled') return false;
          if (!includePending && b.status === 'pending') return false;
          // Active if checkIn <= targetDate < checkOut
          return b.checkInDate <= targetDate && targetDate < b.checkOutDate;
        });

        roomBookings.forEach((b) => {
          if (!seenBookingIds.has(b.id)) {
            seenBookingIds.add(b.id);
            const bedsCount = room.type.startsWith('private') ? room.capacity : (b.guestsCount || 1);
            activeBookingsOfType.push({
              booking: b,
              roomName: room.name,
              bedsCount,
            });
          }
        });
      });

      const effectiveTotalBeds = Math.max(0, totalBeds - totalMaintenanceBeds);
      const occupancyPercent =
        effectiveTotalBeds > 0
          ? Math.min(100, Math.round((totalBookedBeds / effectiveTotalBeds) * 100))
          : totalMaintenanceBeds > 0
          ? 100
          : 0;

      const availableBeds = Math.max(0, effectiveTotalBeds - totalBookedBeds);

      stats.push({
        typeKey,
        label: typeLabel,
        rooms: roomsOfType,
        totalRooms: roomsOfType.length,
        totalBeds,
        bookedBeds: totalBookedBeds,
        availableBeds,
        maintenanceBeds: totalMaintenanceBeds,
        occupancyPercent,
        activeBookingsCount: activeBookingsOfType.length,
        activeBookings: activeBookingsOfType,
        roomsBreakdown,
      });
    });

    // Sort: highest occupancy or dorms first
    return stats.sort((a, b) => b.occupancyPercent - a.occupancyPercent);
  }, [rooms, bookings, targetDate, nextDay, includePending]);

  // Overall totals across all room types
  const totals = useMemo(() => {
    const totalBeds = roomTypeStatsList.reduce((acc, s) => acc + s.totalBeds, 0);
    const bookedBeds = roomTypeStatsList.reduce((acc, s) => acc + s.bookedBeds, 0);
    const availableBeds = roomTypeStatsList.reduce((acc, s) => acc + s.availableBeds, 0);
    const activeBookings = roomTypeStatsList.reduce((acc, s) => acc + s.activeBookingsCount, 0);
    const overallPercent = totalBeds > 0 ? Math.round((bookedBeds / totalBeds) * 100) : 0;

    return {
      totalBeds,
      bookedBeds,
      availableBeds,
      activeBookings,
      overallPercent,
    };
  }, [roomTypeStatsList]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Top Header & Date / Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center font-bold shadow-sm shadow-teal-500/25 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-heading font-extrabold text-base text-slate-900">
                Room Type Capacity Meters
              </h4>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {roomTypeStatsList.length} Categories
              </span>
              {selectedTypeFilter && (
                <button
                  type="button"
                  onClick={() => onSelectTypeFilter?.(null)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1 transition-colors"
                  title="Clear room type filter"
                >
                  <span>Filtering: {getRoomTypeVisuals(selectedTypeFilter).label}</span>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live capacity and occupancy calculated per room category based on active bookings vs. total beds
            </p>
          </div>
        </div>

        {/* Date Selector & Scope Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Preset Date Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setTargetDate(todayStr)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                targetDate === todayStr
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setTargetDate(tomorrowStr)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                targetDate === tomorrowStr
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setTargetDate(in3DaysStr)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                targetDate === in3DaysStr
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={() => setTargetDate(in7DaysStr)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                targetDate === in7DaysStr
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next Week
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => e.target.value && setTargetDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Include Pending Toggle */}
          <button
            type="button"
            onClick={() => setIncludePending(!includePending)}
            className={`px-2.5 py-1 rounded-xl font-bold border transition-all text-[11px] flex items-center gap-1 ${
              includePending
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Include pending/tentative holds in occupancy calculation"
          >
            <span className={`w-2 h-2 rounded-full ${includePending ? 'bg-amber-500' : 'bg-slate-300'}`} />
            <span>Include Pending Holds</span>
          </button>
        </div>
      </div>

      {/* Capacity Overview Bar - All Room Types Side-by-Side Comparison */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Category Occupancy Distribution ({formatDisplayDate(targetDate)})</span>
          </span>
          <span className="text-slate-500 text-[11px]">
            <span className="font-bold text-slate-900">{totals.bookedBeds}</span> of{' '}
            <span className="font-bold text-slate-900">{totals.totalBeds} total beds</span> occupied (
            <span className="font-extrabold text-teal-700">{totals.overallPercent}%</span>)
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
          {roomTypeStatsList.map((stat) => {
            if (stat.totalBeds === 0) return null;
            const visual = getRoomTypeVisuals(stat.typeKey);
            const widthPct = (stat.bookedBeds / totals.totalBeds) * 100;
            if (widthPct === 0) return null;

            return (
              <div
                key={stat.typeKey}
                style={{ width: `${widthPct}%` }}
                className={`h-full bg-gradient-to-r ${visual.barColor} transition-all duration-500 relative group cursor-pointer`}
                onClick={() => onSelectTypeFilter?.(stat.typeKey)}
                title={`${stat.label}: ${stat.bookedBeds} of ${stat.totalBeds} beds (${stat.occupancyPercent}%)`}
              />
            );
          })}
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-3 flex-wrap mt-3 text-[11px]">
          {roomTypeStatsList.map((stat) => {
            const visual = getRoomTypeVisuals(stat.typeKey);
            const isFilterActive = selectedTypeFilter === stat.typeKey;

            return (
              <button
                key={stat.typeKey}
                type="button"
                onClick={() => onSelectTypeFilter?.(isFilterActive ? null : stat.typeKey)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all ${
                  isFilterActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 font-medium'
                }`}
              >
                <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${visual.barColor}`} />
                <span>{stat.label}:</span>
                <span className="font-bold">{stat.occupancyPercent}%</span>
                <span className="text-[10px] text-slate-400">({stat.bookedBeds}/{stat.totalBeds})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Room Type Capacity Meter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roomTypeStatsList.map((stat) => {
          const visual = getRoomTypeVisuals(stat.typeKey);
          const Icon = visual.icon;
          const isFilterActive = selectedTypeFilter === stat.typeKey;
          const isExpanded = expandedType === stat.typeKey;

          // Severity styling based on occupancy
          const isFull = stat.occupancyPercent >= 100;
          const isHigh = stat.occupancyPercent >= 75 && !isFull;
          const isModerate = stat.occupancyPercent >= 40 && stat.occupancyPercent < 75;
          const isLow = stat.occupancyPercent < 40 && stat.availableBeds > 0;

          return (
            <div
              key={stat.typeKey}
              id={`capacity-meter-${stat.typeKey}`}
              className={`rounded-2xl border bg-white p-4 transition-all duration-300 flex flex-col justify-between relative shadow-xs hover:shadow-md ${
                isFilterActive
                  ? 'ring-2 ring-teal-500 border-teal-300 bg-teal-50/10'
                  : 'border-slate-200/90'
              }`}
            >
              <div>
                {/* Header: Icon, Type Name, Room Units count */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl ${visual.accentBg} ${visual.accentText} border ${visual.border} flex items-center justify-center font-bold shrink-0 shadow-2xs`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                        {stat.label}
                      </h5>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {stat.totalRooms} {stat.totalRooms === 1 ? 'room unit' : 'room units'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                      isFull
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : isHigh
                        ? 'bg-amber-100 text-amber-800'
                        : isModerate
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {isFull ? (
                      <>
                        <Flame className="w-2.5 h-2.5 text-rose-600" />
                        <span>Full House</span>
                      </>
                    ) : isHigh ? (
                      <span>High Demand</span>
                    ) : isModerate ? (
                      <span>Moderate</span>
                    ) : (
                      <span>Open Beds</span>
                    )}
                  </span>
                </div>

                {/* Primary Metric: Big Percentage & Bed Ratio */}
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading font-extrabold text-2xl text-slate-900">
                      {stat.occupancyPercent}%
                    </span>
                    <span className="text-xs text-slate-500 font-medium">occupied</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-800">
                      {stat.bookedBeds} / {stat.totalBeds}
                    </span>
                    <span className="text-[10px] text-slate-400 block">beds booked</span>
                  </div>
                </div>

                {/* Visual Capacity Meter Bar */}
                <div className="space-y-1.5 mb-3">
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-600 ${
                        isFull
                          ? 'bg-gradient-to-r from-rose-500 to-red-600'
                          : isHigh
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : isModerate
                          ? 'bg-gradient-to-r from-teal-500 to-amber-500'
                          : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      }`}
                      style={{
                        width: `${Math.max(stat.occupancyPercent, stat.bookedBeds > 0 ? 6 : 0)}%`,
                      }}
                    />
                  </div>

                  {/* Bed Segments Indicator Visual Meter (Individual Bed Blocks) */}
                  <div className="flex items-center gap-0.5 overflow-hidden">
                    {Array.from({ length: Math.min(stat.totalBeds, 24) }).map((_, idx) => {
                      const isBooked = idx < stat.bookedBeds;
                      return (
                        <div
                          key={idx}
                          title={`Bed #${idx + 1}: ${isBooked ? 'Booked' : 'Available'}`}
                          className={`h-1.5 flex-1 rounded-xs transition-all ${
                            isBooked
                              ? isFull
                                ? 'bg-rose-500'
                                : isHigh
                                ? 'bg-amber-500'
                                : 'bg-teal-600'
                              : 'bg-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Bed Availability Readout */}
                <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100 text-slate-600">
                  <span className="flex items-center gap-1 font-semibold text-[11px]">
                    <Bed className="w-3.5 h-3.5 text-slate-400" />
                    <span>Free Capacity:</span>
                  </span>
                  <span
                    className={`font-extrabold text-xs ${
                      stat.availableBeds === 0
                        ? 'text-rose-600'
                        : stat.availableBeds <= 2
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {stat.availableBeds === 0 ? '0 beds (Full)' : `${stat.availableBeds} beds free`}
                  </span>
                </div>

                {/* Active Bookings count for target date */}
                <div className="flex items-center justify-between text-[11px] py-1 text-slate-500">
                  <span>Active Stays Today:</span>
                  <span className="font-bold text-slate-800">
                    {stat.activeBookingsCount} {stat.activeBookingsCount === 1 ? 'guest stay' : 'guest stays'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Filter rooms below & Expand details */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onSelectTypeFilter?.(isFilterActive ? null : stat.typeKey)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 ${
                    isFilterActive
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={`Filter rooms inventory below to ${stat.label}`}
                >
                  <Filter className="w-3 h-3" />
                  <span>{isFilterActive ? 'Active Filter' : 'Filter Units'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedType(isExpanded ? null : stat.typeKey)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-0.5 transition-colors p-1"
                  title="View active guests and room unit breakdown"
                >
                  <span>{isExpanded ? 'Hide' : 'Details'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expandable Breakdown Drawer */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in slide-in-from-top-2 text-xs">
                  {/* Room Units List */}
                  <div>
                    <h6 className="font-bold text-[11px] text-slate-700 uppercase tracking-wider mb-1.5">
                      Included Room Units ({stat.roomsBreakdown.length})
                    </h6>
                    <div className="space-y-1.5">
                      {stat.roomsBreakdown.map((r) => (
                        <div
                          key={r.room.id}
                          onClick={() => onSelectRoom?.(r.room.id)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {r.room.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {currencySymbol}{r.room.pricePerNight}/night • Cap: {r.room.capacity} beds
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-slate-800 text-[11px]">
                              {r.bookedBeds}/{r.room.capacity}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({r.occupancyPercent}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Bookings List */}
                  {stat.activeBookings.length > 0 && (
                    <div>
                      <h6 className="font-bold text-[11px] text-slate-700 uppercase tracking-wider mb-1.5">
                        Active Guests ({stat.activeBookings.length})
                      </h6>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {stat.activeBookings.map(({ booking: b, roomName, bedsCount }) => (
                          <div
                            key={b.id}
                            className="p-2 rounded-xl bg-teal-50/50 border border-teal-200/60 text-[11px] space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-900 truncate">
                                {b.guest.firstName} {b.guest.lastName}
                              </span>
                              <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded">
                                {bedsCount} {bedsCount === 1 ? 'bed' : 'beds'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-500 text-[10px]">
                              <span className="truncate">{roomName}</span>
                              <span className="shrink-0">{b.checkInDate} → {b.checkOutDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
