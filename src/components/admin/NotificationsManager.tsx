import React, { useState, useMemo } from 'react';
import { 
  Bell, MessageCircle, Send, CheckCheck, Sparkles, Clock, 
  AlertCircle, Edit3, Save, Check, RefreshCw, Mail, Eye, 
  Sliders, ShieldCheck, CheckCircle2, ChevronRight, FileText,
  Columns, Smartphone, Zap
} from 'lucide-react';
import { Booking, HostelSettings, NotificationTemplate, Room, SurfAddOn } from '../../types';
import { getStayUrgencyBadge, formatDisplayDate } from '../../utils/date';
import { createWhatsAppUrl, formatUpcomingStayReminderMessage } from '../../utils/whatsapp';
import { dispatchWebhook } from '../../utils/webhook';
import { getDefaultEmailReceiptContent } from '../../utils/emailReceipt';
import { EmailReceiptDraftViewer } from './EmailReceiptDraftViewer';
import { WhatsAppLivePreviewPane } from './WhatsAppLivePreviewPane';
import { AutoRespondersSection } from './AutoRespondersSection';
import { InvoiceTemplateBuilder } from './InvoiceTemplateBuilder';
import { INITIAL_BOOKINGS } from '../../data/initialData';

interface NotificationsManagerProps {
  bookings: Booking[];
  settings: HostelSettings;
  templates: NotificationTemplate[];
  rooms?: Room[];
  addOns?: SurfAddOn[];
  onUpdateBooking: (updated: Booking) => void;
  onUpdateTemplate: (template: NotificationTemplate) => void;
  onSaveSettings?: (settings: HostelSettings) => void;
}

export const NotificationsManager: React.FC<NotificationsManagerProps> = ({
  bookings,
  settings,
  templates,
  rooms = [],
  addOns = [],
  onUpdateBooking,
  onUpdateTemplate,
  onSaveSettings,
}) => {
  // Find or fallback to email receipt template
  const emailReceiptTemplate = useMemo(() => {
    return templates.find((t) => t.type === 'email_receipt') || {
      id: 'tpl-email-receipt',
      type: 'email_receipt' as const,
      title: 'Automated Email Receipt Draft',
      subject: '🏄‍♂️ Booking Receipt & Wave Voucher - #{bookingRef} | WaveHaven Surf House',
      daysTrigger: 0,
      channel: 'email' as const,
      isActive: true,
      content: getDefaultEmailReceiptContent(settings),
    };
  }, [templates, settings]);

  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate>(() => {
    // If email receipt exists, let user easily access either templates
    return templates.find((t) => t.type === 'email_receipt') || templates[0];
  });
  
  const [templateContent, setTemplateContent] = useState(selectedTemplate?.content || '');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulatingBatch, setIsSimulatingBatch] = useState(false);
  const [isInvoiceBuilderOpen, setIsInvoiceBuilderOpen] = useState(false);

  // Layout mode for WhatsApp template preview
  const [whatsAppLayout, setWhatsAppLayout] = useState<'split' | 'editor' | 'preview'>('split');

  // Selected booking for live draft preview
  const [selectedPreviewBooking, setSelectedPreviewBooking] = useState<Booking>(() => {
    return bookings[0] || INITIAL_BOOKINGS[0];
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isAutomatedEmailDraftEnabled = emailReceiptTemplate.isActive;

  const handleToggleAutomatedDraft = (enabled: boolean) => {
    const updated: NotificationTemplate = {
      ...emailReceiptTemplate,
      isActive: enabled,
    };
    onUpdateTemplate(updated);
    if (selectedTemplate.id === emailReceiptTemplate.id) {
      setSelectedTemplate(updated);
    }
    if (onSaveSettings) {
      onSaveSettings({
        ...settings,
        autoEmailReceiptDraftEnabled: enabled,
      });
    }
    showToast(
      enabled
        ? 'Automated Email Receipt Drafts ENABLED — Receipts will auto-generate mimicking WhatsApp layout.'
        : 'Automated Email Receipt Drafts PAUSED — Auto-generation stopped.'
    );
  };

  // Filter bookings that have upcoming check-ins (next 7 days, excluding cancelled or already checked out)
  const upcomingBookings = bookings
    .filter((b) => b.status !== 'cancelled' && b.status !== 'checked_out')
    .map((b) => ({
      booking: b,
      urgency: getStayUrgencyBadge(b.checkInDate),
    }))
    .filter((item) => item.urgency.days >= 0 && item.urgency.days <= 7)
    .sort((a, b) => a.urgency.days - b.urgency.days);

  const handleSendReminder = (booking: Booking, days: number) => {
    const message = formatUpcomingStayReminderMessage(booking, days, settings);
    const url = createWhatsAppUrl(booking.guest.phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');

    const updated: Booking = {
      ...booking,
      stayReminderSent: true,
      whatsappSentCount: (booking.whatsappSentCount || 0) + 1,
      lastNotificationSent: new Date().toISOString(),
    };
    onUpdateBooking(updated);

    // Dispatch webhook for stay reminder event
    dispatchWebhook('stay.reminder_sent', updated, settings);

    showToast(`WhatsApp reminder opened for ${booking.guest.firstName}!`);
  };

  const handleBatchRunReminders = async () => {
    setIsSimulatingBatch(true);
    let count = 0;

    for (const item of upcomingBookings) {
      if (item.urgency.days <= settings.autoRemindDaysBefore && !item.booking.stayReminderSent) {
        const updated: Booking = {
          ...item.booking,
          stayReminderSent: true,
          whatsappSentCount: (item.booking.whatsappSentCount || 0) + 1,
          lastNotificationSent: new Date().toISOString(),
        };
        onUpdateBooking(updated);
        await dispatchWebhook('stay.reminder_sent', updated, settings);
        count++;
      }
    }

    setIsSimulatingBatch(false);
    showToast(`Automated reminder sweep completed! ${count} guest alert(s) dispatched to webhook queue.`);
  };

  const handleSaveTemplate = () => {
    const updated: NotificationTemplate = {
      ...selectedTemplate,
      content: templateContent,
    };
    onUpdateTemplate(updated);
    setSelectedTemplate(updated);
    setIsEditingTemplate(false);
    showToast('Notification template updated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-slate-900 text-teal-300 px-4 py-3 rounded-2xl text-xs font-bold shadow-xl flex items-center justify-between border border-teal-500/40 sticky top-20 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button"
            onClick={() => setToastMessage(null)} 
            className="text-white hover:text-teal-300 ml-4 p-1 text-sm font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Automated Upcoming Stays Summary */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-cyan-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold mb-2 border border-teal-500/30">
              <Bell className="w-3.5 h-3.5" />
              Automated Guest Notification Center
            </div>
            <h3 className="text-xl font-heading font-extrabold text-white">
              Upcoming Stays & WhatsApp Reminders
            </h3>
            <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
              Monitors arrivals within {settings.autoRemindDaysBefore} days. Automatically generates WhatsApp check-in briefs with local surf reports, door codes, and webhook notifications.
            </p>
          </div>

          <button
            type="button"
            disabled={isSimulatingBatch}
            onClick={handleBatchRunReminders}
            className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 shrink-0 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulatingBatch ? 'animate-spin' : ''}`} />
            <span>Run Automated Check Sweep</span>
          </button>
        </div>
      </div>

      {/* Automated Email Receipt Drafts Dedicated Feature Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg shrink-0 border border-teal-200">
              <Mail className="w-6 h-6 text-teal-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-heading font-extrabold text-base text-slate-900">
                  Automated Email Receipt Drafts
                </h4>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                  Mimics WhatsApp Format
                </span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  isAutomatedEmailDraftEnabled 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {isAutomatedEmailDraftEnabled ? 'AUTOMATION: ON' : 'AUTOMATION: OFF'}
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Automatically compiles clean email receipt drafts for confirmed reservations with 1:1 format parity to the WhatsApp confirmation voucher. Includes itemized surf add-ons, balance due, and check-in instructions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
            {/* Direct Toggle Switch */}
            <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleToggleAutomatedDraft(!isAutomatedEmailDraftEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-teal-500/20 ${
                  isAutomatedEmailDraftEnabled ? 'bg-teal-600' : 'bg-slate-300'
                }`}
                title="Toggle automated email receipt drafts on/off"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAutomatedEmailDraftEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs font-bold text-slate-800">
                {isAutomatedEmailDraftEnabled ? 'Enabled' : 'Paused'}
              </span>
            </div>

            {/* Jump to Preview Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedTemplate(emailReceiptTemplate);
                setTemplateContent(emailReceiptTemplate.content);
                setIsEditingTemplate(false);
                // Scroll into view if needed
                const el = document.getElementById('notification-templates-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Eye className="w-3.5 h-3.5 text-teal-400" />
              <span>Preview Email Draft</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Guests Queue List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h4 className="font-heading font-extrabold text-sm text-slate-900">
              Upcoming Arrivals Queue (Next 7 Days)
            </h4>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {upcomingBookings.length} Guests Incoming
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {upcomingBookings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No guests arriving in the next 7 days.
            </div>
          ) : (
            upcomingBookings.map(({ booking: b, urgency }) => {
              return (
                <div
                  key={b.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-200/60">
                      🏄
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-bold text-sm text-slate-900">
                          {b.guest.firstName} {b.guest.lastName}
                        </h5>
                        <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                          #{b.referenceNumber}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            urgency.color === 'urgent'
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {urgency.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        <span className="font-semibold text-slate-800">{b.roomName}</span> • Check-in: {formatDisplayDate(b.checkInDate)} (from {settings.checkInTime})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        WhatsApp: <span className="text-slate-600 font-medium">{b.guest.phone}</span> • Email: <span className="text-slate-600">{b.guest.email}</span> • Surf: <span className="capitalize">{b.guest.surfLevel}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {/* Quick Preview Email Draft for this guest */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPreviewBooking(b);
                        setSelectedTemplate(emailReceiptTemplate);
                        const el = document.getElementById('notification-templates-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      title="Preview automated email receipt for this booking"
                    >
                      <Mail className="w-3.5 h-3.5 text-teal-600" />
                      <span>Email Receipt Draft</span>
                    </button>

                    {b.stayReminderSent ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reminder Sent</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ready</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSendReminder(b, urgency.days)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-emerald-100" />
                      <span>WhatsApp Alert</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Notification Templates & Automated Drafts Studio */}
      <div 
        id="notification-templates-section"
        className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h4 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
              <span>Notification Templates & Guest Drafts</span>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                {templates.length} Templates
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure WhatsApp message vouchers and preview automated email receipt drafts mimicking the WhatsApp format.
            </p>
          </div>

          {/* Template Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {templates.map((tpl) => {
              const isEmail = tpl.type === 'email_receipt';
              const isSelected = selectedTemplate.id === tpl.id;

              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(tpl);
                    setTemplateContent(tpl.content);
                    setIsEditingTemplate(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs scale-102'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isEmail ? (
                    <Mail className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-400' : 'text-teal-600'}`} />
                  ) : (
                    <MessageCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  )}
                  <span>{tpl.title.split(' (')[0]}</span>
                  {isEmail && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                      tpl.isActive 
                        ? 'bg-teal-500/30 text-teal-300' 
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {tpl.isActive ? 'ON' : 'OFF'}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Official Invoice Template Builder */}
            <button
              type="button"
              onClick={() => setIsInvoiceBuilderOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs hover:scale-102"
              title="Open Official Invoice & Receipt Template Builder"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span>Invoice Builder</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-teal-200/80 text-teal-900">
                Template
              </span>
            </button>

            {/* Direct Jump to WhatsApp Auto-Responders */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('auto-responders-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs hover:scale-102"
              title="Jump to WhatsApp Auto-Responders triggers"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Auto-Responders</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-900">
                ⚡ Triggers
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Display based on Selected Template Type */}
        {selectedTemplate.type === 'email_receipt' ? (
          /* Specialized Interactive Email Receipt Draft Viewer */
          <EmailReceiptDraftViewer
            booking={selectedPreviewBooking}
            allBookings={bookings.length > 0 ? bookings : INITIAL_BOOKINGS}
            settings={settings}
            template={selectedTemplate}
            allAddOns={addOns}
            rooms={rooms}
            onSelectBooking={(b) => setSelectedPreviewBooking(b)}
            onUpdateTemplate={(updated) => {
              onUpdateTemplate(updated);
              setSelectedTemplate(updated);
            }}
            onToggleAutomatedDraft={handleToggleAutomatedDraft}
            isAutomatedDraftEnabled={isAutomatedEmailDraftEnabled}
            onShowToast={showToast}
          />
        ) : (
          /* WhatsApp Template Editor with Live Preview Pane */
          <div className="space-y-4">
            {/* Header & Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-sm font-bold text-slate-800 block">
                  Template: {selectedTemplate.title}
                </span>
                <span className="text-[11px] text-slate-400">
                  Channel: WhatsApp • Trigger: {selectedTemplate.daysTrigger === 0 ? 'Immediately on booking confirmation' : `${selectedTemplate.daysTrigger} days before arrival`}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Layout View Mode Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setWhatsAppLayout('split')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      whatsAppLayout === 'split'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Side-by-side Editor and Live Preview"
                  >
                    <Columns className="w-3.5 h-3.5 text-teal-600" />
                    <span className="hidden sm:inline">Split View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWhatsAppLayout('editor')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      whatsAppLayout === 'editor'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Editor Only"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden sm:inline">Editor Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWhatsAppLayout('preview')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      whatsAppLayout === 'preview'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Live WhatsApp Phone Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Live Preview</span>
                  </button>
                </div>

                {isEditingTemplate ? (
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingTemplate(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Template</span>
                  </button>
                )}
              </div>
            </div>

            {/* Split Grid: Editor (Left) + WhatsApp Live Preview Pane (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Template Editor */}
              {(whatsAppLayout === 'split' || whatsAppLayout === 'editor') && (
                <div className={`space-y-3 ${whatsAppLayout === 'editor' ? 'lg:col-span-12' : 'lg:col-span-6'}`}>
                  {/* Dynamic Tag Quick-Insert Chips */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Click variable to insert into template:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: '{guestName}', label: 'Guest Name' },
                        { key: '{roomName}', label: 'Room / Bed' },
                        { key: '{checkInDate}', label: 'Check-In' },
                        { key: '{checkOutDate}', label: 'Check-Out' },
                        { key: '{nights}', label: 'Nights' },
                        { key: '{totalAmount}', label: 'Total' },
                        { key: '{bookingRef}', label: 'Ref #' },
                        { key: '{hostelPhone}', label: 'Hostel Phone' },
                        { key: '{wifiName}', label: 'Wi-Fi' },
                        { key: '{wifiPassword}', label: 'Wi-Fi Pwd' },
                      ].map((tag) => (
                        <button
                          key={tag.key}
                          type="button"
                          onClick={() => {
                            setTemplateContent((prev) => prev + ` ${tag.key} `);
                            setIsEditingTemplate(true);
                          }}
                          className="px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/70 font-mono text-[10px] font-semibold transition-colors cursor-pointer"
                          title={`Insert ${tag.key}`}
                        >
                          {tag.key}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={14}
                      readOnly={!isEditingTemplate}
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                      className={`w-full font-mono text-xs rounded-2xl p-4 border leading-relaxed shadow-inner transition-all ${
                        isEditingTemplate
                          ? 'bg-slate-900 text-slate-100 border-teal-500 focus:outline-none ring-2 ring-teal-500/20'
                          : 'bg-slate-900/90 text-slate-200 border-slate-700'
                      }`}
                      placeholder="Draft your WhatsApp message template here..."
                    />
                    {!isEditingTemplate && (
                      <div className="absolute top-3 right-3">
                        <button
                          type="button"
                          onClick={() => setIsEditingTemplate(true)}
                          className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-600 transition-colors"
                        >
                          Click to Edit
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{templateContent.length} characters • {templateContent.split('\n').length} lines</span>
                    <span>Supports WhatsApp markup: *bold*, _italic_, ~strike~</span>
                  </div>
                </div>
              )}

              {/* Right Column: WhatsApp Live Preview Pane */}
              {(whatsAppLayout === 'split' || whatsAppLayout === 'preview') && (
                <div className={whatsAppLayout === 'preview' ? 'lg:col-span-12' : 'lg:col-span-6'}>
                  <WhatsAppLivePreviewPane
                    templateContent={templateContent}
                    templateTitle={selectedTemplate.title}
                    settings={settings}
                    bookings={bookings}
                    rooms={rooms}
                    addOns={addOns}
                    onAutoFixVariable={(oldVar, newVar) => {
                      setTemplateContent((prev) => prev.split(oldVar).join(newVar));
                      setIsEditingTemplate(true);
                      showToast(`Replaced ${oldVar} with ${newVar}`);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Auto-Responders Section under Templates Area */}
      <AutoRespondersSection
        settings={settings}
        bookings={bookings}
        rooms={rooms}
        addOns={addOns}
        onShowToast={showToast}
        onSaveSettings={onSaveSettings}
      />

      {/* Invoice Template Builder Modal */}
      {isInvoiceBuilderOpen && (
        <InvoiceTemplateBuilder
          settings={settings}
          bookings={bookings}
          rooms={rooms}
          addOns={addOns}
          isOpen={isInvoiceBuilderOpen}
          onClose={() => setIsInvoiceBuilderOpen(false)}
          onSaveTemplate={(updatedConfig) => {
            if (onSaveSettings) {
              onSaveSettings({
                ...settings,
                invoiceTemplateConfig: updatedConfig,
              });
            }
            showToast('Invoice template updated successfully!');
          }}
        />
      )}
    </div>
  );
};
