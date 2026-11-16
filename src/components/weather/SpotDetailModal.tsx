import React, { useState } from 'react';
import { 
  X, Waves, Wind, Compass, Droplets, Thermometer, 
  Sun, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, 
  Calendar, Clock, ArrowUpRight, Share2, Heart, ExternalLink,
  ChevronRight, Bookmark
} from 'lucide-react';
import { LiveOceanSpot, OceanSport } from '../../types/weather';
import { SPORT_CONFIG } from '../../data/oceanSpotsData';
import { formatTemperature, formatWaveHeight, formatWindSpeed } from '../../utils/oceanWeatherApi';

interface SpotDetailModalProps {
  spot: LiveOceanSpot | null;
  selectedSport: OceanSport;
  unit: 'metric' | 'imperial';
  isFavorite: boolean;
  onToggleFavorite: (spotId: string) => void;
  onClose: () => void;
  onBookForSpot?: (spot: LiveOceanSpot) => void;
}

export const SpotDetailModal: React.FC<SpotDetailModalProps> = ({
  spot,
  selectedSport,
  unit,
  isFavorite,
  onToggleFavorite,
  onClose,
  onBookForSpot,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sports' | 'hourly' | '7day'>('overview');
  const [activeSportTab, setActiveSportTab] = useState<OceanSport>(selectedSport);

  if (!spot) return null;

  const currentSportRating = spot.current.sportsRatings[activeSportTab] || spot.current.sportsRatings.surf;
  const sportCfg = SPORT_CONFIG[activeSportTab];

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'Epic':
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-300 ring-1 ring-emerald-500/20';
      case 'Good':
        return 'bg-teal-500/15 text-teal-700 border-teal-300 ring-1 ring-teal-500/20';
      case 'Fair':
        return 'bg-amber-500/15 text-amber-700 border-amber-300 ring-1 ring-amber-500/20';
      case 'Challenging':
        return 'bg-orange-500/15 text-orange-700 border-orange-300 ring-1 ring-orange-500/20';
      default:
        return 'bg-rose-500/15 text-rose-700 border-rose-300 ring-1 ring-rose-500/20';
    }
  };

  const getWindRelationColor = (relation: string) => {
    if (relation === 'offshore') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (relation === 'cross_offshore') return 'text-teal-700 bg-teal-50 border-teal-200';
    if (relation === 'cross_shore') return 'text-sky-700 bg-sky-50 border-sky-200';
    if (relation === 'cross_onshore') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Banner */}
        <div className="relative h-48 sm:h-64 bg-slate-900 shrink-0 overflow-hidden">
          <img 
            src={spot.image} 
            alt={spot.name} 
            className="w-full h-full object-cover opacity-65 scale-105 transition-transform duration-700 hover:scale-100" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />

          {/* Close & Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={() => onToggleFavorite(spot.id)}
              className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${
                isFavorite 
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md scale-105' 
                  : 'bg-black/40 hover:bg-black/60 text-white border-white/20'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20 transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Location Badges & Title */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-500/90 text-white shadow-xs">
                {spot.region}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                {spot.distanceKm} km from WaveHaven
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20 capitalize">
                {spot.breakType.replace('_', ' ')}
              </span>
              {spot.webcamAvailable && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/90 text-white flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live Beach Cam
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white drop-shadow-md">
              {spot.name}
            </h2>
            <p className="text-xs text-slate-200 max-w-2xl line-clamp-1 mt-0.5">
              {spot.description}
            </p>
          </div>
        </div>

        {/* Live Weather Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 p-3 bg-slate-100/90 border-b border-slate-200 text-xs">
          {/* Wave Height */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Waves className="w-3 h-3 text-teal-600" />
              Swell Height
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {formatWaveHeight(spot.current.waveHeight, unit)}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {spot.current.wavePeriod}s • {spot.current.swellCardinal} ({spot.current.swellDirection}°)
            </div>
          </div>

          {/* Wind */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Wind className="w-3 h-3 text-teal-600" />
              Wind Speed
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {formatWindSpeed(spot.current.windSpeedKnots, unit)}
            </div>
            <div className="text-[10px] font-bold capitalize flex items-center gap-1">
              <span className={`px-1.5 py-0.2 rounded-sm border ${getWindRelationColor(spot.current.windRelation)}`}>
                {spot.current.windRelation.replace('_', ' ')}
              </span>
              <span className="text-slate-400">{spot.current.windCardinal}</span>
            </div>
          </div>

          {/* Tide */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-teal-600" />
              Tide State
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {spot.current.currentTideHeight}m
            </div>
            <div className="text-[10px] font-bold text-teal-700 capitalize">
              {spot.current.tideStatus} • Next: {spot.current.nextTide.type} ({spot.current.nextTide.time})
            </div>
          </div>

          {/* Air & Water Temp */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-teal-600" />
              Temperatures
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {formatTemperature(spot.current.temperatureAir, unit)}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Water: {formatTemperature(spot.current.temperatureWater, unit)}
            </div>
          </div>

          {/* Sky & UV */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" />
              Weather
            </div>
            <div className="text-sm font-bold text-slate-900 truncate mt-1">
              {spot.current.weatherLabel}
            </div>
            <div className="text-[10px] text-slate-500">
              UV Index {spot.current.uvIndex} • {spot.current.humidity}% Hum.
            </div>
          </div>

          {/* Primary Sport Rating */}
          <div className="bg-teal-50/90 p-2.5 rounded-xl border border-teal-200 shadow-2xs">
            <div className="text-[10px] uppercase font-extrabold text-teal-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              {sportCfg.label} Score
            </div>
            <div className="text-lg font-black text-teal-950 mt-0.5 flex items-baseline gap-1">
              <span>{currentSportRating.score}</span>
              <span className="text-xs font-normal text-teal-700">/ 10</span>
            </div>
            <div className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wide">
              {currentSportRating.verdict}
            </div>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Spot Overview & Live Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sports')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sports'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All 8 Sports Ratings</span>
            <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full">
              Live
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hourly')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'hourly'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            24-Hour Swell & Wind Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('7day')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === '7day'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            7-Day Marine Outlook
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Selected Sport Recommendation Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 text-white shadow-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-700/50 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{sportCfg.icon}</span>
                    <div>
                      <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                        Current Sport Analysis: {sportCfg.label}
                      </div>
                      <h3 className="text-lg font-black text-white">
                        {currentSportRating.headline}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getVerdictBadge(currentSportRating.verdict)}`}>
                      {currentSportRating.verdict} • {currentSportRating.score}/10
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-teal-100/90 mt-3 leading-relaxed">
                  {currentSportRating.recommendation}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-teal-800/40 text-xs">
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                    <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-300" />
                      Recommended Gear
                    </div>
                    <p className="text-xs text-white font-semibold mt-1">
                      {currentSportRating.gearTip}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                    <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wide flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-teal-300" />
                      Wetsuit Recommendation
                    </div>
                    <p className="text-xs text-white font-semibold mt-1">
                      {spot.current.wetsuitRecommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spot Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Break & Seabed Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Break Characteristics
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Break Type:</span>
                      <span className="font-bold text-slate-800 capitalize">{spot.breakType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Seabed / Substrate:</span>
                      <span className="font-bold text-slate-800">{spot.seabed}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Optimal Swell Direction:</span>
                      <span className="font-bold text-teal-700">{spot.idealSwellDir.join(', ')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Optimal Wind Direction:</span>
                      <span className="font-bold text-teal-700">{spot.idealWindDir.join(', ')} (Offshore)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Optimal Tide Stage:</span>
                      <span className="font-bold text-slate-800 capitalize">{spot.idealTide} Tide</span>
                    </div>
                  </div>
                </div>

                {/* Tide Schedule & Water Levels */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Atlantic Tide Timetable</span>
                    <span className="text-teal-700 font-bold lowercase text-[11px]">
                      currently {spot.current.tideStatus}
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {spot.tides.map((t, i) => (
                      <div 
                        key={i} 
                        className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                          t.time === spot.current.nextTide.time 
                            ? 'bg-teal-50 border border-teal-300 font-bold text-teal-900' 
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Droplets className={`w-3.5 h-3.5 ${t.type === 'high' ? 'text-teal-600' : 'text-amber-500'}`} />
                          <span className="font-bold capitalize">{t.type} Tide</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono">{t.time}</span>
                          <span className="font-black">{t.height}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hazards and Amenities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hazards */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Ocean Hazards & Safety Advice
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-900/90">
                    {spot.hazards.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Amenities */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Beach Infrastructure & Amenities
                  </h4>
                  <ul className="space-y-1.5 text-xs text-emerald-900/90">
                    {spot.amenities.map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL 8 SPORTS RATINGS */}
          {activeTab === 'sports' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-200">
                {(Object.keys(SPORT_CONFIG) as OceanSport[]).map((sportKey) => {
                  const cfg = SPORT_CONFIG[sportKey];
                  const rating = spot.current.sportsRatings[sportKey];
                  const isActive = activeSportTab === sportKey;
                  return (
                    <button
                      key={sportKey}
                      type="button"
                      onClick={() => setActiveSportTab(sportKey)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {rating?.score || '—'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Sport Detailed Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{sportCfg.icon}</span>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {sportCfg.label} at {spot.name}
                      </h3>
                      <p className="text-xs text-slate-500">{sportCfg.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900">
                      {currentSportRating.score} <span className="text-xs font-normal text-slate-400">/ 10</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getVerdictBadge(currentSportRating.verdict)}`}>
                      {currentSportRating.verdict}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {currentSportRating.headline}
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    {currentSportRating.recommendation}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-teal-700">Gear Setup</div>
                    <div className="text-slate-800 font-medium mt-0.5">{currentSportRating.gearTip}</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-teal-700">Ideal Baseline</div>
                    <div className="text-slate-800 font-medium mt-0.5">{sportCfg.idealWave} • {sportCfg.idealWind}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 24-HOUR HOURLY TIMELINE */}
          {activeTab === 'hourly' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  24-Hour Hourly Marine Forecast
                </h4>
                <span className="text-xs text-slate-400">Updated every 2 hours</span>
              </div>

              <div className="space-y-2">
                {spot.hourly.map((pt, i) => (
                  <div 
                    key={i} 
                    className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200 transition-colors flex items-center justify-between text-xs"
                  >
                    {/* Time & Weather */}
                    <div className="flex items-center gap-3 w-28">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-900">{pt.displayTime}</span>
                      <span className="text-[11px] text-slate-500">{pt.weatherLabel.split(' ')[0]}</span>
                    </div>

                    {/* Wave Height & Period */}
                    <div className="flex items-center gap-2 w-32">
                      <Waves className="w-3.5 h-3.5 text-teal-600" />
                      <div>
                        <div className="font-black text-slate-900">{formatWaveHeight(pt.waveHeight, unit)}</div>
                        <div className="text-[10px] text-slate-400">{pt.wavePeriod}s • {pt.swellCardinal}</div>
                      </div>
                    </div>

                    {/* Wind */}
                    <div className="flex items-center gap-2 w-36">
                      <Wind className="w-3.5 h-3.5 text-teal-600" />
                      <div>
                        <div className="font-bold text-slate-800">{formatWindSpeed(pt.windSpeedKnots, unit)}</div>
                        <div className="text-[10px] font-semibold text-teal-700 capitalize">{pt.windRelation.replace('_', ' ')} ({pt.windCardinal})</div>
                      </div>
                    </div>

                    {/* Tide */}
                    <div className="text-right w-16">
                      <div className="text-slate-400 text-[10px]">Tide</div>
                      <div className="font-bold text-slate-800">{pt.tideHeight}m</div>
                    </div>

                    {/* Score Gauge */}
                    <div className="w-16 text-right">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                        pt.suitabilityScore >= 8.5 ? 'bg-emerald-100 text-emerald-800' :
                        pt.suitabilityScore >= 7.0 ? 'bg-teal-100 text-teal-800' :
                        pt.suitabilityScore >= 5.0 ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {pt.suitabilityScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 7-DAY MARINE OUTLOOK */}
          {activeTab === '7day' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                7-Day Atlantic Swell & Weather Outlook
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {spot.daily.map((day, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-black text-slate-900 text-sm">{day.dayName}</span>
                      <span className="text-[11px] text-slate-500">{day.date}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Waves className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-bold text-slate-800">
                          {formatWaveHeight(day.waveHeightMin, unit)} – {formatWaveHeight(day.waveHeightMax, unit)}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">{day.dominantPeriod}s</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-teal-600" />
                        <span className="text-slate-700">{formatWindSpeed(day.windAvgKnots, unit)}</span>
                      </div>
                      <span className="text-slate-700 font-bold">
                        {formatTemperature(day.maxTemp, unit)} / {formatTemperature(day.minTemp, unit)}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-teal-800">
                      <span>Best Sport: {SPORT_CONFIG[day.bestSport]?.label}</span>
                      <span>{day.weatherLabel.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Open-Meteo Marine & Portuguese Atlantic Buoy Network Synced</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
            >
              Close
            </button>
            {onBookForSpot && (
              <button
                type="button"
                onClick={() => {
                  onBookForSpot(spot);
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <span>Book Surf Stay for this Spot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
