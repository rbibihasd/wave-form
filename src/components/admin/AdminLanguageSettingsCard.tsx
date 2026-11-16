import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Globe, Check, MessageSquare, Sparkles, Send, Copy, ShieldCheck, ArrowRight, 
  ChevronDown, Plus, Upload, Download, Trash2, Edit3, RotateCcw, Search, X, 
  CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { HostelSettings, SupportedLanguage } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageOption, Translations } from '../../i18n/translations';
import { 
  formatBookingConfirmationMessage, 
  formatUpcomingStayReminderMessage, 
  formatCheckInGuideMessage, 
  formatDepositReminderMessage,
  createWhatsAppUrl 
} from '../../utils/whatsapp';

interface AdminLanguageSettingsCardProps {
  settings: HostelSettings;
  onUpdateLanguage: (lang: SupportedLanguage) => void;
  onSave?: () => void;
}

export const AdminLanguageSettingsCard: React.FC<AdminLanguageSettingsCardProps> = ({
  settings,
  onUpdateLanguage,
  onSave,
}) => {
  const { 
    language, 
    setLanguage, 
    t, 
    languages, 
    addLanguage, 
    deleteLanguage, 
    updateTranslations, 
    importTranslations, 
    resetTranslations 
  } = useLanguage();

  const [selectedPreviewTab, setSelectedPreviewTab] = useState<'confirmation' | 'reminder' | 'checkin' | 'deposit'>('confirmation');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tab mode within Language Control: 'selector' | 'editor' | 'manage'
  const [activeTab, setActiveTab] = useState<'selector' | 'editor' | 'manage'>('selector');

  // Add Language Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangName, setNewLangName] = useState('');
  const [newLangNative, setNewLangNative] = useState('');
  const [newLangFlag, setNewLangFlag] = useState('🌐');
  const [newLangIsRTL, setNewLangIsRTL] = useState(false);
  const [cloneSourceLang, setCloneSourceLang] = useState<SupportedLanguage>('en');

  // Import JSON Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetLang, setImportTargetLang] = useState<SupportedLanguage>(language);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phrase Editor State
  const [phraseSearchQuery, setPhraseSearchQuery] = useState('');
  const [phraseCategoryFilter, setPhraseCategoryFilter] = useState<'all' | 'nav' | 'common' | 'whatsapp' | 'booking' | 'settings'>('all');
  const [editablePhrases, setEditablePhrases] = useState<Record<string, string>>({});
  const [isDirtyPhrases, setIsDirtyPhrases] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Synchronize phrases editor when active language changes
  useEffect(() => {
    // Flatten t into dot-notation paths for easy editing
    const flat: Record<string, string> = {};
    function flatten(obj: any, prefix = '') {
      if (!obj) return;
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'string') {
          flat[path] = val;
        } else if (typeof val === 'object' && val !== null) {
          flatten(val, path);
        }
      });
    }
    flatten(t);
    setEditablePhrases(flat);
    setIsDirtyPhrases(false);
  }, [t, language]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mock booking for WhatsApp preview
  const mockBooking = {
    id: 'preview-1',
    referenceNumber: 'WH-8492',
    roomId: 'room-1',
    roomName: 'Ocean View Sunset Suite',
    checkInDate: '2026-09-24',
    checkOutDate: '2026-09-28',
    nights: 4,
    guestsCount: 2,
    guest: {
      firstName: 'Mateo',
      lastName: 'Silva',
      email: 'mateo.surf@example.com',
      phone: '+351912345678',
      country: 'Spain',
      surfLevel: 'intermediate' as const,
      arrivalEstimatedTime: '15:30',
      specialRequests: 'High board rack space near locker',
    },
    addOns: [
      { addOnId: 'addon-1', quantity: 2, days: 3 },
      { addOnId: 'addon-5', quantity: 2, days: 4 },
    ],
    roomSubtotal: 240,
    addOnsSubtotal: 110,
    taxAmount: 21,
    totalAmount: 371,
    status: 'confirmed' as const,
    paymentStatus: 'paid' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    whatsappSentCount: 1,
    webhookSentCount: 1,
  };

  const currentLang = (settings.defaultLanguage || language || 'en') as SupportedLanguage;

  const handleSelectLanguage = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    onUpdateLanguage(newLang);
    showToast(t.settings?.saveLanguageSuccess || 'System language updated successfully!');
  };

  // Sample Add-ons for WhatsApp preview
  const sampleAddOns = [
    { id: 'addon-1', name: 'Surf Coaching (Intermediate)', category: 'surf_lesson' as const, price: 45, billingType: 'per_day' as const, description: 'Daily surf instruction', iconName: 'Waves' as const },
    { id: 'addon-5', name: 'Daily Surfer Breakfast Buffet', category: 'meal' as const, price: 12, billingType: 'per_day' as const, description: 'Organic breakfast', iconName: 'Utensils' as const },
  ];

  let previewMessage = '';
  if (selectedPreviewTab === 'confirmation') {
    previewMessage = formatBookingConfirmationMessage(mockBooking, undefined, sampleAddOns, settings, currentLang);
  } else if (selectedPreviewTab === 'reminder') {
    previewMessage = formatUpcomingStayReminderMessage(mockBooking, 2, settings, currentLang);
  } else if (selectedPreviewTab === 'checkin') {
    previewMessage = formatCheckInGuideMessage(mockBooking, undefined, settings, currentLang);
  } else {
    previewMessage = formatDepositReminderMessage(mockBooking, settings, currentLang);
  }

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(previewMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const previewWhatsAppUrl = createWhatsAppUrl(settings.phone, previewMessage);

  // Add Language Submission
  const handleAddLanguageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newLangCode.trim().toLowerCase();
    if (!cleanCode) {
      showToast('Language code is required (e.g., pt, it, fr)', 'error');
      return;
    }
    if (languages.some(l => l.code === cleanCode)) {
      showToast(`Language code "${cleanCode}" already exists!`, 'error');
      return;
    }

    const newLangOption: LanguageOption = {
      code: cleanCode,
      name: newLangName.trim() || cleanCode.toUpperCase(),
      nativeName: newLangNative.trim() || newLangName.trim() || cleanCode.toUpperCase(),
      flag: newLangFlag.trim() || '🌐',
      isRTL: newLangIsRTL,
      isCustom: true,
    };

    // Clone phrases from clone source
    addLanguage(newLangOption);
    setLanguage(cleanCode);
    onUpdateLanguage(cleanCode);
    setIsAddModalOpen(false);
    setNewLangCode('');
    setNewLangName('');
    setNewLangNative('');
    showToast(`Added new language "${newLangOption.name}" successfully!`);
  };

  // Export Translations to JSON file
  const handleExportJSON = (langToExport: SupportedLanguage) => {
    try {
      const activeLangObj = languages.find(l => l.code === langToExport);
      const jsonContent = JSON.stringify(t, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wavehaven-translations-${langToExport}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${activeLangObj?.name || langToExport} translation dictionary!`);
    } catch (err) {
      showToast('Failed to export translation file', 'error');
    }
  };

  // Handle File Upload for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      setImportError(null);
    };
    reader.readAsText(file);
  };

  // Submit Import JSON
  const handleImportSubmit = () => {
    if (!importJsonText.trim()) {
      setImportError('Please upload a JSON file or paste translation JSON text.');
      return;
    }
    try {
      const parsed = JSON.parse(importJsonText);
      const success = importTranslations(importTargetLang, importJsonText);
      if (success) {
        setIsImportModalOpen(false);
        setImportJsonText('');
        setImportError(null);
        showToast(`Imported translations for ${importTargetLang.toUpperCase()} successfully!`);
      } else {
        setImportError('Invalid translation dictionary format. Expecting valid JSON object.');
      }
    } catch (err: any) {
      setImportError(`JSON Parse Error: ${err.message}`);
    }
  };

  // Phrase Editor: Update an inline phrase
  const handlePhraseChange = (path: string, value: string) => {
    setEditablePhrases(prev => ({
      ...prev,
      [path]: value,
    }));
    setIsDirtyPhrases(true);
  };

  // Phrase Editor: Save Changes
  const handleSavePhraseChanges = () => {
    // Reconstruct nested object from editablePhrases
    const nested: Record<string, any> = {};
    Object.keys(editablePhrases).forEach(path => {
      const parts = path.split('.');
      let current = nested;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
      current[parts[parts.length - 1]] = editablePhrases[path];
    });

    updateTranslations(currentLang, nested);
    setIsDirtyPhrases(false);
    showToast(`Saved phrase customizations for ${currentLang.toUpperCase()}!`);
    if (onSave) onSave();
  };

  // Phrase Editor: Reset Language Translations
  const handleResetTranslations = () => {
    if (window.confirm(`Reset ${currentLang.toUpperCase()} translations to factory defaults?`)) {
      resetTranslations(currentLang);
      setIsDirtyPhrases(false);
      showToast(`Reset ${currentLang.toUpperCase()} to default translations.`);
    }
  };

  // Filtered phrases for phrase dictionary editor
  const filteredPhraseKeys = useMemo(() => {
    return Object.keys(editablePhrases).filter(key => {
      // Category filter
      if (phraseCategoryFilter !== 'all') {
        if (!key.startsWith(`${phraseCategoryFilter}.`)) {
          return false;
        }
      }
      // Search filter
      if (phraseSearchQuery.trim()) {
        const query = phraseSearchQuery.toLowerCase();
        const value = (editablePhrases[key] || '').toLowerCase();
        return key.toLowerCase().includes(query) || value.includes(query);
      }
      return true;
    });
  }, [editablePhrases, phraseCategoryFilter, phraseSearchQuery]);

  return (
    <div id="settings-language-card" className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 shadow-xs border border-slate-200/80 space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className={`px-4 py-3 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in ${
          toastType === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toastType === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="ml-3 text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xl shadow-xs border border-teal-100 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-heading font-bold text-slate-900">
              {t.settings?.languageCardTitle || 'Language & Multi-Lingual Engine'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {t.settings?.languageCardSubtitle || 'Manage system languages, import translation files, and customize live phrases'}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all border border-teal-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Language</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportJSON(currentLang)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200"
            title="Download translation dictionary as JSON file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Selector & WhatsApp Preview / Phrase Editor / Languages Manager */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('selector')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'selector'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Active Language & WhatsApp Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'editor'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Live Phrase Dictionary Editor</span>
          {isDirtyPhrases && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'manage'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Languages Catalog ({languages.length})</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE SELECTOR & WHATSAPP PREVIEW */}
      {activeTab === 'selector' && (
        <div className="space-y-6">
          {/* Language Selector Dropdown */}
          <div className="space-y-3 relative" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label id="settings-lang-dropdown-label" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Select Operating & Guest Communication Language:
              </label>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full font-bold border border-teal-100">
                {languages.length} Available
              </span>
            </div>

            {/* Dropdown Trigger Button */}
            <button
              type="button"
              id="settings-language-dropdown-btn"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-labelledby="settings-lang-dropdown-label settings-language-dropdown-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-4 bg-white shadow-xs ${
                isDropdownOpen
                  ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-3xl shrink-0 leading-none">
                  {languages.find((l) => l.code === currentLang)?.flag || '🇬🇧'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-slate-900">
                      {languages.find((l) => l.code === currentLang)?.nativeName || currentLang.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({languages.find((l) => l.code === currentLang)?.name})
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase tracking-wide">
                      Active
                    </span>
                    {languages.find((l) => l.code === currentLang)?.isCustom && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                        Custom Added
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    Code: <strong className="text-slate-700 uppercase font-mono">{currentLang}</strong> · Direction: {languages.find((l) => l.code === currentLang)?.isRTL ? 'RTL (Right-to-Left)' : 'LTR (Left-to-Right)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 transition-colors">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-teal-600' : ''}`} />
                </div>
              </div>
            </button>

            {/* Dropdown Options List */}
            {isDropdownOpen && (
              <ul
                id="settings-language-dropdown-list"
                role="listbox"
                aria-label="Available languages"
                className="absolute z-20 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden py-1 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 max-h-80 overflow-y-auto"
              >
                {languages.map((lang) => {
                  const isSelected = currentLang === lang.code;
                  return (
                    <li key={lang.code} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        id={`lang-select-${lang.code}`}
                        onClick={() => {
                          handleSelectLanguage(lang.code);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3.5 text-left transition-colors flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-teal-50/70 text-slate-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="text-2xl shrink-0 leading-none">{lang.flag}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {lang.nativeName}
                              </span>
                              <span className="text-xs text-slate-500">
                                ({lang.name})
                              </span>
                              {lang.isCustom && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  Custom
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate font-mono">
                              code: {lang.code}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {isSelected ? (
                            <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded-md hover:bg-slate-200/50">
                              Select
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Live Preview of Guest WhatsApp Messages */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t.settings?.previewWhatsApp?.replace('{lang}', languages.find(l => l.code === currentLang)?.nativeName || 'English') || 'WhatsApp Live Preview'}
                </h4>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedPreviewTab('confirmation')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedPreviewTab === 'confirmation'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Confirmation Voucher
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewTab('reminder')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedPreviewTab === 'reminder'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Stay Reminder
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewTab('checkin')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedPreviewTab === 'checkin'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Check-in Day
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewTab('deposit')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedPreviewTab === 'deposit'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Deposit Alert
                </button>
              </div>
            </div>

            {/* Formatted message box simulating WhatsApp bubble */}
            <div className="bg-[#e7fedb] border border-[#c4eab4] rounded-2xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap shadow-2xs leading-relaxed max-h-72 overflow-y-auto">
              {previewMessage}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? t.common.copied : t.common.copy}</span>
                </button>

                <a
                  href={previewWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Test in WhatsApp</span>
                </a>
              </div>

              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Direct dispatch format • Works on mobile & web
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE PHRASE DICTIONARY EDITOR */}
      {activeTab === 'editor' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Editing Translations: <span className="text-teal-700 font-extrabold uppercase">{languages.find(l => l.code === currentLang)?.name} ({currentLang})</span>
                </h4>
                {isDirtyPhrases && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    Unsaved edits
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize any UI phrase or WhatsApp message string in real time.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetTranslations}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
                title="Reset this language to original default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={handleSavePhraseChanges}
                disabled={!isDirtyPhrases}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  isDirtyPhrases
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Phrases</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={phraseSearchQuery}
                onChange={(e) => setPhraseSearchQuery(e.target.value)}
                placeholder="Search phrase key or text (e.g. bookStay, greeting, checkIn)..."
                className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {phraseSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPhraseSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <select
                value={phraseCategoryFilter}
                onChange={(e) => setPhraseCategoryFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="all">All Sections ({filteredPhraseKeys.length})</option>
                <option value="nav">Navigation (nav)</option>
                <option value="common">Common Words (common)</option>
                <option value="whatsapp">WhatsApp Messages (whatsapp)</option>
                <option value="booking">Booking Flow (booking)</option>
                <option value="settings">Admin Settings (settings)</option>
              </select>
            </div>
          </div>

          {/* Phrases Table / List */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-96 overflow-y-auto divide-y divide-slate-100">
            {filteredPhraseKeys.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No translation phrases found matching &quot;{phraseSearchQuery}&quot;
              </div>
            ) : (
              filteredPhraseKeys.map(path => {
                const value = editablePhrases[path] || '';
                const isLong = value.length > 50;

                return (
                  <div key={path} className="p-3 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                    <div className="sm:w-1/3 shrink-0">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                        {path}
                      </span>
                    </div>

                    <div className="sm:w-2/3">
                      {isLong ? (
                        <textarea
                          rows={2}
                          value={value}
                          onChange={(e) => handlePhraseChange(path, e.target.value)}
                          className="w-full p-2 text-xs text-slate-900 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden font-sans resize-y"
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handlePhraseChange(path, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs text-slate-900 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden font-sans"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LANGUAGES CATALOG & MANAGEMENT */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              Configured Languages ({languages.length})
            </h4>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Language</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {languages.map(lang => {
              const isActive = currentLang === lang.code;

              return (
                <div 
                  key={lang.code}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isActive 
                      ? 'border-teal-500 bg-teal-50/30 ring-1 ring-teal-500/20 shadow-xs' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">{lang.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-sm font-bold text-slate-900">{lang.nativeName}</h5>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-teal-600" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{lang.name}</p>
                      </div>
                    </div>

                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold uppercase">
                      {lang.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      {lang.isRTL ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}
                    </span>

                    <div className="flex items-center gap-1">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleSelectLanguage(lang.code)}
                          className="px-2 py-1 rounded-lg text-teal-700 hover:bg-teal-50 font-bold text-[11px]"
                        >
                          Activate
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleExportJSON(lang.code)}
                        className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                        title="Download JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {lang.isCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete custom language "${lang.name}" (${lang.code})?`)) {
                              deleteLanguage(lang.code);
                              showToast(`Deleted language ${lang.name}`);
                            }
                          }}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                          title="Delete Language"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD LANGUAGE MANUALLY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Add New Language Manually</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLanguageSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Language Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pt, it, ja, nl"
                    value={newLangCode}
                    onChange={(e) => setNewLangCode(e.target.value.toLowerCase().replace(/[^a-z-]/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ISO 639-1 code</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Emoji Flag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🇵🇹, 🇮🇹, 🇯🇵"
                    value={newLangFlag}
                    onChange={(e) => setNewLangFlag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-base text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  English Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Portuguese, Italian, Dutch"
                  value={newLangName}
                  onChange={(e) => setNewLangName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Native Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Português, Italiano, Nederlands"
                  value={newLangNative}
                  onChange={(e) => setNewLangNative(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Text Direction</span>
                  <span className="text-[10px] text-slate-500">Enable RTL for Arabic, Hebrew, Urdu</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={newLangIsRTL}
                    onChange={(e) => setNewLangIsRTL(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-sm focus:ring-teal-500"
                  />
                  <span>RTL Layout</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Add Language
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT JSON FILE */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Import Translation JSON File</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Language to Populate:
                </label>
                <select
                  value={importTargetLang}
                  onChange={(e) => setImportTargetLang(e.target.value as SupportedLanguage)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  {languages.map(l => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name} ({l.nativeName}) — [{l.code}]
                    </option>
                  ))}
                </select>
              </div>

              {/* File upload drag area */}
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50"
                   onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Upload className="w-6 h-6 text-teal-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-800">
                  Click to choose <code className="text-teal-700">.json</code> file
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Accepts standard translation dictionary JSON
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Or Paste JSON Text:
                </label>
                <textarea
                  rows={5}
                  value={importJsonText}
                  onChange={(e) => {
                    setImportJsonText(e.target.value);
                    setImportError(null);
                  }}
                  placeholder='{"nav": {"bookStay": "Reserve Now"}, "whatsapp": {...}}'
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Apply & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
