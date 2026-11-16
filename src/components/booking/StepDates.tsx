import React from 'react';
import { Calendar, Users, Waves, Wind, Compass, Sparkles, CheckCircle2, MapPin, Droplets, Thermometer, ChevronRight } from 'lucide-react';
import { SurfSkillLevel } from '../../types';
import { LiveOceanSpot } from '../../types/weather';
import { calculateNights, formatDisplayDate, getTodayString, addDaysToString } from '../../utils/date';
import { DateRangePicker } from './DateRangePicker';
import { INITIAL_OCEAN_SPOTS } from '../../data/oceanSpotsData';
import { INITIAL_WORLD_OCEAN_SPOTS } from '../../data/worldOceanSpotsData';
import { WorldRegionSpotSearch } from '../weather/WorldRegionSpotSearch';

interface StepDatesProps {
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  surfLevel: SurfSkillLevel;
  selectedSpot?: LiveOceanSpot;
  onSelectSpot?: (spot: LiveOceanSpot) => void;
  allSpots?: LiveOceanSpot[];
  onOpenWeatherView?: () => void;
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
  selectedSpot,
  onSelectSpot,
  allSpots,
  onOpenWeatherView,
  onCheckInChange,
  onCheckOutChange,
  onGuestsCountChange,
  onSurfLevelChange,
  onNext,
}) => {
  const today = getTodayString();
  const nights = calculateNights(checkIn, checkOut);

  const availableSpots = allSpots && allSpots.length > 0 
    ? allSpots 
    : [...INITIAL_OCEAN_SPOTS, ...INITIAL_WORLD_OCEAN_SPOTS];
  const activeSpot = selectedSpot || availableSpots[0];
  const current = activeSpot.current;
  const surfRating = current.sportsRatings.surf;

  const localSpots = availableSpots.filter((s) => !s.isWorldSpot);
  const worldSpots = availableSpots.filter((s) => s.isWorldSpot);

  const skillOptions: {
    id: SurfSkillLevel;
    title: string;
    description: string;
    icon: string;
    tag: string;
  }[] = [
    {
      id: 'beginner',
      title: 'First-Timer / Beginner',
      description: 'Zero to little experience. Ready to catch first whitewater waves and master pop-up technique.',
      icon: '🏄‍♂️',
      tag: 'Coaching Included Option',
    },
    {
      id: 'intermediate',
      title: 'Intermediate Surfer',
      description: 'Paddles outside the break, catches unbroken green waves, working on bottom turns & trimming.',
      icon: '🌊',
      tag: 'Most Popular',
    },
    {
      id: 'advanced',
      title: 'Advanced / Barrel Hunter',
      description: 'Independent surfer looking for reef breaks, slab waves, speed generation, and heavy swells.',
      icon: '⚡',
      tag: 'Guide Spots Ready',
    },
    {
      id: 'non_surfer',
      title: 'Beach & Yoga Lover',
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 self-start">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Ocean Conditions</span>
            </div>

            {/* Search field allowing admins and guests to search and select any region around the world */}
            <div className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] max-w-[340px]">
              <WorldRegionSpotSearch
                selectedSpot={activeSpot}
                allSpots={availableSpots}
                onSelectSpot={(spot) => {
                  if (onSelectSpot) {
                    onSelectSpot(spot);
                  }
                }}
                variant="dark"
                compact={true}
                placeholder="Search world region or break..."
              />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-white mb-2">
            Plan Your Surf House Getaway
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
            Select your dates and surf experience. Real-time availability will instantly calculate dorm beds and private rooms for you.
          </p>
        </div>

        {/* Live Ocean Conditions Bar for Selected Spot */}
        <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-300">
            <span className="font-semibold text-teal-300 truncate">
              Live Conditions at {activeSpot.name}:
            </span>
            <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
              {surfRating.verdict} ({surfRating.score}/10) • {activeSpot.distanceKm} km from hostel
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs">
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2 sm:p-2.5 border border-white/10 flex items-center gap-2 sm:gap-2.5">
              <Waves className="w-4 h-4 text-teal-300 shrink-0" />
              <div className="min-w-0">
                <p className="text-slate-400 text-[10px] uppercase font-medium">Swell Height</p>
                <p className="text-white font-bold truncate text-[11px] sm:text-xs">{current.waveHeight}m ({current.wavePeriod}s {current.swellCardinal})</p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2 sm:p-2.5 border border-white/10 flex items-center gap-2 sm:gap-2.5">
              <Wind className="w-4 h-4 text-cyan-300 shrink-0" />
              <div className="min-w-0">
                <p className="text-slate-400 text-[10px] uppercase font-medium">Wind</p>
                <p className="text-white font-bold capitalize truncate text-[11px] sm:text-xs">
                  {current.windSpeedKnots} kt {current.windRelation.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2 sm:p-2.5 border border-white/10 flex items-center gap-2 sm:gap-2.5">
              <Droplets className="w-4 h-4 text-emerald-300 shrink-0" />
              <div className="min-w-0">
                <p className="text-slate-400 text-[10px] uppercase font-medium">Tide</p>
                <p className="text-white font-bold capitalize truncate text-[11px] sm:text-xs">{current.tideStatus} ({current.currentTideHeight}m)</p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-2 sm:p-2.5 border border-white/10 flex items-center gap-2 sm:gap-2.5">
              <Thermometer className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="min-w-0">
                <p className="text-slate-400 text-[10px] uppercase font-medium">Water Temp</p>
                <p className="text-white font-bold truncate text-[11px] sm:text-xs">{current.temperatureWater}°C (3/2 Wetsuit)</p>
              </div>
            </div>
          </div>
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
                Guests & Travelers
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
                  <span className="hidden sm:inline">{num} {num === 1 ? 'Guest' : 'Guests'}</span>
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
              Your Surfing Experience Level
            </h3>
            <p className="text-xs text-slate-500">
              Helps us organize lesson cohorts, board quiver recommendations, and guide spots.
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
          <span className="font-semibold text-slate-700">{nights} night{nights > 1 ? 's' : ''}</span> • {guestsCount} guest{guestsCount > 1 ? 's' : ''}
        </div>
        <button
          id="btn-step1-next"
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto min-h-[48px] h-12 px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 touch-manipulation"
        >
          <span>Check Real-Time Availability</span>
          <span className="text-base font-bold">→</span>
        </button>
      </div>
    </div>
  );
};
