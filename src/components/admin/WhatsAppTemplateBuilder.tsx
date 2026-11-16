import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  MessageSquare, Send, Copy, Check, RefreshCw, Sparkles, 
  Smartphone, Eye, Sliders, CheckCircle2, ChevronDown, 
  Info, ExternalLink, Bold, Italic, Strikethrough, Code, 
  List, Smile, Calendar, User, Bed, DollarSign, Building, Wifi, Shield,
  Columns, Edit3
} from 'lucide-react';
import { Booking, HostelSettings, NotificationTemplate, Room, SurfAddOn } from '../../types';
import { 
  createWhatsAppUrl, 
  getTemplateVariableMap, 
  renderWhatsAppTemplate, 
  TemplateVariablesContext 
} from '../../utils/whatsapp';
import { INITIAL_TEMPLATES, INITIAL_BOOKINGS } from '../../data/initialData';
import { getStoredTemplates, saveStoredTemplates } from '../../utils/storage';
import { WhatsAppLivePreviewPane } from './WhatsAppLivePreviewPane';

interface WhatsAppTemplateBuilderProps {
  settings: HostelSettings;
  bookings: Booking[];
  rooms?: Room[];
  addOns?: SurfAddOn[];
  templates?: NotificationTemplate[];
  onUpdateTemplate?: (template: NotificationTemplate) => void;
  onSaveTemplates?: (templates: NotificationTemplate[]) => void;
}

interface VariableDefinition {
  key: string;
  label: string;
  category: 'guest' | 'stay' | 'room' | 'hostel';
  description: string;
  example: string;
}

const TEMPLATE_VARIABLES: VariableDefinition[] = [
  // Guest variables
  { key: 'guestName', label: 'Guest Full Name', category: 'guest', description: 'Full name of the lead guest', example: 'Lucas Silva' },
  { key: 'guestFirstName', label: 'Guest First Name', category: 'guest', description: 'First name for warm, friendly greetings', example: 'Lucas' },
  { key: 'phone', label: 'Guest Phone', category: 'guest', description: 'Contact phone number', example: '+351 912 987 654' },
  { key: 'email', label: 'Guest Email', category: 'guest', description: 'Guest email address', example: 'lucas.silva@example.com' },
  { key: 'country', label: 'Country', category: 'guest', description: 'Country of origin', example: 'Portugal' },
  { key: 'surfLevel', label: 'Surf Level', category: 'guest', description: 'Skill tier: Beginner, Intermediate, Advanced', example: 'Intermediate (Green waves & trimming)' },
  
  // Stay & Dates
  { key: 'checkInDate', label: 'Check-In Date', category: 'stay', description: 'Arrival date in YYYY-MM-DD format', example: '2026-09-20' },
  { key: 'checkOutDate', label: 'Check-Out Date', category: 'stay', description: 'Departure date in YYYY-MM-DD format', example: '2026-09-24' },
  { key: 'checkInTime', label: 'Check-In Time', category: 'stay', description: 'Hostel official check-in time', example: '14:00' },
  { key: 'checkOutTime', label: 'Check-Out Time', category: 'stay', description: 'Hostel official check-out time', example: '11:00' },
  { key: 'nights', label: 'Nights Count', category: 'stay', description: 'Total number of nights booked', example: '4' },
  { key: 'daysUntil', label: 'Days Until Arrival', category: 'stay', description: 'Countdown days (for reminders)', example: '2' },

  // Room & Financials
  { key: 'roomName', label: 'Room / Bed Name', category: 'room', description: 'Assigned room, suite, or dorm bed', example: 'Ocean View Sunset Suite' },
  { key: 'bookingRef', label: 'Booking Ref', category: 'room', description: 'Unique reservation reference number', example: 'WH-8492' },
  { key: 'guestsCount', label: 'Guests Count', category: 'room', description: 'Number of guests in the booking', example: '2' },
  { key: 'totalAmount', label: 'Total Amount', category: 'room', description: 'Final calculated reservation total', example: '240.00' },
  { key: 'currency', label: 'Currency', category: 'room', description: 'Hostel currency symbol or code', example: '€' },
  { key: 'paymentStatus', label: 'Payment Status', category: 'room', description: 'Pending, Deposit Paid, or Settled', example: 'CONFIRMED (DEPOSIT PAID)' },
  { key: 'addOnsList', label: 'Add-Ons List', category: 'room', description: 'Bullet list of chosen surf lessons & gear rentals', example: '• 1x Surfboard Rental (3 days)\n• 1x Daily Organic Breakfast' },

  // Hostel & Amenities
  { key: 'hostelName', label: 'Hostel Name', category: 'hostel', description: 'Registered hostel brand name', example: 'WaveHaven Surf House & Hostel' },
  { key: 'hostelPhone', label: 'Hostel Phone', category: 'hostel', description: 'Reception desk WhatsApp number', example: '+351 912 345 678' },
  { key: 'address', label: 'Hostel Address', category: 'hostel', description: 'Street address & town', example: 'Rua das Ondas 42, Ericeira' },
  { key: 'wifiName', label: 'Wi-Fi Network', category: 'hostel', description: 'Guest Wi-Fi network SSID', example: 'WaveHaven-Guest-5G' },
  { key: 'wifiPassword', label: 'Wi-Fi Password', category: 'hostel', description: 'Guest Wi-Fi network password', example: 'CatchWaves2026' },
  { key: 'googleMapsUrl', label: 'Map Link', category: 'hostel', description: 'Google Maps navigation link', example: 'https://maps.google.com/?q=Ericeira' },
];

const DEFAULT_TEMPLATES_FALLBACK: NotificationTemplate[] = [
  ...INITIAL_TEMPLATES,
  {
    id: 'tpl-checkout-thanks',
    type: 'checkout_thanks',
    title: 'Post-Stay Checkout & Review Request',
    subject: 'Thank you for surfing with us at WaveHaven!',
    daysTrigger: 0,
    isActive: true,
    content: `🤙 *THANK YOU FOR SURFING WITH US!* 🌊

Aloha {guestName}!
We hope you had an unforgettable time catching waves at WaveHaven Surf House!

If you enjoyed your stay in {roomName}, we would love it if you could share a quick review or tag us in your surf photos! 📸

📍 WaveHaven Surf House, Ericeira
📲 WhatsApp: +{hostelPhone}

Until the next swell, keep surfing and shaka! 🤙
WaveHaven Team`,
  },
];

export const WhatsAppTemplateBuilder: React.FC<WhatsAppTemplateBuilderProps> = ({
  settings,
  bookings,
  rooms = [],
  addOns = [],
  templates: propsTemplates,
  onUpdateTemplate,
  onSaveTemplates,
}) => {
  // Load templates from props or local storage
  const [allTemplates, setAllTemplates] = useState<NotificationTemplate[]>(() => {
    if (propsTemplates && propsTemplates.length > 0) {
      return propsTemplates;
    }
    const stored = getStoredTemplates();
    return stored.length > 0 ? stored : DEFAULT_TEMPLATES_FALLBACK;
  });

  // Filter templates suitable for WhatsApp
  const whatsappTemplates = useMemo(() => {
    return allTemplates.filter((t) => t.type !== 'email_receipt');
  }, [allTemplates]);

  // Currently selected template ID
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    return whatsappTemplates[0]?.id || 'tpl-1';
  });

  const activeTemplate = useMemo(() => {
    return whatsappTemplates.find((t) => t.id === selectedTemplateId) || whatsappTemplates[0] || DEFAULT_TEMPLATES_FALLBACK[0];
  }, [whatsappTemplates, selectedTemplateId]);

  // Editor content state
  const [editorContent, setEditorContent] = useState<string>(activeTemplate?.content || '');
  const [editorTitle, setEditorTitle] = useState<string>(activeTemplate?.title || '');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState<boolean>(false);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  // Layout view: split screen, editor only, or preview only
  const [builderLayout, setBuilderLayout] = useState<'split' | 'editor' | 'preview'>('split');

  // Selected preview booking (demo or real booking)
  const [previewBookingId, setPreviewBookingId] = useState<string>('demo');
  const [variableCategory, setVariableCategory] = useState<'all' | 'guest' | 'stay' | 'room' | 'hostel'>('all');

  // Textarea reference for inserting at cursor
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-correct variable typo handler
  const handleAutoFixVariable = (oldVar: string, newVar: string) => {
    setEditorContent((prev) => prev.split(oldVar).join(newVar));
    setIsSaved(false);
    showToast(`Corrected ${oldVar} to ${newVar}`);
  };

  // Synchronize when active template changes
  useEffect(() => {
    if (activeTemplate) {
      setEditorContent(activeTemplate.content || '');
      setEditorTitle(activeTemplate.title || '');
      setIsSaved(true);
    }
  }, [activeTemplate?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Resolve active preview booking
  const previewBooking = useMemo(() => {
    if (previewBookingId === 'demo' || bookings.length === 0) {
      return INITIAL_BOOKINGS[0];
    }
    return bookings.find((b) => b.id === previewBookingId) || bookings[0];
  }, [previewBookingId, bookings]);

  // Context variable map
  const variableMap = useMemo(() => {
    const context: TemplateVariablesContext = {
      booking: previewBooking,
      room: rooms.find((r) => r.id === previewBooking?.roomId),
      addOns,
      settings,
      daysUntil: settings.autoRemindDaysBefore || 2,
    };
    return getTemplateVariableMap(context);
  }, [previewBooking, rooms, addOns, settings]);

  // Rendered preview text
  const renderedMessage = useMemo(() => {
    return renderWhatsAppTemplate(editorContent, variableMap);
  }, [editorContent, variableMap]);

  // Detect used variables in editor
  const detectedVariables = useMemo(() => {
    const matches = editorContent.match(/\{([^{}]+)\}/g) || [];
    const unique = Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, '').trim())));
    return unique;
  }, [editorContent]);

  // Insert variable tag into editor at cursor position
  const handleInsertVariable = (varKey: string) => {
    const textarea = textareaRef.current;
    const tag = `{${varKey}}`;
    if (!textarea) {
      setEditorContent((prev) => prev + tag);
      setIsSaved(false);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousValue = textarea.value;
    const newValue = previousValue.substring(0, start) + tag + previousValue.substring(end);

    setEditorContent(newValue);
    setIsSaved(false);

    // Reposition cursor right after the inserted variable tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  };

  // Format text wrapper (*bold*, _italic_, etc.)
  const handleWrapFormat = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end) || 'text';
    const wrapped = `${prefix}${selectedText}${suffix}`;
    const previousValue = textarea.value;
    const newValue = previousValue.substring(0, start) + wrapped + previousValue.substring(end);

    setEditorContent(newValue);
    setIsSaved(false);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  // Save template
  const handleSaveTemplate = () => {
    if (!activeTemplate) return;

    const updatedTemplate: NotificationTemplate = {
      ...activeTemplate,
      title: editorTitle.trim() || activeTemplate.title,
      content: editorContent,
    };

    const updatedList = allTemplates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t));
    setAllTemplates(updatedList);
    saveStoredTemplates(updatedList);
    onUpdateTemplate?.(updatedTemplate);
    onSaveTemplates?.(updatedList);
    setIsSaved(true);
    showToast(`Saved template: ${updatedTemplate.title}`);
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (!activeTemplate) return;
    const defaultTemplate = DEFAULT_TEMPLATES_FALLBACK.find((t) => t.id === activeTemplate.id) || 
      DEFAULT_TEMPLATES_FALLBACK.find((t) => t.type === activeTemplate.type);

    if (defaultTemplate && window.confirm('Reset this message template back to its default surf house layout?')) {
      setEditorContent(defaultTemplate.content);
      setEditorTitle(defaultTemplate.title);
      setIsSaved(false);
      showToast('Template reset to default layout. Click "Save Template" to persist.');
    }
  };

  // Copy preview to clipboard
  const handleCopyPreview = () => {
    navigator.clipboard.writeText(renderedMessage);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
    showToast('Rendered WhatsApp message copied to clipboard!');
  };

  // Copy raw template
  const handleCopyRaw = () => {
    navigator.clipboard.writeText(editorContent);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
    showToast('Raw template with placeholders copied!');
  };

  // Render WhatsApp markdown into HTML elements for preview
  const renderFormattedWhatsApp = (text: string) => {
    if (!text) return null;

    // Split text into lines
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      // If line is completely empty, render line break spacer
      if (!line.trim()) {
        return <div key={lineIdx} className="h-3" />;
      }

      // Format inline elements: *bold*, _italic_, ~strike~, links
      const parts = parseWhatsAppLine(line);

      return (
        <div key={lineIdx} className="leading-relaxed text-slate-800 text-[13px] break-words">
          {parts}
        </div>
      );
    });
  };

  // Simple WhatsApp parser helper
  const parseWhatsAppLine = (line: string): React.ReactNode[] => {
    // Regex for bold *text*, italic _text_, strike ~text~, url
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    // Regex matching *bold*, _italic_, ~strike~, or URLs
    const regex = /(\*([^*]+)\*)|(_([^_]+)_)|(~([^~]+)~)|(https?:\/\/[^\s]+)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(line)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        tokens.push(remaining.substring(lastIndex, match.index));
      }

      if (match[1]) {
        // Bold: *text*
        tokens.push(<strong key={keyIdx++} className="font-extrabold text-slate-900">{match[2]}</strong>);
      } else if (match[3]) {
        // Italic: _text_
        tokens.push(<em key={keyIdx++} className="italic text-slate-700">{match[4]}</em>);
      } else if (match[5]) {
        // Strike: ~text~
        tokens.push(<del key={keyIdx++} className="line-through text-slate-400">{match[6]}</del>);
      } else if (match[7]) {
        // URL
        tokens.push(
          <span key={keyIdx++} className="text-teal-700 underline font-medium break-all">
            {match[7]}
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      tokens.push(line.substring(lastIndex));
    }

    return tokens.length > 0 ? tokens : [line];
  };

  const filteredVariables = TEMPLATE_VARIABLES.filter(
    (v) => variableCategory === 'all' || v.category === variableCategory
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-lg text-slate-900 flex items-center gap-2">
                Visual WhatsApp Message Template Builder
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold tracking-wide uppercase">
                  Zero API Required
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize instant booking confirmation vouchers, upcoming stay countdown reminders, and welcome check-in codes with dynamic placeholders.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Controls & Global Action Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Builder Layout Mode Toggles */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setBuilderLayout('split')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                builderLayout === 'split'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Split View: Editor & Live Preview side-by-side"
            >
              <Columns className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Split View</span>
            </button>

            <button
              type="button"
              onClick={() => setBuilderLayout('editor')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                builderLayout === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Editor Only"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setBuilderLayout('preview')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                builderLayout === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Live Preview Only"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Live Preview</span>
            </button>
          </div>

          {toastMessage && (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fade-in flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={isSaved}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
              isSaved
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Template Saved' : 'Save Template Changes'}</span>
          </button>
        </div>
      </div>

      {/* Template Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
        {whatsappTemplates.map((tpl) => {
          const isSelected = tpl.id === activeTemplate.id;
          let badgeText = 'General';
          if (tpl.type === 'booking_confirmation') badgeText = 'Instant Confirmation';
          else if (tpl.type === 'upcoming_stay_reminder') badgeText = `${settings.autoRemindDaysBefore || 2}d Countdown`;
          else if (tpl.type === 'checkin_guide') badgeText = 'Arrival Day';
          else if (tpl.type === 'checkout_thanks') badgeText = 'Departure';

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setSelectedTemplateId(tpl.id)}
              className={`flex-1 min-w-[190px] px-3.5 py-2.5 rounded-xl text-left font-bold text-xs transition-all flex flex-col justify-between gap-1 border ${
                isSelected
                  ? 'bg-white text-slate-900 border-emerald-500 shadow-xs ring-2 ring-emerald-500/10'
                  : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate">{tpl.title}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase ${
                  isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {badgeText}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal truncate">
                {tpl.type === 'booking_confirmation' && 'Dispatched when reservation is completed'}
                {tpl.type === 'upcoming_stay_reminder' && `Triggered ${settings.autoRemindDaysBefore || 2} days before arrival`}
                {tpl.type === 'checkin_guide' && 'Gate access code & surf schedule on check-in'}
                {tpl.type === 'checkout_thanks' && 'Review request and photos on departure'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Builder Grid: Editor (Left) & Live Preview Pane (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Visual Variable Bar & Editor */}
        {(builderLayout === 'split' || builderLayout === 'editor') && (
          <div className={`${builderLayout === 'editor' ? 'lg:col-span-12' : 'lg:col-span-6'} space-y-4`}>
          {/* Template Title Input */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Template Label
              </label>
              <input
                type="text"
                value={editorTitle}
                onChange={(e) => {
                  setEditorTitle(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="e.g. Instant Booking Voucher (WhatsApp)"
              />
            </div>
            <div className="w-auto self-end">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                title="Revert back to default recommended format"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>
          </div>

          {/* Interactive Variable Insertion Palette */}
          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Insert Dynamic Variables</span>
                <span className="text-[10px] font-normal text-slate-500">
                  (Click any chip to place at cursor)
                </span>
              </div>

              {/* Filter category tabs */}
              <div className="flex items-center gap-1 text-[10px] font-bold">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'guest', label: 'Guest' },
                  { id: 'stay', label: 'Stay' },
                  { id: 'room', label: 'Room' },
                  { id: 'hostel', label: 'Hostel' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setVariableCategory(cat.id as any)}
                    className={`px-2 py-0.5 rounded-lg transition-colors ${
                      variableCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Variable Chips Horizontal Scroll/Wrap */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {filteredVariables.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => handleInsertVariable(v.key)}
                  title={`${v.description} → Preview: "${v.example}"`}
                  className="group px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 text-xs font-mono font-medium transition-all shadow-2xs flex items-center gap-1 active:scale-95"
                >
                  <span className="text-emerald-700 font-bold">{`{${v.key}}`}</span>
                  <span className="text-[10px] text-slate-400 font-sans group-hover:text-emerald-800">
                    {v.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Variable Explanation Legend */}
            <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                Variables automatically render in guest WhatsApp notifications with real reservation values.
              </span>
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {detectedVariables.length} variables detected in template
              </span>
            </div>
          </div>

          {/* WhatsApp Markdown & Quick Emoji Formatting Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-100/80 rounded-xl border border-slate-200/70 text-xs text-slate-700">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Format:</span>
              <button
                type="button"
                onClick={() => handleWrapFormat('*')}
                className="px-2 py-1 bg-white hover:bg-slate-200/60 rounded border border-slate-200 text-xs font-bold transition-colors"
                title="Bold (*text*)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleWrapFormat('_')}
                className="px-2 py-1 bg-white hover:bg-slate-200/60 rounded border border-slate-200 text-xs font-bold transition-colors"
                title="Italic (_text_)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleWrapFormat('~')}
                className="px-2 py-1 bg-white hover:bg-slate-200/60 rounded border border-slate-200 text-xs font-bold transition-colors"
                title="Strikethrough (~text~)"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleWrapFormat('```')}
                className="px-2 py-1 bg-white hover:bg-slate-200/60 rounded border border-slate-200 text-xs font-bold transition-colors"
                title="Monospace (```code```)"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (!textarea) return;
                  const start = textarea.selectionStart;
                  const val = textarea.value;
                  const inserted = '\n• ';
                  setEditorContent(val.substring(0, start) + inserted + val.substring(start));
                  setIsSaved(false);
                  setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + inserted.length, start + inserted.length);
                  }, 10);
                }}
                className="px-2 py-1 bg-white hover:bg-slate-200/60 rounded border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                title="Insert Bullet Point"
              >
                <List className="w-3.5 h-3.5" />
                <span className="text-[10px]">Bullet</span>
              </button>
            </div>

            {/* Quick surf emojis */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Quick Icons:</span>
              {['🤙', '🏄‍♂️', '🌊', '☀️', '🏠', '🔑', '📅', '💰', '📍'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    const textarea = textareaRef.current;
                    if (!textarea) {
                      setEditorContent((prev) => prev + emoji);
                      setIsSaved(false);
                      return;
                    }
                    const start = textarea.selectionStart;
                    const val = textarea.value;
                    setEditorContent(val.substring(0, start) + emoji + val.substring(start));
                    setIsSaved(false);
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                    }, 10);
                  }}
                  className="hover:scale-125 transition-transform text-sm p-0.5"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Template Content Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={16}
              value={editorContent}
              onChange={(e) => {
                setEditorContent(e.target.value);
                setIsSaved(false);
              }}
              className="w-full bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs leading-relaxed border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-inner"
              placeholder="Draft your WhatsApp message template here with variables like {guestName}, {roomName}, {checkInDate}..."
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRaw}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1 transition-colors"
              >
                {copiedRaw ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRaw ? 'Copied' : 'Copy Raw'}</span>
              </button>
            </div>
          </div>

          {/* Editor stats & helper */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Lines: {editorContent.split('\n').length} | Characters: {editorContent.length}
            </span>
            <span>
              Supports standard WhatsApp typography: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">*bold*</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">_italics_</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">~strike~</code>
            </span>
          </div>
        </div>
      )}

        {/* RIGHT COLUMN: Interactive Live WhatsApp Preview Pane */}
        {(builderLayout === 'split' || builderLayout === 'preview') && (
          <div className={builderLayout === 'preview' ? 'lg:col-span-12' : 'lg:col-span-6'}>
            <WhatsAppLivePreviewPane
              templateContent={editorContent}
              templateTitle={editorTitle}
              settings={settings}
              bookings={bookings}
              rooms={rooms}
              addOns={addOns}
              onAutoFixVariable={handleAutoFixVariable}
            />
          </div>
        )}
      </div>
    </div>
  );
};
