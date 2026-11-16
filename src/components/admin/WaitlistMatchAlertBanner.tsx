import React, { useState } from 'react';
import { 
  Sparkles, CheckCircle2, MessageCircle, ArrowRight, Bed, 
  Calendar, Users, ChevronDown, ChevronUp, Zap, Clock, ShieldCheck, X
} from 'lucide-react';
import { Booking, HostelSettings, Room, WaitlistEntry } from '../../types';
import { WaitlistMatchResult, convertWaitlistEntryToBooking } from '../../utils/waitlistMatching';
import { formatShortDate } from '../../utils/date';
import { createWhatsAppUrl } from '../../utils/whatsapp';

interface WaitlistMatchAlertBannerProps {
  matches: WaitlistMatchResult[];
  rooms: Room[];
  settings: HostelSettings;
  onConvertWaitlistToBooking: (entry: WaitlistEntry, newBooking: Booking) => void;
  onNavigateToWaitlist: () => void;
  onShowToast?: (message: string) => void;
}

export const WaitlistMatchAlertBanner: React.FC<WaitlistMatchAlertBannerProps> = ({
  matches,
  rooms,
  settings,
  onConvertWaitlistToBooking,
  onNavigateToWaitlist,
  onShowToast,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [recentlyConverted, setRecentlyConverted] = useState<Record<string, string>>({}); // waitlistId -> bookingRef

  if (!matches || matches.length === 0) return null;

  const exactMatches = matches.filter((m) => m.isExactRoom);
  const altMatches = matches.filter((m) => !m.isExactRoom);

  const handleInstantConvert = (match: WaitlistMatchResult) => {
    setConvertingId(match.entry.id);

    try {
      const { newBooking, updatedEntry } = convertWaitlistEntryToBooking(
        match.entry,
        match.targetRoom,
        settings
      );

      onConvertWaitlistToBooking(updatedEntry, newBooking);

      setRecentlyConverted((prev) => ({
        ...prev,
        [match.entry.id]: newBooking.referenceNumber,
      }));

      if (onShowToast) {
        onShowToast(
          `⚡ Instantly converted ${match.entry.guest.firstName} ${match.entry.guest.lastName} to booking #${newBooking.referenceNumber} in ${match.targetRoom.name}!`
        );
      }
    } catch (err) {
      console.error('Failed to convert waitlist entry:', err);
    } finally {
      setConvertingId(null);
    }
  };

  const handleSendWhatsAppNotification = (match: WaitlistMatchResult) => {
    const bookingRef = recentlyConverted[match.entry.id];
    let msg = '';
    if (bookingRef) {
      msg = `🤙 *ALOHA ${match.entry.guest.firstName.toUpperCase()}! YOUR STAY IS CONFIRMED!* 🏄‍♂️\n\nGreat news from WaveHaven Surf House! A spot opened up in *${match.targetRoom.name}* for your dates (${match.entry.checkInDate} → ${match.entry.checkOutDate}) and we have converted your waitlist queue into reservation *#${bookingRef}*!\n\nWe look forward to catching waves with you soon! Reply here or call us at +${settings.phone} for any questions.`;
    } else {
      msg = `🤙 *ALOHA ${match.entry.guest.firstName.toUpperCase()}! SPOT OPEN AT WAVEHAVEN!* 🌊\n\nA spot has just become available in *${match.targetRoom.name}* for your requested stay:\n📅 *Dates:* ${match.entry.checkInDate} → ${match.entry.checkOutDate} (${match.nights} nights)\n👥 *Guests:* ${match.requestedGuests}\n\nAs you are *#${match.entry.queueNumber} on our waitlist*, we are holding this spot for you for 24 hours. Reply to confirm! 🏄‍♂️`;
    }

    const url = createWhatsAppUrl(match.entry.guest.phone, msg);
    window.open(url, '_blank');
  };

  return (
    <div 
      id="waitlist-live-match-alert-bar"
      className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-lg border-2 border-emerald-400/80 transition-all duration-300 relative overflow-hidden"
    >
      {/* Subtle background glow effect */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md shadow-emerald-500/30 animate-pulse">
            <Zap className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading font-black text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
                <span>⚡ Newly Opened Room Vacancy:</span>
                <span className="text-emerald-300">
                  {matches.length} Waitlist {matches.length === 1 ? 'Entry Matches' : 'Entries Match'} Available Beds!
                </span>
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider">
                {exactMatches.length} Direct • {altMatches.length} Flexible
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Cancellations or occupancy changes have freed up rooms matching standby guests. Convert them to confirmed bookings with one click.
            </p>
          </div>
        </div>

        {/* Header CTA Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            id="btn-goto-waitlist-matches"
            onClick={onNavigateToWaitlist}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10"
          >
            <span>Waitlist Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isExpanded ? 'Collapse matched list' : 'Expand matched list'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Match Cards List */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-emerald-500/30 space-y-3 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matches.map((match) => {
              const isConverting = convertingId === match.entry.id;
              const convertedBookingRef = recentlyConverted[match.entry.id];

              return (
                <div
                  key={match.entry.id}
                  id={`match-card-${match.entry.id}`}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    convertedBookingRef
                      ? 'bg-emerald-950/60 border-emerald-500/80 shadow-xs'
                      : match.isExactRoom
                      ? 'bg-slate-900/90 border-emerald-400/70 hover:border-emerald-300'
                      : 'bg-slate-900/80 border-teal-500/50 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    {/* Guest info & queue status */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-heading font-extrabold text-white truncate">
                          {match.entry.guest.firstName} {match.entry.guest.lastName}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                          match.entry.priority === 'vip'
                            ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30'
                            : match.entry.priority === 'high'
                            ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {match.entry.priority} • Queue #{match.entry.queueNumber}
                        </span>
                        {match.isExactRoom ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            <span>Exact Room</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-500/30 text-teal-300 border border-teal-400/40">
                            Alt Room
                          </span>
                        )}
                      </div>

                      {/* Room and Dates */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-300">
                        <span className="flex items-center gap-1 font-semibold text-emerald-200">
                          <Bed className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{match.targetRoom.name}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {formatShortDate(match.entry.checkInDate)} → {formatShortDate(match.entry.checkOutDate)} ({match.nights}n)
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{match.requestedGuests} guest{match.requestedGuests > 1 ? 's' : ''}</span>
                        </span>
                      </div>

                      {/* Match explanation & available beds */}
                      <div className="text-[10px] text-emerald-300 font-medium flex items-center gap-1.5 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>{match.availableBeds} beds currently open (Needs {match.requestedGuests})</span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {convertedBookingRef ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-extrabold text-emerald-300 flex items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Booked #{convertedBookingRef}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppNotification(match)}
                            className="text-[10px] font-bold text-teal-300 hover:text-white flex items-center gap-1 underline decoration-dotted"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-400" />
                            <span>WhatsApp Guest</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            id={`btn-one-click-convert-${match.entry.id}`}
                            onClick={() => handleInstantConvert(match)}
                            disabled={isConverting}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title={`Instantly book ${match.entry.guest.firstName} into ${match.targetRoom.name} with one click`}
                          >
                            <Zap className="w-3.5 h-3.5 fill-slate-950" />
                            <span>{isConverting ? 'Booking...' : '1-Click Convert'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppNotification(match)}
                            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                            title="Send WhatsApp Availability Notification"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
