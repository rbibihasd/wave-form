import React from 'react';
import { X, Sliders, Check, Sparkles, RefreshCw } from 'lucide-react';
import { HostelSettings, ThemeConfig } from '../../types';
import { ThemeCustomizerCard } from './ThemeCustomizerCard';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: HostelSettings;
  onSaveSettings: (settings: HostelSettings) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const handleThemeChange = (updatedTheme: ThemeConfig) => {
    onSaveSettings({
      ...settings,
      themeConfig: updatedTheme,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-white">
                Surf House Theme & Geometry Customizer
              </h3>
              <p className="text-xs text-slate-400">
                Live app-wide corner radii, border widths & shadow intensities
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close theme customizer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <ThemeCustomizerCard
            settings={settings}
            onChange={handleThemeChange}
            onSave={onClose}
            showSaveButton={false}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Changes apply in real-time across both Guest Booking and Admin views.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all"
          >
            Done & Keep Theme
          </button>
        </div>
      </div>
    </div>
  );
};
