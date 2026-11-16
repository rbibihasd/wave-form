import React, { useEffect, useState, useMemo } from 'react';
import { 
  Printer, Download, MessageCircle, Mail, Copy, Check, 
  X, ExternalLink, QrCode, ShieldCheck, MapPin, Calendar, 
  Bed, Phone, Waves, CheckCircle2, Sparkles, FileText, Share2,
  Sliders, Building2, Layers
} from 'lucide-react';
import { Booking, HostelSettings, InvoiceTemplateConfig, Room, SurfAddOn } from '../../types';
import { DEFAULT_INVOICE_TEMPLATE } from '../../data/initialData';
import { formatDisplayDate } from '../../utils/date';
import { 
  generateBookingQrCodeDataUrl, 
  getInvoiceNumber, 
  getReservationUrl, 
  formatWhatsAppInvoiceMessage,
  formatEmailInvoice 
} from '../../utils/invoice';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { createMailtoUrl } from '../../utils/emailReceipt';
import { InvoiceTemplateBuilder } from '../admin/InvoiceTemplateBuilder';
import { getStoredInvoiceTemplate, saveStoredInvoiceTemplate } from '../../utils/storage';

interface BookingInvoiceModalProps {
  booking: Booking | null;
  room?: Room;
  addOns?: SurfAddOn[];
  settings: HostelSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings?: (settings: HostelSettings) => void;
}

export const BookingInvoiceModal: React.FC<BookingInvoiceModalProps> = ({
  booking,
  room,
  addOns = [],
  settings,
  isOpen,
  onClose,
  onSaveSettings,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [emailCopied, setEmailCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);

  // Template configuration state with real-time update capability
  const [template, setTemplate] = useState<InvoiceTemplateConfig>(() => {
    return settings.invoiceTemplateConfig || getStoredInvoiceTemplate() || DEFAULT_INVOICE_TEMPLATE;
  });

  useEffect(() => {
    if (settings.invoiceTemplateConfig) {
      setTemplate(settings.invoiceTemplateConfig);
    }
  }, [settings.invoiceTemplateConfig]);

  // Platform detection for Mac Cmd+P vs Windows/Linux Ctrl+P
  const isMac = useMemo(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return /Mac|iPod|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
    }
    return false;
  }, []);
  const shortcutLabel = isMac ? '⌘P' : 'Ctrl+P';

  // Generate QR code whenever active booking changes
  useEffect(() => {
    if (booking && isOpen) {
      generateBookingQrCodeDataUrl(booking).then((dataUrl) => {
        setQrCodeUrl(dataUrl);
      });
    }
  }, [booking?.id, isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrintReceipt = () => {
    showToast(`Opening printer for #${booking?.referenceNumber || ''}...`);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Keyboard shortcut: Ctrl+P / Cmd+P or single 'P' key to quickly print receipt
  useEffect(() => {
    if (!isOpen || !booking || isBuilderOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrintReceipt();
        return;
      }

      // 2. Single 'P' key shortcut when not typing into an input or textarea
      if (e.key === 'p' || e.key === 'P') {
        const target = e.target as HTMLElement | null;
        const isInput = target && (
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable
        );
        if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          handlePrintReceipt();
          return;
        }
      }

      // 3. Escape key closes the modal
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, booking, onClose, isBuilderOpen]);

  // If closed or no booking, do not render
  if (!isOpen || !booking) return null;

  const reservationUrl = getReservationUrl(booking);
  const invoiceNumber = getInvoiceNumber(booking, template.invoiceNumberPrefix);
  const accentColor = template.accentColor || settings.primaryBrandColor || '#0d9488';

  // WhatsApp formatted invoice message
  const whatsappInvoiceText = formatWhatsAppInvoiceMessage(booking, room, addOns, {
    ...settings,
    invoiceTemplateConfig: template,
  });
  const whatsappInvoiceUrl = createWhatsAppUrl(booking.guest.phone, whatsappInvoiceText);

  // Email formatted invoice
  const emailInvoice = formatEmailInvoice(booking, room, addOns, {
    ...settings,
    invoiceTemplateConfig: template,
  });
  const mailtoInvoiceUrl = createMailtoUrl(
    emailInvoice.to,
    emailInvoice.subject,
    emailInvoice.plainText
  );

  const handleCopyReservationLink = async () => {
    try {
      await navigator.clipboard.writeText(reservationUrl);
      setLinkCopied(true);
      showToast('Direct reservation link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSaveTemplateFromBuilder = (newConfig: InvoiceTemplateConfig) => {
    setTemplate(newConfig);
    saveStoredInvoiceTemplate(newConfig);
    if (onSaveSettings) {
      onSaveSettings({
        ...settings,
        invoiceTemplateConfig: newConfig,
      });
    }
    showToast('Invoice template updated and applied!');
    setIsBuilderOpen(false);
  };

  // Tax calculation
  const taxPercent = settings.taxRatePercent || 6;
  const issueDate = booking.createdAt 
    ? formatDisplayDate(booking.createdAt.split('T')[0]) 
    : formatDisplayDate(booking.checkInDate);

  // Render dynamic placeholders in check-in guidelines
  const renderedCheckInInstructions = (template.checkInInstructions || '')
    .replace('{hostelPhone}', settings.phone || '351 912 345 678')
    .replace('{checkInTime}', settings.checkInTime || '14:00')
    .replace('{checkOutTime}', settings.checkOutTime || '11:00')
    .replace('{hostelName}', settings.name || 'WaveHaven Surf House');

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200 print:static print:bg-white print:p-0 print:m-0 print:overflow-visible print:block print:w-full">
        <div 
          className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[94vh] sm:max-h-[92vh] print:max-w-none print:max-h-none print:overflow-visible print:border-none print:shadow-none print:rounded-none print:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Operational Bar (Hidden during print) */}
          <div className="no-print bg-slate-900 text-white px-4 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center justify-between w-full sm:w-auto gap-2.5">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-extrabold text-sm text-white">
                      {template.title || 'Official Invoice'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                      #{booking.referenceNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden xs:block sm:block">
                    Template: <span className="text-teal-300 font-semibold">{template.name}</span> • Instant verification voucher
                  </p>
                </div>
              </div>

              {/* Mobile close button */}
              <button
                type="button"
                onClick={onClose}
                className="sm:hidden w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {/* Template Builder Button */}
              <button
                type="button"
                id="btn-edit-invoice-template"
                onClick={() => setIsBuilderOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-teal-500/40 whitespace-nowrap shrink-0 shadow-2xs"
                title="Edit template: customize headers, titles, colors, and toggle blocks"
              >
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <span>Builder</span>
              </button>

              {/* Quick Print Shortcut Button */}
              <button
                type="button"
                id="btn-print-invoice-shortcut"
                onClick={handlePrintReceipt}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0 group ring-1 ring-teal-300/60"
                title={`Quick Print Guest Receipt for Check-in (Shortcut: ${shortcutLabel} or press 'P')`}
              >
                <Printer className="w-3.5 h-3.5 text-slate-950 group-hover:scale-110 transition-transform" />
                <span>Print Receipt</span>
                <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono font-black bg-teal-950/15 text-slate-950 px-1.5 py-0.2 rounded border border-teal-600/30">
                  {shortcutLabel}
                </kbd>
              </button>

              {/* Save / Download PDF */}
              <button
                type="button"
                id="btn-download-invoice-pdf"
                onClick={handlePrintReceipt}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 whitespace-nowrap shrink-0"
                title="Save invoice / receipt as PDF file"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden md:inline">Save PDF</span>
              </button>

              {/* WhatsApp Invoice */}
              <a
                id="btn-invoice-whatsapp"
                href={whatsappInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap shrink-0"
                title="Send invoice & direct QR link to guest WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-100" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              {/* Email Invoice */}
              <a
                id="btn-invoice-email"
                href={mailtoInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 whitespace-nowrap shrink-0"
                title="Open email draft with itemized invoice"
              >
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Email</span>
              </a>

              {/* Copy Direct Link */}
              <button
                type="button"
                onClick={handleCopyReservationLink}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 whitespace-nowrap shrink-0"
                title="Copy direct link to this reservation voucher"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{linkCopied ? 'Copied' : 'REF'}</span>
              </button>

              {/* Desktop Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="hidden sm:flex w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white items-center justify-center transition-colors shrink-0"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating Toast Notification */}
          {toastMessage && (
            <div className="no-print absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-emerald-100 text-xs font-bold px-4 py-2 rounded-xl shadow-lg border border-emerald-700 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Scrollable Document Container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-slate-100/70">
            {/* THE PRINTABLE INVOICE SHEET */}
            <div 
              id="printable-booking-invoice" 
              className="relative max-w-3xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 border border-slate-200 shadow-sm space-y-6 sm:space-y-8 text-slate-800 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none overflow-hidden"
            >
              {/* Subtle Diagonal Document Watermark */}
              {template.showWatermark && (
                <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.035] -rotate-12 z-0">
                  <span className="font-heading font-black text-6xl sm:text-7xl md:text-8xl tracking-widest text-slate-900 uppercase whitespace-nowrap">
                    {template.watermarkText || 'WAVEHAVEN CERTIFIED'}
                  </span>
                </div>
              )}

              {/* 1. Official Invoice Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b-2 border-slate-100 relative z-10">
                {/* Hostel Logo & Entity Details */}
                <div className="flex items-start gap-4">
                  {template.showLogo && (
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-sm shrink-0"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Waves className="w-8 h-8" />
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
                      booking.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : booking.paymentStatus === 'deposit'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{booking.paymentStatus === 'paid' ? 'PAID IN FULL' : booking.paymentStatus === 'deposit' ? 'DEPOSIT CONFIRMED' : 'CONFIRMED BOOKING'}</span>
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
                      REF: #{booking.referenceNumber}
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
                    {booking.guest.firstName} {booking.guest.lastName}
                  </h3>
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{booking.guest.email}</span>
                  </p>
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{booking.guest.phone}</span>
                  </p>
                  {booking.guest.country && (
                    <p className="text-slate-500">
                      Country: <span className="font-medium text-slate-700">{booking.guest.country}</span>
                    </p>
                  )}
                  {template.showSurfLevel && (
                    <div className="pt-1">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 capitalize">
                        🏄 Surf Skill: {booking.guest.surfLevel.replace('_', ' ')}
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
                    <span>{room ? room.name : booking.roomName}</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Check-In:</span>
                      <span className="font-semibold text-slate-900">{formatDisplayDate(booking.checkInDate)}</span>
                      <span className="text-[10px] block" style={{ color: accentColor }}>From {settings.checkInTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Check-Out:</span>
                      <span className="font-semibold text-slate-900">{formatDisplayDate(booking.checkOutDate)}</span>
                      <span className="text-[10px] text-slate-500 block">By {settings.checkOutTime}</span>
                    </div>
                  </div>
                  <p className="text-slate-600 pt-1">
                    Duration: <span className="font-semibold text-slate-900">{booking.nights} night(s)</span> • Guests: <span className="font-semibold text-slate-900">{booking.guestsCount}</span>
                  </p>
                </div>
              </div>

              {/* 3. Itemized Billing Breakdown Table */}
              <div className="space-y-3 relative z-10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {template.chargesTableTitle || 'Itemized Charges & Services'}
                </h4>

                <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                  <table className="w-full text-xs text-left min-w-[480px] sm:min-w-0">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                        <th className="py-2.5">Item Description</th>
                        <th className="py-2.5 text-center">Qty / Nights</th>
                        <th className="py-2.5 text-right">Unit Rate</th>
                        <th className="py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Room charge */}
                      <tr>
                        <td className="py-3">
                          <span className="font-bold text-slate-900 block">
                            {room ? room.name : booking.roomName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            WaveHaven Surf Accommodation ({booking.nights} nights)
                          </span>
                        </td>
                        <td className="py-3 text-center text-slate-600 font-mono">
                          {booking.nights}
                        </td>
                        <td className="py-3 text-right text-slate-600 font-mono">
                          {settings.currencySymbol}
                          {room ? room.pricePerNight.toFixed(2) : (booking.roomSubtotal / (booking.nights || 1)).toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900 font-mono">
                          {settings.currencySymbol}{booking.roomSubtotal.toFixed(2)}
                        </td>
                      </tr>

                      {/* Surf Add-ons */}
                      {booking.addOns && booking.addOns.map((sel) => {
                        const def = addOns.find((a) => a.id === sel.addOnId);
                        const name = def ? def.name : sel.addOnId;
                        const price = def ? def.price : 0;
                        const duration = sel.days || booking.nights;
                        const lineTotal = def?.billingType === 'per_day' 
                          ? price * sel.quantity * duration 
                          : price * sel.quantity;

                        return (
                          <tr key={sel.addOnId}>
                            <td className="py-3">
                              <span className="font-semibold text-slate-800 block">
                                {name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Surf hospitality service ({def?.billingType === 'per_day' ? `${duration} days` : 'per stay'})
                              </span>
                            </td>
                            <td className="py-3 text-center text-slate-600 font-mono">
                              {sel.quantity} {def?.billingType === 'per_day' ? `(${duration}d)` : ''}
                            </td>
                            <td className="py-3 text-right text-slate-600 font-mono">
                              {settings.currencySymbol}{price.toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-semibold text-slate-800 font-mono">
                              {settings.currencySymbol}{lineTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal, Taxes, and Grand Total */}
                <div className="pt-3 border-t border-slate-200 space-y-1.5 max-w-xs ml-auto text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Room Accommodation:</span>
                    <span className="font-mono">{settings.currencySymbol}{booking.roomSubtotal.toFixed(2)}</span>
                  </div>
                  {booking.addOnsSubtotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Add-ons & Equipment:</span>
                      <span className="font-mono">{settings.currencySymbol}{booking.addOnsSubtotal.toFixed(2)}</span>
                    </div>
                  )}
                  {template.showTaxBreakdown && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Hospitality VAT / City Tax ({taxPercent}%):</span>
                      <span className="font-mono">{settings.currencySymbol}{booking.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-heading font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                    <span>Total Amount:</span>
                    <span className="font-mono" style={{ color: accentColor }}>
                      {settings.currencySymbol}{booking.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  {template.paymentInstructions && (
                    <p className="text-[10px] text-slate-500 pt-1 text-right italic">
                      {template.paymentInstructions}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. VERIFICATION & DEDICATED QR CODE BLOCK (Conditional) */}
              {template.showQrCode && (
                <div 
                  className="rounded-2xl p-5 border flex flex-col sm:flex-row items-center gap-6 relative z-10"
                  style={{ 
                    backgroundColor: `${accentColor}0a`,
                    borderColor: `${accentColor}30`
                  }}
                >
                  {/* High-Resolution QR Code */}
                  <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 shrink-0 flex flex-col items-center">
                    {qrCodeUrl ? (
                      <img 
                        src={qrCodeUrl} 
                        alt={`Reservation QR Code for ${booking.referenceNumber}`}
                        className="w-32 h-32 object-contain"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <QrCode className="w-12 h-12 animate-pulse" />
                      </div>
                    )}
                    <span className="text-[10px] font-mono font-bold mt-1" style={{ color: accentColor }}>
                      REF: #{booking.referenceNumber}
                    </span>
                  </div>

                  {/* QR Code Explanation & Direct Link */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 font-heading font-extrabold text-sm text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{template.qrSectionTitle || 'Instant Reservation QR Verification'}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {template.qrSectionDescription || `Scan this QR code with any smartphone camera to switch directly to your verified reservation voucher and download your PDF invoice anytime with code REF: #${booking.referenceNumber}.`}
                    </p>

                    {/* Direct Link Anchor */}
                    <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <a
                        href={reservationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-print inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-2xs hover:bg-teal-50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Direct Reservation Voucher</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyReservationLink}
                        className="no-print inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
                      >
                        {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{linkCopied ? 'Copied' : 'Copy REF URL'}</span>
                      </button>
                    </div>

                    {/* Visible link for paper print */}
                    <p className="hidden print:block text-[10px] font-mono text-slate-500 pt-1">
                      Verification URL: {reservationUrl}
                    </p>
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
                  <p>
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
          </div>

          {/* Bottom Modal Actions Bar (Hidden during print) */}
          <div className="no-print bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 flex items-center gap-2 text-[11px]">
              <QrCode className="w-4 h-4 text-teal-600" />
              <span>
                Verified booking #{booking.referenceNumber} • Template: <strong className="text-slate-700">{template.name}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Builder shortcut button */}
              <button
                type="button"
                onClick={() => setIsBuilderOpen(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors text-xs border border-teal-500/30"
                title="Open invoice template customizer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize Template</span>
              </button>

              {/* Primary Print Receipt Shortcut Button */}
              <button
                type="button"
                id="btn-bottom-print-shortcut"
                onClick={handlePrintReceipt}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 group"
                title={`Quick Print Guest Receipt (Shortcut: ${shortcutLabel} or press 'P')`}
              >
                <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Print Receipt</span>
                <kbd className="hidden sm:inline-flex text-[10px] bg-teal-800 text-teal-100 px-1.5 py-0.5 rounded font-mono font-bold">
                  {shortcutLabel}
                </kbd>
              </button>

              {/* Save PDF button */}
              <button
                type="button"
                id="btn-bottom-save-pdf"
                onClick={handlePrintReceipt}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors text-xs"
                title="Save as PDF via printer dialog"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Save PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Invoice Template Builder Modal */}
      {isBuilderOpen && (
        <InvoiceTemplateBuilder
          settings={settings}
          rooms={room ? [room] : undefined}
          addOns={addOns}
          isOpen={isBuilderOpen}
          initialTemplate={template}
          onClose={() => setIsBuilderOpen(false)}
          onSaveTemplate={handleSaveTemplateFromBuilder}
        />
      )}
    </>
  );
};
