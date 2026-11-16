import { Booking, HostelSettings, WebhookLog } from '../types';

const STORAGE_KEY_WEBHOOK_LOGS = 'wavehaven_webhook_logs';

export function getWebhookLogs(): WebhookLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WEBHOOK_LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveWebhookLog(log: WebhookLog) {
  try {
    const current = getWebhookLogs();
    const updated = [log, ...current].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEY_WEBHOOK_LOGS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save webhook log', err);
  }
}

export function clearWebhookLogs() {
  try {
    localStorage.removeItem(STORAGE_KEY_WEBHOOK_LOGS);
  } catch (err) {
    console.error('Failed to clear webhook logs', err);
  }
}

export async function dispatchWebhook(
  event: 'booking.created' | 'booking.updated' | 'booking.cancelled' | 'stay.reminder_sent' | 'system.test',
  booking: Booking | null,
  settings: HostelSettings,
  customPayload?: Record<string, unknown>
): Promise<{ success: boolean; message: string; statusCode?: number }> {
  // Check if specific event is disabled
  if (settings.webhookEvents && event !== 'system.test') {
    if (event === 'booking.created' && !settings.webhookEvents.onBookingCreated) {
      return { success: false, message: 'Event onBookingCreated is disabled in webhook settings' };
    }
    if (event === 'booking.updated' && !settings.webhookEvents.onBookingStatusChange) {
      return { success: false, message: 'Event onBookingStatusChange is disabled in webhook settings' };
    }
    if (event === 'booking.cancelled' && !settings.webhookEvents.onCancellation) {
      return { success: false, message: 'Event onCancellation is disabled in webhook settings' };
    }
    if (event === 'stay.reminder_sent' && !settings.webhookEvents.onReminderSent) {
      return { success: false, message: 'Event onReminderSent is disabled in webhook settings' };
    }
  }

  if (!settings.webhookEnabled || !settings.webhookUrl) {
    const log: WebhookLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      event,
      bookingRef: booking?.referenceNumber || 'SYSTEM',
      endpoint: settings.webhookUrl || 'Not configured',
      status: 'simulated',
      payloadSummary: 'Webhook disabled or empty endpoint in settings.',
    };
    saveWebhookLog(log);
    return { success: false, message: 'Webhook is disabled or URL is missing in settings' };
  }

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    hostel: {
      name: settings.name,
      location: settings.location,
      currency: settings.currency,
      phone: settings.phone,
      timezone: settings.timezone || 'Europe/Lisbon',
      operatingStatus: settings.operatingStatus || 'open',
    },
    booking: booking ? {
      referenceNumber: booking.referenceNumber,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights: booking.nights,
      guestsCount: booking.guestsCount,
      roomName: booking.roomName,
      totalAmount: booking.totalAmount,
      guest: {
        firstName: booking.guest.firstName,
        lastName: booking.guest.lastName,
        email: booking.guest.email,
        phone: booking.guest.phone,
        country: booking.guest.country,
        surfLevel: booking.guest.surfLevel,
      },
      addOns: booking.addOns,
    } : null,
    extra: customPayload || {},
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (settings.webhookSecret) {
      headers['X-Webhook-Secret'] = settings.webhookSecret;
      headers['Authorization'] = `Bearer ${settings.webhookSecret}`;
    }

    const response = await fetch(settings.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      mode: 'cors',
    }).catch(async (fetchError) => {
      // If CORS blocks reading response, try 'no-cors' so browser still pushes data to webhook
      console.warn('CORS restricted or blocked direct response, trying no-cors push:', fetchError);
      return await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
    });

    clearTimeout(timeoutId);

    const log: WebhookLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      event,
      bookingRef: booking?.referenceNumber || 'SYSTEM',
      endpoint: settings.webhookUrl,
      status: 'success',
      statusCode: response.status || 200,
      payloadSummary: `${event} -> Ref: ${booking?.referenceNumber || 'TEST'} (${booking?.guest.firstName || 'User'})`,
    };
    saveWebhookLog(log);

    return {
      success: true,
      message: `Webhook sent successfully to ${settings.webhookUrl}`,
      statusCode: response.status || 200,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown network failure';
    const log: WebhookLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      event,
      bookingRef: booking?.referenceNumber || 'SYSTEM',
      endpoint: settings.webhookUrl,
      status: 'failed',
      payloadSummary: `Failed to dispatch: ${errMsg}`,
    };
    saveWebhookLog(log);

    return {
      success: false,
      message: `Failed to reach webhook: ${errMsg}`,
    };
  }
}
