import { Booking, Room, RoomAvailability } from '../types';
import { doDatesOverlap } from './date';

export function calculateRoomAvailability(
  room: Room,
  checkInDate: string,
  checkOutDate: string,
  allBookings: Booking[],
  excludeBookingId?: string
): RoomAvailability {
  // Check if room has scheduled maintenance or inactive blocks overlapping with requested dates
  const overlappingBlock = room.maintenanceBlocks?.find((block) =>
    doDatesOverlap(checkInDate, checkOutDate, block.startDate, block.endDate)
  );

  const isBlockMaintenance = overlappingBlock?.status === 'maintenance';
  const isBlockInactive = overlappingBlock?.status === 'inactive';
  const isGlobalMaintenance = room.status === 'maintenance';
  const isGlobalInactive = !room.isActive || room.status === 'inactive';

  const isMaintenance = isBlockMaintenance || isGlobalMaintenance;
  const isInactive = isBlockInactive || (isGlobalInactive && !isMaintenance);
  const maintenanceReason = overlappingBlock?.reason || (isGlobalMaintenance ? 'Room scheduled for maintenance' : undefined);

  // Filter active bookings that overlap with requested dates
  const overlappingBookings = allBookings.filter((b) => {
    if (b.roomId !== room.id) return false;
    if (b.status === 'cancelled') return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    return doDatesOverlap(checkInDate, checkOutDate, b.checkInDate, b.checkOutDate);
  });

  const isPrivate = room.type.startsWith('private');

  let bookedBeds = 0;
  if (isPrivate) {
    // If any overlapping booking exists for private room, it's fully occupied
    bookedBeds = overlappingBookings.length > 0 ? room.capacity : 0;
  } else {
    // For shared dorms, sum the guests booked in overlapping bookings
    bookedBeds = overlappingBookings.reduce((sum, b) => sum + (b.guestsCount || 1), 0);
  }

  const rawAvailableBeds = Math.max(0, room.capacity - bookedBeds);
  const occupancyPercent = (isMaintenance || isInactive)
    ? 100
    : Math.min(100, Math.round((bookedBeds / room.capacity) * 100));

  const availableBeds = (isMaintenance || isInactive) ? 0 : rawAvailableBeds;
  const isAvailable = (isMaintenance || isInactive) ? false : rawAvailableBeds > 0;

  return {
    roomId: room.id,
    totalCapacity: room.capacity,
    bookedBeds,
    availableBeds,
    isAvailable,
    occupancyPercent,
    isMaintenance,
    isInactive,
    maintenanceReason,
    activeMaintenanceBlock: overlappingBlock,
  };
}

export function getAllRoomsAvailability(
  rooms: Room[],
  checkInDate: string,
  checkOutDate: string,
  allBookings: Booking[],
  excludeBookingId?: string
): Record<string, RoomAvailability> {
  const result: Record<string, RoomAvailability> = {};
  rooms.forEach((room) => {
    result[room.id] = calculateRoomAvailability(
      room,
      checkInDate,
      checkOutDate,
      allBookings,
      excludeBookingId
    );
  });
  return result;
}

export function canAccommodateGuests(
  room: Room,
  guestsCount: number,
  checkInDate: string,
  checkOutDate: string,
  allBookings: Booking[],
  excludeBookingId?: string
): { canBook: boolean; availableBeds: number; reason?: string } {
  const avail = calculateRoomAvailability(
    room,
    checkInDate,
    checkOutDate,
    allBookings,
    excludeBookingId
  );

  if (avail.isMaintenance) {
    return {
      canBook: false,
      availableBeds: 0,
      reason: avail.maintenanceReason
        ? `Room is under scheduled maintenance: ${avail.maintenanceReason}`
        : 'Room is currently offline for scheduled maintenance.',
    };
  }

  if (avail.isInactive || !room.isActive || room.status === 'inactive') {
    return {
      canBook: false,
      availableBeds: 0,
      reason: 'Room is currently offline / inactive for reservations.',
    };
  }

  if (room.type.startsWith('private')) {
    if (guestsCount > room.capacity) {
      return {
        canBook: false,
        availableBeds: 0,
        reason: `Max capacity for this room is ${room.capacity} guests.`,
      };
    }
    if (!avail.isAvailable) {
      return { canBook: false, availableBeds: 0, reason: 'Room is already reserved for selected dates.' };
    }
    return { canBook: true, availableBeds: room.capacity };
  }

  // Dorm bed logic
  if (avail.availableBeds < guestsCount) {
    return {
      canBook: false,
      availableBeds: avail.availableBeds,
      reason: avail.availableBeds === 0 
        ? 'Dorm is completely full on these dates.' 
        : `Only ${avail.availableBeds} bed${avail.availableBeds > 1 ? 's' : ''} left for these dates.`,
    };
  }

  return { canBook: true, availableBeds: avail.availableBeds };
}
