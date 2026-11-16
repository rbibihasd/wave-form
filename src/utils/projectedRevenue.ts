import { Booking, Room, SurfAddOn, HostelSettings } from '../types';

export interface DailyActiveBookingSummary {
  id: string;
  referenceNumber: string;
  guestName: string;
  roomId: string;
  roomName: string;
  guestsCount: number;
  nightlyAccommodationRate: number;
  nightlyAddOnsRate: number;
  nightlyTotalRate: number;
  status: string;
  paymentStatus: string;
}

export interface DailyRoomBreakdown {
  roomId: string;
  roomName: string;
  roomType: string;
  pricePerNight: number;
  capacity: number;
  bookedBeds: number;
  revenue: number;
  potentialRevenue: number;
  isFullyBooked: boolean;
  occupancyPercent: number;
}

export interface DailyRevenueProjection {
  date: string; // YYYY-MM-DD
  formattedDate: string; // "Sep 20"
  dayOfWeek: string; // "Fri"
  isWeekend: boolean;
  dayIndex: number; // 0 to 29

  // Booked Revenue Metrics
  bookedAccommodationRevenue: number;
  bookedAddOnsRevenue: number;
  bookedTotalRevenue: number;
  confirmedBookingsCount: number;

  // Capacity & Beds
  bookedBeds: number;
  totalAvailableBeds: number;
  occupancyPercent: number;

  // Potential Rack Rate & Opportunity Gap
  potentialMaxCapacityRevenue: number;
  unsoldPotentialRevenue: number;
  
  // Efficiency
  revPar: number; // Revenue Per Available Bed
  adr: number; // Average Daily Rate per Booked Bed

  // Cash Flow / Collection Status
  estimatedCashCollected: number;
  estimatedBalanceDueAtCheckIn: number;

  // Detailed breakdown
  roomBreakdown: DailyRoomBreakdown[];
  activeBookings: DailyActiveBookingSummary[];
}

export interface RoomPerformanceSummary {
  roomId: string;
  roomName: string;
  roomType: string;
  capacity: number;
  pricePerNight: number;
  projectedRevenue: number;
  potentialRevenue: number;
  bookedBedNights: number;
  totalBedNights: number;
  occupancyPercent: number;
  realizationPercent: number;
}

export interface RoomTypePerformanceSummary {
  type: string;
  typeLabel: string;
  projectedRevenue: number;
  potentialRevenue: number;
  bookedBedNights: number;
  availableBedNights: number;
  occupancyPercent: number;
  realizationPercent: number;
}

export interface AddOnProjectedSummary {
  id: string;
  name: string;
  category: string;
  price: number;
  projectedRevenue: number;
  estimatedUnits: number;
}

export interface ProjectedRevenueSummary {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  horizonDays: number; // 30

  // 30-Day Totals
  totalProjectedRevenue: number;
  totalAccommodationRevenue: number;
  totalAddOnsRevenue: number;
  totalPotentialMaxRevenue: number;
  totalUnsoldOpportunityGap: number;
  realizationRate: number; // % of potential revenue realized

  // Bed Nights & Occupancy
  totalAvailableBedNights: number;
  totalBookedBedNights: number;
  averageOccupancyPercent: number;
  projectedADR: number; // Average Daily Rate per booked bed night
  projectedRevPAR: number; // Revenue per available bed night

  // Cash Flow Projection
  totalCollectedRevenue: number;
  totalBalanceDueOnArrival: number;
  unpaidPendingAtRiskRevenue: number;

  // Breakdowns
  roomPerformance: RoomPerformanceSummary[];
  roomTypeBreakdown: RoomTypePerformanceSummary[];
  addOnsBreakdown: AddOnProjectedSummary[];

  // Daily array for charts and tables
  dailyProjections: DailyRevenueProjection[];
}

/**
 * Format a Date to YYYY-MM-DD local string
 */
export function formatLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates a comprehensive 30-day projected revenue report
 * based on existing active bookings and current room rates.
 * Supports what-if rate multiplier simulations (e.g. 1.10 = +10% rate).
 */
export function calculate30DayProjectedRevenue(
  bookings: Booking[],
  rooms: Room[],
  addOns: SurfAddOn[],
  settings: HostelSettings,
  rateMultiplier: number = 1.0,
  targetOccupancyBoostPercent: number = 0 // 0 to 50% simulated boost on unsold beds
): ProjectedRevenueSummary {
  const activeRooms = rooms.filter((r) => r.isActive !== false);
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');

  // Horizon: Today through Next 30 Days (Day 0 to Day 29)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyProjections: DailyRevenueProjection[] = [];
  const roomTotalsMap = new Map<string, { projectedRev: number; bookedBeds: number }>();
  activeRooms.forEach((r) => roomTotalsMap.set(r.id, { projectedRev: 0, bookedBeds: 0 }));

  const roomTypeMap = new Map<string, {
    projectedRev: number;
    potentialRev: number;
    bookedBeds: number;
    availableBeds: number;
  }>();

  const addOnTotalsMap = new Map<string, { revenue: number; units: number }>();
  addOns.forEach((a) => addOnTotalsMap.set(a.id, { revenue: 0, units: 0 }));

  const depositPercent = (settings.depositRequirementPercent || 20) / 100;

  for (let i = 0; i < 30; i++) {
    const currentDay = new Date(today);
    currentDay.setDate(today.getDate() + i);
    const dateStr = formatLocalDateStr(currentDay);

    const dayName = currentDay.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = currentDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayOfWeekIdx = currentDay.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeekIdx === 0 || dayOfWeekIdx === 6 || dayOfWeekIdx === 5; // Fri, Sat, Sun

    // Determine active rooms on this day (accounting for maintenance blocks if any)
    const availableRoomsToday = activeRooms.filter((r) => {
      if (!r.maintenanceBlocks || r.maintenanceBlocks.length === 0) return true;
      const isUnderMaintenance = r.maintenanceBlocks.some(
        (mb) => mb.startDate <= dateStr && dateStr <= mb.endDate
      );
      return !isUnderMaintenance;
    });

    const totalAvailableBedsToday = availableRoomsToday.reduce((sum, r) => sum + r.capacity, 0);

    // Calculate maximum theoretical rack rate capacity revenue for today
    let potentialMaxCapacityRevenue = 0;
    availableRoomsToday.forEach((r) => {
      const effectiveRate = r.pricePerNight * rateMultiplier;
      const isDorm = r.type.startsWith('dorm');
      const roomPotential = isDorm ? effectiveRate * r.capacity : effectiveRate;
      potentialMaxCapacityRevenue += roomPotential;

      // Group by room type
      const currentTypeStats = roomTypeMap.get(r.type) || {
        projectedRev: 0,
        potentialRev: 0,
        bookedBeds: 0,
        availableBeds: 0,
      };
      currentTypeStats.potentialRev += roomPotential;
      currentTypeStats.availableBeds += r.capacity;
      roomTypeMap.set(r.type, currentTypeStats);
    });

    // Find bookings occupying a room on this night
    // Stay includes date if checkInDate <= dateStr < checkOutDate
    const bookingsToday = activeBookings.filter(
      (b) => b.checkInDate <= dateStr && dateStr < b.checkOutDate
    );

    let bookedAccommodationRevenue = 0;
    let bookedAddOnsRevenue = 0;
    let bookedBeds = 0;
    let estimatedCashCollected = 0;
    let estimatedBalanceDueAtCheckIn = 0;

    const dailyActiveSummaries: DailyActiveBookingSummary[] = [];
    const dailyRoomBreakdownMap = new Map<string, { bookedBeds: number; revenue: number }>();
    availableRoomsToday.forEach((r) => dailyRoomBreakdownMap.set(r.id, { bookedBeds: 0, revenue: 0 }));

    bookingsToday.forEach((b) => {
      const matchingRoom = activeRooms.find((r) => r.id === b.roomId);
      const isDorm = matchingRoom ? matchingRoom.type.startsWith('dorm') : b.roomName.toLowerCase().includes('dorm');

      // Nightly accommodation calculation:
      // Proportionate room subtotal or current room rate
      let nightlyAcc = 0;
      if (b.nights && b.nights > 0 && b.roomSubtotal) {
        nightlyAcc = (b.roomSubtotal / b.nights) * (rateMultiplier !== 1.0 ? rateMultiplier : 1.0);
      } else if (matchingRoom) {
        const baseRate = matchingRoom.pricePerNight * rateMultiplier;
        nightlyAcc = isDorm ? baseRate * b.guestsCount : baseRate;
      }

      // Nightly add-ons calculation:
      let nightlyAddons = 0;
      if (b.nights && b.nights > 0 && b.addOnsSubtotal) {
        nightlyAddons = b.addOnsSubtotal / b.nights;
      }

      // Track add-on details for this night
      if (b.addOns && b.addOns.length > 0 && b.nights && b.nights > 0) {
        b.addOns.forEach((sel) => {
          const addOnDef = addOns.find((a) => a.id === sel.addOnId);
          if (addOnDef) {
            const currentAddOnStat = addOnTotalsMap.get(sel.addOnId) || { revenue: 0, units: 0 };
            const dailyPortion = (addOnDef.price * sel.quantity) / (sel.days || b.nights || 1);
            currentAddOnStat.revenue += dailyPortion;
            currentAddOnStat.units += (sel.quantity / (b.nights || 1));
            addOnTotalsMap.set(sel.addOnId, currentAddOnStat);
          }
        });
      }

      const nightlyTotal = nightlyAcc + nightlyAddons;

      bookedAccommodationRevenue += nightlyAcc;
      bookedAddOnsRevenue += nightlyAddons;

      // Bed count
      const bedsOccupied = isDorm ? b.guestsCount : (matchingRoom ? matchingRoom.capacity : b.guestsCount);
      bookedBeds += bedsOccupied;

      // Cash flow allocation
      if (b.paymentStatus === 'paid') {
        estimatedCashCollected += nightlyTotal;
      } else if (b.paymentStatus === 'deposit') {
        const depositPortion = nightlyTotal * depositPercent;
        estimatedCashCollected += depositPortion;
        estimatedBalanceDueAtCheckIn += (nightlyTotal - depositPortion);
      } else {
        // Pending / Unpaid
        estimatedBalanceDueAtCheckIn += nightlyTotal;
      }

      // Room totals
      if (matchingRoom) {
        const rStats = dailyRoomBreakdownMap.get(matchingRoom.id) || { bookedBeds: 0, revenue: 0 };
        rStats.bookedBeds += bedsOccupied;
        rStats.revenue += nightlyAcc;
        dailyRoomBreakdownMap.set(matchingRoom.id, rStats);

        const rCumulative = roomTotalsMap.get(matchingRoom.id) || { projectedRev: 0, bookedBeds: 0 };
        rCumulative.projectedRev += nightlyAcc;
        rCumulative.bookedBeds += bedsOccupied;
        roomTotalsMap.set(matchingRoom.id, rCumulative);

        // Room Type Cumulative
        const rtCumulative = roomTypeMap.get(matchingRoom.type) || {
          projectedRev: 0,
          potentialRev: 0,
          bookedBeds: 0,
          availableBeds: 0,
        };
        rtCumulative.projectedRev += nightlyAcc;
        rtCumulative.bookedBeds += bedsOccupied;
        roomTypeMap.set(matchingRoom.type, rtCumulative);
      }

      dailyActiveSummaries.push({
        id: b.id,
        referenceNumber: b.referenceNumber,
        guestName: `${b.guest.firstName} ${b.guest.lastName}`,
        roomId: b.roomId,
        roomName: b.roomName,
        guestsCount: b.guestsCount,
        nightlyAccommodationRate: Math.round(nightlyAcc * 100) / 100,
        nightlyAddOnsRate: Math.round(nightlyAddons * 100) / 100,
        nightlyTotalRate: Math.round(nightlyTotal * 100) / 100,
        status: b.status,
        paymentStatus: b.paymentStatus,
      });
    });

    // Simulated boost on unsold capacity if requested in what-if simulation
    if (targetOccupancyBoostPercent > 0) {
      const unsoldBeds = Math.max(0, totalAvailableBedsToday - bookedBeds);
      const boostedBeds = Math.min(unsoldBeds, Math.round(unsoldBeds * (targetOccupancyBoostPercent / 100)));
      if (boostedBeds > 0 && totalAvailableBedsToday > 0) {
        const averageRackRatePerBed = potentialMaxCapacityRevenue / totalAvailableBedsToday;
        const additionalBoostedRev = boostedBeds * averageRackRatePerBed;
        bookedAccommodationRevenue += additionalBoostedRev;
        bookedBeds += boostedBeds;
      }
    }

    const bookedTotalRevenue = bookedAccommodationRevenue + bookedAddOnsRevenue;
    const unsoldPotentialRevenue = Math.max(0, potentialMaxCapacityRevenue - bookedAccommodationRevenue);
    const occupancyPercent = totalAvailableBedsToday > 0 
      ? Math.min(100, Math.round((bookedBeds / totalAvailableBedsToday) * 100)) 
      : 0;

    const revPar = totalAvailableBedsToday > 0 ? (bookedAccommodationRevenue / totalAvailableBedsToday) : 0;
    const adr = bookedBeds > 0 ? (bookedAccommodationRevenue / bookedBeds) : 0;

    // Build room breakdown for this day
    const roomBreakdown: DailyRoomBreakdown[] = availableRoomsToday.map((r) => {
      const stats = dailyRoomBreakdownMap.get(r.id) || { bookedBeds: 0, revenue: 0 };
      const isDorm = r.type.startsWith('dorm');
      const rate = r.pricePerNight * rateMultiplier;
      const roomPotential = isDorm ? rate * r.capacity : rate;
      const occ = r.capacity > 0 ? Math.min(100, Math.round((stats.bookedBeds / r.capacity) * 100)) : 0;

      return {
        roomId: r.id,
        roomName: r.name,
        roomType: r.type,
        pricePerNight: rate,
        capacity: r.capacity,
        bookedBeds: stats.bookedBeds,
        revenue: Math.round(stats.revenue * 100) / 100,
        potentialRevenue: Math.round(roomPotential * 100) / 100,
        isFullyBooked: stats.bookedBeds >= r.capacity,
        occupancyPercent: occ,
      };
    });

    dailyProjections.push({
      date: dateStr,
      formattedDate,
      dayOfWeek: dayName,
      isWeekend,
      dayIndex: i,
      bookedAccommodationRevenue: Math.round(bookedAccommodationRevenue * 100) / 100,
      bookedAddOnsRevenue: Math.round(bookedAddOnsRevenue * 100) / 100,
      bookedTotalRevenue: Math.round(bookedTotalRevenue * 100) / 100,
      confirmedBookingsCount: bookingsToday.length,
      bookedBeds,
      totalAvailableBeds: totalAvailableBedsToday,
      occupancyPercent,
      potentialMaxCapacityRevenue: Math.round(potentialMaxCapacityRevenue * 100) / 100,
      unsoldPotentialRevenue: Math.round(unsoldPotentialRevenue * 100) / 100,
      revPar: Math.round(revPar * 100) / 100,
      adr: Math.round(adr * 100) / 100,
      estimatedCashCollected: Math.round(estimatedCashCollected * 100) / 100,
      estimatedBalanceDueAtCheckIn: Math.round(estimatedBalanceDueAtCheckIn * 100) / 100,
      roomBreakdown,
      activeBookings: dailyActiveSummaries,
    });
  }

  // 30-Day Aggregates
  const totalAccommodationRevenue = dailyProjections.reduce((sum, d) => sum + d.bookedAccommodationRevenue, 0);
  const totalAddOnsRevenue = dailyProjections.reduce((sum, d) => sum + d.bookedAddOnsRevenue, 0);
  const totalProjectedRevenue = totalAccommodationRevenue + totalAddOnsRevenue;
  const totalPotentialMaxRevenue = dailyProjections.reduce((sum, d) => sum + d.potentialMaxCapacityRevenue, 0);
  const totalUnsoldOpportunityGap = Math.max(0, totalPotentialMaxRevenue - totalAccommodationRevenue);
  const realizationRate = totalPotentialMaxRevenue > 0 
    ? Math.round((totalAccommodationRevenue / totalPotentialMaxRevenue) * 100) 
    : 0;

  const totalAvailableBedNights = dailyProjections.reduce((sum, d) => sum + d.totalAvailableBeds, 0);
  const totalBookedBedNights = dailyProjections.reduce((sum, d) => sum + d.bookedBeds, 0);
  const averageOccupancyPercent = totalAvailableBedNights > 0 
    ? Math.round((totalBookedBedNights / totalAvailableBedNights) * 100) 
    : 0;

  const projectedADR = totalBookedBedNights > 0 ? (totalAccommodationRevenue / totalBookedBedNights) : 0;
  const projectedRevPAR = totalAvailableBedNights > 0 ? (totalAccommodationRevenue / totalAvailableBedNights) : 0;

  const totalCollectedRevenue = dailyProjections.reduce((sum, d) => sum + d.estimatedCashCollected, 0);
  const totalBalanceDueOnArrival = dailyProjections.reduce((sum, d) => sum + d.estimatedBalanceDueAtCheckIn, 0);

  // Unpaid or pending bookings at risk within this 30-day window
  const unpaidPendingAtRiskRevenue = activeBookings
    .filter((b) => (b.paymentStatus === 'unpaid' || b.paymentStatus === 'pending') && b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // Room performance summary
  const roomPerformance: RoomPerformanceSummary[] = activeRooms.map((r) => {
    const cumulative = roomTotalsMap.get(r.id) || { projectedRev: 0, bookedBeds: 0 };
    const isDorm = r.type.startsWith('dorm');
    const effectiveRate = r.pricePerNight * rateMultiplier;
    const dailyPotential = isDorm ? effectiveRate * r.capacity : effectiveRate;
    const totalPotential = dailyPotential * 30;
    const totalBedNights = r.capacity * 30;
    const occ = totalBedNights > 0 ? Math.round((cumulative.bookedBeds / totalBedNights) * 100) : 0;
    const real = totalPotential > 0 ? Math.round((cumulative.projectedRev / totalPotential) * 100) : 0;

    return {
      roomId: r.id,
      roomName: r.name,
      roomType: r.type,
      capacity: r.capacity,
      pricePerNight: effectiveRate,
      projectedRevenue: Math.round(cumulative.projectedRev * 100) / 100,
      potentialRevenue: Math.round(totalPotential * 100) / 100,
      bookedBedNights: cumulative.bookedBeds,
      totalBedNights,
      occupancyPercent: occ,
      realizationPercent: real,
    };
  }).sort((a, b) => b.projectedRevenue - a.projectedRevenue);

  // Room type summary
  const typeLabels: Record<string, string> = {
    dorm_mixed: 'Mixed Dormitory',
    dorm_female: 'Female Dormitory',
    private_suite: 'Private Ocean Suite',
    private_double: 'Private Double Room',
  };

  const roomTypeBreakdown: RoomTypePerformanceSummary[] = Array.from(roomTypeMap.entries()).map(([type, stats]) => {
    const occ = stats.availableBeds > 0 ? Math.round((stats.bookedBeds / stats.availableBeds) * 100) : 0;
    const real = stats.potentialRev > 0 ? Math.round((stats.projectedRev / stats.potentialRev) * 100) : 0;
    return {
      type,
      typeLabel: typeLabels[type] || type,
      projectedRevenue: Math.round(stats.projectedRev * 100) / 100,
      potentialRevenue: Math.round(stats.potentialRev * 100) / 100,
      bookedBedNights: stats.bookedBeds,
      availableBedNights: stats.availableBeds,
      occupancyPercent: occ,
      realizationPercent: real,
    };
  }).sort((a, b) => b.projectedRevenue - a.projectedRevenue);

  // Add-ons summary
  const addOnsBreakdown: AddOnProjectedSummary[] = addOns.map((a) => {
    const stats = addOnTotalsMap.get(a.id) || { revenue: 0, units: 0 };
    return {
      id: a.id,
      name: a.name,
      category: a.category,
      price: a.price,
      projectedRevenue: Math.round(stats.revenue * 100) / 100,
      estimatedUnits: Math.round(stats.units * 10) / 10,
    };
  }).filter((a) => a.projectedRevenue > 0).sort((a, b) => b.projectedRevenue - a.projectedRevenue);

  return {
    startDate: dailyProjections[0]?.date || formatLocalDateStr(today),
    endDate: dailyProjections[dailyProjections.length - 1]?.date || formatLocalDateStr(today),
    horizonDays: 30,
    totalProjectedRevenue: Math.round(totalProjectedRevenue * 100) / 100,
    totalAccommodationRevenue: Math.round(totalAccommodationRevenue * 100) / 100,
    totalAddOnsRevenue: Math.round(totalAddOnsRevenue * 100) / 100,
    totalPotentialMaxRevenue: Math.round(totalPotentialMaxRevenue * 100) / 100,
    totalUnsoldOpportunityGap: Math.round(totalUnsoldOpportunityGap * 100) / 100,
    realizationRate,
    totalAvailableBedNights,
    totalBookedBedNights,
    averageOccupancyPercent,
    projectedADR: Math.round(projectedADR * 100) / 100,
    projectedRevPAR: Math.round(projectedRevPAR * 100) / 100,
    totalCollectedRevenue: Math.round(totalCollectedRevenue * 100) / 100,
    totalBalanceDueOnArrival: Math.round(totalBalanceDueOnArrival * 100) / 100,
    unpaidPendingAtRiskRevenue: Math.round(unpaidPendingAtRiskRevenue * 100) / 100,
    roomPerformance,
    roomTypeBreakdown,
    addOnsBreakdown,
    dailyProjections,
  };
}
