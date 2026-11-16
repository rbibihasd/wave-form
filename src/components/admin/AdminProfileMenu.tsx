import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, Shield, ChevronDown, Check, User, 
  Sparkles, ExternalLink, CalendarCheck, ShieldAlert 
} from 'lucide-react';
import { StaffUser, StaffRole } from '../../types';
import { getRoleBadgeStyle } from '../../utils/rbac';
import { useLanguage } from '../../context/LanguageContext';

interface AdminProfileMenuProps {
  currentStaff: StaffUser;
  staffUsers?: StaffUser[];
  onSwitchStaff?: (user: StaffUser) => void;
  onLogout: () => void;
  onGoToBooking?: () => void;
  className?: string;
  compact?: boolean;
}

export const AdminProfileMenu: React.FC<AdminProfileMenuProps> = ({
  currentStaff,
  staffUsers = [],
  onSwitchStaff,
  onLogout,
  onGoToBooking,
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSwitchList, setShowSwitchList] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const roleStyle = getRoleBadgeStyle(currentStaff.role);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSwitchList(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        id="admin-profile-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex items-center gap-2.5 rounded-xl transition-all border text-left touch-manipulation shadow-xs active:scale-[0.98] ${
          isOpen
            ? 'bg-slate-100 border-slate-300 ring-2 ring-teal-500/20'
            : 'bg-white hover:bg-slate-50 border-slate-200'
        } ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}
        title={`Staff Profile: ${currentStaff.name} (${roleStyle.label})`}
      >
        <div className="relative shrink-0">
          <img
            src={currentStaff.avatar}
            alt={currentStaff.name}
            className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} rounded-full object-cover ring-2 ring-white shadow-2xs`}
          />
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
        </div>

        <div className="min-w-0 flex flex-col">
          <span className="text-xs font-bold text-slate-900 truncate leading-tight">
            {currentStaff.name}
          </span>
          <span className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dotColor}`} />
            {roleStyle.label}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-0.5 ${
            isOpen ? 'rotate-180 text-teal-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="admin-profile-menu-dropdown"
          role="menu"
          className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100"
        >
          {/* Header Card */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-teal-50/30">
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <img
                  src={currentStaff.avatar}
                  alt={currentStaff.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold text-slate-900 truncate">
                    {currentStaff.name}
                  </h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleStyle.badgeClass}`}>
                    {roleStyle.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {currentStaff.email}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {currentStaff.department}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                <span>Status:</span>
                <span className="font-semibold text-emerald-600">Active Session</span>
              </span>
              <span className="text-slate-400">{currentStaff.lastActive || 'Online'}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-2 space-y-1">
            {onGoToBooking && (
              <button
                type="button"
                id="admin-profile-btn-booking-view"
                onClick={() => {
                  setIsOpen(false);
                  onGoToBooking();
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                  <span>Exit to Guest Booking</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              </button>
            )}

            {/* Quick Switch Staff User */}
            {staffUsers.length > 1 && onSwitchStaff && (
              <div>
                <button
                  type="button"
                  id="admin-profile-btn-toggle-switch-staff"
                  onClick={() => setShowSwitchList(!showSwitchList)}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-purple-600" />
                    <span>Switch Staff Account</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showSwitchList ? 'rotate-180 text-purple-600' : ''}`} />
                </button>

                {showSwitchList && (
                  <div className="mt-1 pl-2 pr-1 py-1 space-y-1 bg-slate-50 rounded-xl border border-slate-200/80">
                    {staffUsers.map((user) => {
                      const isCurrent = user.id === currentStaff.id;
                      const userRole = getRoleBadgeStyle(user.role);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          id={`admin-profile-switch-${user.id}`}
                          onClick={() => {
                            onSwitchStaff(user);
                            setShowSwitchList(false);
                            setIsOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-white shadow-2xs font-bold text-slate-900 border border-slate-200'
                              : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                            <div className="truncate">
                              <p className="truncate leading-tight">{user.name}</p>
                              <span className="text-[10px] text-slate-400">{userRole.label}</span>
                            </div>
                          </div>
                          {isCurrent && (
                            <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logout Section */}
          <div className="p-2 bg-slate-50/50">
            <button
              type="button"
              id="admin-profile-btn-logout"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center justify-between transition-colors border border-transparent hover:border-rose-200 group active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-200 transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block leading-tight">Log Out of Dashboard</span>
                  <span className="text-[10px] font-normal text-rose-500">
                    Terminates active staff session
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                Exit
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
