import { Booking, HostelSettings } from '../types';
import { dispatchWebhook } from './webhook';

/**
 * Checks if a deposit (or full payment) has been received for a booking.
 * Returns true if paymentStatus is 'paid' or 'deposit'.
 * Returns false if paymentStatus is 'unpaid' or 'pending'.
 */
export function isDepositReceived(booking: Booking): boolean {
  return booking.paymentStatus === 'paid' || booking.paymentStatus === 'deposit';
}

/**
 * Calculates how many days (as float) have elapsed since the booking was created.
 */
export function getBookingCreationAgeDays(booking: Booking, now: Date = new Date()): number {
  if (!booking.createdAt) return 0;
  const createdTime = new Date(booking.createdAt).getTime();
  if (isNaN(createdTime)) return 0;
  const elapsedMs = Math.max(0, now.getTime() - createdTime);
  return elapsedMs / (1000 * 60 * 60 * 24);
}

/**
 * Determines whether a booking is eligible for auto-cancellation.
 * A booking is eligible if:
 * 1. It is not already cancelled, checked_in, or checked_out.
 * 2. No deposit has been received (paymentStatus is 'unpaid' or 'pending').
 * 3. Age since creation >= daysLimit.
 */
export function isBookingEligibleForAutoCancel(
  booking: Booking,
  daysLimit: number,
  now: Date = new Date()
): boolean {
  if (booking.status === 'cancelled' || booking.status === 'checked_in' || booking.status === 'checked_out') {
    return false;
  }
  if (isDepositReceived(booking)) {
    return false;
  }
  const ageDays = getBookingCreationAgeDays(booking, now);
  return ageDays >= daysLimit;
}

/**
 * Gets the deadline date when a booking will be auto-cancelled if deposit is not received.
 */
export function getAutoCancelDeadline(booking: Booking, daysLimit: number): Date {
  const created = new Date(booking.createdAt || Date.now());
  return new Date(created.getTime() + daysLimit * 24 * 60 * 60 * 1000);
}

/**
 * Calculates remaining grace time before auto-cancellation.
 */
export function getAutoCancelTimeRemaining(
  booking: Booking,
  daysLimit: number,
  now: Date = new Date()
): {
  isOverdue: boolean;
  hoursRemaining: number;
  daysRemaining: number;
  label: string;
} {
  const deadline = getAutoCancelDeadline(booking, daysLimit);
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    const overdueDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const overdueHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return {
      isOverdue: true,
      hoursRemaining: 0,
      daysRemaining: 0,
      label: overdueDays > 0 ? `Overdue by ${overdueDays}d ${overdueHours}h` : `Overdue by ${overdueHours}h`,
    };
  }

  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  let label = '';
  if (daysRemaining >= 1) {
    const remHours = hoursRemaining % 24;
    label = remHours > 0 ? `${daysRemaining}d ${remHours}h left` : `${daysRemaining}d left`;
  } else {
    label = `${hoursRemaining}h left`;
  }

  return {
    isOverdue: false,
    hoursRemaining,
    daysRemaining,
    label,
  };
}

/**
 * Cancels a single booking due to missing deposit.
 */
export function cancelUnpaidBooking(
  booking: Booking,
  daysLimit: number,
  now: Date = new Date()
): Booking {
  const reason = `Auto-cancelled: deposit not received within ${daysLimit} day${daysLimit === 1 ? '' : 's'} of booking creation`;
  const existingNotes = booking.adminNotes ? `${booking.adminNotes}\n` : '';
  const auditNote = `[Auto-Cancel System - ${now.toISOString().split('T')[0]}]: Cancelled reservation because deposit was not received within ${daysLimit} days of creation.`;

  return {
    ...booking,
    status: 'cancelled',
    cancellationReason: reason,
    autoCancelledAt: now.toISOString(),
    updatedAt: now.toISOString(),
    adminNotes: `${existingNotes}${auditNote}`,
  };
}

/**
 * Summary evaluation of all unpaid reservations against current settings.
 */
export function evaluateAutoCancellations(
  bookings: Booking[],
  settings: HostelSettings,
  now: Date = new Date()
) {
  const isEnabled = Boolean(settings.autoCancelUnpaidEnabled);
  const daysLimit = settings.autoCancelUnpaidDays && settings.autoCancelUnpaidDays > 0 ? settings.autoCancelUnpaidDays : 3;

  const eligibleForCancel: Booking[] = [];
  const pendingWithinGrace: Booking[] = [];

  bookings.forEach((b) => {
    // Only look at active reservations (not already cancelled or completed)
    if (b.status === 'cancelled' || b.status === 'checked_in' || b.status === 'checked_out') {
      return;
    }

    if (!isDepositReceived(b)) {
      const ageDays = getBookingCreationAgeDays(b, now);
      if (ageDays >= daysLimit) {
        eligibleForCancel.push(b);
      } else {
        pendingWithinGrace.push(b);
      }
    }
  });

  return {
    isEnabled,
    daysLimit,
    eligibleForCancel,
    pendingWithinGrace,
    overdueCount: eligibleForCancel.length,
    graceCount: pendingWithinGrace.length,
    totalUnpaidActiveCount: eligibleForCancel.length + pendingWithinGrace.length,
  };
}

/**
 * Executes auto-cancellation for all eligible bookings.
 * Returns the list of all updated bookings and the subset that was cancelled.
 */
export async function executeBatchAutoCancellation(
  bookings: Booking[],
  settings: HostelSettings,
  now: Date = new Date()
): Promise<{
  updatedBookings: Booking[];
  cancelledBookings: Booking[];
  count: number;
}> {
  const isEnabled = Boolean(settings.autoCancelUnpaidEnabled);
  if (!isEnabled) {
    return { updatedBookings: bookings, cancelledBookings: [], count: 0 };
  }

  const daysLimit = settings.autoCancelUnpaidDays && settings.autoCancelUnpaidDays > 0 ? settings.autoCancelUnpaidDays : 3;
  const cancelledBookings: Booking[] = [];

  const updatedBookings = bookings.map((b) => {
    if (isBookingEligibleForAutoCancel(b, daysLimit, now)) {
      const cancelled = cancelUnpaidBooking(b, daysLimit, now);
      cancelledBookings.push(cancelled);
      return cancelled;
    }
    return b;
  });

  // Optionally trigger cancellation webhook for each auto-cancelled booking in background
  if (cancelledBookings.length > 0 && settings.webhookEnabled && settings.webhookUrl) {
    for (const cb of cancelledBookings) {
      try {
        await dispatchWebhook('booking.cancelled', cb, settings, {
          cancellationSource: 'auto_cancel_unpaid',
          daysLimit,
          reason: cb.cancellationReason,
        });
      } catch (err) {
        console.error('Failed to dispatch webhook for auto-cancelled booking:', err);
      }
    }
  }

  return {
    updatedBookings,
    cancelledBookings,
    count: cancelledBookings.length,
  };
}
