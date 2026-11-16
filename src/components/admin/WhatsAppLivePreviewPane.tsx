import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Monitor,
  Eye,
  Sparkles,
  Copy,
  Check,
  Send,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Smile,
  Info,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Table,
  FileText,
  MessageSquare,
  Wand2,
  User,
  Calendar,
  Bed,
  DollarSign,
  Wifi,
  MapPin,
  Clock
} from 'lucide-react';
import { Booking, HostelSettings, Room, SurfAddOn } from '../../types';
import {
  createWhatsAppUrl,
  getTemplateVariableMap,
  renderWhatsAppTemplate,
  TemplateVariablesContext,
  formatSurfLevel
} from '../../utils/whatsapp';
import { INITIAL_BOOKINGS } from '../../data/initialData';

export interface WhatsAppLivePreviewPaneProps {
  templateContent: string;
  templateTitle?: string;
  settings: HostelSettings;
  bookings: Booking[];
  rooms?: Room[];
  addOns?: SurfAddOn[];
  onAutoFixVariable?: (oldVar: string, newVar: string) => void;
}

// Built-in sample guest personas for diverse preview conditions
export interface SamplePersona {
  id: string;
  label: string;
  tag: string;
  description: string;
  data: Partial<Booking>;
}

const SAMPLE_PERSONAS: SamplePersona[] = [
  {
    id: 'solo_camper',
    label: 'Lucas Silva',
    tag: 'Solo Camper',
    description: '4 nights in Dorm Bed #3, Intermediate Surfer, Board Rental',
    data: {
      id: 'demo-lucas',
      referenceNumber: 'WH-8492',
      roomId: 'dorm-mixed-6',
      roomName: '6-Bed Ocean Breeze Mixed Dorm (Bed #3)',
      checkInDate: '2026-09-22',
      checkOutDate: '2026-09-26',
      nights: 4,
      guestsCount: 1,
      totalAmount: 180.0,
      paymentStatus: 'deposit',
      guest: {
        firstName: 'Lucas',
        lastName: 'Silva',
        email: 'lucas.silva@example.com',
        phone: '+351 912 987 654',
        country: 'Portugal',
        surfLevel: 'intermediate',
        arrivalEstimatedTime: '15:30',
        specialRequests: 'Top bunk if available, bringing personal 6\'2 surfboard',
      },
      addOns: [
        { addOnId: 'addon-board-rental', quantity: 1, days: 4 },
        { addOnId: 'addon-breakfast', quantity: 1, days: 4 },
      ],
    },
  },
  {
    id: 'couple_suite',
    label: 'Elena & Mateus Rostova',
    tag: 'Couple Suite',
    description: '7 nights in Sunset Ocean Suite, Beginner Surf Package + Breakfast',
    data: {
      id: 'demo-elena',
      referenceNumber: 'WH-9104',
      roomId: 'suite-sunset',
      roomName: 'Sunset Ocean View Private Suite',
      checkInDate: '2026-09-25',
      checkOutDate: '2026-10-02',
      nights: 7,
      guestsCount: 2,
      totalAmount: 890.0,
      paymentStatus: 'paid',
      guest: {
        firstName: 'Elena',
        lastName: 'Rostova',
        email: 'elena.rostova@example.com',
        phone: '+49 170 555 4321',
        country: 'Germany',
        surfLevel: 'beginner',
        arrivalEstimatedTime: '13:00',
        specialRequests: 'Celebrating 5-year surf anniversary!',
      },
      addOns: [
        { addOnId: 'addon-surf-lesson', quantity: 2, days: 5 },
        { addOnId: 'addon-breakfast', quantity: 2, days: 7 },
        { addOnId: 'addon-wetsuit', quantity: 2, days: 7 },
      ],
    },
  },
  {
    id: 'urgent_arrival',
    label: 'Marcus Vance',
    tag: 'Arrival Today',
    description: '2 nights in Deluxe Private Room, Advanced Surfer, Fast Check-in',
    data: {
      id: 'demo-marcus',
      referenceNumber: 'WH-7731',
      roomId: 'room-deluxe-double',
      roomName: 'Deluxe Double Room (Balcony)',
      checkInDate: '2026-09-19',
      checkOutDate: '2026-09-21',
      nights: 2,
      guestsCount: 1,
      totalAmount: 210.0,
      paymentStatus: 'paid',
      guest: {
        firstName: 'Marcus',
        lastName: 'Vance',
        email: 'marcus.v@example.com',
        phone: '+44 7700 900 123',
        country: 'United Kingdom',
        surfLevel: 'advanced',
        arrivalEstimatedTime: '17:00',
        specialRequests: 'Need lockable board rack for 3 high-performance boards',
      },
      addOns: [
        { addOnId: 'addon-board-rental', quantity: 1, days: 2 },
      ],
    },
  },
  {
    id: 'budget_backpacker',
    label: 'Sophie Martin',
    tag: 'Deposit Pending',
    description: '1 night in 8-Bed Dorm Bed #1, Non-Surfer, Cash Balance Due',
    data: {
      id: 'demo-sophie',
      referenceNumber: 'WH-5520',
      roomId: 'dorm-mixed-8',
      roomName: '8-Bed Coastal Mixed Dorm (Bed #1)',
      checkInDate: '2026-09-28',
      checkOutDate: '2026-09-29',
      nights: 1,
      guestsCount: 1,
      totalAmount: 35.0,
      paymentStatus: 'pending',
      guest: {
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 'sophie.m@example.fr',
        phone: '+33 6 12 34 56 78',
        country: 'France',
        surfLevel: 'non_surfer',
        arrivalEstimatedTime: '19:30',
        specialRequests: 'Late arrival check-in via keycode lockbox',
      },
      addOns: [],
    },
  },
];

export const WhatsAppLivePreviewPane: React.FC<WhatsAppLivePreviewPaneProps> = ({
  templateContent,
  templateTitle,
  settings,
  bookings,
  rooms = [],
  addOns = [],
  onAutoFixVariable,
}) => {
  // Selected preview source: 'preset:solo_camper', 'preset:couple_suite', etc., or 'booking:<id>', or 'custom'
  const [selectedSource, setSelectedSource] = useState<string>('preset:solo_camper');

  // Preview display mode: 'mobile', 'web', 'table', 'text'
  const [displayMode, setDisplayMode] = useState<'mobile' | 'web' | 'table' | 'text'>('mobile');

  // Dynamic variable highlight toggle
  const [highlightDynamic, setHighlightDynamic] = useState<boolean>(true);

  // Custom variable overrides (when admin wants to customize specific values on the fly)
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [customOverrides, setCustomOverrides] = useState<Record<string, string>>({});

  // Feedback states
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Resolve base booking from source selection
  const activeBooking = useMemo<Booking>(() => {
    if (selectedSource.startsWith('preset:')) {
      const personaId = selectedSource.replace('preset:', '');
      const persona = SAMPLE_PERSONAS.find((p) => p.id === personaId) || SAMPLE_PERSONAS[0];
      return {
        ...INITIAL_BOOKINGS[0],
        ...persona.data,
      } as Booking;
    }

    if (selectedSource.startsWith('booking:')) {
      const bId = selectedSource.replace('booking:', '');
      const real = bookings.find((b) => b.id === bId);
      if (real) return real;
    }

    return INITIAL_BOOKINGS[0];
  }, [selectedSource, bookings]);

  // Compute base variable map from context
  const baseVariableMap = useMemo(() => {
    const context: TemplateVariablesContext = {
      booking: activeBooking,
      room: rooms.find((r) => r.id === activeBooking?.roomId),
      addOns,
      settings,
      daysUntil: settings.autoRemindDaysBefore || 2,
    };
    return getTemplateVariableMap(context);
  }, [activeBooking, rooms, addOns, settings]);

  // Combined variable map including any active custom overrides
  const effectiveVariableMap = useMemo(() => {
    return {
      ...baseVariableMap,
      ...customOverrides,
    };
  }, [baseVariableMap, customOverrides]);

  // Detect all placeholders in template: {key}
  const detectedPlaceholders = useMemo(() => {
    const matches = templateContent.match(/\{([^{}]+)\}/g) || [];
    const keys = Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, '').trim())));
    return keys.map((key) => {
      const isRecognized = effectiveVariableMap[key] !== undefined;
      const sampleValue = effectiveVariableMap[key] || '';
      return {
        key,
        placeholder: `{${key}}`,
        isRecognized,
        sampleValue,
      };
    });
  }, [templateContent, effectiveVariableMap]);

  // List of unrecognized placeholders (potential typos like {gestName} or {checkin})
  const unrecognizedPlaceholders = useMemo(() => {
    return detectedPlaceholders.filter((p) => !p.isRecognized);
  }, [detectedPlaceholders]);

  // Rendered string with placeholders replaced
  const renderedMessageText = useMemo(() => {
    return renderWhatsAppTemplate(templateContent, effectiveVariableMap);
  }, [templateContent, effectiveVariableMap]);

  // Copy rendered message
  const handleCopy = () => {
    navigator.clipboard.writeText(renderedMessageText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    showToast('Live rendered WhatsApp message copied to clipboard!');
  };

  // Reset custom overrides
  const handleResetCustomOverrides = () => {
    setCustomOverrides({});
    setIsCustomizing(false);
    showToast('Reset sample values to selected preset.');
  };

  // Best guess suggestion for a typo
  const getSuggestionForTypo = (typo: string): string | null => {
    const lower = typo.toLowerCase().replace(/[^a-z]/g, '');
    const knownKeys = Object.keys(baseVariableMap);

    // Direct contains or prefix match
    const found = knownKeys.find((k) => {
      const kLower = k.toLowerCase();
      return kLower.includes(lower) || lower.includes(kLower);
    });

    return found || null;
  };

  // WhatsApp markdown & token parser supporting dynamic placeholder highlighting
  const renderMessageWithHighlights = (content: string) => {
    if (!content) {
      return <span className="text-slate-400 italic text-xs">No template text written yet.</span>;
    }

    // Split template into lines
    const lines = content.split('\n');

    return lines.map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={lineIdx} className="h-2.5" />;
      }

      // First, tokenize the line by placeholders {placeholder}
      const lineTokens = tokenizeLinePlaceholders(line);

      return (
        <div key={lineIdx} className="leading-relaxed text-[13px] text-slate-800 break-words font-sans">
          {lineTokens.map((tok, tokIdx) => {
            if (tok.type === 'variable') {
              const isMapped = effectiveVariableMap[tok.varKey] !== undefined;
              const val = isMapped ? effectiveVariableMap[tok.varKey] : tok.raw;

              if (highlightDynamic) {
                return (
                  <span
                    key={tokIdx}
                    className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[12px] font-semibold transition-all ${
                      isMapped
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 ring-1 ring-emerald-400/30'
                        : 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-400/30 font-mono'
                    }`}
                    title={isMapped ? `Injected placeholder: {${tok.varKey}}` : `⚠️ Unmapped variable: {${tok.varKey}}`}
                  >
                    {val}
                  </span>
                );
              }

              // Non-highlighted: format inline formatting inside the injected value if any
              return <span key={tokIdx}>{formatInlineMarkdown(val)}</span>;
            }

            // Static text token: parse inline WhatsApp markdown (*bold*, _italics_, etc.)
            return <React.Fragment key={tokIdx}>{formatInlineMarkdown(tok.text)}</React.Fragment>;
          })}
        </div>
      );
    });
  };

  // Tokenize line into static text and placeholder tokens
  interface LineToken {
    type: 'text' | 'variable';
    text: string;
    varKey: string;
    raw: string;
  }

  const tokenizeLinePlaceholders = (line: string): LineToken[] => {
    const tokens: LineToken[] = [];
    const regex = /\{([^{}]+)\}/g;
    let match: RegExpExecArray | null;
    let lastIdx = 0;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        tokens.push({
          type: 'text',
          text: line.substring(lastIdx, match.index),
          varKey: '',
          raw: '',
        });
      }

      tokens.push({
        type: 'variable',
        text: '',
        varKey: match[1].trim(),
        raw: match[0],
      });

      lastIdx = regex.lastIndex;
    }

    if (lastIdx < line.length) {
      tokens.push({
        type: 'text',
        text: line.substring(lastIdx),
        varKey: '',
        raw: '',
      });
    }

    return tokens.length > 0 ? tokens : [{ type: 'text', text: line, varKey: '', raw: '' }];
  };

  // Helper to format WhatsApp markdown (*bold*, _italic_, ~strike~, monospace, URLs)
  const formatInlineMarkdown = (text: string): React.ReactNode[] => {
    if (!text) return [];

    const tokens: React.ReactNode[] = [];
    const regex = /(\*([^*]+)\*)|(_([^_]+)_)|(~([^~]+)~)|(```([^`]+)```)|(https?:\/\/[^\s]+)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    let keyIdx = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(text.substring(lastIndex, match.index));
      }

      if (match[1]) {
        // Bold: *text*
        tokens.push(
          <strong key={keyIdx++} className="font-extrabold text-slate-900">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // Italic: _text_
        tokens.push(
          <em key={keyIdx++} className="italic text-slate-700">
            {match[4]}
          </em>
        );
      } else if (match[5]) {
        // Strike: ~text~
        tokens.push(
          <del key={keyIdx++} className="line-through text-slate-400">
            {match[6]}
          </del>
        );
      } else if (match[7]) {
        // Monospace: ```code```
        tokens.push(
          <code key={keyIdx++} className="bg-slate-200/80 text-slate-800 font-mono text-[11px] px-1 py-0.5 rounded">
            {match[8]}
          </code>
        );
      } else if (match[9]) {
        // URL
        tokens.push(
          <span key={keyIdx++} className="text-teal-700 underline font-medium break-all">
            {match[9]}
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push(text.substring(lastIndex));
    }

    return tokens.length > 0 ? tokens : [text];
  };

  // Text metrics
  const charCount = renderedMessageText.length;
  const wordCount = renderedMessageText.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = renderedMessageText.split('\n').length;
  const readingTimeSeconds = Math.max(1, Math.round(wordCount / 3.5));

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Live Preview Header Toolbar */}
      <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-extrabold text-sm text-white">
                Live WhatsApp Preview Pane
              </h4>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Real-time
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Evaluating all <span className="font-mono text-emerald-400">{detectedPlaceholders.length}</span> dynamic placeholders with sample reservation data
            </p>
          </div>
        </div>

        {/* Display Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setDisplayMode('mobile')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              displayMode === 'mobile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Mobile Smartphone Chat View"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('web')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              displayMode === 'web'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="WhatsApp Web Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('table')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              displayMode === 'table'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Placeholder Inspector & Mapping Table"
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Variables</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('text')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              displayMode === 'text'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Plain Text Output & Message Metrics"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Text</span>
          </button>
        </div>
      </div>

      {/* Sample Data Persona & Highlight Controls Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Sample Profile Selector */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px] shrink-0">
            <User className="w-3.5 h-3.5 text-teal-600" />
            <span>Sample Guest:</span>
          </span>

          <select
            value={selectedSource}
            onChange={(e) => {
              setSelectedSource(e.target.value);
              setCustomOverrides({});
            }}
            className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 text-xs focus:border-emerald-500 focus:outline-none shadow-2xs"
          >
            <optgroup label="Hostel Persona Presets">
              {SAMPLE_PERSONAS.map((p) => (
                <option key={p.id} value={`preset:${p.id}`}>
                  🏄 {p.label} — {p.tag} ({p.description.split(',')[0]})
                </option>
              ))}
            </optgroup>

            {bookings.length > 0 && (
              <optgroup label="Live Existing Reservations">
                {bookings.slice(0, 10).map((b) => (
                  <option key={b.id} value={`booking:${b.id}`}>
                    📋 {b.guest.firstName} {b.guest.lastName} (#{b.referenceNumber}) • {b.roomName}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <button
            type="button"
            onClick={() => setIsCustomizing((prev) => !prev)}
            className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors ${
              isCustomizing
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Customize individual sample values"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Tune</span>
          </button>
        </div>

        {/* Dynamic Highlight Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-slate-700 text-[11px]">
            <input
              type="checkbox"
              checked={highlightDynamic}
              onChange={(e) => setHighlightDynamic(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
            />
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Highlight Replaced Data</span>
            </span>
          </label>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Quick Copy Action */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
            title="Copy rendered message with placeholders evaluated"
          >
            {copiedText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedText ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Custom Sample Values Drawer */}
      {isCustomizing && (
        <div className="p-4 bg-amber-50/70 border-b border-amber-200 text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>Override Sample Values for Live Testing</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCustomOverrides}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to Preset</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCustomizing(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Guest Name</label>
              <input
                type="text"
                value={customOverrides.guestName !== undefined ? customOverrides.guestName : effectiveVariableMap.guestName || ''}
                onChange={(e) => setCustomOverrides({ ...customOverrides, guestName: e.target.value, guestFirstName: e.target.value.split(' ')[0] })}
                className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Room / Dorm Bed</label>
              <input
                type="text"
                value={customOverrides.roomName !== undefined ? customOverrides.roomName : effectiveVariableMap.roomName || ''}
                onChange={(e) => setCustomOverrides({ ...customOverrides, roomName: e.target.value })}
                className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Check-In Date</label>
              <input
                type="date"
                value={customOverrides.checkInDate !== undefined ? customOverrides.checkInDate : effectiveVariableMap.checkInDate || ''}
                onChange={(e) => setCustomOverrides({ ...customOverrides, checkInDate: e.target.value })}
                className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Total Amount</label>
              <input
                type="text"
                value={customOverrides.totalAmount !== undefined ? customOverrides.totalAmount : effectiveVariableMap.totalAmount || ''}
                onChange={(e) => setCustomOverrides({ ...customOverrides, totalAmount: e.target.value })}
                className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Guest Phone</label>
              <input
                type="text"
                value={customOverrides.phone !== undefined ? customOverrides.phone : effectiveVariableMap.phone || ''}
                onChange={(e) => setCustomOverrides({ ...customOverrides, phone: e.target.value })}
                className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Payment Status</label>
              <input
                type="text"
                value={customOverrides.paymentStatus !== undefined ? customOverrides.paymentStatus : effectiveVariableMap.paymentStatus || ''}
                onChange={(e) => setCustomOverrides({ ...customOverrides, paymentStatus: e.target.value })}
                className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Wi-Fi Password</label>
              <input
                type="text"
                value={customOverrides.wifiPassword !== undefined ? customOverrides.wifiPassword : effectiveVariableMap.wifiPassword || ''}
                onChange={(e) => setCustomOverrides({ ...customOverrides, wifiPassword: e.target.value })}
                className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Booking Ref</label>
              <input
                type="text"
                value={customOverrides.bookingRef !== undefined ? customOverrides.bookingRef : effectiveVariableMap.bookingRef || ''}
                onChange={(e) => setCustomOverrides({ ...customOverrides, bookingRef: e.target.value })}
                className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Unrecognized Variables Diagnostic Alert */}
      {unrecognizedPlaceholders.length > 0 && (
        <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">
                {unrecognizedPlaceholders.length} unrecognized placeholder{unrecognizedPlaceholders.length === 1 ? '' : 's'}:
              </span>{' '}
              <span className="font-mono text-[11px] font-semibold">
                {unrecognizedPlaceholders.map((u) => u.placeholder).join(', ')}
              </span>
              <p className="text-[11px] text-amber-800">
                These tags will appear as raw text to the guest unless corrected.
              </p>
            </div>
          </div>

          {onAutoFixVariable && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {unrecognizedPlaceholders.map((u) => {
                const suggestion = getSuggestionForTypo(u.key);
                if (!suggestion) return null;
                return (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => onAutoFixVariable(u.placeholder, `{${suggestion}}`)}
                    className="px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Fix {u.placeholder} → {'{'}{suggestion}{'}'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Toast feedback banner */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 text-center transition-all flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* PREVIEW CONTENT BODY BY MODE */}
      <div className="p-4 sm:p-6 bg-slate-100 flex-1 flex flex-col items-center justify-center min-h-[480px]">
        {/* MODE 1: MOBILE SMARTPHONE VIEW */}
        {displayMode === 'mobile' && (
          <div className="w-full max-w-[370px] bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-slate-800 transition-all">
            {/* Phone Speaker & Notch */}
            <div className="flex items-center justify-between px-6 pt-1 pb-2">
              <span className="text-[10px] font-bold text-slate-400">9:41</span>
              <div className="w-16 h-3 bg-slate-800 rounded-full" />
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2 bg-slate-400 rounded-2xs" />
                <div className="w-2 h-2 rounded-full bg-slate-400" />
              </div>
            </div>

            {/* WhatsApp App Canvas Screen */}
            <div className="bg-[#EFEAE2] rounded-[28px] overflow-hidden flex flex-col h-[500px] shadow-inner border border-slate-700/50 relative">
              {/* WhatsApp App Top Bar */}
              <div className="bg-[#008069] text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs font-bold">‹</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center font-bold text-xs text-white shadow-2xs">
                    🏄
                  </div>
                  <div>
                    <h5 className="font-bold text-xs leading-tight truncate max-w-[150px]">
                      {settings.name || 'WaveHaven Surf House'}
                    </h5>
                    <p className="text-[10px] text-emerald-100 flex items-center gap-1 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      verified hostel desk
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white/90 text-xs">
                  <span title="Voice call">📞</span>
                  <span title="More options">⋮</span>
                </div>
              </div>

              {/* Chat Wallpaper Canvas */}
              <div
                className="flex-1 p-3 overflow-y-auto space-y-2"
                style={{
                  backgroundImage: 'radial-gradient(#c8c2bc 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              >
                {/* Date marker pill */}
                <div className="flex justify-center my-1">
                  <span className="bg-white/80 backdrop-blur-xs text-[10px] font-bold text-slate-600 px-2.5 py-0.5 rounded-md shadow-2xs">
                    TODAY
                  </span>
                </div>

                {/* WhatsApp Chat Message Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[94%] bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-3 shadow-xs border border-[#C2E8BA] text-slate-900 relative">
                    {/* Rendered content */}
                    <div className="space-y-0.5">
                      {renderMessageWithHighlights(templateContent)}
                    </div>

                    {/* Timestamp & Double Blue Ticks */}
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-500 font-sans">
                      <span>14:32</span>
                      <span className="text-[#53BDEB] font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone Mock Bottom Input Bar */}
              <div className="bg-[#F0F2F5] p-2 flex items-center gap-2 border-t border-slate-200 shrink-0">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">
                  <Smile className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-white rounded-full px-3 py-1 text-xs text-slate-400 border border-slate-200">
                  Message
                </div>
                <div className="w-7 h-7 rounded-full bg-[#008069] text-white flex items-center justify-center text-xs font-bold">
                  🎙️
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: WHATSAPP WEB DESKTOP VIEW */}
        {displayMode === 'web' && (
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden flex flex-col">
            {/* Desktop WhatsApp Header */}
            <div className="bg-[#F0F2F5] border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#008069] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  🏄
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-900 leading-tight">
                    {effectiveVariableMap.guestName || 'Guest Chat'}
                  </h5>
                  <p className="text-xs text-slate-500">
                    {effectiveVariableMap.phone || '+351 912 987 654'} • WhatsApp Web
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <span>🔍</span>
                <span>📎</span>
                <span>⋮</span>
              </div>
            </div>

            {/* Desktop WhatsApp Chat Area */}
            <div
              className="p-6 overflow-y-auto min-h-[380px] max-h-[500px]"
              style={{
                backgroundColor: '#EFEAE2',
                backgroundImage: 'radial-gradient(#c8c2bc 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            >
              <div className="flex justify-center mb-4">
                <span className="bg-white/90 text-slate-600 text-xs font-bold px-3 py-1 rounded-lg shadow-xs">
                  TODAY
                </span>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[85%] bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-4 shadow-sm border border-[#C2E8BA]">
                  <div className="space-y-1">
                    {renderMessageWithHighlights(templateContent)}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 mt-2 text-xs text-slate-500">
                    <span>14:32</span>
                    <span className="text-[#53BDEB] font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Bottom Input Bar */}
            <div className="bg-[#F0F2F5] px-4 py-3 flex items-center gap-3 border-t border-slate-200">
              <span className="text-slate-500 text-lg">😊</span>
              <span className="text-slate-500 text-lg">📎</span>
              <div className="flex-1 bg-white rounded-xl px-4 py-2 text-xs text-slate-400 border border-slate-200 shadow-2xs">
                Type a message
              </div>
              <span className="text-slate-500 text-lg">🎙️</span>
            </div>
          </div>
        )}

        {/* MODE 3: PLACEHOLDER INSPECTOR & VARIABLES TABLE */}
        {displayMode === 'table' && (
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h5 className="font-heading font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <span>Dynamic Placeholders Inspector</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {detectedPlaceholders.length} Used in Template
                  </span>
                </h5>
                <p className="text-xs text-slate-500">
                  Verify how each dynamic placeholder is mapped and evaluated against sample reservation values.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCustomizing(true)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Edit Sample Data</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[440px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Placeholder</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Evaluated Sample Value</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {detectedPlaceholders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        No dynamic placeholders like <code className="text-slate-700 font-mono">{'{guestName}'}</code> detected in template.
                      </td>
                    </tr>
                  ) : (
                    detectedPlaceholders.map((p) => {
                      const isUnrecognized = !p.isRecognized;
                      return (
                        <tr
                          key={p.key}
                          className={`transition-colors ${
                            isUnrecognized ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-mono font-bold text-slate-900">
                            <span className={isUnrecognized ? 'text-amber-700 underline decoration-wavy' : 'text-emerald-700'}>
                              {p.placeholder}
                            </span>
                          </td>
                          <td className="p-3">
                            {p.isRecognized ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Mapped</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Unrecognized</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-800 max-w-[280px]">
                            {isUnrecognized ? (
                              <span className="text-slate-400 italic">
                                Will output as literal string "{p.placeholder}"
                              </span>
                            ) : (
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-900 font-medium break-words">
                                {p.sampleValue}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isUnrecognized && onAutoFixVariable ? (
                              (() => {
                                const suggestion = getSuggestionForTypo(p.key);
                                if (!suggestion) return <span className="text-slate-400 text-[11px]">—</span>;
                                return (
                                  <button
                                    type="button"
                                    onClick={() => onAutoFixVariable(p.placeholder, `{${suggestion}}`)}
                                    className="px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px] inline-flex items-center gap-1 transition-colors"
                                  >
                                    <Wand2 className="w-3 h-3" />
                                    <span>Fix to {'{'}{suggestion}{'}'}</span>
                                  </button>
                                );
                              })()
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(p.sampleValue);
                                  showToast(`Copied sample value: ${p.sampleValue}`);
                                }}
                                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline"
                              >
                                Copy Value
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODE 4: PLAIN TEXT & METRICS VIEW */}
        {displayMode === 'text' && (
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h5 className="font-heading font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Evaluated Plain Text Output</span>
              </h5>
              <span className="text-xs font-bold text-slate-500">
                Est. Read Time: ~{readingTimeSeconds}s
              </span>
            </div>

            {/* Plain text area */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap select-all">
              {renderedMessageText}
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Characters</span>
                <span className="text-base font-extrabold text-slate-900">{charCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Words</span>
                <span className="text-base font-extrabold text-slate-900">{wordCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Lines</span>
                <span className="text-base font-extrabold text-slate-900">{lineCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Placeholders</span>
                <span className="text-base font-extrabold text-emerald-600">{detectedPlaceholders.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Bottom Action Bar */}
      <div className="p-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Test dispatch opens official WhatsApp Web / Mobile with the rendered text pre-populated.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Copied to Clipboard' : 'Copy Rendered Message'}</span>
          </button>

          <a
            href={createWhatsAppUrl(
              effectiveVariableMap.phone || settings.phone,
              renderedMessageText
            )}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Send in WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
