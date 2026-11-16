import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, X, User, Calendar, CreditCard, Check, Sparkles, 
  ChevronDown, Filter, CalendarDays, ArrowRight, Clock, CheckCircle2,
  AlertCircle, Building2, MapPin, Hash
} from 'lucide-react';
import { Booking, PaymentStatus } from '../../types';
import { formatDisplayDate, formatShortDate, getTodayString, addDaysToString } from '../../utils/date';

export interface SmartFilterState {
  guestName: string | null;
  paymentStatus: 'all' | 'paid' | 'deposit' | 'pending';
  dateRange: {
    id: string;
    label: string;
    startDate?: string;
    endDate?: string;
  } | null;
  searchQuery: string;
}

interface SmartBookingSearchProps {
  bookings: Booking[];
  brandColor?: string;
  onFilterChange: (filteredBookings: Booking[], activeFilters: SmartFilterState) => void;
  className?: string;
}

interface SuggestionItem {
  id: string;
  category: 'guest' | 'payment' | 'date' | 'reference' | 'room';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  payload: any;
}

export const SmartBookingSearch: React.FC<SmartBookingSearchProps> = ({
  bookings,
  brandColor = '#0d9488',
  onFilterChange,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Active filter state
  const [filters, setFilters] = useState<SmartFilterState>({
    guestName: null,
    paymentStatus: 'all',
    dateRange: null,
    searchQuery: '',
  });
  const [filteredCount, setFilteredCount] = useState<number>(bookings.length);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const onFilterChangeRef = useRef(onFilterChange);

  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute date presets
  const todayStr = useMemo(() => getTodayString(), []);
  const in7DaysStr = useMemo(() => addDaysToString(todayStr, 7), [todayStr]);
  const in14DaysStr = useMemo(() => addDaysToString(todayStr, 14), [todayStr]);
  const in30DaysStr = useMemo(() => addDaysToString(todayStr, 30), [todayStr]);

  // Generate suggestions based on input value
  const suggestions: SuggestionItem[] = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    const items: SuggestionItem[] = [];

    // Helper: payment counts
    const paidCount = bookings.filter((b) => b.paymentStatus === 'paid').length;
    const depositCount = bookings.filter((b) => b.paymentStatus === 'deposit').length;
    const pendingCount = bookings.filter((b) => b.paymentStatus === 'pending').length;

    // 1. GUEST NAME & EMAIL SUGGESTIONS
    const matchedBookings = bookings.filter((b) => {
      if (!query) return true;
      const cleanQ = query.replace(/^#/, '');
      const fullName = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase();
      const email = (b.guest.email || '').toLowerCase();
      const phone = (b.guest.phone || '').toLowerCase();
      const country = (b.guest.country || '').toLowerCase();
      return (
        fullName.includes(query) ||
        b.guest.firstName.toLowerCase().includes(query) ||
        b.guest.lastName.toLowerCase().includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        country.includes(query)
      );
    });

    // Unique guests
    const seenGuests = new Set<string>();
    const guestItems: SuggestionItem[] = [];
    matchedBookings.slice(0, 8).forEach((b) => {
      const guestKey = `${b.guest.firstName} ${b.guest.lastName}`;
      const isEmailMatch = Boolean(query && b.guest.email?.toLowerCase().includes(query));
      if (!seenGuests.has(guestKey)) {
        seenGuests.add(guestKey);
        guestItems.push({
          id: `guest-${b.id}`,
          category: 'guest',
          title: `${b.guest.firstName} ${b.guest.lastName}`,
          subtitle: `${b.guest.email} • Ref #${b.referenceNumber} • ${b.roomName}`,
          badge: isEmailMatch ? 'EMAIL MATCH' : b.paymentStatus.toUpperCase(),
          badgeColor: isEmailMatch
            ? 'bg-purple-50 text-purple-700 border-purple-200 font-bold'
            : b.paymentStatus === 'paid'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : b.paymentStatus === 'deposit'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-amber-50 text-amber-700 border-amber-200',
          payload: { type: 'guest', value: guestKey },
        });
      }
    });

    // 2. REFERENCE NUMBER MATCHES (Matches with or without '#', case insensitive)
    const refItems: SuggestionItem[] = [];
    if (query) {
      const cleanQ = query.replace(/^#/, '');
      bookings
        .filter((b) => {
          const ref = b.referenceNumber.toLowerCase();
          return ref.includes(query) || ref.includes(cleanQ);
        })
        .slice(0, 4)
        .forEach((b) => {
          refItems.push({
            id: `ref-${b.id}`,
            category: 'reference',
            title: `Booking #${b.referenceNumber}`,
            subtitle: `${b.guest.firstName} ${b.guest.lastName} (${b.guest.email}) • ${b.roomName}`,
            badge: 'REF MATCH',
            badgeColor: 'bg-teal-50 text-teal-800 border-teal-200 font-bold',
            payload: { type: 'search', value: b.referenceNumber },
          });
        });
    }

    // 3. PAYMENT STATUS SUGGESTIONS
    const paymentKeywords = ['paid', 'pay', 'deposit', 'dep', 'pending', 'pend', 'unpaid', 'status', 'money', 'card'];
    const matchesPayment = !query || paymentKeywords.some((k) => k.includes(query) || query.includes(k));
    const paymentItems: SuggestionItem[] = [];

    if (matchesPayment) {
      if (!query || 'paid'.includes(query) || query.includes('paid')) {
        paymentItems.push({
          id: 'pay-paid',
          category: 'payment',
          title: 'Payment Status: Paid in Full',
          subtitle: `${paidCount} reservation${paidCount === 1 ? '' : 's'} fully settled`,
          badge: 'Paid',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          payload: { type: 'payment', value: 'paid' },
        });
      }
      if (!query || 'deposit'.includes(query) || query.includes('dep')) {
        paymentItems.push({
          id: 'pay-deposit',
          category: 'payment',
          title: 'Payment Status: Deposit Received',
          subtitle: `${depositCount} reservation${depositCount === 1 ? '' : 's'} awaiting balance`,
          badge: 'Deposit',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          payload: { type: 'payment', value: 'deposit' },
        });
      }
      if (!query || 'pending'.includes(query) || 'unpaid'.includes(query) || query.includes('pend')) {
        paymentItems.push({
          id: 'pay-pending',
          category: 'payment',
          title: 'Payment Status: Pending / Unpaid',
          subtitle: `${pendingCount} reservation${pendingCount === 1 ? '' : 's'} with balance pending`,
          badge: 'Pending',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          payload: { type: 'payment', value: 'pending' },
        });
      }
    }

    // 4. DATE RANGE SUGGESTIONS
    const dateKeywords = ['date', 'day', 'week', 'month', 'today', 'arrive', 'arrival', 'checkin', 'depart', 'next', 'sep', 'september', 'oct', 'october', 'nov', 'dec', '2026'];
    const matchesDate = !query || dateKeywords.some((k) => query.includes(k) || k.includes(query));
    const dateItems: SuggestionItem[] = [];

    if (matchesDate) {
      // Arriving this week
      const arrivingThisWeekCount = bookings.filter((b) => {
        return b.checkInDate >= todayStr && b.checkInDate <= in7DaysStr;
      }).length;
      dateItems.push({
        id: 'date-this-week',
        category: 'date',
        title: 'Date Range: Arriving This Week',
        subtitle: `Next 7 days (${formatShortDate(todayStr)} – ${formatShortDate(in7DaysStr)}) • ${arrivingThisWeekCount} arrival${arrivingThisWeekCount === 1 ? '' : 's'}`,
        badge: '7 Days',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        payload: {
          type: 'date',
          range: {
            id: 'this_week',
            label: 'Arriving This Week',
            startDate: todayStr,
            endDate: in7DaysStr,
          },
        },
      });

      // In-House Today
      const inHouseCount = bookings.filter((b) => {
        return b.checkInDate <= todayStr && b.checkOutDate >= todayStr && b.status === 'checked_in';
      }).length;
      dateItems.push({
        id: 'date-in-house',
        category: 'date',
        title: 'Date Range: Currently In-House Today',
        subtitle: `Staying at hostel today (${formatShortDate(todayStr)}) • ${inHouseCount} active guest${inHouseCount === 1 ? '' : 's'}`,
        badge: 'In-House',
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        payload: {
          type: 'date',
          range: {
            id: 'in_house',
            label: 'In-House Today',
            startDate: todayStr,
            endDate: todayStr,
          },
        },
      });

      // Next 14 Days
      const next14DaysCount = bookings.filter((b) => {
        return b.checkInDate >= todayStr && b.checkInDate <= in14DaysStr;
      }).length;
      dateItems.push({
        id: 'date-next-14',
        category: 'date',
        title: 'Date Range: Next 14 Days',
        subtitle: `${formatShortDate(todayStr)} – ${formatShortDate(in14DaysStr)} • ${next14DaysCount} upcoming stay${next14DaysCount === 1 ? '' : 's'}`,
        badge: '14 Days',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        payload: {
          type: 'date',
          range: {
            id: 'next_14_days',
            label: 'Next 14 Days',
            startDate: todayStr,
            endDate: in14DaysStr,
          },
        },
      });

      // This Month (September 2026 or current month)
      const currentYearMonth = todayStr.substring(0, 7);
      const thisMonthCount = bookings.filter((b) => b.checkInDate.startsWith(currentYearMonth)).length;
      dateItems.push({
        id: 'date-this-month',
        category: 'date',
        title: 'Date Range: This Month',
        subtitle: `All arrivals in current month • ${thisMonthCount} booking${thisMonthCount === 1 ? '' : 's'}`,
        badge: 'Month',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        payload: {
          type: 'date',
          range: {
            id: 'this_month',
            label: 'This Month',
            startDate: `${currentYearMonth}-01`,
            endDate: `${currentYearMonth}-31`,
          },
        },
      });
    }

    // Prioritize guest and reference results when user is searching by text
    if (query) {
      items.push(...refItems, ...guestItems, ...paymentItems, ...dateItems);
    } else {
      items.push(...paymentItems, ...dateItems, ...guestItems);
    }

    return items;
  }, [inputValue, bookings, todayStr, in7DaysStr, in14DaysStr]);

  // Apply filters to bookings in real-time
  useEffect(() => {
    let result = [...bookings];

    // Filter by Guest Name (if explicit chip selected)
    if (filters.guestName) {
      const gName = filters.guestName.toLowerCase();
      result = result.filter((b) => {
        const full = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase();
        return full.includes(gName);
      });
    }

    // Filter by Payment Status
    if (filters.paymentStatus !== 'all') {
      result = result.filter((b) => b.paymentStatus === filters.paymentStatus);
    }

    // Filter by Date Range
    if (filters.dateRange) {
      const { id, startDate, endDate } = filters.dateRange;
      if (id === 'in_house') {
        result = result.filter((b) => {
          return b.checkInDate <= todayStr && b.checkOutDate >= todayStr && b.status === 'checked_in';
        });
      } else if (startDate && endDate) {
        result = result.filter((b) => {
          return (
            (b.checkInDate >= startDate && b.checkInDate <= endDate) ||
            (b.checkInDate <= startDate && b.checkOutDate >= startDate)
          );
        });
      } else if (startDate) {
        result = result.filter((b) => b.checkInDate >= startDate);
      }
    }

    // Filter by free text search query (Guest name, email, or reference number)
    const rawQuery = filters.searchQuery.trim();
    if (rawQuery) {
      const q = rawQuery.toLowerCase();
      const cleanRef = q.replace(/^#/, '');
      result = result.filter((b) => {
        const firstName = (b.guest?.firstName || '').toLowerCase();
        const lastName = (b.guest?.lastName || '').toLowerCase();
        const full = `${firstName} ${lastName}`.trim();
        const email = (b.guest?.email || '').toLowerCase();
        const ref = (b.referenceNumber || '').toLowerCase();
        const phone = (b.guest?.phone || '').toLowerCase();
        const room = (b.roomName || '').toLowerCase();

        return (
          full.includes(q) ||
          firstName.includes(q) ||
          lastName.includes(q) ||
          email.includes(q) ||
          ref.includes(q) ||
          ref.includes(cleanRef) ||
          phone.includes(q) ||
          room.includes(q)
        );
      });
    }

    setFilteredCount(result.length);
    onFilterChangeRef.current(result, filters);
  }, [filters, bookings, todayStr]);

  // Select a suggestion
  const handleSelectSuggestion = (item: SuggestionItem) => {
    if (item.payload.type === 'guest') {
      setInputValue(item.payload.value);
      setFilters((prev) => ({ ...prev, guestName: item.payload.value, searchQuery: '' }));
    } else if (item.payload.type === 'payment') {
      setFilters((prev) => ({ ...prev, paymentStatus: item.payload.value }));
    } else if (item.payload.type === 'date') {
      setFilters((prev) => ({ ...prev, dateRange: item.payload.range }));
    } else if (item.payload.type === 'search') {
      setInputValue(item.payload.value);
      setFilters((prev) => ({ ...prev, searchQuery: item.payload.value, guestName: null }));
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else {
        // Keep active input query and close dropdown
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Quick remove individual filter
  const handleRemoveGuestFilter = () => {
    setFilters((prev) => ({ ...prev, guestName: null }));
  };

  const handleRemovePaymentFilter = () => {
    setFilters((prev) => ({ ...prev, paymentStatus: 'all' }));
  };

  const handleRemoveDateFilter = () => {
    setFilters((prev) => ({ ...prev, dateRange: null }));
  };

  const handleRemoveSearchQuery = () => {
    setFilters((prev) => ({ ...prev, searchQuery: '' }));
    setInputValue('');
  };

  const handleClearAllFilters = () => {
    setFilters({
      guestName: null,
      paymentStatus: 'all',
      dateRange: null,
      searchQuery: '',
    });
    setInputValue('');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const hasActiveFilters = 
    filters.guestName !== null ||
    filters.paymentStatus !== 'all' ||
    filters.dateRange !== null ||
    filters.searchQuery !== '';

  const applyCustomDateRange = () => {
    if (!customStartDate) return;
    const end = customEndDate || customStartDate;
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        id: 'custom',
        label: `${formatShortDate(customStartDate)} → ${formatShortDate(end)}`,
        startDate: customStartDate,
        endDate: end,
      },
    }));
    setIsDatePickerOpen(false);
    setIsOpen(false);
  };

  // Group suggestions by category for elegant presentation
  const guestSuggestions = suggestions.filter((s) => s.category === 'guest');
  const paymentSuggestions = suggestions.filter((s) => s.category === 'payment');
  const dateSuggestions = suggestions.filter((s) => s.category === 'date');
  const refSuggestions = suggestions.filter((s) => s.category === 'reference');

  return (
    <div ref={containerRef} className={`space-y-2.5 max-w-full ${className}`}>
      {/* Smart Search Bar with Autocomplete */}
      <div className="relative max-w-full">
        <div 
          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs focus-within:shadow-md transition-all flex items-center p-1.5 gap-2 max-w-full"
          style={{
            borderColor: isOpen ? brandColor : undefined,
          }}
        >
          {/* Smart Search Icon */}
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs transition-colors duration-200"
            style={{ backgroundColor: brandColor }}
          >
            <Search className="w-4 h-4" />
          </div>

          {/* Autocomplete Input */}
          <div className="flex-1 relative flex items-center min-w-0">
            <input
              ref={inputRef}
              id="bookings-search-input"
              data-testid="bookings-search-input"
              type="text"
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value;
                setInputValue(val);
                setFilters((prev) => ({
                  ...prev,
                  searchQuery: val,
                  guestName: null,
                }));
                setIsOpen(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search by guest name, email, or reference number (#WH-XXXX)..."
              aria-label="Search bookings by guest name, email, or reference number"
              className="w-full text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent py-1 px-1"
              autoComplete="off"
            />
            {inputValue && (
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <span className="hidden sm:inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                  {filteredCount} {filteredCount === 1 ? 'match' : 'matches'}
                </span>
                <button
                  type="button"
                  id="bookings-search-clear-btn"
                  data-testid="bookings-search-clear-btn"
                  onClick={() => {
                    setInputValue('');
                    setFilters((prev) => ({ ...prev, searchQuery: '', guestName: null }));
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Date Range Picker Popover Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              id="smart-search-date-picker-btn"
              onClick={() => {
                setIsDatePickerOpen(!isDatePickerOpen);
                setIsOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                filters.dateRange
                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">
                {filters.dateRange ? filters.dateRange.label : 'Date Range'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Custom Date Range Popover */}
            {isDatePickerOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
                    Filter by Date Range
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Check-In From
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Check-Out Until
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      min={customStartDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 mb-1.5">Quick Presets</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: {
                            id: 'this_week',
                            label: 'This Week',
                            startDate: todayStr,
                            endDate: in7DaysStr,
                          },
                        }));
                        setIsDatePickerOpen(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 text-left"
                    >
                      Next 7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: {
                            id: 'next_14_days',
                            label: 'Next 14 Days',
                            startDate: todayStr,
                            endDate: in14DaysStr,
                          },
                        }));
                        setIsDatePickerOpen(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 text-left"
                    >
                      Next 14 Days
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {filters.dateRange && (
                    <button
                      type="button"
                      onClick={() => {
                        handleRemoveDateFilter();
                        setIsDatePickerOpen(false);
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                    >
                      Clear Range
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!customStartDate}
                    onClick={applyCustomDateRange}
                    className="ml-auto px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-xs font-bold"
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown Panel */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200/95 shadow-xl max-h-[420px] overflow-y-auto z-50 p-2 divide-y divide-slate-100 animate-in fade-in zoom-in-95"
          >
            {suggestions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                <Search className="w-5 h-5 mx-auto text-slate-300 mb-1" />
                No matching guest, payment status, or date range suggestions found for "{inputValue}".
                <div className="mt-2 text-[11px] text-slate-500">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">Enter</kbd> to search anywhere in bookings text.
                </div>
              </div>
            ) : (
              <>
                {/* 1. PAYMENT STATUS SECTION */}
                {paymentSuggestions.length > 0 && (
                  <div className="py-1.5 first:pt-0">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      <span>Payment Status Suggestions</span>
                    </div>
                    <div className="space-y-0.5">
                      {paymentSuggestions.map((item) => {
                        const index = suggestions.indexOf(item);
                        const isHighlighted = highlightedIndex === index;
                        const isCurrentlyActive = filters.paymentStatus === item.payload.value;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              isHighlighted ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-xs truncate">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                              {isCurrentlyActive && (
                                <Check className="w-3.5 h-3.5 text-teal-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. DATE RANGES SECTION */}
                {dateSuggestions.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Date Range Suggestions</span>
                    </div>
                    <div className="space-y-0.5">
                      {dateSuggestions.map((item) => {
                        const index = suggestions.indexOf(item);
                        const isHighlighted = highlightedIndex === index;
                        const isCurrentlyActive = filters.dateRange?.id === item.payload.range.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              isHighlighted ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                                <CalendarDays className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-xs truncate">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                              {isCurrentlyActive && (
                                <Check className="w-3.5 h-3.5 text-teal-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. GUEST NAMES SECTION */}
                {guestSuggestions.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Guest Autocomplete</span>
                    </div>
                    <div className="space-y-0.5">
                      {guestSuggestions.map((item) => {
                        const index = suggestions.indexOf(item);
                        const isHighlighted = highlightedIndex === index;
                        const isCurrentlyActive = filters.guestName?.toLowerCase() === item.payload.value.toLowerCase();
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              isHighlighted ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {item.title.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs truncate">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                              {isCurrentlyActive && (
                                <Check className="w-3.5 h-3.5 text-teal-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. REFERENCE NUMBERS SECTION */}
                {refSuggestions.length > 0 && (
                  <div className="py-1.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Hash className="w-3 h-3 text-slate-400" />
                      <span>Booking References</span>
                    </div>
                    <div className="space-y-0.5">
                      {refSuggestions.map((item) => {
                        const index = suggestions.indexOf(item);
                        const isHighlighted = highlightedIndex === index;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              isHighlighted ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-xs">
                                {item.title}
                              </span>
                              <span className="text-xs text-slate-600 truncate">
                                {item.subtitle}
                              </span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Active Filter Chips & Quick Shortcuts */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Guest Chip */}
        {filters.guestName && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold shadow-2xs animate-in fade-in">
            <User className="w-3 h-3 text-amber-600" />
            <span>Guest: {filters.guestName}</span>
            <button
              type="button"
              onClick={handleRemoveGuestFilter}
              className="hover:bg-amber-200/60 p-0.5 rounded-full transition-colors ml-0.5"
              title="Remove guest filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Payment Status Chip */}
        {filters.paymentStatus !== 'all' && (
          <span 
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold shadow-2xs animate-in fade-in ${
              filters.paymentStatus === 'paid'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : filters.paymentStatus === 'deposit'
                ? 'bg-blue-50 text-blue-900 border-blue-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            <CreditCard className="w-3 h-3" />
            <span>Payment: {filters.paymentStatus.toUpperCase()}</span>
            <button
              type="button"
              onClick={handleRemovePaymentFilter}
              className="hover:bg-black/10 p-0.5 rounded-full transition-colors ml-0.5"
              title="Remove payment status filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Date Range Chip */}
        {filters.dateRange && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold shadow-2xs animate-in fade-in">
            <Calendar className="w-3 h-3 text-teal-600" />
            <span>Dates: {filters.dateRange.label}</span>
            <button
              type="button"
              onClick={handleRemoveDateFilter}
              className="hover:bg-teal-200/60 p-0.5 rounded-full transition-colors ml-0.5"
              title="Remove date filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Free Text Search Query Chip */}
        {filters.searchQuery && filters.searchQuery !== inputValue && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold shadow-2xs animate-in fade-in">
            <Search className="w-3 h-3 text-slate-500" />
            <span>Search: "{filters.searchQuery}"</span>
            <button
              type="button"
              onClick={handleRemoveSearchQuery}
              className="hover:bg-slate-200 p-0.5 rounded-full transition-colors ml-0.5"
              title="Remove text query filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Clear All Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline px-1.5 py-0.5"
          >
            Reset All
          </button>
        )}

        {/* Quick Filter Shortcuts (shown when no active filters) */}
        {!hasActiveFilters && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-500 py-0.5 max-w-full scrollbar-thin scrollbar-thumb-slate-200">
            <span className="font-semibold text-slate-400 shrink-0">Quick Autocomplete:</span>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, paymentStatus: 'paid' }))}
              className="px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 font-medium transition-colors shrink-0"
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, paymentStatus: 'pending' }))}
              className="px-2 py-0.5 rounded-lg bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-200 font-medium transition-colors shrink-0"
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  dateRange: {
                    id: 'this_week',
                    label: 'Arriving This Week',
                    startDate: todayStr,
                    endDate: in7DaysStr,
                  },
                }))
              }
              className="px-2 py-0.5 rounded-lg bg-white hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-200 font-medium transition-colors shrink-0"
            >
              This Week
            </button>
            {bookings.slice(0, 2).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    guestName: `${b.guest.firstName} ${b.guest.lastName}`,
                  }))
                }
                className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 transition-colors shrink-0"
              >
                {b.guest.firstName} {b.guest.lastName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
