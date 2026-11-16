import React, { useState, useMemo } from 'react';
import { 
  Calendar, Flame, Sparkles, Filter, ChevronLeft, ChevronRight, 
  Bed, Users, Info, ArrowUpRight, CheckCircle2, AlertTriangle, 
  Maximize2, Minimize2, Eye, Compass, Unlock, UserX, UserMinus, 
  ArrowRightLeft, LogOut, Trash2, Check, X, Plus, RotateCcw, AlertCircle, Phone, Mail
} from 'lucide-react';
import { Booking, Room } from '../../types';
import { addDaysToString, calculateNights, formatDisplayDate, getTodayString } from '../../utils/date';
import { calculateRoomAvailability } from '../../utils/availability';

interface RoomOccupancyHeatmapProps {
  rooms: Room[];
  bookings: Booking[];
  currencySymbol?: string;
  onSelectRoom?: (roomId: string) => void;
  onUpdateBooking?: (updated: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onBookRoom?: (roomId: string, dateStr?: string) => void;
}

export interface CellGuestData {
  bookingId: string;
  booking: Booking;
  name: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestsCount: number;
  surfLevel?: string;
  ref: string;
  paymentStatus: string;
  status: string;
  totalAmount: number;
}

export interface CellDetailData {
  room: Room;
  dateStr: string;
  displayDate: string;
  dayOfWeek: string;
  isToday: boolean;
  isWeekend: boolean;
  bookedBeds: number;
  capacity: number;
  availableBeds: number;
  occupancyPercent: number;
  guests: CellGuestData[];
}

export const RoomOccupancyHeatmap: React.FC<RoomOccupancyHeatmapProps> = ({
  rooms,
  bookings,
  currencySymbol = '€',
  onSelectRoom,
  onUpdateBooking,
  onDeleteBooking,
  onBookRoom,
}) => {
  const [selectedCellCoord, setSelectedCellCoord] = useState<{ roomId: string; dateStr: string } | null>(null);
  const [roomFilter, setRoomFilter] = useState<'all' | 'dorm' | 'private'>('all');
  const [displayDaysCount, setDisplayDaysCount] = useState<14 | 30>(30);
  const [cellSize, setCellSize] = useState<'compact' | 'comfortable'>('compact');

  // Interactive modal state for freeing room occupancy
  const [confirmFreeModal, setConfirmFreeModal] = useState<{
    isOpen: boolean;
    room: Room;
    dateStr: string;
    displayDate: string;
    targetBooking?: Booking;
    bookingsToFree: Booking[];
  } | null>(null);

  // Modal to reassign guest to another available room
  const [reassignModal, setReassignModal] = useState<{
    isOpen: boolean;
    booking: Booking;
    currentRoom: Room;
    dateStr: string;
  } | null>(null);

  // Floating Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
    actionText?: string;
    onAction?: () => void;
  } | null>(null);

  const showToast = (
    text: string,
    type: 'success' | 'info' = 'success',
    actionText?: string,
    onAction?: () => void
  ) => {
    setToastMessage({ text, type, actionText, onAction });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  const todayStr = useMemo(() => getTodayString(), []);

  // Filter rooms based on active status and type selection
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (!r.isActive) return false;
      if (roomFilter === 'dorm') return r.type.startsWith('dorm');
      if (roomFilter === 'private') return r.type.startsWith('private');
      return true;
    });
  }, [rooms, roomFilter]);

  // Generate array of days (next 14 or 30 days)
  const daysList = useMemo(() => {
    const list: Array<{
      dateStr: string;
      dayNum: number;
      dayOfWeek: string;
      monthName: string;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    for (let i = 0; i < displayDaysCount; i++) {
      const dateStr = addDaysToString(todayStr, i);
      const dateObj = new Date(dateStr + 'T00:00:00');
      const dayNum = dateObj.getDate();
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W...
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
      const dayOfWeekIndex = dateObj.getDay();
      const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6; // Sunday or Saturday

      list.push({
        dateStr,
        dayNum,
        dayOfWeek,
        monthName,
        isToday: i === 0,
        isWeekend,
      });
    }

    return list;
  }, [todayStr, displayDaysCount]);

  // Compute daily occupancy for each room & overall hostel
  const heatmapData = useMemo(() => {
    const matrix: Record<string, Record<string, CellDetailData>> = {};
    const overallDaily: Array<{
      dateStr: string;
      totalBooked: number;
      totalCapacity: number;
      occupancyPercent: number;
    }> = [];

    const activeRooms = rooms.filter((r) => r.isActive);
    const totalHostelCapacity = activeRooms.reduce((sum, r) => sum + r.capacity, 0);

    // Initialize matrix for each room
    filteredRooms.forEach((room) => {
      matrix[room.id] = {};
    });

    // Populate day by day
    daysList.forEach((day) => {
      let dayBookedBedsAcrossHostel = 0;

      activeRooms.forEach((room) => {
        const overlapping = bookings.filter((b) => {
          if (b.roomId !== room.id || b.status === 'cancelled') return false;
          return day.dateStr >= b.checkInDate && day.dateStr < b.checkOutDate;
        });

        const isPrivate = room.type.startsWith('private');
        let bookedBeds = 0;
        if (isPrivate) {
          bookedBeds = overlapping.length > 0 ? room.capacity : 0;
        } else {
          bookedBeds = overlapping.reduce((sum, b) => sum + (b.guestsCount || 1), 0);
        }
        bookedBeds = Math.min(room.capacity, bookedBeds);
        const availableBeds = Math.max(0, room.capacity - bookedBeds);
        const occupancyPercent = room.capacity > 0 
          ? Math.min(100, Math.round((bookedBeds / room.capacity) * 100)) 
          : 0;

        dayBookedBedsAcrossHostel += bookedBeds;

        if (matrix[room.id]) {
          matrix[room.id][day.dateStr] = {
            room,
            dateStr: day.dateStr,
            displayDate: formatDisplayDate(day.dateStr),
            dayOfWeek: new Date(day.dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
            isToday: day.isToday,
            isWeekend: day.isWeekend,
            bookedBeds,
            capacity: room.capacity,
            availableBeds,
            occupancyPercent,
            guests: overlapping.map((b) => ({
              bookingId: b.id,
              booking: b,
              name: `${b.guest?.firstName || ''} ${b.guest?.lastName || ''}`.trim() || 'Guest',
              email: b.guest?.email || '',
              phone: b.guest?.phone || '',
              checkInDate: b.checkInDate,
              checkOutDate: b.checkOutDate,
              nights: b.nights || calculateNights(b.checkInDate, b.checkOutDate),
              guestsCount: b.guestsCount || 1,
              surfLevel: b.guest?.surfLevel,
              ref: b.referenceNumber,
              paymentStatus: b.paymentStatus,
              status: b.status,
              totalAmount: b.totalAmount,
            })),
          };
        }
      });

      const dayPercent = totalHostelCapacity > 0 
        ? Math.min(100, Math.round((dayBookedBedsAcrossHostel / totalHostelCapacity) * 100)) 
        : 0;

      overallDaily.push({
        dateStr: day.dateStr,
        totalBooked: dayBookedBedsAcrossHostel,
        totalCapacity: totalHostelCapacity,
        occupancyPercent: dayPercent,
      });
    });

    return {
      matrix,
      overallDaily,
      totalHostelCapacity,
    };
  }, [filteredRooms, rooms, daysList, bookings]);

  // Keep selectedCell reactive to booking updates
  const selectedCell = useMemo(() => {
    if (!selectedCellCoord) return null;
    const roomData = heatmapData.matrix[selectedCellCoord.roomId];
    if (!roomData) return null;
    return roomData[selectedCellCoord.dateStr] || null;
  }, [selectedCellCoord, heatmapData]);

  // Aggregate KPI Highlights across the 30-day window
  const summaryStats = useMemo(() => {
    if (heatmapData.overallDaily.length === 0) {
      return {
        avgOccupancy: 0,
        peakOccupancy: 0,
        peakDate: '',
        totalBedNights: 0,
        fullDaysCount: 0,
      };
    }

    let sumPercent = 0;
    let peak = 0;
    let peakDate = '';
    let totalBedNights = 0;
    let fullDaysCount = 0;

    heatmapData.overallDaily.forEach((d) => {
      sumPercent += d.occupancyPercent;
      totalBedNights += d.totalBooked;
      if (d.occupancyPercent > peak) {
        peak = d.occupancyPercent;
        peakDate = d.dateStr;
      }
      if (d.occupancyPercent >= 90) {
        fullDaysCount++;
      }
    });

    const avgOccupancy = Math.round(sumPercent / heatmapData.overallDaily.length);

    return {
      avgOccupancy,
      peakOccupancy: peak,
      peakDate: peakDate ? formatDisplayDate(peakDate).split(',')[1]?.trim() || peakDate : 'N/A',
      totalBedNights,
      fullDaysCount,
    };
  }, [heatmapData]);

  // Actions to free room occupancy
  const handleExecuteFreeRoom = (room: Room, dateStr: string, bookingsToCancel: Booking[], permanentlyDelete = false) => {
    if (bookingsToCancel.length === 0) return;
    const previousBookings = bookingsToCancel.map((b) => ({ ...b }));

    if (permanentlyDelete && onDeleteBooking) {
      bookingsToCancel.forEach((b) => {
        onDeleteBooking(b.id);
      });
      showToast(
        `Deleted ${bookingsToCancel.length} reservation(s). "${room.name}" is now free on ${formatDisplayDate(dateStr)}.`,
        'success'
      );
    } else if (onUpdateBooking) {
      bookingsToCancel.forEach((b) => {
        onUpdateBooking({
          ...b,
          status: 'cancelled',
        });
      });

      showToast(
        `Room occupancy freed! "${room.name}" is now completely free for booking on ${formatDisplayDate(dateStr)}.`,
        'success',
        'Undo',
        () => {
          previousBookings.forEach((b) => {
            onUpdateBooking(b);
          });
          showToast(`Restored reservations for "${room.name}".`, 'info');
        }
      );
    }

    setConfirmFreeModal(null);
  };

  const handleEarlyCheckout = (booking: Booking, room: Room, dateStr: string) => {
    if (!onUpdateBooking) return;
    const previousBooking = { ...booking };

    onUpdateBooking({
      ...booking,
      checkOutDate: dateStr,
      status: 'checked_out',
    });

    showToast(
      `Checked out ${booking.guest.firstName} early on ${formatDisplayDate(dateStr)}. Subsequent nights in "${room.name}" are now free!`,
      'success',
      'Undo',
      () => {
        onUpdateBooking(previousBooking);
        showToast(`Restored checkout date for #${booking.referenceNumber}.`, 'info');
      }
    );
  };

  const handleMoveGuestToRoom = (booking: Booking, currentRoom: Room, targetRoom: Room) => {
    if (!onUpdateBooking) return;

    onUpdateBooking({
      ...booking,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
    });

    showToast(
      `Moved ${booking.guest.firstName} to "${targetRoom.name}". "${currentRoom.name}" is now freed for booking!`,
      'success'
    );
    setReassignModal(null);
  };

  // Find first occupied cell for a room to quickly inspect & free
  const handleQuickInspectRoomOccupancy = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    const roomRow = heatmapData.matrix[roomId];
    if (!roomRow) return;

    const firstOccupiedDay = daysList.find((d) => (roomRow[d.dateStr]?.bookedBeds || 0) > 0);
    if (firstOccupiedDay) {
      setSelectedCellCoord({ roomId, dateStr: firstOccupiedDay.dateStr });
      showToast(`Inspecting occupied stay for "${room.name}" on ${firstOccupiedDay.dateStr}. Click "Free Room" below to clear occupancy.`, 'info');
    } else {
      setSelectedCellCoord({ roomId, dateStr: todayStr });
      showToast(`"${room.name}" is already 100% free across this entire schedule!`, 'info');
    }
  };

  // Heatmap cell color styling based on occupancy percentage
  const getCellColor = (percent: number, isSelected: boolean) => {
    let bg = '';
    let text = '';
    let border = '';

    if (percent === 0) {
      bg = 'bg-slate-50 hover:bg-slate-100';
      text = 'text-slate-400';
      border = 'border-slate-200/60';
    } else if (percent < 40) {
      bg = 'bg-teal-50/80 hover:bg-teal-100 text-teal-800';
      text = 'text-teal-800 font-medium';
      border = 'border-teal-200/70';
    } else if (percent < 75) {
      bg = 'bg-teal-200/90 hover:bg-teal-300 text-teal-950';
      text = 'text-teal-950 font-bold';
      border = 'border-teal-300';
    } else if (percent < 100) {
      bg = 'bg-amber-300 hover:bg-amber-400 text-amber-950';
      text = 'text-amber-950 font-extrabold';
      border = 'border-amber-400';
    } else {
      // 100% Sold out
      bg = 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs';
      text = 'text-white font-black';
      border = 'border-rose-600';
    }

    if (isSelected) {
      border = 'ring-2 ring-slate-900 ring-offset-1 z-10';
    }

    return `${bg} ${text} ${border}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5 relative">
      {/* Dynamic Toast Alert */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {toastMessage.actionText && toastMessage.onAction && (
              <button
                type="button"
                onClick={toastMessage.onAction}
                className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-extrabold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{toastMessage.actionText}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header with Title, Badges & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-200/70">
              <Flame className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
                  30-Day Room Occupancy Heatmap
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  Interactive Matrix
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 font-semibold">
                  <Unlock className="w-3 h-3 text-amber-600" />
                  <span>1-Click Free Room</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any cell to inspect reservations and immediately free up room occupancy for new bookings.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: 14/30 Days, Filter, Cell Density */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Room Type Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Rooms' },
              { id: 'dorm', label: 'Dorms' },
              { id: 'private', label: 'Privates' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                id={`heatmap-filter-${f.id}`}
                onClick={() => setRoomFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                  roomFilter === f.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Time Horizon: 14d vs 30d */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              id="heatmap-range-14d"
              onClick={() => setDisplayDaysCount(14)}
              className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                displayDaysCount === 14
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              14 Days
            </button>
            <button
              type="button"
              id="heatmap-range-30d"
              onClick={() => setDisplayDaysCount(30)}
              className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                displayDaysCount === 30
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Cell Density Toggle */}
          <button
            type="button"
            id="heatmap-density-toggle"
            onClick={() => setCellSize((prev) => (prev === 'compact' ? 'comfortable' : 'compact'))}
            className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            title="Toggle Cell Size Density"
          >
            {cellSize === 'compact' ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Expand</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Compact</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mini KPI Snapshot Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            30-Day Avg Occupancy
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-heading font-black text-slate-900">
              {summaryStats.avgOccupancy}%
            </span>
            <span className="text-[11px] font-semibold text-teal-700">Paced</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Peak Day Rate
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-heading font-black text-rose-600">
              {summaryStats.peakOccupancy}%
            </span>
            <span className="text-[11px] font-medium text-slate-500 truncate max-w-[80px]">
              {summaryStats.peakDate}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Sold-Out Dates (90%+)
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-heading font-black text-amber-600">
              {summaryStats.fullDaysCount}
            </span>
            <span className="text-[11px] font-medium text-slate-500">days peak</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Bed-Nights Booked
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-heading font-black text-teal-800">
              {summaryStats.totalBedNights}
            </span>
            <span className="text-[11px] font-medium text-slate-500">guest nights</span>
          </div>
        </div>
      </div>

      {/* Heatmap Matrix Table Container with Horizontal Scroll */}
      <div className="relative border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left select-none">
            <thead>
              {/* Date Header Row */}
              <tr className="bg-slate-50/90 border-b border-slate-200">
                <th className="sticky left-0 z-20 bg-slate-100/95 backdrop-blur-xs px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 min-w-[170px] border-r border-slate-200 shadow-xs">
                  Space / Room
                </th>
                {daysList.map((d) => (
                  <th
                    key={d.dateStr}
                    className={`text-center py-2 px-1 border-r border-slate-200/60 transition-colors ${
                      cellSize === 'compact' ? 'min-w-[28px] max-w-[32px]' : 'min-w-[40px] max-w-[46px]'
                    } ${
                      d.isToday
                        ? 'bg-teal-50/90 text-teal-900 border-teal-300 font-black'
                        : d.isWeekend
                        ? 'bg-slate-100/60 text-slate-800 font-semibold'
                        : 'text-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold uppercase opacity-75">
                        {d.dayOfWeek}
                      </span>
                      <span className={`text-[11px] leading-tight ${d.isToday ? 'text-teal-700 font-black underline underline-offset-2' : 'font-semibold'}`}>
                        {d.dayNum}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Room Rows */}
              {filteredRooms.map((room) => {
                const roomDayData = heatmapData.matrix[room.id] || {};

                return (
                  <tr key={room.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    {/* Sticky Room Label */}
                    <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 border-r border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {room.name.replace(/^(The\s+)/, '')}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-slate-500">
                              {room.capacity} {room.capacity === 1 ? 'bed' : 'beds'}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{room.type.includes('dorm') ? 'Dorm' : 'Private'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Quick Free Button directly in row header */}
                          <button
                            type="button"
                            onClick={() => handleQuickInspectRoomOccupancy(room.id)}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title={`Inspect & Free Occupancy in ${room.name}`}
                          >
                            <Unlock className="w-3 h-3" />
                          </button>

                          {onSelectRoom && (
                            <button
                              type="button"
                              onClick={() => onSelectRoom(room.id)}
                              className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Scroll to inventory details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Day Heatmap Cells for this Room */}
                    {daysList.map((day) => {
                      const cell = roomDayData[day.dateStr];
                      if (!cell) {
                        return (
                          <td key={day.dateStr} className="p-1 border-r border-slate-100">
                            <div className="w-full h-7 rounded bg-slate-100" />
                          </td>
                        );
                      }

                      const isSelected = selectedCellCoord?.roomId === room.id && selectedCellCoord?.dateStr === day.dateStr;

                      return (
                        <td
                          key={day.dateStr}
                          className={`p-0.5 border-r border-slate-100 text-center ${day.isToday ? 'bg-teal-50/30' : ''}`}
                        >
                          <button
                            type="button"
                            id={`heatmap-cell-${room.id}-${day.dateStr}`}
                            onClick={() => setSelectedCellCoord({ roomId: room.id, dateStr: day.dateStr })}
                            title={`${room.name} on ${cell.displayDate}: ${cell.occupancyPercent}% (${cell.bookedBeds}/${cell.capacity} beds)${cell.bookedBeds > 0 ? ' • Click to inspect & free occupancy' : ' • Free for booking'}`}
                            className={`w-full ${
                              cellSize === 'compact' ? 'h-7' : 'h-8'
                            } rounded-md border text-[10px] flex items-center justify-center transition-all cursor-pointer ${getCellColor(
                              cell.occupancyPercent,
                              isSelected
                            )}`}
                          >
                            {cellSize === 'comfortable' ? (
                              <span>
                                {cell.occupancyPercent === 100 
                                  ? 'FULL' 
                                  : cell.occupancyPercent > 0 
                                  ? `${cell.bookedBeds}/${cell.capacity}` 
                                  : '—'}
                              </span>
                            ) : (
                              <span>
                                {cell.occupancyPercent === 100
                                  ? 'F'
                                  : cell.occupancyPercent > 0
                                  ? `${cell.occupancyPercent}%`
                                  : ''}
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Overall Total Hostel Summary Row */}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <td className="sticky left-0 z-10 bg-slate-100/95 backdrop-blur-xs px-3.5 py-2.5 border-r border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-heading font-extrabold text-slate-900 block">
                        Hostel Total
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Overall {heatmapData.totalHostelCapacity} Beds
                      </span>
                    </div>
                  </div>
                </td>

                {heatmapData.overallDaily.map((d) => {
                  return (
                    <td
                      key={d.dateStr}
                      className="p-0.5 border-r border-slate-200/80 text-center"
                    >
                      <div
                        className={`w-full ${
                          cellSize === 'compact' ? 'h-7' : 'h-8'
                        } rounded-md border text-[10px] font-black flex items-center justify-center transition-all ${getCellColor(
                          d.occupancyPercent,
                          false
                        )}`}
                        title={`Total Hostel on ${formatDisplayDate(d.dateStr)}: ${d.occupancyPercent}% (${d.totalBooked}/${d.totalCapacity} beds)`}
                      >
                        {d.occupancyPercent > 0 ? `${d.occupancyPercent}%` : '0%'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend & Selected Cell Quick Inspector Drawer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        {/* Heatmap Legend */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-[11px] font-bold text-slate-500">Legend:</span>
          
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 inline-block" />
            <span className="text-[11px] text-slate-600">0% (Empty)</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-teal-100 border border-teal-300 inline-block" />
            <span className="text-[11px] text-slate-600">1–39% (Low)</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-teal-200 border border-teal-400 inline-block" />
            <span className="text-[11px] text-slate-600">40–74% (Moderate)</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-amber-300 border border-amber-500 inline-block" />
            <span className="text-[11px] text-slate-600">75–99% (High)</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600 inline-block" />
            <span className="text-[11px] font-bold text-rose-700">100% (Full House)</span>
          </div>
        </div>

        {/* Tip */}
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 self-start md:self-auto font-medium">
          <Unlock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Click any cell to free beds or reassign reservations instantly</span>
        </div>
      </div>

      {/* Selected Cell Detail Inspector Drawer */}
      {selectedCell && (
        <div 
          id="heatmap-cell-inspector"
          className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-4 animate-in fade-in"
        >
          {/* Inspector Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                selectedCell.occupancyPercent === 100 
                  ? 'bg-rose-600' 
                  : selectedCell.occupancyPercent > 0 
                  ? 'bg-teal-700' 
                  : 'bg-emerald-600'
              }`}>
                <Bed className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-heading font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <span>{selectedCell.room.name}</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({selectedCell.capacity} {selectedCell.capacity === 1 ? 'bed' : 'beds'}, {selectedCell.room.type})
                  </span>
                </h5>
                <p className="text-xs text-slate-500">
                  {selectedCell.dayOfWeek}, {selectedCell.displayDate} {selectedCell.isToday && '• Today'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                  selectedCell.occupancyPercent === 100
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : selectedCell.occupancyPercent >= 75
                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                    : selectedCell.occupancyPercent > 0
                    ? 'bg-teal-100 text-teal-800 border-teal-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {selectedCell.occupancyPercent}% Occupied ({selectedCell.bookedBeds} / {selectedCell.capacity} Beds)
              </span>

              <button
                type="button"
                id="heatmap-close-cell-detail"
                onClick={() => setSelectedCellCoord(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Prominent Action Banner for Occupied Cells */}
          {selectedCell.guests.length > 0 ? (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-xs">
                  <Unlock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-amber-950">
                    Free Room Occupancy on {selectedCell.displayDate}
                  </div>
                  <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                    {selectedCell.guests.length === 1
                      ? `1 active reservation is occupying ${selectedCell.bookedBeds} bed(s). Release it here to make this room immediately free for new bookings.`
                      : `${selectedCell.guests.length} active reservations occupying ${selectedCell.bookedBeds} bed(s). Release reservations to make this room free to book.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  id="heatmap-free-entire-room-btn"
                  data-testid="heatmap-free-entire-room-btn"
                  onClick={() => {
                    setConfirmFreeModal({
                      isOpen: true,
                      room: selectedCell.room,
                      dateStr: selectedCell.dateStr,
                      displayDate: selectedCell.displayDate,
                      bookingsToFree: selectedCell.guests.map((g) => g.booking),
                    });
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Free Entire Room for Booking</span>
                </button>
              </div>
            </div>
          ) : (
            /* Cell is 100% Free */
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-emerald-950">
                    Space is 100% Free for Booking
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                    All {selectedCell.capacity} bed(s) in {selectedCell.room.name} are completely unoccupied and available to book on {selectedCell.displayDate}.
                  </p>
                </div>
              </div>

              {onBookRoom && (
                <button
                  type="button"
                  id="heatmap-book-room-now-btn"
                  onClick={() => onBookRoom(selectedCell.room.id, selectedCell.dateStr)}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book This Room on {selectedCell.displayDate}</span>
                </button>
              )}
            </div>
          )}

          {/* Guest breakdown for that night */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Occupying Guests ({selectedCell.guests.length} Reservations)
              </span>
              {selectedCell.guests.length > 1 && (
                <span className="text-[11px] text-slate-400">
                  Release individual beds or free all occupancy above
                </span>
              )}
            </div>

            {selectedCell.guests.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {selectedCell.guests.map((g) => {
                  const isEligibleForEarlyCheckout = selectedCell.dateStr > g.checkInDate && selectedCell.dateStr < g.checkOutDate;

                  return (
                    <div
                      key={g.bookingId}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                    >
                      {/* Guest Info Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{g.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                              #{g.ref}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Stay: <span className="font-semibold text-slate-700">{formatDisplayDate(g.checkInDate)} → {formatDisplayDate(g.checkOutDate)}</span> ({g.nights} nights)
                          </div>
                        </div>

                        <span className="text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 shrink-0">
                          {g.guestsCount} {g.guestsCount === 1 ? 'bed' : 'beds'}
                        </span>
                      </div>

                      {/* Guest Meta / Contacts */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                        {g.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{g.phone}</span>
                          </span>
                        )}
                        {g.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{g.email}</span>
                          </span>
                        )}
                        {g.surfLevel && (
                          <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                            {g.surfLevel}
                          </span>
                        )}
                      </div>

                      {/* Action Bar for this specific reservation */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        {/* 1. Free Bed / Cancel Reservation */}
                        <button
                          type="button"
                          id={`heatmap-free-booking-${g.bookingId}`}
                          onClick={() => {
                            setConfirmFreeModal({
                              isOpen: true,
                              room: selectedCell.room,
                              dateStr: selectedCell.dateStr,
                              displayDate: selectedCell.displayDate,
                              targetBooking: g.booking,
                              bookingsToFree: [g.booking],
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Cancel this reservation and free up beds in this room"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Free Bed (Release)</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {/* 2. Move / Reassign to Another Room */}
                          <button
                            type="button"
                            id={`heatmap-move-booking-${g.bookingId}`}
                            onClick={() => {
                              setReassignModal({
                                isOpen: true,
                                booking: g.booking,
                                currentRoom: selectedCell.room,
                                dateStr: selectedCell.dateStr,
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Move this guest to another room with availability, freeing this room without losing the booking"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600" />
                            <span>Move Room</span>
                          </button>

                          {/* 3. Early Checkout if guest left early */}
                          {isEligibleForEarlyCheckout && (
                            <button
                              type="button"
                              id={`heatmap-early-checkout-${g.bookingId}`}
                              onClick={() => handleEarlyCheckout(g.booking, selectedCell.room, selectedCell.dateStr)}
                              className="px-2 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Set check-out date to today and free all remaining nights in this room"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Checkout Early</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Confirmation Modal to Free Room Occupancy */}
      {confirmFreeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-base text-slate-900">
                    Free Room Occupancy
                  </h4>
                  <p className="text-xs text-slate-500">
                    {confirmFreeModal.room.name} • {confirmFreeModal.displayDate}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmFreeModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <p className="text-slate-700 font-medium">
                You are about to free occupancy in <strong className="text-slate-900">{confirmFreeModal.room.name}</strong> on <strong className="text-slate-900">{confirmFreeModal.displayDate}</strong>.
              </p>
              <p className="text-slate-500 text-[11px]">
                This will release the following reservation(s) and immediately make the room available for new guest bookings:
              </p>

              <div className="space-y-1.5 pt-1">
                {confirmFreeModal.bookingsToFree.map((b) => (
                  <div key={b.id} className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{b.guest.firstName} {b.guest.lastName}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">Ref #{b.referenceNumber}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">
                      {b.guestsCount} {b.guestsCount === 1 ? 'bed' : 'beds'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmFreeModal(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel (Keep Occupied)
              </button>

              {onDeleteBooking && (
                <button
                  type="button"
                  id="heatmap-confirm-delete-bookings-btn"
                  onClick={() => handleExecuteFreeRoom(confirmFreeModal.room, confirmFreeModal.dateStr, confirmFreeModal.bookingsToFree, true)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete</span>
                </button>
              )}

              <button
                type="button"
                id="heatmap-confirm-free-room-btn"
                data-testid="heatmap-confirm-free-room-btn"
                onClick={() => handleExecuteFreeRoom(confirmFreeModal.room, confirmFreeModal.dateStr, confirmFreeModal.bookingsToFree, false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Yes, Free Room (Cancel Reservations)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign / Move Guest to Another Room Modal */}
      {reassignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-base text-slate-900">
                    Reassign to Another Room
                  </h4>
                  <p className="text-xs text-slate-500">
                    Free up "{reassignModal.currentRoom.name}" without losing the guest
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">
                {reassignModal.booking.guest.firstName} {reassignModal.booking.guest.lastName} (Ref #{reassignModal.booking.referenceNumber})
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Stay: {formatDisplayDate(reassignModal.booking.checkInDate)} → {formatDisplayDate(reassignModal.booking.checkOutDate)} ({reassignModal.booking.guestsCount} guest{reassignModal.booking.guestsCount > 1 ? 's' : ''})
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Select Destination Room with Availability:
              </span>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {rooms
                  .filter((r) => r.id !== reassignModal.currentRoom.id && r.isActive)
                  .map((targetRoom) => {
                    const avail = calculateRoomAvailability(
                      targetRoom,
                      reassignModal.booking.checkInDate,
                      reassignModal.booking.checkOutDate,
                      bookings,
                      reassignModal.booking.id
                    );
                    const canFit = avail.availableBeds >= reassignModal.booking.guestsCount;

                    return (
                      <div
                        key={targetRoom.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                          canFit
                            ? 'bg-white border-slate-200/90 hover:border-teal-300'
                            : 'bg-slate-50 border-slate-200/50 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900">{targetRoom.name}</div>
                          <div className="text-[11px] text-slate-500 capitalize">
                            {targetRoom.type} • {targetRoom.capacity} beds ({avail.availableBeds} free on stay dates)
                          </div>
                        </div>

                        {canFit ? (
                          <button
                            type="button"
                            onClick={() => handleMoveGuestToRoom(reassignModal.booking, reassignModal.currentRoom, targetRoom)}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <span>Move Here</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                            Full / No Beds
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setReassignModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
