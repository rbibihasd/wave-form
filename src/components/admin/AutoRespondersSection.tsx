import React, { useState, useMemo } from 'react';
import { 
  Zap, MessageCircle, CheckCircle2, XCircle, Clock, 
  Send, Edit3, Save, RotateCcw, Smartphone, ShieldCheck, 
  Sparkles, Check, AlertCircle, Copy, Eye, Sliders, 
  Layers, ChevronDown, ChevronUp, History, Trash2,
  ExternalLink, Key, Award, UserCheck, CalendarCheck
} from 'lucide-react';
import { 
  AutoResponderRule, 
  AutoResponderLog, 
  AutoRespondersConfig, 
  AutoResponderTriggerStatus, 
  Booking, 
  HostelSettings, 
  Room, 
  SurfAddOn 
} from '../../types';
import { 
  getStoredAutoRespondersConfig, 
  saveStoredAutoRespondersConfig, 
  getStoredAutoResponderLogs, 
  clearAutoResponderLogs, 
  formatAutoResponderMessage, 
  addAutoResponderLog,
  DEFAULT_AUTO_RESPONDER_RULES 
} from '../../utils/autoResponders';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { formatDisplayDate } from '../../utils/date';
import { INITIAL_BOOKINGS } from '../../data/initialData';

interface AutoRespondersSectionProps {
  settings: HostelSettings;
  bookings: Booking[];
  rooms?: Room[];
  addOns?: SurfAddOn[];
  onShowToast?: (message: string) => void;
  onSaveSettings?: (settings: HostelSettings) => void;
}

export const AutoRespondersSection: React.FC<AutoRespondersSectionProps> = ({
  settings,
  bookings,
  rooms = [],
  addOns = [],
  onShowToast,
}) => {
  // Load configuration from local storage
  const [config, setConfig] = useState<AutoRespondersConfig>(() => getStoredAutoRespondersConfig());
  const [logs, setLogs] = useState<AutoResponderLog[]>(() => getStoredAutoResponderLogs());
  
  // Active editing rule
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  // Simulator state
  const [selectedSimBookingId, setSelectedSimBookingId] = useState<string>(() => {
    return bookings[0]?.id || INITIAL_BOOKINGS[0].id;
  });
  const [selectedSimStatus, setSelectedSimStatus] = useState<AutoResponderTriggerStatus>('confirmed');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [showLogs, setShowLogs] = useState(true);

  const selectedSimBooking = useMemo(() => {
    return bookings.find((b) => b.id === selectedSimBookingId) || bookings[0] || INITIAL_BOOKINGS[0];
  }, [bookings, selectedSimBookingId]);

  const activeRulesCount = useMemo(() => {
    return config.rules.filter((r) => r.enabled).length;
  }, [config.rules]);

  const totalDispatchedCount = useMemo(() => {
    return config.rules.reduce((sum, r) => sum + (r.triggersCount || 0), 0);
  }, [config.rules]);

  const showToast = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    }
  };

  // Toggle Master Enable
  const handleToggleMaster = (enabled: boolean) => {
    const updated: AutoRespondersConfig = {
      ...config,
      masterEnabled: enabled,
    };
    setConfig(updated);
    saveStoredAutoRespondersConfig(updated);
    showToast(
      enabled
        ? '⚡ WhatsApp Auto-Responders ACTIVATED — Automatic replies will fire on status changes.'
        : '⏸️ WhatsApp Auto-Responders PAUSED — All automatic replies suspended.'
    );
  };

  // Toggle specific rule
  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    const updatedRules = config.rules.map((r) => {
      if (r.id === ruleId) {
        return { ...r, enabled };
      }
      return r;
    });
    const updatedConfig: AutoRespondersConfig = {
      ...config,
      rules: updatedRules,
    };
    setConfig(updatedConfig);
    saveStoredAutoRespondersConfig(updatedConfig);

    const rule = config.rules.find((r) => r.id === ruleId);
    showToast(
      `${rule?.name || 'Auto-responder'} is now ${enabled ? 'ENABLED' : 'DISABLED'}.`
    );
  };

  // Start editing a rule's template
  const handleStartEditing = (rule: AutoResponderRule) => {
    setEditingRuleId(rule.id);
    setEditedContent(rule.templateContent);
  };

  // Save edited rule template
  const handleSaveRuleContent = (ruleId: string) => {
    const updatedRules = config.rules.map((r) => {
      if (r.id === ruleId) {
        return { ...r, templateContent: editedContent };
      }
      return r;
    });
    const updatedConfig: AutoRespondersConfig = {
      ...config,
      rules: updatedRules,
    };
    setConfig(updatedConfig);
    saveStoredAutoRespondersConfig(updatedConfig);
    setEditingRuleId(null);
    showToast('Auto-responder message template saved successfully!');
  };

  // Reset rule to default template
  const handleResetRuleToDefault = (ruleId: string) => {
    const defaultRule = DEFAULT_AUTO_RESPONDER_RULES.find((r) => r.id === ruleId);
    if (!defaultRule) return;

    const confirmReset = window.confirm(`Reset "${defaultRule.name}" to default message template?`);
    if (!confirmReset) return;

    const updatedRules = config.rules.map((r) => {
      if (r.id === ruleId) {
        return { ...r, templateContent: defaultRule.templateContent };
      }
      return r;
    });
    const updatedConfig: AutoRespondersConfig = {
      ...config,
      rules: updatedRules,
    };
    setConfig(updatedConfig);
    saveStoredAutoRespondersConfig(updatedConfig);
    if (editingRuleId === ruleId) {
      setEditedContent(defaultRule.templateContent);
    }
    showToast(`Reset ${defaultRule.name} to standard template.`);
  };

  // Compute live simulated auto-reply message
  const activeSimRule = useMemo(() => {
    return config.rules.find((r) => r.triggerStatus === selectedSimStatus) || config.rules[0];
  }, [config.rules, selectedSimStatus]);

  const simulatedMessage = useMemo(() => {
    if (!activeSimRule || !selectedSimBooking) return '';
    const room = rooms.find((r) => r.id === selectedSimBooking.roomId);
    return formatAutoResponderMessage(
      activeSimRule.templateContent,
      selectedSimBooking,
      settings,
      room,
      selectedSimBooking.status === 'cancelled' ? selectedSimBooking.cancellationReason : 'Scheduled departure / date modification'
    );
  }, [activeSimRule, selectedSimBooking, settings, rooms]);

  // Handle test dispatch via WhatsApp
  const handleTestSendWhatsApp = () => {
    if (!selectedSimBooking || !simulatedMessage) return;
    const url = createWhatsAppUrl(selectedSimBooking.guest.phone, simulatedMessage);
    window.open(url, '_blank', 'noopener,noreferrer');

    // Record in logs
    const newLog = addAutoResponderLog({
      ruleId: activeSimRule.id,
      ruleName: activeSimRule.name,
      triggerStatus: activeSimRule.triggerStatus,
      bookingId: selectedSimBooking.id,
      bookingRef: selectedSimBooking.referenceNumber,
      guestName: `${selectedSimBooking.guest.firstName} ${selectedSimBooking.guest.lastName}`.trim(),
      guestPhone: selectedSimBooking.guest.phone,
      messagePreview: simulatedMessage.slice(0, 100) + '...',
      status: 'dispatched',
    });
    setLogs((prev) => [newLog, ...prev]);
    showToast(`Opened WhatsApp test auto-reply for ${selectedSimBooking.guest.firstName}!`);
  };

  // Handle simulated background trigger
  const handleSimulateTrigger = () => {
    if (!selectedSimBooking || !activeSimRule) return;

    // Increment count on rule
    const updatedRules = config.rules.map((r) => {
      if (r.id === activeSimRule.id) {
        return {
          ...r,
          triggersCount: (r.triggersCount || 0) + 1,
          lastTriggeredAt: new Date().toISOString(),
        };
      }
      return r;
    });
    const updatedConfig = { ...config, rules: updatedRules };
    setConfig(updatedConfig);
    saveStoredAutoRespondersConfig(updatedConfig);

    const newLog = addAutoResponderLog({
      ruleId: activeSimRule.id,
      ruleName: activeSimRule.name,
      triggerStatus: activeSimRule.triggerStatus,
      bookingId: selectedSimBooking.id,
      bookingRef: selectedSimBooking.referenceNumber,
      guestName: `${selectedSimBooking.guest.firstName} ${selectedSimBooking.guest.lastName}`.trim(),
      guestPhone: selectedSimBooking.guest.phone,
      messagePreview: simulatedMessage.slice(0, 100) + '...',
      status: 'simulated',
    });
    setLogs((prev) => [newLog, ...prev]);
    showToast(`Simulated status trigger for "${activeSimRule.triggerLabel}" on booking #${selectedSimBooking.referenceNumber}!`);
  };

  const handleClearLogs = () => {
    if (window.confirm('Clear all recorded auto-responder dispatch logs?')) {
      clearAutoResponderLogs();
      setLogs([]);
      showToast('Auto-responder logs cleared.');
    }
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(simulatedMessage);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
    showToast('Auto-responder message copied to clipboard!');
  };

  // Status visual themes
  const getStatusVisual = (status: AutoResponderTriggerStatus) => {
    switch (status) {
      case 'confirmed':
        return {
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          accent: 'emerald',
          border: 'border-emerald-300',
          icon: CalendarCheck,
          label: 'Booking Confirmed',
        };
      case 'cancelled':
        return {
          badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
          accent: 'rose',
          border: 'border-rose-300',
          icon: XCircle,
          label: 'Booking Cancelled',
        };
      case 'checked_in':
        return {
          badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
          accent: 'cyan',
          border: 'border-cyan-300',
          icon: Key,
          label: 'Guest Checked In',
        };
      case 'checked_out':
        return {
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          accent: 'amber',
          border: 'border-amber-300',
          icon: Award,
          label: 'Guest Checked Out',
        };
      case 'pending':
        return {
          badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
          accent: 'purple',
          border: 'border-purple-300',
          icon: Clock,
          label: 'Pending Confirmation',
        };
      default:
        return {
          badgeBg: 'bg-slate-50 text-slate-800 border-slate-200',
          accent: 'slate',
          border: 'border-slate-300',
          icon: Zap,
          label: status,
        };
    }
  };

  return (
    <div 
      id="auto-responders-section" 
      className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6 mt-6 animate-in fade-in"
    >
      {/* Header & Master Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-emerald-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-heading font-extrabold text-lg text-slate-900">
                WhatsApp Auto-Responders
              </h3>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                config.masterEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {config.masterEnabled ? '⚡ SYSTEM ACTIVE' : '⏸️ SYSTEM PAUSED'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {activeRulesCount} of {config.rules.length} Triggers Active
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Automatically trigger customized WhatsApp replies whenever a reservation status changes. Instantly notify guests when their booking is <strong className="text-slate-800">confirmed</strong> with arrival keys and Wi-Fi, or when a stay is <strong className="text-slate-800">cancelled</strong> with clear refund and inventory release notices.
            </p>
          </div>
        </div>

        {/* Master Switch & Stats */}
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              id="auto-responder-master-toggle"
              onClick={() => handleToggleMaster(!config.masterEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-emerald-500/20 ${
                config.masterEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
              title="Toggle all WhatsApp auto-responders on or off"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.masterEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800 block">
                {config.masterEnabled ? 'Auto-Replies ON' : 'Auto-Replies OFF'}
              </span>
              <span className="text-[10px] text-slate-400">
                {totalDispatchedCount} total dispatches
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Status Cards Grid (Special emphasis on Confirmed and Cancelled) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h4 className="font-heading font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-600" />
            <span>Automated Status Trigger Rules</span>
          </h4>
          <span className="text-xs text-slate-400">
            Click any rule to customize its message template
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.rules.map((rule) => {
            const visual = getStatusVisual(rule.triggerStatus);
            const IconComponent = visual.icon;
            const isEditing = editingRuleId === rule.id;
            const isHighlighted = rule.triggerStatus === 'confirmed' || rule.triggerStatus === 'cancelled';

            return (
              <div
                key={rule.id}
                id={`auto-responder-card-${rule.triggerStatus}`}
                className={`rounded-2xl border p-4 transition-all duration-200 ${
                  rule.enabled && config.masterEnabled
                    ? isHighlighted 
                      ? 'bg-white border-slate-300 shadow-sm ring-1 ring-slate-200' 
                      : 'bg-white border-slate-200'
                    : 'bg-slate-50/70 border-slate-200 opacity-80'
                }`}
              >
                {/* Rule Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${visual.badgeBg}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="font-bold text-xs text-slate-900 truncate">
                          {rule.name}
                        </h5>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${visual.badgeBg}`}>
                          {visual.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Triggered {rule.triggersCount || 0} times
                        {rule.lastTriggeredAt && (
                          <span> • Last: {new Date(rule.lastTriggeredAt).toLocaleDateString()}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Individual Rule Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id={`toggle-rule-${rule.triggerStatus}`}
                      onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        rule.enabled && config.masterEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      title={`Toggle ${rule.name} on/off`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          rule.enabled && config.masterEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  {rule.description}
                </p>

                {/* Editor or Content Preview */}
                {isEditing ? (
                  <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 animate-in fade-in">
                    {/* Variable Chips */}
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Insert variable into template:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          '{guestFirstName}', 
                          '{bookingRef}', 
                          '{roomName}', 
                          '{checkInDate}', 
                          '{checkOutDate}', 
                          '{totalAmount}', 
                          '{currency}',
                          '{cancellationReason}',
                          '{hostelPhone}',
                          '{wifiPassword}'
                        ].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setEditedContent((prev) => prev + ` ${v} `)}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200 transition-colors"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={8}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full font-mono text-[11px] p-3 rounded-xl bg-slate-900 text-slate-100 border border-teal-500 focus:outline-none ring-2 ring-teal-500/20 leading-relaxed"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleResetRuleToDefault(rule.id)}
                        className="text-[10px] text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to Default</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingRuleId(null)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveRuleContent(rule.id)}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save Template</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 text-[11px] font-mono text-slate-700 line-clamp-3 leading-relaxed relative group">
                    {rule.templateContent}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-100/90 to-transparent flex items-end justify-end p-2 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEditing(rule)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-900 hover:text-white text-slate-800 rounded-lg text-[10px] font-bold border border-slate-200 shadow-2xs flex items-center gap-1 transition-all"
                      >
                        <Edit3 className="w-3 h-3 text-teal-600" />
                        <span>Edit Template</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer Quick Action */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
                  <span className="text-slate-400 font-medium">
                    Channel: <strong className="text-emerald-700">WhatsApp Instant</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSimStatus(rule.triggerStatus);
                      const el = document.getElementById('auto-responder-simulator-box');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Test & Preview Live</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Auto-Responder Simulator & Test Sandbox */}
      <div 
        id="auto-responder-simulator-box" 
        className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-sm text-white flex items-center gap-2">
                <span>Interactive Auto-Responder Test Sandbox</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Live Preview
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Select a guest reservation and simulate a status trigger to inspect the exact WhatsApp message.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Change Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[11px] font-bold text-slate-400">Status Trigger:</span>
              <select
                id="sim-status-select"
                value={selectedSimStatus}
                onChange={(e) => setSelectedSimStatus(e.target.value as AutoResponderTriggerStatus)}
                className="bg-slate-900 text-teal-300 text-xs font-bold rounded-lg px-2 py-0.5 border border-slate-700 focus:outline-none"
              >
                <option value="confirmed">Confirmed (Approval)</option>
                <option value="cancelled">Cancelled (Cancellation)</option>
                <option value="checked_in">Checked In (Arrival)</option>
                <option value="checked_out">Checked Out (Departure)</option>
                <option value="pending">Pending (Hold / Deposit)</option>
              </select>
            </div>

            {/* Target Booking Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[11px] font-bold text-slate-400">Sample Guest:</span>
              <select
                id="sim-booking-select"
                value={selectedSimBookingId}
                onChange={(e) => setSelectedSimBookingId(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold rounded-lg px-2 py-0.5 border border-slate-700 focus:outline-none max-w-[150px] truncate"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.guest.firstName} {b.guest.lastName} (#{b.referenceNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* WhatsApp Phone Bubble Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-4">
          {/* Bubble Presentation */}
          <div className="lg:col-span-8 bg-[#0b141a] rounded-2xl p-4 sm:p-5 border border-slate-800 relative">
            {/* Chat Header Bar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-black text-white text-xs">
                  WH
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">
                    {settings.name} Auto-Desk
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Official WhatsApp Desk • +{settings.phone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedPreview ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPreview ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Green Incoming Bubble */}
            <div className="max-w-xl bg-[#005c4b] text-slate-100 rounded-2xl rounded-tl-xs p-3.5 text-xs font-sans whitespace-pre-wrap leading-relaxed shadow-md border border-emerald-500/20">
              {simulatedMessage}
              <div className="text-right text-[9px] text-emerald-200/70 mt-1.5 flex items-center justify-end gap-1 font-mono">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-cyan-300 font-black">✓✓</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-3 font-mono">
              Simulating trigger for: <span className="text-teal-400">#{selectedSimBooking.referenceNumber}</span> ({selectedSimBooking.guest.firstName} {selectedSimBooking.guest.lastName} • {selectedSimBooking.guest.phone})
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
                Test Actions
              </span>

              <button
                type="button"
                id="auto-responder-test-send-whatsapp-btn"
                onClick={handleTestSendWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>Open in WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                type="button"
                id="auto-responder-simulate-btn"
                onClick={handleSimulateTrigger}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-600 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Simulate Event & Log Trigger</span>
              </button>

              <p className="text-[10px] text-slate-400 leading-normal">
                Opening in WhatsApp opens web.whatsapp.com with the guest's phone number and rendered message ready to send.
              </p>
            </div>

            {/* Coverage Summary */}
            <div className="bg-slate-800/40 rounded-2xl p-3.5 border border-slate-800 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Auto-Responders System:</span>
                <strong className={config.masterEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                  {config.masterEnabled ? 'ACTIVE' : 'PAUSED'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Selected Rule Status:</span>
                <strong className={activeSimRule.enabled ? 'text-teal-400' : 'text-amber-400'}>
                  {activeSimRule.enabled ? 'Enabled' : 'Disabled'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Recipient:</span>
                <span className="text-slate-400 font-mono truncate max-w-[140px]">
                  {selectedSimBooking.guest.phone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched Logs & History */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <h4 className="font-heading font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              Recent Auto-Responder Triggers ({logs.length})
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Logs</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
            >
              <span>{showLogs ? 'Hide Logs' : 'Show Logs'}</span>
              {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {showLogs && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No auto-responder triggers recorded yet. Trigger a booking status change to start logging.
              </div>
            ) : (
              logs.slice(0, 8).map((log) => {
                const visual = getStatusVisual(log.triggerStatus);
                const IconComponent = visual.icon;
                const isCopied = copiedLogId === log.id;

                return (
                  <div 
                    key={log.id} 
                    className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${visual.badgeBg}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{log.ruleName}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${visual.badgeBg}`}>
                            {visual.label}
                          </span>
                          <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                            #{log.bookingRef}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-lg">
                          Guest: <strong className="text-slate-700">{log.guestName}</strong> ({log.guestPhone}) • "{log.messagePreview}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 text-[10px]">
                      <span className="text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                        log.status === 'dispatched' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
