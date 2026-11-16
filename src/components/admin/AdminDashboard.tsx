import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarCheck, Calendar, Bell, Bed, Sparkles, Settings, 
  Users, DollarSign, TrendingUp, ShieldCheck, Clock, CheckSquare, CalendarRange, Sliders,
  ArrowRight, Waves, Globe, Zap, MessageCircle
} from 'lucide-react';
import { 
  Booking, HostelSettings, NotificationTemplate, Room, SurfAddOn, 
  WaitlistEntry, AdminTab, StaffUser, StaffRole, RolePermissionsMap 
} from '../../types';
import { LiveOceanSpot } from '../../types/weather';
import { getStayUrgencyBadge } from '../../utils/date';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { checkAndTriggerAutoResponder } from '../../utils/autoResponders';
import { BookingsManager } from './BookingsManager';
import { CalendarGrid } from './CalendarGrid';
import { MonthlyAvailabilityGrid } from './MonthlyAvailabilityGrid';
import { NotificationsManager } from './NotificationsManager';
import { RoomsManager } from './RoomsManager';
import { AddOnsManager } from './AddOnsManager';
import { SettingsManager, SettingsSection } from './SettingsManager';
import { AddWalkInModal } from './AddWalkInModal';
import { WaitlistManager } from './WaitlistManager';
import { AddToWaitlistModal } from './AddToWaitlistModal';
import { AnalyticsCharts } from './AnalyticsCharts';
import { HousekeepingManager } from './HousekeepingManager';
import { AdminNavTabs } from './AdminNavTabs';
import { executeBatchAutoCancellation } from '../../utils/autoCancellation';
import { MonthlyOccupancyChart } from './MonthlyOccupancyChart';
import { ThemeCustomizerModal } from './ThemeCustomizerModal';
import { ProjectedRevenueReport } from './ProjectedRevenueReport';
import { calculate30DayProjectedRevenue } from '../../utils/projectedRevenue';
import { findWaitlistMatches } from '../../utils/waitlistMatching';
import { WaitlistMatchAlertBanner } from './WaitlistMatchAlertBanner';
import { RolesAndPermissionsManager } from './RolesAndPermissionsManager';
import { AdminFormCountryCityCard } from './AdminFormCountryCityCard';
import { 
  getStoredStaffUsers, getStoredCurrentStaffUser, getStoredRolePermissions, 
  saveStoredStaffUsers, saveStoredCurrentStaffUser, saveStoredRolePermissions 
} from '../../utils/storage';
import { hasFullControl } from '../../utils/rbac';
import { AdminProfileMenu } from './AdminProfileMenu';

interface AdminDashboardProps {
  bookings: Booking[];
  rooms: Room[];
  addOns: SurfAddOn[];
  settings: HostelSettings;
  templates: NotificationTemplate[];
  waitlist?: WaitlistEntry[];
  initialTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
  initialSettingsSection?: any;
  staffUsers?: StaffUser[];
  currentStaff?: StaffUser;
  rolePermissions?: Record<StaffRole, RolePermissionsMap>;
  selectedOceanSpot?: LiveOceanSpot;
  onSelectOceanSpot?: (spot: LiveOceanSpot) => void;
  onLogout?: () => void;
  onGoToBooking?: () => void;

  onUpdateBooking: (updated: Booking) => void;
  onBatchUpdateBookings?: (updated: Booking[]) => void;
  onDeleteBooking: (bookingId: string) => void;
  onAddBooking: (newBooking: Booking) => void;
  onUpdateRoom: (room: Room) => void;
  onAddRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  onBatchUpdateRooms?: (rooms: Room[]) => void;
  onUpdateAddOn: (addOn: SurfAddOn) => void;
  onAddAddOn: (addOn: SurfAddOn) => void;
  onDeleteAddOn: (addOnId: string) => void;
  onSaveSettings: (settings: HostelSettings) => void;
  onUpdateTemplate: (template: NotificationTemplate) => void;
  onAddWaitlistEntry?: (entry: WaitlistEntry) => void;
  onUpdateWaitlistEntry?: (entry: WaitlistEntry) => void;
  onDeleteWaitlistEntry?: (entryId: string) => void;
  onConvertWaitlistToBooking?: (entry: WaitlistEntry, newBooking: Booking) => void;
  onGoToWeather?: () => void;
  onSwitchStaffUser?: (user: StaffUser) => void;
  onUpdateRolePermissions?: (matrix: Record<StaffRole, RolePermissionsMap>) => void;
  onAddStaffUser?: (user: StaffUser) => void;
  onUpdateStaffUser?: (user: StaffUser) => void;
  onDeleteStaffUser?: (userId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bookings,
  rooms,
  addOns,
  settings,
  templates,
  waitlist = [],
  initialTab,
  onTabChange,
  initialSettingsSection,
  onGoToWeather,
  onUpdateBooking,
  onBatchUpdateBookings,
  onDeleteBooking,
  onAddBooking,
  onUpdateRoom,
  onAddRoom,
  onDeleteRoom,
  onBatchUpdateRooms,
  onUpdateAddOn,
  onAddAddOn,
  onDeleteAddOn,
  onSaveSettings,
  onUpdateTemplate,
  onAddWaitlistEntry,
  onUpdateWaitlistEntry,
  onDeleteWaitlistEntry,
  onConvertWaitlistToBooking,
  staffUsers,
  currentStaff,
  rolePermissions,
  selectedOceanSpot,
  onSelectOceanSpot,
  onLogout,
  onGoToBooking,
  onSwitchStaffUser,
  onUpdateRolePermissions,
  onAddStaffUser,
  onUpdateStaffUser,
  onDeleteStaffUser,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(
    initialTab || 'bookings'
  );
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection | undefined>(initialSettingsSection);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Staff and Role state with persistent fallbacks
  const [internalStaffUsers, setInternalStaffUsers] = useState<StaffUser[]>(() => staffUsers || getStoredStaffUsers());
  const [internalCurrentStaff, setInternalCurrentStaff] = useState<StaffUser>(() => currentStaff || getStoredCurrentStaffUser());
  const [internalRolePermissions, setInternalRolePermissions] = useState<Record<StaffRole, RolePermissionsMap>>(() => rolePermissions || getStoredRolePermissions());
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  useEffect(() => {
    if (staffUsers) setInternalStaffUsers(staffUsers);
  }, [staffUsers]);

  useEffect(() => {
    if (currentStaff) setInternalCurrentStaff(currentStaff);
  }, [currentStaff]);

  useEffect(() => {
    if (rolePermissions) setInternalRolePermissions(rolePermissions);
  }, [rolePermissions]);

  const activeStaffUser = currentStaff || internalCurrentStaff;
  const activeRoleMatrix = rolePermissions || internalRolePermissions;
  const allStaffUsers = staffUsers || internalStaffUsers;

  const handleSwitchStaff = (user: StaffUser) => {
    if (onSwitchStaffUser) {
      onSwitchStaffUser(user);
    } else {
      setInternalCurrentStaff(user);
      saveStoredCurrentStaffUser(user);
    }
    showActionToast(`Active staff switched to ${user.name} (${user.role.toUpperCase()})`);
    setIsStaffDropdownOpen(false);
  };

  const handleUpdateMatrix = (matrix: Record<StaffRole, RolePermissionsMap>) => {
    if (onUpdateRolePermissions) {
      onUpdateRolePermissions(matrix);
    } else {
      setInternalRolePermissions(matrix);
      saveStoredRolePermissions(matrix);
    }
    showActionToast('Role permissions updated successfully');
  };

  const handleAddStaff = (newUser: StaffUser) => {
    if (onAddStaffUser) {
      onAddStaffUser(newUser);
    } else {
      const updated = [...internalStaffUsers, newUser];
      setInternalStaffUsers(updated);
      saveStoredStaffUsers(updated);
    }
    showActionToast(`Added new staff member: ${newUser.name}`);
  };

  const handleUpdateStaff = (updatedUser: StaffUser) => {
    if (onUpdateStaffUser) {
      onUpdateStaffUser(updatedUser);
    } else {
      const updated = internalStaffUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      setInternalStaffUsers(updated);
      saveStoredStaffUsers(updated);
      if (activeStaffUser.id === updatedUser.id) {
        setInternalCurrentStaff(updatedUser);
        saveStoredCurrentStaffUser(updatedUser);
      }
    }
    showActionToast(`Updated staff details for: ${updatedUser.name}`);
  };

  const handleDeleteStaff = (userId: string) => {
    if (onDeleteStaffUser) {
      onDeleteStaffUser(userId);
    } else {
      const updated = internalStaffUsers.filter((u) => u.id !== userId);
      setInternalStaffUsers(updated);
      saveStoredStaffUsers(updated);
    }
    showActionToast('Staff member removed');
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab((prev) => (prev === initialTab ? prev : initialTab));
    }
  }, [initialTab]);

  const handleTabSelect = (tab: AdminTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInPrefill, setWalkInPrefill] = useState<{ roomId?: string; checkInDate?: string } | null>(null);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [waitlistPrefill, setWaitlistPrefill] = useState<{
    roomId?: string;
    checkInDate?: string;
    checkOutDate?: string;
    guestsCount?: number;
    guest?: any;
  } | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Compute metrics
  const totalRevenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const upcomingArrivals = bookings.filter((b) => {
    if (b.status === 'cancelled' || b.status === 'checked_out') return false;
    const badge = getStayUrgencyBadge(b.checkInDate);
    return badge.days >= 0 && badge.days <= 3;
  });

  const totalBedsCapacity = rooms.reduce((sum, r) => sum + (r.isActive ? r.capacity : 0), 0);
  const activeInHouseGuests = bookings
    .filter((b) => b.status === 'checked_in')
    .reduce((sum, b) => sum + b.guestsCount, 0);

  const occupancyRate = totalBedsCapacity > 0 ? Math.min(100, Math.round((activeInHouseGuests / totalBedsCapacity) * 100)) : 0;
  const activeWaitlistCount = waitlist.filter((w) => w.status === 'waiting' || w.status === 'notified').length;

  // Live Waitlist Vacancy Matching Engine: automatically identifies waitlist entries matching open rooms
  const waitlistMatches = useMemo(() => {
    return findWaitlistMatches(waitlist, rooms, bookings, { includeAlternatives: true });
  }, [waitlist, rooms, bookings]);

  const [actionToast, setActionToast] = useState<string | null>(null);
  const showActionToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 5000);
  };

  // 30-Day Forward Revenue Projection Summary
  const projectedRevenueSummary = useMemo(() => {
    return calculate30DayProjectedRevenue(bookings, rooms, addOns, settings);
  }, [bookings, rooms, addOns, settings]);

  // Auto-cancellation background verification when policy is active
  const [autoCancelNotice, setAutoCancelNotice] = useState<{ count: number; refs: string[] } | null>(null);

  // Live Auto-Responder Event Alert (triggered by status transitions like confirmed or cancelled)
  const [autoResponderAlert, setAutoResponderAlert] = useState<{
    ruleName: string;
    booking: Booking;
    message: string;
    triggerStatus: string;
  } | null>(null);

  const handleDashboardUpdateBooking = (updated: Booking) => {
    const previous = bookings.find((b) => b.id === updated.id);
    if (previous && previous.status !== updated.status) {
      const result = checkAndTriggerAutoResponder(previous.status, updated, settings, rooms);
      if (result && result.triggered && result.rule && result.message) {
        setAutoResponderAlert({
          ruleName: result.rule.name,
          booking: updated,
          message: result.message,
          triggerStatus: updated.status,
        });
      }
    }
    onUpdateBooking(updated);
  };

  const handleDashboardBatchUpdateBookings = (updatedList: Booking[]) => {
    for (const updated of updatedList) {
      const previous = bookings.find((b) => b.id === updated.id);
      if (previous && previous.status !== updated.status) {
        const result = checkAndTriggerAutoResponder(previous.status, updated, settings, rooms);
        if (result && result.triggered && result.rule && result.message) {
          setAutoResponderAlert({
            ruleName: result.rule.name,
            booking: updated,
            message: result.message,
            triggerStatus: updated.status,
          });
          break;
        }
      }
    }
    if (onBatchUpdateBookings) {
      onBatchUpdateBookings(updatedList);
    } else {
      updatedList.forEach((b) => onUpdateBooking(b));
    }
  };

  useEffect(() => {
    if (!settings.autoCancelUnpaidEnabled || !onBatchUpdateBookings) return;

    executeBatchAutoCancellation(bookings, settings)
      .then(({ updatedBookings, cancelledBookings, count }) => {
        if (count > 0) {
          onBatchUpdateBookings(updatedBookings);
          setAutoCancelNotice({
            count,
            refs: cancelledBookings.map((b) => `#${b.referenceNumber}`),
          });
        }
      })
      .catch((err) => {
        console.error('Auto-cancel background check failed:', err);
      });
  }, [settings.autoCancelUnpaidEnabled, settings.autoCancelUnpaidDays]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 w-full max-w-full min-w-0">
      {/* Top Banner & KPI Stat Blocks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
              Hostel Operations & Management
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-teal-400" />
              Full System Access
            </span>
            <button
              type="button"
              id="admin-header-environment-badge"
              onClick={() => {
                setActiveSettingsSection('cloud');
                handleTabSelect('settings');
              }}
              className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
                settings.environmentMode === 'live'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
              title="Click to manage Live Production vs Demo Sandbox environment"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${settings.environmentMode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{settings.environmentMode === 'live' ? 'LIVE PRODUCTION' : 'DEMO SANDBOX'}</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time availability engine, bookings editor, standby room queues, and webhook triggers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 max-w-full">
          {onGoToBooking && (
            <button
              type="button"
              id="admin-header-exit-to-booking-btn"
              onClick={onGoToBooking}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-2xs"
              title="Return to public guest booking form"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Guest Booking</span>
            </button>
          )}

          {/* Quick Form Country & City Location Selector */}
          <button
            type="button"
            id="admin-form-country-city-btn"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200/90 shadow-xs"
            title="Change booking form country and city anytime"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Form: {settings.city || 'Ericeira'}, {settings.country || 'Portugal'}</span>
          </button>

          <button
            type="button"
            id="admin-monthly-grid-quick-btn"
            onClick={() => handleTabSelect('monthlyGrid')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              activeTab === 'monthlyGrid'
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            <CalendarRange className="w-4 h-4 text-teal-500" />
            <span>30-Day Grid</span>
          </button>

          <button
            type="button"
            id="admin-housekeeping-quick-btn"
            onClick={() => handleTabSelect('housekeeping')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              activeTab === 'housekeeping'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-500" />
            <span>Housekeeping</span>
          </button>

          <button
            type="button"
            id="admin-analytics-quick-btn"
            onClick={() => handleTabSelect('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-teal-500" />
            <span>Charts & Analytics</span>
          </button>

          <button
            type="button"
            id="admin-revenue-report-quick-btn"
            onClick={() => handleTabSelect('revenueReport')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              activeTab === 'revenueReport'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>30-Day Revenue</span>
          </button>

          <button
            type="button"
            id="admin-smart-search-quick-btn"
            onClick={() => {
              handleTabSelect('bookings');
              setTimeout(() => {
                document.getElementById('smart-search-autocomplete-input')?.focus();
              }, 100);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              activeTab === 'bookings'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span>Smart Search</span>
          </button>

          <button
            type="button"
            id="admin-theme-customizer-btn"
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs"
            title="Configure corner radii, border widths, and shadow intensities app-wide"
          >
            <Sliders className="w-4 h-4 text-teal-500" />
            <span>Theme UI</span>
          </button>

          {onGoToWeather && (
            <button
              type="button"
              id="admin-live-weather-quick-btn"
              onClick={onGoToWeather}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 bg-white hover:bg-teal-50 text-teal-800 border-teal-300 shadow-xs"
              title="Open Live Ocean Weather & Waves by Sport"
            >
              <Waves className="w-4 h-4 text-teal-600" />
              <span>Waves & Weather</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          <button
            type="button"
            id="admin-quick-settings-btn"
            onClick={() => handleTabSelect('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              activeTab === 'settings'
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            <Settings className="w-4 h-4 text-teal-500" />
            <span>Settings</span>
          </button>

          {/* Active Staff Profile & Logout Menu */}
          {onLogout ? (
            <AdminProfileMenu
              currentStaff={activeStaffUser}
              staffUsers={allStaffUsers}
              onSwitchStaff={handleSwitchStaff}
              onLogout={onLogout}
              onGoToBooking={onGoToBooking}
              compact={false}
            />
          ) : (
            <div className="relative shrink-0">
              <button
                type="button"
                id="admin-quick-staff-btn"
                onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  activeTab === 'roles'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white hover:bg-purple-50/60 text-slate-800 border-slate-200 shadow-xs'
                }`}
                title={`Active Staff: ${activeStaffUser.name} (${activeStaffUser.role}). Click to switch user or manage roles.`}
              >
                <img
                  src={activeStaffUser.avatar}
                  alt={activeStaffUser.name}
                  className="w-5 h-5 rounded-full object-cover border border-white/50 shadow-2xs"
                />
                <span className="hidden sm:inline font-extrabold">{activeStaffUser.name.split(' ')[0]}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    activeStaffUser.role === 'super_admin'
                      ? activeTab === 'roles' ? 'bg-purple-800 text-purple-100' : 'bg-purple-100 text-purple-900 border border-purple-200'
                      : activeStaffUser.role === 'admin'
                      ? activeTab === 'roles' ? 'bg-teal-800 text-teal-100' : 'bg-teal-100 text-teal-900 border border-teal-200'
                      : activeTab === 'roles' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  {activeStaffUser.role === 'super_admin' ? 'Super' : activeStaffUser.role === 'admin' ? 'Admin' : 'Mgr'}
                </span>
              </button>

              {isStaffDropdownOpen && (
                <div 
                  id="admin-staff-quick-dropdown"
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-2 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Switch Active Persona</span>
                    <span className="text-[10px] font-mono text-purple-600 font-bold">RBAC Active</span>
                  </div>

                  <div className="space-y-1">
                    {allStaffUsers.map((user) => {
                      const isSelected = user.id === activeStaffUser.id;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSwitchStaff(user)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-purple-50/80 border border-purple-200 text-purple-900'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{user.name}</p>
                              <p className="text-[10px] text-slate-400 capitalize">{user.title}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                              user.role === 'super_admin'
                                ? 'bg-purple-100 text-purple-900'
                                : user.role === 'admin'
                                ? 'bg-teal-100 text-teal-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Manager'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsStaffDropdownOpen(false);
                        handleTabSelect('roles');
                      }}
                      className="w-full py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Manage Roles & Permissions</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Occupancy Percentage Summary Chart */}
      <MonthlyOccupancyChart
        bookings={bookings}
        rooms={rooms}
        settings={settings}
        onNavigateToTab={handleTabSelect}
      />

      {/* 30-Day Forward Revenue Projection Quick Summary Bar */}
      <div 
        id="admin-30day-revenue-quick-banner"
        onClick={() => handleTabSelect('revenueReport')}
        className="bg-linear-to-r from-teal-900 via-slate-900 to-slate-950 rounded-3xl p-4 sm:p-5 text-white shadow-sm border border-teal-800/40 cursor-pointer hover:border-teal-500/80 transition-all group flex flex-col lg:flex-row lg:items-center justify-between gap-4 overflow-hidden"
        title="Click to open full 30-Day Projected Revenue Report & Yield Modeler"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold shrink-0 border border-teal-500/30 group-hover:scale-105 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">
                30-Day Projected Revenue
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {projectedRevenueSummary.realizationRate}% Realized
              </span>
              <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {projectedRevenueSummary.startDate} → {projectedRevenueSummary.endDate}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-heading font-black text-white">
                {settings.currencySymbol}{Math.round(projectedRevenueSummary.totalProjectedRevenue).toLocaleString()}
              </span>
              <span className="text-xs text-slate-300">
                ({settings.currencySymbol}{Math.round(projectedRevenueSummary.totalAccommodationRevenue).toLocaleString()} rooms + {settings.currencySymbol}{Math.round(projectedRevenueSummary.totalAddOnsRevenue).toLocaleString()} surf add-ons)
              </span>
              <span className="text-xs text-teal-300/80 hidden sm:inline">
                • {projectedRevenueSummary.averageOccupancyPercent}% avg occupancy • {settings.currencySymbol}{projectedRevenueSummary.projectedADR.toFixed(0)} ADR
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto">
          <span className="text-xs font-bold text-teal-300 group-hover:text-white transition-colors flex items-center gap-1.5 bg-white/10 px-3.5 py-2 rounded-xl group-hover:bg-teal-600">
            <span>Explore 30-Day Report</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>

      {/* Instant Action Toast */}
      {actionToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-xl border border-emerald-400 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span>{actionToast}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionToast(null)} 
            className="p-1 hover:bg-emerald-700 rounded-lg text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Room Vacancy Waitlist Match Alert Banner */}
      {waitlistMatches.length > 0 && (
        <WaitlistMatchAlertBanner
          matches={waitlistMatches}
          rooms={rooms}
          settings={settings}
          onConvertWaitlistToBooking={onConvertWaitlistToBooking || (() => {})}
          onNavigateToWaitlist={() => handleTabSelect('waitlist')}
          onShowToast={showActionToast}
        />
      )}

      {/* KPI Cards Grid - 2x2 on mobile/tablet, 4 columns on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Bookings */}
        <div 
          onClick={() => handleTabSelect('bookings')}
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs cursor-pointer hover:border-teal-400 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
            {bookings.length}
          </p>
          <p className="text-[11px] text-teal-600 font-semibold mt-1 truncate">
            {bookings.filter((b) => b.status === 'confirmed').length} active confirmed
          </p>
        </div>

        {/* Current Occupancy */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current In-House</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
            {activeInHouseGuests} <span className="text-sm font-normal text-slate-400">/ {totalBedsCapacity} beds</span>
          </p>
          <p className="text-[11px] text-cyan-600 font-semibold mt-1">
            {occupancyRate}% live occupancy
          </p>
        </div>

        {/* Waitlist Queue Standing */}
        <div 
          onClick={() => setActiveTab('waitlist')}
          className={`p-4 sm:p-5 rounded-3xl border shadow-2xs cursor-pointer transition-all ${
            waitlistMatches.length > 0
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 hover:border-emerald-500'
              : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              waitlistMatches.length > 0 ? 'text-emerald-800' : 'text-slate-400'
            }`}>
              {waitlistMatches.length > 0 ? '⚡ Vacancy Matches' : 'Waitlist Queue'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              waitlistMatches.length > 0 
                ? 'bg-emerald-500 text-slate-950 shadow-xs shadow-emerald-500/30 animate-pulse' 
                : 'bg-amber-50 text-amber-600'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900 flex items-baseline gap-2">
            <span>{activeWaitlistCount}</span>
            {waitlistMatches.length > 0 && (
              <span className="text-[11px] font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                ⚡ {waitlistMatches.length} match!
              </span>
            )}
          </p>
          <p className={`text-[11px] font-semibold mt-1 truncate ${
            waitlistMatches.length > 0 ? 'text-emerald-700 font-extrabold' : 'text-amber-600'
          }`}>
            {waitlistMatches.length > 0 
              ? `⚡ ${waitlistMatches.length} standby guest${waitlistMatches.length > 1 ? 's' : ''} match open beds` 
              : activeWaitlistCount > 0 
              ? 'Guests waiting on standby' 
              : 'No active queue'}
          </p>
        </div>

        {/* Total Booked Revenue */}
        <div 
          onClick={() => handleTabSelect('analytics')}
          className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs cursor-pointer hover:border-teal-400 hover:shadow-xs transition-all group"
          title="Click to view full Revenue & Operations Analytics charts"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gross Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
            {settings.currencySymbol}{totalRevenue.toFixed(0)}
          </p>
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <span className="truncate">{settings.currency} active portfolio</span>
            <span className="text-teal-600 flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
              <span>View Charts</span>
              <TrendingUp className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Auto-Cancellation Execution Alert Banner */}
      {autoCancelNotice && (
        <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-rose-950 text-sm">
                Auto-Cancellation Executed: {autoCancelNotice.count} Unpaid Reservation{autoCancelNotice.count > 1 ? 's' : ''} Cancelled
              </p>
              <p className="text-rose-700 mt-0.5">
                Bookings {autoCancelNotice.refs.join(', ')} exceeded the {settings.autoCancelUnpaidDays || 3}-day deposit grace window without deposit payment. Their room bed inventory has been released.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoCancelNotice(null)}
            className="px-3 py-1.5 rounded-xl bg-rose-200/80 hover:bg-rose-300 text-rose-950 font-bold text-xs transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <AdminNavTabs
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
        bookingsCount={bookings.length}
        roomsCount={rooms.length}
        addOnsCount={addOns.length}
        upcomingArrivalsCount={upcomingArrivals.length}
        activeWaitlistCount={activeWaitlistCount}
        matchedWaitlistCount={waitlistMatches.length}
      />

      {/* Auto-Responder Triggered Notification Alert Banner */}
      {autoResponderAlert && (
        <div 
          id="auto-responder-triggered-alert"
          className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-2 border-emerald-500/50 text-white rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md shadow-emerald-500/30">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-emerald-300">
                  ⚡ Auto-Responder Triggered: {autoResponderAlert.ruleName}
                </span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Status ➔ {autoResponderAlert.triggerStatus}
                </span>
                <span className="font-mono text-[10px] text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                  #{autoResponderAlert.booking.referenceNumber}
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-1">
                Customized WhatsApp message ready for <strong className="text-white">{autoResponderAlert.booking.guest.firstName} {autoResponderAlert.booking.guest.lastName}</strong> ({autoResponderAlert.booking.guest.phone}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <a
              href={createWhatsAppUrl(autoResponderAlert.booking.guest.phone, autoResponderAlert.message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                showActionToast(`Opened WhatsApp auto-reply for ${autoResponderAlert.booking.guest.firstName}!`);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Send WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                handleTabSelect('notifications');
                setTimeout(() => {
                  const el = document.getElementById('auto-responders-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
            >
              <span>View Rule</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoResponderAlert(null)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              title="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Active Tab Content */}
      <div className="pt-2">
        {activeTab === 'housekeeping' && (
          <HousekeepingManager
            rooms={rooms}
            bookings={bookings}
            settings={settings}
            onSelectRoom={() => handleTabSelect('rooms')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsCharts
            bookings={bookings}
            rooms={rooms}
            addOns={addOns}
            settings={settings}
            waitlist={waitlist}
            onSelectBookingTab={() => handleTabSelect('bookings')}
          />
        )}

        {activeTab === 'revenueReport' && (
          <ProjectedRevenueReport
            bookings={bookings}
            rooms={rooms}
            addOns={addOns}
            settings={settings}
            onNavigateToTab={handleTabSelect}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingsManager
            bookings={bookings}
            rooms={rooms}
            addOns={addOns}
            settings={settings}
            onUpdateBooking={handleDashboardUpdateBooking}
            onBatchUpdateBookings={handleDashboardBatchUpdateBookings}
            onDeleteBooking={onDeleteBooking}
            onAddWalkIn={() => setIsWalkInModalOpen(true)}
            onSaveSettings={onSaveSettings}
          />
        )}

        {activeTab === 'monthlyGrid' && (
          <MonthlyAvailabilityGrid
            rooms={rooms}
            bookings={bookings}
            settings={settings}
            addOns={addOns}
            waitlist={waitlist}
            onUpdateBooking={handleDashboardUpdateBooking}
            onBookSlot={(roomId, date) => {
              setWalkInPrefill({ roomId, checkInDate: date });
              setIsWalkInModalOpen(true);
            }}
            onAddToWaitlist={(roomId, date) => {
              setWaitlistPrefill({ roomId, checkInDate: date });
              setIsWaitlistModalOpen(true);
            }}
            onViewWaitlist={() => {
              setActiveTab('waitlist');
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarGrid
            rooms={rooms}
            bookings={bookings}
            settings={settings}
            addOns={addOns}
            waitlist={waitlist}
            onUpdateBooking={handleDashboardUpdateBooking}
            onBookSlot={(roomId, date) => {
              setWalkInPrefill({ roomId, checkInDate: date });
              setIsWalkInModalOpen(true);
            }}
            onAddToWaitlist={(roomId, date) => {
              setWaitlistPrefill({ roomId, checkInDate: date });
              setIsWaitlistModalOpen(true);
            }}
            onViewWaitlist={() => {
              setActiveTab('waitlist');
            }}
          />
        )}

        {activeTab === 'waitlist' && (
          <WaitlistManager
            waitlist={waitlist}
            rooms={rooms}
            bookings={bookings}
            settings={settings}
            addOns={addOns}
            onAddWaitlistEntry={(entry) => onAddWaitlistEntry && onAddWaitlistEntry(entry)}
            onUpdateWaitlistEntry={(entry) => onUpdateWaitlistEntry && onUpdateWaitlistEntry(entry)}
            onDeleteWaitlistEntry={(id) => onDeleteWaitlistEntry && onDeleteWaitlistEntry(id)}
            onConvertWaitlistToBooking={(entry, newBooking) => {
              if (onConvertWaitlistToBooking) {
                onConvertWaitlistToBooking(entry, newBooking);
              } else {
                onAddBooking(newBooking);
                if (onUpdateWaitlistEntry) onUpdateWaitlistEntry(entry);
              }
            }}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsManager
            bookings={bookings}
            settings={settings}
            templates={templates}
            rooms={rooms}
            addOns={addOns}
            onUpdateBooking={handleDashboardUpdateBooking}
            onUpdateTemplate={onUpdateTemplate}
            onSaveSettings={onSaveSettings}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomsManager
            rooms={rooms}
            bookings={bookings}
            currencySymbol={settings.currencySymbol}
            waitlist={waitlist}
            onUpdateRoom={onUpdateRoom}
            onAddRoom={onAddRoom}
            onDeleteRoom={onDeleteRoom}
            canDeleteRoom={hasFullControl(activeStaffUser, 'rooms', activeRoleMatrix)}
            canAddRoom={hasFullControl(activeStaffUser, 'rooms', activeRoleMatrix)}
            onBatchUpdateRooms={onBatchUpdateRooms}
            onUpdateBooking={handleDashboardUpdateBooking}
            onDeleteBooking={onDeleteBooking}
            onBookRoom={(roomId, dateStr) => {
              setWalkInPrefill({ roomId, checkInDate: dateStr });
              setIsWalkInModalOpen(true);
            }}
            onAddToWaitlist={(roomId) => {
              setWaitlistPrefill({ roomId });
              setIsWaitlistModalOpen(true);
            }}
            onViewWaitlist={() => {
              setActiveTab('waitlist');
            }}
          />
        )}

        {activeTab === 'addons' && (
          <AddOnsManager
            addOns={addOns}
            currencySymbol={settings.currencySymbol}
            onUpdateAddOn={onUpdateAddOn}
            onAddAddOn={onAddAddOn}
            onDeleteAddOn={onDeleteAddOn}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsManager
            settings={settings}
            bookings={bookings}
            rooms={rooms}
            addOns={addOns}
            templates={templates}
            initialSection={activeSettingsSection || initialSettingsSection}
            onSectionChange={setActiveSettingsSection}
            onSaveSettings={onSaveSettings}
            onUpdateTemplate={onUpdateTemplate}
            onBatchUpdateBookings={handleDashboardBatchUpdateBookings}
            onUpdateBooking={handleDashboardUpdateBooking}
            onSelectOceanSpot={onSelectOceanSpot}
          />
        )}

        {activeTab === 'roles' && (
          <RolesAndPermissionsManager
            staffUsers={allStaffUsers}
            currentStaff={activeStaffUser}
            rolePermissions={activeRoleMatrix}
            onSwitchStaffUser={handleSwitchStaff}
            onUpdateRolePermissions={handleUpdateMatrix}
            onAddStaffUser={handleAddStaff}
            onUpdateStaffUser={handleUpdateStaff}
            onDeleteStaffUser={handleDeleteStaff}
          />
        )}
      </div>

      {/* Walk-in Modal */}
      {isWalkInModalOpen && (
        <AddWalkInModal
          rooms={rooms}
          addOns={addOns}
          bookings={bookings}
          settings={settings}
          initialRoomId={walkInPrefill?.roomId}
          initialCheckInDate={walkInPrefill?.checkInDate}
          onSave={(newB) => {
            onAddBooking(newB);
            setIsWalkInModalOpen(false);
            setWalkInPrefill(null);
          }}
          onClose={() => {
            setIsWalkInModalOpen(false);
            setWalkInPrefill(null);
          }}
          onAddToWaitlist={(data) => {
            setIsWalkInModalOpen(false);
            setWalkInPrefill(null);
            setWaitlistPrefill({
              roomId: data.roomId,
              checkInDate: data.checkIn,
              checkOutDate: data.checkOut,
              guestsCount: data.guestsCount,
              guest: data.guest,
            });
            setIsWaitlistModalOpen(true);
          }}
        />
      )}

      {/* Waitlist Modal */}
      {isWaitlistModalOpen && (
        <AddToWaitlistModal
          rooms={rooms}
          bookings={bookings}
          existingWaitlist={waitlist}
          settings={settings}
          initialRoomId={waitlistPrefill?.roomId}
          initialCheckInDate={waitlistPrefill?.checkInDate}
          initialCheckOutDate={waitlistPrefill?.checkOutDate}
          initialGuest={waitlistPrefill?.guest}
          initialGuestsCount={waitlistPrefill?.guestsCount}
          onSave={(newEntry) => {
            if (onAddWaitlistEntry) onAddWaitlistEntry(newEntry);
            setIsWaitlistModalOpen(false);
            setWaitlistPrefill(null);
          }}
          onClose={() => {
            setIsWaitlistModalOpen(false);
            setWaitlistPrefill(null);
          }}
        />
      )}
      {/* Theme Customizer Quick Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        settings={settings}
        onSaveSettings={onSaveSettings}
      />

      {/* Admin Form Country & City Modal (Accessible from any tab via top action bar) */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AdminFormCountryCityCard
              settings={settings}
              onSaveSettings={onSaveSettings}
              onSelectOceanSpot={onSelectOceanSpot}
              isModal={true}
              onClose={() => setIsLocationModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
