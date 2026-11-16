import React, { useState, useEffect } from 'react';
import { 
  Globe, MapPin, CheckCircle2, Waves, ArrowRight, 
  Sparkles, Sliders, RefreshCw, Compass, Building2 
} from 'lucide-react';
import { HostelSettings } from '../../types';
import { LiveOceanSpot } from '../../types/weather';
import { 
  WORLD_COUNTRIES_AND_CITIES, 
  findCountryConfig, 
  findCityConfig, 
  FormCountryConfig, 
  FormCityConfig 
} from '../../data/countryCityData';
import { INITIAL_OCEAN_SPOTS } from '../../data/oceanSpotsData';
import { INITIAL_WORLD_OCEAN_SPOTS } from '../../data/worldOceanSpotsData';
import { enrichSpotWithForecasts } from '../../utils/oceanWeatherApi';

interface AdminFormCountryCityCardProps {
  settings: HostelSettings;
  onSaveSettings: (settings: HostelSettings) => void;
  onSelectOceanSpot?: (spot: LiveOceanSpot) => void;
  className?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const AdminFormCountryCityCard: React.FC<AdminFormCountryCityCardProps> = ({
  settings,
  onSaveSettings,
  onSelectOceanSpot,
  className = '',
  isModal = false,
  onClose,
}) => {
  const [selectedCountryName, setSelectedCountryName] = useState(settings.country || 'Portugal');
  const [selectedCityName, setSelectedCityName] = useState(settings.city || 'Ericeira');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCityInput, setCustomCityInput] = useState('');
  const [customRegionInput, setCustomRegionInput] = useState('');
  
  // Toggles for auto-filling associated metadata
  const [syncAddress, setSyncAddress] = useState(true);
  const [syncCurrencyAndTimezone, setSyncCurrencyAndTimezone] = useState(true);
  const [syncOceanSpot, setSyncOceanSpot] = useState(true);

  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Current country config
  const countryConfig = findCountryConfig(selectedCountryName) || WORLD_COUNTRIES_AND_CITIES[0];
  const currentCityConfig = countryConfig.cities.find((c) => c.name === selectedCityName) || countryConfig.cities[0];

  // Whenever country changes, reset city to the first city of that country unless already matching
  const handleCountryChange = (newCountryName: string) => {
    setSelectedCountryName(newCountryName);
    setIsCustomCity(false);
    const newCountryConfig = findCountryConfig(newCountryName);
    if (newCountryConfig && newCountryConfig.cities.length > 0) {
      setSelectedCityName(newCountryConfig.cities[0].name);
    } else {
      setSelectedCityName('Custom');
      setIsCustomCity(true);
    }
  };

  const handleCityChange = (newCityName: string) => {
    if (newCityName === '__custom__') {
      setIsCustomCity(true);
      setCustomCityInput('');
    } else {
      setIsCustomCity(false);
      setSelectedCityName(newCityName);
    }
  };

  const handleApplyLocation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const finalCity = isCustomCity ? (customCityInput.trim() || 'Coastal Center') : selectedCityName;
    const finalRegion = isCustomCity 
      ? (customRegionInput.trim() || `${selectedCountryName} Coast`)
      : (currentCityConfig?.region || selectedCountryName);

    const updatedSettings: HostelSettings = {
      ...settings,
      country: selectedCountryName,
      city: finalCity,
      location: `${finalCity}, ${selectedCountryName}`,
    };

    // Auto-update address if checked
    if (syncAddress && currentCityConfig?.defaultAddress && !isCustomCity) {
      updatedSettings.address = currentCityConfig.defaultAddress;
      updatedSettings.googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${finalCity}, ${selectedCountryName}`)}`;
    }

    // Auto-sync currency & timezone if checked
    if (syncCurrencyAndTimezone && countryConfig) {
      updatedSettings.currency = countryConfig.defaultCurrency;
      updatedSettings.currencySymbol = countryConfig.currencySymbol;
      updatedSettings.timezone = countryConfig.defaultTimezone;
    }

    // Save to settings
    onSaveSettings(updatedSettings);

    // Sync ocean spot
    if (syncOceanSpot && onSelectOceanSpot) {
      const allAvailableSpots = [...INITIAL_OCEAN_SPOTS, ...INITIAL_WORLD_OCEAN_SPOTS];
      // Look for a spot that matches spot name or city name
      const targetSpotName = currentCityConfig?.defaultSpotName?.toLowerCase() || '';
      const matched = allAvailableSpots.find((s) => {
        const spotLower = s.name.toLowerCase();
        const regLower = s.region.toLowerCase();
        return (
          (targetSpotName && spotLower.includes(targetSpotName)) ||
          spotLower.includes(finalCity.toLowerCase()) ||
          regLower.includes(finalCity.toLowerCase())
        );
      });

      if (matched) {
        onSelectOceanSpot(matched);
      } else {
        // Fallback to first spot enriched with city coords
        const fallback = allAvailableSpots[0];
        onSelectOceanSpot(fallback);
      }
    }

    setSavedSuccessMessage(`Booking form country updated to ${selectedCountryName} and city to ${finalCity}!`);
    setTimeout(() => {
      setSavedSuccessMessage(null);
      if (onClose) onClose();
    }, 2400);
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100">
              <Globe className="w-5 h-5 text-teal-600" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Booking Form Country & City Location
              </h3>
              <p className="text-xs text-slate-500">
                Change the hostel country and select any city worldwide to update the booking form and ocean weather.
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Location Pill */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs shrink-0">
          <span className="text-base">{countryConfig?.flag || '🌐'}</span>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Active Location</span>
            <span className="font-bold text-slate-800">
              {settings.city || 'Ericeira'}, {settings.country || 'Portugal'}
            </span>
          </div>
        </div>
      </div>

      {savedSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccessMessage}</span>
        </div>
      )}

      {/* Main Selection Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Country Selector */}
        <div className="space-y-1.5">
          <label htmlFor="admin-country-select" className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>Select Form Country</span>
          </label>
          <div className="relative">
            <select
              id="admin-country-select"
              value={selectedCountryName}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-teal-500 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none transition-colors cursor-pointer appearance-none"
            >
              {WORLD_COUNTRIES_AND_CITIES.map((c) => (
                <option key={c.code} value={c.country}>
                  {c.flag} {c.country} ({c.cities.length} coastal cities)
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Admins can switch the country anytime. This populates city options for that destination.
          </p>
        </div>

        {/* City Selector */}
        <div className="space-y-1.5">
          <label htmlFor="admin-city-select" className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>Select City / Coastal Region</span>
          </label>
          <div className="relative">
            <select
              id="admin-city-select"
              value={isCustomCity ? '__custom__' : selectedCityName}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-teal-500 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none transition-colors cursor-pointer appearance-none"
            >
              {countryConfig.cities.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name} ({city.region}) • Break: {city.defaultSpotName}
                </option>
              ))}
              <option value="__custom__">✏️ Enter custom city / town...</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Select the city for your hostel or choose custom to enter any location.
          </p>
        </div>
      </div>

      {/* Custom City & Region Inputs if __custom__ selected */}
      {isCustomCity && (
        <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Custom City / Town Name</label>
            <input
              type="text"
              placeholder="e.g. Nazaré or Biarritz"
              value={customCityInput}
              onChange={(e) => setCustomCityInput(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">State / Province / Region</label>
            <input
              type="text"
              placeholder="e.g. Atlantic Coast"
              value={customRegionInput}
              onChange={(e) => setCustomRegionInput(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
            />
          </div>
        </div>
      )}

      {/* Selected City Preview & Linked Ocean Telemetry */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Target Location Preview</span>
          </span>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-lg">
            Ready to apply to guest booking form
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Form Destination</span>
            <span className="font-black text-slate-900 text-sm">
              {isCustomCity ? (customCityInput || 'Custom City') : selectedCityName}, {selectedCountryName}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Linked Ocean Break</span>
            <span className="font-bold text-teal-700 text-xs flex items-center gap-1 mt-0.5">
              <Waves className="w-3.5 h-3.5 shrink-0" />
              <span>{currentCityConfig?.defaultSpotName || 'Local Coastal Buoy'}</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Timezone & Currency</span>
            <span className="font-bold text-slate-700 text-xs">
              {countryConfig.defaultTimezone} • {countryConfig.currencySymbol} ({countryConfig.defaultCurrency})
            </span>
          </div>
        </div>

        {/* Sync Checkbox Options */}
        <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={syncAddress}
              onChange={(e) => setSyncAddress(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span>Auto-update street address to {selectedCityName}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={syncCurrencyAndTimezone}
              onChange={(e) => setSyncCurrencyAndTimezone(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span>Auto-sync Timezone & Currency</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={syncOceanSpot}
              onChange={(e) => setSyncOceanSpot(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span>Set primary Live Ocean Conditions spot</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-[11px] text-slate-400">
          Clicking save immediately updates the guest booking wizard, email templates, and ocean conditions ticker.
        </p>

        <div className="flex items-center gap-2 ml-auto">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            id="admin-apply-country-city-btn"
            onClick={handleApplyLocation}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Country & City to Booking Form</span>
          </button>
        </div>
      </div>
    </div>
  );
};
