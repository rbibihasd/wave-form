import React, { useState, useMemo } from 'react';
import { 
  Sparkles, CheckCircle2, Clock, AlertTriangle, Filter, Search, 
  Bed, Users, Calendar, Check, X, RotateCcw, User, FileText, 
  Wrench, Printer, ShieldCheck, ChevronDown, ChevronUp, CheckSquare, 
  Square, ArrowUpRight, Plus, RefreshCw, AlertCircle, Eye
} from 'lucide-react';
import { Booking, HostelSettings, Room, RoomCleaningRecord, CleaningStatus, RoomCleaningChecklist } from '../../types';
import { formatDisplayDate, getTodayString } from '../../utils/date';
import { getStoredHousekeeping, saveStoredHousekeeping } from '../../utils/storage';

interface HousekeepingManagerProps {
  rooms: Room[];
  bookings: Booking[];
  settings: HostelSettings;
  onSelectRoom?: (roomId: string) => void;
}

const DEFAULT_STAFF_MEMBERS = ['Maria S.', 'Carlos R.', 'Elena T.', 'Joao M.', 'Staff On Duty'];

const DEFAULT_CHECKLIST: RoomCleaningChecklist = {
  linensChanged: false,
  towelsReplaced: false,
  bathroomSanitized: false,
  floorsMopped: false,
  trashEmptied: false,
  suppliesRestocked: false,
};

export const HousekeepingManager: React.FC<HousekeepingManagerProps> = ({
  rooms,
  bookings,
  settings,
  onSelectRoom,
}) => {
  const todayStr = useMemo(() => getTodayString(), []);

  // Housekeeping records state synced with storage
  const [cleaningRecords, setCleaningRecords] = useState<Record<string, RoomCleaningRecord>>(() => 
    getStoredHousekeeping(rooms)
  );

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | CleaningStatus | 'arrivals_today'>('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'dorm' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChecklistRoomId, setExpandedChecklistRoomId] = useState<string | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Printable sheet modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Maintenance modal
  const [maintenanceModalRoom, setMaintenanceModalRoom] = useState<Room | null>(null);
  const [maintenanceInput, setMaintenanceInput] = useState('');

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Helper to persist updates
  const updateRoomCleaning = (roomId: string, updates: Partial<RoomCleaningRecord>) => {
    setCleaningRecords((prev) => {
      const existing = prev[roomId] || {
        roomId,
        status: 'needs_cleaning',
        checklist: { ...DEFAULT_CHECKLIST },
      };

      const updatedRecord: RoomCleaningRecord = {
        ...existing,
        ...updates,
      };

      const next = {
        ...prev,
        [roomId]: updatedRecord,
      };

      saveStoredHousekeeping(next);
      return next;
    });
  };

  // Status changer handler
  const handleSetStatus = (room: Room, newStatus: CleaningStatus, staffName?: string) => {
    const isNowReady = newStatus === 'ready';
    const nowIso = new Date().toISOString();

    const existing = cleaningRecords[room.id];
    const currentChecklist = existing?.checklist || { ...DEFAULT_CHECKLIST };

    // If marked ready, check all checklist items automatically
    const nextChecklist = isNowReady
      ? {
          linensChanged: true,
          towelsReplaced: true,
          bathroomSanitized: true,
          floorsMopped: true,
          trashEmptied: true,
          suppliesRestocked: true,
        }
      : currentChecklist;

    updateRoomCleaning(room.id, {
      status: newStatus,
      lastCleanedAt: isNowReady ? nowIso : existing?.lastCleanedAt,
      cleanedBy: staffName || existing?.cleanedBy || (isNowReady ? 'Maria S.' : undefined),
      checklist: nextChecklist,
    });

    const statusLabels: Record<CleaningStatus, string> = {
      needs_cleaning: 'Needs Cleaning',
      in_progress: 'In Progress',
      ready: 'Ready for Check-ins',
    };

    showToast(`"${room.name}" updated to: ${statusLabels[newStatus]}!`, 'success');
  };

  // Toggle individual checklist item
  const handleToggleChecklistItem = (roomId: string, key: keyof RoomCleaningChecklist) => {
    const record = cleaningRecords[roomId];
    const currentList = record?.checklist || { ...DEFAULT_CHECKLIST };
    const nextList = {
      ...currentList,
      [key]: !currentList[key],
    };

    // If all items checked, prompt or automatically mark ready
    const allChecked = Object.values(nextList).every(Boolean);

    updateRoomCleaning(roomId, {
      checklist: nextList,
      status: allChecked ? 'ready' : record?.status === 'ready' ? 'in_progress' : record?.status || 'needs_cleaning',
      lastCleanedAt: allChecked ? new Date().toISOString() : record?.lastCleanedAt,
    });
  };

  // Toggle all checklist items for a room
  const handleToggleAllChecklist = (roomId: string, markAllTrue: boolean) => {
    const nextList: RoomCleaningChecklist = {
      linensChanged: markAllTrue,
      towelsReplaced: markAllTrue,
      bathroomSanitized: markAllTrue,
      floorsMopped: markAllTrue,
      trashEmptied: markAllTrue,
      suppliesRestocked: markAllTrue,
    };

    updateRoomCleaning(roomId, {
      checklist: nextList,
      status: markAllTrue ? 'ready' : 'needs_cleaning',
      lastCleanedAt: markAllTrue ? new Date().toISOString() : undefined,
    });

    showToast(markAllTrue ? 'All cleaning tasks checked & marked Ready!' : 'Checklist reset to unchecked.', 'info');
  };

  // Save notes inline
  const handleUpdateNotes = (roomId: string, notes: string) => {
    updateRoomCleaning(roomId, { notes });
  };

  // Save staff assignment
  const handleAssignStaff = (roomId: string, cleanedBy: string) => {
    updateRoomCleaning(roomId, { cleanedBy });
    showToast(`Assigned ${cleanedBy} to room.`, 'info');
  };

  // Batch action: Mark all currently filtered as Ready
  const handleMarkAllFilteredReady = () => {
    const nowIso = new Date().toISOString();
    const next = { ...cleaningRecords };

    filteredRooms.forEach((r) => {
      next[r.id] = {
        ...(next[r.id] || { roomId: r.id }),
        status: 'ready',
        lastCleanedAt: nowIso,
        cleanedBy: next[r.id]?.cleanedBy || 'Housekeeping Team',
        checklist: {
          linensChanged: true,
          towelsReplaced: true,
          bathroomSanitized: true,
          floorsMopped: true,
          trashEmptied: true,
          suppliesRestocked: true,
        },
      };
    });

    setCleaningRecords(next);
    saveStoredHousekeeping(next);
    showToast(`Marked all ${filteredRooms.length} rooms as Ready for Check-ins!`, 'success');
  };

  // Batch action: Reset all rooms to Needs Cleaning (e.g. morning turnover start)
  const handleResetMorningTurnover = () => {
    if (!window.confirm('Reset all active rooms to "Needs Cleaning" for the morning turnover shift?')) {
      return;
    }

    const next = { ...cleaningRecords };
    rooms.forEach((r) => {
      next[r.id] = {
        ...(next[r.id] || { roomId: r.id }),
        status: 'needs_cleaning',
        checklist: { ...DEFAULT_CHECKLIST },
        priority: 'normal',
      };
    });

    setCleaningRecords(next);
    saveStoredHousekeeping(next);
    showToast('All rooms reset to "Needs Cleaning" for today\'s shift.', 'info');
  };

  // Map today's check-ins and check-outs per room
  const dailyGuestContext = useMemo(() => {
    const map: Record<string, {
      checkInsToday: Booking[];
      checkOutsToday: Booking[];
      inHouseStays: Booking[];
      hasTurnoverToday: boolean;
      occupancyStatus: 'turnover' | 'arrival_only' | 'departure_only' | 'stayover' | 'vacant';
    }> = {};

    rooms.forEach((room) => {
      const roomBookings = bookings.filter((b) => b.roomId === room.id && b.status !== 'cancelled');

      const checkInsToday = roomBookings.filter((b) => b.checkInDate === todayStr);
      const checkOutsToday = roomBookings.filter((b) => b.checkOutDate === todayStr);
      const inHouseStays = roomBookings.filter((b) => todayStr > b.checkInDate && todayStr < b.checkOutDate);

      const hasTurnoverToday = checkInsToday.length > 0 && checkOutsToday.length > 0;

      let occupancyStatus: 'turnover' | 'arrival_only' | 'departure_only' | 'stayover' | 'vacant' = 'vacant';
      if (hasTurnoverToday) {
        occupancyStatus = 'turnover';
      } else if (checkInsToday.length > 0) {
        occupancyStatus = 'arrival_only';
      } else if (checkOutsToday.length > 0) {
        occupancyStatus = 'departure_only';
      } else if (inHouseStays.length > 0) {
        occupancyStatus = 'stayover';
      }

      map[room.id] = {
        checkInsToday,
        checkOutsToday,
        inHouseStays,
        hasTurnoverToday,
        occupancyStatus,
      };
    });

    return map;
  }, [rooms, bookings, todayStr]);

  // Filtered rooms list
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (!r.isActive) return false;

      // Room Type filter
      if (roomTypeFilter === 'dorm' && !r.type.startsWith('dorm')) return false;
      if (roomTypeFilter === 'private' && !r.type.startsWith('private')) return false;

      // Status filter
      const record = cleaningRecords[r.id];
      const status: CleaningStatus = record?.status || 'needs_cleaning';

      if (statusFilter === 'arrivals_today') {
        const context = dailyGuestContext[r.id];
        if (!context || context.checkInsToday.length === 0) return false;
      } else if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(query);
        const matchesType = r.typeLabel.toLowerCase().includes(query);
        const matchesStaff = record?.cleanedBy?.toLowerCase().includes(query);
        const matchesNotes = record?.notes?.toLowerCase().includes(query);
        if (!matchesName && !matchesType && !matchesStaff && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [rooms, roomTypeFilter, statusFilter, cleaningRecords, dailyGuestContext, searchQuery]);

  // Overall statistics
  const stats = useMemo(() => {
    const activeRooms = rooms.filter((r) => r.isActive);
    const total = activeRooms.length;
    let readyCount = 0;
    let inProgressCount = 0;
    let needsCleaningCount = 0;
    let arrivalsTodayCount = 0;
    let urgentTurnoversCount = 0;

    activeRooms.forEach((r) => {
      const record = cleaningRecords[r.id];
      const status: CleaningStatus = record?.status || 'needs_cleaning';
      if (status === 'ready') readyCount++;
      else if (status === 'in_progress') inProgressCount++;
      else needsCleaningCount++;

      const context = dailyGuestContext[r.id];
      if (context && context.checkInsToday.length > 0) {
        arrivalsTodayCount++;
        if (status !== 'ready') {
          urgentTurnoversCount++;
        }
      }
    });

    const readyPercent = total > 0 ? Math.round((readyCount / total) * 100) : 0;

    return {
      total,
      readyCount,
      inProgressCount,
      needsCleaningCount,
      readyPercent,
      arrivalsTodayCount,
      urgentTurnoversCount,
    };
  }, [rooms, cleaningRecords, dailyGuestContext]);

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center justify-between gap-3 shadow-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner & Operational Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-200/80 shadow-2xs">
                <Sparkles className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-black text-lg text-slate-900 tracking-tight">
                    Housekeeping & Daily Cleaning Status
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    Live Operations
                  </span>
                  {stats.urgentTurnoversCount > 0 && (
                    <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>{stats.urgentTurnoversCount} Check-in(s) Need Cleaning</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track room turnaround in real time. Mark spaces as <strong className="text-rose-600">Needs Cleaning</strong>, <strong className="text-amber-600">In Progress</strong>, or <strong className="text-emerald-600">Ready</strong> for incoming guests.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Print Sheet & Morning Reset */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              id="housekeeping-print-sheet-btn"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="View & Print formatted Housekeeping Run-Sheet for on-duty staff"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Run-Sheet</span>
            </button>

            <button
              type="button"
              id="housekeeping-mark-all-ready-btn"
              onClick={handleMarkAllFilteredReady}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Filtered as Ready</span>
            </button>

            <button
              type="button"
              id="housekeeping-reset-shift-btn"
              onClick={handleResetMorningTurnover}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset all rooms to 'Needs Cleaning' for shift start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Operational KPI Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          {/* 1. Ready for Check-ins */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'ready' ? 'all' : 'ready')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'ready' 
                ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500' 
                : 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Ready for Check-ins
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-heading font-black text-emerald-950">
                {stats.readyCount}
              </span>
              <span className="text-xs font-bold text-emerald-700">
                of {stats.total} ({stats.readyPercent}%)
              </span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.readyPercent}%` }}
              />
            </div>
          </div>

          {/* 2. In Progress */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'in_progress' 
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-500' 
                : 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                In Progress
              </span>
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-heading font-black text-amber-950">
                {stats.inProgressCount}
              </span>
              <span className="text-xs font-medium text-amber-700">
                rooms cleaning
              </span>
            </div>
            <p className="text-[10px] text-amber-800/80 mt-2 font-medium">
              Staff actively working
            </p>
          </div>

          {/* 3. Needs Cleaning */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'needs_cleaning' ? 'all' : 'needs_cleaning')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'needs_cleaning' 
                ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500' 
                : 'bg-rose-50/50 border-rose-200/80 hover:bg-rose-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Needs Cleaning
              </span>
              <div className="w-7 h-7 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-heading font-black text-rose-950">
                {stats.needsCleaningCount}
              </span>
              <span className="text-xs font-medium text-rose-700">
                pending clean
              </span>
            </div>
            <p className="text-[10px] text-rose-800/80 mt-2 font-medium">
              {stats.urgentTurnoversCount > 0 
                ? `${stats.urgentTurnoversCount} arriving today!` 
                : 'Awaiting turnover'}
            </p>
          </div>

          {/* 4. Arrivals Scheduled Today */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'arrivals_today' ? 'all' : 'arrivals_today')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'arrivals_today' 
                ? 'bg-teal-50/90 border-teal-300 ring-2 ring-teal-500' 
                : 'bg-teal-50/50 border-teal-200/80 hover:bg-teal-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Arrivals Today
              </span>
              <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-heading font-black text-teal-950">
                {stats.arrivalsTodayCount}
              </span>
              <span className="text-xs font-medium text-teal-700">
                rooms receiving guests
              </span>
            </div>
            <p className="text-[10px] text-teal-800/80 mt-2 font-medium">
              Check-in from {settings.checkInTime || '14:00'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: `All Rooms (${rooms.length})` },
            { id: 'needs_cleaning', label: `Needs Cleaning (${stats.needsCleaningCount})`, color: 'text-rose-700' },
            { id: 'in_progress', label: `In Progress (${stats.inProgressCount})`, color: 'text-amber-700' },
            { id: 'ready', label: `Ready (${stats.readyCount})`, color: 'text-emerald-700' },
            { id: 'arrivals_today', label: `Arrivals Today (${stats.arrivalsTodayCount})`, color: 'text-teal-700' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`housekeeping-filter-${tab.id}`}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Room Type */}
        <div className="flex items-center gap-2">
          {/* Room Type Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold shrink-0">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'dorm', label: 'Dorms' },
              { id: 'private', label: 'Privates' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRoomTypeFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] cursor-pointer ${
                  roomTypeFilter === f.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="housekeeping-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room, staff, notes..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rooms Cleaning Cards Grid */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h4 className="font-heading font-extrabold text-base text-slate-800">No rooms match your filter</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your status filter or search keywords to view other rooms.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setRoomTypeFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRooms.map((room) => {
            const record = cleaningRecords[room.id] || {
              roomId: room.id,
              status: 'needs_cleaning',
              checklist: { ...DEFAULT_CHECKLIST },
            };
            const currentStatus: CleaningStatus = record.status || 'needs_cleaning';
            const context = dailyGuestContext[room.id];
            const isCheckInToday = context && context.checkInsToday.length > 0;
            const isCheckOutToday = context && context.checkOutsToday.length > 0;
            const isInHouse = context && context.inHouseStays.length > 0;
            const isChecklistOpen = expandedChecklistRoomId === room.id;

            const checklist = record.checklist || { ...DEFAULT_CHECKLIST };
            const completedChecklistCount = Object.values(checklist).filter(Boolean).length;
            const totalChecklistCount = Object.keys(DEFAULT_CHECKLIST).length;

            return (
              <div
                key={room.id}
                id={`housekeeping-room-card-${room.id}`}
                className={`bg-white rounded-3xl border transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between overflow-hidden ${
                  currentStatus === 'ready'
                    ? 'border-emerald-200/90'
                    : currentStatus === 'in_progress'
                    ? 'border-amber-200/90'
                    : isCheckInToday
                    ? 'border-rose-300 ring-1 ring-rose-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Card Top Section */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Room Identification & Status Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {room.image ? (
                        <img
                          src={room.image}
                          alt={room.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-200 shrink-0">
                          <Bed className="w-5 h-5 text-teal-600" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-heading font-extrabold text-sm text-slate-900">
                            {room.name}
                          </h4>
                          {room.hasOceanView && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                              Ocean
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-600">
                            {room.capacity} {room.capacity === 1 ? 'bed' : 'beds'}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{room.type.startsWith('dorm') ? 'Dorm' : 'Private'}</span>
                          <span>•</span>
                          <span>{room.bathroomType === 'private_ensuite' ? 'Ensuite' : 'Shared Bath'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Cleaning Status Badge */}
                    <div className="shrink-0">
                      {currentStatus === 'ready' && (
                        <span 
                          id={`status-badge-ready-${room.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Ready</span>
                        </span>
                      )}

                      {currentStatus === 'in_progress' && (
                        <span 
                          id={`status-badge-progress-${room.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 text-xs font-black shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                          <span>In Progress</span>
                        </span>
                      )}

                      {currentStatus === 'needs_cleaning' && (
                        <span 
                          id={`status-badge-needs-clean-${room.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-xs font-black shadow-2xs"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                          <span>Needs Cleaning</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Interactive Status Switcher */}
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Change Room Cleaning Status:
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      {/* Needs Cleaning Button */}
                      <button
                        type="button"
                        id={`btn-set-needs-clean-${room.id}`}
                        onClick={() => handleSetStatus(room, 'needs_cleaning')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentStatus === 'needs_cleaning'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-rose-700 hover:bg-white/80'
                        }`}
                      >
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Needs Clean</span>
                      </button>

                      {/* In Progress Button */}
                      <button
                        type="button"
                        id={`btn-set-in-progress-${room.id}`}
                        onClick={() => handleSetStatus(room, 'in_progress')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentStatus === 'in_progress'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-amber-700 hover:bg-white/80'
                        }`}
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>In Progress</span>
                      </button>

                      {/* Ready Button */}
                      <button
                        type="button"
                        id={`btn-set-ready-${room.id}`}
                        onClick={() => handleSetStatus(room, 'ready')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentStatus === 'ready'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Ready</span>
                      </button>
                    </div>
                  </div>

                  {/* Today's Arrival / Turnover Context Banner */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-xs space-y-2">
                    {/* Check-ins arriving today */}
                    {isCheckInToday ? (
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-lg bg-teal-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <ArrowUpRight className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span className="text-teal-700">Check-in Today:</span>
                            {context.checkInsToday.map((b) => (
                              <span key={b.id} className="text-slate-800">
                                {b.guest.firstName} {b.guest.lastName} ({b.guestsCount} {b.guestsCount === 1 ? 'bed' : 'beds'})
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Check-in from {settings.checkInTime || '14:00'}.{' '}
                            {currentStatus !== 'ready' ? (
                              <span className="text-rose-600 font-bold">Must finish clean before arrival!</span>
                            ) : (
                              <span className="text-emerald-700 font-bold">Room is certified ready for guest.</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ) : isCheckOutToday ? (
                      /* Check-outs departing today */
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Clock className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block">
                            Departure Today (by {settings.checkOutTime || '11:00'})
                          </span>
                          <p className="text-[11px] text-slate-500">
                            {context.checkOutsToday.map((b) => `${b.guest.firstName} ${b.guest.lastName}`).join(', ')} checking out. Turnover clean required.
                          </p>
                        </div>
                      </div>
                    ) : isInHouse ? (
                      /* Stayover / Currently in house */
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Users className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block">
                            In-House Guest (Stayover)
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Guest staying through {formatDisplayDate(context.inHouseStays[0].checkOutDate)}. Daily tidy & trash removal.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Completely Vacant */
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>No guest arriving today. Available for walk-in booking.</span>
                      </div>
                    )}
                  </div>

                  {/* Staff Assignment & Last Cleaned Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {/* Staff Assigned */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Assigned Cleaner:
                      </label>
                      <select
                        id={`select-cleaner-${room.id}`}
                        value={record.cleanedBy || ''}
                        onChange={(e) => handleAssignStaff(room.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {DEFAULT_STAFF_MEMBERS.map((staff) => (
                          <option key={staff} value={staff}>
                            {staff}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Last Cleaned Stamp */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Last Inspection:
                      </label>
                      <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 truncate font-medium">
                        {record.lastCleanedAt ? (
                          <span>{new Date(record.lastCleanedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Ready</span>
                        ) : (
                          <span className="text-slate-400 italic">Not inspected yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Inspection Checklist */}
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/40">
                    <button
                      type="button"
                      onClick={() => setExpandedChecklistRoomId(isChecklistOpen ? null : room.id)}
                      className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                        <span>Turnover Checklist</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                          completedChecklistCount === totalChecklistCount 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {completedChecklistCount}/{totalChecklistCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-[11px] font-normal">{isChecklistOpen ? 'Hide' : 'Show tasks'}</span>
                        {isChecklistOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {isChecklistOpen && (
                      <div className="p-3 bg-white border-t border-slate-200/80 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between pb-1 text-[11px]">
                          <span className="text-slate-400 font-semibold">Standard Turnover Steps:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleAllChecklist(room.id, true)}
                              className="text-teal-700 hover:text-teal-800 font-bold hover:underline"
                            >
                              Check All
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleToggleAllChecklist(room.id, false)}
                              className="text-slate-500 hover:text-slate-700 font-medium hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                          {[
                            { key: 'linensChanged' as const, label: 'Fresh bed linens' },
                            { key: 'towelsReplaced' as const, label: 'Bath towels replaced' },
                            { key: 'bathroomSanitized' as const, label: 'Sanitized bathroom' },
                            { key: 'floorsMopped' as const, label: 'Mopped & swept floor' },
                            { key: 'trashEmptied' as const, label: 'Bins emptied & relined' },
                            { key: 'suppliesRestocked' as const, label: 'Toiletries restocked' },
                          ].map((item) => {
                            const isChecked = Boolean(checklist[item.key]);
                            return (
                              <label
                                key={item.key}
                                className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-semibold'
                                    : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleChecklistItem(room.id, item.key)}
                                  className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                                />
                                <span>{item.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes / Special Housekeeping Instructions */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Cleaning Notes & Special Requests:
                    </label>
                    <input
                      type="text"
                      id={`input-notes-${room.id}`}
                      defaultValue={record.notes || ''}
                      onBlur={(e) => handleUpdateNotes(room.id, e.target.value)}
                      placeholder="e.g. Extra blanket provided, locker key checked..."
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>

                  {/* Maintenance Flag if reported */}
                  {record.maintenanceNeeded && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-2">
                      <Wrench className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-extrabold text-amber-900 block">Maintenance Issue Flagged:</span>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          {record.maintenanceNotes || 'Repairs requested by cleaning staff.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom Footer with Quick Actions */}
                <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMaintenanceModalRoom(room);
                      setMaintenanceInput(record.maintenanceNotes || '');
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{record.maintenanceNeeded ? 'Edit Repair' : 'Report Issue'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {onSelectRoom && (
                      <button
                        type="button"
                        onClick={() => onSelectRoom(room.id)}
                        className="text-[11px] font-bold text-slate-500 hover:text-teal-700 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-slate-200/60"
                        title="View inventory settings in Rooms tab"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Room Info</span>
                      </button>
                    )}

                    {currentStatus !== 'ready' ? (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(room, 'ready')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(room, 'needs_cleaning')}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Re-open Clean</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Maintenance Report Modal */}
      {maintenanceModalRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-base text-slate-900">
                    Maintenance / Repair Flag
                  </h4>
                  <p className="text-xs text-slate-500">
                    {maintenanceModalRoom.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceModalRoom(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Describe the issue observed during cleaning:
              </label>
              <textarea
                rows={3}
                value={maintenanceInput}
                onChange={(e) => setMaintenanceInput(e.target.value)}
                placeholder="e.g. Shower drain slow, bunk light bulb needs replacement, door latch sticking..."
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {cleaningRecords[maintenanceModalRoom.id]?.maintenanceNeeded && (
                <button
                  type="button"
                  onClick={() => {
                    updateRoomCleaning(maintenanceModalRoom.id, {
                      maintenanceNeeded: false,
                      maintenanceNotes: '',
                    });
                    setMaintenanceModalRoom(null);
                    showToast('Cleared maintenance issue.', 'info');
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700"
                >
                  Clear Issue
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setMaintenanceModalRoom(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateRoomCleaning(maintenanceModalRoom.id, {
                      maintenanceNeeded: true,
                      maintenanceNotes: maintenanceInput.trim(),
                    });
                    setMaintenanceModalRoom(null);
                    showToast(`Logged maintenance flag for ${maintenanceModalRoom.name}`, 'success');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Save Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Daily Housekeeping Run-Sheet Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-black text-xl text-slate-900">
                    {settings.name} — Daily Housekeeping Run-Sheet
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Generated on {formatDisplayDate(todayStr)} • Check-in Time: {settings.checkInTime || '14:00'} • Check-out Time: {settings.checkOutTime || '11:00'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Run-sheet Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-extrabold text-[11px] uppercase tracking-wider text-slate-700">
                    <th className="p-3">Room / Space</th>
                    <th className="p-3">Type & Beds</th>
                    <th className="p-3">Today's Guests / Turnovers</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Assigned</th>
                    <th className="p-3">Notes & Checks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rooms.filter((r) => r.isActive).map((room) => {
                    const record = cleaningRecords[room.id];
                    const status = record?.status || 'needs_cleaning';
                    const context = dailyGuestContext[room.id];

                    return (
                      <tr key={room.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{room.name}</td>
                        <td className="p-3 text-slate-600 capitalize">
                          {room.type.startsWith('dorm') ? 'Dorm' : 'Private'} ({room.capacity} beds)
                        </td>
                        <td className="p-3 text-[11px]">
                          {context?.checkInsToday.length ? (
                            <span className="font-bold text-teal-700">
                              Arr: {context.checkInsToday.map((b) => b.guest.firstName).join(', ')}
                            </span>
                          ) : context?.checkOutsToday.length ? (
                            <span className="text-amber-700">
                              Dep: {context.checkOutsToday.map((b) => b.guest.firstName).join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Vacant / Stayover</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                            status === 'ready'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {status === 'ready' ? 'Ready' : status === 'in_progress' ? 'In Progress' : 'Needs Clean'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {record?.cleanedBy || '—'}
                        </td>
                        <td className="p-3 text-[11px] text-slate-500">
                          {record?.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
