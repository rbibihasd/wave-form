import React from 'react';
import { 
  Waves, Wind, Droplets, Sparkles, Heart, 
  ChevronRight, MapPin, Video
} from 'lucide-react';
import { LiveOceanSpot, OceanSport } from '../../types/weather';
import { SPORT_CONFIG } from '../../data/oceanSpotsData';
import { formatTemperature, formatWaveHeight, formatWindSpeed } from '../../utils/oceanWeatherApi';

interface SpotCardProps {
  spot: LiveOceanSpot;
  selectedSport: OceanSport | 'all';
  unit: 'metric' | 'imperial';
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectSpot: (spot: LiveOceanSpot) => void;
  onBookForSpot?: (spot: LiveOceanSpot) => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  selectedSport,
  unit,
  isFavorite,
  onToggleFavorite,
  onSelectSpot,
  onBookForSpot,
}) => {
  // Determine relevant sport rating to display
  const activeSportKey: OceanSport = selectedSport === 'all' ? 'surf' : selectedSport;
  const rating = spot.current.sportsRatings[activeSportKey] || spot.current.sportsRatings.surf;
  const sportCfg = SPORT_CONFIG[activeSportKey];

  const getVerdictStyle = (score: number) => {
    if (score >= 8.5) {
      return {
        badge: 'bg-emerald-500 text-white',
        border: 'border-emerald-200 hover:border-emerald-400',
        text: 'text-emerald-700',
      };
    }
    if (score >= 7.0) {
      return {
        badge: 'bg-teal-600 text-white',
        border: 'border-teal-200 hover:border-teal-400',
        text: 'text-teal-700',
      };
    }
    if (score >= 5.0) {
      return {
        badge: 'bg-amber-500 text-white',
        border: 'border-amber-200 hover:border-amber-400',
        text: 'text-amber-700',
      };
    }
    return {
      badge: 'bg-slate-500 text-white',
      border: 'border-slate-200 hover:border-slate-300',
      text: 'text-slate-600',
    };
  };

  const style = getVerdictStyle(rating.score);

  const getWindBadge = (rel: string) => {
    switch (rel) {
      case 'offshore':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'cross_offshore':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'cross_shore':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'cross_onshore':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div 
      className={`group bg-white rounded-3xl border ${style.border} shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden text-slate-900 cursor-pointer`}
      onClick={() => onSelectSpot(spot)}
    >
      {/* Top Media Image Header */}
      <div className="relative h-44 sm:h-48 overflow-hidden bg-slate-950">
        <img
          src={spot.image}
          alt={spot.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Favorite Bookmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(spot.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            isFavorite 
              ? 'bg-rose-500 text-white shadow-md scale-105' 
              : 'bg-black/40 hover:bg-black/60 text-white/90'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </button>

        {/* Live Cam / World Spot Tag */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {spot.isWorldSpot ? (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900/85 backdrop-blur-xs text-teal-300 border border-teal-500/30 flex items-center gap-1 shadow-xs">
              <span>🌍</span>
              <span>{spot.country || 'World Spot'}</span>
            </div>
          ) : spot.webcamAvailable ? (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600/90 backdrop-blur-xs text-white flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Live Cam</span>
            </div>
          ) : (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-900/80 backdrop-blur-xs text-teal-200 border border-teal-500/30 flex items-center gap-1 shadow-xs">
              <span>🇵🇹 Local</span>
            </div>
          )}
        </div>

        {/* Wave Height Badge Over Image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-black/65 backdrop-blur-md text-white border border-white/20 flex items-center gap-2">
            <Waves className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-sm font-black tracking-tight">
              {formatWaveHeight(spot.current.waveHeight, unit)}
            </span>
            <span className="text-[10px] text-slate-300 font-medium">
              {spot.current.wavePeriod}s {spot.current.swellCardinal}
            </span>
          </div>
        </div>

        {/* Sport Rating Score Badge */}
        <div className="absolute bottom-3 right-3">
          <div className={`px-2.5 py-1 rounded-xl font-black text-xs shadow-md flex items-center gap-1 ${style.badge}`}>
            <span className="text-xs">{sportCfg.icon}</span>
            <span>{rating.score}</span>
            <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-90">{rating.verdict}</span>
          </div>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Location & Distance */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1 truncate max-w-[65%]">
              <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
              <span className="truncate">{spot.region}</span>
            </span>
            <span className="font-semibold text-slate-600 shrink-0">
              {spot.isWorldSpot ? (
                <span className="text-teal-700 font-bold flex items-center gap-1">
                  <span>🌐</span>
                  <span>{spot.distanceKm.toLocaleString()} km</span>
                </span>
              ) : (
                <span>{spot.distanceKm} km from hostel</span>
              )}
            </span>
          </div>

          {/* Spot Title */}
          <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-700 transition-colors mt-1">
            {spot.name}
          </h3>

          {/* Headline Recommendation */}
          <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
            {rating.headline}
          </p>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          {/* Wind */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Wind className="w-2.5 h-2.5 text-teal-600" />
              Wind
            </div>
            <div className="font-bold text-slate-900 mt-0.5">
              {spot.current.windSpeedKnots} kt
            </div>
            <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded-md font-bold capitalize border mt-0.5 ${getWindBadge(spot.current.windRelation)}`}>
              {spot.current.windRelation.replace('_', ' ')}
            </span>
          </div>

          {/* Tide */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Droplets className="w-2.5 h-2.5 text-teal-600" />
              Tide
            </div>
            <div className="font-bold text-slate-900 mt-0.5">
              {spot.current.currentTideHeight}m
            </div>
            <span className="text-[10px] text-teal-700 font-semibold capitalize mt-0.5 block">
              {spot.current.tideStatus}
            </span>
          </div>

          {/* Water Temp & Seabed */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Water
            </div>
            <div className="font-bold text-slate-900 mt-0.5">
              {formatTemperature(spot.current.temperatureWater, unit)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium capitalize truncate block mt-0.5">
              {spot.breakType.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
          <button
            type="button"
            className="text-xs font-black text-teal-700 hover:text-teal-800 flex items-center gap-1 group/btn"
          >
            <span>Live Forecast & Tides</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>

          {onBookForSpot && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBookForSpot(spot);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-teal-600 text-white text-[11px] font-bold transition-colors"
            >
              Book Stay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
