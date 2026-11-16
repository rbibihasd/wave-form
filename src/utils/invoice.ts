import QRCode from 'qrcode';
import { Booking, HostelSettings, Room, SurfAddOn, SupportedLanguage } from '../types';
import { formatDisplayDate } from './date';
import { getTranslations } from '../i18n/translations';
import { formatSurfLevel } from './whatsapp';

/**
 * Returns the unique canonical booking URL that switches directly to the reservation.
 */
export function getReservationUrl(booking: Booking, customOrigin?: string): string {
  let origin = customOrigin;
  if (!origin && typeof window !== 'undefined') {
    origin = window.location.origin + window.location.pathname;
  }
  if (!origin) {
    origin = 'https://wavehaven-hostel.app';
  }
  // Strip any trailing slashes
  origin = origin.replace(/\/$/, '');
  return `${origin}?ref=${encodeURIComponent(booking.referenceNumber)}`;
}

/**
 * Generates an official Tax Invoice Number from the booking reference.
 */
export function getInvoiceNumber(booking: Booking, customPrefix?: string): string {
  const prefix = (customPrefix && customPrefix.trim()) ? customPrefix.trim() : 'INV';
  const cleanRef = booking.referenceNumber.replace(/[^A-Za-z0-9]/g, '');
  const year = new Date(booking.createdAt || Date.now()).getFullYear() || 2026;
  return `${prefix}-${year}-${cleanRef}`;
}

/**
 * Generates a high-resolution QR Code Data URL that points directly to the confirmed reservation.
 */
export async function generateBookingQrCodeDataUrl(
  booking: Booking,
  customOrigin?: string
): Promise<string> {
  const url = getReservationUrl(booking, customOrigin);
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error creating reservation QR Code:', err);
    return '';
  }
}

/**
 * Compiles a WhatsApp invoice voucher message with direct link and QR instructions.
 */
export function formatWhatsAppInvoiceMessage(
  booking: Booking,
  room: Room | undefined,
  addOns: SurfAddOn[],
  settings: HostelSettings,
  customOrigin?: string,
  language?: SupportedLanguage
): string {
  const lang: SupportedLanguage = language || booking.guest.preferredLanguage || settings?.defaultLanguage || 'en';
  const t = getTranslations(lang);
  const w = t.whatsapp;

  const tpl = settings?.invoiceTemplateConfig;
  const prefix = tpl?.invoiceNumberPrefix || 'INV';
  const reservationUrl = getReservationUrl(booking, customOrigin);
  const invoiceNum = getInvoiceNumber(booking, prefix);
  const hostelName = settings.name || 'WaveHaven Surf House';
  const currency = settings.currencySymbol || '€';
  const roomName = room ? room.name : booking.roomName;
  const guestName = `${booking.guest.firstName} ${booking.guest.lastName}`.trim();

  // Add-ons list
  let addOnsText = '';
  if (booking.addOns && booking.addOns.length > 0) {
    const lines = booking.addOns.map((sel) => {
      const def = addOns.find((a) => a.id === sel.addOnId);
      const name = def ? def.name : sel.addOnId;
      const days = sel.days ? ` (${sel.days} ${t.common.nights})` : '';
      return `  • ${sel.quantity}x ${name}${days}`;
    });
    addOnsText = `\n🏄 *${w.surfAddOns}*\n${lines.join('\n')}`;
  }

  const paymentBadge = booking.paymentStatus === 'paid' 
    ? w.paidInFull 
    : booking.paymentStatus === 'deposit' 
    ? w.depositConfirmed 
    : w.pendingSettlement;

  // Custom Full Template Override if specified
  if (tpl?.whatsappMessageTemplate && tpl.whatsappMessageTemplate.trim().length > 0) {
    return tpl.whatsappMessageTemplate
      .replace(/{guestName}/g, guestName)
      .replace(/{guestFirstName}/g, booking.guest.firstName)
      .replace(/{guestLastName}/g, booking.guest.lastName)
      .replace(/{hostelName}/g, hostelName)
      .replace(/{hostelPhone}/g, settings.phone || '')
      .replace(/{hostelAddress}/g, settings.address || '')
      .replace(/{invoiceNumber}/g, invoiceNum)
      .replace(/{referenceNumber}/g, booking.referenceNumber)
      .replace(/{roomName}/g, roomName)
      .replace(/{checkInDate}/g, formatDisplayDate(booking.checkInDate))
      .replace(/{checkOutDate}/g, formatDisplayDate(booking.checkOutDate))
      .replace(/{checkInTime}/g, settings.checkInTime || '14:00')
      .replace(/{checkOutTime}/g, settings.checkOutTime || '11:00')
      .replace(/{nights}/g, String(booking.nights))
      .replace(/{guestsCount}/g, String(booking.guestsCount))
      .replace(/{surfLevel}/g, formatSurfLevel(booking.guest.surfLevel, lang))
      .replace(/{paymentStatus}/g, paymentBadge)
      .replace(/{currency}/g, currency)
      .replace(/{totalAmount}/g, booking.totalAmount.toFixed(2))
      .replace(/{roomSubtotal}/g, booking.roomSubtotal.toFixed(2))
      .replace(/{addOnsSubtotal}/g, booking.addOnsSubtotal.toFixed(2))
      .replace(/{taxAmount}/g, booking.taxAmount.toFixed(2))
      .replace(/{reservationUrl}/g, reservationUrl)
      .replace(/{checkInInstructions}/g, tpl.checkInInstructions || '');
  }

  // Document Title Header
  const docTitle = tpl?.title ? `🧾 *${tpl.title.toUpperCase()}* 🤙` : `🧾 *${w.invoiceTitle}* 🤙`;

  // Custom greeting / intro
  const greeting = tpl?.whatsappCustomIntro
    ? tpl.whatsappCustomIntro
        .replace(/{guestName}/g, guestName)
        .replace(/{guestFirstName}/g, booking.guest.firstName)
        .replace(/{hostelName}/g, hostelName)
        .replace(/{referenceNumber}/g, booking.referenceNumber)
        .replace(/{invoiceNumber}/g, invoiceNum)
    : `${w.alohaGreeting} ${guestName}!`;

  // Financial breakdown toggle
  let financialSection = '';
  if (tpl?.whatsappIncludeBreakdown !== false) {
    financialSection = `\n\n💰 *${w.financialBreakdown}*
• ${w.roomSubtotal} ${currency}${booking.roomSubtotal.toFixed(2)}
• ${w.addOnsSubtotal} ${currency}${booking.addOnsSubtotal.toFixed(2)}
• ${w.taxTaxes} (${settings.taxRatePercent}%): ${currency}${booking.taxAmount.toFixed(2)}
• *${t.common.total.toUpperCase()}: ${currency}${booking.totalAmount.toFixed(2)}*`;
  } else {
    financialSection = `\n\n💰 *${t.common.total.toUpperCase()}: ${currency}${booking.totalAmount.toFixed(2)}* (${w.paymentStatus}: ${paymentBadge})`;
  }

  // House & Gate Guidelines toggle
  let guidelinesSection = '';
  if (tpl?.whatsappIncludeGuidelines && tpl?.checkInInstructions) {
    const renderedInstructions = tpl.checkInInstructions
      .replace(/{hostelPhone}/g, settings.phone || '')
      .replace(/{checkInTime}/g, settings.checkInTime || '14:00')
      .replace(/{checkOutTime}/g, settings.checkOutTime || '11:00')
      .replace(/{hostelName}/g, hostelName);
    guidelinesSection = `\n\n📌 *${tpl.notesSectionTitle || 'House Guidelines & Check-in'}:*\n${renderedInstructions}`;
  }

  // Direct Reservation & QR Code voucher link
  let voucherSection = '';
  if (tpl?.whatsappIncludeVoucherLink !== false) {
    voucherSection = `\n\n📲 *DIRECT RESERVATION & QR CODE VOUCHER:*
${reservationUrl}

👉 *Tap the link above* to view your confirmed reservation directly, scan your check-in QR code, or download your official PDF invoice!`;
  }

  // Custom outro / closing
  const outro = tpl?.whatsappCustomOutro
    ? tpl.whatsappCustomOutro
        .replace(/{guestName}/g, guestName)
        .replace(/{hostelName}/g, hostelName)
    : w.seeYouSoon;

  return `${docTitle}
*${hostelName.toUpperCase()}*

${greeting}

📄 *${w.invoiceDetails}*
• ${w.invoiceNumber} *${invoiceNum}*
• ${w.bookingRef} *#${booking.referenceNumber}*
• ${w.paymentStatus} *${paymentBadge}*
• ${w.dateOfIssue} *${formatDisplayDate(booking.createdAt ? booking.createdAt.split('T')[0] : booking.checkInDate)}*

🛏️ *${w.staySummary}*
• ${w.accommodation} *${roomName}*
• ${w.checkIn} *${formatDisplayDate(booking.checkInDate)}* (${w.fromTime} ${settings.checkInTime})
• ${w.checkOut} *${formatDisplayDate(booking.checkOutDate)}* (${w.byTime} ${settings.checkOutTime})
• ${w.duration} *${booking.nights} ${booking.nights > 1 ? w.nightPlural : w.nightSingle}* | *${booking.guestsCount} ${t.common.guests}*
• ${w.surfLevel} *${formatSurfLevel(booking.guest.surfLevel, lang)}*${addOnsText}${financialSection}${guidelinesSection}${voucherSection}

📍 *${w.hostelAddress}*
${settings.address}
📞 Front Desk WhatsApp: +${settings.phone}

${outro}`;
}

/**
 * Compiles a formal email invoice with subject, plain text and metadata.
 */
export function formatEmailInvoice(
  booking: Booking,
  room: Room | undefined,
  addOns: SurfAddOn[],
  settings: HostelSettings,
  customOrigin?: string
): { subject: string; plainText: string; to: string } {
  const prefix = settings?.invoiceTemplateConfig?.invoiceNumberPrefix || 'INV';
  const reservationUrl = getReservationUrl(booking, customOrigin);
  const invoiceNum = getInvoiceNumber(booking, prefix);
  const hostelName = settings.name || 'WaveHaven Surf House';
  const currency = settings.currencySymbol || '€';
  const roomName = room ? room.name : booking.roomName;
  const guestName = `${booking.guest.firstName} ${booking.guest.lastName}`.trim();

  let addOnsText = 'None';
  if (booking.addOns && booking.addOns.length > 0) {
    addOnsText = booking.addOns
      .map((sel) => {
        const def = addOns.find((a) => a.id === sel.addOnId);
        const name = def ? def.name : sel.addOnId;
        const days = sel.days ? ` (${sel.days} days)` : '';
        return `• ${sel.quantity}x ${name}${days}`;
      })
      .join('\n');
  }

  const subject = `Booking Invoice #${booking.referenceNumber} - Confirmed Stay at ${hostelName}`;

  const plainText = `OFFICIAL BOOKING INVOICE & RESERVATION VOUCHER
${hostelName}
Address: ${settings.address}
Tax / NIF: PT 509 876 543
Contact WhatsApp: +${settings.phone} | Email: ${settings.email}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INVOICE TO:
Guest Name: ${guestName}
Email: ${booking.guest.email}
Phone: ${booking.guest.phone}
Country: ${booking.guest.country || 'International'}
Surf Level: ${booking.guest.surfLevel.replace('_', ' ').toUpperCase()}

INVOICE PARTICULARS:
Invoice Number: ${invoiceNum}
Booking Reference (REF): #${booking.referenceNumber}
Issue Date: ${formatDisplayDate(booking.createdAt ? booking.createdAt.split('T')[0] : booking.checkInDate)}
Payment Status: ${booking.paymentStatus.toUpperCase()}
Booking Status: CONFIRMED

STAY DETAILS:
Accommodation: ${roomName}
Check-In Date: ${formatDisplayDate(booking.checkInDate)} (from ${settings.checkInTime})
Check-Out Date: ${formatDisplayDate(booking.checkOutDate)} (by ${settings.checkOutTime})
Nights: ${booking.nights} | Guests: ${booking.guestsCount}

SURF & HOSPITALITY ADD-ONS:
${addOnsText}

FINANCIAL BREAKDOWN:
• Room Accommodation: ${currency}${booking.roomSubtotal.toFixed(2)}
• Add-ons & Equipment: ${currency}${booking.addOnsSubtotal.toFixed(2)}
• VAT / Municipal Hospitality Tax (${settings.taxRatePercent}%): ${currency}${booking.taxAmount.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL INVOICE AMOUNT: ${currency}${booking.totalAmount.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DIRECT DIGITAL RESERVATION & QR CODE ACCESS:
You can view your confirmed reservation and download your official PDF invoice anytime at:
${reservationUrl}

(When accessing the link above or scanning the QR code, your reservation is automatically verified with REF: #${booking.referenceNumber})

Check-In Notice:
Reception is open 08:00 - 22:00. If arriving outside these hours, please contact us on WhatsApp (+${settings.phone}) for key locker code instructions.

Thank you for booking with ${hostelName}!
WaveHaven Surf House Team`;

  return {
    subject,
    plainText,
    to: booking.guest.email,
  };
}
