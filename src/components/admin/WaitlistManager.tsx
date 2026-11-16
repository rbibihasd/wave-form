import React, { useState, useMemo } from 'react';
import { 
  Clock, Plus, Filter, Search, CheckCircle2, AlertTriangle, 
  MessageCircle, ArrowUpRight, Bed, Calendar, Users, 
  Trash2, Edit3, Phone, Mail, Globe, Flame, ShieldAlert, Sparkles, Check, X, Zap
} from 'lucide-react';
import { Booking, HostelSettings, Room, SurfAddOn, WaitlistEntry, WaitlistPriority, WaitlistStatus } from '../../types';
import { calculateRoomAvailability } from '../../utils/availability';
import { addDaysToString, calculateNights, formatDisplayDate, formatShortDate, getTodayString } from '../../utils/date';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { AddToWaitlistModal } from './AddToWaitlistModal';
import { findWaitlistMatches, convertWaitlistEntryToBooking, WaitlistMatchResult } from '../../utils/waitlistMatching';

interface WaitlistManagerProps {
  waitlist: WaitlistEntry[];
  rooms: Room[];
  bookings: Booking[];
  settings: HostelSettings;
  addOns?: SurfAddOn[];
  onAddWaitlistEntry: (entry: WaitlistEntry) => void;
  onUpdateWaitlistEntry: (entry: WaitlistEntry) => void;
  onDeleteWaitlistEntry: (entryId: string) => void;
  onConvertWaitlistToBooking: (entry: WaitlistEntry, newBooking: Booking) => void;
}

export const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  waitlist,
  rooms,
  bookings,
  settings,
  addOns = [],
  onAddWaitlistEntry,
  onUpdateWaitlistEntry,
  onDeleteWaitlistEntry,
  onConvertWaitlistToBooking,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [confirmConvertEntry, setConfirmConvertEntry] = useState<WaitlistEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Live Waitlist Vacancy Matching Engine: computes exact and alternative room vacancy matches
  const waitlistMatches = useMemo(() => {
    return findWaitlistMatches(waitlist, rooms, bookings, { includeAlternatives: true });
  }, [waitlist, rooms, bookings]);

  // Map each waitlist entry with its live availability status
  const waitlistWithAvailability = useMemo(() => {
    return waitlist.map((entry) => {
      const room = rooms.find((r) => r.id === entry.roomId);
      const match = waitlistMatches.find((m) => m.entry.id === entry.id);

      if (!room) {
        return {
          entry,
          room: null,
          availableBeds: 0,
          isSpotAvailable: false,
          occupancyPercent: 100,
          match,
        };
      }

      const avail = calculateRoomAvailability(
        room,
        entry.checkInDate,
        entry.checkOutDate,
        bookings
      );

      const isSpotAvailable = avail.availableBeds >= entry.guestsCount;

      return {
        entry,
        room,
        availableBeds: avail.availableBeds,
        isSpotAvailable,
        occupancyPercent: avail.occupancyPercent,
        match,
      };
    });
  }, [waitlist, rooms, bookings, waitlistMatches]);

  // Count entries where spots opened up right now
  const openSpotsCount = useMemo(() => {
    return waitlistWithAvailability.filter(
      (item) => (item.entry.status === 'waiting' || item.entry.status === 'notified') && item.isSpotAvailable
    ).length;
  }, [waitlistWithAvailability]);

  // Filtered entries
  const filteredItems = useMemo(() => {
    return waitlistWithAvailability.filter(({ entry, isSpotAvailable }) => {
      // Room filter
      if (selectedRoomId !== 'all' && entry.roomId !== selectedRoomId) {
        return false;
      }

      // Status filter
      if (statusFilter === 'matched') {
        if (!isSpotAvailable || (entry.status !== 'waiting' && entry.status !== 'notified')) {
          return false;
        }
      } else if (statusFilter !== 'all' && entry.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && entry.priority !== priorityFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${entry.guest.firstName} ${entry.guest.lastName}`.toLowerCase();
        const email = (entry.guest.email || '').toLowerCase();
        const phone = (entry.guest.phone || '').toLowerCase();
        const roomName = (entry.roomName || '').toLowerCase();
        const notes = (entry.adminNotes || '').toLowerCase();

        return (
          fullName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          roomName.includes(q) ||
          notes.includes(q)
        );
      }

      return true;
    });
  }, [waitlistWithAvailability, selectedRoomId, statusFilter, priorityFilter, searchQuery]);

  // Grouped by Room to show clear room queues
  const activeQueuesByRoom = useMemo(() => {
    const map = new Map<string, { room: Room; entries: WaitlistEntry[] }>();
    rooms.forEach((r) => {
      map.set(r.id, { room: r, entries: [] });
    });

    waitlist
      .filter((w) => w.status === 'waiting' || w.status === 'notified')
      .forEach((w) => {
        const item = map.get(w.roomId);
        if (item) {
          item.entries.push(w);
        }
      });

    return Array.from(map.values()).filter((item) => item.entries.length > 0);
  }, [waitlist, rooms]);

  // Handlers
  const handleNotifyWhatsApp = (entry: WaitlistEntry, roomName: string) => {
    const nights = entry.nights || calculateNights(entry.checkInDate, entry.checkOutDate);
    const message = `🤙 *ALOHA ${entry.guest.firstName.toUpperCase()}! SPOT OPEN AT WAVEHAVEN!* 🌊\n\nGreat news from WaveHaven Surf House front desk! A spot has just become available in *${roomName}* for your requested dates:\n\n📅 *Check-in:* ${entry.checkInDate}\n📅 *Check-out:* ${entry.checkOutDate} (${nights} nights)\n👥 *Guests:* ${entry.guestsCount}\n\nAs you are *#${entry.queueNumber} on our waitlist queue*, we are holding this reservation priority for you for the next 24 hours.\n\nReply to this message or WhatsApp us at +${settings.phone} to lock in your booking! 🏄‍♂️`;

    // Mark as notified
    const updated: WaitlistEntry = {
      ...entry,
      status: 'notified',
      notifiedAt: new Date().toISOString(),
    };
    onUpdateWaitlistEntry(updated);

    // Open WhatsApp
    const url = createWhatsAppUrl(entry.guest.phone, message);
    window.open(url, '_blank');
  };

  const handleInstantOneClickConvert = (entry: WaitlistEntry, targetRoom?: Room) => {
    const room = targetRoom || rooms.find((r) => r.id === entry.roomId);
    if (!room) return;

    const { newBooking, updatedEntry } = convertWaitlistEntryToBooking(entry, room, settings);
    onConvertWaitlistToBooking(updatedEntry, newBooking);
    showToast(`⚡ 1-Click Converted ${entry.guest.firstName} ${entry.guest.lastName} to confirmed booking #${newBooking.referenceNumber} in ${room.name}!`);
  };

  const handleConvertAllMatches = () => {
    const exactMatches = waitlistMatches.filter((m) => m.isExactRoom);
    if (exactMatches.length === 0) {
      showToast('No direct room matches available to convert.');
      return;
    }
    let count = 0;
    for (const match of exactMatches) {
      const { newBooking, updatedEntry } = convertWaitlistEntryToBooking(match.entry, match.targetRoom, settings);
      onConvertWaitlistToBooking(updatedEntry, newBooking);
      count++;
    }
    showToast(`⚡ Batch converted ${count} waitlist entries directly to confirmed bookings!`);
  };

  const handleConvert = (entry: WaitlistEntry) => {
    const room = rooms.find((r) => r.id === entry.roomId);
    if (!room) return;

    const nights = entry.nights || calculateNights(entry.checkInDate, entry.checkOutDate);
    const isDorm = room.type.startsWith('dorm');
    const roomSubtotal = room.pricePerNight * nights * (isDorm ? entry.guestsCount : 1);
    const taxAmount = roomSubtotal * (settings.taxRatePercent / 100);
    const totalAmount = roomSubtotal + taxAmount;

    const newBooking: Booking = {
      id: 'booking-' + Date.now(),
      referenceNumber: 'WH-' + Math.floor(1000 + Math.random() * 9000),
      roomId: room.id,
      roomName: room.name,
      checkInDate: entry.checkInDate,
      checkOutDate: entry.checkOutDate,
      nights,
      guestsCount: entry.guestsCount,
      guest: {
        firstName: entry.guest.firstName,
        lastName: entry.guest.lastName,
        email: entry.guest.email || `${entry.guest.firstName.toLowerCase()}@wavehaven.guest`,
        phone: entry.guest.phone || '+351900000000',
        country: entry.guest.country || 'International',
        surfLevel: entry.guest.surfLevel || 'intermediate',
      },
      addOns: [],
      roomSubtotal,
      addOnsSubtotal: 0,
      taxAmount,
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNotes: `Converted from Waitlist Queue #${entry.queueNumber}. ${entry.adminNotes || ''}`.trim(),
      whatsappSentCount: 0,
      webhookSentCount: 0,
    };

    const updatedEntry: WaitlistEntry = {
      ...entry,
      status: 'converted',
      convertedAt: new Date().toISOString(),
      convertedBookingId: newBooking.id,
    };

    onConvertWaitlistToBooking(updatedEntry, newBooking);
    setConfirmConvertEntry(null);
  };

  const handleStatusChange = (entry: WaitlistEntry, newStatus: WaitlistStatus) => {
    onUpdateWaitlistEntry({
      ...entry,
      status: newStatus,
    });
  };

  const handlePriorityChange = (entry: WaitlistEntry, newPriority: WaitlistPriority) => {
    onUpdateWaitlistEntry({
      ...entry,
      priority: newPriority,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-lg border border-emerald-400 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 fill-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)} 
            className="p-1 hover:bg-emerald-700 rounded-lg text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
              Waitlist & Room Queue System
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300/80 px-2.5 py-0.5 rounded-full">
              <Clock className="w-3 h-3 text-amber-600" />
              Live Availability Trigger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automatic standby queues for fully booked rooms. Alerts instantly when beds open up and converts to reservations in 1 click.
          </p>
        </div>

        <button
          type="button"
          id="btn-add-waitlist"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Guest to Waitlist</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Waiting Guests in Queue */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'waiting' ? 'all' : 'waiting')}
          className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">In Active Queue</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
            {waitlist.filter((w) => w.status === 'waiting').length}
          </p>
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
            Across {activeQueuesByRoom.length} rooms
          </p>
        </div>

        {/* Spot Open Now Alert */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'matched' ? 'all' : 'matched')}
          className={`p-4 rounded-3xl border shadow-2xs transition-all cursor-pointer ${
            openSpotsCount > 0
              ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/20 hover:border-emerald-500'
              : 'bg-white border-slate-200'
          }`}
          title="Click to view all entries that match newly opened room availability"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              openSpotsCount > 0 ? 'text-emerald-800' : 'text-slate-400'
            }`}>
              Spots Open Now
            </span>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold ${
              openSpotsCount > 0 ? 'bg-emerald-600 text-white animate-bounce' : 'bg-slate-100 text-slate-400'
            }`}>
              <Zap className="w-3.5 h-3.5 fill-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black flex items-baseline gap-1.5">
            <span>{openSpotsCount}</span>
            {openSpotsCount > 0 && (
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.2 rounded-full uppercase">
                Matched
              </span>
            )}
          </p>
          <p className={`text-[11px] font-semibold mt-0.5 ${
            openSpotsCount > 0 ? 'text-emerald-700 font-extrabold' : 'text-slate-400'
          }`}>
            {openSpotsCount > 0 ? '⚡ 1-Click Convert ready!' : 'All queued dates full'}
          </p>
        </div>

        {/* Notified / Holding */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'notified' ? 'all' : 'notified')}
          className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs cursor-pointer hover:border-teal-400 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notified / Holding</span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
            {waitlist.filter((w) => w.status === 'notified').length}
          </p>
          <p className="text-[11px] text-teal-600 font-semibold mt-0.5">
            WhatsApp priority hold
          </p>
        </div>

        {/* Successfully Converted */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'converted' ? 'all' : 'converted')}
          className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Converted Bookings</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
            {waitlist.filter((w) => w.status === 'converted').length}
          </p>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
            Locked in from waitlist
          </p>
        </div>
      </div>

      {/* Spot Available Alert Banner (if any) */}
      {openSpotsCount > 0 && (
        <div className="bg-linear-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-lg border border-emerald-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>⚡ Newly Opened Room Vacancies:</span>
                <span className="text-emerald-200">{openSpotsCount} Waitlist Entries Match Available Beds!</span>
              </h3>
              <p className="text-xs text-slate-200 mt-0.5">
                Cancellations or occupancy shifts have freed up spots matching queued dates. Convert them instantly with one click.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              id="btn-filter-open-spots"
              onClick={() => setStatusFilter(statusFilter === 'matched' ? 'all' : 'matched')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                statusFilter === 'matched'
                  ? 'bg-white text-slate-950 font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {statusFilter === 'matched' ? '✓ Showing Matches' : `Filter Matches (${openSpotsCount})`}
            </button>
            <button
              type="button"
              id="btn-convert-all-matches"
              onClick={handleConvertAllMatches}
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-slate-950 font-black text-xs shadow-md shadow-emerald-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>1-Click Convert All ({openSpotsCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Room Queues Quick Glance Pills */}
      {activeQueuesByRoom.length > 0 && (
        <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Active Room Queues (Live Waitlist Standby)
          </span>
          <div className="flex flex-wrap gap-2">
            {activeQueuesByRoom.map(({ room, entries }) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomId(selectedRoomId === room.id ? 'all' : room.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  selectedRoomId === room.id
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                }`}
              >
                <Bed className="w-3.5 h-3.5" />
                <span>{room.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  selectedRoomId === room.id ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-900'
                }`}>
                  {entries.length} waiting
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search guest name, phone, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Room Filter */}
          <div>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">All Rooms ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">All Statuses ({waitlist.length})</option>
              <option value="matched">⚡ Newly Opened Matches ({openSpotsCount})</option>
              <option value="waiting">⏳ Waiting in Queue ({waitlist.filter((w) => w.status === 'waiting').length})</option>
              <option value="notified">📲 Notified / Holding ({waitlist.filter((w) => w.status === 'notified').length})</option>
              <option value="converted">✅ Converted to Booking ({waitlist.filter((w) => w.status === 'converted').length})</option>
              <option value="cancelled">❌ Cancelled ({waitlist.filter((w) => w.status === 'cancelled').length})</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">All Priorities</option>
              <option value="vip">⭐ VIP Guests</option>
              <option value="high">🔥 High Priority</option>
              <option value="normal">Standard Priority</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Quick View:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({waitlist.length})
          </button>
          <button
            type="button"
            id="filter-chip-newly-opened-matches"
            onClick={() => setStatusFilter('matched')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'matched'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30 font-black'
                : openSpotsCount > 0
                ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 font-extrabold animate-pulse'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Zap className={`w-3 h-3 ${openSpotsCount > 0 ? 'fill-current' : ''}`} />
            <span>⚡ Newly Opened Matches ({openSpotsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('waiting')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'waiting'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⏳ In Queue ({waitlist.filter((w) => w.status === 'waiting').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('notified')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'notified'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📲 Notified ({waitlist.filter((w) => w.status === 'notified').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('converted')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'converted'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ✅ Converted ({waitlist.filter((w) => w.status === 'converted').length})
          </button>
        </div>
      </div>

      {/* Waitlist Entries List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-heading font-extrabold text-base text-slate-700">
              No Waitlist Entries Found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || selectedRoomId !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'When rooms are fully booked, guests can be queued here and automatically notified when spots open up.'}
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Guest to Waitlist</span>
            </button>
          </div>
        ) : (
          filteredItems.map(({ entry, room, availableBeds, isSpotAvailable, match }) => {
            const isWaiting = entry.status === 'waiting';
            const isNotified = entry.status === 'notified';
            const isConverted = entry.status === 'converted';
            const isCancelled = entry.status === 'cancelled';

            return (
              <div
                key={entry.id}
                id={`waitlist-card-${entry.id}`}
                className={`bg-white rounded-3xl border transition-all p-5 shadow-2xs ${
                  isSpotAvailable && (isWaiting || isNotified)
                    ? 'border-emerald-400 bg-emerald-50/15 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/5'
                    : isConverted
                    ? 'border-blue-200 bg-blue-50/10'
                    : isCancelled
                    ? 'border-slate-200 opacity-60 bg-slate-50/50'
                    : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                {/* 1-Click Vacancy Match Top Highlight Banner */}
                {isSpotAvailable && (isWaiting || isNotified) && (
                  <div className="bg-linear-to-r from-emerald-500/20 via-teal-500/10 to-transparent border-b border-emerald-300/80 -mx-5 -mt-5 px-5 py-2.5 mb-4 rounded-t-3xl flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                      </span>
                      <span className="uppercase tracking-wider text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
                        ⚡ Vacancy Match
                      </span>
                      <span>{room?.name} now has {availableBeds} bed{availableBeds > 1 ? 's' : ''} open for requested dates!</span>
                    </div>
                    <button
                      type="button"
                      id={`btn-instant-convert-${entry.id}`}
                      onClick={() => handleInstantOneClickConvert(entry, room || undefined)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>1-Click Convert</span>
                    </button>
                  </div>
                )}

                {/* Alternative Room Match Top Notice */}
                {match && !match.isExactRoom && !isSpotAvailable && (isWaiting || isNotified) && (
                  <div className="bg-amber-50 border-b border-amber-200/80 -mx-5 -mt-5 px-5 py-2 mb-4 rounded-t-3xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-950 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Alternative Room Available: <strong>{match.targetRoom.name}</strong> ({match.availableBeds} beds open)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInstantOneClickConvert(entry, match.targetRoom)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Zap className="w-3 h-3 fill-white" />
                      <span>1-Click Convert to {match.targetRoom.name}</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Queue Number, Guest Info & Room */}
                  <div className="flex items-start gap-3.5">
                    {/* Queue Badge */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-heading font-extrabold ${
                        isSpotAvailable && (isWaiting || isNotified)
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 animate-pulse'
                          : entry.priority === 'vip'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                          : entry.priority === 'high'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        <span className="text-[10px] leading-none uppercase font-bold opacity-80">Queue</span>
                        <span className="text-base leading-tight">#{entry.queueNumber}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase mt-1 px-1.5 py-0.2 rounded ${
                        entry.priority === 'vip'
                          ? 'bg-purple-100 text-purple-800 font-extrabold'
                          : entry.priority === 'high'
                          ? 'bg-amber-100 text-amber-800 font-extrabold'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {entry.priority}
                      </span>
                    </div>

                    {/* Guest & Stay Summary */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading font-extrabold text-base text-slate-900">
                          {entry.guest.firstName} {entry.guest.lastName}
                        </h3>
                        {entry.guest.country && (
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            {entry.guest.country}
                          </span>
                        )}
                        {entry.guest.surfLevel && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60 capitalize">
                            🏄 {entry.guest.surfLevel}
                          </span>
                        )}

                        {/* Status Pill */}
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isWaiting
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isNotified
                            ? 'bg-teal-100 text-teal-900 border border-teal-300'
                            : isConverted
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {entry.status}
                        </span>
                      </div>

                      {/* Target Room & Dates */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Bed className="w-3.5 h-3.5 text-amber-600" />
                          <span>{entry.roomName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formatShortDate(entry.checkInDate)} → {formatShortDate(entry.checkOutDate)} ({entry.nights} nights)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.guestsCount} guest{entry.guestsCount > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Contact Channels */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        {entry.guest.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {entry.guest.phone}
                          </span>
                        )}
                        {entry.guest.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {entry.guest.email}
                          </span>
                        )}
                      </div>

                      {/* Notes / Special Context */}
                      {(entry.adminNotes || entry.guest.notes) && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-2 max-w-xl italic">
                          "{entry.adminNotes || entry.guest.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Live Availability Engine Badge */}
                  <div className="lg:border-l lg:border-r border-slate-200 lg:px-5 shrink-0 flex flex-col justify-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Live Availability Status
                    </div>

                    {isSpotAvailable ? (
                      <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-2xl flex items-center gap-2.5 text-emerald-950">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <div>
                          <div className="font-heading font-extrabold text-xs text-emerald-900 flex items-center gap-1">
                            <span>🟢 Spot Open Now!</span>
                            <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded">
                              {availableBeds} beds free
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-700 mt-0.5">
                            Ready for instant reservation conversion.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-100 border border-slate-200/80 p-2.5 rounded-2xl flex items-center gap-2.5 text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                        <div>
                          <div className="font-heading font-extrabold text-xs text-slate-800">
                            🔴 Fully Booked (0 beds)
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Guest remains in priority queue until cancellation.
                          </p>
                        </div>
                      </div>
                    )}

                    {entry.notifiedAt && (
                      <div className="text-[10px] text-teal-700 font-semibold mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3 text-teal-600" />
                        Notified on WhatsApp {formatShortDate(entry.notifiedAt)}
                      </div>
                    )}

                    {entry.convertedAt && (
                      <div className="text-[10px] text-blue-700 font-bold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        Converted on {formatShortDate(entry.convertedAt)}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex flex-wrap lg:flex-col items-stretch gap-2 shrink-0 justify-end">
                    {/* Convert to Booking Buttons */}
                    {!isConverted && !isCancelled && (
                      <>
                        {isSpotAvailable && (
                          <button
                            type="button"
                            id={`btn-oneclick-convert-${entry.id}`}
                            onClick={() => handleInstantOneClickConvert(entry, room || undefined)}
                            className="px-3.5 py-2 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Instantly convert this waitlist entry to a confirmed booking"
                          >
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            <span>1-Click Convert</span>
                          </button>
                        )}

                        <button
                          type="button"
                          id={`btn-convert-${entry.id}`}
                          onClick={() => setConfirmConvertEntry(entry)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isSpotAvailable
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isSpotAvailable ? 'Review & Convert' : 'Force Convert'}</span>
                        </button>
                      </>
                    )}

                    {/* WhatsApp Notification Button */}
                    {!isConverted && !isCancelled && (
                      <button
                        type="button"
                        id={`btn-notify-whatsapp-${entry.id}`}
                        onClick={() => handleNotifyWhatsApp(entry, room?.name || entry.roomName)}
                        className="px-3.5 py-2 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isNotified ? 'Re-send WhatsApp' : 'Notify via WhatsApp'}</span>
                      </button>
                    )}

                    {/* Priority & Status Controls */}
                    <div className="flex items-center gap-1">
                      {/* Priority selector */}
                      <select
                        value={entry.priority}
                        onChange={(e) => handlePriorityChange(entry, e.target.value as WaitlistPriority)}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 px-2 py-1 focus:outline-hidden"
                        title="Set Queue Priority"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="vip">VIP</option>
                      </select>

                      {/* Status toggle */}
                      <select
                        value={entry.status}
                        onChange={(e) => handleStatusChange(entry, e.target.value as WaitlistStatus)}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 px-2 py-1 focus:outline-hidden"
                        title="Change Queue Status"
                      >
                        <option value="waiting">Waiting</option>
                        <option value="notified">Notified</option>
                        <option value="converted">Converted</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove ${entry.guest.firstName} ${entry.guest.lastName} from the waitlist?`)) {
                            onDeleteWaitlistEntry(entry.id);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <AddToWaitlistModal
          rooms={rooms}
          bookings={bookings}
          existingWaitlist={waitlist}
          settings={settings}
          onSave={(newEntry) => {
            onAddWaitlistEntry(newEntry);
            setIsAddModalOpen(false);
          }}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Convert to Reservation Confirmation Dialog */}
      {confirmConvertEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900">
                  Convert Waitlist to Booking
                </h3>
                <p className="text-xs text-slate-500">
                  Instantly book spot for {confirmConvertEntry.guest.firstName} {confirmConvertEntry.guest.lastName}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <p><span className="font-bold">Room:</span> {confirmConvertEntry.roomName}</p>
              <p><span className="font-bold">Dates:</span> {formatDisplayDate(confirmConvertEntry.checkInDate)} → {formatDisplayDate(confirmConvertEntry.checkOutDate)} ({confirmConvertEntry.nights} nights)</p>
              <p><span className="font-bold">Guests:</span> {confirmConvertEntry.guestsCount}</p>
              <p><span className="font-bold">Contact:</span> {confirmConvertEntry.guest.phone || confirmConvertEntry.guest.email}</p>
            </div>

            <p className="text-xs text-slate-500">
              This will create a new confirmed reservation, deduct the beds from live inventory, and mark this waitlist entry as converted.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmConvertEntry(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-convert"
                onClick={() => handleConvert(confirmConvertEntry)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                Confirm & Lock Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
