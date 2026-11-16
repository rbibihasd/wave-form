import React, { useState } from 'react';
import {
  Bed,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  Wind,
  Bath,
  DollarSign,
  Image,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldAlert,
  Layers,
  CalendarRange,
  CheckSquare,
  Square,
  Sparkles,
  Calendar,
  Lock,
} from 'lucide-react';
import { Booking, Room, RoomType, WaitlistEntry } from '../../types';
import { calculateRoomAvailability } from '../../utils/availability';
import { addDaysToString, getTodayString } from '../../utils/date';
import { RoomOccupancyHeatmap } from './RoomOccupancyHeatmap';
import { BatchRoomStatusModal } from './BatchRoomStatusModal';
import { RoomTypeCapacityMeter } from './RoomTypeCapacityMeter';

interface RoomsManagerProps {
  rooms: Room[];
  bookings?: Booking[];
  currencySymbol: string;
  waitlist?: WaitlistEntry[];
  onUpdateRoom: (room: Room) => void;
  onAddRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  onBatchUpdateRooms?: (updatedRooms: Room[]) => void;
  onAddToWaitlist?: (roomId: string) => void;
  onViewWaitlist?: (roomId: string) => void;
  onUpdateBooking?: (updated: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onBookRoom?: (roomId: string, dateStr?: string) => void;
  canDeleteRoom?: boolean;
  canAddRoom?: boolean;
}

export const RoomsManager: React.FC<RoomsManagerProps> = ({
  rooms,
  bookings = [],
  currencySymbol,
  waitlist = [],
  onUpdateRoom,
  onAddRoom,
  onDeleteRoom,
  onBatchUpdateRooms,
  onAddToWaitlist,
  onViewWaitlist,
  onUpdateBooking,
  onDeleteBooking,
  onBookRoom,
  canDeleteRoom = true,
  canAddRoom = true,
}) => {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Batch Room Status Helper Tool states
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedCardRoomIds, setSelectedCardRoomIds] = useState<string[]>([]);
  const [batchModalInitialRooms, setBatchModalInitialRooms] = useState<string[]>([]);
  const [selectedRoomTypeFilter, setSelectedRoomTypeFilter] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleBatchUpdate = (updatedRooms: Room[]) => {
    if (onBatchUpdateRooms) {
      onBatchUpdateRooms(updatedRooms);
    } else {
      updatedRooms.forEach((r) => onUpdateRoom(r));
    }
    setSelectedCardRoomIds([]);
  };

  // Compute live occupancy metrics for today
  const today = getTodayString();
  const tomorrow = addDaysToString(today, 1);

  const activeRooms = rooms.filter((r) => {
    if (!r.isActive || r.status === 'inactive' || r.status === 'maintenance') return false;
    const hasActiveMaintToday = r.maintenanceBlocks?.some(
      (b) => today >= b.startDate && today <= b.endDate
    );
    return !hasActiveMaintToday;
  });

  const totalSystemBeds = activeRooms.reduce((sum, r) => sum + r.capacity, 0);

  const roomsOccupancy = rooms.map((room) => {
    const avail = calculateRoomAvailability(room, today, tomorrow, bookings);
    return {
      room,
      ...avail,
    };
  });

  const totalBookedBeds = roomsOccupancy
    .filter((s) => s.room.isActive && !s.isMaintenance && !s.isInactive)
    .reduce((sum, s) => sum + s.bookedBeds, 0);

  const totalAvailableBeds = Math.max(0, totalSystemBeds - totalBookedBeds);
  const overallOccupancyPercent =
    totalSystemBeds > 0 ? Math.min(100, Math.round((totalBookedBeds / totalSystemBeds) * 100)) : 0;

  // Maintenance & Inactive metrics
  const totalActiveOrScheduledBlocks = rooms.reduce(
    (acc, r) => acc + (r.maintenanceBlocks?.length || 0),
    0
  );

  const roomsInMaintenanceToday = rooms.filter((r) => {
    if (r.status === 'maintenance') return true;
    return r.maintenanceBlocks?.some(
      (b) => b.status === 'maintenance' && today >= b.startDate && today <= b.endDate
    );
  }).length;

  const roomsInactiveToday = rooms.filter((r) => {
    if (!r.isActive || r.status === 'inactive') return true;
    return r.maintenanceBlocks?.some(
      (b) => b.status === 'inactive' && today >= b.startDate && today <= b.endDate
    );
  }).length;

  const displayedRooms = selectedRoomTypeFilter
    ? rooms.filter((r) => r.type === selectedRoomTypeFilter)
    : rooms;

  const initialNewRoom: Room = {
    id: 'room-' + Date.now(),
    name: 'New Surf Space',
    type: 'dorm_mixed',
    typeLabel: 'Mixed Surf Dorm',
    capacity: 4,
    pricePerNight: 30,
    description: 'Comfortable surf hostel accommodation with orthopedic mattresses, personal lockers, and fast Wi-Fi.',
    shortDescription: 'Modern dorm space with lockers & AC',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80',
    amenities: ['Air Conditioning', 'High-Speed Wi-Fi', 'Lockable Trunk', 'Daily Cleaning'],
    bedType: 'Orthopedic Bunk',
    bathroomType: 'shared',
    hasOceanView: false,
    hasAirConditioning: true,
    isActive: true,
    status: 'active',
  };

  const [formRoom, setFormRoom] = useState<Room>(initialNewRoom);

  const handleStartEdit = (room: Room) => {
    setEditingRoom(room);
    setFormRoom({ ...room });
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    if (!canAddRoom) {
      showToast('⚠️ Adding new rooms requires Full Control (Admin or Super Admin). Manager role has operational manage access.');
      return;
    }
    setEditingRoom(null);
    setFormRoom({ ...initialNewRoom, id: 'room-' + Date.now() });
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      onAddRoom(formRoom);
    } else {
      onUpdateRoom(formRoom);
    }
    setEditingRoom(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-slate-900">
            Rooms & Beds Inventory Management
          </h3>
          <p className="text-xs text-slate-500">
            Control room types, bed capacities, pricing per night, and scheduled maintenance or inactive periods.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Helper Tool: Batch Maintenance / Inactive Status Tool */}
          <button
            type="button"
            id="btn-batch-room-status"
            onClick={() => {
              setBatchModalInitialRooms(selectedCardRoomIds);
              setIsBatchModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-500/25 transition-all"
            title="Batch set multiple rooms to Maintenance or Inactive for date ranges"
          >
            <Wrench className="w-4 h-4" />
            <span>Batch Maintenance Tool</span>
            {totalActiveOrScheduledBlocks > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-white text-amber-900 rounded-full text-[10px] font-extrabold">
                {totalActiveOrScheduledBlocks}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-teal-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Room / Dorm</span>
          </button>
        </div>
      </div>

      {/* Visual Live Occupancy Bar Indicator (Overall System) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-200/60">
              <Bed className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-extrabold text-sm text-slate-900">
                  Total Hostel Bed Occupancy
                </h4>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    overallOccupancyPercent >= 90
                      ? 'bg-rose-100 text-rose-800'
                      : overallOccupancyPercent >= 60
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {overallOccupancyPercent}% Booked Today
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time bed availability calculated from active guest reservations for today
              </p>
            </div>
          </div>

          {/* Key Numbers Breakdown */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold self-start sm:self-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <span className="text-slate-900 font-bold">{totalBookedBeds}</span>
              <span className="text-slate-500">Booked</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-900 font-bold">{totalAvailableBeds}</span>
              <span className="text-slate-500">Free Beds</span>
            </div>
            {roomsInMaintenanceToday > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-amber-800">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-bold">{roomsInMaintenanceToday}</span>
                <span>In Maint Today</span>
              </div>
            )}
            {roomsInactiveToday > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-800">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span className="font-bold">{roomsInactiveToday}</span>
                <span>Offline</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
              <span className="text-slate-500 font-medium">Capacity:</span>
              <span className="text-slate-900 font-bold">{totalSystemBeds} Beds</span>
            </div>
          </div>
        </div>

        {/* Master Occupancy Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallOccupancyPercent >= 90
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : overallOccupancyPercent >= 60
                  ? 'bg-gradient-to-r from-teal-500 to-amber-500'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-500'
              }`}
              style={{ width: `${Math.max(overallOccupancyPercent, totalBookedBeds > 0 ? 4 : 0)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
            <span>0% (Empty)</span>
            <span>50% Occupied</span>
            <span>100% (Full House)</span>
          </div>
        </div>
      </div>

      {/* Visual Capacity Meter for Each Room Type (Active Bookings vs Total Beds) */}
      <RoomTypeCapacityMeter
        rooms={rooms}
        bookings={bookings}
        selectedTypeFilter={selectedRoomTypeFilter}
        onSelectTypeFilter={(typeKey) => setSelectedRoomTypeFilter(typeKey)}
        currencySymbol={currencySymbol}
        onSelectRoom={(roomId) => {
          const el = document.getElementById(`room-card-${roomId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-teal-500', 'ring-offset-2');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-teal-500', 'ring-offset-2');
            }, 2500);
          }
        }}
      />

      {/* Mini-Heatmap Visualization (Next 30 Days Occupancy Rates) */}
      <RoomOccupancyHeatmap
        rooms={rooms}
        bookings={bookings}
        currencySymbol={currencySymbol}
        onUpdateBooking={onUpdateBooking}
        onDeleteBooking={onDeleteBooking}
        onBookRoom={onBookRoom}
        onSelectRoom={(roomId) => {
          const el = document.getElementById(`room-card-${roomId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-teal-500', 'ring-offset-2');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-teal-500', 'ring-offset-2');
            }, 2500);
          }
        }}
      />

      {/* Batch Selection Action Floating/Inline Bar */}
      {selectedCardRoomIds.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>{selectedCardRoomIds.length} space{selectedCardRoomIds.length === 1 ? '' : 's'} selected</span>
                <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full">
                  Batch Mode
                </span>
              </p>
              <p className="text-[11px] text-amber-800">
                Ready to apply scheduled maintenance blocks or set inactive for specific date ranges in one batch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setBatchModalInitialRooms(selectedCardRoomIds);
                setIsBatchModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-600/20 transition-all"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Apply Maintenance / Inactive Dates</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCardRoomIds([])}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Room Inventory Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-heading font-extrabold text-base text-slate-900">
            Room Units & Dorm Inventory
          </h4>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {selectedRoomTypeFilter ? `${displayedRooms.length} of ${rooms.length} Spaces` : `${rooms.length} Spaces`}
          </span>
          {selectedRoomTypeFilter && (
            <button
              type="button"
              onClick={() => setSelectedRoomTypeFilter(null)}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1 hover:bg-teal-200 transition-colors"
            >
              <span>Category: {displayedRooms[0]?.typeLabel || selectedRoomTypeFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {totalActiveOrScheduledBlocks > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-amber-600" />
              <span>{totalActiveOrScheduledBlocks} Scheduled Block{totalActiveOrScheduledBlocks === 1 ? '' : 's'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (selectedCardRoomIds.length === rooms.length) {
                setSelectedCardRoomIds([]);
              } else {
                setSelectedCardRoomIds(rooms.map((r) => r.id));
              }
            }}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-xl transition-colors"
          >
            {selectedCardRoomIds.length === rooms.length ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Select All ({rooms.length})</span>
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 hidden sm:block">
            Click cards to edit details or use checkboxes for batch maintenance.
          </p>
        </div>
      </div>

      {/* Filtered notification banner */}
      {selectedRoomTypeFilter && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse shrink-0" />
            <span className="font-bold text-teal-950">
              Showing only {displayedRooms.length} room unit{displayedRooms.length === 1 ? '' : 's'} in category: {displayedRooms[0]?.typeLabel || selectedRoomTypeFilter}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedRoomTypeFilter(null)}
            className="px-3 py-1 rounded-xl bg-white hover:bg-teal-100 text-teal-800 font-bold border border-teal-300 transition-colors shadow-2xs shrink-0"
          >
            Show All Spaces ({rooms.length})
          </button>
        </div>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedRooms.map((room) => {
          const isSelected = selectedCardRoomIds.includes(room.id);
          const stat =
            roomsOccupancy.find((s) => s.room.id === room.id) ||
            calculateRoomAvailability(room, today, tomorrow, bookings);

          // Room's active bookings for today
          const roomActiveBookings = bookings.filter((b) => {
            if (b.roomId !== room.id) return false;
            if (b.status === 'cancelled') return false;
            return b.checkInDate <= today && today < b.checkOutDate;
          });

          // Determine maintenance status today or scheduled blocks
          const activeBlock = room.maintenanceBlocks?.find(
            (b) => today >= b.startDate && today <= b.endDate
          );
          const futureBlocks = (room.maintenanceBlocks || [])
            .filter((b) => b.startDate > today)
            .sort((a, b) => a.startDate.localeCompare(b.startDate));

          const isMaintenanceToday = room.status === 'maintenance' || activeBlock?.status === 'maintenance';
          const isInactiveToday = !room.isActive || room.status === 'inactive' || activeBlock?.status === 'inactive';

          return (
            <div
              key={room.id}
              id={`room-card-${room.id}`}
              className={`rounded-3xl border bg-white overflow-hidden shadow-xs flex flex-col justify-between transition-all duration-300 relative ${
                isSelected
                  ? 'ring-2 ring-amber-500 border-amber-300 shadow-md'
                  : isMaintenanceToday
                  ? 'border-amber-200 bg-amber-50/10'
                  : !room.isActive
                  ? 'opacity-70 border-slate-300'
                  : 'border-slate-200'
              }`}
            >
              {/* Image banner */}
              <div className="relative h-40 w-full overflow-hidden">
                <img
                  src={room.image}
                  alt={room.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {/* Multi-Select Checkbox Trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCardRoomIds((prev) =>
                      prev.includes(room.id) ? prev.filter((id) => id !== room.id) : [...prev, room.id]
                    );
                  }}
                  className={`absolute top-2.5 right-2.5 p-1.5 rounded-xl backdrop-blur-md transition-all z-10 flex items-center gap-1 shadow-sm ${
                    isSelected
                      ? 'bg-amber-500 text-white ring-2 ring-white'
                      : 'bg-black/50 text-white/90 hover:bg-black/75 hover:text-white'
                  }`}
                  title={isSelected ? 'Deselect room' : 'Select room for batch operations'}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-white" />
                  ) : (
                    <Square className="w-4 h-4 text-white" />
                  )}
                </button>

                {/* Status Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
                    {room.typeLabel}
                  </span>

                  {isMaintenanceToday ? (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      <span>Maintenance</span>
                    </span>
                  ) : isInactiveToday ? (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Offline</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                      Active
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[11px] font-bold">
                  Cap: {room.capacity} {room.type.startsWith('dorm') ? 'Beds' : 'Guests'}
                </div>
              </div>

              {/* Room info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-heading font-bold text-base text-slate-900">
                      {room.name}
                    </h4>
                    {room.maintenanceBlocks && room.maintenanceBlocks.length > 0 && (
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-0.5"
                        title={`${room.maintenanceBlocks.length} scheduled maintenance or inactive block(s)`}
                      >
                        <Wrench className="w-2.5 h-2.5" />
                        <span>{room.maintenanceBlocks.length} Block{room.maintenanceBlocks.length === 1 ? '' : 's'}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                    {room.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {room.amenities.slice(0, 3).map((a, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {a}
                      </span>
                    ))}
                  </div>

                  {/* Active Maintenance Alert Banner if blocked today */}
                  {activeBlock && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-950 mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-semibold truncate">
                          {activeBlock.status === 'maintenance' ? 'Maintenance' : 'Inactive'}: {activeBlock.reason || 'Operational Block'}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md shrink-0">
                        Until {activeBlock.endDate}
                      </span>
                    </div>
                  )}

                  {/* Upcoming Scheduled Maintenance Banner */}
                  {futureBlocks.length > 0 && !activeBlock && (
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <CalendarRange className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="font-medium truncate">
                          Scheduled: {futureBlocks[0].reason || futureBlocks[0].status}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                        {futureBlocks[0].startDate} → {futureBlocks[0].endDate}
                      </span>
                    </div>
                  )}

                  {/* Visual Occupancy Bar Indicator for this Room */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                        <Bed className="w-3.5 h-3.5 text-teal-600" />
                        <span>Live Bed Occupancy</span>
                      </span>
                      <span className="font-extrabold text-slate-900 text-[11px]">
                        {isMaintenanceToday ? (
                          <span className="text-amber-700 font-extrabold">Under Maintenance</span>
                        ) : isInactiveToday ? (
                          <span className="text-rose-600 font-extrabold">Offline</span>
                        ) : (
                          <>
                            <span className={stat.bookedBeds > 0 ? 'text-teal-700' : 'text-slate-600'}>
                              {stat.bookedBeds}
                            </span>
                            <span className="text-slate-400">/{room.capacity} beds</span>
                            <span className="text-slate-400 ml-1 font-semibold">({stat.occupancyPercent}%)</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Progress Bar Indicator */}
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMaintenanceToday
                            ? 'bg-amber-400'
                            : isInactiveToday
                            ? 'bg-rose-400'
                            : !room.isActive
                            ? 'bg-slate-300'
                            : stat.bookedBeds === room.capacity
                            ? 'bg-rose-500'
                            : stat.occupancyPercent >= 60
                            ? 'bg-amber-500'
                            : stat.bookedBeds > 0
                            ? 'bg-teal-500'
                            : 'bg-emerald-400'
                        }`}
                        style={{
                          width: isMaintenanceToday || isInactiveToday
                            ? '100%'
                            : room.isActive
                            ? `${Math.max(stat.occupancyPercent, stat.bookedBeds > 0 ? 6 : 0)}%`
                            : '0%',
                        }}
                      />
                    </div>

                    {/* Individual Bed Slot Indicators & Availability Badge */}
                    {!isMaintenanceToday && !isInactiveToday && room.isActive && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: room.capacity }).map((_, idx) => {
                            const isBookedSlot = idx < stat.bookedBeds;
                            return (
                              <span
                                key={idx}
                                title={isBookedSlot ? `Bed #${idx + 1}: Booked Today` : `Bed #${idx + 1}: Free Today`}
                                className={`w-3.5 h-2 rounded-xs transition-colors ${
                                  isBookedSlot
                                    ? 'bg-teal-600 shadow-2xs'
                                    : 'bg-white border border-slate-300'
                                }`}
                              />
                            );
                          })}
                        </div>

                        <span
                          className={`font-bold ${
                            stat.availableBeds === 0
                              ? 'text-rose-600'
                              : stat.availableBeds <= 2
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {stat.availableBeds === 0 ? 'Full House' : `${stat.availableBeds} free`}
                        </span>
                      </div>
                    )}

                    {/* Active Bookings vs Total Beds readout */}
                    {!isMaintenanceToday && !isInactiveToday && room.isActive && (
                      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-500">
                        <span>Active Stays:</span>
                        <span className="font-semibold text-slate-800">
                          {roomActiveBookings.length} {roomActiveBookings.length === 1 ? 'active booking' : 'active bookings'} • {stat.bookedBeds}/{room.capacity} beds
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Waitlist Standby Queue Badge if room has queue */}
                {(() => {
                  const roomWaitlist = waitlist.filter(
                    (w) => w.roomId === room.id && (w.status === 'waiting' || w.status === 'notified')
                  );
                  if (roomWaitlist.length === 0 && stat.availableBeds > 0) return null;

                  return (
                    <div className="mx-4 mb-2 p-2 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-between text-[11px] text-amber-900">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {roomWaitlist.length > 0 
                          ? `${roomWaitlist.length} waiting in queue` 
                          : 'Queue open (room fully booked)'}
                      </span>
                      {onAddToWaitlist && (
                        <button
                          type="button"
                          onClick={() => onAddToWaitlist(room.id)}
                          className="px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition-colors"
                        >
                          + Queue
                        </button>
                      )}
                    </div>
                  );
                })()}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-extrabold text-slate-900">
                      {currencySymbol}{room.pricePerNight}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1">/ night</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Maintenance / Inactive Quick Config Tool for this room */}
                    <button
                      type="button"
                      onClick={() => {
                        setBatchModalInitialRooms([room.id]);
                        setIsBatchModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                      title="Set maintenance or inactive status for dates"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>

                    {onAddToWaitlist && stat.availableBeds === 0 && (
                      <button
                        type="button"
                        onClick={() => onAddToWaitlist(room.id)}
                        className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300 flex items-center gap-1 transition-colors"
                        title="Add guest to waitlist queue for this room"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Waitlist</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(room)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Edit space properties"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {canDeleteRoom ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete ${room.name}? This will remove it from the system.`)) {
                            onDeleteRoom(room.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        title="Delete space (Requires Full Control)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                        title="Room deletion requires Full Control (Admin or Super Admin)"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Room Modal */}
      {(editingRoom || isCreating) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
              <h3 className="font-heading font-extrabold text-base text-white">
                {isCreating ? 'Add New Room / Dorm' : `Edit ${formRoom.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingRoom(null);
                  setIsCreating(false);
                }}
                className="text-white hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Room / Dorm Title</label>
                <input
                  type="text"
                  required
                  value={formRoom.name}
                  onChange={(e) => setFormRoom({ ...formRoom, name: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Room Category</label>
                  <select
                    value={formRoom.type}
                    onChange={(e) => {
                      const t = e.target.value as RoomType;
                      let label = 'Shared Dorm';
                      if (t === 'dorm_female') label = 'Female Dorm';
                      if (t === 'private_double') label = 'Private Double';
                      if (t === 'private_suite') label = 'Oceanfront Suite';
                      setFormRoom({ ...formRoom, type: t, typeLabel: label });
                    }}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="dorm_mixed">Mixed Surf Dorm</option>
                    <option value="dorm_female">Female-Only Dorm</option>
                    <option value="private_double">Private Double Room</option>
                    <option value="private_suite">Deluxe Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Capacity (Beds / Guests)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formRoom.capacity}
                    onChange={(e) => setFormRoom({ ...formRoom, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Price per Night ({currencySymbol})</label>
                  <input
                    type="number"
                    min={1}
                    value={formRoom.pricePerNight}
                    onChange={(e) => setFormRoom({ ...formRoom, pricePerNight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Bathroom Type</label>
                  <select
                    value={formRoom.bathroomType}
                    onChange={(e) => setFormRoom({ ...formRoom, bathroomType: e.target.value as any })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="shared">Shared Bathrooms</option>
                    <option value="private_ensuite">Private Ensuite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={formRoom.image}
                  onChange={(e) => setFormRoom({ ...formRoom, image: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formRoom.description}
                  onChange={(e) => setFormRoom({ ...formRoom, description: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2"
                />
              </div>

              {/* Operational Status & Maintenance Blocks */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Operational Status Mode
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Controls whether this space accepts bookings
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRoom({ ...formRoom, status: 'active', isActive: true })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      (formRoom.status === 'active' || (!formRoom.status && formRoom.isActive))
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRoom({ ...formRoom, status: 'maintenance', isActive: false })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      formRoom.status === 'maintenance'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Maintenance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRoom({ ...formRoom, status: 'inactive', isActive: false })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      formRoom.status === 'inactive' || (!formRoom.status && !formRoom.isActive)
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Inactive</span>
                  </button>
                </div>

                {/* Scheduled Maintenance Blocks List for this Room */}
                {formRoom.maintenanceBlocks && formRoom.maintenanceBlocks.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-700">
                      Scheduled Date Blocks ({formRoom.maintenanceBlocks.length}):
                    </p>
                    {formRoom.maintenanceBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {block.status === 'maintenance' ? (
                            <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-800 truncate">
                            {block.startDate} → {block.endDate} ({block.reason || block.status})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormRoom({
                              ...formRoom,
                              maintenanceBlocks: (formRoom.maintenanceBlocks || []).filter(
                                (b) => b.id !== block.id
                              ),
                            });
                          }}
                          className="text-rose-600 hover:text-rose-800 p-1 text-[10px] font-bold"
                          title="Remove this block"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRoom.hasOceanView}
                    onChange={(e) => setFormRoom({ ...formRoom, hasOceanView: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">Ocean View</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRoom.hasAirConditioning}
                    onChange={(e) => setFormRoom({ ...formRoom, hasAirConditioning: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">Air Conditioning</span>
                </label>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoom(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Room Status & Maintenance Modal */}
      <BatchRoomStatusModal
        isOpen={isBatchModalOpen}
        rooms={rooms}
        bookings={bookings}
        initialSelectedRoomIds={batchModalInitialRooms}
        onClose={() => setIsBatchModalOpen(false)}
        onApplyBatch={handleBatchUpdate}
        onShowToast={showToast}
      />
    </div>
  );
};
