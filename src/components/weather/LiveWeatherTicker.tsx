import React, { useState } from 'react';
import { 
  Waves, Wind, Droplets, Sparkles, ChevronRight, Compass, 
  MapPin, ChevronDown, ChevronUp, Thermometer, Eye, CheckCircle2 
} from 'lucide-react';
import { LiveOceanSpot } from '../../types/weather';
import { INITIAL_OCEAN_SPOTS } from '../../data/oceanSpotsData';
import { INITIAL_WORLD_OCEAN_SPOTS } from '../../data/worldOceanSpotsData';
import { WorldRegionSpotSearch } from './WorldRegionSpotSearch';

export interface LiveWeatherTickerProps {
  primarySpot?: LiveOceanSpot;
  selectedSpot?: LiveOceanSpot;
  allSpots?: LiveOceanSpot[];
  onSelectSpot?: (spot: LiveOceanSpot) => void;
  onOpenWeatherView: () => void;
}

export const LiveWeatherTicker: React.FC<LiveWeatherTickerProps> = ({
  primarySpot,
  selectedSpot,
  allSpots,
  onSelectSpot,
  onOpenWeatherView,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Available spots list for selection
  const availableSpots = allSpots && allSpots.length > 0 
    ? allSpots 
    : [...INITIAL_OCEAN_SPOTS, ...INITIAL_WORLD_OCEAN_SPOTS];

  // Active spot priority: selectedSpot -> primarySpot -> first available
  const activeSpot = selectedSpot || primarySpot || availableSpots[0];
  const current = activeSpot.current;
  const surfRating = current.sportsRatings.surf;

  const localSpots = availableSpots.filter((s) => !s.isWorldSpot);
  const worldSpots = availableSpots.filter((s) => s.isWorldSpot);

  const handleSpotChange = (spotId: string) => {
    const found = availableSpots.find((s) => s.id === spotId);
    if (found) {
      if (onSelectSpot) {
        onSelectSpot(found);
      }
      // Automatically display the live ocean conditions card when a spot is selected!
      setIsExpanded(true);
    }
  };

  return (
    <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white rounded-2xl shadow-md border border-teal-800/60 mb-6 overflow-hidden text-xs transition-all duration-300">
      {/* Main Ticker Bar */}
      <div className="px-3 sm:px-5 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Left: Live Indicator & Interactive Spot Selector */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-extrabold text-teal-300 uppercase tracking-wider text-[11px] whitespace-nowrap">
              Live Ocean Conditions
            </span>
          </div>

          {/* Search field allowing admins and guests to search and select any region around the world */}
          <div className="w-full sm:w-auto min-w-[220px] max-w-[320px]">
            <WorldRegionSpotSearch
              selectedSpot={activeSpot}
              allSpots={availableSpots}
              onSelectSpot={(spot) => {
                if (onSelectSpot) {
                  onSelectSpot(spot);
                }
                setIsExpanded(true);
              }}
              variant="dark"
              compact={true}
              placeholder="Search world region or break..."
            />
          </div>
        </div>

        {/* Middle: Key Ocean Metrics for the Selected Spot */}
        <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-5 text-slate-200 text-xs">
          {/* Wave Height */}
          <div className="flex items-center gap-1.5" title="Swell height, dominant period & direction">
            <Waves className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-black text-white">{current.waveHeight}m</span>
            <span className="text-[11px] text-teal-200">({current.wavePeriod}s {current.swellCardinal})</span>
          </div>

          {/* Wind */}
          <div className="flex items-center gap-1.5" title="Wind speed & orientation">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-bold text-white">{current.windSpeedKnots} kt</span>
            <span className="text-[11px] text-emerald-300 font-semibold capitalize">
              {current.windRelation.replace('_', ' ')}
            </span>
          </div>

          {/* Tide */}
          <div className="flex items-center gap-1.5 hidden sm:flex" title="Current tide state">
            <Droplets className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-300 capitalize">{current.tideStatus}</span>
            <span className="text-[11px] text-teal-200">({current.currentTideHeight}m)</span>
          </div>

          {/* Water Temp */}
          <div className="flex items-center gap-1 text-[11px] text-teal-200 hidden md:flex" title="Water temperature">
            <Thermometer className="w-3 h-3 text-cyan-300" />
            <span>{current.temperatureWater}°C</span>
          </div>

          {/* Surf Score */}
          <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-lg" title="Surfing condition score">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span className="font-black text-white">{surfRating.score}/10</span>
            <span className="text-[10px] uppercase font-bold text-emerald-300">{surfRating.verdict}</span>
          </div>
        </div>

        {/* Right: Actions & Expand Drawer Toggle */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
            title={isExpanded ? 'Hide conditions breakdown' : 'Show full live conditions breakdown'}
          >
            <span>{isExpanded ? 'Hide Conditions' : 'Live Details'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={onOpenWeatherView}
            className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-102 active:scale-98"
          >
            <span>Full Wave Forecast</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Automatically Displayed Live Ocean Conditions Breakdown */}
      {isExpanded && (
        <div className="bg-slate-950/80 px-4 sm:px-6 py-4 border-t border-teal-800/40 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-extrabold text-[10px] uppercase tracking-wide border border-teal-500/30">
                  {activeSpot.name} Live Ocean Telemetry
                </span>
                <span className="text-slate-400 text-xs">
                  {activeSpot.distanceKm} km from hostel • {activeSpot.breakType.replace('_', ' ')} • {activeSpot.seabed}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                {surfRating.headline}. {surfRating.recommendation}
              </p>
              <p className="text-[11px] text-teal-300/90 font-medium">
                🏄 Gear Advice: {surfRating.gearTip} • Wetsuit: {current.wetsuitRecommendation}
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto shrink-0 text-center">
              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase">Swell Height</div>
                <div className="text-sm font-black text-white">{current.waveHeight}m</div>
                <div className="text-[10px] text-teal-300">{current.wavePeriod}s {current.swellCardinal}</div>
              </div>

              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase">Wind Speed</div>
                <div className="text-sm font-black text-white">{current.windSpeedKnots} kt</div>
                <div className="text-[10px] text-emerald-300 capitalize">{current.windRelation.replace('_', ' ')}</div>
              </div>

              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase">Tide Height</div>
                <div className="text-sm font-black text-white">{current.currentTideHeight}m</div>
                <div className="text-[10px] text-slate-300 capitalize">{current.tideStatus}</div>
              </div>

              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase">Water Temp</div>
                <div className="text-sm font-black text-white">{current.temperatureWater}°C</div>
                <div className="text-[10px] text-teal-300">Air {current.temperatureAir}°C</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

