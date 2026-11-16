import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Check, Copy, RefreshCw, Sparkles, Sliders, Eye, 
  Printer, X, ShieldCheck, MapPin, Bed, Phone, Mail, QrCode, 
  CheckCircle2, Waves, Building2, Palette, Layers, HelpCircle, 
  RotateCcw, Download, Save, Undo, ExternalLink, Bookmark,
  MessageSquare, Send, Smartphone, CheckCheck, ChevronLeft,
  ChevronRight, Info, Tag, ToggleLeft, ToggleRight, ArrowUpRight, Share2
} from 'lucide-react';
import { Booking, HostelSettings, InvoiceTemplateConfig, Room, SurfAddOn } from '../../types';
import { DEFAULT_INVOICE_TEMPLATE, INVOICE_TEMPLATE_PRESETS, INITIAL_BOOKINGS, INITIAL_ROOMS, INITIAL_ADDONS } from '../../data/initialData';
import { formatDisplayDate } from '../../utils/date';
import { getInvoiceNumber, getReservationUrl, formatWhatsAppInvoiceMessage } from '../../utils/invoice';
import { createWhatsAppUrl, formatSurfLevel } from '../../utils/whatsapp';
import { saveStoredInvoiceTemplate, getStoredInvoiceTemplate } from '../../utils/storage';

interface InvoiceTemplateBuilderProps {
  settings: HostelSettings;
  bookings?: Booking[];
  rooms?: Room[];
  addOns?: SurfAddOn[];
  isOpen?: boolean;
  onClose?: () => void;
  onSaveTemplate?: (config: InvoiceTemplateConfig) => void;
  initialTemplate?: InvoiceTemplateConfig;
}

const ACCENT_COLOR_PRESETS = [
  { name: 'Wave Teal', hex: '#0d9488' },
  { name: 'Ocean Cyan', hex: '#0284c7' },
  { name: 'Corporate Slate', hex: '#1e293b' },
  { name: 'Sunset Coral', hex: '#ea580c' },
  { name: 'Forest Emerald', hex: '#059669' },
  { name: 'Deep Indigo', hex: '#4338ca' },
  { name: 'Berry Rose', hex: '#e11d48' },
  { name: 'Golden Amber', hex: '#d97706' },
];

const VARIABLE_TAG_SUGGESTIONS = [
  { tag: '{guestName}', label: 'Full Guest Name', example: 'Lucas Silva' },
  { tag: '{guestFirstName}', label: 'First Name Only', example: 'Lucas' },
  { tag: '{invoiceNumber}', label: 'Invoice #', example: 'INV-2026-WH8492' },
  { tag: '{referenceNumber}', label: 'Booking Ref', example: 'WH-8492' },
  { tag: '{roomName}', label: 'Room / Bed', example: 'Sunset Ocean Suite' },
  { tag: '{checkInDate}', label: 'Check-In Date', example: 'Sep 24, 2026' },
  { tag: '{checkOutDate}', label: 'Check-Out Date', example: 'Sep 28, 2026' },
  { tag: '{nights}', label: 'Total Nights', example: '4' },
  { tag: '{guestsCount}', label: 'Guest Count', example: '2' },
  { tag: '{totalAmount}', label: 'Total Amount', example: '€420.00' },
  { tag: '{paymentStatus}', label: 'Payment Status', example: 'Paid in Full' },
  { tag: '{surfLevel}', label: 'Surfer Skill', example: 'Intermediate' },
  { tag: '{reservationUrl}', label: 'Direct QR Link', example: 'https://wavehaven.surf/...' },
  { tag: '{hostelName}', label: 'Hostel Name', example: 'WaveHaven Surf House' },
  { tag: '{hostelPhone}', label: 'Reception Phone', example: '+351 912 345 678' },
];

export const InvoiceTemplateBuilder: React.FC<InvoiceTemplateBuilderProps> = ({
  settings,
  bookings = INITIAL_BOOKINGS,
  rooms = INITIAL_ROOMS,
  addOns = INITIAL_ADDONS,
  isOpen = true,
  onClose,
  onSaveTemplate,
  initialTemplate,
}) => {
  // Current working template config
  const [template, setTemplate] = useState<InvoiceTemplateConfig>(() => {
    return initialTemplate || settings.invoiceTemplateConfig || getStoredInvoiceTemplate() || DEFAULT_INVOICE_TEMPLATE;
  });

  const [activeTab, setActiveTab] = useState<'presets' | 'branding' | 'labels' | 'blocks' | 'guidelines' | 'whatsapp'>('whatsapp');
  const [previewBookingId, setPreviewBookingId] = useState<string>(() => bookings[0]?.id || 'wh-1');
  const [viewMode, setViewMode] = useState<'split' | 'builder' | 'preview'>('split');
  const [previewType, setPreviewType] = useState<'whatsapp' | 'document' | 'dual'>('whatsapp');
  const [highlightDynamic, setHighlightDynamic] = useState<boolean>(true);
  const [isVariablesInspectorOpen, setIsVariablesInspectorOpen] = useState<boolean>(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize initialTemplate when prop updates
  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
      setIsSaved(true);
    }
  }, [initialTemplate]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdate = <K extends keyof InvoiceTemplateConfig>(key: K, value: InvoiceTemplateConfig[K]) => {
    setTemplate((prev) => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
    setIsSaved(false);
  };

  const handleApplyPreset = (preset: typeof INVOICE_TEMPLATE_PRESETS[0]) => {
    setTemplate({
      ...preset.template,
      updatedAt: new Date().toISOString(),
    });
    setIsSaved(false);
    showToast(`Applied preset: "${preset.label}"`);
  };

  const handleResetToDefault = () => {
    setTemplate({
      ...DEFAULT_INVOICE_TEMPLATE,
      updatedAt: new Date().toISOString(),
    });
    setIsSaved(false);
    showToast('Reset template configuration to Ocean Standard default');
  };

  const handleSave = () => {
    saveStoredInvoiceTemplate(template);
    if (onSaveTemplate) {
      onSaveTemplate(template);
    }
    setIsSaved(true);
    showToast('Invoice & WhatsApp template configuration saved successfully!');
  };

  // Preview booking and calculated particulars
  const previewBooking = useMemo(() => {
    return bookings.find((b) => b.id === previewBookingId) || bookings[0] || INITIAL_BOOKINGS[0];
  }, [bookings, previewBookingId]);

  const previewRoom = useMemo(() => {
    return rooms.find((r) => r.id === previewBooking?.roomId) || rooms[0] || INITIAL_ROOMS[0];
  }, [rooms, previewBooking]);

  const accentColor = template.accentColor || settings.primaryBrandColor || '#0d9488';
  const invoiceNumber = getInvoiceNumber(previewBooking, template.invoiceNumberPrefix);
  const reservationUrl = getReservationUrl(previewBooking);
  const issueDate = previewBooking.createdAt 
    ? formatDisplayDate(previewBooking.createdAt.split('T')[0]) 
    : formatDisplayDate(previewBooking.checkInDate);
  const taxPercent = settings.taxRatePercent || 6;

  // Substitute variables in guidelines text for A4 document
  const renderedCheckInInstructions = useMemo(() => {
    return (template.checkInInstructions || '')
      .replace(/{hostelPhone}/g, settings.phone || '351 912 345 678')
      .replace(/{checkInTime}/g, settings.checkInTime || '14:00')
      .replace(/{checkOutTime}/g, settings.checkOutTime || '11:00')
      .replace(/{hostelName}/g, settings.name || 'WaveHaven Surf House');
  }, [template.checkInInstructions, settings]);

  // Evaluated live WhatsApp invoice message using current booking variables & template settings
  const whatsappInvoiceText = useMemo(() => {
    return formatWhatsAppInvoiceMessage(previewBooking, previewRoom, addOns, {
      ...settings,
      invoiceTemplateConfig: template,
    });
  }, [previewBooking, previewRoom, addOns, settings, template]);

  const whatsappWebUrl = useMemo(() => {
    const targetPhone = previewBooking?.guest?.phone || settings.phone;
    return createWhatsAppUrl(targetPhone, whatsappInvoiceText);
  }, [previewBooking, settings.phone, whatsappInvoiceText]);

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappInvoiceText);
      setCopiedWhatsApp(true);
      showToast('Copied WhatsApp message to clipboard!');
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    } catch {
      showToast('Failed to copy to clipboard');
    }
  };

  const handlePrintPreview = () => {
    showToast('Printing preview invoice...');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Cycle bookings
  const handlePrevBooking = () => {
    const currentIndex = bookings.findIndex((b) => b.id === previewBookingId);
    if (currentIndex > 0) {
      setPreviewBookingId(bookings[currentIndex - 1].id);
    } else {
      setPreviewBookingId(bookings[bookings.length - 1].id);
    }
  };

  const handleNextBooking = () => {
    const currentIndex = bookings.findIndex((b) => b.id === previewBookingId);
    if (currentIndex < bookings.length - 1) {
      setPreviewBookingId(bookings[currentIndex + 1].id);
    } else {
      setPreviewBookingId(bookings[0].id);
    }
  };

  // Highlightable keys mapping for current booking
  const variableHighlightMap = useMemo(() => {
    if (!previewBooking) return {};
    const guestFull = `${previewBooking.guest.firstName} ${previewBooking.guest.lastName}`.trim();
    const roomName = previewRoom ? previewRoom.name : previewBooking.roomName;
    const currency = settings.currencySymbol || '€';
    const checkIn = formatDisplayDate(previewBooking.checkInDate);
    const checkOut = formatDisplayDate(previewBooking.checkOutDate);

    return {
      [guestFull]: 'Guest Name',
      [previewBooking.guest.firstName]: 'First Name',
      [invoiceNumber]: 'Invoice Number',
      [`#${previewBooking.referenceNumber}`]: 'Booking Ref',
      [previewBooking.referenceNumber]: 'Booking Ref',
      [roomName]: 'Room Name',
      [checkIn]: 'Check-in Date',
      [checkOut]: 'Check-out Date',
      [`${currency}${previewBooking.totalAmount.toFixed(2)}`]: 'Total Amount',
      [`${previewBooking.nights} nights`]: 'Duration',
      [`${previewBooking.nights} night`]: 'Duration',
      [reservationUrl]: 'Direct Digital Pass URL',
    };
  }, [previewBooking, previewRoom, invoiceNumber, reservationUrl, settings.currencySymbol]);

  // WhatsApp formatted line parser
  const renderWhatsAppLine = (line: string, lineIndex: number) => {
    if (!line.trim()) {
      return <div key={lineIndex} className="h-2" />;
    }

    // Parse tokens with *bold*, _italic_, URLs, and highlight keys
    const regex = /(\*([^*]+)\*)|(https?:\/\/[^\s]+)/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyCount = 0;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = line.substring(lastIndex, match.index);
        elements.push(
          <span key={`txt-${lineIndex}-${keyCount++}`}>{textBefore}</span>
        );
      }

      if (match[1]) {
        // Bold: *text*
        const boldText = match[2];
        const isHighlighted = highlightDynamic && variableHighlightMap[boldText];

        elements.push(
          <strong 
            key={`b-${lineIndex}-${keyCount++}`} 
            className={`font-black ${
              isHighlighted 
                ? 'bg-emerald-200/80 text-emerald-950 px-1 py-0.5 rounded shadow-2xs' 
                : 'text-slate-900 font-extrabold'
            }`}
            title={isHighlighted ? `Injected Booking Variable: ${variableHighlightMap[boldText]}` : undefined}
          >
            {boldText}
          </strong>
        );
      } else if (match[3]) {
        // URL
        const url = match[3];
        elements.push(
          <a
            key={`link-${lineIndex}-${keyCount++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-mono text-[11px] break-all hover:text-blue-800"
          >
            {url}
          </a>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      elements.push(
        <span key={`end-${lineIndex}-${keyCount++}`}>{line.substring(lastIndex)}</span>
      );
    }

    return (
      <div key={lineIndex} className="leading-relaxed text-[13px] text-slate-800 font-sans break-words select-text">
        {elements.length > 0 ? elements : line}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200 print:static print:bg-white print:p-0 print:m-0 print:block print:w-full">
      <div 
        className="relative w-full max-w-7xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[96vh] sm:h-[94vh] print:h-auto print:max-w-none print:border-none print:shadow-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Builder Control Header */}
        <div className="no-print bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-black text-sm sm:text-base text-white tracking-tight">
                    Invoice & WhatsApp Template Editor
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-950 text-teal-400 border border-teal-800/80">
                    Live Split-Screen
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Real-time synchronization across WhatsApp messages and printable A4 fiscal invoices.
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Center & Right Controls */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Split Screen View Mode Selector */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'split' ? 'bg-teal-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('builder')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'builder' ? 'bg-teal-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Controls Only</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'preview' ? 'bg-teal-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Only</span>
              </button>
            </div>

            {/* Reset to Default */}
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Reset template to ocean standard"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Print Preview Button */}
            <button
              type="button"
              onClick={handlePrintPreview}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Test print current styled invoice"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Print Test</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Template</span>
            </button>

            {/* Desktop Close */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hidden md:flex w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="no-print absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-teal-300 text-xs font-bold px-4 py-2 rounded-xl shadow-lg border border-teal-500/40 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Builder Main Work Area */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-100">
          {/* LEFT: Builder Controls Sidebar */}
          {(viewMode === 'split' || viewMode === 'builder') && (
            <div className={`w-full ${viewMode === 'split' ? 'lg:w-[480px] xl:w-[520px]' : 'lg:w-full'} flex flex-col bg-white border-r border-slate-200 overflow-hidden`}>
              {/* Category Navigation Tabs */}
              <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('whatsapp')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'whatsapp' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Message</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'presets' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Presets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('branding')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'branding' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-teal-500" />
                  <span>Branding & Header</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('labels')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'labels' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Section Titles</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('blocks')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'blocks' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>Blocks & Toggles</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guidelines')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'guidelines' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Guidelines & Bank</span>
                </button>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {/* 1. WHATSAPP MESSAGE CONFIGURATION TAB */}
                {activeTab === 'whatsapp' && (
                  <div className="space-y-5">
                    <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/80">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-heading font-extrabold text-xs text-emerald-950">
                            WhatsApp Invoice Message Configuration
                          </h3>
                          <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                            Customize greeting, outro, and content toggles. Every change renders instantly in the right-hand WhatsApp chat preview using the active sample booking.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Variable Tag Insertion Palette */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-teal-600" />
                          <span>Dynamic Booking Variables</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Click to copy tag</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200/80">
                        {VARIABLE_TAG_SUGGESTIONS.map((v) => (
                          <button
                            key={v.tag}
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(v.tag);
                              showToast(`Copied ${v.tag} to clipboard`);
                            }}
                            className="text-[10px] font-mono bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                            title={`${v.label} (Example: ${v.example})`}
                          >
                            <span className="font-bold text-teal-700">{v.tag}</span>
                            <span className="text-slate-400 text-[9px]">({v.label})</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Greeting / Aloha Intro */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        WhatsApp Greeting & Intro Note
                      </label>
                      <textarea
                        rows={2}
                        value={template.whatsappCustomIntro ?? 'Aloha {guestName}! Your stay at {hostelName} is confirmed. Here is your official reservation & invoice details:'}
                        onChange={(e) => handleUpdate('whatsappCustomIntro', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        placeholder="Aloha {guestName}! Your stay at {hostelName} is confirmed..."
                      />
                      <p className="text-[10px] text-slate-400">
                        Supports <code className="font-mono text-teal-700">{'{guestName}'}</code>, <code className="font-mono text-teal-700">{'{guestFirstName}'}</code>, <code className="font-mono text-teal-700">{'{hostelName}'}</code>.
                      </p>
                    </div>

                    {/* Content Toggles for WhatsApp */}
                    <div className="space-y-2.5 pt-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                        WhatsApp Message Sections & Toggles
                      </span>

                      {/* Toggle: Include Itemized Breakdown */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              Itemized Financial Breakdown
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Shows room subtotal, add-ons, and taxes vs single total line
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={template.whatsappIncludeBreakdown !== false}
                          onChange={(e) => handleUpdate('whatsappIncludeBreakdown', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>

                      {/* Toggle: Include House Guidelines */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              Include Check-in Guidelines & Gate Rules
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Appends reception gate hours and WhatsApp desk line
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={!!template.whatsappIncludeGuidelines}
                          onChange={(e) => handleUpdate('whatsappIncludeGuidelines', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>

                      {/* Toggle: Include Digital Pass & QR Voucher Link */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              Digital Reservation & QR Code Link
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Provides guest with 1-tap mobile pass and PDF invoice access
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={template.whatsappIncludeVoucherLink !== false}
                          onChange={(e) => handleUpdate('whatsappIncludeVoucherLink', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Custom Outro / Closing */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        WhatsApp Closing / Sign-off
                      </label>
                      <input
                        type="text"
                        value={template.whatsappCustomOutro ?? 'Safe travels and see you soon on the waves! 🌊🤙'}
                        onChange={(e) => handleUpdate('whatsappCustomOutro', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        placeholder="Safe travels and see you soon on the waves! 🌊🤙"
                      />
                    </div>

                    {/* Advanced Full Override Section */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Custom Template Override (Advanced)
                        </span>
                        {template.whatsappMessageTemplate && (
                          <button
                            type="button"
                            onClick={() => handleUpdate('whatsappMessageTemplate', '')}
                            className="text-[10px] text-red-600 hover:text-red-700 font-bold"
                          >
                            Clear Override
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Leave blank to use the standard structured format with the toggles above, or type custom message text with variables:
                      </p>
                      <textarea
                        rows={3}
                        value={template.whatsappMessageTemplate || ''}
                        onChange={(e) => handleUpdate('whatsappMessageTemplate', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono"
                        placeholder="Optional: full raw custom WhatsApp message template with placeholders..."
                      />
                    </div>
                  </div>
                )}

                {/* 2. PRESETS TAB */}
                {activeTab === 'presets' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-heading font-extrabold text-sm text-slate-900">
                        Template Presets
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select a curated style to instantly adapt your invoice branding, colors, and layout blocks.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {INVOICE_TEMPLATE_PRESETS.map((preset) => {
                        const isCurrent = template.name === preset.template.name;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => handleApplyPreset(preset)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-teal-50/70 border-teal-500 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-heading font-bold text-sm text-slate-900">
                                    {preset.label}
                                  </span>
                                  <span 
                                    className="w-3 h-3 rounded-full border border-white shadow-2xs"
                                    style={{ backgroundColor: preset.template.accentColor || '#0d9488' }}
                                  />
                                  {isCurrent && (
                                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.2 rounded-full">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                  {preset.description}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyPreset(preset);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                  isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isCurrent ? 'Applied' : 'Apply'}
                              </button>
                            </div>

                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                              <span>Prefix: {preset.template.invoiceNumberPrefix}-...</span>
                              <span>•</span>
                              <span>Badge: {preset.template.certifiedBadgeText}</span>
                              {preset.template.showBankDetails && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-bold">IBAN Wire</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. BRANDING & HEADER TAB */}
                {activeTab === 'branding' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-heading font-extrabold text-sm text-slate-900">
                        Header & Visual Identity
                      </h3>
                      <p className="text-xs text-slate-500">
                        Configure document header branding, primary accents, prefix numbering, and fiscal authority details.
                      </p>
                    </div>

                    {/* Accent Color Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Primary Accent Palette
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {ACCENT_COLOR_PRESETS.map((color) => (
                          <button
                            key={color.hex}
                            type="button"
                            onClick={() => handleUpdate('accentColor', color.hex)}
                            className={`h-8 rounded-xl flex items-center justify-center transition-all ${
                              accentColor === color.hex ? 'ring-2 ring-slate-900 ring-offset-2 scale-105' : 'hover:scale-102'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          >
                            {accentColor === color.hex && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => handleUpdate('accentColor', e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                        />
                        <input
                          type="text"
                          value={template.accentColor || '#0d9488'}
                          onChange={(e) => handleUpdate('accentColor', e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 uppercase"
                          placeholder="#0d9488"
                        />
                      </div>
                    </div>

                    {/* Invoice Title & Subtitle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Document Title
                        </label>
                        <input
                          type="text"
                          value={template.title}
                          onChange={(e) => handleUpdate('title', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                          placeholder="e.g. OFFICIAL INVOICE"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Subtitle / Trading As
                        </label>
                        <input
                          type="text"
                          value={template.subtitle || ''}
                          onChange={(e) => handleUpdate('subtitle', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                          placeholder="e.g. Surf House & Ocean Lodge"
                        />
                      </div>
                    </div>

                    {/* Invoice Number Prefix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Invoice Number Prefix
                        </label>
                        <input
                          type="text"
                          value={template.invoiceNumberPrefix}
                          onChange={(e) => handleUpdate('invoiceNumberPrefix', e.target.value.toUpperCase().trim())}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase text-slate-800"
                          placeholder="INV, TAX, SURF, REC"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          Generates: {template.invoiceNumberPrefix || 'INV'}-2026-{previewBooking?.referenceNumber?.replace(/[^A-Za-z0-9]/g, '') || 'WH8492'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Tax / VAT ID Label
                        </label>
                        <input
                          type="text"
                          value={template.taxIdLabel}
                          onChange={(e) => handleUpdate('taxIdLabel', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                          placeholder="NIF / VAT, Fiscal Tax ID"
                        />
                      </div>
                    </div>

                    {/* Tax ID Number */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Tax / VAT Identification Number
                      </label>
                      <input
                        type="text"
                        value={template.taxIdNumber}
                        onChange={(e) => handleUpdate('taxIdNumber', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800"
                        placeholder="PT 509 876 543"
                      />
                    </div>

                    {/* Official Stamp & Badge Configuration */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Official Stamp & Footer Metadata
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Stamp Badge Header
                          </label>
                          <input
                            type="text"
                            value={template.certifiedBadgeText}
                            onChange={(e) => handleUpdate('certifiedBadgeText', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                            placeholder="WaveHaven Certified"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Stamp Location
                          </label>
                          <input
                            type="text"
                            value={template.stampLocation}
                            onChange={(e) => handleUpdate('stampLocation', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                            placeholder="Ericeira, Portugal"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Watermark Text (Diagonal)
                        </label>
                        <input
                          type="text"
                          value={template.watermarkText}
                          onChange={(e) => handleUpdate('watermarkText', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
                          placeholder="WaveHaven Certified"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Footer Legal Notice
                        </label>
                        <input
                          type="text"
                          value={template.footerLegalText || ''}
                          onChange={(e) => handleUpdate('footerLegalText', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                          placeholder="Official Reception Check-in Voucher • Printed for Guest Check-in"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SECTION TITLES TAB */}
                {activeTab === 'labels' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-heading font-extrabold text-sm text-slate-900">
                        Section Titles & Labels
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tailor section headers on the printed invoice to match your brand terminology.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Guest Particulars Header
                      </label>
                      <input
                        type="text"
                        value={template.guestSectionTitle}
                        onChange={(e) => handleUpdate('guestSectionTitle', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        placeholder="Billed To (Lead Guest)"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Stay / Itinerary Particulars Header
                      </label>
                      <input
                        type="text"
                        value={template.staySectionTitle}
                        onChange={(e) => handleUpdate('staySectionTitle', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        placeholder="Accommodation Particulars"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Itemized Charges Table Header
                      </label>
                      <input
                        type="text"
                        value={template.chargesTableTitle}
                        onChange={(e) => handleUpdate('chargesTableTitle', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        placeholder="Itemized Charges & Services"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        QR Code Verification Title
                      </label>
                      <input
                        type="text"
                        value={template.qrSectionTitle}
                        onChange={(e) => handleUpdate('qrSectionTitle', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        placeholder="Instant Reservation QR Verification"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        House Guidelines Section Title
                      </label>
                      <input
                        type="text"
                        value={template.notesSectionTitle}
                        onChange={(e) => handleUpdate('notesSectionTitle', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        placeholder="Check-in Guidelines & Gate Instructions:"
                      />
                    </div>
                  </div>
                )}

                {/* 5. BLOCKS & TOGGLES TAB */}
                {activeTab === 'blocks' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-heading font-extrabold text-sm text-slate-900">
                        Functional Document Blocks
                      </h3>
                      <p className="text-xs text-slate-500">
                        Turn visual modules and security features on or off.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {/* Toggle: QR Code Pass */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              QR Code Pass & Verification
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Instant smartphone camera check-in voucher
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={template.showQrCode}
                          onChange={(e) => handleUpdate('showQrCode', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>

                      {/* Toggle: Surf Skill Badge */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                            <Waves className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              Surfer Skill Level Badge
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Displays guest surf tier (Beginner, Intermediate, Advanced)
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={template.showSurfLevel}
                          onChange={(e) => handleUpdate('showSurfLevel', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>

                      {/* Toggle: Wi-Fi Credentials */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              Guest Wi-Fi Network & Password
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Prints SSID ({settings.wifiNetworkName || 'WaveHaven_Guest'}) on check-in footer
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={template.showWifiDetails}
                          onChange={(e) => handleUpdate('showWifiDetails', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>

                      {/* Toggle: Reception Stamp */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              Official Reception Stamp Seal
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Dashed circular / boxed authenticity certificate
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={template.showReceptionSeal}
                          onChange={(e) => handleUpdate('showReceptionSeal', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>

                      {/* Toggle: Background Watermark */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              Diagonal Watermark
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Subtle repeating authenticity watermark across paper
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={template.showWatermark}
                          onChange={(e) => handleUpdate('showWatermark', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>

                      {/* Toggle: Tax Breakdown */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              Itemized Tax & VAT Breakdown
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Shows municipal hospitality tax ({taxPercent}%) subtotal
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={template.showTaxBreakdown}
                          onChange={(e) => handleUpdate('showTaxBreakdown', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>

                      {/* Toggle: Payment Status Badge */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              Payment Status Badge
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Shows PAID IN FULL, DEPOSIT CONFIRMED, or PENDING pill
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={template.showPaymentStatusBadge}
                          onChange={(e) => handleUpdate('showPaymentStatusBadge', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>

                      {/* Toggle: Bank Wire / IBAN Details */}
                      <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-heading font-bold text-xs text-slate-900 block">
                              Bank Wire / IBAN Details Block
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Includes bank settlement info for corporate wire transfers
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={!!template.showBankDetails}
                          onChange={(e) => handleUpdate('showBankDetails', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* 6. GUIDELINES & BANK TAB */}
                {activeTab === 'guidelines' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-heading font-extrabold text-sm text-slate-900">
                        House Guidelines & Settlement
                      </h3>
                      <p className="text-xs text-slate-500">
                        Check-in gate instructions and wire transfer banking information printed at the bottom of the invoice.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Check-in & Gate Instructions
                      </label>
                      <textarea
                        rows={3}
                        value={template.checkInInstructions}
                        onChange={(e) => handleUpdate('checkInInstructions', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans"
                        placeholder="Reception is open daily from 08:00 to 22:00. For late arrivals, message our WhatsApp desk (+{hostelPhone})."
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Dynamic tags: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">{'{hostelPhone}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">{'{checkInTime}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">{'{checkOutTime}'}</code>
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Payment & Balance Due Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={template.paymentInstructions || ''}
                        onChange={(e) => handleUpdate('paymentInstructions', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed"
                        placeholder="Balance due at reception upon arrival via Card, MB WAY, Revolut, or Cash."
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 block">
                          Bank Wire Transfer (IBAN / SWIFT)
                        </label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          template.showBankDetails ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {template.showBankDetails ? 'ENABLED' : 'HIDDEN'}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={template.bankDetailsText || ''}
                        onChange={(e) => handleUpdate('bankDetailsText', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed"
                        placeholder="IBAN: PT50 0033 0000 1234 5678 9015 4 • BIC/SWIFT: BCPTPTLX"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Save Footer in Controls Sidebar */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 font-medium">
                  {isSaved ? 'All changes saved' : 'Unsaved draft in preview'}
                </span>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          )}

          {/* RIGHT: Live Interactive Preview Panel (WhatsApp + Printable Sheet) */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-200/80">
              {/* Preview Control Bar with Mode Switcher & Booking Variables Selector */}
              <div className="no-print bg-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 shrink-0 text-white text-xs">
                {/* Mode Selector Tabs (WhatsApp vs Document vs Dual) */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPreviewType('whatsapp')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                        previewType === 'whatsapp'
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewType('document')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                        previewType === 'document'
                          ? 'bg-teal-500 text-slate-950 shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>A4 Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewType('dual')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all items-center gap-1.5 hidden xl:flex ${
                        previewType === 'dual'
                          ? 'bg-purple-500 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title="Side-by-side view of both WhatsApp chat bubble and A4 document"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Dual View</span>
                    </button>
                  </div>

                  {previewType === 'whatsapp' && (
                    <button
                      type="button"
                      onClick={() => setHighlightDynamic(!highlightDynamic)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors hidden sm:flex items-center gap-1.5 ${
                        highlightDynamic
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title="Toggle variable highlighting in WhatsApp bubble"
                    >
                      <span>Highlight Variables</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${highlightDynamic ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    </button>
                  )}
                </div>

                {/* Sample Booking Selector to render current variables */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    Booking Variables:
                  </span>
                  <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700">
                    <button
                      type="button"
                      onClick={handlePrevBooking}
                      className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Previous sample booking"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <select
                      value={previewBookingId}
                      onChange={(e) => setPreviewBookingId(e.target.value)}
                      className="bg-transparent text-slate-200 text-xs px-2 py-1 border-none focus:outline-none cursor-pointer max-w-[170px] sm:max-w-[240px] font-semibold truncate"
                    >
                      {bookings.map((b) => (
                        <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                          #{b.referenceNumber} • {b.guest.firstName} {b.guest.lastName} ({b.paymentStatus.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleNextBooking}
                      className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Next sample booking"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVariablesInspectorOpen(!isVariablesInspectorOpen)}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Inspect resolved template variables for this booking"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Collapsible Variables Inspector Drawer */}
              {isVariablesInspectorOpen && (
                <div className="bg-slate-900 border-b border-slate-800 p-3 sm:px-6 text-white text-xs animate-in slide-in-from-top duration-150 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-bold text-teal-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      <span>Evaluated Booking Variables (#{previewBooking.referenceNumber})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsVariablesInspectorOpen(false)}
                      className="text-slate-400 hover:text-white text-[11px]"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 text-[9px] block uppercase font-mono">{'{guestName}'}</span>
                      <span className="font-bold text-white truncate block">{previewBooking.guest.firstName} {previewBooking.guest.lastName}</span>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 text-[9px] block uppercase font-mono">{'{invoiceNumber}'}</span>
                      <span className="font-mono font-bold text-teal-300 truncate block">{invoiceNumber}</span>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 text-[9px] block uppercase font-mono">{'{roomName}'}</span>
                      <span className="font-bold text-white truncate block">{previewRoom?.name || previewBooking.roomName}</span>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 text-[9px] block uppercase font-mono">{'{checkInDate}'}</span>
                      <span className="font-bold text-white truncate block">{formatDisplayDate(previewBooking.checkInDate)}</span>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 text-[9px] block uppercase font-mono">{'{totalAmount}'}</span>
                      <span className="font-bold text-emerald-400 truncate block">{settings.currencySymbol || '€'}{previewBooking.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400 text-[9px] block uppercase font-mono">{'{paymentStatus}'}</span>
                      <span className="font-bold text-cyan-300 uppercase truncate block">{previewBooking.paymentStatus}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scrollable Preview Workspace Container */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-7">
                {/* DUAL VIEW (Both WhatsApp Phone & A4 Document Side-by-Side) */}
                {previewType === 'dual' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto items-start">
                    {/* Left: WhatsApp Phone Mockup */}
                    <div className="flex flex-col items-center">
                      <div className="w-full max-w-md bg-slate-900 rounded-3xl p-3 shadow-2xl border border-slate-800">
                        {/* Phone Top Speaker/Sensor Bar */}
                        <div className="flex justify-center pb-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-700" />
                        </div>
                        {/* WhatsApp Window */}
                        <div className="rounded-2xl overflow-hidden shadow-inner bg-[#efeae2] border border-slate-300 flex flex-col min-h-[520px]">
                          {/* WhatsApp Green Top Header */}
                          <div className="bg-[#008069] text-white px-3.5 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <ChevronLeft className="w-5 h-5 text-white cursor-pointer" />
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0"
                                style={{ backgroundColor: accentColor }}
                              >
                                {settings.name ? settings.name.charAt(0).toUpperCase() : 'W'}
                              </div>
                              <div className="leading-tight truncate">
                                <div className="font-bold text-xs truncate max-w-[150px] sm:max-w-[180px]">
                                  {settings.name}
                                </div>
                                <div className="text-[10px] text-teal-100 flex items-center gap-1 font-normal">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                                  <span>online • verified reception</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-white">
                              <Phone className="w-4 h-4 cursor-pointer hover:opacity-80" />
                              <Share2 className="w-4 h-4 cursor-pointer hover:opacity-80" />
                            </div>
                          </div>

                          {/* WhatsApp Chat Body */}
                          <div className="p-3 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                              {/* Date Pill */}
                              <div className="flex justify-center">
                                <span className="bg-white/90 shadow-2xs border border-slate-200 text-slate-600 text-[10px] font-bold px-3 py-0.5 rounded-full">
                                  TODAY
                                </span>
                              </div>

                              {/* WhatsApp Message Bubble with Corner Tail */}
                              <div className="relative max-w-[95%] sm:max-w-[92%] ml-auto bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3.5 sm:p-4 shadow-xs border border-emerald-200/50 space-y-2">
                                {/* Message Body Rendered with dynamic booking variable highlights */}
                                <div className="space-y-0.5">
                                  {whatsappInvoiceText.split('\n').map((line, idx) => renderWhatsAppLine(line, idx))}
                                </div>

                                {/* Direct Digital Voucher Card Link Preview */}
                                {template.whatsappIncludeVoucherLink !== false && (
                                  <div className="mt-2.5 p-2.5 bg-white/90 rounded-xl border border-emerald-300/70 flex items-center gap-3 shadow-2xs">
                                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
                                      <QrCode className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-heading font-extrabold text-[11px] text-slate-900 block truncate">
                                        WaveHaven Digital Pass & PDF Invoice
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono block truncate">
                                        Ref: #{previewBooking.referenceNumber} • Instant QR Access
                                      </span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-teal-600 shrink-0" />
                                  </div>
                                )}

                                {/* Timestamp & Read Receipts */}
                                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 pt-1 select-none">
                                  <span>14:24</span>
                                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                </div>
                              </div>
                            </div>

                            {/* Actions under bubble */}
                            <div className="pt-2 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={handleCopyWhatsApp}
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                              >
                                {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                <span>{copiedWhatsApp ? 'Copied' : 'Copy Text'}</span>
                              </button>
                              <a
                                href={whatsappWebUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#008069] hover:bg-[#00705c] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Test in Web</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Printable A4 Document Sheet */}
                    <div className="w-full">
                      {renderA4InvoiceSheet()}
                    </div>
                  </div>
                )}

                {/* SINGLE VIEW: WHATSAPP CHAT PREVIEW ONLY */}
                {previewType === 'whatsapp' && (
                  <div className="max-w-xl mx-auto flex flex-col items-center">
                    {/* Realistic WhatsApp Phone Wrapper */}
                    <div className="w-full bg-slate-900 rounded-3xl sm:rounded-[36px] p-3 sm:p-4 shadow-2xl border border-slate-800">
                      {/* Speaker grill */}
                      <div className="flex justify-center pb-2.5">
                        <div className="w-20 h-1.5 rounded-full bg-slate-700" />
                      </div>

                      {/* WhatsApp Chat App Interface */}
                      <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-inner bg-[#efeae2] border border-slate-300 flex flex-col min-h-[580px]">
                        {/* WhatsApp Top Header Bar */}
                        <div className="bg-[#008069] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
                          <div className="flex items-center gap-3">
                            <ChevronLeft className="w-5 h-5 text-white cursor-pointer" />
                            <div 
                              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-xs shrink-0"
                              style={{ backgroundColor: accentColor }}
                            >
                              {settings.name ? settings.name.charAt(0).toUpperCase() : 'W'}
                            </div>
                            <div className="leading-tight">
                              <div className="font-bold text-xs sm:text-sm">
                                {settings.name}
                              </div>
                              <div className="text-[10px] text-teal-100 flex items-center gap-1 font-normal">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                                <span>online • official reception line</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3.5 text-white">
                            <Phone className="w-4 h-4 cursor-pointer hover:opacity-80" />
                            <Share2 className="w-4 h-4 cursor-pointer hover:opacity-80" />
                          </div>
                        </div>

                        {/* WhatsApp Chat Body */}
                        <div className="p-3 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            {/* Date Pill */}
                            <div className="flex justify-center">
                              <span className="bg-white/95 shadow-2xs border border-slate-200 text-slate-600 text-[10px] font-bold px-3 py-0.5 rounded-full">
                                TODAY • {issueDate}
                              </span>
                            </div>

                            {/* WhatsApp Message Bubble */}
                            <div className="relative max-w-[96%] sm:max-w-[90%] ml-auto bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-4 sm:p-5 shadow-xs border border-emerald-200/50 space-y-2.5">
                              {/* Message Body Rendered */}
                              <div className="space-y-0.5">
                                {whatsappInvoiceText.split('\n').map((line, idx) => renderWhatsAppLine(line, idx))}
                              </div>

                              {/* Direct Digital Voucher Card Link Preview */}
                              {template.whatsappIncludeVoucherLink !== false && (
                                <a
                                  href={reservationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 p-3 bg-white/90 hover:bg-white rounded-xl border border-emerald-300 flex items-center gap-3 shadow-2xs transition-colors block"
                                >
                                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
                                    <QrCode className="w-6 h-6" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-heading font-extrabold text-xs text-slate-900 block truncate">
                                      WaveHaven Digital Pass & PDF Invoice
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-mono block truncate">
                                      Ref: #{previewBooking.referenceNumber} • Instant QR Access
                                    </span>
                                    <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                                      Tap to open confirmed reservation pass
                                    </span>
                                  </div>
                                  <ArrowUpRight className="w-4 h-4 text-teal-600 shrink-0" />
                                </a>
                              )}

                              {/* Timestamp & Read Receipts */}
                              <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 pt-1 select-none">
                                <span>14:24</span>
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                              </div>
                            </div>
                          </div>

                          {/* Action Toolbar Below Message */}
                          <div className="pt-3 border-t border-slate-300/70 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleCopyWhatsApp}
                                className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                              >
                                {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                <span>{copiedWhatsApp ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setHighlightDynamic(!highlightDynamic)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                                  highlightDynamic
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <Tag className="w-3.5 h-3.5" />
                                <span>{highlightDynamic ? 'Variables Highlighted' : 'Plain Text View'}</span>
                              </button>
                            </div>

                            <a
                              href={whatsappWebUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-4 rounded-xl bg-[#008069] hover:bg-[#00705c] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Dispatch / Test in WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SINGLE VIEW: PRINTABLE A4 DOCUMENT SHEET ONLY */}
                {previewType === 'document' && (
                  <div className="max-w-3xl mx-auto">
                    {renderA4InvoiceSheet()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Sub-renderer for A4 Printable Document Sheet
  function renderA4InvoiceSheet() {
    return (
      <div 
        id="preview-invoice-container"
        className="relative max-w-3xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200 shadow-lg space-y-6 sm:space-y-7 text-slate-800 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none overflow-hidden"
      >
        {/* Subtle Diagonal Watermark */}
        {template.showWatermark && (
          <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.035] -rotate-12">
            <span className="font-heading font-black text-6xl sm:text-7xl md:text-8xl tracking-widest text-slate-900 uppercase whitespace-nowrap">
              {template.watermarkText || 'WAVEHAVEN CERTIFIED'}
            </span>
          </div>
        )}

        {/* 1. Header & Identity */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-5 border-b-2 border-slate-100 relative z-10">
          <div className="flex items-start gap-4">
            {template.showLogo && (
              <div 
                className="w-13 h-13 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-sm shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                <Waves className="w-7 h-7" />
              </div>
            )}
            <div>
              <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                {settings.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {template.subtitle || settings.tagline || 'Surf House & Ocean Lodge'}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                <span>{settings.address}</span>
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {template.taxIdLabel || 'NIF / VAT'}: {template.taxIdNumber} • WhatsApp: +{settings.phone}
              </p>
            </div>
          </div>

          {/* Invoice Reference & Status */}
          <div className="text-left sm:text-right space-y-1">
            {template.showPaymentStatusBadge && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                previewBooking.paymentStatus === 'paid'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : previewBooking.paymentStatus === 'deposit'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{previewBooking.paymentStatus === 'paid' ? 'PAID IN FULL' : previewBooking.paymentStatus === 'deposit' ? 'DEPOSIT CONFIRMED' : 'CONFIRMED BOOKING'}</span>
              </div>
            )}
            <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900 mt-1">
              {template.title || 'OFFICIAL INVOICE'}
            </h2>
            <p className="font-mono text-xs font-bold text-slate-700">
              {invoiceNumber}
            </p>
            <p className="text-xs text-slate-500">
              Date of Issue: <span className="font-semibold text-slate-700">{issueDate}</span>
            </p>
            <div className="pt-1">
              <span 
                className="font-mono text-xs font-bold px-2.5 py-1 rounded-md border inline-block"
                style={{ 
                  backgroundColor: `${accentColor}12`,
                  borderColor: `${accentColor}40`,
                  color: accentColor 
                }}
              >
                REF: #{previewBooking.referenceNumber}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Two-Column Particulars: Guest & Stay Itinerary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 rounded-2xl p-5 border border-slate-100 text-xs relative z-10">
          {/* Billed To / Guest Info */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              {template.guestSectionTitle || 'Billed To (Lead Guest)'}
            </span>
            <h3 className="font-bold text-sm text-slate-900">
              {previewBooking.guest.firstName} {previewBooking.guest.lastName}
            </h3>
            <p className="text-slate-600 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{previewBooking.guest.email}</span>
            </p>
            <p className="text-slate-600 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{previewBooking.guest.phone}</span>
            </p>
            {previewBooking.guest.country && (
              <p className="text-slate-500">
                Country: <span className="font-medium text-slate-700">{previewBooking.guest.country}</span>
              </p>
            )}
            {template.showSurfLevel && (
              <div className="pt-1">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 capitalize">
                  🏄 Surf Skill: {previewBooking.guest.surfLevel.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          {/* Stay Particulars */}
          <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l sm:pl-6 border-slate-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              {template.staySectionTitle || 'Accommodation Particulars'}
            </span>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Bed className="w-4 h-4" style={{ color: accentColor }} />
              <span>{previewRoom ? previewRoom.name : previewBooking.roomName}</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block">Check-In:</span>
                <span className="font-semibold text-slate-900">{formatDisplayDate(previewBooking.checkInDate)}</span>
                <span className="text-[10px] block" style={{ color: accentColor }}>From {settings.checkInTime}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Check-Out:</span>
                <span className="font-semibold text-slate-900">{formatDisplayDate(previewBooking.checkOutDate)}</span>
                <span className="text-[10px] text-slate-500 block">By {settings.checkOutTime}</span>
              </div>
            </div>
            <p className="text-slate-600 pt-1">
              Duration: <span className="font-semibold text-slate-900">{previewBooking.nights} night(s)</span> • Guests: <span className="font-semibold text-slate-900">{previewBooking.guestsCount}</span>
            </p>
          </div>
        </div>

        {/* 3. Itemized Services Table */}
        <div className="space-y-3 relative z-10">
          <h4 className="font-heading font-extrabold text-xs text-slate-800 uppercase tracking-wider">
            {template.chargesTableTitle || 'Itemized Charges & Services'}
          </h4>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-center">Qty / Period</th>
                  <th className="py-2.5 px-4 text-right">Unit Rate</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Accommodation Line */}
                <tr>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">
                      {previewRoom ? previewRoom.name : previewBooking.roomName}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standard Lodging • Ericeira Surf Sanctuary
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">
                    {previewBooking.nights} night(s)
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 font-mono">
                    {settings.currencySymbol || '€'}{(previewBooking.roomSubtotal / (previewBooking.nights || 1)).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                    {settings.currencySymbol || '€'}{previewBooking.roomSubtotal.toFixed(2)}
                  </td>
                </tr>

                {/* Add-ons Itemization */}
                {previewBooking.addOns && previewBooking.addOns.map((sel) => {
                  const def = addOns.find((a) => a.id === sel.addOnId);
                  const name = def ? def.name : sel.addOnId;
                  const price = def ? def.price : 0;
                  const multiplier = sel.days || 1;
                  const lineTotal = price * sel.quantity * multiplier;

                  return (
                    <tr key={sel.addOnId}>
                      <td className="py-2.5 px-4">
                        <span className="font-medium text-slate-800 block">
                          🏄 {name}
                        </span>
                        {def?.description && (
                          <span className="text-[10px] text-slate-400 block">
                            {def.description}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-600">
                        {sel.quantity}x {sel.days ? `(${sel.days}d)` : ''}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600 font-mono">
                        {settings.currencySymbol || '€'}{price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">
                        {settings.currencySymbol || '€'}{lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Taxes Calculation */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Room Subtotal:</span>
                <span className="font-mono">{settings.currencySymbol || '€'}{previewBooking.roomSubtotal.toFixed(2)}</span>
              </div>
              {previewBooking.addOnsSubtotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Add-ons & Equipment:</span>
                  <span className="font-mono">{settings.currencySymbol || '€'}{previewBooking.addOnsSubtotal.toFixed(2)}</span>
                </div>
              )}
              {template.showTaxBreakdown && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Hospitality Tax ({taxPercent}%):</span>
                  <span className="font-mono">{settings.currencySymbol || '€'}{previewBooking.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div 
                className="flex justify-between pt-2 border-t-2 font-black text-sm text-slate-900"
                style={{ borderColor: accentColor }}
              >
                <span>TOTAL AMOUNT:</span>
                <span className="font-mono text-base" style={{ color: accentColor }}>
                  {settings.currencySymbol || '€'}{previewBooking.totalAmount.toFixed(2)}
                </span>
              </div>

              {template.paymentInstructions && (
                <p className="text-[10px] text-slate-500 pt-1 text-right italic">
                  {template.paymentInstructions}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 4. VERIFICATION & QR CODE BLOCK */}
        {template.showQrCode && (
          <div 
            className="rounded-2xl p-5 border flex flex-col sm:flex-row items-center gap-5 relative z-10"
            style={{ 
              backgroundColor: `${accentColor}0a`,
              borderColor: `${accentColor}30`
            }}
          >
            {/* High-Resolution QR Placeholder */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 shrink-0 flex flex-col items-center">
              <div className="w-28 h-28 bg-slate-50 rounded-xl flex items-center justify-center text-slate-700 border border-dashed border-slate-300">
                <QrCode className="w-16 h-16 text-slate-800" />
              </div>
              <span className="text-[10px] font-mono font-bold mt-1.5" style={{ color: accentColor }}>
                REF: #{previewBooking.referenceNumber}
              </span>
            </div>

            {/* QR Code Explanation & Direct Link */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 font-heading font-extrabold text-sm text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{template.qrSectionTitle || 'Instant Reservation QR Verification'}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {template.qrSectionDescription || 'Scan this QR code with any smartphone camera to switch directly to your verified reservation voucher and download your PDF invoice anytime.'}
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {reservationUrl}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bank Wire Details (Conditional) */}
        {template.showBankDetails && template.bankDetailsText && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1 relative z-10">
            <span className="font-heading font-bold text-[11px] text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Bank Wire Settlement:</span>
            </span>
            <p className="font-mono text-[11px] text-slate-600">
              {template.bankDetailsText}
            </p>
          </div>
        )}

        {/* 5. Hostel Check-in & House Guidelines Notice */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-slate-500 relative z-10">
          <div>
            <p className="font-semibold text-slate-700">
              {template.notesSectionTitle || 'Check-in Guidelines & Gate Instructions:'}
            </p>
            <p className="text-slate-600">
              {renderedCheckInInstructions}
            </p>
            {template.showWifiDetails && settings.wifiNetworkName && (
              <p className="mt-0.5 font-medium" style={{ color: accentColor }}>
                Guest Wi-Fi: <span className="font-mono">{settings.wifiNetworkName}</span> | Pass: <span className="font-mono">{settings.wifiPassword || 'Welcome'}</span>
              </p>
            )}
            <p className="mt-1 text-[10px] text-slate-400 font-mono">
              {template.footerLegalText || 'Official Reception Check-in Voucher • Printed for Guest Check-in'}
            </p>
          </div>

          {/* Official Seal / Stamp (Conditional) */}
          {template.showReceptionSeal && (
            <div 
              className="text-right shrink-0 border-2 border-dashed rounded-xl px-4 py-2 bg-white"
              style={{ borderColor: `${accentColor}80` }}
            >
              <span 
                className="text-[9px] uppercase font-extrabold tracking-widest block"
                style={{ color: accentColor }}
              >
                {template.certifiedBadgeText || 'WaveHaven Certified'}
              </span>
              <span className="font-heading font-black text-xs text-slate-900">
                {settings.name.toUpperCase()}
              </span>
              <span className="text-[9px] text-slate-500 block">
                {template.stampLocation || 'Ericeira, Portugal'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
};
