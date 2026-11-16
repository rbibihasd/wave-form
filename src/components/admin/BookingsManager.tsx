import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Filter, MessageCircle, Edit, Trash2, Send, 
  CheckCircle, Clock, AlertTriangle, UserCheck, CheckCheck, Eye, Sparkles, RefreshCw,
  LayoutGrid, List, BarChart3, TrendingUp, ChevronDown, ChevronUp, Waves, FileText, QrCode,
  AlertOctagon, CheckSquare, Square, MinusSquare, Check, X, CheckCheck as CheckAllIcon,
  RotateCcw, Crown
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Booking, BookingStatus, HostelSettings, Room, SurfAddOn } from '../../types';
import { formatDisplayDate, getStayUrgencyBadge } from '../../utils/date';
import { createWhatsAppUrl, formatBookingConfirmationMessage, formatUpcomingStayReminderMessage } from '../../utils/whatsapp';
import { dispatchWebhook } from '../../utils/webhook';
import { getAutoCancelTimeRemaining, executeBatchAutoCancellation } from '../../utils/autoCancellation';
import { 
  getPhoneMatchMap, 
  getGuestLoyaltyInfo, 
  getLoyaltyStatusBadgeStyle, 
  formatLoyaltyStatusLabel 
} from '../../utils/guestLoyalty';
import { BookingEditModal } from './BookingEditModal';
import { SmartBookingSearch, SmartFilterState } from './SmartBookingSearch';
import { BookingCard } from './BookingCard';
import { BookingInvoiceModal } from '../invoice/BookingInvoiceModal';

interface BookingsManagerProps {
  bookings: Booking[];
  rooms: Room[];
  addOns: SurfAddOn[];
  settings: HostelSettings;
  onUpdateBooking: (updated: Booking) => void;
  onBatchUpdateBookings?: (updated: Booking[]) => void;
  onDeleteBooking: (bookingId: string) => void;
  onAddWalkIn: () => void;
  onSaveSettings?: (settings: HostelSettings) => void;
}

export const BookingsManager: React.FC<BookingsManagerProps> = ({
  bookings,
  rooms,
  addOns,
  settings,
  onUpdateBooking,
  onBatchUpdateBookings,
  onDeleteBooking,
  onAddWalkIn,
  onSaveSettings,
}) => {
  const [smartFilteredBookings, setSmartFilteredBookings] = useState<Booking[]>(bookings);
  const [activeSmartFilters, setActiveSmartFilters] = useState<SmartFilterState>({
    guestName: null,
    paymentStatus: 'all',
    dateRange: null,
    searchQuery: '',
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [resetSearchKey, setResetSearchKey] = useState(0);

  // Bulk Selection State
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<BookingStatus | ''>('');
  const [isApplyingBulkStatus, setIsApplyingBulkStatus] = useState(false);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  const handleResetAllFilters = () => {
    setStatusFilter('all');
    setResetSearchKey((prev) => prev + 1);
    setSelectedBookingIds([]);
    setSmartFilteredBookings(bookings);
    setActiveSmartFilters({
      guestName: null,
      paymentStatus: 'all',
      dateRange: null,
      searchQuery: '',
    });
  };

  const handleSmartFilterChange = useCallback((filtered: Booking[], activeFilters: SmartFilterState) => {
    setSmartFilteredBookings((prev) => {
      if (
        prev.length === filtered.length &&
        prev.every((b, i) => b.id === filtered[i]?.id)
      ) {
        return prev;
      }
      return filtered;
    });
    setActiveSmartFilters((prev) => {
      if (
        prev.guestName === activeFilters.guestName &&
        prev.paymentStatus === activeFilters.paymentStatus &&
        prev.searchQuery === activeFilters.searchQuery &&
        prev.dateRange?.id === activeFilters.dateRange?.id &&
        prev.dateRange?.startDate === activeFilters.dateRange?.startDate &&
        prev.dateRange?.endDate === activeFilters.dateRange?.endDate
      ) {
        return prev;
      }
      return activeFilters;
    });
  }, []);

  // Compose with status tab filter
  const displayedBookings = smartFilteredBookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  const [showChartSnapshot, setShowChartSnapshot] = useState(false);

  // Derive visual chart analytics for the currently displayed / filtered bookings
  const snapshotMetrics = useMemo(() => {
    const totalRev = displayedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const roomRev = displayedBookings.reduce((sum, b) => sum + (b.roomSubtotal || 0), 0);
    const addOnsRev = displayedBookings.reduce((sum, b) => sum + (b.addOnsSubtotal || 0), 0);
    const totalNights = displayedBookings.reduce((sum, b) => sum + (b.nights || 0), 0);
    const totalGuests = displayedBookings.reduce((sum, b) => sum + (b.guestsCount || 0), 0);

    // Room revenue breakdown
    const roomMap = new Map<string, { name: string; revenue: number; nights: number; count: number }>();
    rooms.forEach((r) => {
      roomMap.set(r.id, {
        name: r.name.replace(/^(The\s+)/, '').slice(0, 16),
        revenue: 0,
        nights: 0,
        count: 0,
      });
    });

    displayedBookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      const r = roomMap.get(b.roomId);
      if (r) {
        r.revenue += Math.round(b.roomSubtotal || 0);
        r.nights += (b.nights || 0);
        r.count += 1;
      }
    });

    const roomChartData = Array.from(roomMap.values()).filter((r) => r.count > 0 || r.revenue > 0);

    // Surfer skill levels
    const skillCounts: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      non_surfer: 0,
    };

    displayedBookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      const lvl = b.guest?.surfLevel || 'intermediate';
      skillCounts[lvl] = (skillCounts[lvl] || 0) + (b.guestsCount || 1);
    });

    const skillColors: Record<string, string> = {
      beginner: '#0d9488',
      intermediate: '#0284c7',
      advanced: '#6366f1',
      non_surfer: '#f59e0b',
    };

    const skillLabels: Record<string, string> = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      non_surfer: 'Non-Surfer',
    };

    const skillChartData = Object.keys(skillCounts)
      .map((k) => ({
        name: skillLabels[k] || k,
        value: skillCounts[k],
        color: skillColors[k],
      }))
      .filter((s) => s.value > 0);

    return {
      totalRev,
      roomRev,
      addOnsRev,
      totalNights,
      totalGuests,
      roomChartData,
      skillChartData,
    };
  }, [displayedBookings, rooms]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
            <UserCheck className="w-3 h-3 text-cyan-600" />
            Checked In
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCheck className="w-3 h-3 text-slate-500" />
            Checked Out
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const handleSendWhatsAppVoucher = (booking: Booking) => {
    const room = rooms.find((r) => r.id === booking.roomId);
    const msg = formatBookingConfirmationMessage(booking, room, addOns, settings);
    const url = createWhatsAppUrl(booking.guest.phone, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Update booking sent count
    onUpdateBooking({
      ...booking,
      whatsappSentCount: (booking.whatsappSentCount || 0) + 1,
      lastNotificationSent: new Date().toISOString(),
    });
    showToast(`Opened WhatsApp with voucher for ${booking.guest.firstName}!`);
  };

  const handleSendUpcomingReminder = (booking: Booking) => {
    const urgency = getStayUrgencyBadge(booking.checkInDate);
    const msg = formatUpcomingStayReminderMessage(booking, urgency.days, settings);
    const url = createWhatsAppUrl(booking.guest.phone, msg);
    window.open(url, '_blank', 'noopener,noreferrer');

    onUpdateBooking({
      ...booking,
      stayReminderSent: true,
      whatsappSentCount: (booking.whatsappSentCount || 0) + 1,
      lastNotificationSent: new Date().toISOString(),
    });
    showToast(`Stay reminder dispatched to WhatsApp for ${booking.guest.firstName}!`);
  };

  const handleDispatchWebhook = async (booking: Booking) => {
    const res = await dispatchWebhook('booking.updated', booking, settings);
    showToast(res.message);
  };

  const handleRunAutoCancelCheck = async () => {
    if (!onBatchUpdateBookings) return;
    try {
      const days = settings.autoCancelUnpaidDays && settings.autoCancelUnpaidDays > 0 ? settings.autoCancelUnpaidDays : 3;
      const { updatedBookings, count, cancelledBookings } = await executeBatchAutoCancellation(bookings, {
        ...settings,
        autoCancelUnpaidEnabled: true,
        autoCancelUnpaidDays: days,
      });

      if (count > 0) {
        onBatchUpdateBookings(updatedBookings);
        const refs = cancelledBookings.map((b) => `#${b.referenceNumber}`).join(', ');
        showToast(`Auto-cancelled ${count} overdue reservation(s) (${refs})`);
      } else {
        showToast('No overdue unpaid reservations found.');
      }
    } catch (e) {
      console.error('Error executing auto cancellation:', e);
      showToast('Failed to execute auto-cancellation check.');
    }
  };

  // Phone matching lookup for guest loyalty detection
  const phoneMatchMap = useMemo(() => getPhoneMatchMap(bookings), [bookings]);

  // Bulk Selection Operations
  const handleToggleSelectBooking = (id: string) => {
    setSelectedBookingIds((prev) => 
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const isAllDisplayedSelected = useMemo(() => {
    return displayedBookings.length > 0 && displayedBookings.every((b) => selectedBookingIds.includes(b.id));
  }, [displayedBookings, selectedBookingIds]);

  const isSomeDisplayedSelected = useMemo(() => {
    return displayedBookings.some((b) => selectedBookingIds.includes(b.id)) && !isAllDisplayedSelected;
  }, [displayedBookings, selectedBookingIds, isAllDisplayedSelected]);

  const handleToggleSelectAll = () => {
    if (isAllDisplayedSelected) {
      const displayedIdSet = new Set(displayedBookings.map((b) => b.id));
      setSelectedBookingIds((prev) => prev.filter((id) => !displayedIdSet.has(id)));
    } else {
      const displayedIdSet = new Set(displayedBookings.map((b) => b.id));
      setSelectedBookingIds((prev) => Array.from(new Set([...prev, ...displayedIdSet])));
    }
  };

  const handleClearSelection = () => {
    setSelectedBookingIds([]);
    setBulkStatusTarget('');
  };

  const handleSelectByStatus = (status: BookingStatus) => {
    const matchingIds = displayedBookings.filter((b) => b.status === status).map((b) => b.id);
    if (matchingIds.length === 0) {
      showToast(`No bookings with status "${status}" in current view.`);
      return;
    }
    setSelectedBookingIds((prev) => Array.from(new Set([...prev, ...matchingIds])));
    showToast(`Selected ${matchingIds.length} "${status}" booking(s).`);
  };

  const handleSelectReturningGuests = () => {
    const matchingIds = displayedBookings
      .filter((b) => getGuestLoyaltyInfo(b, phoneMatchMap).isReturning)
      .map((b) => b.id);
    if (matchingIds.length === 0) {
      showToast('No returning guest reservations found in current view.');
      return;
    }
    setSelectedBookingIds((prev) => Array.from(new Set([...prev, ...matchingIds])));
    showToast(`Selected ${matchingIds.length} returning guest reservation(s).`);
  };

  // Execute Bulk Status Update
  const handleApplyBulkStatus = (targetStatus: BookingStatus) => {
    if (selectedBookingIds.length === 0) {
      showToast('Please select at least one booking to update.');
      return;
    }

    if (targetStatus === 'cancelled') {
      const confirmCancel = window.confirm(
        `Are you sure you want to cancel ${selectedBookingIds.length} selected reservation(s)? This will release their room capacity.`
      );
      if (!confirmCancel) return;
    }

    setIsApplyingBulkStatus(true);
    const selectedIdSet = new Set(selectedBookingIds);

    const updatedList = bookings.map((b) => {
      if (selectedIdSet.has(b.id)) {
        return {
          ...b,
          status: targetStatus,
          ...(targetStatus === 'cancelled' ? { cancellationReason: b.cancellationReason || 'Bulk cancelled by administrator' } : {}),
          ...(targetStatus === 'checked_in' ? { checkedInAt: b.checkedInAt || new Date().toISOString() } : {}),
          ...(targetStatus === 'checked_out' ? { checkedOutAt: b.checkedOutAt || new Date().toISOString() } : {}),
        };
      }
      return b;
    });

    if (onBatchUpdateBookings) {
      onBatchUpdateBookings(updatedList);
    } else {
      updatedList.filter((b) => selectedIdSet.has(b.id)).forEach((b) => onUpdateBooking(b));
    }

    const statusDisplay = targetStatus.replace('_', ' ');
    showToast(`Successfully updated ${selectedBookingIds.length} booking(s) to "${statusDisplay}"!`);
    setSelectedBookingIds([]);
    setBulkStatusTarget('');
    setIsApplyingBulkStatus(false);
  };

  const handleBulkDelete = () => {
    if (selectedBookingIds.length === 0) return;
    const count = selectedBookingIds.length;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete ${count} selected reservation(s)? This cannot be undone.`
    );
    if (!confirmDelete) return;

    selectedBookingIds.forEach((id) => onDeleteBooking(id));
    showToast(`Deleted ${count} reservation(s).`);
    setSelectedBookingIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notificationToast && (
        <div className="bg-slate-900 text-teal-300 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center justify-between border border-teal-500/30 animate-in fade-in">
          <span>{notificationToast}</span>
          <button onClick={() => setNotificationToast(null)} className="text-white ml-3">✕</button>
        </div>
      )}

      {/* Auto-cancel Unpaid Policy Banner (if active) */}
      {settings.autoCancelUnpaidEnabled && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-amber-950">
                Auto-cancel Unpaid Reservations Policy Active
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Bookings without deposit are automatically cancelled {settings.autoCancelUnpaidDays || 3} days after creation, returning bed inventory to availability.
              </p>
            </div>
          </div>

          {onBatchUpdateBookings && (
            <button
              type="button"
              id="bookings-run-auto-cancel-btn"
              onClick={handleRunAutoCancelCheck}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-200/90 hover:bg-amber-300 active:bg-amber-400 text-amber-950 font-bold text-xs transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run Auto-Cancel Check</span>
            </button>
          )}
        </div>
      )}

      {/* Control Bar: Smart Search & Add Walk-in */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Smart Search Bar with Autocomplete */}
        <SmartBookingSearch
          key={resetSearchKey}
          bookings={bookings}
          brandColor={settings.primaryBrandColor || '#0d9488'}
          onFilterChange={handleSmartFilterChange}
        />

        {/* Secondary Toolbar: Status Filter Tabs, Counter & Add Walk-in */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pt-2 border-t border-slate-100 max-w-full">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200 max-w-full">
            {[
              { id: 'all', label: 'All Stays', count: smartFilteredBookings.length },
              { id: 'confirmed', label: 'Confirmed', count: smartFilteredBookings.filter((b) => b.status === 'confirmed').length },
              { id: 'pending', label: 'Pending', count: smartFilteredBookings.filter((b) => b.status === 'pending').length },
              { id: 'checked_in', label: 'In House', count: smartFilteredBookings.filter((b) => b.status === 'checked_in').length },
              { id: 'cancelled', label: 'Cancelled', count: smartFilteredBookings.filter((b) => b.status === 'cancelled').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Right Action: Quick Select, View Mode Toggle, Counter & Add Walk-In */}
          <div className="flex items-center justify-between xl:justify-end gap-2 flex-wrap max-w-full">
            {/* Quick Bulk Selection Helper Dropdown */}
            <div className="relative group">
              <button
                type="button"
                id="admin-bookings-quick-select-btn"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                  selectedBookingIds.length > 0
                    ? 'bg-teal-50 border-teal-300 text-teal-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
                title="Quick selection helpers"
              >
                <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  {selectedBookingIds.length > 0 ? `${selectedBookingIds.length} Selected` : 'Select...'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 hidden group-hover:block z-20 space-y-0.5 text-xs animate-in fade-in">
                <button
                  type="button"
                  id="quick-select-all-filtered-btn"
                  onClick={handleToggleSelectAll}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>{isAllDisplayedSelected ? 'Deselect All' : 'Select All Filtered'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({displayedBookings.length})</span>
                </button>
                <button
                  type="button"
                  id="quick-select-confirmed-btn"
                  onClick={() => handleSelectByStatus('confirmed')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 font-medium flex items-center justify-between"
                >
                  <span>Select Confirmed</span>
                  <span className="text-[10px] font-mono">({displayedBookings.filter(b => b.status === 'confirmed').length})</span>
                </button>
                <button
                  type="button"
                  id="quick-select-pending-btn"
                  onClick={() => handleSelectByStatus('pending')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 text-amber-700 font-medium flex items-center justify-between"
                >
                  <span>Select Pending</span>
                  <span className="text-[10px] font-mono">({displayedBookings.filter(b => b.status === 'pending').length})</span>
                </button>
                <button
                  type="button"
                  id="quick-select-checked-in-btn"
                  onClick={() => handleSelectByStatus('checked_in')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-cyan-50 text-cyan-700 font-medium flex items-center justify-between"
                >
                  <span>Select In House</span>
                  <span className="text-[10px] font-mono">({displayedBookings.filter(b => b.status === 'checked_in').length})</span>
                </button>
                <button
                  type="button"
                  id="quick-select-returning-btn"
                  onClick={handleSelectReturningGuests}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 text-amber-800 font-medium flex items-center justify-between"
                >
                  <span className="flex items-center gap-1">
                    <RotateCcw className="w-3 h-3 text-amber-600" />
                    <span>Select Returning</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold">
                    ({displayedBookings.filter(b => getGuestLoyaltyInfo(b, phoneMatchMap).isReturning).length})
                  </span>
                </button>
                {selectedBookingIds.length > 0 && (
                  <button
                    type="button"
                    id="quick-clear-selection-btn"
                    onClick={handleClearSelection}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-bold border-t border-slate-100 mt-1 pt-1"
                  >
                    Clear Selection ({selectedBookingIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Chart Snapshot Toggle */}
            <button
              type="button"
              id="admin-bookings-toggle-chart-btn"
              onClick={() => setShowChartSnapshot(!showChartSnapshot)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                showChartSnapshot
                  ? 'bg-teal-50 border-teal-300 text-teal-800 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
              title="Toggle visual charts of filtered stays"
            >
              <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
              <span>{showChartSnapshot ? 'Hide Charts' : 'Show Charts'}</span>
              {showChartSnapshot ? <ChevronUp className="w-3 h-3 text-teal-600" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
            </button>

            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                id="admin-bookings-view-cards-btn"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Booking Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                id="admin-bookings-view-table-btn"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            <span className="text-[11px] font-semibold text-slate-500 hidden xl:inline">
              Showing <span className="font-bold text-slate-900">{displayedBookings.length}</span> of <span className="font-bold text-slate-900">{bookings.length}</span> bookings
            </span>

            <button
              type="button"
              onClick={onAddWalkIn}
              className="px-3.5 py-2 min-h-[40px] rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
              style={{ backgroundColor: settings.primaryBrandColor || '#0d9488' }}
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Walk-In</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Chart Snapshot Panel (Expandable) */}
      <AnimatePresence>
        {showChartSnapshot && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-extrabold text-slate-900">
                      Filtered Stays Analytics
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Visualizing {displayedBookings.length} bookings matching your current status & search filters.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-teal-50 text-teal-800 font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
                    Total Value: {settings.currencySymbol || '€'}{snapshotMetrics.totalRev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Chart Grid: Room Revenue Horizontal Bars + Surfer Demographics Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Quick Financial Breakdown */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Filter Totals
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-bold block">Room Stays</span>
                      <span className="text-base font-heading font-black text-slate-900">
                        {settings.currencySymbol || '€'}{Math.round(snapshotMetrics.roomRev)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-200/80">
                      <span className="text-[10px] text-teal-700 font-bold block">Surf Extras</span>
                      <span className="text-base font-heading font-black text-teal-900">
                        {settings.currencySymbol || '€'}{Math.round(snapshotMetrics.addOnsRev)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-bold block">Total Nights</span>
                      <span className="text-base font-heading font-black text-slate-900">
                        {snapshotMetrics.totalNights} nights
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-bold block">Guests</span>
                      <span className="text-base font-heading font-black text-slate-900">
                        {snapshotMetrics.totalGuests} surfers
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Room Revenue Yield Chart */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Revenue by Room
                  </div>
                  {snapshotMetrics.roomChartData.length > 0 ? (
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={snapshotMetrics.roomChartData} 
                          layout="vertical"
                          margin={{ top: 0, right: 15, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="#f1f5f9" />
                          <XAxis 
                            type="number" 
                            tickLine={false} 
                            axisLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            tickFormatter={(val) => `${settings.currencySymbol || '€'}${val}`}
                          />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            tickLine={false} 
                            axisLine={false}
                            tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }}
                            width={100}
                          />
                          <Tooltip 
                            formatter={(val: any) => [`${settings.currencySymbol || '€'}${val}`, 'Revenue']}
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px' }}
                          />
                          <Bar dataKey="revenue" fill="#0d9488" radius={[0, 6, 6, 0]}>
                            {snapshotMetrics.roomChartData.map((_, idx) => (
                              <Cell key={`cell-${idx}`} fill={idx === 0 ? '#0d9488' : idx === 1 ? '#0284c7' : '#6366f1'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                      No room revenue in current filter
                    </div>
                  )}
                </div>

                {/* 3. Surfer Skill Levels Chart */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Surfer Skill Distribution
                  </div>
                  {snapshotMetrics.skillChartData.length > 0 ? (
                    <div className="h-44 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={snapshotMetrics.skillChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={62}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {snapshotMetrics.skillChartData.map((entry, idx) => (
                              <Cell key={`pie-${idx}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(val: any, name: any) => [`${val} Guests`, name]}
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Surfer Count */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-heading font-black text-slate-900">
                          {snapshotMetrics.totalGuests}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-slate-400">
                          Guests
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                      No guests in current filter
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Action Selector Toolbar (Displayed when 1 or more bookings are selected) */}
      <AnimatePresence>
        {selectedBookingIds.length > 0 && (
          <motion.div
            id="admin-bookings-bulk-action-bar"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="sticky top-16 sm:top-20 z-30 bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl border border-teal-500/50 backdrop-blur-md flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 sm:gap-4"
          >
            {/* Left: Counter & Selection Helpers */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {selectedBookingIds.length}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-heading font-extrabold text-white">
                      {selectedBookingIds.length} Booking{selectedBookingIds.length > 1 ? 's' : ''} Selected
                    </span>
                    <span className="text-[10px] bg-slate-800 text-teal-300 font-mono font-bold px-2 py-0.5 rounded-full border border-slate-700">
                      {Math.round((selectedBookingIds.length / (displayedBookings.length || 1)) * 100)}% of current view
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Apply bulk status changes simultaneously across all selected reservations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs ml-auto xl:ml-0">
                <button
                  type="button"
                  id="bulk-select-all-btn"
                  onClick={handleToggleSelectAll}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-[11px] border border-slate-700 transition-colors cursor-pointer"
                >
                  {isAllDisplayedSelected ? 'Deselect All' : `Select All (${displayedBookings.length})`}
                </button>
                <button
                  type="button"
                  id="bulk-clear-selection-btn"
                  onClick={handleClearSelection}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] border border-slate-700 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Middle: Bulk Status Action Selector */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2 rounded-2xl border border-slate-700/80">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-teal-400 shrink-0 ml-1">
                Change Status:
              </span>

              {/* 1-Click Fast Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  id="bulk-btn-confirmed"
                  disabled={isApplyingBulkStatus}
                  onClick={() => handleApplyBulkStatus('confirmed')}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Mark all selected as Confirmed"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirmed</span>
                </button>

                <button
                  type="button"
                  id="bulk-btn-checked-in"
                  disabled={isApplyingBulkStatus}
                  onClick={() => handleApplyBulkStatus('checked_in')}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Check In all selected guests"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Check In</span>
                </button>

                <button
                  type="button"
                  id="bulk-btn-checked-out"
                  disabled={isApplyingBulkStatus}
                  onClick={() => handleApplyBulkStatus('checked_out')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  title="Check Out all selected guests"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                  <span>Check Out</span>
                </button>

                <button
                  type="button"
                  id="bulk-btn-pending"
                  disabled={isApplyingBulkStatus}
                  onClick={() => handleApplyBulkStatus('pending')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Mark all selected as Pending"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending</span>
                </button>

                <button
                  type="button"
                  id="bulk-btn-cancelled"
                  disabled={isApplyingBulkStatus}
                  onClick={() => handleApplyBulkStatus('cancelled')}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Cancel all selected bookings"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>

              {/* Status Select Dropdown with Apply Button for flexible selection */}
              <div className="flex items-center gap-1.5 pl-1 sm:border-l sm:border-slate-700">
                <select
                  id="bulk-status-dropdown-select"
                  aria-label="Select bulk status"
                  value={bulkStatusTarget}
                  onChange={(e) => setBulkStatusTarget(e.target.value as BookingStatus)}
                  className="bg-slate-900 text-white text-xs rounded-xl px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-teal-400 cursor-pointer"
                >
                  <option value="">Choose Status...</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {bulkStatusTarget && (
                  <button
                    type="button"
                    id="bulk-apply-selected-status-btn"
                    disabled={isApplyingBulkStatus}
                    onClick={() => handleApplyBulkStatus(bulkStatusTarget)}
                    className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-xs"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>

            {/* Right: Quick Close / Bulk Delete */}
            <div className="flex items-center gap-2 justify-end shrink-0">
              <button
                type="button"
                id="bulk-delete-btn"
                onClick={handleBulkDelete}
                className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 active:scale-95 text-rose-300 border border-rose-800/80 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Permanently delete selected bookings"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Delete</span>
              </button>

              <button
                type="button"
                id="bulk-close-bar-btn"
                onClick={handleClearSelection}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Dismiss bulk action bar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bookings View: Cards Grid or Table */}
      {viewMode === 'cards' ? (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {displayedBookings.length === 0 ? (
              <motion.div
                key="empty-cards"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center"
              >
                <div className="max-w-xs mx-auto space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-700 text-sm">
                    {activeSmartFilters.searchQuery
                      ? `No reservations found matching "${activeSmartFilters.searchQuery}"`
                      : activeSmartFilters.guestName
                      ? `No reservations found for guest "${activeSmartFilters.guestName}"`
                      : 'No reservations match your filters'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {activeSmartFilters.searchQuery
                      ? 'Try searching by guest name, email address, or reference number (e.g. WH-4821).'
                      : statusFilter !== 'all'
                      ? `Filtered under status "${statusFilter}". Try selecting "All Stays".`
                      : 'Try adjusting your search query, payment status, or date range parameters.'}
                  </p>
                  <button
                    type="button"
                    id="admin-bookings-empty-reset-cards-btn"
                    onClick={handleResetAllFilters}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Clear Search & Reset Filters</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="cards-grid"
                layout
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {displayedBookings.map((b, index) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    index={index}
                    settings={settings}
                    getStatusBadge={getStatusBadge}
                    isSelected={selectedBookingIds.includes(b.id)}
                    onToggleSelect={handleToggleSelectBooking}
                    onEdit={(bk) => setEditingBooking(bk)}
                    onDelete={(id) => {
                      onDeleteBooking(id);
                      showToast(`Deleted reservation #${b.referenceNumber}`);
                    }}
                    onSendWhatsAppVoucher={handleSendWhatsAppVoucher}
                    onSendUpcomingReminder={handleSendUpcomingReminder}
                    onDispatchWebhook={handleDispatchWebhook}
                    onViewInvoice={(bk) => setSelectedInvoiceBooking(bk)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Bookings Table with motion entrance rows */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      id="bulk-table-select-all"
                      checked={isAllDisplayedSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeDisplayedSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                      title={isAllDisplayedSelected ? "Deselect all" : "Select all displayed bookings"}
                    />
                  </th>
                  <th className="py-3.5 px-4">Ref & Guest</th>
                  <th className="py-3.5 px-4">Room & Dates</th>
                  <th className="py-3.5 px-4">Stay & Urgency</th>
                  <th className="py-3.5 px-4">Surf & Add-ons</th>
                  <th className="py-3.5 px-4">Total & Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <AnimatePresence mode="popLayout">
                  {displayedBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <div className="w-10 h-10 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Search className="w-5 h-5" />
                          </div>
                          <p className="font-bold text-slate-700 text-sm">
                            {activeSmartFilters.searchQuery
                              ? `No reservations found matching "${activeSmartFilters.searchQuery}"`
                              : activeSmartFilters.guestName
                              ? `No reservations found for guest "${activeSmartFilters.guestName}"`
                              : 'No reservations match your filters'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {activeSmartFilters.searchQuery
                              ? 'Try searching by guest name, email address, or reference number (e.g. WH-4821).'
                              : statusFilter !== 'all'
                              ? `Filtered under status "${statusFilter}". Try selecting "All Stays".`
                              : 'Try adjusting your search query, payment status, or date range parameters.'}
                          </p>
                          <button
                            type="button"
                            id="admin-bookings-empty-reset-table-btn"
                            onClick={handleResetAllFilters}
                            className="mt-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Clear Search & Reset Filters</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedBookings.map((b, index) => {
                      const urgency = getStayUrgencyBadge(b.checkInDate);
                      const isSelected = selectedBookingIds.includes(b.id);
                      return (
                        <motion.tr
                          key={b.id}
                          layout
                          variants={{
                            hidden: { opacity: 0, y: 12 },
                            visible: (i: number) => ({
                              opacity: 1,
                              y: 0,
                              transition: {
                                delay: Math.min(i * 0.04, 0.3),
                                duration: 0.3,
                                type: 'spring',
                                stiffness: 300,
                                damping: 25,
                              },
                            }),
                            exit: { opacity: 0, transition: { duration: 0.15 } },
                          }}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          custom={index}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-teal-50/70 border-l-4 border-l-teal-600'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Row Selection Checkbox */}
                          <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              id={`table-select-${b.id}`}
                              checked={isSelected}
                              onChange={() => handleToggleSelectBooking(b.id)}
                              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                              title={`Select reservation #${b.referenceNumber}`}
                            />
                          </td>
                          {/* Ref & Guest */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{b.guest.firstName} {b.guest.lastName}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                                #{b.referenceNumber}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {b.guest.country || 'Hostel Guest'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {b.guest.phone}
                            </div>
                          </td>

                          {/* Room & Dates */}
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-800">{b.roomName}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {formatDisplayDate(b.checkInDate)} → {formatDisplayDate(b.checkOutDate)}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {b.nights} night{b.nights > 1 ? 's' : ''} • {b.guestsCount} guest{b.guestsCount > 1 ? 's' : ''}
                            </p>
                          </td>

                          {/* Stay & Urgency */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                urgency.color === 'urgent'
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : urgency.color === 'warning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : urgency.color === 'info'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {urgency.label}
                            </span>
                            {b.stayReminderSent && (
                              <div className="text-[10px] text-teal-600 font-semibold mt-1 flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" />
                                Reminder sent
                              </div>
                            )}
                          </td>

                          {/* Surf & Add-ons */}
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] font-semibold text-slate-700 capitalize">
                              🏄 {b.guest.surfLevel.replace('_', ' ')}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {b.addOns?.length > 0 ? (
                                <span className="text-teal-700 font-semibold">
                                  {b.addOns.length} add-on{b.addOns.length > 1 ? 's' : ''} booked
                                </span>
                              ) : (
                                <span className="text-slate-400">No add-ons</span>
                              )}
                            </div>
                          </td>

                          {/* Total & Payment */}
                          <td className="py-3.5 px-4">
                            <p className="font-extrabold text-slate-900 text-xs">
                              {settings.currencySymbol}{b.totalAmount.toFixed(2)}
                            </p>
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-full mt-0.5 uppercase ${
                              b.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : b.paymentStatus === 'deposit'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {b.paymentStatus}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <div>{getStatusBadge(b.status)}</div>
                            {b.status === 'cancelled' && b.cancellationReason && (
                              <p 
                                className="text-[10px] text-rose-600 font-semibold mt-1 max-w-[150px] truncate" 
                                title={b.cancellationReason}
                              >
                                {b.cancellationReason}
                              </p>
                            )}
                            {b.status !== 'cancelled' && 
                             (b.paymentStatus === 'unpaid' || b.paymentStatus === 'pending') && 
                             settings.autoCancelUnpaidEnabled && (() => {
                              const days = settings.autoCancelUnpaidDays || 3;
                              const rem = getAutoCancelTimeRemaining(b, days);
                              return (
                                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-1 ${
                                  rem.isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {rem.isOverdue ? 'Overdue' : rem.label}
                                </span>
                              );
                            })()}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Official Invoice & QR Code */}
                              <button
                                type="button"
                                title="View & Download Official Invoice (PDF) with QR Code"
                                onClick={() => setSelectedInvoiceBooking(b)}
                                className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-teal-700" />
                              </button>

                              {/* 1-Click WhatsApp Direct Chat */}
                              <button
                                type="button"
                                title="Send WhatsApp Voucher to Guest"
                                onClick={() => handleSendWhatsAppVoucher(b)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>

                              {/* Pre-arrival upcoming stay reminder */}
                              <button
                                type="button"
                                title="Send Upcoming Stay WhatsApp Alert"
                                onClick={() => handleSendUpcomingReminder(b)}
                                className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit any part */}
                              <button
                                type="button"
                                title="Edit booking details"
                                onClick={() => setEditingBooking(b)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Webhook trigger */}
                              <button
                                type="button"
                                title="Dispatch Webhook event"
                                onClick={() => handleDispatchWebhook(b)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              >
                                <Send className="w-3.5 h-3.5 text-teal-600" />
                              </button>

                              {/* Delete / Remove */}
                              <button
                                type="button"
                                title="Remove booking"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete reservation #${b.referenceNumber} for ${b.guest.firstName}?`)) {
                                    onDeleteBooking(b.id);
                                    showToast(`Deleted reservation #${b.referenceNumber}`);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBooking && (
        <BookingEditModal
          booking={editingBooking}
          rooms={rooms}
          addOns={addOns}
          currencySymbol={settings.currencySymbol}
          onSave={(updated) => {
            onUpdateBooking(updated);
            setEditingBooking(null);
            showToast(`Updated reservation #${updated.referenceNumber}`);
          }}
          onClose={() => setEditingBooking(null)}
        />
      )}

      {/* Official Booking Invoice & QR Modal */}
      {selectedInvoiceBooking && (
        <BookingInvoiceModal
          booking={selectedInvoiceBooking}
          room={rooms.find((r) => r.id === selectedInvoiceBooking.roomId)}
          addOns={addOns}
          settings={settings}
          isOpen={!!selectedInvoiceBooking}
          onClose={() => setSelectedInvoiceBooking(null)}
          onSaveSettings={onSaveSettings}
        />
      )}
    </div>
  );
};
