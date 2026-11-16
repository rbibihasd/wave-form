import React, { useState, useEffect, useMemo } from 'react';
import { 
  Waves, Wind, Droplets, RefreshCw, Sparkles, MapPin, 
  Search, SlidersHorizontal, LayoutGrid, List, Heart, 
  Calendar, CheckCircle2, ChevronRight, Compass, Eye,
  ExternalLink, ArrowUpRight, ArrowLeft, Globe, Loader2
} from 'lucide-react';
import { LiveOceanSpot, OceanSport, SpotSearchFilters, WorldGeocodeResult } from '../../types/weather';
import { INITIAL_OCEAN_SPOTS, SPORT_CONFIG } from '../../data/oceanSpotsData';
import { INITIAL_WORLD_OCEAN_SPOTS } from '../../data/worldOceanSpotsData';
import { 
  enrichSpotWithForecasts, fetchLiveOceanWeatherData, 
  formatTemperature, formatWaveHeight, formatWindSpeed,
  createLiveWorldSpotFromGeocode 
} from '../../utils/oceanWeatherApi';
import { AdvancedSpotSearch } from './AdvancedSpotSearch';
import { SpotCard } from './SpotCard';
import { SpotDetailModal } from './SpotDetailModal';
import { WorldRegionSpotSearch } from './WorldRegionSpotSearch';

interface LiveOceanWeatherViewProps {
  initialSpot?: LiveOceanSpot;
  onSelectSpot?: (spot: LiveOceanSpot) => void;
  onBackToBooking?: () => void;
  onBookForSpot?: (spot: LiveOceanSpot) => void;
}

export const LiveOceanWeatherView: React.FC<LiveOceanWeatherViewProps> = ({
  initialSpot,
  onSelectSpot,
  onBackToBooking,
  onBookForSpot,
}) => {
  // Enriched spot list combining both Portugal local coast and iconic world surf/water sports spots
  const [spots, setSpots] = useState<LiveOceanSpot[]>(() => {
    const local = INITIAL_OCEAN_SPOTS.map((s) => enrichSpotWithForecasts({ ...s, isWorldSpot: false }));
    const world = INITIAL_WORLD_OCEAN_SPOTS.map((s) => enrichSpotWithForecasts({ ...s, isWorldSpot: true }));
    return [...local, ...world];
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeSpotId, setActiveSpotId] = useState<string>(() => initialSpot?.id || spots[0]?.id || 'spot-ribeira-dilhas');
  const [selectedSpot, setSelectedSpot] = useState<LiveOceanSpot | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isAddingWorldSpot, setIsAddingWorldSpot] = useState(false);
  const [worldSpotToast, setWorldSpotToast] = useState<string | null>(null);

  // Sync active spot if initialSpot prop updates
  useEffect(() => {
    if (initialSpot && initialSpot.id !== activeSpotId) {
      setActiveSpotId(initialSpot.id);
    }
  }, [initialSpot]);

  const handleSelectSpot = (spot: LiveOceanSpot) => {
    setActiveSpotId(spot.id);
    setSelectedSpot(spot); // Automatically displays the detailed live ocean conditions modal
    if (onSelectSpot) {
      onSelectSpot(spot);
    }
  };

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wavehaven_favorite_spots');
      return saved ? JSON.parse(saved) : ['spot-ribeira-dilhas', 'spot-foz-do-lizandro'];
    } catch {
      return ['spot-ribeira-dilhas'];
    }
  });

  const toggleFavorite = (spotId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(spotId) ? prev.filter((id) => id !== spotId) : [...prev, spotId];
      try {
        localStorage.setItem('wavehaven_favorite_spots', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save favorites', e);
      }
      return next;
    });
  };

  // Search & Filter State
  const [filters, setFilters] = useState<SpotSearchFilters>({
    query: '',
    sport: 'surf',
    skillLevel: 'all',
    minWaveHeight: 0,
    maxWaveHeight: 10,
    windCondition: 'all',
    breakType: 'all',
    tide: 'all',
    minScore: 0,
    onlyFavorites: false,
    scope: 'all',
    sortBy: 'suitability',
    unit: 'metric',
  });

  // Handle live creation of any world location via free Open-Meteo Geocoding & Marine API
  const handleSelectWorldLocation = async (result: WorldGeocodeResult) => {
    setIsAddingWorldSpot(true);
    try {
      const preferredSport = filters.sport === 'all' ? 'surf' : filters.sport;
      const newSpot = await createLiveWorldSpotFromGeocode(result, preferredSport);

      setSpots((prev) => {
        const exists = prev.some(
          (s) =>
            Math.abs(s.coordinates.lat - newSpot.coordinates.lat) < 0.05 &&
            Math.abs(s.coordinates.lng - newSpot.coordinates.lng) < 0.05
        );
        if (exists) {
          return prev.map((s) =>
            Math.abs(s.coordinates.lat - newSpot.coordinates.lat) < 0.05 &&
            Math.abs(s.coordinates.lng - newSpot.coordinates.lng) < 0.05
              ? newSpot
              : s
          );
        }
        return [newSpot, ...prev];
      });

      setWorldSpotToast(`✨ Loaded live wave & weather telemetry for ${result.name} (${result.country || 'Global Coast'}) via Open-Meteo!`);
      setTimeout(() => setWorldSpotToast(null), 5000);

      // Open detail modal for immediate review of the new spot
      handleSelectSpot(newSpot);
      setFilters((f) => ({ ...f, query: '', scope: 'all' }));
    } catch (err) {
      console.error('Failed to fetch world spot conditions:', err);
    } finally {
      setIsAddingWorldSpot(false);
    }
  };

  // Calculate counts of good/epic spots for each sport
  const sportCounts = useMemo(() => {
    const counts: Record<OceanSport, number> = {
      surf: 0,
      kitesurf: 0,
      windsurf: 0,
      bodyboard: 0,
      foil: 0,
      sup: 0,
      swimming: 0,
      diving: 0,
    };

    spots.forEach((spot) => {
      (Object.keys(counts) as OceanSport[]).forEach((s) => {
        const rating = spot.current.sportsRatings[s];
        if (rating && rating.score >= 7.0) {
          counts[s] += 1;
        }
      });
    });

    return counts;
  }, [spots]);

  // Real API refresh function using Open-Meteo
  const handleRefreshLive = async () => {
    setIsRefreshing(true);
    try {
      const updated = await Promise.all(
        spots.map(async (spot) => {
          const liveConditions = await fetchLiveOceanWeatherData(
            spot.coordinates.lat,
            spot.coordinates.lng,
            spot.shoreOrientationDeg,
            spot.breakType
          );
          if (liveConditions) {
            return enrichSpotWithForecasts({
              ...spot,
              current: {
                ...spot.current,
                ...liveConditions,
              },
            });
          }
          return spot;
        })
      );
      setSpots(updated);
      setLastRefreshed(new Date());
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter and sort the spots
  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      // Scope filter: local coast vs worldwide spots
      if (filters.scope === 'local' && spot.isWorldSpot) return false;
      if (filters.scope === 'world' && !spot.isWorldSpot) return false;

      // Keyword search
      if (filters.query.trim()) {
        const q = filters.query.toLowerCase();
        const matchesName = spot.name.toLowerCase().includes(q);
        const matchesRegion = spot.region.toLowerCase().includes(q);
        const matchesCountry = (spot.country || '').toLowerCase().includes(q);
        const matchesSeabed = spot.seabed.toLowerCase().includes(q);
        if (!matchesName && !matchesRegion && !matchesCountry && !matchesSeabed) {
          return false;
        }
      }

      // Sport filter
      if (filters.sport !== 'all') {
        if (!spot.supportedSports.includes(filters.sport)) {
          // If sport is not even supported at this spot
          return false;
        }
        // Min Score filter for selected sport
        if (filters.minScore > 0) {
          const rating = spot.current.sportsRatings[filters.sport];
          if (!rating || rating.score < filters.minScore) {
            return false;
          }
        }
      } else if (filters.minScore > 0) {
        // Any sport has score >= minScore
        const maxScore = Math.max(
          ...Object.values(spot.current.sportsRatings).map((r) => (r as { score: number })?.score || 0)
        );
        if (maxScore < filters.minScore) return false;
      }

      // Skill level filter
      if (filters.skillLevel !== 'all' && spot.skillLevel !== filters.skillLevel) {
        return false;
      }

      // Wave height range
      if (spot.current.waveHeight < filters.minWaveHeight || spot.current.waveHeight > filters.maxWaveHeight) {
        return false;
      }

      // Wind condition filter
      if (filters.windCondition === 'offshore_only') {
        if (spot.current.windRelation !== 'offshore' && spot.current.windRelation !== 'cross_offshore') {
          return false;
        }
      } else if (filters.windCondition === 'light_wind') {
        if (spot.current.windSpeedKnots > 10) return false;
      } else if (filters.windCondition === 'strong_wind') {
        if (spot.current.windSpeedKnots < 15) return false;
      }

      // Break type
      if (filters.breakType !== 'all' && spot.breakType !== filters.breakType) {
        return false;
      }

      // Favorites only
      if (filters.onlyFavorites && !favorites.includes(spot.id)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const activeSport = filters.sport === 'all' ? 'surf' : filters.sport;
      if (filters.sortBy === 'suitability') {
        const scoreA = a.current.sportsRatings[activeSport]?.score || 0;
        const scoreB = b.current.sportsRatings[activeSport]?.score || 0;
        return scoreB - scoreA;
      }
      if (filters.sortBy === 'wave_height') {
        return b.current.waveHeight - a.current.waveHeight;
      }
      if (filters.sortBy === 'wind_speed') {
        return b.current.windSpeedKnots - a.current.windSpeedKnots;
      }
      if (filters.sortBy === 'distance') {
        return a.distanceKm - b.distanceKm;
      }
      return a.name.localeCompare(b.name);
    });
  }, [spots, filters, favorites]);

  // Featured spot for hero spotlight tracks activeSpotId
  const featuredSpot = spots.find((s) => s.id === activeSpotId) || spots[0];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 text-slate-900">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            {onBackToBooking && (
              <button
                type="button"
                onClick={onBackToBooking}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Booking</span>
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-heading text-slate-900 tracking-tight flex items-center gap-2">
                  <Waves className="w-6 h-6 text-teal-600" />
                  Live Ocean & Wave Forecast
                </h1>
                <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Live Buoys & Marine API
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Real-time Atlantic wave heights, period, wind direction, tides, and sport suitability across 14 coastal spots.
              </p>
            </div>
          </div>

          {/* Refresh and View Toggle */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Live Status & Refresh Button */}
            <button
              type="button"
              onClick={handleRefreshLive}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              title="Refresh live marine & weather conditions"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing ? 'Syncing Buoys...' : 'Refresh Live Data'}
              </span>
              <span className="text-[10px] text-slate-400 font-normal hidden lg:inline">
                ({lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            </button>

            {/* View Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table comparison view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Featured Spot Spotlight Hero */}
        {featuredSpot && (
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white shadow-xl border border-slate-800">
            <img 
              src={featuredSpot.image} 
              alt={featuredSpot.name}
              className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

            <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-500 text-white">
                    {featuredSpot.id === spots[0]?.id ? 'Hostel Home Break Spotlight' : 'Selected Spot Live Conditions'}
                  </span>
                  <span className="text-xs text-slate-300">
                    {featuredSpot.distanceKm} km from WaveHaven Hostel
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Offshore & Firing Right Now
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-white">
                    {featuredSpot.name}
                  </h2>

                  {/* Search field allowing admins and guests to search and select any region around the world */}
                  <div className="w-full sm:w-auto min-w-[240px] max-w-[340px]">
                    <WorldRegionSpotSearch
                      selectedSpot={featuredSpot}
                      allSpots={spots}
                      onSelectSpot={handleSelectSpot}
                      variant="dark"
                      compact={true}
                      placeholder="Search world region or break..."
                    />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {featuredSpot.current.sportsRatings.surf.headline}. {featuredSpot.current.sportsRatings.surf.recommendation}
                </p>

                {/* Spotlight metrics pills */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <Waves className="w-4 h-4 text-teal-400" />
                    <span className="font-black text-white">
                      {formatWaveHeight(featuredSpot.current.waveHeight, filters.unit)}
                    </span>
                    <span className="text-slate-300 text-[11px]">
                      {featuredSpot.current.wavePeriod}s {featuredSpot.current.swellCardinal}
                    </span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <Wind className="w-4 h-4 text-teal-400" />
                    <span className="font-black text-white">
                      {formatWindSpeed(featuredSpot.current.windSpeedKnots, filters.unit)}
                    </span>
                    <span className="text-emerald-300 text-[11px] capitalize font-bold">
                      {featuredSpot.current.windRelation.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-teal-400" />
                    <span className="text-slate-200 capitalize">
                      Tide: {featuredSpot.current.tideStatus} ({featuredSpot.current.currentTideHeight}m)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Side */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center w-full sm:w-auto">
                  <div className="text-[10px] uppercase font-bold text-teal-300">
                    Surfing Condition Score
                  </div>
                  <div className="text-3xl font-black text-white mt-0.5">
                    {featuredSpot.current.sportsRatings.surf.score} <span className="text-sm font-normal text-slate-300">/ 10</span>
                  </div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    {featuredSpot.current.sportsRatings.surf.verdict}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSelectSpot(featuredSpot)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Hourly & Tides</span>
                  </button>

                  {onBookForSpot && (
                    <button
                      type="button"
                      onClick={() => onBookForSpot(featuredSpot)}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>Book Stay</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Search & Filtering Component */}
        <AdvancedSpotSearch
          filters={filters}
          onFilterChange={setFilters}
          sportCounts={sportCounts}
          totalMatching={filteredSpots.length}
          onSelectWorldLocation={handleSelectWorldLocation}
          isAddingWorldSpot={isAddingWorldSpot}
        />

        {/* World Telemetry Load Toast */}
        {worldSpotToast && (
          <div className="p-3.5 bg-emerald-500 text-white rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between gap-3 text-xs font-bold animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 shrink-0 animate-spin" />
              <span>{worldSpotToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setWorldSpotToast(null)}
              className="p-1 text-white/80 hover:text-white rounded-lg"
            >
              ✕
            </button>
          </div>
        )}

        {/* Spots Results Section */}
        {filteredSpots.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Waves className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              No ocean spots match your current filter criteria
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try relaxing your wave height bracket, selecting another sport, or switching wind condition filters to see all available coastal breaks.
            </p>
            <button
              type="button"
              onClick={() => setFilters({
                query: '',
                sport: 'all',
                skillLevel: 'all',
                minWaveHeight: 0,
                maxWaveHeight: 10,
                windCondition: 'all',
                breakType: 'all',
                tide: 'all',
                minScore: 0,
                onlyFavorites: false,
                sortBy: 'suitability',
                unit: filters.unit,
              })}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSpots.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                selectedSport={filters.sport}
                unit={filters.unit}
                isFavorite={favorites.includes(spot.id)}
                onToggleFavorite={toggleFavorite}
                onSelectSpot={handleSelectSpot}
                onBookForSpot={onBookForSpot}
              />
            ))}
          </div>
        ) : (
          /* Table Comparison View */
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Spot & Location</th>
                    <th className="py-3.5 px-4">Wave Height & Period</th>
                    <th className="py-3.5 px-4">Wind & Orientation</th>
                    <th className="py-3.5 px-4">Tide State</th>
                    <th className="py-3.5 px-4">Break Type</th>
                    <th className="py-3.5 px-4 text-center">
                      {filters.sport === 'all' ? 'Surfing' : SPORT_CONFIG[filters.sport]?.label} Score
                    </th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSpots.map((spot) => {
                    const activeSport = filters.sport === 'all' ? 'surf' : filters.sport;
                    const rating = spot.current.sportsRatings[activeSport] || spot.current.sportsRatings.surf;
                    return (
                      <tr 
                        key={spot.id} 
                        className="hover:bg-teal-50/40 transition-colors cursor-pointer"
                        onClick={() => handleSelectSpot(spot)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(spot.id);
                              }}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Heart className={`w-3.5 h-3.5 ${favorites.includes(spot.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </button>
                            <div>
                              <div className="font-bold text-slate-900">{spot.name}</div>
                              <div className="text-[10px] text-slate-400">{spot.distanceKm} km • {spot.region}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-900">
                            {formatWaveHeight(spot.current.waveHeight, filters.unit)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {spot.current.wavePeriod}s • {spot.current.swellCardinal}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {formatWindSpeed(spot.current.windSpeedKnots, filters.unit)}
                          </div>
                          <span className="text-[10px] text-teal-700 capitalize font-medium">
                            {spot.current.windRelation.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 capitalize">
                            {spot.current.tideStatus}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {spot.current.currentTideHeight}m
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-slate-700 capitalize">
                            {spot.breakType.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${
                            rating.score >= 8.5 ? 'bg-emerald-100 text-emerald-800' :
                            rating.score >= 7.0 ? 'bg-teal-100 text-teal-800' :
                            rating.score >= 5.0 ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {rating.score} / 10 ({rating.verdict})
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSpot(spot);
                            }}
                            className="px-3 py-1 rounded-xl border border-slate-200 hover:border-teal-400 hover:text-teal-700 font-bold text-slate-600 transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Spot Detail Inspection Modal */}
      {selectedSpot && (
        <SpotDetailModal
          spot={selectedSpot}
          selectedSport={filters.sport === 'all' ? 'surf' : filters.sport}
          unit={filters.unit}
          isFavorite={favorites.includes(selectedSpot.id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setSelectedSpot(null)}
          onBookForSpot={onBookForSpot}
        />
      )}
    </div>
  );
};
