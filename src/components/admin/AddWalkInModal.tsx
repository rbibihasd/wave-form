import React, { useState } from 'react';
import { X, Plus, Calendar, Bed, User, Phone, Mail, Clock } from 'lucide-react';
import { Booking, HostelSettings, Room, SelectedAddOn, SurfAddOn, SurfSkillLevel } from '../../types';
import { calculateNights, getTodayString, addDaysToString } from '../../utils/date';
import { canAccommodateGuests } from '../../utils/availability';

interface AddWalkInModalProps {
  rooms: Room[];
  addOns: SurfAddOn[];
  bookings: Booking[];
  settings: HostelSettings;
  initialRoomId?: string;
  initialCheckInDate?: string;
  initialCheckOutDate?: string;
  onSave: (newBooking: Booking) => void;
  onClose: () => void;
  onAddToWaitlist?: (entryData: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
    guest: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      country: string;
      surfLevel: SurfSkillLevel;
      notes?: string;
    };
  }) => void;
}

export const AddWalkInModal: React.FC<AddWalkInModalProps> = ({
  rooms,
  addOns,
  bookings,
  settings,
  initialRoomId,
  initialCheckInDate,
  initialCheckOutDate,
  onSave,
  onClose,
  onAddToWaitlist,
}) => {
  const today = getTodayString();
  const [checkIn, setCheckIn] = useState(initialCheckInDate || today);
  const [checkOut, setCheckOut] = useState(initialCheckOutDate || addDaysToString(initialCheckInDate || today, 3));
  const [roomId, setRoomId] = useState(initialRoomId || rooms[0]?.id || 'room-1');
  const [guestsCount, setGuestsCount] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Walk-in');
  const [surfLevel, setSurfLevel] = useState<SurfSkillLevel>('intermediate');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'deposit' | 'pending' | 'unpaid'>('paid');
  const [adminNotes, setAdminNotes] = useState('Front desk walk-in reservation');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nights = calculateNights(checkIn, checkOut);
  const selectedRoom = rooms.find((r) => r.id === roomId) || rooms[0];

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First and Last Name are required.');
      return;
    }

    // Availability check
    const check = canAccommodateGuests(
      selectedRoom,
      guestsCount,
      checkIn,
      checkOut,
      bookings
    );

    if (!check.canBook) {
      setErrorMessage(check.reason || 'Room is unavailable on these dates.');
      return;
    }

    const isDorm = selectedRoom.type.startsWith('dorm');
    const roomSubtotal = selectedRoom.pricePerNight * nights * (isDorm ? guestsCount : 1);

    const formattedAddOns: SelectedAddOn[] = selectedAddOnIds.map((id) => {
      const def = addOns.find((a) => a.id === id);
      return {
        addOnId: id,
        quantity: 1,
        days: def?.billingType === 'per_day' ? nights : 1,
      };
    });

    const addOnsSubtotal = formattedAddOns.reduce((sum, sel) => {
      const def = addOns.find((a) => a.id === sel.addOnId);
      if (!def) return sum;
      if (def.billingType === 'per_day') {
        return sum + def.price * sel.quantity * (sel.days || nights);
      }
      return sum + def.price * sel.quantity;
    }, 0);

    const taxAmount = (roomSubtotal + addOnsSubtotal) * (settings.taxRatePercent / 100);
    const totalAmount = roomSubtotal + addOnsSubtotal + taxAmount;

    const newBooking: Booking = {
      id: 'booking-' + Date.now(),
      referenceNumber: 'WH-' + Math.floor(1000 + Math.random() * 9000),
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights,
      guestsCount,
      guest: {
        firstName,
        lastName,
        email: email || `${firstName.toLowerCase()}@walkin.surf`,
        phone: phone || '+351900000000',
        country,
        surfLevel,
      },
      addOns: formattedAddOns,
      roomSubtotal,
      addOnsSubtotal,
      taxAmount,
      totalAmount,
      status: 'confirmed',
      paymentStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNotes,
      whatsappSentCount: 0,
      webhookSentCount: 0,
    };

    onSave(newBooking);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-heading font-extrabold text-white">
              Create Walk-in / Phone Reservation
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {errorMessage && (
            <div className="bg-rose-50 text-rose-800 p-3.5 rounded-2xl border border-rose-200 font-semibold space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span>{errorMessage}</span>
              </div>
              {onAddToWaitlist && (
                <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-rose-700 font-normal">
                    Would you like to queue this guest on standby?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onAddToWaitlist({
                        roomId: selectedRoom.id,
                        checkIn,
                        checkOut,
                        guestsCount,
                        guest: {
                          firstName,
                          lastName,
                          email,
                          phone,
                          country,
                          surfLevel,
                          notes: adminNotes,
                        },
                      });
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-600/20"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Add to Waitlist Queue Instead</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dates & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Guests</label>
              <input
                type="number"
                min={1}
                max={6}
                value={guestsCount}
                onChange={(e) => setGuestsCount(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Select Room / Bed</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({settings.currencySymbol}{r.pricePerNight}/night • Cap: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Guest info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">First Name *</label>
              <input
                type="text"
                required
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Last Name *</label>
              <input
                type="text"
                required
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="guest@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">WhatsApp Phone</label>
              <input
                type="text"
                placeholder="+351 912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
              />
            </div>
          </div>

          {/* Add-ons */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Surf & Camp Add-ons</label>
            <div className="grid grid-cols-2 gap-2">
              {addOns.map((addOn) => (
                <button
                  key={addOn.id}
                  type="button"
                  onClick={() => toggleAddOn(addOn.id)}
                  className={`p-2 rounded-xl border text-left flex items-center justify-between text-[11px] ${
                    selectedAddOnIds.includes(addOn.id)
                      ? 'bg-teal-50 border-teal-500 font-bold text-teal-900'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="truncate">{addOn.name}</span>
                  <span className="font-semibold">{settings.currencySymbol}{addOn.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
              >
                <option value="paid">Paid in Full</option>
                <option value="deposit">Deposit Paid</option>
                <option value="unpaid">Unpaid / Cash on arrival</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Surf Skill Level</label>
              <select
                value={surfLevel}
                onChange={(e) => setSurfLevel(e.target.value as any)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="non_surfer">Non-Surfer</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
            >
              Create Walk-in Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
