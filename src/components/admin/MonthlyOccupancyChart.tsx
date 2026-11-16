import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ReferenceLine, Cell 
} from 'recharts';
import { 
  TrendingUp, Calendar, Bed, Sparkles, ChevronRight, 
  Award, ArrowUpRight, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Booking, HostelSettings, Room, AdminTab } from '../../types';

interface MonthlyOccupancyChartProps {
  bookings: Booking[];
  rooms: Room[];
  settings: HostelSettings;
  onNavigateToTab?: (tab: AdminTab) => void;
}

type RangeOption = '6_months' | '12_months' | 'calendar_year';

export const MonthlyOccupancyChart: React.FC<MonthlyOccupancyChartProps> = ({
  bookings,
  rooms,
  settings,
  onNavigateToTab,
}) => {
  const [rangeOption, setRangeOption] = useState<RangeOption>('12_months');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [targetOccupancy] = useState<number>(75);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Total daily bed capacity across active rooms
  const totalBedCapacity = useMemo(() => {
    return rooms.filter((r) => r.isActive).reduce((sum, r) => sum + r.capacity, 0);
  }, [rooms]);

  // Compute monthly occupancy data
  const monthlyData = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    let monthsToDisplay: { year: number; month: number }[] = [];

    if (rangeOption === '6_months') {
      // Past 2 months, current month, next 3 months
      for (let offset = -2; offset <= 3; offset++) {
        const d = new Date(currentYear, currentMonth + offset, 1);
        monthsToDisplay.push({ year: d.getFullYear(), month: d.getMonth() });
      }
    } else if (rangeOption === '12_months') {
      // Rolling 12 months: past 3 months, current, next 8 months
      for (let offset = -3; offset <= 8; offset++) {
        const d = new Date(currentYear, currentMonth + offset, 1);
        monthsToDisplay.push({ year: d.getFullYear(), month: d.getMonth() });
      }
    } else {
      // Full calendar year (Jan - Dec)
      for (let m = 0; m < 12; m++) {
        monthsToDisplay.push({ year: currentYear, month: m });
      }
    }

    const activeBookings = bookings.filter((b) => b.status !== 'cancelled');

    return monthsToDisplay.map(({ year, month }) => {
      const monthStart = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthEnd = new Date(year, month, daysInMonth);

      const isCurrentMonth = year === currentYear && month === currentMonth;
      const isPastMonth = year < currentYear || (year === currentYear && month < currentMonth);
      const isFutureMonth = year > currentYear || (year === currentYear && month > currentMonth);

      const monthName = monthStart.toLocaleDateString('en-US', { month: 'long' });
      const shortName = monthStart.toLocaleDateString('en-US', { month: 'short' });
      const yearShort = `'${String(year).slice(2)}`;
      const displayLabel = rangeOption === 'calendar_year' ? shortName : `${shortName} ${yearShort}`;
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

      // Total available bed nights in this month
      const availableBedNights = totalBedCapacity * daysInMonth;

      // Calculate occupied bed-nights on each day of this month
      let occupiedBedNights = 0;
      let monthRevenue = 0;
      const bookingsInMonth = new Set<string>();

      for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(year, month, d);
        const dayStr = dayDate.toISOString().split('T')[0];

        // Find bookings active on this date
        activeBookings.forEach((b) => {
          if (dayStr >= b.checkInDate && dayStr < b.checkOutDate) {
            occupiedBedNights += b.guestsCount;
            bookingsInMonth.add(b.id);
            // Apportion daily revenue for accuracy
            const nights = Math.max(1, b.nights || 1);
            monthRevenue += (b.totalAmount || 0) / nights;
          }
        });
      }

      // Calculate occupancy percentage capped at 100%
      const occupancyPercentage = availableBedNights > 0 
        ? Math.min(100, Math.round((occupiedBedNights / availableBedNights) * 100))
        : 0;

      // Status tier
      let tier: 'high' | 'moderate' | 'low' = 'low';
      if (occupancyPercentage >= targetOccupancy) {
        tier = 'high';
      } else if (occupancyPercentage >= 40) {
        tier = 'moderate';
      }

      return {
        monthKey,
        monthName,
        shortName,
        year,
        displayLabel,
        daysInMonth,
        availableBedNights,
        occupiedBedNights,
        occupancyPercentage,
        bookingsCount: bookingsInMonth.size,
        revenue: Math.round(monthRevenue),
        isCurrentMonth,
        isPastMonth,
        isFutureMonth,
        tier,
      };
    });
  }, [bookings, totalBedCapacity, rangeOption, targetOccupancy]);

  // Aggregate stats across displayed months
  const stats = useMemo(() => {
    if (monthlyData.length === 0) {
      return {
        avgOccupancy: 0,
        peakMonth: null,
        totalSoldBedNights: 0,
        currentMonthRate: 0,
      };
    }

    const totalOccupancySum = monthlyData.reduce((sum, m) => sum + m.occupancyPercentage, 0);
    const avgOccupancy = Math.round(totalOccupancySum / monthlyData.length);
    const totalSoldBedNights = monthlyData.reduce((sum, m) => sum + m.occupiedBedNights, 0);

    const peakMonth = [...monthlyData].sort((a, b) => b.occupancyPercentage - a.occupancyPercentage)[0];
    const currentMonth = monthlyData.find((m) => m.isCurrentMonth);

    return {
      avgOccupancy,
      peakMonth,
      totalSoldBedNights,
      currentMonthRate: currentMonth ? currentMonth.occupancyPercentage : 0,
    };
  }, [monthlyData]);

  // Custom Recharts Tooltip
  const CustomOccupancyTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl border border-slate-700/80 text-xs min-w-[220px] pointer-events-none">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div>
            <p className="font-extrabold text-sm text-slate-100">
              {data.monthName} {data.year}
            </p>
            <p className="text-[10px] text-slate-400">
              {data.daysInMonth} days • {data.availableBedNights} total bed-nights
            </p>
          </div>
          {data.isCurrentMonth && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/40">
              Current
            </span>
          )}
        </div>

        <div className="space-y-2">
          {/* Occupancy Rate */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Occupancy Rate:</span>
            <span className="text-base font-black text-teal-300">
              {data.occupancyPercentage}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                data.occupancyPercentage >= targetOccupancy
                  ? 'bg-emerald-400'
                  : data.occupancyPercentage >= 40
                  ? 'bg-teal-400'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, data.occupancyPercentage)}%` }}
            />
          </div>

          {/* Sold vs Capacity */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Bed-Nights Sold:</span>
            <span className="font-bold text-slate-200">
              {data.occupiedBedNights} / {data.availableBedNights}
            </span>
          </div>

          {/* Bookings count */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Active Bookings:</span>
            <span className="font-bold text-slate-200">
              {data.bookingsCount} reservation{data.bookingsCount === 1 ? '' : 's'}
            </span>
          </div>

          {/* Revenue */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Prorated Revenue:</span>
            <span className="font-bold text-emerald-400">
              {settings.currencySymbol || '€'}{data.revenue.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800 text-center">
          Click bar to view 30-Day Grid
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 tracking-tight">
                Monthly Occupancy Percentage Summary
              </h2>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Recharts Live
              </span>
              {stats.currentMonthRate > 0 && (
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  This Month: <span className="text-teal-700 font-extrabold">{stats.currentMonthRate}%</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hostel capacity utilization and bed-night occupancy trends across rolling months.
            </p>
          </div>
        </div>

        {/* Action Controls & Range Selector */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Range Pills */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setRangeOption('6_months')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                rangeOption === '6_months'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setRangeOption('12_months')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                rangeOption === '12_months'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              12 Months
            </button>
            <button
              type="button"
              onClick={() => setRangeOption('calendar_year')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                rangeOption === 'calendar_year'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Year View
            </button>
          </div>

          {/* Navigate to Monthly Grid button */}
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('monthlyGrid')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <span>30-Day Grid</span>
              <ChevronRight className="w-3.5 h-3.5 text-teal-400" />
            </button>
          )}

          {/* Toggle Minimize/Expand */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand chart' : 'Collapse chart'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Quick KPI Stat Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Average Occupancy */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Period Average
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-heading font-black text-slate-900">
                  {stats.avgOccupancy}%
                </span>
                <span className="text-[11px] font-semibold text-slate-400">occupancy</span>
              </div>
            </div>

            {/* Peak Month */}
            <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 block flex items-center gap-1">
                <Award className="w-3 h-3 text-teal-600" />
                Peak Month
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-heading font-black text-teal-950">
                  {stats.peakMonth ? `${stats.peakMonth.occupancyPercentage}%` : '—'}
                </span>
                <span className="text-[11px] font-bold text-teal-700 truncate">
                  {stats.peakMonth ? `${stats.peakMonth.shortName} '${String(stats.peakMonth.year).slice(2)}` : ''}
                </span>
              </div>
            </div>

            {/* Bed-Nights Sold */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center gap-1">
                <Bed className="w-3 h-3 text-slate-400" />
                Bed-Nights Sold
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-heading font-black text-slate-900">
                  {stats.totalSoldBedNights}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">guest nights</span>
              </div>
            </div>

            {/* Target Benchmark */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Target Benchmark
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-heading font-black text-emerald-700">
                  {targetOccupancy}%
                </span>
                <span className="text-[11px] font-semibold text-slate-400">goal</span>
              </div>
            </div>
          </div>

          {/* Recharts Bar Chart Area */}
          <div className="w-full h-64 sm:h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length && onNavigateToTab) {
                    onNavigateToTab('monthlyGrid');
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="displayLabel"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  interval={0}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(val) => `${val}%`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip content={<CustomOccupancyTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.8 }} />
                <ReferenceLine
                  y={targetOccupancy}
                  stroke="#0d9488"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Goal: ${targetOccupancy}%`,
                    fill: '#0d9488',
                    fontSize: 10,
                    fontWeight: 700,
                    position: 'right',
                  }}
                />
                <Bar
                  dataKey="occupancyPercentage"
                  name="Occupancy %"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                  onMouseEnter={(d: any) => setHoveredMonth(d.monthKey)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {monthlyData.map((entry) => {
                    // Distinct color palette based on performance and current month status
                    let fillColor = '#0ea5e9'; // default cyan
                    if (entry.isCurrentMonth) {
                      fillColor = '#0d9488'; // primary brand teal for current month
                    } else if (entry.occupancyPercentage >= targetOccupancy) {
                      fillColor = '#10b981'; // high occupancy emerald
                    } else if (entry.occupancyPercentage >= 40) {
                      fillColor = '#14b8a6'; // medium teal
                    } else {
                      fillColor = '#94a3b8'; // lower/future off-peak slate
                    }

                    return (
                      <Cell
                        key={`cell-${entry.monthKey}`}
                        fill={fillColor}
                        opacity={hoveredMonth === null || hoveredMonth === entry.monthKey ? 1 : 0.65}
                        stroke={entry.isCurrentMonth ? '#042f2e' : 'none'}
                        strokeWidth={entry.isCurrentMonth ? 1.5 : 0}
                        className="cursor-pointer transition-all"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend & Explanation Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#0d9488] inline-block border border-teal-900/30" />
                <span className="font-semibold text-slate-700">Current Month</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#10b981] inline-block" />
                <span className="text-slate-600">High Demand (≥{targetOccupancy}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#14b8a6] inline-block" />
                <span className="text-slate-600">Moderate (40–74%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#94a3b8] inline-block" />
                <span className="text-slate-600">Off-Peak / Future (&lt;40%)</span>
              </div>
            </div>

            <span className="text-[11px] text-slate-400">
              Based on {totalBedCapacity} total hostel bed spaces across {rooms.filter((r) => r.isActive).length} active dorms and private suites
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
