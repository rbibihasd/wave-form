import { Booking, HostelSettings, Room, SurfAddOn, SupportedLanguage } from '../types';
import { formatDisplayDate } from './date';
import { getTranslations, translations } from '../i18n/translations';

export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits except preserve country code
  return phone.replace(/[^0-9]/g, '');
}

export function createWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (!cleanPhone) {
    // If no phone specified, open WhatsApp with text ready to choose recipient
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

export function formatSurfLevel(level: string, lang: SupportedLanguage = 'en'): string {
  const dict = translations[lang]?.surfLevels || translations.en.surfLevels;
  switch (level) {
    case 'beginner':
      return dict.beginner;
    case 'intermediate':
      return dict.intermediate;
    case 'advanced':
      return dict.advanced;
    case 'non_surfer':
      return dict.non_surfer;
    default:
      return level;
  }
}

export function formatBookingConfirmationMessage(
  booking: Booking,
  room?: Room,
  allAddOns: SurfAddOn[] = [],
  settings?: HostelSettings,
  language?: SupportedLanguage
): string {
  const lang: SupportedLanguage = language || booking.guest.preferredLanguage || settings?.defaultLanguage || 'en';
  const t = getTranslations(lang);
  const w = t.whatsapp;

  const roomName = room ? room.name : booking.roomName;
  const currency = settings?.currencySymbol || '€';
  const hostelName = settings?.name || 'WaveHaven Surf House';

  let addOnsText = ' None';
  if (booking.addOns && booking.addOns.length > 0) {
    const list = booking.addOns.map((selected) => {
      const def = allAddOns.find((a) => a.id === selected.addOnId);
      const name = def ? def.name : selected.addOnId;
      const daysLabel = selected.days 
        ? ` (${selected.days} ${selected.days > 1 ? t.common.nights : t.common.night})` 
        : '';
      return `  • ${selected.quantity}x ${name}${daysLabel}`;
    });
    addOnsText = '\n' + list.join('\n');
  }

  const arrivalInfo = booking.guest.arrivalEstimatedTime 
    ? `\n⏰ *${t.booking.estimatedArrival}:* ${booking.guest.arrivalEstimatedTime}` 
    : '';

  const specialReq = booking.guest.specialRequests 
    ? `\n📝 *${t.common.notes}:* ${booking.guest.specialRequests}` 
    : '';

  const paymentStatusDisplay = booking.paymentStatus === 'paid'
    ? w.paidInFull
    : booking.paymentStatus === 'deposit'
    ? w.depositConfirmed
    : w.pendingSettlement;

  return `🏄‍♂️ *${hostelName.toUpperCase()} ${w.reservationTitle}* 🤙

${w.alohaGreeting}

📋 *${w.bookingRef}* #${booking.referenceNumber}
👤 *${w.leadGuest}* ${booking.guest.firstName} ${booking.guest.lastName}
📱 *${w.phone}* ${booking.guest.phone}
📧 *${w.email}* ${booking.guest.email}
🌍 *${w.country}* ${booking.guest.country || 'N/A'}
🏄 *${w.surfLevel}* ${formatSurfLevel(booking.guest.surfLevel, lang)}

🛏️ *${w.accommodation}* ${roomName}
📅 *${w.checkIn}* ${formatDisplayDate(booking.checkInDate)} (${w.fromTime} ${settings?.checkInTime || '14:00'})
📅 *${w.checkOut}* ${formatDisplayDate(booking.checkOutDate)} (${w.byTime} ${settings?.checkOutTime || '11:00'})
🌙 *${w.duration}* ${booking.nights} ${booking.nights > 1 ? w.nightPlural : w.nightSingle} | 👥 *${w.guests}* ${booking.guestsCount}

📦 *${w.surfAddOns}*${addOnsText}${arrivalInfo}${specialReq}

💳 *${w.totalAmount}* ${booking.totalAmount.toFixed(2)} ${currency}
📌 *${w.paymentStatus}* ${paymentStatusDisplay}
📍 *${w.hostelAddress}* ${settings?.address || 'Ericeira, Portugal'}

_${w.generatedFooter}_`;
}

export function formatUpcomingStayReminderMessage(
  booking: Booking,
  daysUntil: number,
  settings?: HostelSettings,
  language?: SupportedLanguage
): string {
  const lang: SupportedLanguage = language || booking.guest.preferredLanguage || settings?.defaultLanguage || 'en';
  const t = getTranslations(lang);
  const w = t.whatsapp;
  const currency = settings?.currencySymbol || '€';

  const daysText = daysUntil === 0 
    ? w.today 
    : daysUntil === 1 
      ? w.tomorrow 
      : w.inDays.replace('{days}', String(daysUntil));

  const greeting = w.upcomingGreeting
    .replace('{name}', booking.guest.firstName)
    .replace('{daysText}', daysText);

  return `🌊 *${w.upcomingAlertTitle}* 🤙

${greeting}

📋 *${w.reservationDetails}*
• Ref: *#${booking.referenceNumber}*
• ${w.accommodation} *${booking.roomName}*
• ${w.checkIn} *${formatDisplayDate(booking.checkInDate)}* (${w.fromTime} ${settings?.checkInTime || '14:00'})
• ${w.checkOut} *${formatDisplayDate(booking.checkOutDate)}*

🏄 *${w.localSurfBriefing}*
${w.localSurfText}

🔑 *${w.arrivalFrontDesk}*
• ${w.hostelAddress} ${settings?.address || 'Ericeira, Portugal'}
• ${w.frontDeskHours}
• ${w.wifiReady}
${booking.paymentStatus !== 'paid' 
  ? `\n💳 *${w.remainingBalance.replace('{amount}', `${booking.totalAmount.toFixed(2)} ${currency}`)}*` 
  : `✅ *${w.paymentSettled}*`}

${w.flightChangeNote}

${w.seeYouSoon}
*${settings?.name || w.teamSignoff}*`;
}

export function formatCheckInGuideMessage(
  booking: Booking,
  room?: Room,
  settings?: HostelSettings,
  language?: SupportedLanguage
): string {
  const lang: SupportedLanguage = language || booking.guest.preferredLanguage || settings?.defaultLanguage || 'en';
  const t = getTranslations(lang);
  const w = t.whatsapp;
  const roomName = room ? room.name : booking.roomName;

  const greeting = w.checkInGuideGreeting
    .replace('{name}', booking.guest.firstName)
    .replace('{date}', formatDisplayDate(booking.checkInDate));

  const roomReady = w.roomReadyText
    .replace('{room}', roomName)
    .replace('{time}', settings?.checkInTime || '14:00');

  return `🏄‍♂️ *${w.checkInGuideTitle}*

${greeting}

${roomReady}

📍 ${w.hostelAddress} ${settings?.address || 'Ericeira, Portugal'}
🔑 ${w.gateCode}
📶 ${w.wifiAccess}

${w.sunsetBriefing}`;
}

export function formatDepositReminderMessage(
  booking: Booking,
  settings?: HostelSettings,
  language?: SupportedLanguage
): string {
  const lang: SupportedLanguage = language || booking.guest.preferredLanguage || settings?.defaultLanguage || 'en';
  const t = getTranslations(lang);
  const w = t.whatsapp;
  const currency = settings?.currencySymbol || '€';
  const depositPercent = settings?.depositRequirementPercent || 20;
  const depositAmount = ((booking.totalAmount * depositPercent) / 100).toFixed(2);

  const greeting = w.depositReminderGreeting.replace('{name}', booking.guest.firstName);
  const actionText = w.depositActionText
    .replace('{depositAmount}', depositAmount)
    .replace('{currency}', currency);

  return `🔔 *${w.depositReminderTitle}*

${greeting}
Ref: *#${booking.referenceNumber}* (${booking.roomName})

${actionText}

💳 ${w.paymentMethods}

_${w.flightChangeNote}_
*${settings?.name || w.teamSignoff}*`;
}

export function formatCancellationNoticeMessage(
  booking: Booking,
  settings?: HostelSettings,
  reason?: string,
  language?: SupportedLanguage
): string {
  const lang: SupportedLanguage = language || booking.guest.preferredLanguage || settings?.defaultLanguage || 'en';
  const t = getTranslations(lang);
  const w = t.whatsapp;

  const greeting = w.cancellationGreeting
    .replace('{name}', booking.guest.firstName)
    .replace('{ref}', booking.referenceNumber);

  const reasonLine = w.cancellationReason.replace('{reason}', reason || 'Booking expired / requested');

  return `❌ *${w.cancellationTitle}*

${greeting}

${reasonLine}

${w.cancellationFarewell}
*${settings?.name || w.teamSignoff}*`;
}

export interface TemplateVariablesContext {
  booking?: Booking;
  room?: Room;
  addOns?: SurfAddOn[];
  settings?: HostelSettings;
  daysUntil?: number;
  language?: SupportedLanguage;
}

export function getTemplateVariableMap(context: TemplateVariablesContext): Record<string, string> {
  const { booking, room, addOns = [], settings, daysUntil = 2, language } = context;
  const lang: SupportedLanguage = language || booking?.guest.preferredLanguage || settings?.defaultLanguage || 'en';
  const t = getTranslations(lang);

  const guest = booking?.guest;
  const guestFullName = guest ? `${guest.firstName} ${guest.lastName}`.trim() : 'Lucas Silva';
  const guestFirstName = guest ? guest.firstName : 'Lucas';
  const roomName = room ? room.name : booking ? booking.roomName : 'Ocean View Sunset Suite';
  const bookingRef = booking ? booking.referenceNumber : 'WH-8492';
  const checkInDate = booking ? booking.checkInDate : '2026-09-20';
  const checkOutDate = booking ? booking.checkOutDate : '2026-09-24';
  const nights = booking ? String(booking.nights) : '4';
  const guestsCount = booking ? String(booking.guestsCount) : '2';
  const totalAmount = booking ? booking.totalAmount.toFixed(2) : '240.00';
  const currency = settings?.currencySymbol || '€';
  const hostelName = settings?.name || 'WaveHaven Surf House & Hostel';
  const hostelPhone = settings?.phone || '351912345678';
  const address = settings?.address || 'Rua das Ondas 42, 2655-321 Ericeira, Portugal';
  const checkInTime = settings?.checkInTime || '14:00';
  const checkOutTime = settings?.checkOutTime || '11:00';
  const paymentStatus = booking ? booking.paymentStatus.toUpperCase() : 'CONFIRMED (DEPOSIT PAID)';
  const surfLevel = guest ? formatSurfLevel(guest.surfLevel, lang) : formatSurfLevel('intermediate', lang);
  const wifiName = settings?.wifiNetworkName || 'WaveHaven-Guest-5G';
  const wifiPassword = settings?.wifiPassword || 'CatchWaves2026';
  const googleMapsUrl = settings?.googleMapsUrl || 'https://maps.google.com/?q=Ericeira+Portugal';
  const email = guest ? guest.email : 'lucas.silva@example.com';
  const phone = guest ? guest.phone : '+351 912 987 654';
  const country = guest?.country || 'Portugal';

  let addOnsText = 'None';
  if (booking?.addOns && booking.addOns.length > 0) {
    const list = booking.addOns.map((selected) => {
      const def = addOns.find((a) => a.id === selected.addOnId);
      const name = def ? def.name : selected.addOnId;
      const daysStr = selected.days ? ` (${selected.days} ${t.common.nights})` : '';
      return `• ${selected.quantity}x ${name}${daysStr}`;
    });
    addOnsText = list.join('\n');
  } else {
    addOnsText = '• 1x Surfboard Rental (3 days)\n• 1x Daily Organic Breakfast Package';
  }

  return {
    guestName: guestFullName,
    guestFirstName: guestFirstName,
    checkInDate: checkInDate,
    checkOutDate: checkOutDate,
    roomName: roomName,
    bookingRef: bookingRef,
    nights: nights,
    guestsCount: guestsCount,
    totalAmount: totalAmount,
    currency: currency,
    paymentStatus: paymentStatus,
    surfLevel: surfLevel,
    addOnsList: addOnsText,
    checkInTime: checkInTime,
    checkOutTime: checkOutTime,
    address: address,
    hostelName: hostelName,
    hostelPhone: hostelPhone,
    wifiName: wifiName,
    wifiPassword: wifiPassword,
    googleMapsUrl: googleMapsUrl,
    daysUntil: String(daysUntil),
    email: email,
    phone: phone,
    country: country,
  };
}

export function renderWhatsAppTemplate(templateContent: string, variableMap: Record<string, string>): string {
  if (!templateContent) return '';
  return templateContent.replace(/\{([^{}]+)\}/g, (match, key) => {
    const trimmed = key.trim();
    return variableMap[trimmed] !== undefined ? variableMap[trimmed] : match;
  });
}
