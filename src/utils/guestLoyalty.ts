import { Booking, GuestLoyaltyStatus } from '../types';

/**
 * Normalizes phone numbers by removing all non-digit characters
 * to enable reliable cross-booking profile matching.
 */
export const normalizePhone = (phone?: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

export interface GuestLoyaltyMatch {
  isReturning: boolean;
  matchedByPhone: boolean;
  stayCount: number;
  matchingBookings: Booking[];
  loyaltyStatus: GuestLoyaltyStatus | string;
  loyaltyLabel: string;
}

/**
 * Constructs an index map from normalized phone number digits to all matching reservations.
 */
export const getPhoneMatchMap = (bookings: Booking[]): Map<string, Booking[]> => {
  const map = new Map<string, Booking[]>();
  bookings.forEach((b) => {
    const raw = b.guest?.phone;
    if (!raw) return;
    const digits = normalizePhone(raw);
    // Only index valid phone numbers with 6 or more digits
    if (digits.length >= 6) {
      const existing = map.get(digits) || [];
      existing.push(b);
      map.set(digits, existing);
    }
  });
  return map;
};

/**
 * Evaluates whether a booking represents a Returning Guest matched by phone number
 * or by explicitly assigned Loyalty Status.
 */
export const getGuestLoyaltyInfo = (
  booking: Booking,
  phoneMatchMap: Map<string, Booking[]>
): GuestLoyaltyMatch => {
  const rawPhone = booking.guest?.phone;
  const digits = normalizePhone(rawPhone);
  const matchingBookings = digits.length >= 6 ? (phoneMatchMap.get(digits) || []) : [];
  
  // A guest profile is matched by phone number if 2 or more bookings share the normalized phone
  const matchedByPhone = matchingBookings.length >= 2;
  const stayCount = Math.max(matchingBookings.length, 1);

  // Inferred or explicit loyalty status
  const rawStatus = booking.guest?.loyaltyStatus;
  let loyaltyStatus: GuestLoyaltyStatus | string = rawStatus || (matchedByPhone ? 'returning' : 'new');

  const isReturning = matchedByPhone || loyaltyStatus === 'returning' || loyaltyStatus === 'vip' || loyaltyStatus === 'local_legend';

  return {
    isReturning,
    matchedByPhone,
    stayCount,
    matchingBookings,
    loyaltyStatus,
    loyaltyLabel: formatLoyaltyStatusLabel(loyaltyStatus),
  };
};

/**
 * Human-friendly label for guest loyalty status.
 */
export const formatLoyaltyStatusLabel = (status?: GuestLoyaltyStatus | string): string => {
  switch (status) {
    case 'returning':
      return 'Returning Guest';
    case 'vip':
      return 'VIP Guest';
    case 'local_legend':
      return 'Local Legend';
    case 'new':
      return 'New Guest';
    default:
      if (!status) return 'Standard';
      return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
};

/**
 * Theme pill styling for guest loyalty status.
 */
export const getLoyaltyStatusBadgeStyle = (status?: GuestLoyaltyStatus | string): {
  bg: string;
  text: string;
  border: string;
} => {
  switch (status) {
    case 'vip':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200/90',
      };
    case 'local_legend':
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200/90',
      };
    case 'returning':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200/90',
      };
    case 'new':
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
      };
  }
};
