import React, { useState, useMemo } from 'react';
import { 
  Mail, Copy, ExternalLink, Check, Send, Printer, 
  RefreshCw, Sparkles, MessageCircle, AlertCircle, Edit3, 
  Save, Eye, Sliders, ShieldCheck, CheckCircle2, ChevronDown
} from 'lucide-react';
import { Booking, HostelSettings, NotificationTemplate, Room, SurfAddOn } from '../../types';
import { 
  formatEmailReceiptDraft, 
  createMailtoUrl, 
  getDefaultEmailReceiptContent,
  EmailReceiptDraft 
} from '../../utils/emailReceipt';
import { formatBookingConfirmationMessage } from '../../utils/whatsapp';

interface EmailReceiptDraftViewerProps {
  booking: Booking;
  allBookings?: Booking[];
  settings: HostelSettings;
  template: NotificationTemplate;
  allAddOns?: SurfAddOn[];
  rooms?: Room[];
  onSelectBooking?: (booking: Booking) => void;
  onUpdateTemplate: (template: NotificationTemplate) => void;
  onToggleAutomatedDraft: (enabled: boolean) => void;
  isAutomatedDraftEnabled: boolean;
  onShowToast: (message: string) => void;
}

export const EmailReceiptDraftViewer: React.FC<EmailReceiptDraftViewerProps> = ({
  booking,
  allBookings = [],
  settings,
  template,
  allAddOns = [],
  rooms = [],
  onSelectBooking,
  onUpdateTemplate,
  onToggleAutomatedDraft,
  isAutomatedDraftEnabled,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'styled' | 'plaintext' | 'comparison' | 'edit'>('styled');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState(template.subject || template.emailSubject || '');
  const [editedContent, setEditedContent] = useState(template.content || getDefaultEmailReceiptContent(settings));
  const [isSimulatingSend, setIsSimulatingSend] = useState(false);

  // Associated room definition if available
  const currentRoom = useMemo(() => {
    return rooms.find((r) => r.id === booking.roomId);
  }, [rooms, booking.roomId]);

  // Generate the compiled draft using the active template and selected booking
  const compiledDraft: EmailReceiptDraft = useMemo(() => {
    return formatEmailReceiptDraft(
      booking,
      settings,
      allAddOns,
      {
        ...template,
        subject: isEditing ? editedSubject : template.subject,
        content: isEditing ? editedContent : template.content,
      },
      currentRoom
    );
  }, [booking, settings, allAddOns, template, currentRoom, isEditing, editedSubject, editedContent]);

  // Generate corresponding WhatsApp message for side-by-side parity check
  const whatsAppMessage = useMemo(() => {
    return formatBookingConfirmationMessage(booking, currentRoom, allAddOns, settings);
  }, [booking, currentRoom, allAddOns, settings]);

  const handleCopyDraft = async () => {
    try {
      const fullText = `Subject: ${compiledDraft.subject}\nTo: ${compiledDraft.to}\nFrom: ${compiledDraft.from}\n\n${compiledDraft.plainText}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      onShowToast('Copied email receipt draft (Subject & Body) to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast('Draft ready: Please copy manually.');
    }
  };

  const handleOpenMailto = () => {
    const url = createMailtoUrl(compiledDraft.to, compiledDraft.subject, compiledDraft.plainText);
    window.open(url, '_blank');
    onShowToast(`Opened native mail client for ${booking.guest.email}`);
  };

  const handleSendTestEmail = () => {
    setIsSimulatingSend(true);
    setTimeout(() => {
      setIsSimulatingSend(false);
      onShowToast(`Test receipt draft successfully simulated and queued for ${settings.email || 'reception'}`);
    }, 600);
  };

  const handleSaveTemplateChanges = () => {
    const updated: NotificationTemplate = {
      ...template,
      subject: editedSubject.trim(),
      content: editedContent.trim(),
      emailSubject: editedSubject.trim(),
    };
    onUpdateTemplate(updated);
    setIsEditing(false);
    onShowToast('Automated email receipt template saved successfully!');
  };

  const handleResetToDefault = () => {
    const defaultText = getDefaultEmailReceiptContent(settings);
    const defaultSub = `🏄‍♂️ Booking Receipt & Wave Voucher - #{bookingRef} | ${settings.name || 'WaveHaven Surf House'}`;
    setEditedContent(defaultText);
    setEditedSubject(defaultSub);
    onShowToast('Reset template to match WhatsApp confirmation format!');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${compiledDraft.subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; color: #1e293b; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${compiledDraft.htmlContent}
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-5">
      {/* Top Automated Toggle Bar & Booking Selector */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-800 shadow-md">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-heading font-extrabold text-sm sm:text-base text-white">
                Automated Email Receipt Drafts
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isAutomatedDraftEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-slate-700 text-slate-300 border border-slate-600'
              }`}>
                {isAutomatedDraftEnabled ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>AUTOMATED: ACTIVE</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>AUTOMATED: PAUSED</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              Generates an itemized receipt draft mimicking the WhatsApp confirmation voucher format. Ready to copy or send via standard email.
            </p>
          </div>
        </div>

        {/* Master Automated Toggle Button */}
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => onToggleAutomatedDraft(!isAutomatedDraftEnabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ring-2 ring-teal-400/20 ${
              isAutomatedDraftEnabled ? 'bg-teal-500' : 'bg-slate-700'
            }`}
            title="Toggle automated email receipt draft generation on/off"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isAutomatedDraftEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-xs font-bold text-slate-200">
            {isAutomatedDraftEnabled ? 'Enabled (Auto)' : 'Disabled (Off)'}
          </span>
        </div>
      </div>

      {/* Booking Selector & Preview Mode Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Booking Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 shrink-0">
            Previewing Reservation:
          </span>
          {allBookings.length > 0 ? (
            <div className="relative">
              <select
                value={booking.id}
                onChange={(e) => {
                  const found = allBookings.find((b) => b.id === e.target.value);
                  if (found && onSelectBooking) {
                    onSelectBooking(found);
                  }
                }}
                className="appearance-none text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-900 pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
              >
                {allBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.referenceNumber} - {b.guest.firstName} {b.guest.lastName} ({b.roomName})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-200">
              #{booking.referenceNumber} ({booking.guest.firstName} {booking.guest.lastName})
            </span>
          )}
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => { setViewMode('styled'); setIsEditing(false); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              viewMode === 'styled' && !isEditing
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-teal-600" />
            <span>Email Client View</span>
          </button>

          <button
            type="button"
            onClick={() => { setViewMode('plaintext'); setIsEditing(false); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              viewMode === 'plaintext' && !isEditing
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Plain-Text Draft</span>
          </button>

          <button
            type="button"
            onClick={() => { setViewMode('comparison'); setIsEditing(false); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              viewMode === 'comparison' && !isEditing
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Parity View</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('edit');
              setIsEditing(true);
              setEditedSubject(template.subject || template.emailSubject || '');
              setEditedContent(template.content || getDefaultEmailReceiptContent(settings));
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              isEditing
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Template</span>
          </button>
        </div>
      </div>

      {/* Action Bar (Copy, Open Mailto, Send Test, Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Copy Full Draft */}
          <button
            type="button"
            onClick={handleCopyDraft}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Email Draft</span>
              </>
            )}
          </button>

          {/* Open Native Mail Client (mailto:) */}
          <button
            type="button"
            onClick={handleOpenMailto}
            className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Mail Client ({booking.guest.email})</span>
          </button>

          {/* Send Simulated Test */}
          <button
            type="button"
            disabled={isSimulatingSend}
            onClick={handleSendTestEmail}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className={`w-3.5 h-3.5 ${isSimulatingSend ? 'animate-spin' : ''}`} />
            <span>Send Test to Reception ({settings.email || 'Hostel'})</span>
          </button>

          {/* Print Receipt */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Print Receipt"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Guest & Total Pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Recipient:</span>
          <span className="font-bold text-slate-800">{booking.guest.firstName} {booking.guest.lastName}</span>
          <span className="text-slate-300">•</span>
          <span className="font-mono font-bold text-teal-700">{settings.currencySymbol}{booking.totalAmount.toFixed(2)}</span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {booking.paymentStatus}
          </span>
        </div>
      </div>

      {/* Main Preview / Editor Canvas */}
      {isEditing ? (
        /* Template Editor View */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h5 className="font-heading font-extrabold text-sm text-slate-900">
                Edit Automated Email Receipt Template
              </h5>
              <p className="text-xs text-slate-500">
                Customise the email receipt draft. Keep placeholders intact to preserve WhatsApp confirmation parity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                title="Reset template back to default WhatsApp matching layout"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to WhatsApp Format</span>
              </button>
              <button
                type="button"
                onClick={handleSaveTemplateChanges}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Subject Template Line
            </label>
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              placeholder="e.g. 🏄‍♂️ Booking Receipt & Wave Voucher - #{bookingRef} | WaveHaven Surf House"
              className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receipt Draft Body (Matches WhatsApp layout)
            </label>
            <textarea
              rows={16}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full font-mono text-xs rounded-2xl p-4 border border-teal-500/50 bg-slate-50/50 leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Dynamic Placeholders Tag Cheat Sheet */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h6 className="font-bold text-xs text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Available Dynamic Template Tags:</span>
            </h6>
            <div className="flex flex-wrap gap-1.5">
              {[
                '{guestName}', '{guestFirstName}', '{bookingRef}', '{roomName}',
                '{checkInDate}', '{checkOutDate}', '{checkInTime}', '{checkOutTime}',
                '{nights}', '{guestsCount}', '{surfLevel}', '{addOnsList}',
                '{totalAmount}', '{currency}', '{paymentStatus}', '{balanceDue}',
                '{address}', '{googleMapsUrl}', '{hostelPhone}', '{hostelEmail}',
                '{email}', '{phone}', '{notes}'
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setEditedContent((prev) => prev + ` ${tag}`)}
                  className="font-mono text-[11px] bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors"
                  title="Click to insert at end of template"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : viewMode === 'styled' ? (
        /* Styled Email Client Mockup View */
        <div className="bg-slate-100 rounded-3xl p-3 sm:p-6 border border-slate-300 shadow-inner">
          {/* Email Reader Window Header */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            {/* Window Bar */}
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span className="ml-2 font-bold text-slate-600 text-[11px]">WaveHaven Mail Client • Preview</span>
              </div>
              <span className="text-[11px] text-slate-400">Automated Draft</span>
            </div>

            {/* Email Meta Info (From, To, Subject) */}
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-2 bg-slate-50/50 text-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                  {compiledDraft.subject}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 shrink-0">
                  Just now
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-400">From:</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium truncate">
                    {compiledDraft.from}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-400">To:</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium truncate">
                    {compiledDraft.to}
                  </span>
                </div>
              </div>
            </div>

            {/* Rendered HTML Email Receipt Body */}
            <div className="p-4 sm:p-6 bg-slate-50">
              <div 
                className="bg-white rounded-2xl shadow-xs overflow-hidden border border-slate-200"
                dangerouslySetInnerHTML={{ __html: compiledDraft.htmlContent }}
              />
            </div>
          </div>
        </div>
      ) : viewMode === 'plaintext' ? (
        /* Monospaced Plain-Text Draft View */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h5 className="font-heading font-extrabold text-sm text-slate-900">
                Plain-Text Email Receipt Draft
              </h5>
              <p className="text-xs text-slate-500">
                Clean text representation ready to paste directly into email clients or send via text dispatchers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyDraft}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Raw Text</span>
            </button>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
            <div className="text-teal-400 font-bold mb-3 pb-2 border-b border-slate-800">
              Subject: {compiledDraft.subject}
            </div>
            <pre className="whitespace-pre-wrap font-mono text-[11px] sm:text-xs text-slate-200">
              {compiledDraft.plainText}
            </pre>
          </div>
        </div>
      ) : (
        /* Comparison View: WhatsApp Confirmation vs Email Receipt Draft */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* WhatsApp Format Column */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="font-bold text-xs text-slate-900">WhatsApp Confirmation Format</h6>
                  <span className="text-[10px] text-slate-400">Standard instant messaging voucher</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Original Voucher
              </span>
            </div>

            <div className="bg-[#e5ddd5] p-4 rounded-2xl shadow-inner min-h-[480px]">
              <div className="bg-white rounded-2xl p-4 shadow-sm text-xs font-mono leading-relaxed text-slate-800 whitespace-pre-wrap border border-slate-200">
                {whatsAppMessage}
              </div>
            </div>
          </div>

          {/* Email Receipt Draft Column */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="font-bold text-xs text-slate-900">Automated Email Receipt Draft</h6>
                  <span className="text-[10px] text-slate-400">Mirrors WhatsApp structure & line items</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                1:1 Format Parity
              </span>
            </div>

            <div className="bg-slate-100 p-4 rounded-2xl shadow-inner min-h-[480px]">
              <div className="bg-white rounded-2xl p-4 shadow-sm text-xs font-mono leading-relaxed text-slate-800 whitespace-pre-wrap border border-slate-200">
                <div className="font-bold text-teal-700 pb-2 mb-2 border-b border-slate-100 font-sans text-xs">
                  Subject: {compiledDraft.subject}
                </div>
                {compiledDraft.plainText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
