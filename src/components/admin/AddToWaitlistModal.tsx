import React, { useState, useMemo } from 'react';
import { X, Clock, Bed, Calendar, User, Phone, Mail, Globe, AlertTriangle, CheckCircle2, Flame, ShieldCheck } from 'lucide-react';
import { Booking, HostelSettings, Room, SurfSkillLevel, WaitlistEntry, WaitlistPriority } from '../../types';
import { addDaysToString, calculateNights, getTodayString } from '../../utils/date';
import { calculateRoomAvailability } from '../../utils/availability';

interface AddToWaitlistModalProps {
  rooms: Room[];
  bookings: Booking[];
  existingWaitlist: WaitlistEntry[];
  settings: HostelSettings;
  initialRoomId?: string;
  initialCheckInDate?: string;
  initialCheckOutDate?: string;
  initialGuest?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    country?: string;
    surfLevel?: SurfSkillLevel;
    notes?: string;
  };
  initialGuestsCount?: number;
  onSave: (entry: WaitlistEntry) => void;
  onClose: () => void;
}

export const AddToWaitlistModal: React.FC<AddToWaitlistModalProps> = ({
  rooms,
  bookings,
  existingWaitlist,
  settings,
  initialRoomId,
  initialCheckInDate,
  initialCheckOutDate,
  initialGuest,
  initialGuestsCount,
  onSave,
  onClose,
}) => {
  const today = getTodayString();
  const [roomId, setRoomId] = useState<string>(initialRoomId || rooms[0]?.id || 'room-1');
  const [checkIn, setCheckIn] = useState<string>(initialCheckInDate || today);
  const [checkOut, setCheckOut] = useState<string>(
    initialCheckOutDate || addDaysToString(initialCheckInDate || today, 3)
  );
  const [guestsCount, setGuestsCount] = useState<number>(initialGuestsCount || 1);
  const [firstName, setFirstName] = useState<string>(initialGuest?.firstName || '');
  const [lastName, setLastName] = useState<string>(initialGuest?.lastName || '');
  const [email, setEmail] = useState<string>(initialGuest?.email || '');
  const [phone, setPhone] = useState<string>(initialGuest?.phone || '');
  const [country, setCountry] = useState<string>(initialGuest?.country || 'Portugal');
  const [surfLevel, setSurfLevel] = useState<SurfSkillLevel>(initialGuest?.surfLevel || 'intermediate');
  const [priority, setPriority] = useState<WaitlistPriority>('normal');
  const [adminNotes, setAdminNotes] = useState<string>(initialGuest?.notes || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedRoom = rooms.find((r) => r.id === roomId) || rooms[0];
  const nights = Math.max(1, calculateNights(checkIn, checkOut));

  // Compute live availability for selected room and dates
  const availability = useMemo(() => {
    if (!selectedRoom) return { availableBeds: 0, bookedBeds: 0, isAvailable: false, occupancyPercent: 100 };
    return calculateRoomAvailability(selectedRoom, checkIn, checkOut, bookings);
  }, [selectedRoom, checkIn, checkOut, bookings]);

  // Compute current waitlist queue position for this room
  const activeRoomQueue = useMemo(() => {
    return existingWaitlist.filter(
      (w) => w.roomId === roomId && (w.status === 'waiting' || w.status === 'notified')
    );
  }, [existingWaitlist, roomId]);

  const nextQueuePosition = activeRoomQueue.length + 1;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First and Last Name are required.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setErrorMessage('Please provide either an email or phone number to notify guest.');
      return;
    }

    const newEntry: WaitlistEntry = {
      id: 'waitlist-' + Date.now(),
      queueNumber: nextQueuePosition,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights,
      guestsCount,
      guest: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        surfLevel,
        notes: adminNotes.trim() || undefined,
      },
      priority,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      adminNotes: adminNotes.trim() || undefined,
    };

    onSave(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-white">
                Add Guest to Room Waitlist
              </h3>
              <p className="text-xs text-slate-400">
                Place guest in priority standby queue when rooms are fully booked
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Room Selection & Dynamic Availability Indicator */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Target Room / Space
              </label>
              <div className="relative">
                <select
                  id="waitlist-room-select"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.typeLabel} - Cap: {r.capacity} {r.type.startsWith('dorm') ? 'beds' : 'guests'}) - {settings.currencySymbol}{r.pricePerNight}/nt
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates Picker */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Requested Check-in
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="waitlist-checkin-date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Requested Check-out
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="waitlist-checkout-date"
                    value={checkOut}
                    min={addDaysToString(checkIn, 1)}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Live Availability Status Card (Triggered by Availability Engine) */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              availability.availableBeds === 0
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    availability.availableBeds === 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                  }`} />
                  <div>
                    <span className="font-extrabold text-xs">
                      {availability.availableBeds === 0 
                        ? '100% Fully Booked on Selected Dates'
                        : `${availability.availableBeds} of ${selectedRoom.capacity} Beds Currently Open`
                      }
                    </span>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {availability.availableBeds === 0
                        ? `Target room has 0 openings. Guest will be assigned Queue Position #${nextQueuePosition}.`
                        : `Room has availability! You can still add to waitlist or book directly.`
                      }
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/80 border border-current shadow-2xs">
                    Queue Position #{nextQueuePosition}
                  </span>
                  <div className="text-[10px] opacity-75 mt-0.5">
                    {activeRoomQueue.length} ahead in line
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guests & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Number of Guests
              </label>
              <input
                type="number"
                min={1}
                max={selectedRoom.capacity}
                value={guestsCount}
                onChange={(e) => setGuestsCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Queue Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WaitlistPriority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="normal">Normal (Standard First-Come)</option>
                <option value="high">High (Longer stay or lesson)</option>
                <option value="vip">VIP (Returning guest / Partner)</option>
              </select>
            </div>
          </div>

          {/* Guest Contact Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-heading font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              Guest Contact Information
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Liam"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Miller"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  WhatsApp / Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="351912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Country of Residence
                </label>
                <input
                  type="text"
                  placeholder="e.g. Germany"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Surf Experience Level
                </label>
                <select
                  value={surfLevel}
                  onChange={(e) => setSurfLevel(e.target.value as SurfSkillLevel)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="beginner">Beginner (First waves / foam board)</option>
                  <option value="intermediate">Intermediate (Paddling out / green waves)</option>
                  <option value="advanced">Advanced (Reef breaks / point breaks)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Admin Notes & Queue Context
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Flexible on dates by +/- 1 day, wants to book surf lessons if bed opens..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-waitlist-entry"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Add to Room Queue (#{nextQueuePosition})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
