import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Info,
  Check,
  RotateCcw,
  Zap,
  Waves
} from 'lucide-react';
import {
  addDaysToString,
  calculateNights,
  formatDisplayDate,
  formatMonthYear,
  getDateParts,
  getTodayString
} from '../../utils/date';

export interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (val: string) => void;
  onCheckOutChange: (val: string) => void;
  checkInTime?: string;
  checkOutTime?: string;
  minDate?: string;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  checkInTime = '14:00',
  checkOutTime = '11:00',
  minDate,
  className = '',
}) => {
  const today = getTodayString();
  const effectiveMin = minDate || today;

  // Active step: whether user is choosing checkIn or checkOut
  const [activeStep, setActiveStep] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Month navigation view state: base month index & year
  const initialDate = checkIn ? new Date(checkIn + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0 - 11

  // Second month for dual-month view
  const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;

  const nights = calculateNights(checkIn, checkOut);
  const checkInParts = useMemo(() => getDateParts(checkIn), [checkIn]);
  const checkOutParts = useMemo(() => getDateParts(checkOut), [checkOut]);

  // Compute navigation bounds (cannot navigate before current month if minDate is today)
  const todayDate = new Date(today + 'T00:00:00');
  const isCurrentOrPastMonth =
    viewYear < todayDate.getFullYear() ||
    (viewYear === todayDate.getFullYear() && viewMonth <= todayDate.getMonth());

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Step day by +1 or -1
  const adjustCheckIn = (offset: number) => {
    const next = addDaysToString(checkIn, offset);
    if (next < effectiveMin) return;
    onCheckInChange(next);
    if (checkOut <= next) {
      onCheckOutChange(addDaysToString(next, Math.max(1, nights)));
    }
  };

  const adjustCheckOut = (offset: number) => {
    const next = addDaysToString(checkOut, offset);
    if (next <= checkIn) return;
    onCheckOutChange(next);
  };

  // Quick preset duration in nights
  const setStayDuration = (nightsCount: number) => {
    if (!checkIn) {
      onCheckInChange(today);
      onCheckOutChange(addDaysToString(today, nightsCount));
    } else {
      onCheckOutChange(addDaysToString(checkIn, nightsCount));
    }
  };

  // Preset package helper
  const applyPresetStay = (daysAhead: number, stayDuration: number) => {
    const newStart = addDaysToString(today, daysAhead);
    const newEnd = addDaysToString(newStart, stayDuration);
    onCheckInChange(newStart);
    onCheckOutChange(newEnd);
    // Align view to new check-in
    const d = new Date(newStart + 'T00:00:00');
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  // Click on a calendar day
  const handleDateClick = (dateStr: string) => {
    if (dateStr < effectiveMin) return;

    if (activeStep === 'checkIn') {
      onCheckInChange(dateStr);
      if (checkOut && dateStr >= checkOut) {
        // Automatically bump checkout by preserved nights (or default 3)
        const newCheckOut = addDaysToString(dateStr, Math.max(1, nights));
        onCheckOutChange(newCheckOut);
      }
      // Advance to check-out selection
      setActiveStep('checkOut');
    } else {
      // User is picking check-out
      if (dateStr <= checkIn) {
        // If clicking earlier than or equal to check-in, restart range from that day
        onCheckInChange(dateStr);
        onCheckOutChange(addDaysToString(dateStr, 1));
        setActiveStep('checkOut');
      } else {
        onCheckOutChange(dateStr);
        setActiveStep('checkIn');
      }
    }
  };

  // Helper to build a calendar grid for a given year & month
  const buildMonthGrid = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    // Let's use Monday as first day of week (European / Surf standard): Mon=0, Sun=6
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Leading blanks
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    return days;
  };

  const monthGrid1 = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthGrid2 = useMemo(() => buildMonthGrid(nextMonthYear, nextMonth), [nextMonthYear, nextMonth]);

  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Render a single calendar month
  const renderMonth = (year: number, month: number, grid: typeof monthGrid1) => {
    return (
      <div className="flex-1 min-w-0 w-full">
        <div className="text-center font-heading font-extrabold text-sm text-slate-800 mb-3 py-1 bg-slate-50/70 rounded-xl border border-slate-100">
          {formatMonthYear(year, month)}
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {weekdays.map((wd) => (
            <div key={wd} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center">
          {grid.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return <div key={`empty-${idx}`} className="h-9 w-full" />;
            }

            const { dateStr, dayNum } = cell;
            const isPast = dateStr < effectiveMin;
            const isToday = dateStr === today;
            const isCheckIn = dateStr === checkIn;
            const isCheckOut = dateStr === checkOut;

            // In range between checkIn and checkOut
            const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

            // In hover preview range (when activeStep is checkOut and hovering over date > checkIn)
            const isInHoverRange =
              activeStep === 'checkOut' &&
              hoveredDate &&
              hoveredDate > checkIn &&
              dateStr > checkIn &&
              dateStr <= hoveredDate;

            return (
              <div
                key={dateStr}
                className="relative h-9 flex items-center justify-center p-0"
                onMouseEnter={() => !isPast && setHoveredDate(dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                {/* Connecting background ribbon for range */}
                {isInRange && (
                  <div className="absolute inset-y-1 inset-x-0 bg-teal-50 border-y border-teal-200/90 z-0" />
                )}

                {/* Connecting background ribbon for hover preview */}
                {isInHoverRange && !isInRange && (
                  <div className="absolute inset-y-1 inset-x-0 bg-cyan-50/80 border-y border-dashed border-cyan-300 z-0" />
                )}

                {/* Left/Right connector caps for selected endpoints */}
                {isCheckIn && checkOut && checkOut > checkIn && (
                  <div className="absolute inset-y-1 right-0 w-1/2 bg-teal-50 border-y border-teal-200/90 z-0" />
                )}
                {isCheckOut && checkIn && checkOut > checkIn && (
                  <div className="absolute inset-y-1 left-0 w-1/2 bg-teal-50 border-y border-teal-200/90 z-0" />
                )}

                {/* The clickable day pill */}
                <button
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDateClick(dateStr)}
                  className={`relative z-10 w-9 h-9 sm:w-8 sm:h-8 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all touch-manipulation ${
                    isCheckIn || isCheckOut
                      ? 'bg-gradient-to-br from-teal-600 to-cyan-700 text-white font-black shadow-md shadow-teal-700/25 ring-2 ring-teal-400/40 scale-105'
                      : isInRange
                      ? 'text-teal-950 font-bold hover:bg-teal-100/80 rounded-none'
                      : isInHoverRange
                      ? 'text-cyan-900 font-bold bg-cyan-100/60'
                      : isToday
                      ? 'text-teal-700 font-black ring-1.5 ring-teal-500/50 bg-teal-50/50 hover:bg-teal-100/50'
                      : isPast
                      ? 'text-slate-300 cursor-not-allowed line-through decoration-slate-300/60'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95'
                  }`}
                  title={`${dateStr}${isCheckIn ? ' (Check-In)' : isCheckOut ? ' (Check-Out)' : ''}`}
                >
                  <span className="leading-none">{dayNum}</span>
                  {/* Subtle indicator dot */}
                  {(isCheckIn || isCheckOut) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/95 mt-0.5" />
                  )}
                  {isToday && !isCheckIn && !isCheckOut && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden standard HTML5 inputs for accessibility & compatibility */}
      <input
        id="input-checkin-date"
        type="date"
        min={effectiveMin}
        value={checkIn}
        onChange={(e) => {
          if (e.target.value) {
            onCheckInChange(e.target.value);
            if (new Date(checkOut) <= new Date(e.target.value)) {
              onCheckOutChange(addDaysToString(e.target.value, 3));
            }
          }
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        id="input-checkout-date"
        type="date"
        min={checkIn ? addDaysToString(checkIn, 1) : effectiveMin}
        value={checkOut}
        onChange={(e) => e.target.value && onCheckOutChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* LUXURY CONNECTED DUAL-CARD DATE RANGE CONTAINER */}
      <div className="bg-gradient-to-b from-white to-slate-50/60 rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 relative overflow-hidden">
        {/* Subtle Decorative Ocean Wave Gradient Accent */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-bl from-teal-500/5 via-cyan-500/5 to-transparent pointer-events-none rounded-tr-3xl" />

        {/* Top Header Controls / Instructions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <CalendarIcon className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-slate-800">
                Reservation Date Range
              </span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-2 font-normal">
                Select your check-in & check-out dates
              </span>
            </div>
          </div>

          {/* Active Mode Status Chip */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveStep('checkIn')}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 ${
                activeStep === 'checkIn'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeStep === 'checkIn' ? 'bg-white' : 'bg-teal-600'}`} />
              <span>1. Check-In</span>
            </button>
            <span className="text-slate-300 font-bold">→</span>
            <button
              type="button"
              onClick={() => setActiveStep('checkOut')}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 ${
                activeStep === 'checkOut'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeStep === 'checkOut' ? 'bg-white' : 'bg-teal-600'}`} />
              <span>2. Check-Out</span>
            </button>
          </div>
        </div>

        {/* CONNECTED CHECK-IN & CHECK-OUT HERO DISPLAY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          {/* CHECK-IN CARD (Columns 1 to 5 on sm/md/xl) */}
          <div
            onClick={() => setActiveStep('checkIn')}
            className={`sm:col-span-5 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer border touch-manipulation flex flex-col justify-between ${
              activeStep === 'checkIn'
                ? 'bg-white border-teal-500 shadow-md ring-2 ring-teal-500/20'
                : 'bg-white/80 hover:bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-500" />
                Check-In Date
              </span>
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3 text-slate-400" />
                From {checkInTime}
              </span>
            </div>

            {/* Big Typography Date Display */}
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2.5">
                <span className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight">
                  {checkInParts.dayString}
                </span>
                <div>
                  <span className="block font-heading font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-tight">
                    {checkInParts.monthShort} {checkInParts.year}
                  </span>
                  <span className="block text-xs font-semibold text-teal-700">
                    {checkInParts.weekdayLong}
                  </span>
                </div>
              </div>

              {/* Day Adjustment Buttons */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => adjustCheckIn(-1)}
                  disabled={checkIn <= effectiveMin}
                  aria-label="Previous day check-in"
                  className="w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center transition-all touch-manipulation shadow-2xs"
                  title="Previous Day"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => adjustCheckIn(1)}
                  aria-label="Next day check-in"
                  className="w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-sm flex items-center justify-center transition-all touch-manipulation shadow-2xs"
                  title="Next Day"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Arrival Day</span>
              <span className="font-bold text-teal-800">
                {checkIn === today ? 'Today!' : checkIn === addDaysToString(today, 1) ? 'Tomorrow' : formatDisplayDate(checkIn)}
              </span>
            </div>
          </div>

          {/* DURATION CONNECTOR BRIDGE (Columns 6-7 on sm/md/xl) */}
          <div className="sm:col-span-2 flex items-center justify-center gap-2 py-1 sm:flex-col self-center">
            <div className="h-px sm:h-6 flex-1 sm:flex-initial w-8 sm:w-px bg-gradient-to-r sm:bg-gradient-to-b from-teal-400 to-cyan-500" />
            <div className="px-3 py-1.5 rounded-full bg-slate-900 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              <span>{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
            </div>
            <div className="h-px sm:h-6 flex-1 sm:flex-initial w-8 sm:w-px bg-gradient-to-r sm:bg-gradient-to-b from-cyan-500 to-teal-400" />
          </div>

          {/* CHECK-OUT CARD (Columns 8 to 12 on sm/md/xl) */}
          <div
            onClick={() => setActiveStep('checkOut')}
            className={`sm:col-span-5 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer border touch-manipulation flex flex-col justify-between ${
              activeStep === 'checkOut'
                ? 'bg-white border-teal-500 shadow-md ring-2 ring-teal-500/20'
                : 'bg-white/80 hover:bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 flex items-center gap-1">
                <Moon className="w-3 h-3 text-cyan-600" />
                Check-Out Date
              </span>
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3 text-slate-400" />
                By {checkOutTime}
              </span>
            </div>

            {/* Big Typography Date Display */}
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2.5">
                <span className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight">
                  {checkOutParts.dayString}
                </span>
                <div>
                  <span className="block font-heading font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-tight">
                    {checkOutParts.monthShort} {checkOutParts.year}
                  </span>
                  <span className="block text-xs font-semibold text-cyan-700">
                    {checkOutParts.weekdayLong}
                  </span>
                </div>
              </div>

              {/* Day Adjustment Buttons */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => adjustCheckOut(-1)}
                  disabled={checkOut <= addDaysToString(checkIn, 1)}
                  aria-label="Previous day check-out"
                  className="w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center transition-all touch-manipulation shadow-2xs"
                  title="Previous Day"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => adjustCheckOut(1)}
                  aria-label="Next day check-out"
                  className="w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-sm flex items-center justify-center transition-all touch-manipulation shadow-2xs"
                  title="Next Day"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Departure Day</span>
              <span className="font-bold text-cyan-800">
                {formatDisplayDate(checkOut)}
              </span>
            </div>
          </div>
        </div>

        {/* QUICK STAY DURATION CHIPS */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              Quick Stay:
            </span>
            {[
              { label: '3N (Weekend)', count: 3 },
              { label: '5N (Waves)', count: 5 },
              { label: '7N (Week)', count: 7 },
              { label: '14N (Camp)', count: 14 },
            ].map((preset) => (
              <button
                key={preset.count}
                type="button"
                onClick={() => setStayDuration(preset.count)}
                className={`px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition-all min-h-[36px] flex items-center touch-manipulation active:scale-95 ${
                  nights === preset.count
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500">
            Complimentary luggage & board lockers from 10:00 on arrival.
          </div>
        </div>
      </div>

      {/* EMBEDDED DUAL-MONTH INTERACTIVE CALENDAR WITH RANGE DECORATION */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-3.5 sm:p-5">
        {/* Calendar Nav Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={isCurrentOrPastMonth}
              aria-label="Previous month"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-700 transition-colors shadow-2xs touch-manipulation active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-600">
              {activeStep === 'checkIn' ? (
                <span className="text-teal-700 font-extrabold flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Select Check-In date
                </span>
              ) : (
                <span className="text-cyan-700 font-extrabold flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-cyan-600" />
                  Select Check-Out date
                </span>
              )}
            </span>
          </div>

          {/* Quick Package Helpers & Next Month */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPresetStay(0, 3)}
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors touch-manipulation"
            >
              This Weekend
            </button>
            <button
              type="button"
              onClick={() => applyPresetStay(5, 7)}
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors touch-manipulation"
            >
              Next Week (7N)
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs touch-manipulation active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar View: clean single-month on mobile phone, dual-month on tablet & desktop */}
        <div className="flex flex-col md:flex-row gap-5 lg:gap-6">
          <div className="flex-1 min-w-0">
            {renderMonth(viewYear, viewMonth, monthGrid1)}
          </div>
          <div className="hidden md:block w-px bg-slate-100 self-stretch my-2" />
          <div className="hidden md:block flex-1 min-w-0">
            {renderMonth(nextMonthYear, nextMonth, monthGrid2)}
          </div>
        </div>

        {/* Bottom Legend & Summary */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gradient-to-br from-teal-600 to-cyan-700" />
              <span>Check-in / Check-out</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-teal-50 border border-teal-200" />
              <span>Stay Duration</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border border-teal-500 ring-1 ring-teal-200 bg-teal-50/50" />
              <span>Today</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {formatDisplayDate(checkIn)} → {formatDisplayDate(checkOut)}
            </span>
            <span className="font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              {nights} night{nights > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
