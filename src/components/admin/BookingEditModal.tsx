import React, { useState } from 'react';
import { X, Save, Calendar, User, Phone, Mail, DollarSign, Bed, Sparkles, FileText } from 'lucide-react';
import { Booking, BookingStatus, PaymentStatus, Room, SelectedAddOn, SurfAddOn, SurfSkillLevel } from '../../types';
import { calculateNights } from '../../utils/date';

interface BookingEditModalProps {
  booking: Booking;
  rooms: Room[];
  addOns: SurfAddOn[];
  currencySymbol: string;
  onSave: (updated: Booking) => void;
  onClose: () => void;
}

export const BookingEditModal: React.FC<BookingEditModalProps> = ({
  booking,
  rooms,
  addOns,
  currencySymbol,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Booking>({ ...booking });

  const handleDateChange = (newCheckIn: string, newCheckOut: string) => {
    const nights = calculateNights(newCheckIn, newCheckOut);
    const room = rooms.find((r) => r.id === formData.roomId);
    const isDorm = room?.type.startsWith('dorm');
    const roomSubtotal = room ? room.pricePerNight * nights * (isDorm ? formData.guestsCount : 1) : formData.roomSubtotal;
    
    // Recalculate total
    const totalAmount = roomSubtotal + formData.addOnsSubtotal + formData.taxAmount;

    setFormData((prev) => ({
      ...prev,
      checkInDate: newCheckIn,
      checkOutDate: newCheckOut,
      nights,
      roomSubtotal,
      totalAmount,
    }));
  };

  const handleRoomChange = (newRoomId: string) => {
    const room = rooms.find((r) => r.id === newRoomId);
    if (!room) return;
    const isDorm = room.type.startsWith('dorm');
    const roomSubtotal = room.pricePerNight * formData.nights * (isDorm ? formData.guestsCount : 1);
    const totalAmount = roomSubtotal + formData.addOnsSubtotal + formData.taxAmount;

    setFormData((prev) => ({
      ...prev,
      roomId: room.id,
      roomName: room.name,
      roomSubtotal,
      totalAmount,
    }));
  };

  const handleToggleAddOn = (addOnId: string) => {
    const exists = formData.addOns.some((a) => a.addOnId === addOnId);
    let updatedAddOns: SelectedAddOn[];
    if (exists) {
      updatedAddOns = formData.addOns.filter((a) => a.addOnId !== addOnId);
    } else {
      updatedAddOns = [...formData.addOns, { addOnId, quantity: 1, days: formData.nights }];
    }

    // Recompute addOnsSubtotal
    const addOnsSubtotal = updatedAddOns.reduce((sum, sel) => {
      const def = addOns.find((a) => a.id === sel.addOnId);
      if (!def) return sum;
      if (def.billingType === 'per_day') {
        return sum + def.price * sel.quantity * (sel.days || formData.nights);
      }
      return sum + def.price * sel.quantity;
    }, 0);

    const totalAmount = formData.roomSubtotal + addOnsSubtotal + formData.taxAmount;

    setFormData((prev) => ({
      ...prev,
      addOns: updatedAddOns,
      addOnsSubtotal,
      totalAmount,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Full Booking Editor
              </span>
              <span className="text-xs text-slate-400 font-mono">
                #{formData.referenceNumber}
              </span>
            </div>
            <h3 className="text-lg font-heading font-extrabold text-white mt-1">
              Modify Booking Details
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Status & Payment Status Controls */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Booking Status
              </label>
              <select
                id="edit-booking-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BookingStatus })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-teal-500"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending Confirmation</option>
                <option value="checked_in">Checked In (Active)</option>
                <option value="checked_out">Checked Out (Completed)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Payment Status
              </label>
              <select
                id="edit-payment-status"
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-teal-500"
              >
                <option value="paid">Paid in Full</option>
                <option value="deposit">Deposit Paid</option>
                <option value="pending">Pending Payment</option>
                <option value="unpaid">Unpaid / At Arrival</option>
              </select>
            </div>
          </div>

          {/* Dates & Room Selection */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              Stay & Room Allocation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Check-in Date</label>
                <input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => handleDateChange(e.target.value, formData.checkOutDate)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Check-out Date</label>
                <input
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e) => handleDateChange(formData.checkInDate, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Guests Count</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.guestsCount}
                  onChange={(e) => {
                    const count = Math.max(1, parseInt(e.target.value) || 1);
                    setFormData({ ...formData, guestsCount: count });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-teal-600" />
                Assigned Room / Dorm
              </label>
              <select
                value={formData.roomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({currencySymbol}{r.pricePerNight}/night • Cap: {r.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Guest Personal Information */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              Guest Contact Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.guest.firstName}
                  onChange={(e) => setFormData({
                    ...formData,
                    guest: { ...formData.guest, firstName: e.target.value }
                  })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.guest.lastName}
                  onChange={(e) => setFormData({
                    ...formData,
                    guest: { ...formData.guest, lastName: e.target.value }
                  })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-teal-600" /> Email
                </label>
                <input
                  type="email"
                  value={formData.guest.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    guest: { ...formData.guest, email: e.target.value }
                  })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-teal-600" /> WhatsApp Number
                </label>
                <input
                  type="text"
                  value={formData.guest.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    guest: { ...formData.guest, phone: e.target.value }
                  })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Country / Nationality</label>
                <input
                  type="text"
                  value={formData.guest.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    guest: { ...formData.guest, country: e.target.value }
                  })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Surf Skill Level</label>
                <select
                  value={formData.guest.surfLevel}
                  onChange={(e) => setFormData({
                    ...formData,
                    guest: { ...formData.guest, surfLevel: e.target.value as SurfSkillLevel }
                  })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="non_surfer">Non-Surfer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Arrival Time & Special Requests</label>
              <textarea
                rows={2}
                value={formData.guest.specialRequests || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  guest: { ...formData.guest, specialRequests: e.target.value }
                })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Add-ons Selector */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Surf & Stay Add-ons
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {addOns.map((addOn) => {
                const isSelected = formData.addOns.some((a) => a.addOnId === addOn.id);
                return (
                  <button
                    key={addOn.id}
                    type="button"
                    onClick={() => handleToggleAddOn(addOn.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isSelected ? 'border-teal-500 bg-teal-50/50 text-teal-900 font-bold' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span className="truncate">{addOn.name}</span>
                    <span className="text-[11px] font-semibold text-slate-500 shrink-0 ml-2">
                      {currencySymbol}{addOn.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Financial & Price Overrides */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-teal-600" />
              Financial Breakdown & Overrides
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Room Subtotal</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.roomSubtotal}
                  onChange={(e) => {
                    const sub = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      roomSubtotal: sub,
                      totalAmount: sub + formData.addOnsSubtotal + formData.taxAmount,
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Add-ons Subtotal</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.addOnsSubtotal}
                  onChange={(e) => {
                    const sub = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      addOnsSubtotal: sub,
                      totalAmount: formData.roomSubtotal + sub + formData.taxAmount,
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-teal-500 rounded-xl px-3 py-1.5 text-xs font-bold text-teal-700"
                />
              </div>
            </div>
          </div>

          {/* Admin Private Notes */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-teal-600" />
              Internal Admin Notes (Housekeeping & Staff)
            </label>
            <input
              type="text"
              placeholder="e.g. VIP guest, lent wetsuit #4, airport transfer pickup assigned"
              value={formData.adminNotes || ''}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-teal-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
