import { Booking, HostelSettings, Room, WaitlistEntry, WaitlistPriority, WaitlistStatus } from '../types';
import { calculateRoomAvailability } from './availability';
import { calculateNights, doDatesOverlap } from './date';

export type WaitlistMatchType = 'exact' | 'alternative';

export interface WaitlistMatchResult {
  entry: WaitlistEntry;
  targetRoom: Room;
  matchType: WaitlistMatchType;
  availableBeds: number;
  totalCapacity: number;
  requestedGuests: number;
  nights: number;
  isExactRoom: boolean;
  alternativeRooms?: {
    room: Room;
    availableBeds: number;
  }[];
  matchScore: number;
  reason: string;
}

/**
 * Automatically identifies and flags all waitlist entries that match newly opened room availability.
 */
export function findWaitlistMatches(
  waitlist: WaitlistEntry[],
  rooms: Room[],
  bookings: Booking[],
  options?: {
    includeAlternatives?: boolean;
    onlyActiveStatuses?: boolean;
  }
): WaitlistMatchResult[] {
  const { includeAlternatives = true, onlyActiveStatuses = true } = options || {};

  const eligibleEntries = waitlist.filter((entry) => {
    if (onlyActiveStatuses) {
      return entry.status === 'waiting' || entry.status === 'notified';
    }
    return entry.status !== 'converted' && entry.status !== 'cancelled';
  });

  const matches: WaitlistMatchResult[] = [];

  for (const entry of eligibleEntries) {
    const requestedRoom = rooms.find((r) => r.id === entry.roomId);
    const nights = entry.nights || calculateNights(entry.checkInDate, entry.checkOutDate);

    // 1. Check exact requested room first
    if (requestedRoom) {
      const avail = calculateRoomAvailability(
        requestedRoom,
        entry.checkInDate,
        entry.checkOutDate,
        bookings
      );

      if (avail.isAvailable && avail.availableBeds >= entry.guestsCount) {
        // Priority weight
        let priorityWeight = 1;
        if (entry.priority === 'vip') priorityWeight = 100;
        else if (entry.priority === 'high') priorityWeight = 50;

        // Queue weight (lower queue number = higher priority)
        const queueWeight = Math.max(0, 20 - entry.queueNumber);
        const matchScore = priorityWeight + queueWeight + (avail.availableBeds >= entry.guestsCount ? 20 : 0);

        matches.push({
          entry,
          targetRoom: requestedRoom,
          matchType: 'exact',
          availableBeds: avail.availableBeds,
          totalCapacity: requestedRoom.capacity,
          requestedGuests: entry.guestsCount,
          nights,
          isExactRoom: true,
          matchScore,
          reason: `Exact match: ${avail.availableBeds} bed${avail.availableBeds > 1 ? 's' : ''} currently available in ${requestedRoom.name} for requested dates (${entry.checkInDate} → ${entry.checkOutDate}).`,
        });
        continue;
      }
    }

    // 2. If exact room is full, check for alternative rooms of suitable capacity if enabled
    if (includeAlternatives) {
      const alternativeCandidates: { room: Room; availableBeds: number }[] = [];

      for (const otherRoom of rooms) {
        if (requestedRoom && otherRoom.id === requestedRoom.id) continue;
        if (!otherRoom.isActive || otherRoom.status === 'inactive' || otherRoom.status === 'maintenance') continue;
        if (otherRoom.capacity < entry.guestsCount) continue;

        const otherAvail = calculateRoomAvailability(
          otherRoom,
          entry.checkInDate,
          entry.checkOutDate,
          bookings
        );

        if (otherAvail.isAvailable && otherAvail.availableBeds >= entry.guestsCount) {
          alternativeCandidates.push({
            room: otherRoom,
            availableBeds: otherAvail.availableBeds,
          });
        }
      }

      if (alternativeCandidates.length > 0) {
        const bestAlt = alternativeCandidates[0];
        let priorityWeight = 1;
        if (entry.priority === 'vip') priorityWeight = 50;
        else if (entry.priority === 'high') priorityWeight = 25;

        matches.push({
          entry,
          targetRoom: bestAlt.room,
          matchType: 'alternative',
          availableBeds: bestAlt.availableBeds,
          totalCapacity: bestAlt.room.capacity,
          requestedGuests: entry.guestsCount,
          nights,
          isExactRoom: false,
          alternativeRooms: alternativeCandidates,
          matchScore: priorityWeight,
          reason: `Alternative room opening: ${bestAlt.room.name} has ${bestAlt.availableBeds} beds available (${entry.checkInDate} → ${entry.checkOutDate}).`,
        });
      }
    }
  }

  // Sort matches: Exact matches first, then highest score, then queue number
  return matches.sort((a, b) => {
    if (a.isExactRoom && !b.isExactRoom) return -1;
    if (!a.isExactRoom && b.isExactRoom) return 1;
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.entry.queueNumber - b.entry.queueNumber;
  });
}

/**
 * Instantly converts a waitlist entry into a valid confirmed Booking object and updated WaitlistEntry
 */
export function convertWaitlistEntryToBooking(
  entry: WaitlistEntry,
  targetRoom: Room,
  settings: HostelSettings,
  overrideNotes?: string
): { newBooking: Booking; updatedEntry: WaitlistEntry } {
  const nights = entry.nights || Math.max(1, calculateNights(entry.checkInDate, entry.checkOutDate));
  const isDorm = targetRoom.type.startsWith('dorm');
  const roomSubtotal = targetRoom.pricePerNight * nights * (isDorm ? entry.guestsCount : 1);
  const taxAmount = roomSubtotal * (settings.taxRatePercent / 100);
  const totalAmount = roomSubtotal + taxAmount;

  const nowIso = new Date().toISOString();
  const randomRef = 'WH-' + Math.floor(1000 + Math.random() * 9000);
  const newBookingId = 'booking-' + Date.now();

  const adminNoteText = [
    `⚡ 1-Click Instant Conversion from Waitlist Queue #${entry.queueNumber} (${entry.priority.toUpperCase()} priority).`,
    entry.adminNotes ? `Waitlist notes: "${entry.adminNotes}".` : '',
    overrideNotes ? overrideNotes : '',
  ]
    .filter(Boolean)
    .join(' ');

  const newBooking: Booking = {
    id: newBookingId,
    referenceNumber: randomRef,
    roomId: targetRoom.id,
    roomName: targetRoom.name,
    checkInDate: entry.checkInDate,
    checkOutDate: entry.checkOutDate,
    nights,
    guestsCount: entry.guestsCount,
    guest: {
      firstName: entry.guest.firstName,
      lastName: entry.guest.lastName,
      email: entry.guest.email || `${entry.guest.firstName.toLowerCase()}.${entry.guest.lastName.toLowerCase()}@wavehaven.guest`,
      phone: entry.guest.phone || settings.phone || '+351912345678',
      country: entry.guest.country || 'International',
      surfLevel: entry.guest.surfLevel || 'intermediate',
      specialRequests: entry.guest.notes || undefined,
    },
    addOns: [],
    roomSubtotal,
    addOnsSubtotal: 0,
    taxAmount,
    totalAmount,
    status: 'confirmed',
    paymentStatus: 'pending',
    createdAt: nowIso,
    updatedAt: nowIso,
    adminNotes: adminNoteText,
    whatsappSentCount: 0,
    webhookSentCount: 0,
  };

  const updatedEntry: WaitlistEntry = {
    ...entry,
    status: 'converted',
    convertedAt: nowIso,
    convertedBookingId: newBookingId,
    adminNotes: [
      entry.adminNotes || '',
      `[Converted on ${new Date().toLocaleDateString()} to booking #${newBooking.referenceNumber} in ${targetRoom.name}]`,
    ]
      .filter(Boolean)
      .join(' '),
  };

  return { newBooking, updatedEntry };
}

/**
 * Checks if a cancelled booking frees up dates for any waitlist entries
 */
export function findMatchesForVacatedBooking(
  vacatedBooking: Booking,
  waitlist: WaitlistEntry[],
  rooms: Room[],
  remainingBookings: Booking[]
): WaitlistMatchResult[] {
  // Find waitlist entries whose dates overlap with the vacated booking
  const matchingWaitlist = waitlist.filter((entry) => {
    if (entry.status !== 'waiting' && entry.status !== 'notified') return false;
    return doDatesOverlap(
      entry.checkInDate,
      entry.checkOutDate,
      vacatedBooking.checkInDate,
      vacatedBooking.checkOutDate
    );
  });

  return findWaitlistMatches(matchingWaitlist, rooms, remainingBookings, {
    includeAlternatives: true,
  });
}
