import { 
  AutoResponderRule, 
  AutoResponderLog, 
  AutoRespondersConfig, 
  AutoResponderTriggerStatus, 
  Booking, 
  HostelSettings, 
  Room, 
  BookingStatus 
} from '../types';
import { formatDisplayDate } from './date';
import { notifyStorageChange } from './storage';

export const DEFAULT_AUTO_RESPONDER_RULES: AutoResponderRule[] = [
  {
    id: 'ar-confirmed',
    name: 'Booking Confirmed Auto-Reply',
    triggerStatus: 'confirmed',
    triggerLabel: 'Status: Confirmed',
    enabled: true,
    channel: 'whatsapp',
    autoOpenWhatsApp: true,
    description: 'Triggered automatically when a booking is confirmed or approved by front desk. Sends instant check-in details, door access, and stay summary.',
    triggersCount: 14,
    lastTriggeredAt: '2026-09-21T14:20:00.000Z',
    templateContent: `🤙 *WAVEHAVEN SURF HOUSE - RESERVATION CONFIRMED* 🤙

Aloha {guestFirstName}! Your reservation #{bookingRef} is officially CONFIRMED! 🏄‍♂️✨

🏠 *Accommodation:* {roomName}
📅 *Check-in:* {checkInDate} (from {checkInTime})
📅 *Check-out:* {checkOutDate} (by {checkOutTime})
👥 *Guests:* {guestsCount} guest(s) • *Duration:* {nights} night(s)
💰 *Total Amount:* {totalAmount} {currency} ({paymentStatus})

🔑 *Arrival & Access Information:*
📍 *Address:* {address}
🗺️ *Map:* {googleMapsUrl}
🚪 *Main Surf Gate Code:* SHAKA-2026
📶 *Guest Wi-Fi:* WaveHaven_Surf_Guest (Pass: barrelrider)

🏄 *Surf Briefing:*
Join us in the courtyard every morning at 08:30 for tide & swell breakdown.

We cannot wait to share the lineup with you! Reply directly to this WhatsApp if you need airport transfers or quiver rentals. 🌊🤙`,
  },
  {
    id: 'ar-cancelled',
    name: 'Booking Cancelled Auto-Reply',
    triggerStatus: 'cancelled',
    triggerLabel: 'Status: Cancelled',
    enabled: true,
    channel: 'whatsapp',
    autoOpenWhatsApp: false,
    description: 'Triggered when a reservation is cancelled either manually by staff or automatically due to unpaid deposit expiry.',
    triggersCount: 5,
    lastTriggeredAt: '2026-09-20T11:05:00.000Z',
    templateContent: `🌊 *WAVEHAVEN SURF HOUSE - CANCELLATION ACKNOWLEDGEMENT* 🌊

Hi {guestFirstName},

We are confirming that your reservation #{bookingRef} for {roomName} ({checkInDate} – {checkOutDate}) has been CANCELLED.

📋 *Cancellation Reason:* {cancellationReason}
🛏️ *Room Status:* Your bed has been released back to our inventory.

💰 *Deposit & Refund Terms:*
Per our cancellation policy, any eligible refund or credit voucher will be processed to your original payment method within 3 to 5 business days.

We are truly bummed we will miss catching waves with you on this trip, but we would love to welcome you back whenever you next plan a surf getaway!

Best vibes & safe travels,
WaveHaven Surf House Team
📲 +{hostelPhone}`,
  },
  {
    id: 'ar-checked-in',
    name: 'In-House Welcome & Surf Briefing',
    triggerStatus: 'checked_in',
    triggerLabel: 'Status: Checked In',
    enabled: true,
    channel: 'whatsapp',
    autoOpenWhatsApp: true,
    description: 'Triggered immediately when front desk marks the guest as checked-in upon arrival at the surf house.',
    triggersCount: 22,
    lastTriggeredAt: '2026-09-22T08:15:00.000Z',
    templateContent: `🎉 *WELCOME HOME TO WAVEHAVEN, {guestFirstName}!* 🏄‍♂️

Stoked you made it safely! Your bed in *{roomName}* is all set up with fresh linens and towels.

📋 *Daily Surf House Essentials:*
• 🌅 Morning Surf Briefing: 08:30 in the courtyard
• 🥐 Communal Breakfast: 07:30 – 10:00
• 🍹 Sunset Rooftop Drinks: 18:30 daily
• 🔒 Surf Locker & Wetsuit Rack: Side patio (Locker Code: 2026)
• 📶 Guest Wi-Fi: WaveHaven_Surf_Guest (Pass: barrelrider)

If you need any tips on secret beach breaks, board wax, or local seafood joints, chat with us here or catch any staff on the deck! 🤙`,
  },
  {
    id: 'ar-checked-out',
    name: 'Post-Stay Farewell & Review Request',
    triggerStatus: 'checked_out',
    triggerLabel: 'Status: Checked Out',
    enabled: true,
    channel: 'whatsapp',
    autoOpenWhatsApp: false,
    description: 'Triggered when the guest checks out. Sends a warm thank-you message and invites them to leave a review.',
    triggersCount: 19,
    lastTriggeredAt: '2026-09-21T10:45:00.000Z',
    templateContent: `🤙 *THANK YOU FOR SURFING WITH US, {guestFirstName}!* 🌊

Safe travels onwards from everyone at WaveHaven Surf House! It was an absolute pleasure hosting you.

If you enjoyed the waves, the hostel vibes, and our team, taking 60 seconds to share your review on Google would mean the world to our small crew:
⭐ {googleMapsUrl}

Until the next swell, keep paddling hard! 🏄‍♀️
WaveHaven Family`,
  },
  {
    id: 'ar-pending',
    name: 'Pending Deposit & Hold Notice',
    triggerStatus: 'pending',
    triggerLabel: 'Status: Pending Confirmation',
    enabled: false,
    channel: 'whatsapp',
    autoOpenWhatsApp: false,
    description: 'Triggered when a reservation is placed on hold or awaiting deposit verification.',
    triggersCount: 3,
    lastTriggeredAt: '2026-09-18T16:20:00.000Z',
    templateContent: `⏳ *WAVEHAVEN SURF HOUSE - RESERVATION HELD* ⏳

Hey {guestFirstName}! We have received your reservation request #{bookingRef} for *{roomName}* ({checkInDate} to {checkOutDate}).

Your bed is temporarily held pending deposit verification. Please reply to this WhatsApp with your payment confirmation or let us know if you need bank transfer details.

We will confirm your stay the moment it is verified! 🤙
WaveHaven Desk: +{hostelPhone}`,
  },
];

export const DEFAULT_AUTO_RESPONDERS_CONFIG: AutoRespondersConfig = {
  masterEnabled: true,
  rules: DEFAULT_AUTO_RESPONDER_RULES,
  autoOpenMode: 'prompt',
};

const STORAGE_KEYS = {
  CONFIG: 'wavehaven_auto_responders_config_v1',
  LOGS: 'wavehaven_auto_responders_logs_v1',
};

export function getStoredAutoRespondersConfig(): AutoRespondersConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) {
      try {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_AUTO_RESPONDERS_CONFIG));
      } catch {}
      return DEFAULT_AUTO_RESPONDERS_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      masterEnabled: parsed.masterEnabled ?? true,
      autoOpenMode: parsed.autoOpenMode || 'prompt',
      rules: parsed.rules && Array.isArray(parsed.rules) && parsed.rules.length > 0
        ? parsed.rules
        : DEFAULT_AUTO_RESPONDER_RULES,
    };
  } catch {
    return DEFAULT_AUTO_RESPONDERS_CONFIG;
  }
}

export function saveStoredAutoRespondersConfig(config: AutoRespondersConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch {}
  notifyStorageChange();
}

export const INITIAL_AUTO_RESPONDER_LOGS: AutoResponderLog[] = [
  {
    id: 'ar-log-1',
    ruleId: 'ar-confirmed',
    ruleName: 'Booking Confirmed Auto-Reply',
    triggerStatus: 'confirmed',
    bookingId: 'bk-1',
    bookingRef: 'WH-8492',
    guestName: 'Lucas Silva',
    guestPhone: '+351 912 987 654',
    timestamp: '2026-09-21T14:20:00.000Z',
    status: 'dispatched',
    messagePreview: 'Aloha Lucas! Your reservation #WH-8492 is officially CONFIRMED! 🏄‍♂️✨',
  },
  {
    id: 'ar-log-2',
    ruleId: 'ar-checked-in',
    ruleName: 'In-House Welcome & Surf Briefing',
    triggerStatus: 'checked_in',
    bookingId: 'bk-3',
    bookingRef: 'WH-9041',
    guestName: 'Elena Rostova',
    guestPhone: '+34 612 345 678',
    timestamp: '2026-09-22T08:15:00.000Z',
    status: 'dispatched',
    messagePreview: 'WELCOME HOME TO WAVEHAVEN, Elena! Your bed in Sunset Dorm is all set up...',
  },
  {
    id: 'ar-log-3',
    ruleId: 'ar-cancelled',
    ruleName: 'Booking Cancelled Auto-Reply',
    triggerStatus: 'cancelled',
    bookingId: 'bk-cancelled-sample',
    bookingRef: 'WH-7210',
    guestName: 'Marco Bellini',
    guestPhone: '+39 333 123 4567',
    timestamp: '2026-09-20T11:05:00.000Z',
    status: 'dispatched',
    messagePreview: 'We are confirming that your reservation #WH-7210 has been CANCELLED...',
  },
];

export function getStoredAutoResponderLogs(): AutoResponderLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      try {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_AUTO_RESPONDER_LOGS));
      } catch {}
      return INITIAL_AUTO_RESPONDER_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUTO_RESPONDER_LOGS;
  }
}

export function saveStoredAutoResponderLogs(logs: AutoResponderLog[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 50))); // Keep latest 50
  } catch {}
}

export function addAutoResponderLog(
  log: Omit<AutoResponderLog, 'id' | 'timestamp'>
): AutoResponderLog {
  const current = getStoredAutoResponderLogs();
  const newEntry: AutoResponderLog = {
    ...log,
    id: `ar-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newEntry, ...current].slice(0, 50);
  saveStoredAutoResponderLogs(updated);
  return newEntry;
}

export function clearAutoResponderLogs() {
  saveStoredAutoResponderLogs([]);
}

/**
 * Replaces all placeholder variables inside an auto-responder template.
 */
export function formatAutoResponderMessage(
  templateContent: string,
  booking: Booking,
  settings: HostelSettings,
  room?: Room,
  cancellationReason?: string
): string {
  const guestFirstName = booking.guest?.firstName || 'Guest';
  const guestLastName = booking.guest?.lastName || '';
  const guestFullName = `${guestFirstName} ${guestLastName}`.trim();
  const roomName = room?.name || booking.roomName || 'WaveHaven Room';
  const reason = cancellationReason || booking.cancellationReason || 'Requested by guest / front desk operational adjustment';

  const map: Record<string, string> = {
    '{guestName}': guestFullName,
    '{guestFirstName}': guestFirstName,
    '{guestLastName}': guestLastName,
    '{phone}': booking.guest?.phone || '',
    '{email}': booking.guest?.email || '',
    '{country}': booking.guest?.country || 'International',
    '{surfLevel}': booking.guest?.surfLevel || 'Beginner',
    '{bookingRef}': booking.referenceNumber || 'WH-BOOKING',
    '{roomName}': roomName,
    '{checkInDate}': formatDisplayDate(booking.checkInDate),
    '{checkOutDate}': formatDisplayDate(booking.checkOutDate),
    '{checkInTime}': settings.checkInTime || '14:00',
    '{checkOutTime}': settings.checkOutTime || '11:00',
    '{nights}': String(booking.nights || 1),
    '{guestsCount}': String(booking.guestsCount || 1),
    '{totalAmount}': (booking.totalAmount || 0).toFixed(2),
    '{currency}': settings.currencySymbol || '€',
    '{paymentStatus}': (booking.paymentStatus || 'paid').toUpperCase().replace('_', ' '),
    '{hostelName}': settings.name || 'WaveHaven Surf House',
    '{hostelPhone}': settings.phone || '351912345678',
    '{address}': settings.address || 'Rua do Surf 42, Ericeira, Portugal',
    '{googleMapsUrl}': settings.googleMapsUrl || 'https://maps.google.com',
    '{cancellationReason}': reason,
    '{wifiName}': settings.wifiNetworkName || 'WaveHaven_Surf_Guest',
    '{wifiPassword}': settings.wifiPassword || 'barrelrider',
  };

  let rendered = templateContent;
  Object.entries(map).forEach(([key, val]) => {
    rendered = rendered.split(key).join(val);
  });

  return rendered;
}

/**
 * Checks if an auto-responder should fire when a booking's status changes.
 */
export function checkAndTriggerAutoResponder(
  previousStatus: BookingStatus | undefined,
  updatedBooking: Booking,
  settings: HostelSettings,
  rooms: Room[] = []
): {
  triggered: boolean;
  rule?: AutoResponderRule;
  message?: string;
  log?: AutoResponderLog;
} | null {
  // If status did not change, nothing to do
  if (!previousStatus || previousStatus === updatedBooking.status) {
    return null;
  }

  const config = getStoredAutoRespondersConfig();
  if (!config.masterEnabled) {
    return null;
  }

  const targetStatus = updatedBooking.status as AutoResponderTriggerStatus;
  const matchedRule = config.rules.find(
    (r) => r.triggerStatus === targetStatus && r.enabled
  );

  if (!matchedRule) {
    return null;
  }

  const room = rooms.find((r) => r.id === updatedBooking.roomId);
  const message = formatAutoResponderMessage(
    matchedRule.templateContent,
    updatedBooking,
    settings,
    room,
    updatedBooking.cancellationReason
  );

  // Increment trigger count on rule and persist
  const updatedRules = config.rules.map((r) => {
    if (r.id === matchedRule.id) {
      return {
        ...r,
        triggersCount: (r.triggersCount || 0) + 1,
        lastTriggeredAt: new Date().toISOString(),
      };
    }
    return r;
  });

  saveStoredAutoRespondersConfig({
    ...config,
    rules: updatedRules,
  });

  // Record auto-responder log
  const log = addAutoResponderLog({
    ruleId: matchedRule.id,
    ruleName: matchedRule.name,
    triggerStatus: targetStatus,
    bookingId: updatedBooking.id,
    bookingRef: updatedBooking.referenceNumber,
    guestName: `${updatedBooking.guest.firstName} ${updatedBooking.guest.lastName}`.trim(),
    guestPhone: updatedBooking.guest.phone,
    messagePreview: message.slice(0, 100) + '...',
    status: 'dispatched',
  });

  return {
    triggered: true,
    rule: matchedRule,
    message,
    log,
  };
}
