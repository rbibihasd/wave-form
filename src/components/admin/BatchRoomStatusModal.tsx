import React, { useState, useMemo } from 'react';
import {
  Wrench,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  Check,
  X,
  Bed,
  Search,
  CheckSquare,
  Square,
  Clock,
  Trash2,
  Info,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Booking, Room, RoomMaintenanceBlock, RoomOperationalStatus } from '../../types';
import { addDaysToString, doDatesOverlap, getTodayString, getTomorrowString } from '../../utils/date';

interface BatchRoomStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  bookings: Booking[];
  initialSelectedRoomIds?: string[];
  onBatchUpdateRooms: (updatedRooms: Room[]) => void;
  onSuccessToast?: (message: string) => void;
}

const COMMON_REASONS = [
  'Deep Cleaning & Sanitization',
  'AC / Climate Control Repair',
  'Plumbing & Bathroom Maintenance',
  'Bunk Bed & Mattress Upgrade',
  'Painting & Wall Patching',
  'Electrical & Lighting Service',
  'Surf Rack & Locker Maintenance',
  'Pest Prevention Inspection',
  'Seasonal Hostel Closure / Pause',
  'Private Staff Quarters / Event',
];

export const BatchRoomStatusModal: React.FC<BatchRoomStatusModalProps> = ({
  isOpen,
  onClose,
  rooms,
  bookings,
  initialSelectedRoomIds = [],
  onBatchUpdateRooms,
  onSuccessToast,
}) => {
  const today = getTodayString();
  const tomorrow = getTomorrowString();

  // Selected rooms
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(() => {
    return initialSelectedRoomIds.length > 0 ? initialSelectedRoomIds : [];
  });

  // Target status
  const [targetStatus, setTargetStatus] = useState<'maintenance' | 'inactive' | 'active'>('maintenance');

  // Scope mode: scheduled date range vs permanent base status
  const [scopeMode, setScopeMode] = useState<'date_range' | 'permanent'>('date_range');

  // Dates
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDaysToString(today, 3));

  // Reason & Notes
  const [reasonPreset, setReasonPreset] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState(COMMON_REASONS[0]);
  const [notes, setNotes] = useState('');

  // Search filter for room list
  const [searchQuery, setSearchQuery] = useState('');

  // Active sub-tab: 'batch' (configure new batch) or 'existing' (view & manage existing blocks)
  const [activeView, setActiveView] = useState<'batch' | 'existing'>('batch');

  // Existing blocks across all rooms
  const allExistingBlocks = useMemo(() => {
    const list: { room: Room; block: RoomMaintenanceBlock }[] = [];
    rooms.forEach((room) => {
      if (room.maintenanceBlocks && room.maintenanceBlocks.length > 0) {
        room.maintenanceBlocks.forEach((block) => {
          list.push({ room, block });
        });
      }
    });
    return list;
  }, [rooms]);

  if (!isOpen) return null;

  // Calculate nights
  const nightsCount = useMemo(() => {
    try {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff);
    } catch {
      return 1;
    }
  }, [startDate, endDate]);

  // Conflict detection: find bookings overlapping with selected rooms & date range
  const conflictingBookings = useMemo(() => {
    if (scopeMode !== 'date_range' || targetStatus === 'active') return [];
    if (selectedRoomIds.length === 0 || !startDate || !endDate) return [];

    return bookings.filter((b) => {
      if (!selectedRoomIds.includes(b.roomId)) return false;
      if (b.status === 'cancelled') return false;
      return doDatesOverlap(startDate, endDate, b.checkInDate, b.checkOutDate);
    });
  }, [selectedRoomIds, startDate, endDate, bookings, scopeMode, targetStatus]);

  // Filtered rooms for the multi-select list
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.typeLabel.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      );
    });
  }, [rooms, searchQuery]);

  // Selection handlers
  const handleToggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRoomIds(rooms.map((r) => r.id));
  };

  const handleSelectDorms = () => {
    setSelectedRoomIds(rooms.filter((r) => r.type.startsWith('dorm')).map((r) => r.id));
  };

  const handleSelectPrivates = () => {
    setSelectedRoomIds(rooms.filter((r) => r.type.startsWith('private')).map((r) => r.id));
  };

  const handleClearSelection = () => {
    setSelectedRoomIds([]);
  };

  // Preset date ranges
  const applyDatePreset = (days: number) => {
    setStartDate(today);
    setEndDate(addDaysToString(today, days));
  };

  const applyUpcomingWeekend = () => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday, 5 is Friday
    const daysUntilFriday = (5 - day + 7) % 7;
    const fridayStr = addDaysToString(today, daysUntilFriday === 0 ? 7 : daysUntilFriday);
    const mondayStr = addDaysToString(fridayStr, 3);
    setStartDate(fridayStr);
    setEndDate(mondayStr);
  };

  // Submission handler
  const handleApplyBatchOperation = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRoomIds.length === 0) {
      alert('Please select at least one room to modify.');
      return;
    }

    if (scopeMode === 'date_range' && (!startDate || !endDate || startDate >= endDate)) {
      alert('Please select a valid start and end date (End Date must be after Start Date).');
      return;
    }

    const updatedRooms = rooms.map((room) => {
      if (!selectedRoomIds.includes(room.id)) return room;

      const currentBlocks = [...(room.maintenanceBlocks || [])];

      if (scopeMode === 'permanent') {
        // Permanent / Indefinite base status update
        const operationalStatus: RoomOperationalStatus =
          targetStatus === 'active' ? 'active' : targetStatus;
        return {
          ...room,
          status: operationalStatus,
          isActive: targetStatus === 'active',
        };
      } else {
        // Date range block operation
        if (targetStatus === 'active') {
          // Reactivate: Remove any maintenance/inactive blocks overlapping with this range
          const filteredBlocks = currentBlocks.filter(
            (b) => !doDatesOverlap(startDate, endDate, b.startDate, b.endDate)
          );
          return {
            ...room,
            maintenanceBlocks: filteredBlocks,
            isActive: true,
            status: 'active' as RoomOperationalStatus,
          };
        } else {
          // Add new scheduled maintenance or inactive block
          const newBlock: RoomMaintenanceBlock = {
            id: 'maint-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            startDate,
            endDate,
            status: targetStatus,
            reason: customReason.trim() || reasonPreset,
            notes: notes.trim() || undefined,
            createdAt: new Date().toISOString(),
          };

          // Filter out existing blocks that are completely encompassed to avoid duplicate overlap
          const cleanBlocks = currentBlocks.filter(
            (b) => !(b.startDate >= startDate && b.endDate <= endDate)
          );

          return {
            ...room,
            maintenanceBlocks: [...cleanBlocks, newBlock],
          };
        }
      }
    });

    onBatchUpdateRooms(updatedRooms);

    const roomNames = rooms
      .filter((r) => selectedRoomIds.includes(r.id))
      .map((r) => r.name)
      .join(', ');

    const statusLabel =
      targetStatus === 'maintenance'
        ? 'Maintenance'
        : targetStatus === 'inactive'
        ? 'Inactive'
        : 'Active';

    const msg =
      scopeMode === 'date_range'
        ? `Set ${selectedRoomIds.length} room(s) to ${statusLabel} from ${startDate} to ${endDate}`
        : `Updated base operational status of ${selectedRoomIds.length} room(s) to ${statusLabel}`;

    if (onSuccessToast) {
      onSuccessToast(msg);
    }

    onClose();
  };

  // Remove a single maintenance block
  const handleRemoveSingleBlock = (roomId: string, blockId: string) => {
    const updatedRooms = rooms.map((room) => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        maintenanceBlocks: (room.maintenanceBlocks || []).filter((b) => b.id !== blockId),
      };
    });

    onBatchUpdateRooms(updatedRooms);
    if (onSuccessToast) {
      onSuccessToast('Maintenance block removed successfully.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <Wrench className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base text-white">
                  Batch Room Status & Maintenance Tool
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Inventory Batch Tool
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Set multiple rooms to Maintenance or Inactive for scheduled date ranges in one batch operation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top View Toggle Tabs */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('batch')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'batch'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Configure Batch Operation</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('existing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'existing'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Scheduled Blocks ({allExistingBlocks.length})</span>
            </button>
          </div>

          {selectedRoomIds.length > 0 && activeView === 'batch' && (
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              {selectedRoomIds.length} of {rooms.length} rooms selected
            </span>
          )}
        </div>

        {activeView === 'existing' ? (
          /* View & Manage Existing Maintenance Blocks */
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-extrabold text-sm text-slate-900">
                  Active & Scheduled Room Maintenance Blocks
                </h4>
                <p className="text-xs text-slate-500">
                  Review or release rooms early if repairs or cleaning have finished ahead of schedule.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('batch')}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                + Schedule New Batch
              </button>
            </div>

            {allExistingBlocks.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Wrench className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No Scheduled Maintenance Blocks</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  All rooms are currently operating normally without scheduled maintenance periods.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allExistingBlocks.map(({ room, block }) => {
                  const isCurrent = today >= block.startDate && today <= block.endDate;
                  const isMaintenance = block.status === 'maintenance';

                  return (
                    <div
                      key={block.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? isMaintenance
                            ? 'bg-amber-50/70 border-amber-300'
                            : 'bg-rose-50/70 border-rose-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                            isMaintenance
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <Wrench className="w-4 h-4" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900">
                              {room.name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {room.typeLabel}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isMaintenance
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-rose-100 text-rose-900 border border-rose-200'
                              }`}
                            >
                              {block.status}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                                Active Today
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                            <span className="font-semibold text-slate-900 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {block.startDate} <ArrowRight className="w-3 h-3 text-slate-400" />{' '}
                              {block.endDate}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-medium text-slate-700">{block.reason}</span>
                          </div>

                          {block.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-1 bg-white/60 p-1.5 rounded-lg border border-slate-200/60 inline-block">
                              Note: {block.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSingleBlock(room.id, block.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold border border-slate-200 hover:border-rose-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                        title="Remove block and reactivate room"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Clear Block</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Form: Configure New Batch Operation */
          <form onSubmit={handleApplyBatchOperation} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* Step 1: Select Rooms */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-heading font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Select Target Rooms ({selectedRoomIds.length} selected)</span>
                </label>

                {/* Quick Selection Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectDorms}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors"
                  >
                    All Dorms
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectPrivates}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors"
                  >
                    All Privates
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-[10px] transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Room Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter rooms by name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-teal-600"
                />
              </div>

              {/* Rooms Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-200/80 rounded-2xl bg-slate-50/50">
                {filteredRooms.map((room) => {
                  const isSelected = selectedRoomIds.includes(room.id);
                  const activeBlocks = room.maintenanceBlocks?.length || 0;

                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => handleToggleRoom(room.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-teal-50 border-teal-500 shadow-xs ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="mt-0.5 text-teal-600">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-teal-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {room.name}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                              !room.isActive
                                ? 'bg-rose-100 text-rose-800'
                                : room.status === 'maintenance'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {!room.isActive
                              ? 'Offline'
                              : room.status === 'maintenance'
                              ? 'Maint'
                              : 'Active'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{room.typeLabel}</span>
                          <span className="font-semibold">{room.capacity} beds</span>
                        </div>

                        {activeBlocks > 0 && (
                          <span className="inline-block mt-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                            {activeBlocks} block scheduled
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Target Status & Scope */}
            <div className="space-y-3">
              <label className="font-heading font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Select Target Status & Application Scope</span>
              </label>

              {/* Status Mode Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetStatus('maintenance')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    targetStatus === 'maintenance'
                      ? 'bg-amber-50 border-amber-500 shadow-sm ring-1 ring-amber-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Wrench className="w-4 h-4" />
                    </span>
                    {targetStatus === 'maintenance' && (
                      <Check className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Maintenance Status</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Repairs, servicing, deep sanitization, or remodeling.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetStatus('inactive')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    targetStatus === 'inactive'
                      ? 'bg-rose-50 border-rose-500 shadow-sm ring-1 ring-rose-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                    {targetStatus === 'inactive' && (
                      <Check className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Inactive / Offline</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Seasonal closure, private host reserve, or staff quarters.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetStatus('active')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    targetStatus === 'active'
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <RefreshCw className="w-4 h-4" />
                    </span>
                    {targetStatus === 'active' && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Reactivate / Restore</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Remove scheduled blocks and restore rooms to sellable inventory.
                    </p>
                  </div>
                </button>
              </div>

              {/* Scope Mode (Date Range vs Permanent) */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="scopeMode"
                    value="date_range"
                    checked={scopeMode === 'date_range'}
                    onChange={() => setScopeMode('date_range')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span>Specific Date Range (Scheduled Block)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="scopeMode"
                    value="permanent"
                    checked={scopeMode === 'permanent'}
                    onChange={() => setScopeMode('permanent')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span>Indefinite / Permanent Operational Status</span>
                </label>
              </div>
            </div>

            {/* Step 3: Date Range Configuration (if scopeMode === 'date_range') */}
            {scopeMode === 'date_range' && (
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-heading font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Date Range Schedule</span>
                    <span className="text-[11px] font-semibold text-teal-700 ml-1">
                      ({nightsCount} night{nightsCount === 1 ? '' : 's'})
                    </span>
                  </label>

                  {/* Fast Date Presets */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyDatePreset(1)}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px]"
                    >
                      +1d
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(3)}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px]"
                    >
                      +3d
                    </button>
                    <button
                      type="button"
                      onClick={applyUpcomingWeekend}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px]"
                    >
                      Weekend
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(7)}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px]"
                    >
                      1 Week
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(14)}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px]"
                    >
                      2 Weeks
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(30)}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px]"
                    >
                      1 Month
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Start Date (From)
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      min={today}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      End Date (To / Check-Out)
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      min={startDate || today}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Reason & Work Order Notes (for Maintenance / Inactive) */}
            {targetStatus !== 'active' && (
              <div className="space-y-3">
                <label className="font-heading font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                    {scopeMode === 'date_range' ? '4' : '3'}
                  </span>
                  <span>Reason & Maintenance Work Notes</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Common Reason Preset
                    </label>
                    <select
                      value={reasonPreset}
                      onChange={(e) => {
                        setReasonPreset(e.target.value);
                        setCustomReason(e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
                    >
                      {COMMON_REASONS.map((r, i) => (
                        <option key={i} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Custom Reason Description
                    </label>
                    <input
                      type="text"
                      required
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="e.g. Bathroom tile repair & repainting"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Internal Staff & Housekeeping Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Technician arriving on Monday at 09:00. Contractor phone: +351 912 345..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Conflict Detection Banner */}
            {conflictingBookings.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-xs">
                    Booking Conflict Alert: {conflictingBookings.length} active reservation(s) found during this window.
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Existing reservations will remain preserved in the system, but the rooms will be blocked from receiving any new reservations for these dates.
                </p>

                <div className="mt-2 max-h-32 overflow-y-auto space-y-1 bg-white/70 p-2 rounded-xl border border-amber-200">
                  {conflictingBookings.map((b) => (
                    <div
                      key={b.id}
                      className="text-[10px] flex items-center justify-between text-slate-800 py-0.5 border-b border-amber-100 last:border-b-0"
                    >
                      <span className="font-bold">
                        {b.guest.firstName} {b.guest.lastName} ({b.referenceNumber})
                      </span>
                      <span className="text-slate-500">
                        {b.roomName} • {b.checkInDate} to {b.checkOutDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Execution Button & Summary */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                {selectedRoomIds.length === 0 ? (
                  <span className="text-rose-600 font-semibold">Select at least one room to proceed</span>
                ) : (
                  <span>
                    Ready to update <strong>{selectedRoomIds.length}</strong> room(s) to{' '}
                    <strong className="capitalize">{targetStatus}</strong>{' '}
                    {scopeMode === 'date_range' ? `for ${nightsCount} nights (${startDate} → ${endDate})` : 'indefinitely'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={selectedRoomIds.length === 0}
                  className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-white shadow-sm transition-all ${
                    selectedRoomIds.length === 0
                      ? 'bg-slate-300 cursor-not-allowed'
                      : targetStatus === 'maintenance'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : targetStatus === 'inactive'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>
                    {targetStatus === 'active'
                      ? 'Apply Batch Reactivation'
                      : `Apply Batch ${targetStatus === 'maintenance' ? 'Maintenance' : 'Inactive'} Status`}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
