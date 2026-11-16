import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageCircle, Edit, Trash2, Send, CheckCheck, 
  Calendar, Bed, Sparkles, MapPin, Phone, Mail, Clock,
  CreditCard, ShieldCheck, ChevronRight, FileText, QrCode,
  AlertOctagon, AlertTriangle, Check, RotateCcw, Crown, Award
} from 'lucide-react';
import { Booking, BookingStatus, HostelSettings } from '../../types';
import { formatDisplayDate, getStayUrgencyBadge } from '../../utils/date';
import { getAutoCancelTimeRemaining, isBookingEligibleForAutoCancel } from '../../utils/autoCancellation';
import { 
  GuestLoyaltyMatch, 
  getGuestLoyaltyInfo, 
  getLoyaltyStatusBadgeStyle,
  formatLoyaltyStatusLabel
} from '../../utils/guestLoyalty';

interface BookingCardProps {
  booking: Booking;
  index: number;
  settings: HostelSettings;
  getStatusBadge: (status: BookingStatus) => React.ReactNode;
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
  onSendWhatsAppVoucher: (booking: Booking) => void;
  onSendUpcomingReminder: (booking: Booking) => void;
  onDispatchWebhook: (booking: Booking) => void;
  onViewInvoice?: (booking: Booking) => void;
  isSelected?: boolean;
  onToggleSelect?: (bookingId: string) => void;
  loyaltyInfo?: GuestLoyaltyMatch;
  phoneMatchMap?: Map<string, Booking[]>;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  index,
  settings,
  getStatusBadge,
  onEdit,
  onDelete,
  onSendWhatsAppVoucher,
  onSendUpcomingReminder,
  onDispatchWebhook,
  onViewInvoice,
  isSelected = false,
  onToggleSelect,
  loyaltyInfo,
  phoneMatchMap,
}) => {
  const urgency = getStayUrgencyBadge(booking.checkInDate);
  const brandColor = settings.primaryBrandColor || '#0d9488';

  // Compute loyalty match if not precomputed
  const loyalty: GuestLoyaltyMatch = loyaltyInfo || (
    phoneMatchMap 
      ? getGuestLoyaltyInfo(booking, phoneMatchMap)
      : {
          isReturning: booking.guest?.loyaltyStatus === 'returning' || booking.guest?.loyaltyStatus === 'vip',
          matchedByPhone: false,
          stayCount: 1,
          matchingBookings: [],
          loyaltyStatus: booking.guest?.loyaltyStatus || 'new',
          loyaltyLabel: formatLoyaltyStatusLabel(booking.guest?.loyaltyStatus),
        }
  );

  const loyaltyBadgeStyle = getLoyaltyStatusBadgeStyle(loyalty.loyaltyStatus);

  const initials = `${booking.guest.firstName?.[0] || ''}${booking.guest.lastName?.[0] || ''}`.toUpperCase();

  return (
    <motion.div
      layout
      id={`booking-card-${booking.id}`}
      variants={{
        hidden: { 
          opacity: 0, 
          y: 24, 
          scale: 0.96 
        },
        visible: (i: number) => ({
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            delay: Math.min(i * 0.05, 0.4),
            duration: 0.4,
            type: 'spring',
            stiffness: 280,
            damping: 24,
          },
        }),
        exit: { 
          opacity: 0, 
          scale: 0.94, 
          y: -10,
          transition: { duration: 0.2 } 
        },
      }}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      whileHover={{ 
        y: -3,
        boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.08), 0 4px 8px -4px rgba(0, 0, 0, 0.04)',
        transition: { duration: 0.2 } 
      }}
      className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden group ${
        isSelected
          ? 'bg-teal-50/20 border-teal-500 ring-2 ring-teal-500/30 shadow-md'
          : 'bg-white border-slate-200/90 shadow-2xs hover:border-teal-400/80'
      }`}
    >
      {/* Card Header */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Guest Identity, Selection Checkbox & Initials Avatar */}
          <div className="flex items-center gap-2.5 min-w-0">
            {onToggleSelect && (
              <button
                type="button"
                id={`card-select-${booking.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(booking.id);
                }}
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                    : 'bg-white border-slate-300 text-transparent hover:border-teal-500'
                }`}
                title={isSelected ? `Deselect reservation #${booking.referenceNumber}` : `Select reservation #${booking.referenceNumber} for bulk action`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}

            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: brandColor }}
            >
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 truncate">
                  {booking.guest.firstName} {booking.guest.lastName}
                </h4>

                {/* Returning Guest Badge whenever matched by phone number or marked returning */}
                {loyalty.isReturning && (
                  <span
                    id={`card-returning-badge-${booking.id}`}
                    title={
                      loyalty.matchedByPhone
                        ? `Returning guest profile matched by phone (${booking.guest.phone}) • ${loyalty.stayCount} reservations on record`
                        : `Returning guest profile (${loyalty.loyaltyLabel})`
                    }
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300/80 shadow-2xs shrink-0"
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                    <span>Returning Guest</span>
                    {loyalty.stayCount > 1 && (
                      <span className="text-amber-700 font-mono text-[9px] font-bold">
                        ({loyalty.stayCount}x)
                      </span>
                    )}
                  </span>
                )}

                {/* Loyalty Tier Badge if VIP or Local Legend */}
                {loyalty.loyaltyStatus && (loyalty.loyaltyStatus === 'vip' || loyalty.loyaltyStatus === 'local_legend') && (
                  <span
                    id={`card-tier-badge-${booking.id}`}
                    title={`Guest Loyalty Status: ${loyalty.loyaltyLabel}`}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 border ${loyaltyBadgeStyle.bg} ${loyaltyBadgeStyle.text} ${loyaltyBadgeStyle.border}`}
                  >
                    <Crown className="w-2.5 h-2.5 shrink-0" />
                    <span>{loyalty.loyaltyStatus.replace('_', ' ')}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/70">
                  #{booking.referenceNumber}
                </span>

                {booking.guest.country && (
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{booking.guest.country}</span>
                  </span>
                )}

                {booking.guest.phone && (
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 text-slate-400" />
                    <span>{booking.guest.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Booking Status Badge */}
          <div className="shrink-0">
            {getStatusBadge(booking.status)}
          </div>
        </div>

        {/* Room & Stay Timeline Banner */}
        <div className="mt-3.5 p-3 rounded-2xl bg-slate-50/90 border border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
              <Bed className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="truncate">{booking.roomName}</span>
            </span>

            <span className="text-[11px] font-semibold text-slate-500 shrink-0 ml-2">
              {booking.nights} night{booking.nights > 1 ? 's' : ''} • {booking.guestsCount} guest{booking.guestsCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formatDisplayDate(booking.checkInDate)}</span>
            </span>
            <span className="text-slate-300 font-bold">→</span>
            <span>{formatDisplayDate(booking.checkOutDate)}</span>
          </div>
        </div>

        {/* Urgency & Surf Badges */}
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Urgency Badge */}
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                urgency.color === 'urgent'
                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                  : urgency.color === 'warning'
                  ? 'bg-amber-100 text-amber-800'
                  : urgency.color === 'info'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{urgency.label}</span>
            </span>

            {booking.stayReminderSent && (
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 flex items-center gap-1">
                <CheckCheck className="w-3 h-3" />
                <span>Alerted</span>
              </span>
            )}
          </div>

          {/* Guest Loyalty & Surf Skill Level */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {booking.guest.loyaltyStatus && (
              <span
                id={`card-loyalty-tier-${booking.id}`}
                title={`Loyalty status: ${loyalty.loyaltyLabel}`}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize flex items-center gap-1 ${loyaltyBadgeStyle.bg} ${loyaltyBadgeStyle.text} ${loyaltyBadgeStyle.border}`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>{loyalty.loyaltyLabel}</span>
              </span>
            )}

            {/* Surf Skill Level */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200/60 capitalize">
              🏄 {booking.guest.surfLevel.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Add-ons tag teaser if any */}
        {booking.addOns && booking.addOns.length > 0 && (
          <div className="mt-2 text-[11px] text-teal-700 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-500 shrink-0" />
            <span>{booking.addOns.length} surf/hospitality add-on{booking.addOns.length > 1 ? 's' : ''} included</span>
          </div>
        )}

        {/* Admin notes preview if present */}
        {booking.adminNotes && (
          <p className="mt-2 text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded-xl border border-amber-100 line-clamp-1">
            "{booking.adminNotes}"
          </p>
        )}

        {/* Cancellation Reason Badge */}
        {booking.status === 'cancelled' && booking.cancellationReason && (
          <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-[11px] font-semibold flex items-start gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span>{booking.cancellationReason}</span>
              {booking.autoCancelledAt && (
                <span className="block text-[10px] text-rose-500 font-normal mt-0.5">
                  Processed on {new Date(booking.autoCancelledAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Deposit Auto-Cancel Grace Window Pill for Active Unpaid Bookings */}
        {booking.status !== 'cancelled' && 
         (booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'pending') && 
         settings.autoCancelUnpaidEnabled && (() => {
          const daysLimit = settings.autoCancelUnpaidDays && settings.autoCancelUnpaidDays > 0 ? settings.autoCancelUnpaidDays : 3;
          const remaining = getAutoCancelTimeRemaining(booking, daysLimit);
          return (
            <div className={`mt-2.5 p-2 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-1.5 border ${
              remaining.isOverdue 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-1.5 truncate">
                {remaining.isOverdue ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span className="truncate">
                  {remaining.isOverdue ? 'Deposit Overdue' : 'Deposit Grace Window'}
                </span>
              </div>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${
                remaining.isOverdue ? 'bg-rose-200/70 text-rose-900' : 'bg-amber-200/60 text-amber-900'
              }`}>
                {remaining.label}
              </span>
            </div>
          );
        })()}
      </div>

      {/* Card Footer: Financials & Operational Action Controls */}
      <div className="p-4 sm:p-5 pt-3 bg-slate-50/50 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Stay Amount
            </span>
            <span className="text-base sm:text-lg font-heading font-black text-slate-900">
              {settings.currencySymbol}{booking.totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Payment
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                booking.paymentStatus === 'paid'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : booking.paymentStatus === 'deposit'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <CreditCard className="w-2.5 h-2.5" />
              <span>{booking.paymentStatus}</span>
            </span>
          </div>
        </div>

        {/* Operational Action Buttons Bar */}
        <div className="grid grid-cols-6 gap-1.5 pt-2 border-t border-slate-200/60">
          {/* Invoice & QR Code */}
          <button
            type="button"
            title="View & Download Official Invoice (PDF) with QR Code"
            onClick={() => onViewInvoice?.(booking)}
            className="min-h-[40px] py-2 px-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/90 transition-colors flex items-center justify-center group/inv"
          >
            <FileText className="w-4 h-4 text-teal-700 group-hover/inv:scale-110 transition-transform" />
          </button>

          {/* WhatsApp Voucher */}
          <button
            type="button"
            title="Send WhatsApp Booking Confirmation Voucher"
            onClick={() => onSendWhatsAppVoucher(booking)}
            className="min-h-[40px] py-2 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors flex items-center justify-center"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          {/* Pre-arrival upcoming stay reminder */}
          <button
            type="button"
            title="Send Pre-arrival WhatsApp Surf Guide & Gate Code"
            onClick={() => onSendUpcomingReminder(booking)}
            className="min-h-[40px] py-2 px-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 transition-colors flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Edit Booking */}
          <button
            type="button"
            title="Modify Reservation Details"
            onClick={() => onEdit(booking)}
            className="min-h-[40px] py-2 px-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors flex items-center justify-center"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Webhook trigger */}
          <button
            type="button"
            title="Dispatch Webhook Sync Event"
            onClick={() => onDispatchWebhook(booking)}
            className="min-h-[40px] py-2 px-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4 text-teal-600" />
          </button>

          {/* Delete booking */}
          <button
            type="button"
            title="Delete Reservation"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete reservation #${booking.referenceNumber} for ${booking.guest.firstName}?`)) {
                onDelete(booking.id);
              }
            }}
            className="min-h-[40px] py-2 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/70 transition-colors flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
