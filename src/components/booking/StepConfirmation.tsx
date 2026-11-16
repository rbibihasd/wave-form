import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, MessageCircle, Copy, Check, Send, 
  Calendar, Users, Waves, MapPin, Printer, ArrowRight, ShieldCheck,
  Mail, ExternalLink, Eye, ChevronDown, ChevronUp, FileText, QrCode, Download, Share2
} from 'lucide-react';
import { Booking, HostelSettings, Room, SurfAddOn } from '../../types';
import { formatDisplayDate } from '../../utils/date';
import { createWhatsAppUrl, formatBookingConfirmationMessage } from '../../utils/whatsapp';
import { dispatchWebhook } from '../../utils/webhook';
import { formatEmailReceiptDraft, createMailtoUrl } from '../../utils/emailReceipt';
import { 
  generateBookingQrCodeDataUrl, 
  getInvoiceNumber, 
  getReservationUrl, 
  formatWhatsAppInvoiceMessage,
  formatEmailInvoice 
} from '../../utils/invoice';
import { BookingInvoiceModal } from '../invoice/BookingInvoiceModal';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../../i18n/translations';

interface StepConfirmationProps {
  booking: Booking;
  room: Room;
  addOns: SurfAddOn[];
  settings: HostelSettings;
  onGoToAdmin: () => void;
  onResetBooking: () => void;
}

export const StepConfirmation: React.FC<StepConfirmationProps> = ({
  booking,
  room,
  addOns,
  settings,
  onGoToAdmin,
  onResetBooking,
}) => {
  const { language, t } = useLanguage();
  const [selectedMsgLang, setSelectedMsgLang] = useState<SupportedLanguage>(
    booking.guest.preferredLanguage || language || settings.defaultLanguage || 'en'
  );
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Keep message language aligned with global toggle if user changes it
  useEffect(() => {
    if (language) {
      setSelectedMsgLang(language);
    }
  }, [language]);

  // Generate verified QR code on mount
  useEffect(() => {
    generateBookingQrCodeDataUrl(booking).then((url) => {
      setQrCodeDataUrl(url);
    });
  }, [booking]);

  const reservationUrl = getReservationUrl(booking);
  const invoiceNumber = getInvoiceNumber(booking);

  // WhatsApp Invoice Link (dedicated for invoice voucher with QR & REF)
  const whatsappInvoiceText = formatWhatsAppInvoiceMessage(booking, room, addOns, settings, selectedMsgLang);
  const whatsappInvoiceUrl = createWhatsAppUrl(booking.guest.phone, whatsappInvoiceText);

  // Email Invoice Link
  const emailInvoice = formatEmailInvoice(booking, room, addOns, settings);
  const mailtoInvoiceUrl = createMailtoUrl(emailInvoice.to, emailInvoice.subject, emailInvoice.plainText);

  // Email Receipt Draft compiling (mimicking WhatsApp format)
  const emailDraft = useMemo(() => {
    return formatEmailReceiptDraft(booking, settings, addOns, undefined, room);
  }, [booking, settings, addOns, room]);

  const mailtoUrl = useMemo(() => {
    return createMailtoUrl(emailDraft.to, emailDraft.subject, emailDraft.plainText);
  }, [emailDraft]);

  const handleCopyEmailDraft = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\nTo: ${emailDraft.to}\n\n${emailDraft.plainText}`);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const formattedWhatsAppMessage = formatBookingConfirmationMessage(
    booking,
    room,
    addOns,
    settings,
    selectedMsgLang
  );

  // Direct WhatsApp links (No API required)
  const whatsappHostelUrl = createWhatsAppUrl(settings.phone, formattedWhatsAppMessage);
  const whatsappGuestUrl = createWhatsAppUrl(booking.guest.phone, formattedWhatsAppMessage);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(formattedWhatsAppMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleTriggerWebhook = async () => {
    setIsSendingWebhook(true);
    const res = await dispatchWebhook('booking.created', booking, settings);
    setIsSendingWebhook(false);
    setWebhookStatus(res.message);
  };

  const handlePrint = () => {
    setIsInvoiceModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Success Hero Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-500/10">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Booking Confirmed & Logged
        </span>
        <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight">
          You're Ready to Ride the Waves!
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Reservation ref: <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">#{booking.referenceNumber}</span>
        </p>
      </div>

      {/* OFFICIAL BOOKING INVOICE & VERIFICATION QR CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* QR Code Block */}
          <div className="flex items-center gap-4 shrink-0">
            <div 
              onClick={() => setIsInvoiceModalOpen(true)}
              className="bg-white p-2.5 rounded-2xl border-2 border-teal-500/40 shadow-xs cursor-pointer hover:border-teal-500 transition-colors group relative"
              title="Click to view official invoice & QR code"
            >
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt={`QR code for ${booking.referenceNumber}`}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  <QrCode className="w-8 h-8 animate-pulse" />
                </div>
              )}
              <div className="absolute inset-0 bg-teal-900/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex items-center justify-center">
                <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  View PDF
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  REF: #{booking.referenceNumber}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {invoiceNumber}
                </span>
              </div>
              <h3 className="font-heading font-black text-lg text-slate-900 mt-1">
                Official Booking Invoice (PDF)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
                Includes verified QR code that switches directly to your confirmed reservation voucher.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* View & Download PDF Invoice */}
            <button
              type="button"
              id="btn-open-invoice-modal"
              onClick={() => setIsInvoiceModalOpen(true)}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Invoice</span>
            </button>

            {/* Send Invoice to WhatsApp */}
            <a
              id="btn-send-whatsapp-invoice"
              href={whatsappInvoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center justify-center gap-2 transition-colors"
              title="Send invoice & direct QR link to guest WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
              <span>Invoice to WhatsApp</span>
            </a>

            {/* Send Invoice via Email */}
            <a
              id="btn-send-email-invoice"
              href={mailtoInvoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-colors"
              title="Open email invoice draft"
            >
              <Mail className="w-4 h-4 text-teal-600" />
              <span>Invoice to Email</span>
            </a>
          </div>
        </div>

        {/* QR Code Notice Banner */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <QrCode className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>Direct REF Access:</strong> Anyone scanning the QR code or visiting with <code>?ref={booking.referenceNumber}</code> is taken directly to this verified reservation.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(reservationUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 shrink-0 flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied REF Link!' : 'Copy Direct Link'}</span>
          </button>
        </div>
      </div>

      {/* WHATSAPP NO-API DISPATCH HERO CARD */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
                <MessageCircle className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-extrabold text-white">
                  Send to WhatsApp (No API Required)
                </h3>
                <p className="text-xs text-emerald-100">
                  Instantly transmit your full reservation itinerary with 1-click via WhatsApp Web or App.
                </p>
              </div>
            </div>

            {/* Message Language Selector Toggle */}
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 self-start sm:self-auto">
              {SUPPORTED_LANGUAGES.map((langItem) => (
                <button
                  key={langItem.code}
                  type="button"
                  onClick={() => setSelectedMsgLang(langItem.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedMsgLang === langItem.code
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Format WhatsApp message in ${langItem.name}`}
                >
                  <span>{langItem.flag}</span>
                  <span className="uppercase text-[11px]">{langItem.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              id="btn-whatsapp-hostel"
              href={whatsappHostelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-5 py-3.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-sm shadow-lg flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-100" />
              <span>Send Itinerary to Hostel WhatsApp Desk</span>
            </a>

            <a
              id="btn-whatsapp-guest"
              href={whatsappGuestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4 text-emerald-200" />
              <span>Send to Guest WhatsApp</span>
            </a>

            <button
              type="button"
              id="btn-copy-whatsapp-text"
              onClick={handleCopyMessage}
              className="px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-200" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>

          {/* Message Preview Collapsible / Card */}
          <div className="mt-4 bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-xs font-mono text-emerald-50 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
            {formattedWhatsAppMessage}
          </div>
        </div>
      </div>

      {/* AUTOMATED EMAIL RECEIPT DRAFT (MIMICS WHATSAPP FORMAT) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs border border-teal-200">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-extrabold text-slate-900">
                  Automated Email Receipt Draft
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  WhatsApp Parity
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  settings.autoEmailReceiptDraftEnabled !== false 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {settings.autoEmailReceiptDraftEnabled !== false ? 'Auto-Draft Active' : 'Manual Draft'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Itemized confirmation compiled for <span className="font-semibold text-slate-700">{booking.guest.email}</span> with exact WhatsApp voucher formatting.
              </p>
            </div>
          </div>

          {/* Quick Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowEmailPreview(!showEmailPreview)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Eye className="w-3.5 h-3.5 text-teal-600" />
            <span>{showEmailPreview ? 'Hide Preview' : 'Preview Email Draft'}</span>
            {showEmailPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={mailtoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Email Draft in Mail Client ({booking.guest.email})</span>
          </a>

          <button
            type="button"
            onClick={handleCopyEmailDraft}
            className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            {emailCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-extrabold">Draft Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy Email Receipt Text</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible Live Draft Preview */}
        {showEmailPreview && (
          <div className="pt-2 animate-in fade-in duration-200 space-y-3">
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
              <div className="text-teal-400 font-bold mb-2 pb-2 border-b border-slate-800">
                Subject: {emailDraft.subject}
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-200">
                {emailDraft.plainText}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* WEBHOOK LIGHTWEIGHT NOTIFICATION STATUS CARD */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Send className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Lightweight Webhook Dispatch
              </h4>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                settings.webhookEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {settings.webhookEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-md">
              Target: {settings.webhookUrl || 'Not configured in settings'}
            </p>
            {webhookStatus && (
              <p className="text-xs font-semibold text-teal-700 mt-1">
                {webhookStatus}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleTriggerWebhook}
          disabled={isSendingWebhook}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5 text-teal-600" />
          <span>{isSendingWebhook ? 'Dispatching...' : 'Resend Webhook'}</span>
        </button>
      </div>

      {/* DETAILED RESERVATION VOUCHER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        {/* Voucher Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-teal-400 font-bold uppercase tracking-wider">
              Official Hostel Voucher
            </span>
            <h3 className="text-2xl font-heading font-black text-white">
              {settings.name}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              {settings.address}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Amount</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-teal-300">
              {settings.currencySymbol}{booking.totalAmount.toFixed(2)}
            </p>
            <span className="inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
              Payment: {booking.paymentStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Voucher Body Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Decorated Date Range & Stay Strip */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
            <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center text-xs">
              {/* Check-In */}
              <div className="md:col-span-5 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-teal-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-teal-600" />
                    Check-In
                  </span>
                  <span className="text-slate-500 font-normal">From {settings.checkInTime}</span>
                </div>
                <p className="font-heading font-black text-slate-900 text-sm sm:text-base">
                  {formatDisplayDate(booking.checkInDate)}
                </p>
              </div>

              {/* Nights Bridge */}
              <div className="md:col-span-1 flex md:flex-col items-center justify-center gap-1 py-1">
                <div className="h-px md:h-4 w-6 md:w-px bg-slate-300" />
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-600 text-white shadow-2xs shrink-0 whitespace-nowrap">
                  {booking.nights}N
                </span>
                <div className="h-px md:h-4 w-6 md:w-px bg-slate-300" />
              </div>

              {/* Check-Out */}
              <div className="md:col-span-5 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-cyan-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-600" />
                    Check-Out
                  </span>
                  <span className="text-slate-500 font-normal">By {settings.checkOutTime}</span>
                </div>
                <p className="font-heading font-black text-slate-900 text-sm sm:text-base">
                  {formatDisplayDate(booking.checkOutDate)}
                </p>
              </div>
            </div>

            {/* Sub-strip for Guests & Surf Level */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span>{booking.guestsCount} {booking.guestsCount === 1 ? 'Guest' : 'Guests'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-teal-700">{booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'} Duration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Surf Cohort:</span>
                <span className="font-bold text-slate-900 capitalize bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {booking.guest.surfLevel.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Room & Addons summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Breakdown of Charges
            </h4>

            {/* Room Row */}
            <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
              <div>
                <span className="font-bold text-slate-900">{room.name}</span>
                <span className="text-slate-500 ml-2">
                  ({booking.nights} nights @ {settings.currencySymbol}{room.pricePerNight})
                </span>
              </div>
              <span className="font-bold text-slate-900">
                {settings.currencySymbol}{booking.roomSubtotal.toFixed(2)}
              </span>
            </div>

            {/* Add-ons Rows */}
            {booking.addOns && booking.addOns.map((sel) => {
              const def = addOns.find((a) => a.id === sel.addOnId);
              if (!def) return null;
              const sub = def.billingType === 'per_day'
                ? def.price * sel.quantity * (sel.days || booking.nights)
                : def.price * sel.quantity;

              return (
                <div key={sel.addOnId} className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">{def.name}</span>
                    <span className="text-slate-500 ml-2">
                      ({sel.quantity}x {sel.days ? `${sel.days} days` : ''})
                    </span>
                  </div>
                  <span className="font-semibold text-slate-800">
                    {settings.currencySymbol}{sub.toFixed(2)}
                  </span>
                </div>
              );
            })}

            {/* Taxes */}
            <div className="flex items-center justify-between text-xs py-2 text-slate-500">
              <span>Local Hospitality Tax ({settings.taxRatePercent}%)</span>
              <span>{settings.currencySymbol}{booking.taxAmount.toFixed(2)}</span>
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between text-sm py-3 border-t-2 border-slate-900 font-extrabold text-slate-900">
              <span>Grand Total</span>
              <span className="text-lg text-teal-700">
                {settings.currencySymbol}{booking.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Guest and Emergency info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Guest Information</p>
              <p className="font-bold text-slate-800 mt-0.5">
                {booking.guest.firstName} {booking.guest.lastName}
              </p>
              <p className="text-slate-600">{booking.guest.email}</p>
              <p className="text-slate-600">{booking.guest.phone}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Check-In Notes</p>
              <p className="text-slate-700 mt-0.5">
                {booking.guest.specialRequests || 'No special requests specified.'}
              </p>
              {booking.guest.emergencyContactName && (
                <p className="text-slate-500 mt-1">
                  Emergency: {booking.guest.emergencyContactName} ({booking.guest.emergencyContactPhone})
                </p>
              )}
            </div>
          </div>

          {/* Wi-Fi & House Guidelines Card */}
          {settings.wifiNetworkName && (
            <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-extrabold text-teal-950 flex items-center gap-1.5">
                  📶 Guest Lounge Wi-Fi Access
                </span>
                <p className="text-teal-800">
                  Network: <span className="font-bold font-mono">{settings.wifiNetworkName}</span> | Password: <span className="font-bold font-mono">{settings.wifiPassword || 'Welcome'}</span>
                </p>
              </div>
              <div className="text-[11px] text-teal-700 font-semibold">
                Quiet Hours: {settings.quietHours || '23:00 - 08:00'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation & Admin Switcher Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={handlePrint}
          className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors w-full sm:w-auto justify-center touch-manipulation active:scale-[0.99]"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print / Save PDF Voucher</span>
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onResetBooking}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 sm:border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors text-center touch-manipulation active:scale-[0.99]"
          >
            + New Booking
          </button>

          <button
            type="button"
            onClick={onGoToAdmin}
            className="min-h-[48px] h-12 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.99]"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Manage in Admin Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Official Booking Invoice & QR Modal */}
      <BookingInvoiceModal
        booking={booking}
        room={room}
        addOns={addOns}
        settings={settings}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
};
