import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, SlidersHorizontal, X, Sparkles, Filter, 
  RotateCcw, Compass, Waves, Wind, Check, ChevronDown, ChevronUp,
  Heart, Globe, Loader2, MapPin, Plus, ExternalLink
} from 'lucide-react';
import { BreakType, OceanSport, SkillLevel, SpotSearchFilters, TideLevel, WorldGeocodeResult } from '../../types/weather';
import { SPORT_CONFIG } from '../../data/oceanSpotsData';
import { searchWorldOceanLocations } from '../../utils/oceanWeatherApi';

interface AdvancedSpotSearchProps {
  filters: SpotSearchFilters;
  onFilterChange: (next: SpotSearchFilters) => void;
  sportCounts: Record<OceanSport, number>;
  totalMatching: number;
  onSelectWorldLocation?: (result: WorldGeocodeResult) => Promise<void> | void;
  isAddingWorldSpot?: boolean;
}

const POPULAR_GLOBAL_SPOTS = [
  { name: 'Pipeline', region: 'Hawaii, USA', sport: 'surf', icon: '🏄‍♂️' },
  { name: 'Tarifa', region: 'Spain', sport: 'kitesurf', icon: '🪁' },
  { name: 'Uluwatu', region: 'Bali, Indonesia', sport: 'surf', icon: '🏄‍♂️' },
  { name: 'Jeffreys Bay', region: 'South Africa', sport: 'surf', icon: '🏄‍♂️' },
  { name: 'Hossegor', region: 'France', sport: 'bodyboard', icon: '🌊' },
  { name: 'Dahab', region: 'Egypt (Red Sea)', sport: 'windsurf', icon: '⛵' },
  { name: 'Bonaire', region: 'Caribbean', sport: 'diving', icon: '🤿' },
  { name: 'Teahupo\'o', region: 'Tahiti', sport: 'surf', icon: '🏄‍♂️' },
  { name: 'Siargao', region: 'Philippines', sport: 'surf', icon: '🏄‍♂️' },
  { name: 'Bells Beach', region: 'Australia', sport: 'surf', icon: '🏄‍♂️' },
  { name: 'Cape Town', region: 'South Africa', sport: 'kitesurf', icon: '🪁' },
  { name: 'Malibu', region: 'California, USA', sport: 'sup', icon: '🛶' },
];

export const AdvancedSpotSearch: React.FC<AdvancedSpotSearchProps> = ({
  filters,
  onFilterChange,
  sportCounts,
  totalMatching,
  onSelectWorldLocation,
  isAddingWorldSpot = false,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [worldSuggestions, setWorldSuggestions] = useState<WorldGeocodeResult[]>([]);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced live geocoding search using free Open-Meteo API
  useEffect(() => {
    const q = filters.query.trim();
    if (q.length < 2) {
      setWorldSuggestions([]);
      setIsSearchingGeocode(false);
      return;
    }

    setIsSearchingGeocode(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchWorldOceanLocations(q);
        setWorldSuggestions(results);
        setIsDropdownOpen(results.length > 0);
      } catch (err) {
        console.warn('Geocoding search error:', err);
      } finally {
        setIsSearchingGeocode(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (q: string) => {
    onFilterChange({ ...filters, query: q });
    if (!isDropdownOpen && q.trim().length >= 2) {
      setIsDropdownOpen(true);
    }
  };

  const handleSportSelect = (s: OceanSport | 'all') => {
    onFilterChange({ ...filters, sport: s });
  };

  const handleScopeSelect = (scope: 'all' | 'local' | 'world') => {
    onFilterChange({ ...filters, scope });
  };

  const resetFilters = () => {
    onFilterChange({
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
      scope: 'all',
      sortBy: 'suitability',
      unit: filters.unit,
    });
  };

  const hasActiveCustomFilters = 
    filters.query !== '' ||
    filters.sport !== 'all' ||
    filters.skillLevel !== 'all' ||
    filters.minWaveHeight > 0 ||
    filters.maxWaveHeight < 10 ||
    filters.windCondition !== 'all' ||
    filters.breakType !== 'all' ||
    filters.tide !== 'all' ||
    filters.minScore > 0 ||
    filters.scope !== 'all' ||
    filters.onlyFavorites;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Scope Selector: All Spots vs Local Coast vs World Iconic */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold">
          <button
            type="button"
            id="scope-all-spots-btn"
            onClick={() => handleScopeSelect('all')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              filters.scope === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>All Global & Local Spots</span>
          </button>

          <button
            type="button"
            id="scope-local-spots-btn"
            onClick={() => handleScopeSelect('local')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              filters.scope === 'local'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🇵🇹</span>
            <span>Local Coast (Portugal)</span>
          </button>

          <button
            type="button"
            id="scope-world-spots-btn"
            onClick={() => handleScopeSelect('world')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              filters.scope === 'world'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🌍</span>
            <span>Worldwide Iconic Spots</span>
          </button>
        </div>

        {/* Free API Telemetry Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Free Open-Meteo Global Marine & Weather API • No Key Required</span>
        </div>
      </div>

      {/* Search Input Bar & Quick Action Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative" ref={searchContainerRef}>
        {/* Instant Keyword & World Geocode Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="live-ocean-spot-search-input"
            value={filters.query}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={() => {
              if (filters.query.trim().length >= 2 || worldSuggestions.length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            placeholder="Search ANY beach or surf spot in the world (e.g. Pipeline, Tarifa, Uluwatu, Nazare, Dahab)..."
            className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden transition-colors shadow-2xs"
          />
          {isSearchingGeocode ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-teal-600">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : filters.query ? (
            <button
              type="button"
              onClick={() => handleTextChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* Instant World Autocomplete Dropdown */}
          {isDropdownOpen && worldSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 overflow-y-auto">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-600" />
                  <span>Live Worldwide Ocean Geocoding (Open-Meteo Free API)</span>
                </span>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Instant Telemetry
                </span>
              </div>

              <div className="p-1 divide-y divide-slate-100">
                {worldSuggestions.map((result) => {
                  const locationLabel = [result.admin1, result.country].filter(Boolean).join(', ');
                  return (
                    <div
                      key={`${result.id}-${result.latitude}-${result.longitude}`}
                      className="p-2.5 hover:bg-teal-50/70 rounded-xl transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onSelectWorldLocation) {
                          onSelectWorldLocation(result);
                        } else {
                          onFilterChange({ ...filters, query: result.name });
                        }
                      }}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900 flex items-center gap-1.5">
                            <span className="truncate">{result.name}</span>
                            {result.country_code && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 uppercase">
                                {result.country_code}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {locationLabel || 'Global Ocean Coordinates'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {result.latitude.toFixed(2)}°, {result.longitude.toFixed(2)}°
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isAddingWorldSpot}
                        className="shrink-0 px-3 py-1.5 rounded-xl bg-teal-600 group-hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-all"
                      >
                        {isAddingWorldSpot ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>{isAddingWorldSpot ? 'Syncing...' : 'View Live Waves'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Filter Drawer & Unit Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Advanced Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-2 transition-all ${
              isDrawerOpen || hasActiveCustomFilters
                ? 'bg-teal-50 border-teal-400 text-teal-800 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
            <span>Filters</span>
            {hasActiveCustomFilters && (
              <span className="w-2 h-2 rounded-full bg-teal-500" />
            )}
            {isDrawerOpen ? (
              <ChevronUp className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>

          {/* Unit Toggle (Metric / Imperial) */}
          <div className="bg-slate-100 p-0.5 rounded-2xl border border-slate-200 flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, unit: 'metric' })}
              className={`px-2.5 py-1.5 rounded-xl transition-colors ${
                filters.unit === 'metric' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              °C / m
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, unit: 'imperial' })}
              className={`px-2.5 py-1.5 rounded-xl transition-colors ${
                filters.unit === 'imperial' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              °F / ft
            </button>
          </div>

          {/* Favorites Only Toggle */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, onlyFavorites: !filters.onlyFavorites })}
            title={filters.onlyFavorites ? 'Show all spots' : 'Show bookmarked favorites only'}
            className={`p-2.5 rounded-2xl border transition-all ${
              filters.onlyFavorites 
                ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-2xs' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${filters.onlyFavorites ? 'fill-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Search Preset World Destinations Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <span className="text-slate-500 font-bold shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-600" />
          <span>Quick World Hotspots:</span>
        </span>
        {POPULAR_GLOBAL_SPOTS.map((pop) => (
          <button
            key={pop.name}
            type="button"
            onClick={() => {
              onFilterChange({ ...filters, query: pop.name, scope: 'all' });
            }}
            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200/80 font-medium shrink-0 transition-colors flex items-center gap-1"
          >
            <span>{pop.icon}</span>
            <span>{pop.name}</span>
            <span className="text-[10px] text-slate-400">({pop.region})</span>
          </button>
        ))}
      </div>

      {/* Sport Selector Chips with Active Count */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
          <span>Filter Ocean by Sport:</span>
          <span className="text-teal-700 font-semibold">{totalMatching} spots found</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            type="button"
            onClick={() => handleSportSelect('all')}
            className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              filters.sport === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span>🌊</span>
            <span>All Coastal Sports</span>
          </button>

          {(Object.keys(SPORT_CONFIG) as OceanSport[]).map((sportKey) => {
            const cfg = SPORT_CONFIG[sportKey];
            const isSelected = filters.sport === sportKey;
            const count = sportCounts[sportKey] || 0;

            return (
              <button
                key={sportKey}
                type="button"
                onClick={() => handleSportSelect(sportKey)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-800'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Advanced Filters Drawer */}
      {isDrawerOpen && (
        <div className="pt-4 border-t border-slate-200/90 space-y-4 text-xs animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filter 1: Skill Level */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Target Skill Level
              </label>
              <select
                value={filters.skillLevel}
                onChange={(e) => onFilterChange({ ...filters, skillLevel: e.target.value as SkillLevel | 'all' })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-teal-500"
              >
                <option value="all">All Skill Levels</option>
                <option value="beginner">Beginner / Learner Friendly</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced / Experienced</option>
                <option value="expert">Expert / Pro Only</option>
              </select>
            </div>

            {/* Filter 2: Wind Condition */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Wind Conditions
              </label>
              <select
                value={filters.windCondition}
                onChange={(e) => onFilterChange({ ...filters, windCondition: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-teal-500"
              >
                <option value="all">Any Wind Orientation</option>
                <option value="offshore_only">Offshore Only (Clean wave face)</option>
                <option value="light_wind">Light Wind (&lt; 10 knots)</option>
                <option value="strong_wind">Strong Wind (&gt; 15 knots for Kite/Windsurf)</option>
              </select>
            </div>

            {/* Filter 3: Break Type */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Break / Seabed Type
              </label>
              <select
                value={filters.breakType}
                onChange={(e) => onFilterChange({ ...filters, breakType: e.target.value as BreakType | 'all' })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-teal-500"
              >
                <option value="all">All Break Types</option>
                <option value="beach_break">Beach Break (Sand)</option>
                <option value="point_break">Point Break (Long peeling walls)</option>
                <option value="reef_break">Reef Break / Slab</option>
                <option value="river_mouth">River Mouth Delta</option>
                <option value="sheltered_bay">Sheltered Flatwater Bay</option>
              </select>
            </div>

            {/* Filter 4: Sort By */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Sort Results By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-teal-500"
              >
                <option value="suitability">Highest Sport Condition Rating</option>
                <option value="wave_height">Highest Wave / Swell Size</option>
                <option value="wind_speed">Highest Wind Speed</option>
                <option value="distance">Closest to WaveHaven Hostel</option>
                <option value="alphabetical">Alphabetical A–Z</option>
              </select>
            </div>
          </div>

          {/* Secondary Filter Row: Wave Bracket & Minimum Score */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Quick Wave Size Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Wave Size:</span>
              {[
                { label: 'All', min: 0, max: 10 },
                { label: '< 1.0m Small', min: 0, max: 1.0 },
                { label: '1.0 – 1.8m Ideal', min: 1.0, max: 1.8 },
                { label: '1.8 – 2.5m Heavy', min: 1.8, max: 2.5 },
                { label: '2.5m+ Giant', min: 2.5, max: 10 },
              ].map((bracket, i) => {
                const active = filters.minWaveHeight === bracket.min && filters.maxWaveHeight === bracket.max;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onFilterChange({ ...filters, minWaveHeight: bracket.min, maxWaveHeight: bracket.max })}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                      active
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {bracket.label}
                  </button>
                );
              })}
            </div>

            {/* Minimum Score Pill */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Min Rating:</span>
              {[
                { label: 'Any', val: 0 },
                { label: 'Good 7.0+', val: 7 },
                { label: 'Epic 8.5+', val: 8.5 },
              ].map((lvl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onFilterChange({ ...filters, minScore: lvl.val })}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                    filters.minScore === lvl.val
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>

            {/* Reset Button */}
            {hasActiveCustomFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 ml-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
