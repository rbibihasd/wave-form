import React, { useRef, useState, useEffect } from 'react';
import { 
  CalendarCheck, CalendarRange, Calendar, CheckSquare, TrendingUp, 
  Clock, Bell, Bed, Sparkles, Settings, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, LayoutGrid, SlidersHorizontal, ArrowLeft, ArrowRight,
  CheckCircle2, Compass, DollarSign, Users
} from 'lucide-react';
import { AdminTab } from '../../types';

export interface AdminNavTabsProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  bookingsCount: number;
  roomsCount: number;
  addOnsCount: number;
  upcomingArrivalsCount: number;
  activeWaitlistCount: number;
  matchedWaitlistCount?: number;
}

export type TabCategory = 'all' | 'operations' | 'intelligence' | 'setup';

interface TabDefinition {
  id: AdminTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  category: 'operations' | 'intelligence' | 'setup';
  categoryLabel: string;
  description: string;
}

export const AdminNavTabs: React.FC<AdminNavTabsProps> = ({
  activeTab,
  onSelectTab,
  bookingsCount,
  roomsCount,
  addOnsCount,
  upcomingArrivalsCount,
  activeWaitlistCount,
  matchedWaitlistCount = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TabCategory>('all');
  
  // Layout mode: 'wrap' (all tabs visible without scroll) or 'strip' (horizontal scrollable with arrows)
  const [layoutMode, setLayoutMode] = useState<'wrap' | 'strip'>(() => {
    try {
      const saved = localStorage.getItem('wavehaven_admin_nav_layout');
      return (saved === 'strip' ? 'strip' : 'wrap');
    } catch {
      return 'wrap';
    }
  });

  const handleToggleLayout = (mode: 'wrap' | 'strip') => {
    setLayoutMode(mode);
    try {
      localStorage.setItem('wavehaven_admin_nav_layout', mode);
    } catch {
      // ignore
    }
  };

  const tabs: TabDefinition[] = [
    {
      id: 'bookings',
      label: 'Bookings List',
      shortLabel: 'Bookings',
      icon: CalendarCheck,
      badge: bookingsCount,
      category: 'operations',
      categoryLabel: 'Operations',
      description: 'Active bookings, payments & guest check-ins',
    },
    {
      id: 'monthlyGrid',
      label: '30-Day Monthly Grid',
      shortLabel: '30-Day Grid',
      icon: CalendarRange,
      badge: '30d',
      badgeColor: 'bg-teal-600 text-white',
      category: 'operations',
      categoryLabel: 'Operations',
      description: 'Visual 30-day room & bed occupancy matrix',
    },
    {
      id: 'calendar',
      label: 'Calendar Grid',
      shortLabel: 'Calendar',
      icon: Calendar,
      category: 'operations',
      categoryLabel: 'Operations',
      description: 'Monthly reservation calendar view',
    },
    {
      id: 'housekeeping',
      label: 'Housekeeping',
      shortLabel: 'Housekeeping',
      icon: CheckSquare,
      badge: 'Daily',
      badgeColor: 'bg-emerald-600 text-white',
      category: 'operations',
      categoryLabel: 'Operations',
      description: 'Daily turnover schedules & room sanitization',
    },
    {
      id: 'analytics',
      label: 'Charts & Analytics',
      shortLabel: 'Analytics',
      icon: TrendingUp,
      badge: 'Live',
      badgeColor: 'bg-teal-600 text-white',
      category: 'intelligence',
      categoryLabel: 'Intelligence',
      description: 'Revenue graphs, occupancy trends & ADR',
    },
    {
      id: 'revenueReport',
      label: '30-Day Projected Revenue',
      shortLabel: '30-Day Revenue',
      icon: DollarSign,
      badge: '30d Forecast',
      badgeColor: 'bg-emerald-600 text-white',
      category: 'intelligence',
      categoryLabel: 'Intelligence',
      description: 'Forward-looking 30-day revenue forecast, ADR & cash flow',
    },
    {
      id: 'waitlist',
      label: 'Waitlist & Queues',
      shortLabel: 'Waitlist',
      icon: Clock,
      badge: matchedWaitlistCount > 0 ? `⚡ ${matchedWaitlistCount} Open!` : activeWaitlistCount,
      badgeColor: matchedWaitlistCount > 0 
        ? 'bg-emerald-500 text-slate-950 font-black animate-pulse shadow-xs shadow-emerald-500/50' 
        : activeWaitlistCount > 0 
        ? 'bg-amber-500 text-white animate-pulse' 
        : undefined,
      category: 'intelligence',
      categoryLabel: 'Intelligence',
      description: matchedWaitlistCount > 0
        ? `⚡ ${matchedWaitlistCount} waitlist entries match newly opened room vacancies!`
        : 'Standby guest queue & automated vacancy matching',
    },
    {
      id: 'notifications',
      label: 'Stay Notifications',
      shortLabel: 'Notifications',
      icon: Bell,
      badge: upcomingArrivalsCount,
      badgeColor: 'bg-amber-500 text-white',
      category: 'intelligence',
      categoryLabel: 'Intelligence',
      description: 'Arrival reminders, WhatsApp templates & auto-responders',
    },
    {
      id: 'rooms',
      label: 'Rooms & Beds',
      shortLabel: 'Rooms & Beds',
      icon: Bed,
      badge: roomsCount,
      category: 'setup',
      categoryLabel: 'Setup',
      description: 'Dorm pricing, private suites & bed capacities',
    },
    {
      id: 'addons',
      label: 'Surf Add-ons',
      shortLabel: 'Add-ons',
      icon: Sparkles,
      badge: addOnsCount,
      category: 'setup',
      categoryLabel: 'Setup',
      description: 'Surf lessons, board rentals, wetsuits & yoga',
    },
    {
      id: 'settings',
      label: 'Settings',
      shortLabel: 'Settings',
      icon: Settings,
      category: 'setup',
      categoryLabel: 'Setup',
      description: 'Hostel brand, currency, WhatsApp & webhooks',
    },
    {
      id: 'roles',
      label: 'Staff & Roles',
      shortLabel: 'Roles & Access',
      icon: Users,
      badge: 'RBAC',
      badgeColor: 'bg-purple-600 text-white',
      category: 'setup',
      categoryLabel: 'Setup',
      description: 'Manager, Admin & Super Admin permissions between Manage and Full Control',
    },
  ];

  // Current tab index & neighbors for Previous/Next stepping
  const currentTabIdx = tabs.findIndex((t) => t.id === activeTab);
  const currentTab = tabs[currentTabIdx] || tabs[0];
  const prevTab = currentTabIdx > 0 ? tabs[currentTabIdx - 1] : null;
  const nextTab = currentTabIdx < tabs.length - 1 ? tabs[currentTabIdx + 1] : null;

  // Filtered tabs based on category filter
  const visibleTabs = activeCategory === 'all' 
    ? tabs 
    : tabs.filter((t) => t.category === activeCategory);

  // Check scroll state
  const updateScrollState = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [layoutMode, activeCategory]);

  // Smooth scroll active tab into view whenever it changes or mode toggles
  useEffect(() => {
    if (layoutMode === 'strip') {
      const tabElement = document.getElementById(`admin-tab-${activeTab}`);
      if (tabElement) {
        tabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab, layoutMode]);

  // Horizontal scroll actions
  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const amount = containerRef.current.clientWidth * 0.6;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const jumpToFirst = () => {
    onSelectTab('bookings');
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const jumpToLast = () => {
    onSelectTab('settings');
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: containerRef.current.scrollWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Top Controls: Quick Direct Jump Dropdown, Category Filters, and Layout Mode Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pb-1">
        {/* Left: Quick Direct Jump Dropdown + Prev/Next step buttons */}
        <div className="flex items-center gap-2 flex-wrap max-w-full">
          {/* Direct Tab Jump Select (Zero scroll needed) */}
          <div className="relative flex items-center max-w-full">
            <label htmlFor="admin-direct-tab-select" className="sr-only">
              Jump to tab
            </label>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs text-xs font-semibold text-slate-700 max-w-full">
              <Compass className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="text-slate-400 font-normal hidden sm:inline shrink-0">Jump to:</span>
              <select
                id="admin-direct-tab-select"
                value={activeTab}
                onChange={(e) => onSelectTab(e.target.value as AdminTab)}
                className="bg-transparent font-bold text-slate-900 border-none outline-none cursor-pointer focus:ring-0 text-xs pr-1 max-w-[170px] sm:max-w-[240px] md:max-w-xs truncate"
              >
                <optgroup label="Operations">
                  <option value="bookings">1. Bookings List ({bookingsCount})</option>
                  <option value="monthlyGrid">2. 30-Day Monthly Grid</option>
                  <option value="calendar">3. Calendar Grid</option>
                  <option value="housekeeping">4. Housekeeping (Daily)</option>
                </optgroup>
                <optgroup label="Intelligence & Alerts">
                  <option value="analytics">5. Charts & Analytics (Live)</option>
                  <option value="waitlist">6. Waitlist & Queues ({activeWaitlistCount})</option>
                  <option value="notifications">7. Stay Notifications ({upcomingArrivalsCount})</option>
                </optgroup>
                <optgroup label="Inventory & Setup">
                  <option value="rooms">8. Rooms & Beds ({roomsCount})</option>
                  <option value="addons">9. Surf Add-ons ({addOnsCount})</option>
                  <option value="settings">10. Settings (Hostel & WhatsApp)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Previous & Next Tab Steppers */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => prevTab && onSelectTab(prevTab.id)}
              disabled={!prevTab}
              title={prevTab ? `Previous: ${prevTab.label}` : 'At first tab'}
              className={`p-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                prevTab 
                  ? 'bg-white text-slate-800 hover:bg-teal-50 hover:text-teal-700 shadow-2xs cursor-pointer' 
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Prev</span>
            </button>

            <span className="text-[11px] font-bold text-slate-500 px-1.5 whitespace-nowrap">
              {currentTabIdx + 1} / {tabs.length}
            </span>

            <button
              type="button"
              onClick={() => nextTab && onSelectTab(nextTab.id)}
              disabled={!nextTab}
              title={nextTab ? `Next: ${nextTab.label}` : 'At final tab'}
              className={`p-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                nextTab 
                  ? 'bg-white text-slate-800 hover:bg-teal-50 hover:text-teal-700 shadow-2xs cursor-pointer' 
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <span className="hidden sm:inline text-[11px]">Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick jump to Bookings (First) & Settings (Final) buttons */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] shrink-0">
            {activeTab !== 'bookings' && (
              <button
                type="button"
                onClick={jumpToFirst}
                className="text-slate-500 hover:text-teal-700 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                title="Jump directly to first tab: Bookings List"
              >
                <ChevronsLeft className="w-3 h-3 text-slate-400" />
                <span>Bookings</span>
              </button>
            )}

            {activeTab !== 'settings' && (
              <button
                type="button"
                onClick={jumpToLast}
                className="text-slate-500 hover:text-teal-700 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                title="Jump directly to final tab: Settings"
              >
                <span>Settings</span>
                <ChevronsRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Layout Switcher & Category Pills */}
        <div className="flex flex-wrap items-center justify-start xl:justify-end gap-2 max-w-full">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 text-xs overflow-x-auto max-w-full scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tabs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('operations')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === 'operations'
                  ? 'bg-white text-teal-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Operations
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('intelligence')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === 'intelligence'
                  ? 'bg-white text-teal-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Intelligence
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('setup')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === 'setup'
                  ? 'bg-white text-teal-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Setup
            </button>
          </div>

          {/* Layout Mode Toggle: Wrap All vs Single-Row Strip */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleLayout('wrap')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                layoutMode === 'wrap'
                  ? 'bg-white text-teal-800 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="All Tabs Visible (Wrap all tabs into responsive rows with no horizontal scroll needed)"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline text-[11px]">All Visible</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleLayout('strip')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                layoutMode === 'strip'
                  ? 'bg-white text-teal-800 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Single-Row Strip (Scrollable with left & right arrow buttons)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline text-[11px]">Scroll Strip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="relative border-b border-slate-200 bg-white/80 rounded-2xl p-1.5 border border-slate-100 shadow-2xs max-w-full overflow-hidden">
        {/* Left Scroll Button (When in strip mode and scrolled) */}
        {layoutMode === 'strip' && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-7 h-7 rounded-lg flex items-center justify-center bg-white/95 border border-slate-200 shadow-xs transition-all ${
                canScrollLeft 
                  ? 'text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:scale-105 cursor-pointer' 
                  : 'text-slate-300 opacity-40 cursor-not-allowed'
              }`}
              title="Scroll tabs left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right Scroll Button (When in strip mode and more tabs exist) */}
        {layoutMode === 'strip' && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-7 h-7 rounded-lg flex items-center justify-center bg-white/95 border border-slate-200 shadow-xs transition-all ${
                canScrollRight 
                  ? 'text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:scale-105 cursor-pointer' 
                  : 'text-slate-300 opacity-40 cursor-not-allowed'
              }`}
              title="Scroll tabs right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* The Tabs List */}
        <div
          ref={containerRef}
          className={`transition-all max-w-full ${
            layoutMode === 'wrap'
              ? 'flex flex-wrap items-center gap-1.5'
              : 'flex items-center gap-1.5 overflow-x-auto pb-1 scroll-smooth px-8 scrollbar-thin scrollbar-thumb-slate-200'
          }`}
        >
          {visibleTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                title={tab.description}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer touch-manipulation ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs border border-teal-600 font-extrabold'
                    : 'bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200/80 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold shrink-0 ${
                      tab.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
