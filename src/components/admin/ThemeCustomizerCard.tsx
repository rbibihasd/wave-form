import React, { useState, useEffect } from 'react';
import { 
  Palette, Sliders, Check, Sparkles, RefreshCw, Eye, 
  Layers, Square, Circle, ShieldCheck, Waves, Calendar, Bed, 
  ArrowRight, Info, CheckCircle2, SlidersHorizontal
} from 'lucide-react';
import { ThemeConfig, ThemeCornerRadius, ThemeBorderWidth, ThemeShadowIntensity, HostelSettings } from '../../types';
import { THEME_PRESETS, DEFAULT_THEME_CONFIG, applyThemeStyles, getRadiusValues, getBorderValues } from '../../utils/theme';

interface ThemeCustomizerCardProps {
  settings: HostelSettings;
  onChange: (updatedTheme: ThemeConfig) => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export const ThemeCustomizerCard: React.FC<ThemeCustomizerCardProps> = ({
  settings,
  onChange,
  onSave,
  showSaveButton = false,
}) => {
  const currentTheme: ThemeConfig = settings.themeConfig || DEFAULT_THEME_CONFIG;

  const [localConfig, setLocalConfig] = useState<ThemeConfig>({ ...currentTheme });
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [previewInteraction, setPreviewInteraction] = useState<'hover' | 'active' | 'normal'>('normal');

  // Keep localConfig synced if settings change externally
  useEffect(() => {
    if (settings.themeConfig) {
      setLocalConfig({ ...settings.themeConfig });
    }
  }, [settings.themeConfig]);

  // Apply real-time preview changes to DOM so user sees effects live across the whole application
  const updateConfig = (newConfig: ThemeConfig) => {
    setLocalConfig(newConfig);
    onChange(newConfig);
    applyThemeStyles(newConfig, settings.primaryBrandColor);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const updated: ThemeConfig = {
        ...preset.config,
        presetId: preset.id,
      };
      updateConfig(updated);
    }
  };

  const handleCornerRadiusChange = (radius: ThemeCornerRadius) => {
    const pixelMap: Record<ThemeCornerRadius, number> = {
      sharp: 0,
      subtle: 8,
      rounded: 16,
      playful: 24,
      pill: 32,
    };
    const updated: ThemeConfig = {
      ...localConfig,
      cornerRadius: radius,
      customRadiusPx: pixelMap[radius],
      presetId: undefined, // custom modification
    };
    updateConfig(updated);
  };

  const handleCustomRadiusSlider = (px: number) => {
    let matchedRadius: ThemeCornerRadius = 'rounded';
    if (px === 0) matchedRadius = 'sharp';
    else if (px <= 10) matchedRadius = 'subtle';
    else if (px <= 18) matchedRadius = 'rounded';
    else if (px <= 26) matchedRadius = 'playful';
    else matchedRadius = 'pill';

    const updated: ThemeConfig = {
      ...localConfig,
      cornerRadius: matchedRadius,
      customRadiusPx: px,
      presetId: undefined,
    };
    updateConfig(updated);
  };

  const handleBorderWidthChange = (width: ThemeBorderWidth) => {
    const pixelMap: Record<ThemeBorderWidth, number> = {
      none: 0,
      thin: 1,
      medium: 2,
      bold: 3,
    };
    const updated: ThemeConfig = {
      ...localConfig,
      borderWidth: width,
      customBorderPx: pixelMap[width],
      presetId: undefined,
    };
    updateConfig(updated);
  };

  const handleCustomBorderSlider = (px: number) => {
    let matchedBorder: ThemeBorderWidth = 'thin';
    if (px === 0) matchedBorder = 'none';
    else if (px === 1) matchedBorder = 'thin';
    else if (px === 2) matchedBorder = 'medium';
    else matchedBorder = 'bold';

    const updated: ThemeConfig = {
      ...localConfig,
      borderWidth: matchedBorder,
      customBorderPx: px,
      presetId: undefined,
    };
    updateConfig(updated);
  };

  const handleShadowIntensityChange = (shadow: ThemeShadowIntensity) => {
    const updated: ThemeConfig = {
      ...localConfig,
      shadowIntensity: shadow,
      presetId: undefined,
    };
    updateConfig(updated);
  };

  const handleResetToDefaults = () => {
    updateConfig(DEFAULT_THEME_CONFIG);
  };

  const radii = getRadiusValues(localConfig.cornerRadius, localConfig.customRadiusPx);
  const borders = getBorderValues(localConfig.borderWidth, localConfig.customBorderPx);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-7">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
            <Sliders className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-lg text-slate-900 tracking-tight">
                Brand UI & Theme Geometry
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Live App-Wide
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Customize corner radii, border widths, and shadow intensities to match the unique vibe of your surf camp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Reset to default theme values"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          {showSaveButton && onSave && (
            <button
              type="button"
              onClick={onSave}
              className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              Apply Theme
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector Tabs: Presets vs Granular Controls */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Curated Surf Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
            <span>Fine-Tuned Geometry</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>Radius: {localConfig.customRadiusPx ?? 16}px</span>
          <span>•</span>
          <span>Border: {localConfig.customBorderPx ?? 1}px</span>
          <span>•</span>
          <span>Shadow: {localConfig.shadowIntensity}</span>
        </div>
      </div>

      {/* TAB 1: Curated Surf House Presets */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Curated Brand Identity Style
            </span>
            <span className="text-[11px] text-slate-500">
              One-click architectural presets designed for surf hostels
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {THEME_PRESETS.map((preset) => {
              const isSelected = localConfig.presetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-teal-50/40 border-teal-600 ring-2 ring-teal-600/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {preset.previewTag}
                      </span>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-slate-400" />
                      )}
                    </div>

                    <h4 className="font-heading font-extrabold text-sm text-slate-900">
                      {preset.name}
                    </h4>
                    <p className="text-[11px] font-semibold text-teal-700 mt-0.5">
                      {preset.subtitle}
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>

                  {/* Visual Geometry Micro-Specimen */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <span className="font-bold text-slate-700">{preset.config.cornerRadius}</span>
                      <span>/</span>
                      <span>{preset.config.borderWidth} border</span>
                    </div>

                    {/* Miniature geometric box showing actual preset styling */}
                    <div 
                      className="w-12 h-6 bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center"
                      style={{
                        borderRadius: preset.config.cornerRadius === 'sharp' ? '0px' : preset.config.cornerRadius === 'subtle' ? '4px' : preset.config.cornerRadius === 'pill' ? '12px' : '8px',
                        borderWidth: preset.config.borderWidth === 'none' ? '0px' : preset.config.borderWidth === 'bold' ? '2px' : '1px',
                        borderColor: '#14b8a6',
                      }}
                    >
                      Card
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Fine-Tuned Geometry Controls */}
      {activeTab === 'custom' && (
        <div className="space-y-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/70">
          {/* 1. Corner Radius Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <Square className="w-4 h-4 text-teal-600" />
                  <span>Corner Radii (App Containers & Cards)</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Controls the curvature of room cards, modals, booking inputs, and interactive surfaces.
                </p>
              </div>
              <div className="font-mono text-xs font-bold text-teal-700 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 self-start sm:self-auto">
                {localConfig.customRadiusPx ?? 16}px Base
              </div>
            </div>

            {/* Quick Radio Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'sharp', label: 'Sharp (0px)', hint: 'Brutalist Camp' },
                { id: 'subtle', label: 'Subtle (8px)', hint: 'Architectural' },
                { id: 'rounded', label: 'Rounded (16px)', hint: 'Standard Friendly' },
                { id: 'playful', label: 'Playful (24px)', hint: 'Bohemian Curve' },
                { id: 'pill', label: 'Pill (32px)', hint: 'Ultra Soft' },
              ].map((opt) => {
                const isSelected = localConfig.cornerRadius === opt.id && (
                  opt.id === 'sharp' ? (localConfig.customRadiusPx === 0) : true
                );
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleCornerRadiusChange(opt.id as ThemeCornerRadius)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{opt.label}</div>
                    <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>
                      {opt.hint}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Slider for exact pixel value */}
            <div className="pt-2 flex items-center gap-4">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">0px</span>
              <input
                type="range"
                min={0}
                max={36}
                step={2}
                value={localConfig.customRadiusPx ?? 16}
                onChange={(e) => handleCustomRadiusSlider(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <span className="text-[11px] font-bold text-slate-500 shrink-0">36px</span>
            </div>
          </div>

          {/* 2. Border Width Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Border Framing & Thickness</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Adjust stroke weight for cards, table dividers, button borders, and input outlines.
                </p>
              </div>
              <div className="font-mono text-xs font-bold text-teal-700 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 self-start sm:self-auto">
                {localConfig.customBorderPx ?? 1}px Stroke
              </div>
            </div>

            {/* Quick Radio Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'none', label: 'None (0px)', hint: 'Borderless Float' },
                { id: 'thin', label: 'Thin (1px)', hint: 'Refined Standard' },
                { id: 'medium', label: 'Medium (2px)', hint: 'Defined Frame' },
                { id: 'bold', label: 'Bold (3px)', hint: 'Punchy Structural' },
              ].map((opt) => {
                const isSelected = localConfig.borderWidth === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleBorderWidthChange(opt.id as ThemeBorderWidth)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>
                      {opt.hint}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Slider for exact border px */}
            <div className="pt-2 flex items-center gap-4">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">0px</span>
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={localConfig.customBorderPx ?? 1}
                onChange={(e) => handleCustomBorderSlider(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <span className="text-[11px] font-bold text-slate-500 shrink-0">4px</span>
            </div>
          </div>

          {/* 3. Shadow Intensity Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <Circle className="w-4 h-4 text-teal-600" />
                  <span>Shadow Depth & Intensity</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Sets ambient drop-shadow elevation for cards, dropdowns, and sticky headers.
                </p>
              </div>
              <div className="font-mono text-xs font-bold text-teal-700 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 self-start sm:self-auto capitalize">
                {localConfig.shadowIntensity}
              </div>
            </div>

            {/* Quick Radio Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'none', label: 'Flat (0%)', hint: 'Zero Shadow / 2D' },
                { id: 'subtle', label: 'Subtle', hint: 'Airy Ambient' },
                { id: 'medium', label: 'Medium', hint: 'Balanced Natural' },
                { id: 'elevated', label: 'Elevated', hint: 'Floating Depth' },
                { id: 'dramatic', label: 'Dramatic', hint: 'Deep Sunlight' },
              ].map((opt) => {
                const isSelected = localConfig.shadowIntensity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleShadowIntensityChange(opt.id as ThemeShadowIntensity)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>
                      {opt.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIVE SPECIMEN SANDBOX: See changes immediately on real hostel UI components */}
      <div className="pt-2 border-t border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-teal-600" />
            <h4 className="font-heading font-extrabold text-xs sm:text-sm text-slate-900">
              Interactive Component Sandbox
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Live Specimen
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="hidden sm:inline">Preview state:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setPreviewInteraction('normal')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  previewInteraction === 'normal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPreviewInteraction('hover')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  previewInteraction === 'hover' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Hover
              </button>
            </div>
          </div>
        </div>

        {/* Specimen Playground Area */}
        <div className="p-4 sm:p-6 bg-slate-100/70 rounded-2xl border border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Specimen 1: Room Booking Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="relative h-28 rounded-2xl overflow-hidden bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80"
                alt="Ocean View Dorm"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-600 text-white shadow-xs">
                  Most Popular
                </span>
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold">
                €34 <span className="text-[9px] font-normal text-slate-300">/ night</span>
              </div>
            </div>

            <div>
              <h5 className="font-heading font-extrabold text-sm text-slate-900">
                Oceanview Bunk Pod
              </h5>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                Privacy curtain, personal power socket & reading light.
              </p>
            </div>

            <button
              type="button"
              className={`w-full py-2 px-3 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                previewInteraction === 'hover' ? 'bg-teal-700 shadow-md translate-y-[-1px]' : ''
              }`}
            >
              <span>Book This Bed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Specimen 2: Input & Form Controls */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Booking Form Specimen</span>
                <span className="text-[10px] font-mono text-slate-400">Step 1 of 4</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Kai Sterling"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50/50 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Stay Urgency Badge
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Deposit Due (24h)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Confirmed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs"
              >
                Proceed
              </button>
            </div>
          </div>

          {/* Specimen 3: Admin KPI Metric Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Monthly Occupancy
                </span>
                <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Bed className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="text-2xl font-heading font-black text-slate-900">
                84.2%
              </div>
              <p className="text-[11px] font-semibold text-teal-600 mt-1 flex items-center gap-1">
                <span>+12.4% vs last month</span>
              </p>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Target: 75%</span>
                <span>Peak: 96%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full" 
                  style={{ width: '84.2%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
