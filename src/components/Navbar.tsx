import React, { useState, useRef, useEffect } from 'react';
import { 
  Waves, CalendarCheck, Shield, MessageCircle, Sparkles, 
  QrCode, Globe, ChevronDown, Check, Lock,
  Menu, X, RefreshCw, Bot, Plus
} from 'lucide-react';
import { HostelSettings, StaffUser } from '../types';
import { createWhatsAppUrl } from '../utils/whatsapp';
import { 
  useLanguage, 
  AI_TRANSLATION_PROVIDERS, 
  AI_GLOBAL_LANGUAGE_PRESETS,
  AIProviderType 
} from '../context/LanguageContext';
import { AdminProfileMenu } from './admin/AdminProfileMenu';

interface NavbarProps {
  currentView: 'booking' | 'admin' | 'admin-login';
  adminTab?: string;
  onViewChange: (view: 'booking' | 'admin' | 'admin-login', adminTab?: string) => void;
  settings: HostelSettings;
  upcomingCount: number;
  onOpenLookup?: () => void;
  currentStaff?: StaffUser;
  isAdminAuthenticated?: boolean;
  onLogout?: () => void;
  staffUsers?: StaffUser[];
  onSwitchStaff?: (user: StaffUser) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  adminTab,
  onViewChange,
  settings,
  upcomingCount,
  onOpenLookup,
  currentStaff,
  isAdminAuthenticated = false,
  onLogout,
  staffUsers = [],
  onSwitchStaff,
}) => {
  const { 
    language, 
    setLanguage, 
    t, 
    languages: languagesList,
    aiProvider,
    setAiProvider,
    autoTranslateOnSwitch,
    setAutoTranslateOnSwitch,
    isTranslating,
    translationStatus,
    lastTranslatedBy,
    switchLanguageByAI,
  } = useLanguage();

  const [logoError, setLogoError] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [customAiLangInput, setCustomAiLangInput] = useState('');
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const brandColor = settings.primaryBrandColor || '#0d9488';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLangDropdownOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView, adminTab]);

  const directChatUrl = createWhatsAppUrl(
    settings.phone,
    `Aloha! I have a question about staying at ${settings.name}. 🏄`
  );

  // Merge configured languages and global AI presets without duplicates
  const availablePresets = AI_GLOBAL_LANGUAGE_PRESETS.filter(
    preset => !languagesList.some(l => l.code === preset.code)
  );

  const activeProviderInfo = AI_TRANSLATION_PROVIDERS.find(p => p.id === aiProvider) || AI_TRANSLATION_PROVIDERS[0];

  const handleLanguageSelect = async (
    code: string,
    meta?: { name?: string; nativeName?: string; flag?: string; isRTL?: boolean },
    forceAI = false
  ) => {
    if (autoTranslateOnSwitch || forceAI || !languagesList.some(l => l.code === code)) {
      await switchLanguageByAI(code, {
        ...meta,
        provider: aiProvider,
        forceRetranslate: forceAI,
      });
    } else {
      setLanguage(code);
    }
    setIsLangDropdownOpen(false);
  };

  const handleCustomLanguageTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customAiLangInput.trim();
    if (!trimmed) return;
    // Derive a 2-4 letter code from input name
    const cleanCode = trimmed.toLowerCase().replace(/[^a-z]/g, '').slice(0, 3) || 'custom';
    setCustomAiLangInput('');
    await switchLanguageByAI(cleanCode, {
      name: trimmed,
      nativeName: trimmed,
      flag: '🌐',
      provider: aiProvider,
      forceRetranslate: true,
    });
    setIsLangDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Dynamic Brand Color Accent Top Line */}
      <div 
        className="h-0.5 w-full transition-colors duration-300"
        style={{ backgroundColor: brandColor }}
      />

      {/* Live AI Translation Progress Banner */}
      {(isTranslating || translationStatus) && (
        <div className="bg-slate-900 text-white px-4 py-1.5 text-[11px] font-bold flex items-center justify-center gap-2 border-b border-slate-800 animate-in fade-in">
          {isTranslating ? (
            <RefreshCw className="w-3.5 h-3.5 text-teal-400 animate-spin shrink-0" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span>{translationStatus || 'AI Translating interface...'}</span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-teal-300 text-[10px] uppercase tracking-wider">
            {activeProviderInfo.shortName} AI
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Logo & Hostel Brand */}
        <div 
          onClick={() => onViewChange('booking')}
          className="flex items-center gap-2 sm:gap-2.5 md:gap-3 cursor-pointer group select-none min-w-0 shrink"
        >
          {settings.logoUrl && !logoError ? (
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-1 group-hover:scale-105 transition-transform duration-200 overflow-hidden shrink-0"
              style={{
                boxShadow: `0 2px 8px -2px ${brandColor}30`,
              }}
            >
              <img 
                src={settings.logoUrl} 
                alt={settings.name} 
                onError={() => setLogoError(true)}
                className="w-full h-full object-contain" 
              />
            </div>
          ) : (
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-all duration-200 shrink-0"
              style={{ 
                backgroundColor: brandColor,
                boxShadow: `0 4px 12px -2px ${brandColor}50`
              }}
            >
              <Waves className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-heading font-bold text-sm xs:text-base sm:text-lg md:text-xl tracking-tight text-slate-900 truncate max-w-[120px] xs:max-w-[170px] sm:max-w-none">
                {settings.name.split(' ')[0]}
                <span 
                  className="font-extrabold ml-1 transition-colors duration-300"
                  style={{ color: brandColor }}
                >
                  {settings.name.split(' ').slice(1).join(' ') || 'Surf House'}
                </span>
              </span>
              <span 
                className="hidden xl:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all duration-300 shrink-0"
                style={{
                  backgroundColor: `${brandColor}15`,
                  color: brandColor,
                  borderColor: `${brandColor}35`,
                }}
              >
                <Sparkles className="w-3 h-3" style={{ color: brandColor }} />
                {settings.city ? `${settings.city} Lodge` : 'Ericeira Camp'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden lg:block truncate">
              {settings.tagline} • {settings.city || settings.location.split(',')[0]}, {settings.country || 'Portugal'}
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 shrink-0">
          {/* AI-Powered Language Switcher Dropdown */}
          <div 
            id="nav-language-selector"
            ref={langDropdownRef}
            className="relative"
          >
            <button
              type="button"
              id="nav-language-dropdown-btn"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="bg-slate-100 hover:bg-slate-200/70 px-2 sm:px-2.5 py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 border border-slate-200/80 transition-all text-xs font-semibold text-slate-800 shadow-2xs min-h-[38px] sm:min-h-[40px] touch-manipulation"
              title="Switch Language Automatically by AI (Gemini, OpenRouter, ChatGPT)"
              aria-haspopup="listbox"
              aria-expanded={isLangDropdownOpen}
            >
              {isTranslating ? (
                <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin shrink-0" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              )}
              <span className="text-sm leading-none">{languagesList.find(l => l.code === language)?.flag || '🌐'}</span>
              <span className="uppercase text-[11px] font-bold hidden sm:inline">{language}</span>
              <span className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-teal-600 text-white text-[9px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" />
                {activeProviderInfo.shortName}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180 text-teal-600' : ''}`} />
            </button>

            {isLangDropdownOpen && (
              <div
                id="nav-language-dropdown-list"
                className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                {/* AI Translation Provider Bar (Gemini / OpenRouter / ChatGPT) */}
                <div className="p-3 bg-slate-900 text-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-extrabold tracking-tight">AI Auto-Translator</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-teal-300">
                      <input
                        type="checkbox"
                        checked={autoTranslateOnSwitch}
                        onChange={(e) => setAutoTranslateOnSwitch(e.target.checked)}
                        className="rounded text-teal-500 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span>Auto-Translate</span>
                    </label>
                  </div>

                  {/* Provider Pills: Gemini, OpenRouter, ChatGPT */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl">
                    {AI_TRANSLATION_PROVIDERS.map((prov) => {
                      const isCurrentProv = aiProvider === prov.id;
                      return (
                        <button
                          key={prov.id}
                          type="button"
                          id={`nav-ai-provider-${prov.id}`}
                          onClick={() => setAiProvider(prov.id as AIProviderType)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isCurrentProv
                              ? 'bg-teal-500 text-slate-950 shadow-xs font-extrabold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                          }`}
                        >
                          <span>{prov.shortName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Any-Language Quick AI Translate Input */}
                  <form onSubmit={handleCustomLanguageTranslate} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customAiLangInput}
                      onChange={(e) => setCustomAiLangInput(e.target.value)}
                      placeholder="Translate to any language (e.g. Italian, Japanese)..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-slate-400 focus:outline-hidden focus:border-teal-400"
                    />
                    <button
                      type="submit"
                      disabled={!customAiLangInput.trim() || isTranslating}
                      className="px-2.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Go</span>
                    </button>
                  </form>
                </div>

                {/* Active & Configured Languages */}
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Available Languages ({languagesList.length})</span>
                    {language !== 'en' && (
                      <button
                        type="button"
                        onClick={() => handleLanguageSelect(language, undefined, true)}
                        className="text-teal-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        title={`Re-translate ${language.toUpperCase()} using ${activeProviderInfo.shortName}`}
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>AI Refresh</span>
                      </button>
                    )}
                  </div>

                  {languagesList.map((item) => {
                    const isSelected = language === item.code;
                    const aiMeta = lastTranslatedBy[item.code];
                    return (
                      <div key={item.code} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors">
                        <button
                          type="button"
                          id={`nav-lang-btn-${item.code}`}
                          onClick={() => handleLanguageSelect(item.code)}
                          className="flex-1 text-left flex items-center gap-2.5 min-w-0 cursor-pointer"
                        >
                          <span className="text-base shrink-0 leading-none">{item.flag}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs leading-tight truncate ${isSelected ? 'font-extrabold text-teal-900' : 'font-semibold text-slate-800'}`}>
                                {item.nativeName}
                              </p>
                              <span className="text-[10px] text-slate-400 font-normal">({item.name})</span>
                            </div>
                            {aiMeta && (
                              <span className="text-[9px] text-teal-600 font-bold">
                                AI Translated via {aiMeta.provider.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.code !== 'en' && (
                            <button
                              type="button"
                              onClick={() => handleLanguageSelect(item.code, item, true)}
                              className="px-2 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold border border-teal-200/80 flex items-center gap-1 cursor-pointer"
                              title={`Auto-translate ${item.name} via ${activeProviderInfo.shortName}`}
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>AI</span>
                            </button>
                          )}
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3] shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Global Instant AI Languages */}
                  {availablePresets.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-teal-600" />
                        <span>1-Click AI Translate ({activeProviderInfo.shortName})</span>
                      </div>
                      {availablePresets.map((preset) => (
                        <button
                          key={preset.code}
                          type="button"
                          id={`nav-ai-preset-${preset.code}`}
                          onClick={() => handleLanguageSelect(preset.code, preset, true)}
                          className="w-full px-3 py-2 text-left hover:bg-teal-50/50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0 leading-none">{preset.flag}</span>
                            <div className="min-w-0">
                              <p className="leading-tight truncate font-semibold text-slate-700">{preset.nativeName}</p>
                              <span className="text-[10px] text-slate-400">({preset.name})</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold shrink-0">
                            <Plus className="w-2.5 h-2.5" />
                            <span>AI Translate</span>
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* VIEW-SPECIFIC NAVIGATION BAR */}
          {currentView === 'admin' ? (
            /* ADMIN VIEW CONTROLS */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-2.5 py-1.5 rounded-xl shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden lg:inline">Hostel Admin Portal</span>
              </span>

              <button
                type="button"
                id="nav-btn-exit-to-booking"
                onClick={() => onViewChange('booking')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80 min-h-[38px] sm:min-h-[40px] touch-manipulation"
                title="Return to public guest booking form"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="hidden sm:inline">{t.nav.guestBooking}</span>
              </button>

              {/* Admin Profile with Logout */}
              {currentStaff && onLogout && (
                <AdminProfileMenu
                  currentStaff={currentStaff}
                  staffUsers={staffUsers}
                  onSwitchStaff={onSwitchStaff}
                  onLogout={onLogout}
                  onGoToBooking={() => onViewChange('booking')}
                  compact={true}
                />
              )}
            </div>
          ) : currentView === 'admin-login' ? (
            /* ADMIN LOGIN VIEW CONTROLS */
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="nav-btn-login-back-to-booking"
                onClick={() => onViewChange('booking')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors border border-teal-200 min-h-[38px] sm:min-h-[40px] touch-manipulation"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{t.nav.guestBooking}</span>
              </button>
            </div>
          ) : (
            /* GUEST VIEW CONTROLS (BOOKING) */
            <>
              <div className="bg-slate-100 p-0.5 sm:p-1 rounded-xl flex items-center border border-slate-200/80 shrink-0">
                <button
                  id="nav-tab-booking"
                  onClick={() => onViewChange('booking')}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-xs border border-slate-200/60 transition-all duration-150 min-h-[36px] sm:min-h-[38px] touch-manipulation"
                >
                  <CalendarCheck 
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-200 shrink-0" 
                    style={{ color: brandColor }} 
                  />
                  <span className="hidden xs:inline">{t.nav.bookStay}</span>
                </button>
              </div>

              {/* Look up confirmed booking by REF or QR - Desktop & Tablet */}
              {onOpenLookup && (
                <button
                  type="button"
                  id="nav-btn-lookup-ref"
                  onClick={onOpenLookup}
                  title={t.nav.lookupRef}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all active:scale-95 shrink-0 min-h-[38px] sm:min-h-[40px] touch-manipulation"
                >
                  <QrCode className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="hidden lg:inline">{t.nav.lookupRef}</span>
                </button>
              )}

              {/* Quick WhatsApp Contact - Desktop & Tablet */}
              <a
                id="nav-whatsapp-direct"
                href={directChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Chat directly on WhatsApp (No API needed)"
                className="hidden md:inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all hover:shadow-xs active:scale-95 shrink-0 min-h-[38px] sm:min-h-[40px] touch-manipulation"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
                <span className="hidden lg:inline">WhatsApp</span>
              </a>

              {/* Staff Access / Admin Profile - Desktop & Tablet */}
              {isAdminAuthenticated && currentStaff ? (
                <div className="hidden md:flex items-center gap-1.5 pl-1 border-l border-slate-200">
                  <button
                    type="button"
                    id="nav-tab-admin-dashboard"
                    onClick={() => onViewChange('admin')}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all shrink-0 min-h-[38px] sm:min-h-[40px] touch-manipulation"
                    title="Open Admin Dashboard"
                  >
                    <Shield className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="hidden lg:inline">{t.nav.adminDashboard || 'Dashboard'}</span>
                    {upcomingCount > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-amber-500 rounded-full">
                        {upcomingCount}
                      </span>
                    )}
                  </button>

                  <AdminProfileMenu
                    currentStaff={currentStaff}
                    staffUsers={staffUsers}
                    onSwitchStaff={onSwitchStaff}
                    onLogout={onLogout || (() => {})}
                    onGoToBooking={() => onViewChange('booking')}
                    compact={true}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  id="nav-btn-staff-login"
                  onClick={() => onViewChange('admin-login')}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all shadow-2xs shrink-0 min-h-[38px] sm:min-h-[40px] touch-manipulation"
                  title="Hostel Staff & Admin Login"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="hidden lg:inline">{t.nav.staffLogin}</span>
                </button>
              )}

              {/* Mobile Menu Hamburger Toggle (for phone & small tablet screens) */}
              <button
                type="button"
                id="nav-mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex md:hidden items-center justify-center p-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors min-w-[38px] min-h-[38px] touch-manipulation relative shrink-0"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
                {upcomingCount > 0 && !isMobileMenuOpen && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full border-2 border-white" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile / Tablet Collapsible Menu Drawer */}
      {isMobileMenuOpen && currentView !== 'admin' && currentView !== 'admin-login' && (
        <div 
          id="nav-mobile-drawer"
          className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-3.5 space-y-2.5 shadow-xl animate-in slide-in-from-top-2 duration-200"
        >
          {/* Direct WhatsApp Concierge */}
          <a
            href={directChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs min-h-[46px] touch-manipulation shadow-2xs hover:bg-emerald-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 fill-emerald-100" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs">WhatsApp Concierge Desk</p>
                <p className="text-[11px] text-emerald-700 font-medium">+{settings.phone}</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
              Direct
            </span>
          </a>

          {/* Lookup Booking by REF / QR Code */}
          {onOpenLookup && (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenLookup();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs min-h-[46px] touch-manipulation hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-slate-900 text-xs">{t.nav.lookupRef}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Scan QR Voucher or enter Ref Code</p>
                </div>
              </div>
            </button>
          )}

          {/* Staff Portal / Admin Access */}
          <div className="pt-0.5">
            {isAdminAuthenticated && currentStaff ? (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onViewChange('admin');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900 text-white font-bold text-xs min-h-[46px] touch-manipulation shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-white text-xs">{t.nav.adminDashboard || 'Hostel Operations'}</p>
                    <p className="text-[11px] text-teal-300 font-medium">{currentStaff.name} ({currentStaff.role})</p>
                  </div>
                </div>
                {upcomingCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                    {upcomingCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onViewChange('admin-login');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs min-h-[46px] touch-manipulation transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-slate-900 text-xs">{t.nav.staffLogin}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Hostel operations, rates & room inventory</p>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Location and Info */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="truncate">{settings.city || settings.location}</span>
            <span className="font-semibold text-teal-700">Open for Surf Stays</span>
          </div>
        </div>
      )}
    </header>
  );
};

