import React, { useState } from 'react';
import { 
  Check, AlertCircle, Sparkles, Wind, Eye, Users, Bed, Bath, 
  ArrowLeft, Calendar, SlidersHorizontal, RotateCcw, Home, QrCode, Camera
} from 'lucide-react';
import { Booking, HostelSettings, Room } from '../../types';
import { canAccommodateGuests } from '../../utils/availability';
import { formatDisplayDate } from '../../utils/date';

export type RoomTypeFilter = 'all' | 'dorm' | 'private' | 'suite';
export type CapacityFilter = 'all' | '1-2' | '3-4' | '5+';

interface StepRoomsProps {
  rooms: Room[];
  bookings: Booking[];
  selectedRoomId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
  settings: HostelSettings;
  onSelectRoom: (roomId: string) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenScanner?: () => void;
}

export const StepRooms: React.FC<StepRoomsProps> = ({
  rooms,
  bookings,
  selectedRoomId,
  checkIn,
  checkOut,
  nights,
  guestsCount,
  settings,
  onSelectRoom,
  onNext,
  onBack,
  onOpenScanner,
}) => {
  const [filterType, setFilterType] = useState<RoomTypeFilter>('all');
  const [filterCapacity, setFilterCapacity] = useState<CapacityFilter>('all');

  const isDormRoom = (r: Room) => 
    r.type.startsWith('dorm') || r.typeLabel.toLowerCase().includes('dorm');

  const isSuiteRoom = (r: Room) => 
    r.type === 'private_suite' || 
    r.type.toLowerCase().includes('suite') || 
    r.name.toLowerCase().includes('suite') || 
    r.typeLabel.toLowerCase().includes('suite');

  const isPrivateRoom = (r: Room) => 
    (r.type.startsWith('private') || r.typeLabel.toLowerCase().includes('private')) && !isSuiteRoom(r);

  const matchesCapacity = (r: Room, cap: CapacityFilter) => {
    if (cap === 'all') return true;
    if (cap === '1-2') return r.capacity <= 2;
    if (cap === '3-4') return r.capacity >= 3 && r.capacity <= 4;
    if (cap === '5+') return r.capacity >= 5;
    return true;
  };

  const matchesType = (r: Room, type: RoomTypeFilter) => {
    if (type === 'all') return true;
    if (type === 'dorm') return isDormRoom(r);
    if (type === 'private') return isPrivateRoom(r);
    if (type === 'suite') return isSuiteRoom(r);
    return true;
  };

  const activeRooms = rooms.filter((r) => r.isActive);

  // Dynamic counts for each filter button
  const dormCount = activeRooms.filter(isDormRoom).length;
  const suiteCount = activeRooms.filter(isSuiteRoom).length;
  const privateCount = activeRooms.filter(isPrivateRoom).length;

  const cap1_2Count = activeRooms.filter((r) => r.capacity <= 2).length;
  const cap3_4Count = activeRooms.filter((r) => r.capacity >= 3 && r.capacity <= 4).length;
  const cap5PlusCount = activeRooms.filter((r) => r.capacity >= 5).length;

  const filteredRooms = activeRooms.filter((r) => {
    return matchesType(r, filterType) && matchesCapacity(r, filterCapacity);
  });

  const handleToggleType = (type: RoomTypeFilter) => {
    setFilterType((prev) => (prev === type ? 'all' : type));
  };

  const handleToggleCapacity = (cap: CapacityFilter) => {
    setFilterCapacity((prev) => (prev === cap ? 'all' : cap));
  };

  const handleResetFilters = () => {
    setFilterType('all');
    setFilterCapacity('all');
  };

  const hasActiveFilter = filterType !== 'all' || filterCapacity !== 'all';
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const isSelectedRoomHidden = selectedRoom && !filteredRooms.some((r) => r.id === selectedRoom.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Decorated Date Range Summary Bar */}
      <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-slate-50 rounded-2xl p-3.5 border border-teal-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-2xs">
            <Calendar className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">
                {formatDisplayDate(checkIn)} → {formatDisplayDate(checkOut)}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-600 text-white shadow-2xs">
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>
            <span className="text-[11px] text-teal-800 font-semibold">
              Hostel check-in from {settings.checkInTime} • Check-out by {settings.checkOutTime} • {guestsCount} {guestsCount === 1 ? 'Guest' : 'Guests'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-teal-800 font-bold border border-teal-300 transition-colors shadow-2xs text-xs flex items-center gap-1"
        >
          <span>Modify Dates</span>
        </button>
      </div>

      {/* Header & Filter Controls Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
            Choose Your Surf House Stay
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time bed availability verified for {nights} night{nights > 1 ? 's' : ''} ({guestsCount} guest{guestsCount > 1 ? 's' : ''}).
          </p>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            id="btn-reset-room-filters"
            onClick={handleResetFilters}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/80 px-3 py-1.5 rounded-xl border border-teal-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto touch-manipulation shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Control Bar: Room Type & Capacity Buttons */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Filter Spaces
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Showing <strong className="text-slate-900">{filteredRooms.length}</strong> of {activeRooms.length} available
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Room Type Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-slate-400" />
                <span>Room Type</span>
              </span>
              {filterType !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                id="btn-filter-type-all"
                onClick={() => handleToggleType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center gap-1.5 touch-manipulation ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs ring-1 ring-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
              >
                <span>All Types</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterType === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {activeRooms.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-filter-type-dorm"
                onClick={() => handleToggleType('dorm')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 touch-manipulation ${
                  filterType === 'dorm'
                    ? 'bg-teal-600 text-white shadow-2xs ring-1 ring-teal-600'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
              >
                <Bed className="w-3.5 h-3.5" />
                <span>Dorm</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterType === 'dorm' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {dormCount}
                </span>
              </button>

              <button
                type="button"
                id="btn-filter-type-private"
                onClick={() => handleToggleType('private')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 touch-manipulation ${
                  filterType === 'private'
                    ? 'bg-teal-600 text-white shadow-2xs ring-1 ring-teal-600'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Private</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterType === 'private' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {privateCount}
                </span>
              </button>

              <button
                type="button"
                id="btn-filter-type-suite"
                onClick={() => handleToggleType('suite')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 touch-manipulation ${
                  filterType === 'suite'
                    ? 'bg-teal-600 text-white shadow-2xs ring-1 ring-teal-600'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Suite</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterType === 'suite' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {suiteCount}
                </span>
              </button>
            </div>
          </div>

          {/* Capacity Filter Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Capacity / Guests</span>
              </span>
              {filterCapacity !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterCapacity('all')}
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                id="btn-filter-cap-all"
                onClick={() => handleToggleCapacity('all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 touch-manipulation ${
                  filterCapacity === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs ring-1 ring-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
              >
                <span>Any Capacity</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterCapacity === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {activeRooms.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-filter-cap-1-2"
                onClick={() => handleToggleCapacity('1-2')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 touch-manipulation ${
                  filterCapacity === '1-2'
                    ? 'bg-teal-600 text-white shadow-2xs ring-1 ring-teal-600'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
              >
                <span>1–2 Guests</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterCapacity === '1-2' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cap1_2Count}
                </span>
              </button>

              <button
                type="button"
                id="btn-filter-cap-3-4"
                onClick={() => handleToggleCapacity('3-4')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 touch-manipulation ${
                  filterCapacity === '3-4'
                    ? 'bg-teal-600 text-white shadow-2xs ring-1 ring-teal-600'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
              >
                <span>3–4 Guests</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterCapacity === '3-4' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cap3_4Count}
                </span>
              </button>

              <button
                type="button"
                id="btn-filter-cap-5+"
                onClick={() => handleToggleCapacity('5+')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center gap-1.5 touch-manipulation ${
                  filterCapacity === '5+'
                    ? 'bg-teal-600 text-white shadow-2xs ring-1 ring-teal-600'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
              >
                <span>5+ Guests</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterCapacity === '5+' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cap5PlusCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notice if selected room is currently hidden by active filter */}
      {isSelectedRoomHidden && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 px-4 text-xs flex items-center justify-between gap-3 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Your selected room (<strong>{selectedRoom?.name}</strong>) is currently filtered out of view.
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="font-bold underline hover:text-amber-950 shrink-0"
          >
            Show Selected Room
          </button>
        </div>
      )}

      {/* Empty State when no rooms match */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h4 className="font-heading font-extrabold text-base text-slate-900 mb-1">
            No Spaces Match Your Filters
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
            There are no {filterType !== 'all' ? `${filterType} ` : ''}spaces matching {filterCapacity !== 'all' ? `${filterCapacity} guests ` : ''}capacity. Try clearing or broadening your selection.
          </p>
          <button
            type="button"
            id="btn-empty-reset-filters"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        /* Rooms Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRooms.map((room) => {
            const accommodationCheck = canAccommodateGuests(
              room,
              guestsCount,
              checkIn,
              checkOut,
              bookings
            );

            const isSelected = selectedRoomId === room.id;
            const isDorm = room.type.startsWith('dorm');
            const totalPrice = room.pricePerNight * nights * (isDorm ? guestsCount : 1);

            return (
              <div
                key={room.id}
                id={`room-card-${room.id}`}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between bg-white relative ${
                  isSelected
                    ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                } ${!accommodationCheck.canBook ? 'opacity-70 bg-slate-50/70' : ''}`}
              >
                {/* Image & Badges */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden group">
                  <img
                    src={room.image}
                    alt={room.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                      {room.typeLabel}
                    </span>
                    {room.hasOceanView && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-600/90 backdrop-blur-md text-white flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Ocean View
                      </span>
                    )}
                    {room.hasAirConditioning && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-600/90 backdrop-blur-md text-white flex items-center gap-1">
                        <Wind className="w-3 h-3" />
                        AC
                      </span>
                    )}
                  </div>

                  {/* Live Real-Time Availability Pill */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    {accommodationCheck.canBook ? (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 ${
                          isDorm && accommodationCheck.availableBeds <= 2
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-emerald-600/90 text-white'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isDorm
                          ? `${accommodationCheck.availableBeds} of ${room.capacity} beds available`
                          : 'Available for your dates'}
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-600/90 text-white flex items-center gap-1.5 backdrop-blur-md">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {accommodationCheck.reason || 'Not available'}
                      </span>
                    )}

                    <span className="text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Up to {room.capacity}
                    </span>
                  </div>
                </div>

                {/* Room Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-heading font-extrabold text-lg text-slate-900 leading-snug">
                        {room.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {room.shortDescription}
                    </p>

                    {/* Bed & Bath Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{room.bedType}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="capitalize">
                          {room.bathroomType === 'private_ensuite' ? 'Private Ensuite' : 'Shared Bathrooms'}
                        </span>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {room.amenities.slice(0, 4).map((amenity, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                        >
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 4 && (
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">
                          +{room.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Selection Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-heading font-black text-slate-900">
                          {settings.currencySymbol}{room.pricePerNight}
                        </span>
                        <span className="text-xs text-slate-500">
                          / night {isDorm ? 'per bed' : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Total: {settings.currencySymbol}{totalPrice} ({nights} nights)
                      </p>
                    </div>

                    <button
                      type="button"
                      id={`btn-select-room-${room.id}`}
                      disabled={!accommodationCheck.canBook}
                      onClick={() => onSelectRoom(room.id)}
                      className={`px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 shrink-0 ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                          : accommodationCheck.canBook
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </>
                      ) : accommodationCheck.canBook ? (
                        'Select Room'
                      ) : (
                        'Unavailable'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto min-h-[48px] h-12 px-5 py-3 rounded-xl border border-slate-200 sm:border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors order-2 sm:order-1 touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Dates / Guests</span>
        </button>

        <button
          type="button"
          id="btn-step2-next"
          disabled={!selectedRoomId}
          onClick={onNext}
          className="w-full sm:w-auto min-h-[48px] h-12 px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 touch-manipulation active:scale-[0.99]"
        >
          <span>Continue to Surf Add-ons</span>
          <span className="text-base font-bold">→</span>
        </button>
      </div>

      {/* Floating Action Button: Quick QR Scanner for Existing Reservations */}
      <aside
        aria-label="Reservation QR Scanner"
        className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <button
          type="button"
          id="fab-scan-reservation-qr"
          onClick={() => {
            if (onOpenScanner) {
              onOpenScanner();
            }
          }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-teal-400/40 ring-4 ring-black/5 touch-manipulation focus:outline-none focus:ring-4 focus:ring-teal-500/30 group cursor-pointer"
          aria-label="Scan booking QR code with camera to view reservation details"
          title="Have an existing booking? Scan your QR code with camera to quickly jump to your reservation details"
        >
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 group-hover:bg-teal-500/30 transition-colors">
            <QrCode className="w-4 h-4" />
            <Camera className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-teal-400 bg-slate-900 rounded-full p-0.2" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-tight">
              Scan Booking QR
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-[10px] text-teal-300/90 font-medium leading-none">
              Jump to reservation
            </span>
          </div>
        </button>
      </aside>
    </div>
  );
};
