import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Globe, Loader2, X, Compass, Waves, Check } from 'lucide-react';
import { LiveOceanSpot, WorldGeocodeResult } from '../../types/weather';
import { INITIAL_OCEAN_SPOTS } from '../../data/oceanSpotsData';
import { INITIAL_WORLD_OCEAN_SPOTS } from '../../data/worldOceanSpotsData';
import { 
  searchWorldOceanLocations, 
  createLiveWorldSpotFromGeocode,
  enrichSpotWithForecasts 
} from '../../utils/oceanWeatherApi';

interface WorldRegionSpotSearchProps {
  selectedSpot?: LiveOceanSpot;
  onSelectSpot: (spot: LiveOceanSpot) => void;
  allSpots?: LiveOceanSpot[];
  placeholder?: string;
  variant?: 'dark' | 'light';
  compact?: boolean;
  className?: string;
}

const POPULAR_REGIONS = [
  { label: "Ericeira", country: "Portugal", flag: "🇵🇹", id: "spot-ribeira-dilhas" },
  { label: "Hossegor", country: "France", flag: "🇫🇷", id: "world-la-graviere" },
  { label: "Bali", country: "Indonesia", flag: "🇮🇩", id: "world-uluwatu-bali" },
  { label: "Oahu / Pipeline", country: "USA", flag: "🇺🇸", id: "world-pipeline-hawaii" },
  { label: "Gold Coast", country: "Australia", flag: "🇦🇺", id: "world-snapper-rocks" },
  { label: "Taghazout", country: "Morocco", flag: "🇲🇦", id: "world-anchor-point" },
  { label: "Jeffrey's Bay", country: "South Africa", flag: "🇿🇦", id: "world-jbay-supertubes" },
  { label: "Santa Teresa", country: "Costa Rica", flag: "🇨🇷", id: "world-santa-teresa" },
  { label: "Peniche", country: "Portugal", flag: "🇵🇹", id: "spot-supertubos" },
  { label: "Teahupo'o", country: "Tahiti", flag: "🇵🇫", id: "world-teahupoo-tahiti" },
];

export const WorldRegionSpotSearch: React.FC<WorldRegionSpotSearchProps> = ({
  selectedSpot,
  onSelectSpot,
  allSpots,
  placeholder = 'Search region or spot around the world...',
  variant = 'dark',
  compact = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [isGeneratingSpot, setIsGeneratingSpot] = useState(false);
  const [worldResults, setWorldResults] = useState<WorldGeocodeResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseSpots = allSpots && allSpots.length > 0 
    ? allSpots 
    : [...INITIAL_OCEAN_SPOTS, ...INITIAL_WORLD_OCEAN_SPOTS];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced worldwide geocoding search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setWorldResults([]);
      setIsSearchingGeocode(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGeocode(true);
      try {
        const results = await searchWorldOceanLocations(trimmed);
        setWorldResults(results);
      } catch (err) {
        console.warn('World geocoding search error:', err);
        setWorldResults([]);
      } finally {
        setIsSearchingGeocode(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Local & known world spots filtered by query
  const matchingLocalSpots = query.trim()
    ? baseSpots.filter((s) => {
        const q = query.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q) ||
          (s.country && s.country.toLowerCase().includes(q)) ||
          s.breakType.toLowerCase().includes(q)
        );
      })
    : baseSpots.slice(0, 8);

  const handleSelectLocalSpot = (spot: LiveOceanSpot) => {
    onSelectSpot(spot);
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectGeocodedResult = async (result: WorldGeocodeResult) => {
    setIsGeneratingSpot(true);
    try {
      const generated = await createLiveWorldSpotFromGeocode(result);
      const enriched = enrichSpotWithForecasts(generated);
      onSelectSpot(enriched);
      setQuery('');
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to create world spot:', err);
    } finally {
      setIsGeneratingSpot(false);
    }
  };

  const handleQuickRegionClick = (regionId: string, regionLabel: string) => {
    const found = baseSpots.find((s) => s.id === regionId);
    if (found) {
      onSelectSpot(found);
      setQuery('');
      setIsOpen(false);
    } else {
      // Trigger search for region label
      setQuery(regionLabel);
      setIsOpen(true);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const isDark = variant === 'dark';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Container */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all shadow-xs ${
          isDark
            ? 'bg-slate-900/90 border-teal-500/40 focus-within:border-teal-400 text-white focus-within:ring-2 focus-within:ring-teal-500/20'
            : 'bg-white border-slate-200 focus-within:border-teal-500 text-slate-900 focus-within:ring-2 focus-within:ring-teal-500/10'
        } ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <Search className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={
            selectedSpot && !query 
              ? `${selectedSpot.name} (${selectedSpot.region || selectedSpot.country})`
              : placeholder
          }
          className={`w-full bg-transparent font-semibold focus:outline-none placeholder:font-normal ${
            isDark ? 'placeholder:text-slate-400 text-white' : 'placeholder:text-slate-400 text-slate-900'
          }`}
          aria-label="Search region or spot around the world"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setWorldResults([]);
            }}
            className={`p-1 rounded-full transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : selectedSpot ? (
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
            isDark ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-teal-50 text-teal-700 border border-teal-200'
          }`}>
            Live Active
          </span>
        ) : null}

        {isSearchingGeocode || isGeneratingSpot ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400 shrink-0" />
        ) : null}
      </div>

      {/* Floating Dropdown Suggestion Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-md max-h-[420px] overflow-y-auto ${
            isDark
              ? 'bg-slate-950/95 border-teal-500/30 text-white divide-y divide-slate-800/80'
              : 'bg-white/98 border-slate-200 text-slate-900 divide-y divide-slate-100'
          }`}
          style={{ minWidth: '320px' }}
        >
          {/* Quick Popular World Regions */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'text-teal-400' : 'text-teal-700'
              }`}>
                Popular Worldwide Surf Regions
              </span>
              <span className="text-[10px] text-slate-400">Click to load live telemetry</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_REGIONS.map((region) => {
                const isSelected = selectedSpot?.name.toLowerCase().includes(region.label.toLowerCase());
                return (
                  <button
                    key={region.label}
                    type="button"
                    onClick={() => handleQuickRegionClick(region.id, region.label)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : isDark
                        ? 'bg-slate-800/90 text-slate-200 hover:bg-teal-900/40 hover:text-teal-200 border border-slate-700/60'
                        : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800 border border-slate-200/80'
                    }`}
                  >
                    <span>{region.flag}</span>
                    <span>{region.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Local and Catalog Spots */}
          {matchingLocalSpots.length > 0 && (
            <div className="p-2">
              <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {query.trim() ? 'Matching Spots & Breaks' : 'Featured Breaks & Spots'}
              </div>
              <div className="space-y-1 mt-1">
                {matchingLocalSpots.map((spot) => {
                  const isSelected = selectedSpot?.id === spot.id;
                  const surfRating = spot.current?.sportsRatings?.surf;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => handleSelectLocalSpot(spot)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                        isSelected
                          ? isDark ? 'bg-teal-950/80 text-teal-200 border border-teal-500/40' : 'bg-teal-50 text-teal-900 border border-teal-200'
                          : isDark ? 'hover:bg-slate-900/80 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-teal-600 text-white' : isDark ? 'bg-slate-800 text-teal-400' : 'bg-slate-100 text-teal-600'
                        }`}>
                          <Waves className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate flex items-center gap-1.5">
                            <span>{spot.name}</span>
                            {spot.country && (
                              <span className="text-[10px] font-normal text-slate-400">
                                • {spot.country}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {spot.region} • {spot.breakType.replace('_', ' ')} • {spot.distanceKm} km
                          </p>
                        </div>
                      </div>

                      {spot.current && (
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black">
                            {spot.current.waveHeight}m
                          </p>
                          {surfRating && (
                            <span className="text-[9px] font-bold text-emerald-400">
                              {surfRating.verdict} ({surfRating.score})
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Worldwide Geocoding Results (Open-Meteo) */}
          {query.trim().length >= 2 && (
            <div className="p-2">
              <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
                isDark ? 'text-teal-400' : 'text-teal-700'
              }`}>
                <span>Worldwide Cities & Coastal Regions</span>
                {isSearchingGeocode && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>

              {worldResults.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {worldResults.map((result) => (
                    <button
                      key={`${result.latitude}-${result.longitude}-${result.id}`}
                      type="button"
                      disabled={isGeneratingSpot}
                      onClick={() => handleSelectGeocodedResult(result)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                        isDark ? 'hover:bg-slate-900/90 text-slate-200' : 'hover:bg-teal-50/60 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-teal-950/60 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-700 border border-teal-100'
                        }`}>
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">
                            {result.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {[result.admin1, result.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                        isDark ? 'bg-teal-900/40 text-teal-300 border border-teal-500/30' : 'bg-teal-100 text-teal-800'
                      }`}>
                        Load Buoy Telemetry ⚡
                      </span>
                    </button>
                  ))}
                </div>
              ) : !isSearchingGeocode && (
                <div className="px-3 py-3 text-center text-xs text-slate-400">
                  <p>No worldwide coastal places found for "{query}".</p>
                  <p className="text-[10px] mt-0.5">Try searching a famous surf town, region, or city name.</p>
                </div>
              )}
            </div>
          )}

          {isGeneratingSpot && (
            <div className="p-4 text-center bg-teal-950/40 text-teal-200 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
              <span>Fetching real-time marine models and swell telemetry...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
