import React from 'react';
import { Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { SurfSkillLevel } from '../../types';
import { calculateNights } from '../../utils/date';
import { DateRangePicker } from './DateRangePicker';
import { useLanguage } from '../../context/LanguageContext';

interface StepDatesProps {
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  surfLevel: SurfSkillLevel;
  onCheckInChange: (val: string) => void;
  onCheckOutChange: (val: string) => void;
  onGuestsCountChange: (val: number) => void;
  onSurfLevelChange: (val: SurfSkillLevel) => void;
  onNext: () => void;
}

export const StepDates: React.FC<StepDatesProps> = ({
  checkIn,
  checkOut,
  guestsCount,
  surfLevel,
  onCheckInChange,
  onCheckOutChange,
  onGuestsCountChange,
  onSurfLevelChange,
  onNext,
}) => {
  const { t } = useLanguage();
  const nights = calculateNights(checkIn, checkOut);

  const skillOptions: {
    id: SurfSkillLevel;
    title: string;
    description: string;
    icon: string;
    tag: string;
  }[] = [
    {
      id: 'beginner',
      title: t.surfLevels?.beginner || 'First-Timer / Beginner',
      description: 'Zero to little experience. Ready to catch first whitewater waves and master pop-up technique.',
      icon: '🏄‍♂️',
      tag: 'Coaching Included Option',
    },
    {
      id: 'intermediate',
      title: t.surfLevels?.intermediate || 'Intermediate Surfer',
      description: 'Paddles outside the break, catches unbroken green waves, working on bottom turns & trimming.',
      icon: '🌊',
      tag: 'Most Popular',
    },
    {
      id: 'advanced',
      title: t.surfLevels?.advanced || 'Advanced / Barrel Hunter',
      description: 'Independent surfer looking for reef breaks, speed generation, and heavy swells.',
      icon: '⚡',
      tag: 'Coaching & Progression',
    },
    {
      id: 'non_surfer',
      title: t.surfLevels?.non_surfer || 'Beach & Yoga Lover',
      description: 'Here for ocean air, sunset rooftop yoga, healthy açai bowls, and the coastal lifestyle.',
      icon: '☀️',
      tag: 'Wellness Vibe',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-cyan-950 to-teal-900 text-white rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.booking?.bestRateGuarantee || 'Direct Booking Guarantee'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-white mb-2">
            {t.booking?.datesTitle || 'Plan Your Surf House Getaway'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
            {t.booking?.datesSubtitle || 'Select your dates and surf experience. Real-time availability will instantly calculate dorm beds and private rooms for you.'}
          </p>
        </div>
      </div>

      {/* PERFECT STYLE UI: Check-In & Check-Out Decorated Date Range */}
      <DateRangePicker
        checkIn={checkIn}
        checkOut={checkOut}
        onCheckInChange={onCheckInChange}
        onCheckOutChange={onCheckOutChange}
      />

      {/* Guest Selection Card with Matching Boutique UI Craft */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold shrink-0">
                <Users className="w-3.5 h-3.5" />
              </span>
              <h3 className="font-heading font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                {t.booking?.numberOfGuests || 'Guests & Travelers'}
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                {guestsCount === 1 ? 'Solo Traveler' : guestsCount === 2 ? 'Couple / Duo' : 'Group Stay'}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              {guestsCount === 1
                ? 'Searching single dorm beds and cozy private double rooms.'
                : 'Searching adjacent dorm beds or full private suites to fit your group.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-start lg:justify-end gap-3 w-full lg:w-auto">
            {/* Quick Guest Count Pills (fluid grid on mobile, flex on tablet & desktop) */}
            <div className="grid grid-cols-5 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
              {[1, 2, 3, 4, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onGuestsCountChange(num)}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation text-center ${
                    guestsCount === num
                      ? 'bg-white text-teal-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="hidden sm:inline">{num} {num === 1 ? (t.common?.guest || 'Guest') : (t.common?.guests || 'Guests')}</span>
                  <span className="sm:hidden">{num}</span>
                </button>
              ))}
            </div>

            {/* Stepper with touch-friendly 44px minus/plus */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-2xs self-center sm:self-auto">
              <button
                type="button"
                id="btn-guest-minus"
                onClick={() => onGuestsCountChange(Math.max(1, guestsCount - 1))}
                disabled={guestsCount <= 1}
                aria-label="Decrease guest count"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 transition-all shadow-2xs touch-manipulation shrink-0"
              >
                -
              </button>
              <span className="font-heading font-black text-base sm:text-lg text-slate-900 px-3 sm:px-4 min-w-[2.5rem] sm:min-w-[3rem] text-center">
                {guestsCount}
              </span>
              <button
                type="button"
                id="btn-guest-plus"
                onClick={() => onGuestsCountChange(Math.min(10, guestsCount + 1))}
                disabled={guestsCount >= 10}
                aria-label="Increase guest count"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 transition-all shadow-2xs touch-manipulation shrink-0"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Surf Skill Level Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-heading font-bold text-slate-900">
              {t.booking?.surfLevel || 'Your Surfing Experience Level'}
            </h3>
            <p className="text-xs text-slate-500">
              Helps us organize lesson cohorts and board quiver recommendations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
          {skillOptions.map((opt) => {
            const isSelected = surfLevel === opt.id;
            return (
              <div
                key={opt.id}
                id={`skill-card-${opt.id}`}
                onClick={() => onSurfLevelChange(opt.id)}
                className={`cursor-pointer rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 relative flex flex-col justify-between touch-manipulation min-h-[110px] sm:min-h-[140px] h-full ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="text-xl sm:text-2xl">{opt.icon}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-600 fill-teal-100" />
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {opt.tag}
                      </span>
                    )}
                  </div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 mb-1">
                    {opt.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-500 order-2 sm:order-1 text-center sm:text-left">
          <span className="font-semibold text-slate-700">{nights} {nights > 1 ? (t.common?.nights || 'nights') : (t.common?.night || 'night')}</span> • {guestsCount} {guestsCount > 1 ? (t.common?.guests || 'guests') : (t.common?.guest || 'guest')}
        </div>
        <button
          id="btn-step1-next"
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto min-h-[48px] h-12 px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 touch-manipulation"
        >
          <span>{t.booking?.checkAvailability || 'Check Real-Time Availability'}</span>
          <span className="text-base font-bold">→</span>
        </button>
      </div>
    </div>
  );
};
