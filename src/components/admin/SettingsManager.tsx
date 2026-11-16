import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, ShieldCheck, DollarSign, Waves, MessageSquare, 
  Webhook, Database, Save, Upload, Download, RefreshCw, 
  CheckCircle2, AlertCircle, Phone, MapPin, Globe, Clock, 
  Key, Wifi, CreditCard, FileText, Trash2, Copy, Check, 
  ExternalLink, AlertTriangle, Send, Sliders, ChevronLeft, ChevronRight,
  ArrowLeft, ArrowRight, Palette, Image as ImageIcon, UploadCloud, Eye, Sparkles,
  Mail, Languages, Search, X, Server, Layers, Terminal, Zap
} from 'lucide-react';
import { Booking, HostelSettings, NotificationTemplate, Room, SurfAddOn, WebhookLog, BookingFormConfig } from '../../types';
import { dispatchWebhook, getWebhookLogs, clearWebhookLogs } from '../../utils/webhook';
import { 
  resetAllDataToDefault, getFullSystemBackup, restoreFullSystemBackup, 
  getSystemStorageDiagnostics, FullSystemBackup,
  purgeDemoBookingsForLiveLaunch, seedDemoBookingsForTesting 
} from '../../utils/storage';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { 
  getSupabaseConfig, saveSupabaseConfig, testSupabaseConnection, 
  downloadSupabaseSchemaSQL, generateSupabaseSQL, clearSupabaseConfig 
} from '../../utils/supabase';
import { WhatsAppTemplateBuilder } from './WhatsAppTemplateBuilder';
import { AutoRespondersSection } from './AutoRespondersSection';
import { BookingFormBuilder } from './BookingFormBuilder';
import { AutoCancelUnpaidSettingsCard } from './AutoCancelUnpaidSettingsCard';
import { ThemeCustomizerCard } from './ThemeCustomizerCard';
import { AdminFormCountryCityCard } from './AdminFormCountryCityCard';
import { AdminLanguageSettingsCard } from './AdminLanguageSettingsCard';
import { InvoiceTemplateBuilder } from './InvoiceTemplateBuilder';
import { INVOICE_TEMPLATE_PRESETS, DEFAULT_INVOICE_TEMPLATE } from '../../data/initialData';
import { LiveOceanSpot } from '../../types/weather';

export type SettingsSection = 'brand' | 'theme' | 'identity' | 'language' | 'policies' | 'finance' | 'surf' | 'bookingBuilder' | 'whatsapp' | 'invoices' | 'webhook' | 'cloud' | 'system';

export interface SettingsManagerProps {
  settings: HostelSettings;
  bookings: Booking[];
  rooms?: Room[];
  addOns?: SurfAddOn[];
  templates?: NotificationTemplate[];
  initialSection?: SettingsSection;
  onSectionChange?: (section: SettingsSection) => void;
  onSaveSettings: (settings: HostelSettings) => void;
  onUpdateTemplate?: (template: NotificationTemplate) => void;
  onBatchUpdateBookings?: (updatedBookings: Booking[]) => void;
  onUpdateBooking?: (updatedBooking: Booking) => void;
  onSelectOceanSpot?: (spot: LiveOceanSpot) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  settings,
  bookings,
  rooms = [],
  addOns = [],
  templates = [],
  initialSection,
  onSectionChange,
  onSaveSettings,
  onUpdateTemplate,
  onBatchUpdateBookings,
  onUpdateBooking,
  onSelectOceanSpot,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection || 'brand');
  const [formData, setFormData] = useState<HostelSettings>({ ...settings });
  const [isDirty, setIsDirty] = useState(false);
  const navScrollRef = useRef<HTMLDivElement>(null);
  const settingsContainerRef = useRef<HTMLDivElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);
  const [customHexInput, setCustomHexInput] = useState(settings.primaryBrandColor || '#0d9488');
  const [isInvoiceBuilderModalOpen, setIsInvoiceBuilderModalOpen] = useState(false);

  useEffect(() => {
    if (initialSection) {
      setActiveSection((prev) => (prev === initialSection ? prev : initialSection));
    }
  }, [initialSection]);
  
  // Webhook state
  const [logs, setLogs] = useState<WebhookLog[]>(getWebhookLogs());
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'failed' | 'simulated'>('all');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; statusCode?: number } | null>(null);
  const [selectedLogPayload, setSelectedLogPayload] = useState<WebhookLog | null>(null);

  // System Diagnostics
  const [diagnostics, setDiagnostics] = useState(getSystemStorageDiagnostics());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isConfirmingPurge, setIsConfirmingPurge] = useState(false);
  const [isConfirmingSeed, setIsConfirmingSeed] = useState(false);

  // Settings Search Engine State
  const [settingsSearchQuery, setSettingsSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Supabase Cloud State
  const [supabaseConfig, setSupabaseConfigState] = useState(getSupabaseConfig());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseConfig.url);
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(supabaseConfig.anonKey);
  const [supabaseTestState, setSupabaseTestState] = useState<{ testing: boolean; result: { success: boolean; message: string } | null }>({
    testing: false,
    result: null,
  });

  // Hotkey listener for Search: / or Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTestSupabase = async () => {
    setSupabaseTestState({ testing: true, result: null });
    const res = await testSupabaseConnection(supabaseUrlInput, supabaseAnonKeyInput);
    setSupabaseTestState({ testing: false, result: res });
    if (res.success) {
      saveSupabaseConfig(supabaseUrlInput, supabaseAnonKeyInput);
      setSupabaseConfigState(getSupabaseConfig());
      showToast('Connected and verified Supabase API connection!');
    }
  };

  const handleSaveSupabaseConfig = () => {
    saveSupabaseConfig(supabaseUrlInput, supabaseAnonKeyInput);
    setSupabaseConfigState(getSupabaseConfig());
    showToast('Supabase settings saved to environment configuration!');
  };

  const handleClearSupabase = () => {
    clearSupabaseConfig();
    setSupabaseUrlInput('');
    setSupabaseAnonKeyInput('');
    setSupabaseConfigState(getSupabaseConfig());
    setSupabaseTestState({ testing: false, result: null });
    showToast('Supabase configuration cleared. Running in local storage mode.');
  };

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update formData if incoming settings change
  useEffect(() => {
    setFormData({ ...settings });
    setIsDirty(false);
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFieldChange = <K extends keyof HostelSettings>(key: K, value: HostelSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveSettings(formData);
    setIsDirty(false);
    setDiagnostics(getSystemStorageDiagnostics());
    showToast('All system configurations saved and synchronized successfully!');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast(`Copied ${label} to clipboard`);
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);

    const sampleBooking = bookings[0] || null;
    const res = await dispatchWebhook('system.test', sampleBooking, formData, {
      testMessage: 'WaveHaven Surf House Full System Integration Ping',
      dispatchedBy: 'Admin Settings Control Center',
      systemTimestamp: new Date().toISOString(),
    });

    setIsTestingWebhook(false);
    setTestResult(res);
    setLogs(getWebhookLogs());
    setDiagnostics(getSystemStorageDiagnostics());
  };

  const handleClearLogs = () => {
    if (window.confirm('Clear all webhook notification logs?')) {
      clearWebhookLogs();
      setLogs([]);
      showToast('Webhook delivery history cleared');
    }
  };

  // Full System Export
  const handleExportFullSystemJSON = () => {
    const backupData = getFullSystemBackup();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `wavehaven_full_system_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Full system backup exported (Rooms, Bookings, Add-ons, Settings, Templates)');
  };

  // Bookings CSV Export
  const handleExportBookingsCSV = () => {
    const headers = [
      'Ref', 'Guest Name', 'Email', 'Phone', 'Country', 'Surf Level', 
      'Room', 'Check-in', 'Check-out', 'Nights', 'Guests', 'Total Amount', 
      'Currency', 'Payment Status', 'Booking Status', 'Special Requests'
    ];
    const rows = bookings.map((b) => [
      b.referenceNumber,
      `"${b.guest.firstName} ${b.guest.lastName}"`,
      b.guest.email,
      b.guest.phone,
      `"${b.guest.country || ''}"`,
      b.guest.surfLevel,
      `"${b.roomName}"`,
      b.checkInDate,
      b.checkOutDate,
      b.nights,
      b.guestsCount,
      b.totalAmount.toFixed(2),
      formData.currency,
      b.paymentStatus,
      b.status,
      `"${(b.guest.specialRequests || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const a = document.createElement('a');
    a.setAttribute('href', encodeURI(csvContent));
    a.setAttribute('download', `wavehaven_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Exported active reservations to CSV format');
  };

  // Import / Restore Full System
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as Partial<FullSystemBackup>;
        const res = restoreFullSystemBackup(json);
        if (res.success) {
          showToast('Full system backup successfully restored! Reloading...');
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          alert('Failed to restore backup: ' + res.message);
        }
      } catch (err) {
        alert('Invalid JSON file. Please ensure this is a valid WaveHaven backup export.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetAllDataToDefault();
    setIsConfirmingReset(false);
    showToast('System reset to factory defaults. Refreshing...');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const togglePaymentMethod = (method: string) => {
    const current = formData.acceptedPaymentMethods || ['cash', 'card'];
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    handleFieldChange('acceptedPaymentMethods', updated);
  };

  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'all') return true;
    return l.status === logFilter;
  });

  // Curated brand color presets
  const BRAND_COLOR_PRESETS = [
    { name: 'Coastal Teal', hex: '#0d9488', tone: 'Ocean & Salty Air (Default)' },
    { name: 'Deep Surf Blue', hex: '#0284c7', tone: 'Atlantic Pointbreak' },
    { name: 'Pacific Indigo', hex: '#4f46e5', tone: 'Dusk Barrel Swell' },
    { name: 'Tropical Emerald', hex: '#059669', tone: 'Lush Coastal Pines' },
    { name: 'Sunset Coral', hex: '#f43f5e', tone: 'Golden Hour Waves' },
    { name: 'Sunlit Amber', hex: '#d97706', tone: 'Warm Beach Sand' },
    { name: 'Royal Violet', hex: '#7c3aed', tone: 'Sunset Horizon Glow' },
    { name: 'Volcanic Slate', hex: '#334155', tone: 'Modern Minimalist' },
  ];

  // Curated surf hostel logo presets for one-click testing
  const SAMPLE_LOGOS = [
    {
      name: 'Atlantic Wave Crest',
      url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=300&q=80',
      description: 'Crisp barrel curl emblem',
    },
    {
      name: 'Sunset Ocean Swell',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
      description: 'Golden hour coastline horizon',
    },
    {
      name: 'Retro Surf Quiver',
      url: 'https://images.unsplash.com/photo-1537519646099-335112f03225?auto=format&fit=crop&w=300&q=80',
      description: 'Classic wooden surfboard icon',
    },
    {
      name: 'Coastal Palm Horizon',
      url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=300&q=80',
      description: 'Tropical camp silhouette',
    },
  ];

  const handleLogoFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      showToast('Image size exceeds 2.5MB. Please choose a smaller file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        handleFieldChange('logoUrl', result);
        setLogoImgError(false);
        showToast('Logo image uploaded successfully! Check the live preview below.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBrandColorChange = (hex: string) => {
    handleFieldChange('primaryBrandColor', hex);
    setCustomHexInput(hex);
  };

  // Navigation tabs config
  const navTabs: { 
    id: SettingsSection; 
    label: string; 
    shortLabel: string;
    category: 'General' | 'Operations' | 'Integrations' | 'System';
    icon: React.FC<{ className?: string }>;
    description: string;
  }[] = [
    { 
      id: 'brand', 
      label: 'Brand & Visual Identity', 
      shortLabel: 'Brand & Logo',
      category: 'General',
      icon: Palette,
      description: 'Hostel primary brand color, logo URL or file upload, and dynamic header/footer styling.',
    },
    { 
      id: 'theme', 
      label: 'UI Theme & Geometry', 
      shortLabel: 'UI Theme',
      category: 'General',
      icon: Sliders,
      description: 'Corner radii, border framing widths, and shadow intensities reflecting your surf camp brand identity.',
    },
    { 
      id: 'identity', 
      label: 'Hostel Identity & Status', 
      shortLabel: 'Hostel Identity',
      category: 'General',
      icon: Building2,
      description: 'Hostel branding, address, location, timezone, emergency phone, and seasonal operating status.',
    },
    { 
      id: 'language', 
      label: 'Language & Translations', 
      shortLabel: 'Language',
      category: 'General',
      icon: Languages,
      description: 'Language toggle and translation dictionary for Spanish, Portuguese, and English across UI text and guest-facing WhatsApp messages.',
    },
    { 
      id: 'policies', 
      label: 'Stay & House Policies', 
      shortLabel: 'Stay Policies',
      category: 'General',
      icon: ShieldCheck,
      description: 'Check-in/out hours, quiet hours, stay length limits, age restrictions, and house rules.',
    },
    { 
      id: 'finance', 
      label: 'Finance, Rates & Taxes', 
      shortLabel: 'Finance & Rates',
      category: 'Operations',
      icon: DollarSign,
      description: 'Currency symbol, hospitality tax rate %, room key deposit, payment methods, and bank transfer details.',
    },
    { 
      id: 'surf', 
      label: 'Surf School & Amenities', 
      shortLabel: 'Surf & Wi-Fi',
      category: 'Operations',
      icon: Waves,
      description: 'Daily surf coaching session times, swell forecast links, guest Wi-Fi credentials, and liability waiver.',
    },
    { 
      id: 'bookingBuilder', 
      label: 'Booking Form Builder', 
      shortLabel: 'Form Builder',
      category: 'Operations',
      icon: Sparkles,
      description: 'Customize guest booking wizard steps, fields, validation, and AI prompt generator with live preview.',
    },
    { 
      id: 'whatsapp', 
      label: 'WhatsApp & Message Templates', 
      shortLabel: 'WhatsApp & Templates',
      category: 'Integrations',
      icon: MessageSquare,
      description: 'Hostel WhatsApp reception line, stay reminder schedule, and visual template builder for reservation and reminder vouchers.',
    },
    { 
      id: 'invoices', 
      label: 'Invoice & Receipt Builder', 
      shortLabel: 'Invoice Builder',
      category: 'Operations',
      icon: FileText,
      description: 'Design official A4 tax invoices, QR verification passes, custom headers, fiscal NIF, and functional block toggles with live preview.',
    },
    { 
      id: 'webhook', 
      label: 'Webhooks & API Suite', 
      shortLabel: 'Webhooks & API',
      category: 'Integrations',
      icon: Webhook,
      description: 'Real-time JSON event webhooks to Discord, Make, Zapier, n8n, Google Sheets, with live tester and delivery log.',
    },
    { 
      id: 'cloud', 
      label: 'Vercel, Supabase & Cloud Deployment', 
      shortLabel: 'Cloud & Vercel',
      category: 'System',
      icon: UploadCloud,
      description: 'Production presets for Vercel SPA routing, Supabase PostgreSQL database schema migration, and Node/Docker deployment.',
    },
    { 
      id: 'system', 
      label: 'System Backup & Health', 
      shortLabel: 'Backup & Health',
      category: 'System',
      icon: Database,
      description: 'System storage diagnostics, full JSON snapshot downloads, backup restore, CSV export, and factory reset.',
    },
  ];

  const currentTabIdx = navTabs.findIndex((t) => t.id === activeSection);
  const currentTab = navTabs[currentTabIdx] || navTabs[0];
  const prevTab = currentTabIdx > 0 ? navTabs[currentTabIdx - 1] : null;
  const nextTab = currentTabIdx < navTabs.length - 1 ? navTabs[currentTabIdx + 1] : null;

  const handleNavigateSection = (sectionId: SettingsSection) => {
    setActiveSection(sectionId);
    onSectionChange?.(sectionId);
    setTimeout(() => {
      const tabBtn = document.getElementById(`settings-tab-${sectionId}`);
      tabBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      settingsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      navScrollRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  const renderSectionFooter = () => (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 mt-8">
      {prevTab ? (
        <button
          type="button"
          onClick={() => handleNavigateSection(prevTab.id)}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs touch-manipulation active:scale-[0.99]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Previous: {prevTab.shortLabel}</span>
        </button>
      ) : (
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-xs font-semibold px-2">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Section 1 of {navTabs.length} (Hostel Identity)</span>
        </div>
      )}

      <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
        {isDirty && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Unsaved changes
          </span>
        )}
        <button
          type="button"
          onClick={() => handleSave()}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-all text-xs touch-manipulation active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save All Settings</span>
        </button>
      </div>

      {nextTab ? (
        <button
          type="button"
          onClick={() => handleNavigateSection(nextTab.id)}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs touch-manipulation active:scale-[0.99]"
        >
          <span>Next: {nextTab.shortLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => handleNavigateSection(navTabs[0].id)}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs touch-manipulation active:scale-[0.99]"
        >
          <span>Back to Top (Section 1)</span>
          <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
        </button>
      )}
    </div>
  );

  return (
    <div ref={settingsContainerRef} className="space-y-6 text-xs text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-teal-300 px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-3 border border-teal-500/30 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)} 
            className="text-slate-400 hover:text-white ml-2 text-sm leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Save Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-teal-50 text-teal-600">
              <Sliders className="w-4 h-4" />
            </span>
            <h3 className="font-heading font-extrabold text-lg text-slate-900">
              Settings & Hostel Configuration
            </h3>
            <span className="hidden md:inline-flex text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
              Section {currentTabIdx + 1} of {navTabs.length}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Configure hostel branding, stay limits, surf school operations, WhatsApp routing, webhooks & database backups.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={() => handleSave()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm shadow-teal-600/25 transition-all text-xs active:scale-95 touch-manipulation w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Instant Settings Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={settingsSearchQuery}
            onChange={(e) => setSettingsSearchQuery(e.target.value)}
            placeholder="Search settings, features & policies (e.g., whatsapp, deposit, invoice, wifi, language, vercel, tax, quiet hours)..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
          />
          <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
            {settingsSearchQuery ? (
              <button
                type="button"
                onClick={() => setSettingsSearchQuery('')}
                className="pointer-events-auto p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 shadow-2xs">
                / or Ctrl+K
              </kbd>
            )}
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="text-slate-400 font-bold shrink-0 hidden sm:inline mr-1">Quick Jump:</span>
          {[
            { label: '💬 WhatsApp', section: 'whatsapp' as SettingsSection, q: 'whatsapp' },
            { label: '🌐 Multi-Language', section: 'language' as SettingsSection, q: 'language' },
            { label: '💳 Deposit & Tax', section: 'finance' as SettingsSection, q: 'deposit' },
            { label: '📶 Wi-Fi & Gate', section: 'surf' as SettingsSection, q: 'wifi' },
            { label: '📄 Invoices', section: 'invoices' as SettingsSection, q: 'invoice' },
            { label: '🚀 Vercel & Supabase', section: 'cloud' as SettingsSection, q: 'vercel' },
            { label: '🎨 Theme & Logo', section: 'brand' as SettingsSection, q: 'logo' },
            { label: '⏰ Check-In & Quiet', section: 'policies' as SettingsSection, q: 'check-in' },
          ].map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                handleNavigateSection(chip.section);
                setSettingsSearchQuery(chip.q);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-semibold transition-all border border-slate-200/60"
            >
              {chip.label}
            </button>
          ))}
          {settingsSearchQuery && (
            <button
              type="button"
              onClick={() => setSettingsSearchQuery('')}
              className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-all text-[10px]"
            >
              Reset Search
            </button>
          )}
        </div>

        {/* Instant Search Results Dropdown/Box if searching */}
        {settingsSearchQuery.trim() && (() => {
          const q = settingsSearchQuery.toLowerCase();
          const matches = navTabs.filter(tab => 
            tab.label.toLowerCase().includes(q) || 
            tab.shortLabel.toLowerCase().includes(q) || 
            tab.description.toLowerCase().includes(q) ||
            tab.category.toLowerCase().includes(q)
          );

          return (
            <div className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Matching Settings Sections ({matches.length})</span>
                <span className="text-teal-700 font-semibold">Click to open tab</span>
              </div>

              {matches.length === 0 ? (
                <div className="p-3 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                  No direct settings section matched &quot;{settingsSearchQuery}&quot;. Try terms like <em>whatsapp, deposit, invoice, wifi, vercel, language, color</em>.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {matches.map(m => {
                    const Icon = m.icon;
                    const isCurrent = activeSection === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          handleNavigateSection(m.id);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isCurrent 
                            ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-500/20' 
                            : 'bg-slate-50/70 hover:bg-white hover:border-teal-300 border-slate-200'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-teal-600 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 text-xs truncate flex items-center justify-between">
                            <span>{m.label}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-teal-600 text-white font-black">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {m.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Mobile Navigation Dropdown (< sm screens) */}
      <div className="sm:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <label htmlFor="mobile-settings-nav" className="text-slate-500 font-bold text-[11px] shrink-0">
          Section:
        </label>
        <select
          id="mobile-settings-nav"
          value={activeSection}
          onChange={(e) => handleNavigateSection(e.target.value as SettingsSection)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 min-h-[44px] font-bold text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
        >
          {navTabs.map((tab, idx) => (
            <option key={tab.id} value={tab.id}>
              {idx + 1}. {tab.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={!prevTab}
            onClick={() => prevTab && handleNavigateSection(prevTab.id)}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 flex items-center justify-center transition-colors touch-manipulation"
            title="Previous Section"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!nextTab}
            onClick={() => nextTab && handleNavigateSection(nextTab.id)}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 flex items-center justify-center transition-colors touch-manipulation"
            title="Next Section"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tablet / Desktop Sub-Navigation Tabs Bar */}
      <div className="hidden sm:flex relative bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs items-center gap-1">
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 transition-colors flex items-center justify-center touch-manipulation"
          title="Scroll navigation left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={navScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scroll-smooth w-full"
          style={{ scrollbarWidth: 'thin' }}
        >
          {navTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                id={`settings-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleNavigateSection(tab.id)}
                className={`flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all text-xs shrink-0 touch-manipulation ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/50'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                  isActive ? 'bg-teal-500 text-slate-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  {idx + 1}
                </span>
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`hidden xl:inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
                  isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-400'
                }`}>
                  {tab.category}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollTabs('right')}
          className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 transition-colors flex items-center justify-center touch-manipulation"
          title="Scroll navigation right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Active Section Context Banner */}
      <div className="bg-gradient-to-r from-teal-50/70 via-slate-50 to-white rounded-2xl border border-teal-100/80 p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
            {React.createElement(currentTab.icon, { className: 'w-4 h-4' })}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-extrabold text-sm text-slate-900">
                {currentTab.label}
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {currentTab.category}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-1">
              {currentTab.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={!prevTab}
            onClick={() => prevTab && handleNavigateSection(prevTab.id)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white text-slate-700 font-bold text-[11px] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Prev</span>
          </button>
          <span className="text-[11px] font-mono font-bold text-slate-400 px-1">
            {currentTabIdx + 1} / {navTabs.length}
          </span>
          <button
            type="button"
            disabled={!nextTab}
            onClick={() => nextTab && handleNavigateSection(nextTab.id)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white text-slate-700 font-bold text-[11px] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-all"
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TAB 1: BRAND & VISUAL IDENTITY */}
      {activeSection === 'brand' && (
        <div className="space-y-6">
          {/* Primary Brand Color Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs transition-colors duration-200"
                  style={{ backgroundColor: formData.primaryBrandColor || '#0d9488' }}
                >
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-base text-slate-900">
                    Primary Brand Accent Color
                  </h4>
                  <p className="text-xs text-slate-500">
                    Controls signature accents, header highlights, active buttons, and footer borders dynamically.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-lg border border-slate-200 shadow-2xs"
                  style={{ backgroundColor: formData.primaryBrandColor || '#0d9488' }}
                />
                <span className="font-mono text-xs font-bold text-slate-800 uppercase px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                  {formData.primaryBrandColor || '#0d9488'}
                </span>
              </div>
            </div>

            {/* Curated Color Swatches */}
            <div>
              <label className="block font-semibold text-slate-700 mb-2">
                Curated Surf & Coastal Palettes
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BRAND_COLOR_PRESETS.map((preset) => {
                  const isSelected = (formData.primaryBrandColor || '#0d9488').toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => handleBrandColorChange(preset.hex)}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        isSelected 
                          ? 'bg-slate-50/80 border-slate-900 ring-2 ring-slate-900/10 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div 
                        className="w-6 h-6 rounded-full shrink-0 shadow-xs border border-white/50 flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: preset.hex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {preset.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {preset.hex}
                        </p>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {preset.tone}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hex & Native Color Wheel */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Custom Hex Code Input
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                      #
                    </span>
                    <input
                      type="text"
                      value={customHexInput.replace('#', '')}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setCustomHexInput(val.startsWith('#') ? val : `#${val}`);
                        if (/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i.test(val)) {
                          const formatted = val.startsWith('#') ? val : `#${val}`;
                          handleFieldChange('primaryBrandColor', formatted);
                        }
                      }}
                      placeholder="0d9488"
                      maxLength={7}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBrandColorChange('#0d9488')}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] shrink-0"
                    title="Reset to default wave teal"
                  >
                    Reset Teal
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Color Picker Wheel
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="color"
                      value={formData.primaryBrandColor || '#0d9488'}
                      onChange={(e) => handleBrandColorChange(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0 overflow-hidden"
                      title="Open color picker"
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    Click the swatch to pick any custom brand color from the spectrum.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo URL & File Upload Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-base text-slate-900">
                    Hostel Logo & Visual Emblem
                  </h4>
                  <p className="text-xs text-slate-500">
                    Upload an image file directly or paste an image URL. Replaces the default wave vector icon in the navbar and footer.
                  </p>
                </div>
              </div>

              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('logoUrl', '');
                    setLogoImgError(false);
                    showToast('Logo cleared. Reverted to default Wave icon.');
                  }}
                  className="px-3 py-1 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  Remove Custom Logo
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={logoFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoFileUpload(file);
              }}
              className="hidden"
            />

            {/* Upload Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingLogo(true);
              }}
              onDragLeave={() => setIsDraggingLogo(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingLogo(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleLogoFileUpload(file);
              }}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center ${
                isDraggingLogo 
                  ? 'border-teal-500 bg-teal-50/50' 
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-teal-600 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-800 text-xs mb-1">
                Drag and drop your logo file here, or browse files
              </p>
              <p className="text-[11px] text-slate-400 mb-3">
                Supports PNG, SVG, JPG, WebP up to 2.5MB. Converted to secure client-side data URL.
              </p>
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo File</span>
              </button>
            </div>

            {/* Direct Web URL Input */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Or Provide Direct Web Image URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={formData.logoUrl || ''}
                  onChange={(e) => {
                    handleFieldChange('logoUrl', e.target.value);
                    setLogoImgError(false);
                  }}
                  placeholder="https://example.com/images/wavehaven-logo.png"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('logoUrl', '');
                      setLogoImgError(false);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Curated Sample Logo Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-700 text-xs">
                  Or Test with Sample Surf Emblems
                </label>
                <span className="text-[10px] text-slate-400">1-Click Test Presets</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SAMPLE_LOGOS.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => {
                      handleFieldChange('logoUrl', sample.url);
                      setLogoImgError(false);
                      showToast(`Selected sample: ${sample.name}`);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-left flex items-center gap-2.5 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                      <img src={sample.url} alt={sample.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-[11px] truncate">
                        {sample.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {sample.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Background Contrast Preview */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-2">
                Logo Rendering Preview (Light & Dark Contexts)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Light context (Navbar) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
                  {formData.logoUrl && !logoImgError ? (
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                      <img 
                        src={formData.logoUrl} 
                        alt="Preview" 
                        onError={() => setLogoImgError(true)}
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0 transition-colors"
                      style={{ backgroundColor: formData.primaryBrandColor || '#0d9488' }}
                    >
                      <Waves className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Navbar Header (Light)
                    </span>
                    <p className="font-heading font-extrabold text-sm text-slate-900">
                      {formData.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formData.logoUrl ? 'Custom Image Active' : 'Default Wave Emblem'}
                    </p>
                  </div>
                </div>

                {/* Dark context (Footer) */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xs flex items-center gap-3">
                  {formData.logoUrl && !logoImgError ? (
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                      <img 
                        src={formData.logoUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0 transition-colors"
                      style={{ backgroundColor: formData.primaryBrandColor || '#0d9488' }}
                    >
                      <Waves className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Footer (Dark)
                    </span>
                    <p className="font-heading font-extrabold text-sm text-white">
                      {formData.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formData.logoUrl ? 'Custom Image Active' : 'Default Wave Emblem'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Interactive Navbar & Footer Simulation Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600" />
                <h4 className="font-heading font-extrabold text-base text-slate-900">
                  Live Interactive Header & Footer Simulator
                </h4>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Live Dynamic Feed
              </span>
            </div>

            <p className="text-xs text-slate-500">
              This preview dynamically demonstrates how your chosen brand color (<span className="font-mono font-bold text-slate-800">{formData.primaryBrandColor || '#0d9488'}</span>) and logo integrate into the top navigation bar and bottom site footer.
            </p>

            {/* Simulated Navbar Component */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-slate-50">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <span>Top Navigation Bar Preview</span>
                <span className="text-slate-500 font-mono">sticky top-0</span>
              </div>

              <div className="bg-white/95 border-b border-slate-200">
                {/* Simulated Top Accent Stripe */}
                <div 
                  className="h-1 w-full transition-colors duration-200"
                  style={{ backgroundColor: formData.primaryBrandColor || '#0d9488' }}
                />

                <div className="p-3 px-4 flex items-center justify-between gap-3">
                  {/* Brand & Logo */}
                  <div className="flex items-center gap-2.5">
                    {formData.logoUrl && !logoImgError ? (
                      <div 
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs"
                        style={{ boxShadow: `0 2px 8px -2px ${(formData.primaryBrandColor || '#0d9488')}40` }}
                      >
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: formData.primaryBrandColor || '#0d9488' }}
                      >
                        <Waves className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-bold text-sm text-slate-900">
                          {formData.name.split(' ')[0]}
                          <span 
                            className="font-extrabold ml-1"
                            style={{ color: formData.primaryBrandColor || '#0d9488' }}
                          >
                            {formData.name.split(' ').slice(1).join(' ') || 'Surf House'}
                          </span>
                        </span>
                        <span 
                          className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border"
                          style={{
                            backgroundColor: `${formData.primaryBrandColor || '#0d9488'}15`,
                            color: formData.primaryBrandColor || '#0d9488',
                            borderColor: `${formData.primaryBrandColor || '#0d9488'}35`,
                          }}
                        >
                          Ericeira Camp
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {formData.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Simulated Nav Pills */}
                  <div className="flex items-center gap-1.5">
                    <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: formData.primaryBrandColor || '#0d9488' }}
                      />
                      <span>Book Stay</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg text-slate-600 text-[11px] font-medium hidden sm:block">
                      Admin System
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Footer Component */}
            <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span>Site Footer Preview</span>
                <span className="text-slate-500 font-mono">border-t dynamic accent</span>
              </div>

              <div 
                className="bg-slate-900 text-white p-4"
                style={{
                  borderTopColor: `${formData.primaryBrandColor || '#0d9488'}60`,
                  borderTopWidth: '2px',
                }}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {formData.logoUrl && !logoImgError ? (
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden">
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: formData.primaryBrandColor || '#0d9488' }}
                      >
                        <Waves className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-heading font-bold text-xs text-white">
                        {formData.name}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin 
                          className="w-3 h-3" 
                          style={{ color: formData.primaryBrandColor || '#0d9488' }} 
                        />
                        {formData.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: formData.primaryBrandColor || '#0d9488' }}
                    >
                      Guest Booking Flow
                    </span>
                    <span className="text-[10px] text-slate-400 px-2 py-1">
                      Admin Operations
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>© {new Date().getFullYear()} {formData.name}</span>
                  <span className="text-slate-400">Dynamic styling applied</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Customizer Card: Corner Radii, Borders & Shadows */}
          <ThemeCustomizerCard
            settings={formData}
            onChange={(updatedTheme) => handleFieldChange('themeConfig', updatedTheme)}
          />

          {renderSectionFooter()}
        </div>
      )}

      {/* TAB 2: UI THEME & GEOMETRY */}
      {activeSection === 'theme' && (
        <div className="space-y-6">
          <ThemeCustomizerCard
            settings={formData}
            onChange={(updatedTheme) => handleFieldChange('themeConfig', updatedTheme)}
            showSaveButton={true}
            onSave={() => handleSave()}
          />

          {renderSectionFooter()}
        </div>
      )}

      {/* TAB 3: HOSTEL IDENTITY & STATUS */}
      {activeSection === 'identity' && (
        <div className="space-y-6">
          {/* Admin Country & City Selector for Booking Form & Ocean Weather */}
          <AdminFormCountryCityCard
            settings={formData}
            onSaveSettings={(newSettings) => {
              setFormData(newSettings);
              onSaveSettings(newSettings);
              showToast('Booking form country and city updated successfully!');
            }}
            onSelectOceanSpot={onSelectOceanSpot}
          />

          {/* System Language & Guest WhatsApp Language Toggle */}
          <AdminLanguageSettingsCard
            settings={formData}
            onUpdateLanguage={(newLang) => {
              handleFieldChange('defaultLanguage', newLang);
              onSaveSettings({ ...formData, defaultLanguage: newLang });
            }}
            onSave={() => handleSave()}
          />

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <h4 className="font-heading font-extrabold text-base text-slate-900">
                  Hostel Profile & Live Operating Status
                </h4>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                formData.operatingStatus === 'open' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : formData.operatingStatus === 'seasonal_break'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  formData.operatingStatus === 'open' ? 'bg-emerald-500' : formData.operatingStatus === 'seasonal_break' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                {formData.operatingStatus === 'open' ? 'Live & Open' : formData.operatingStatus === 'seasonal_break' ? 'Seasonal Break' : 'Under Maintenance'}
              </span>
            </div>

            {/* Operating Status Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Current Operational Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleFieldChange('operatingStatus', 'open')}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                    formData.operatingStatus === 'open'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Open & Booking</div>
                    <div className="text-[11px] text-slate-500">Regular hostel operations, instant reservations open.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFieldChange('operatingStatus', 'seasonal_break')}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                    formData.operatingStatus === 'seasonal_break'
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Seasonal Break</div>
                    <div className="text-[11px] text-slate-500">Winter break or seasonal downtime alert shown.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFieldChange('operatingStatus', 'maintenance')}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                    formData.operatingStatus === 'maintenance'
                      ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Maintenance Mode</div>
                    <div className="text-[11px] text-slate-500">Property upgrades or renovation notice active.</div>
                  </div>
                </button>
              </div>
            </div>

            {formData.operatingStatus !== 'open' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Public Notice Banner Message
                </label>
                <input
                  type="text"
                  placeholder="e.g. WaveHaven is undergoing surf lounge renovations until April 1st!"
                  value={formData.maintenanceNotice || ''}
                  onChange={(e) => handleFieldChange('maintenanceNotice', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hostel Trade Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline & Motto</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleFieldChange('tagline', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>
            </div>

            {/* Address & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> Physical Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-teal-600" /> Region / Coastal Town
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>
            </div>

            {/* Contacts & Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-rose-500" /> 24/7 Duty Emergency Line
                </label>
                <input
                  type="text"
                  placeholder="351918765432"
                  value={formData.emergencyPhone || ''}
                  onChange={(e) => handleFieldChange('emergencyPhone', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> System Timezone
                </label>
                <select
                  value={formData.timezone || 'Europe/Lisbon'}
                  onChange={(e) => handleFieldChange('timezone', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="Europe/Lisbon">Europe/Lisbon (WET/WEST - Portugal / UK)</option>
                  <option value="Europe/Madrid">Europe/Madrid (CET - Spain / France)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                  <option value="Asia/Bali">Asia/Makassar / Bali (WITA)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> Google Maps Directions URL
              </label>
              <input
                type="url"
                value={formData.googleMapsUrl}
                onChange={(e) => handleFieldChange('googleMapsUrl', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-teal-700"
              />
            </div>
          </div>
          {renderSectionFooter()}
        </div>
      )}

      {/* TAB: LANGUAGE & TRANSLATIONS */}
      {activeSection === 'language' && (
        <div className="space-y-6">
          <AdminLanguageSettingsCard
            settings={formData}
            onUpdateLanguage={(newLang) => {
              handleFieldChange('defaultLanguage', newLang);
              onSaveSettings({ ...formData, defaultLanguage: newLang });
            }}
            onSave={() => handleSave()}
          />
          {renderSectionFooter()}
        </div>
      )}

      {/* TAB 2: STAY & HOUSE POLICIES */}
      {activeSection === 'policies' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <h4 className="font-heading font-extrabold text-base text-slate-900">
                Stay Lengths, Curfew & Reservation Policies
              </h4>
            </div>

            {/* Check-in & Quiet Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> Standard Check-in Time
                </label>
                <input
                  type="text"
                  placeholder="14:00"
                  value={formData.checkInTime}
                  onChange={(e) => handleFieldChange('checkInTime', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Displayed to guests on vouchers and reminders.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Standard Check-out Time
                </label>
                <input
                  type="text"
                  placeholder="11:00"
                  value={formData.checkOutTime}
                  onChange={(e) => handleFieldChange('checkOutTime', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Housekeeping begins immediately after.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dorm Quiet Hours</label>
                <input
                  type="text"
                  placeholder="23:00 - 08:00"
                  value={formData.quietHours || '23:00 - 08:00'}
                  onChange={(e) => handleFieldChange('quietHours', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Enforced in shared dormitories & hallways.</p>
              </div>
            </div>

            {/* Stay Limits & Group size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Minimum Stay (Nights)</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={formData.minStayNights || 1}
                  onChange={(e) => handleFieldChange('minStayNights', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maximum Stay Limit (Nights)</label>
                <input
                  type="number"
                  min="3"
                  max="90"
                  value={formData.maxStayNights || 30}
                  onChange={(e) => handleFieldChange('maxStayNights', parseInt(e.target.value) || 30)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Guests Per Single Booking</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={formData.maxGuestsPerBooking || 8}
                  onChange={(e) => handleFieldChange('maxGuestsPerBooking', parseInt(e.target.value) || 8)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>
            </div>

            {/* Age Policy & Cancellation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Age Restriction</label>
                <select
                  value={formData.ageRestriction || '18_plus'}
                  onChange={(e) => handleFieldChange('ageRestriction', e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="all_ages">All Ages (Family & Children Friendly)</option>
                  <option value="18_plus">18+ Only (Adults & Solo Backpackers)</option>
                  <option value="21_plus">21+ Only</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cancellation Terms</label>
                <select
                  value={formData.cancellationPolicy || 'flexible_48h'}
                  onChange={(e) => handleFieldChange('cancellationPolicy', e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="flexible_48h">Flexible: Free cancellation up to 48 hours prior</option>
                  <option value="moderate_7d">Moderate: Free cancellation up to 7 days prior</option>
                  <option value="strict_14d">Strict: 50% refund up to 14 days prior, non-refundable after</option>
                </select>
              </div>
            </div>

            {/* House Rules Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  House Rules & Surf Etiquette
                </label>
                <span className="text-[11px] text-slate-400">Included in guest check-in guides</span>
              </div>
              <textarea
                rows={4}
                value={formData.houseRules || ''}
                onChange={(e) => handleFieldChange('houseRules', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-mono text-[11px] leading-relaxed"
                placeholder="List house rules, board washing guidelines, kitchen cleanup, etc."
              />
            </div>
          </div>

          {/* Auto-cancel unpaid reservations policy card */}
          <AutoCancelUnpaidSettingsCard
            settings={formData}
            bookings={bookings}
            onFieldChange={handleFieldChange}
            onBatchUpdateBookings={onBatchUpdateBookings}
            showToast={showToast}
          />

          {renderSectionFooter()}
        </div>
      )}

      {/* TAB 3: FINANCE, RATES & TAXES */}
      {activeSection === 'finance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <h4 className="font-heading font-extrabold text-base text-slate-900">
                Currency, Hospitality Tax & Reception Payment Configuration
              </h4>
            </div>

            {/* Currency & Tax */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ISO Currency Code</label>
                <input
                  type="text"
                  placeholder="EUR"
                  value={formData.currency}
                  onChange={(e) => handleFieldChange('currency', e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  placeholder="€"
                  value={formData.currencySymbol}
                  onChange={(e) => handleFieldChange('currencySymbol', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-center text-base"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hospitality Tax %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="35"
                  value={formData.taxRatePercent}
                  onChange={(e) => handleFieldChange('taxRatePercent', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Included in room & total calculations.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-600" /> Key / Locker Deposit ({formData.currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.keyDepositAmount ?? 20}
                  onChange={(e) => handleFieldChange('keyDepositAmount', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Refundable at checkout.</p>
              </div>
            </div>

            {/* Deposit Requirement */}
            <div>
              <label className="block font-semibold text-slate-700 mb-2">
                Online Reservation Deposit Requirement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: 0, label: '0% Deposit (Pay at Check-in)' },
                  { val: 20, label: '20% Standard Hold' },
                  { val: 50, label: '50% High Season Deposit' },
                  { val: 100, label: '100% Full Prepayment' },
                ].map((dep) => (
                  <button
                    key={dep.val}
                    type="button"
                    onClick={() => handleFieldChange('depositRequirementPercent', dep.val)}
                    className={`p-2.5 rounded-2xl border text-center font-bold transition-all ${
                      (formData.depositRequirementPercent ?? 0) === dep.val
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {dep.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-cancel unpaid reservations setting card */}
            <AutoCancelUnpaidSettingsCard
              settings={formData}
              bookings={bookings}
              onFieldChange={handleFieldChange}
              onBatchUpdateBookings={onBatchUpdateBookings}
              showToast={showToast}
            />

            {/* Accepted Payment Methods */}
            <div>
              <label className="block font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                Accepted Front Desk Payment Methods
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'cash', label: 'Cash (Euros / Local)' },
                  { id: 'card', label: 'Visa / Mastercard / Amex' },
                  { id: 'mbway', label: 'MBWay (Portugal)' },
                  { id: 'multibanco', label: 'Multibanco Reference' },
                  { id: 'paypal', label: 'PayPal' },
                  { id: 'revolut', label: 'Revolut Pay / QR' },
                  { id: 'bank_transfer', label: 'Bank Wire Transfer' },
                ].map((item) => {
                  const isSelected = (formData.acceptedPaymentMethods || ['cash', 'card', 'mbway', 'revolut']).includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePaymentMethod(item.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bank Transfer Details */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bank Transfer Details (IBAN / Wire Instruction)
              </label>
              <textarea
                rows={2}
                value={formData.bankTransferDetails || ''}
                onChange={(e) => handleFieldChange('bankTransferDetails', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-mono text-[11px]"
                placeholder="IBAN: PT50 ... | BIC: ... | Beneficiary: ..."
              />
            </div>
          </div>
          {renderSectionFooter()}
        </div>
      )}

      {/* TAB 4: SURF SCHOOL & AMENITIES */}
      {activeSection === 'surf' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Waves className="w-4 h-4 text-teal-600" />
              <h4 className="font-heading font-extrabold text-base text-slate-900">
                Surf Operations, Spot Forecast & Hostel Wi-Fi
              </h4>
            </div>

            {/* Surf coaching times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> Morning Surf Coaching Session Time
                </label>
                <input
                  type="text"
                  placeholder="09:30"
                  value={formData.morningSurfSessionTime || '09:30'}
                  onChange={(e) => handleFieldChange('morningSurfSessionTime', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Van departure from hostel driveway.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> Afternoon / Sunset Surf Session Time
                </label>
                <input
                  type="text"
                  placeholder="14:30"
                  value={formData.afternoonSurfSessionTime || '14:30'}
                  onChange={(e) => handleFieldChange('afternoonSurfSessionTime', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Afternoon ocean tide & wind coaching window.</p>
              </div>
            </div>

            {/* Surf Forecast URL */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Surf Forecast & Beach Cam Link (Magicseaweed / Surfline)</span>
                {formData.surfForecastUrl && (
                  <a
                    href={formData.surfForecastUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <ExternalLink className="w-3 h-3" /> Test Link
                  </a>
                )}
              </label>
              <input
                type="url"
                placeholder="https://surfline.com/surf-report/..."
                value={formData.surfForecastUrl || ''}
                onChange={(e) => handleFieldChange('surfForecastUrl', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold font-mono text-teal-700"
              />
            </div>

            {/* Wi-Fi Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Wifi className="w-4 h-4 text-teal-600" />
                <span>Guest High-Speed Wi-Fi Credentials</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Automatically rendered in guest upcoming stay reminders, vouchers, and the lounge check-in portal.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Wi-Fi Network SSID</label>
                  <input
                    type="text"
                    placeholder="WaveHaven-Guest-5G"
                    value={formData.wifiNetworkName || ''}
                    onChange={(e) => handleFieldChange('wifiNetworkName', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Wi-Fi Password</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="CatchWaves2026"
                      value={formData.wifiPassword || ''}
                      onChange={(e) => handleFieldChange('wifiPassword', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold font-mono pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.wifiPassword || '', 'Wi-Fi Password')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-[10px] text-slate-700 flex items-center gap-1"
                    >
                      {copiedKey === 'Wi-Fi Password' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Liability Waiver */}
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requireWaiver ?? true}
                onChange={(e) => handleFieldChange('requireWaiver', e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-900">Enforce Water Sports & Surf Liability Waiver</span>
                <p className="text-slate-500 text-[11px]">
                  Instruct front desk to collect physical or digital waiver signatures before releasing surf boards and wetsuits.
                </p>
              </div>
            </label>
          </div>
          {renderSectionFooter()}
        </div>
      )}

      {/* TAB: BOOKING FORM BUILDER */}
      {activeSection === 'bookingBuilder' && (
        <div className="space-y-6">
          {/* Admin Country & City Location for the Booking Form */}
          <AdminFormCountryCityCard
            settings={formData}
            onSaveSettings={(newSettings) => {
              setFormData(newSettings);
              onSaveSettings(newSettings);
              showToast('Booking form country and city location updated successfully!');
            }}
            onSelectOceanSpot={onSelectOceanSpot}
          />

          <BookingFormBuilder
            settings={formData}
            rooms={rooms}
            addOns={addOns}
            onSaveFormConfig={(newConfig) => {
              handleFieldChange('bookingFormConfig', newConfig);
              const updated = { ...formData, bookingFormConfig: newConfig };
              onSaveSettings(updated);
              showToast('Booking form configuration saved successfully!');
            }}
          />
          {renderSectionFooter()}
        </div>
      )}

      {/* TAB 5: WHATSAPP & ROUTING */}
      {activeSection === 'whatsapp' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <h4 className="font-heading font-extrabold text-base text-slate-900">
                Direct WhatsApp Booking & Guest Notifications (Zero API Required)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> Hostel WhatsApp Reception Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="351912345678 (Country code + digits, no + or spaces)"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold font-mono text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  All 1-click reservations from guests are pre-formatted and sent directly to this number.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> Upcoming Stay Reminder Trigger
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={formData.autoRemindDaysBefore || 2}
                    onChange={(e) => handleFieldChange('autoRemindDaysBefore', parseInt(e.target.value) || 2)}
                    className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                  <span className="font-semibold text-slate-600">days before check-in date</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Highlights reservations needing reminder dispatch in the admin notifications center.
                </p>
              </div>

              {/* Automated Email Receipt Drafts Toggle */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="toggle-auto-email-receipts" className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                    <Mail className="w-4 h-4 text-teal-700" />
                    <span>Automated Email Receipt Drafts</span>
                  </label>
                  <button
                    id="toggle-auto-email-receipts"
                    type="button"
                    onClick={() => handleFieldChange('autoEmailReceiptDraftEnabled', !(formData.autoEmailReceiptDraftEnabled ?? true))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-teal-500/20 ${
                      (formData.autoEmailReceiptDraftEnabled ?? true) ? 'bg-teal-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        (formData.autoEmailReceiptDraftEnabled ?? true) ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  When enabled, an itemized email receipt draft mirroring the WhatsApp confirmation voucher layout is automatically compiled for guests and ready in the Notifications Manager.
                </p>
              </div>
            </div>

            {/* Greeting */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Custom WhatsApp Greeting Phrase
              </label>
              <input
                type="text"
                placeholder="Aloha from WaveHaven Surf House!"
                value={formData.customWhatsAppGreeting || ''}
                onChange={(e) => handleFieldChange('customWhatsAppGreeting', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
              />
            </div>

            {/* Quick WhatsApp Test Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Verify that your number opens correctly in WhatsApp Web or WhatsApp Mobile:
              </div>
              <a
                href={createWhatsAppUrl(formData.phone, `🤙 Test Ping from ${formData.name} Admin System!`)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test Open WhatsApp Desk</span>
              </a>
            </div>
          </div>

          {/* Visual WhatsApp Message Template Builder */}
          <WhatsAppTemplateBuilder
            settings={formData}
            bookings={bookings}
            rooms={rooms}
            addOns={addOns}
            templates={templates}
            onUpdateTemplate={onUpdateTemplate}
          />

          {/* WhatsApp Auto-Responders Section */}
          <AutoRespondersSection
            settings={formData}
            bookings={bookings}
            rooms={rooms}
            addOns={addOns}
            onShowToast={showToast}
            onSaveSettings={handleSave}
          />

          {renderSectionFooter()}
        </div>
      )}

      {/* TAB: INVOICE & RECEIPT BUILDER */}
      {activeSection === 'invoices' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
                  style={{ backgroundColor: formData.invoiceTemplateConfig?.accentColor || formData.primaryBrandColor || '#0d9488' }}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-base text-slate-900">
                    Official Invoice & Receipt Template Builder
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Configure document titles, fiscal tax identifiers, custom accent palette, and functional receipt blocks with real-time A4 preview.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceBuilderModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Launch Visual Builder</span>
                </button>
              </div>
            </div>

            {/* Quick Presets Grid */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Quick Template Presets
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {INVOICE_TEMPLATE_PRESETS.map((preset) => {
                  const isCurrent = (formData.invoiceTemplateConfig?.name || DEFAULT_INVOICE_TEMPLATE.name) === preset.template.name;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        const updated = {
                          ...preset.template,
                          updatedAt: new Date().toISOString(),
                        };
                        handleFieldChange('invoiceTemplateConfig', updated);
                        showToast(`Applied preset: ${preset.label}`);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isCurrent 
                          ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-heading font-bold text-xs text-slate-900">
                          {preset.label}
                        </span>
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: preset.template.accentColor || '#0d9488' }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {preset.description}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{preset.template.invoiceNumberPrefix}-...</span>
                        {isCurrent && (
                          <span className="text-teal-700 font-bold bg-teal-100 px-1.5 py-0.2 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Configuration Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Document Title</span>
                <span className="font-bold text-slate-800">{formData.invoiceTemplateConfig?.title || 'OFFICIAL INVOICE'}</span>
                <span className="text-[11px] text-slate-500 block truncate">{formData.invoiceTemplateConfig?.subtitle || 'Surf House & Ocean Lodge'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Prefix</span>
                <span className="font-mono font-bold text-slate-800">{formData.invoiceTemplateConfig?.invoiceNumberPrefix || 'INV'}</span>
                <span className="text-[11px] text-slate-500 block">Sample: {formData.invoiceTemplateConfig?.invoiceNumberPrefix || 'INV'}-2026-WH8492</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tax / NIF Identification</span>
                <span className="font-mono font-bold text-slate-800">{formData.invoiceTemplateConfig?.taxIdNumber || 'PT 509 876 543'}</span>
                <span className="text-[11px] text-slate-500 block">{formData.invoiceTemplateConfig?.taxIdLabel || 'NIF / VAT'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Blocks</span>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {formData.invoiceTemplateConfig?.showQrCode && (
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">QR Code</span>
                  )}
                  {formData.invoiceTemplateConfig?.showSurfLevel && (
                    <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-1.5 py-0.2 rounded">Surf Level</span>
                  )}
                  {formData.invoiceTemplateConfig?.showWifiDetails && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Wi-Fi</span>
                  )}
                  {formData.invoiceTemplateConfig?.showReceptionSeal && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">Seal Stamp</span>
                  )}
                  {formData.invoiceTemplateConfig?.showBankDetails && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">Bank Wire</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Invoice Template Builder */}
          {isInvoiceBuilderModalOpen && (
            <InvoiceTemplateBuilder
              settings={formData}
              bookings={bookings}
              rooms={rooms}
              addOns={addOns}
              isOpen={isInvoiceBuilderModalOpen}
              onClose={() => setIsInvoiceBuilderModalOpen(false)}
              onSaveTemplate={(newConfig) => {
                handleFieldChange('invoiceTemplateConfig', newConfig);
                const updated = { ...formData, invoiceTemplateConfig: newConfig };
                onSaveSettings(updated);
                showToast('Invoice template saved and synchronized!');
                setIsInvoiceBuilderModalOpen(false);
              }}
            />
          )}

          {renderSectionFooter()}
        </div>
      )}

      {/* TAB 6: WEBHOOKS & API SUITE */}
      {activeSection === 'webhook' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Webhook className="w-4 h-4 text-teal-600" />
                <div>
                  <h4 className="font-heading font-extrabold text-base text-slate-900">
                    Lightweight Webhook & Real-time Event System
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Forward booking records in real-time to Discord, Zapier, Make, n8n, Google Sheets, or Slack.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={formData.webhookEnabled}
                  onChange={(e) => handleFieldChange('webhookEnabled', e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="font-bold text-slate-800 text-xs">Webhook Active</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Webhook Endpoint URL</label>
                <input
                  type="url"
                  placeholder="https://webhook.site/your-id or https://discord.com/api/webhooks/..."
                  value={formData.webhookUrl}
                  onChange={(e) => handleFieldChange('webhookUrl', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Webhook Secret Token (Optional Bearer / X-Webhook-Secret)
                </label>
                <input
                  type="text"
                  placeholder="whsec_custom_secret_key"
                  value={formData.webhookSecret || ''}
                  onChange={(e) => handleFieldChange('webhookSecret', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs font-semibold"
                />
              </div>
            </div>

            {/* Event trigger filters */}
            <div>
              <label className="block font-semibold text-slate-700 mb-2">
                Automated Event Dispatch Subscriptions
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    key: 'onBookingCreated',
                    label: 'New Reservation Created (Guest & Admin)',
                    desc: 'Fires immediately when a booking is confirmed.',
                  },
                  {
                    key: 'onBookingStatusChange',
                    label: 'Stay Status Changed (Checked in / Checked out)',
                    desc: 'Fires when front desk updates guest status.',
                  },
                  {
                    key: 'onReminderSent',
                    label: 'Pre-Arrival Reminder Dispatched',
                    desc: 'Fires when WhatsApp stay reminder is sent.',
                  },
                  {
                    key: 'onCancellation',
                    label: 'Booking Cancelled',
                    desc: 'Fires when reservation is voided or cancelled.',
                  },
                ].map((ev) => {
                  const evEvents = formData.webhookEvents || {
                    onBookingCreated: true,
                    onBookingStatusChange: true,
                    onReminderSent: true,
                    onCancellation: true,
                  };
                  const isChecked = (evEvents as any)[ev.key] ?? true;

                  return (
                    <label key={ev.key} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          handleFieldChange('webhookEvents', {
                            ...evEvents,
                            [ev.key]: e.target.checked,
                          });
                        }}
                        className="w-4 h-4 text-teal-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{ev.label}</div>
                        <div className="text-[11px] text-slate-500">{ev.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Test Webhook Action */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isTestingWebhook || !formData.webhookUrl}
                onClick={handleTestWebhook}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold flex items-center gap-2 transition-all shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-spin' : ''}`} />
                <span>{isTestingWebhook ? 'Pinging Webhook...' : 'Fire Live Webhook Test Event'}</span>
              </button>

              {testResult && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold ${
                  testResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                  <span>{testResult.message}</span>
                </span>
              )}
            </div>
          </div>

          {/* Webhook Delivery Log Inspector */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-heading font-extrabold text-sm text-slate-900">
                  Webhook Event Dispatch History
                </h4>
                <p className="text-[11px] text-slate-400">
                  Last {logs.length} webhook payloads logged with status and response latency.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Filter */}
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700"
                >
                  <option value="all">All Logs ({logs.length})</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="simulated">Simulated / Disabled</option>
                </select>

                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                    title="Clear Log History"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                No webhook logs matching the filter. Use "Fire Live Webhook Test Event" above to dispatch a test payload.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        log.status === 'success' 
                          ? 'bg-emerald-500' 
                          : log.status === 'simulated' 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500'
                      }`} />
                      <span className="font-bold text-slate-900">{log.event}</span>
                      <span className="text-slate-500 truncate text-[11px]">{log.payloadSummary}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[10px] text-slate-400">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                        log.status === 'success' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : log.status === 'simulated'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {renderSectionFooter()}
        </div>
      )}

      {/* CLOUD & SERVER DEPLOYMENT (VERCEL, SUPABASE, DOCKER) */}
      {activeSection === 'cloud' && (
        <div className="space-y-6">
          {/* Top Overview Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-700/60 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Universal Production Ready</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                Vercel, Supabase & Cloud Server Deployment
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                WaveHaven is architected to deploy seamlessly to <strong>Vercel</strong>, <strong>Supabase PostgreSQL</strong>, <strong>Docker</strong>, <strong>Railway</strong>, <strong>Render</strong>, or any Node.js Linux server with zero lock-in.
              </p>
            </div>
            <div className="absolute right-6 -bottom-10 opacity-10 text-white pointer-events-none hidden md:block">
              <Server className="w-64 h-64" />
            </div>
          </div>

          {/* Live Production vs Demo Sandbox Controller */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                  formData.environmentMode === 'live' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-amber-500 shadow-amber-500/20'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-heading font-extrabold text-base text-slate-900">
                      Environment: {formData.environmentMode === 'live' ? 'Live Production Mode' : 'Demo Sandbox Mode'}
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1.5 ${
                      formData.environmentMode === 'live'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${formData.environmentMode === 'live' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
                      {formData.environmentMode === 'live' ? 'LIVE PRODUCTION' : 'DEMO SANDBOX'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {formData.environmentMode === 'live'
                      ? 'Operating in real public guest mode. Real bookings are processed, WhatsApp reservation vouchers are sent, and data syncs with your live Supabase cloud database.'
                      : 'Operating with preloaded sample data for testing, client previews, and front desk staff training.'}
                  </p>
                </div>
              </div>

              {/* Mode Toggle Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-toggle-live-environment"
                  onClick={() => {
                    const nextMode = formData.environmentMode === 'live' ? 'demo' : 'live';
                    handleFieldChange('environmentMode', nextMode);
                    const updated = { ...formData, environmentMode: nextMode };
                    onSaveSettings(updated);
                    showToast(`Operating mode switched to ${nextMode.toUpperCase()}!`);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                    formData.environmentMode === 'live'
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{formData.environmentMode === 'live' ? 'Switch to Demo Sandbox' : 'Activate Live Production Mode'}</span>
                </button>
              </div>
            </div>

            {/* Quick Action Buttons for Go-Live & Demo Control */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Go Live: Purge Demo Bookings */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Go Live: Clean Slate for Real Guests</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">0 Reservations</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Purges sample/demo bookings and waitlists while <strong>keeping all your rooms, prices, add-ons, and policies intact</strong>. Perfect when launching the app to real guests.
                  </p>
                </div>
                {isConfirmingPurge ? (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      id="btn-confirm-purge-demo"
                      onClick={() => {
                        purgeDemoBookingsForLiveLaunch();
                        setIsConfirmingPurge(false);
                        showToast('Demo bookings purged! System is clean for Live Production guests.');
                        if (onBatchUpdateBookings) onBatchUpdateBookings([]);
                        handleFieldChange('environmentMode', 'live');
                        onSaveSettings({ ...formData, environmentMode: 'live' });
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
                    >
                      Confirm: Clear Demo Bookings
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingPurge(false)}
                      className="py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="btn-purge-demo-bookings"
                    onClick={() => setIsConfirmingPurge(true)}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Sample Bookings (Prepare Live)</span>
                  </button>
                )}
              </div>

              {/* Seed Demo Bookings for Testing */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                      <span>Load Rich Demo Bookings</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Sample Roster</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Populate the system with realistic guest bookings, calendar occupancy, and waitlist requests for demonstration, screenshots, or staff training.
                  </p>
                </div>
                {isConfirmingSeed ? (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      id="btn-confirm-load-demo"
                      onClick={() => {
                        seedDemoBookingsForTesting();
                        setIsConfirmingSeed(false);
                        showToast('Sample demo bookings reloaded!');
                        handleFieldChange('environmentMode', 'demo');
                        onSaveSettings({ ...formData, environmentMode: 'demo' });
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
                    >
                      Confirm: Load Demo Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingSeed(false)}
                      className="py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="btn-load-demo-bookings"
                    onClick={() => setIsConfirmingSeed(true)}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Load Demo Bookings Roster</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vercel Deployment Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
                      ▲
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-slate-900 text-sm">
                        Vercel Deployment & SPA Routing
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Zero-config edge deployment with clean URL rewrites
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Configured (vercel.json)
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  The project includes a production <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">vercel.json</code> with Single Page Application rewrites. Deep links, guest booking IDs, and admin portals route smoothly without 404 errors.
                </p>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
                    <span>Vercel Build Specifications</span>
                    <span className="text-emerald-600 font-bold">READY</span>
                  </div>
                  <div className="text-slate-800 space-y-1">
                    <div><strong>Framework:</strong> Vite / React</div>
                    <div><strong>Build Command:</strong> <span className="text-teal-700">npm run build</span></div>
                    <div><strong>Output Directory:</strong> <span className="text-teal-700">dist</span></div>
                    <div><strong>Install Command:</strong> <span className="text-teal-700">npm install</span></div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Configuration file active:</span>
                  <span className="font-mono font-bold text-slate-800">/vercel.json</span>
                </div>
              </div>
            </div>

            {/* Supabase PostgreSQL Integration Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#3ecf8e]/10 text-[#3ecf8e] flex items-center justify-center font-bold text-base border border-[#3ecf8e]/30">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-slate-900 text-sm">
                      Supabase Cloud Database
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      PostgreSQL database with Row Level Security (RLS)
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  supabaseConfig.isConfigured 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {supabaseConfig.isConfigured ? 'Supabase Active' : 'Local State Mode'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKeyInput}
                    onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                {supabaseTestState.result && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    supabaseTestState.result.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {supabaseTestState.result.success ? <Check className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                    <span>{supabaseTestState.result.message}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={supabaseTestState.testing || !supabaseUrlInput}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50"
                  >
                    {supabaseTestState.testing ? 'Testing...' : 'Test Connection'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSupabaseConfig}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs"
                  >
                    Save Config
                  </button>

                  {supabaseConfig.isConfigured && (
                    <button
                      type="button"
                      onClick={handleClearSupabase}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs transition-all"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Database Schema Migration Generator */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" />
                <div>
                  <h4 className="font-heading font-extrabold text-base text-slate-900">
                    Supabase PostgreSQL Database Schema
                  </h4>
                  <p className="text-xs text-slate-500">
                    1-Click SQL migration script containing all tables, indexes, and row-level security (RLS)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCopy(generateSupabaseSQL(), 'Supabase SQL Schema');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  {copiedKey === 'Supabase SQL Schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy SQL</span>
                </button>

                <button
                  type="button"
                  onClick={downloadSupabaseSchemaSQL}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql Migration</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { name: 'hostel_settings', desc: 'Hostel brand & rules' },
                { name: 'rooms', desc: 'Dorms, suites & pricing' },
                { name: 'surf_addons', desc: 'Lessons & gear rental' },
                { name: 'bookings', desc: 'Reservations & vouchers' },
                { name: 'waitlist', desc: 'Waitlist inquiries' },
                { name: 'custom_translations', desc: 'Multi-lingual strings' },
                { name: 'invoice_templates', desc: 'A4 & WhatsApp styles' },
                { name: 'rls_policies', desc: 'Row Level Security' },
              ].map(table => (
                <div key={table.name} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-mono font-bold text-teal-800 text-[11px] truncate">
                    {table.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {table.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* SQL Snippet Preview Box */}
            <div className="p-4 bg-slate-900 rounded-2xl text-emerald-400 font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed border border-slate-800">
              <pre>{generateSupabaseSQL().slice(0, 1000)}... [Download for full script]</pre>
            </div>
          </div>

          {/* Universal Self-Hosted Server / Docker Deployment */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-slate-700" />
              <h4 className="font-heading font-extrabold text-base text-slate-900">
                Any Server Deployment (Docker, VPS, Railway, Render)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">1. Build Artifacts</span>
                <p className="text-slate-500 text-[11px]">Compile TypeScript and bundle high-performance static assets into /dist.</p>
                <code className="block p-2 bg-slate-900 text-teal-300 rounded-xl font-mono text-[11px]">
                  npm run build
                </code>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">2. Production Preview / Serve</span>
                <p className="text-slate-500 text-[11px]">Start lightweight Node or Express server serving dist assets with compression.</p>
                <code className="block p-2 bg-slate-900 text-teal-300 rounded-xl font-mono text-[11px]">
                  npm run preview
                </code>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">3. Container / Docker</span>
                <p className="text-slate-500 text-[11px]">Package into multi-stage Alpine Docker container for Kubernetes or Cloud Run.</p>
                <code className="block p-2 bg-slate-900 text-teal-300 rounded-xl font-mono text-[11px]">
                  docker build -t wavehaven .
                </code>
              </div>
            </div>
          </div>

          {renderSectionFooter()}
        </div>
      )}
      {activeSection === 'system' && (
        <div className="space-y-6">
          {/* Health Diagnostics */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-600" />
                <h4 className="font-heading font-extrabold text-base text-slate-900">
                  System Diagnostics & Local Storage Metrics
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Last verified: {diagnostics.lastSync}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-center">
                <div className="text-xl font-extrabold font-heading text-slate-900">{rooms.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">Active Rooms / Dorms</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-center">
                <div className="text-xl font-extrabold font-heading text-slate-900">{bookings.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">Guest Bookings</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-center">
                <div className="text-xl font-extrabold font-heading text-slate-900">{addOns.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">Surf Add-ons</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-center">
                <div className="text-xl font-extrabold font-heading text-slate-900">{templates.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">Notification Templates</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-center col-span-2 sm:col-span-1">
                <div className="text-xl font-extrabold font-heading text-teal-600">{diagnostics.kbUsed} KB</div>
                <div className="text-[11px] font-semibold text-slate-500">Storage Used</div>
              </div>
            </div>
          </div>

          {/* Backup, Import & Export Actions */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Download className="w-4 h-4 text-teal-600" />
              <h4 className="font-heading font-extrabold text-base text-slate-900">
                Backup, Export & Database Migration
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full JSON Backup */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-600" />
                  Full System JSON Backup
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Generates an all-in-one JSON snapshot containing your complete rooms inventory, guest reservations, surf add-on packages, WhatsApp templates, and system preferences.
                </p>
                <button
                  type="button"
                  onClick={handleExportFullSystemJSON}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full System JSON Snapshot</span>
                </button>
              </div>

              {/* Restore JSON Backup */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-teal-600" />
                  Restore System from Backup File
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Upload a previously downloaded WaveHaven JSON backup file to instantly restore room states, bookings, and configuration.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select & Restore JSON Backup File</span>
                </button>
              </div>

              {/* Bookings CSV Export */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Export Bookings Spreadsheet (CSV)
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Exports all active reservations into standard CSV format suitable for Microsoft Excel, Google Sheets, or tax reporting.
                </p>
                <button
                  type="button"
                  onClick={handleExportBookingsCSV}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export All Bookings to CSV</span>
                </button>
              </div>

              {/* Factory Reset */}
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-3">
                <div className="font-bold text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Factory Reset & Demo Purge
                </div>
                <p className="text-rose-700/80 text-[11px] leading-relaxed">
                  Erases local changes and re-seeds the application back to initial Ericeira Surf House factory defaults.
                </p>
                {isConfirmingReset ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all text-xs"
                    >
                      Yes, Reset Everything
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingReset(false)}
                      className="py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-all text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingReset(true)}
                    className="w-full py-2 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset to Factory Defaults...</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          {renderSectionFooter()}
        </div>
      )}
    </div>
  );
};
