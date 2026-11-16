export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn + 'T00:00:00').getTime();
  const end = new Date(checkOut + 'T00:00:00').getTime();
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowString(): string {
  return addDaysToString(getTodayString(), 1);
}

export function addDaysToString(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysDifferenceFromToday(dateStr: string): number {
  if (!dateStr) return 999;
  const today = new Date(getTodayString() + 'T00:00:00').getTime();
  const target = new Date(dateStr + 'T00:00:00').getTime();
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export function getStayUrgencyBadge(checkInDate: string): {
  label: string;
  color: 'urgent' | 'warning' | 'info' | 'past';
  days: number;
} {
  const days = getDaysDifferenceFromToday(checkInDate);
  if (days < 0) {
    return { label: 'Ongoing or Past', color: 'past', days };
  } else if (days === 0) {
    return { label: 'Arriving Today!', color: 'urgent', days };
  } else if (days === 1) {
    return { label: 'Arriving Tomorrow', color: 'urgent', days };
  } else if (days <= 3) {
    return { label: `In ${days} days`, color: 'warning', days };
  } else if (days <= 7) {
    return { label: `This week (${days}d)`, color: 'info', days };
  } else {
    return { label: `In ${days} days`, color: 'info', days };
  }
}

export function doDatesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  // Overlap condition: startA < endB && endA > startB
  return startA < endB && endA > startB;
}

export interface DateParts {
  dayNum: number;
  dayString: string;
  weekdayShort: string;
  weekdayLong: string;
  monthShort: string;
  monthLong: string;
  monthIndex: number; // 0-11
  year: number;
  formattedDisplay: string;
}

export function getDateParts(dateStr: string): DateParts {
  if (!dateStr) {
    const now = new Date();
    return {
      dayNum: now.getDate(),
      dayString: String(now.getDate()).padStart(2, '0'),
      weekdayShort: now.toLocaleDateString('en-US', { weekday: 'short' }),
      weekdayLong: now.toLocaleDateString('en-US', { weekday: 'long' }),
      monthShort: now.toLocaleDateString('en-US', { month: 'short' }),
      monthLong: now.toLocaleDateString('en-US', { month: 'long' }),
      monthIndex: now.getMonth(),
      year: now.getFullYear(),
      formattedDisplay: '',
    };
  }

  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) {
    return {
      dayNum: 1,
      dayString: '01',
      weekdayShort: 'Mon',
      weekdayLong: 'Monday',
      monthShort: 'Jan',
      monthLong: 'January',
      monthIndex: 0,
      year: 2026,
      formattedDisplay: dateStr,
    };
  }

  return {
    dayNum: d.getDate(),
    dayString: String(d.getDate()).padStart(2, '0'),
    weekdayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
    weekdayLong: d.toLocaleDateString('en-US', { weekday: 'long' }),
    monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
    monthLong: d.toLocaleDateString('en-US', { month: 'long' }),
    monthIndex: d.getMonth(),
    year: d.getFullYear(),
    formattedDisplay: formatDisplayDate(dateStr),
  };
}

export function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
