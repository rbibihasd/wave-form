import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, Bed, Sparkles, Users, Calendar, 
  ArrowUpRight, ArrowDownRight, Layers, PieChart as PieIcon, 
  BarChart3, RefreshCw, Download, CheckCircle2, ChevronRight,
  Waves, ShieldCheck, Filter, Award, Compass, Eye
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine
} from 'recharts';
import { Booking, HostelSettings, Room, SurfAddOn, WaitlistEntry } from '../../types';

interface AnalyticsChartsProps {
  bookings: Booking[];
  rooms: Room[];
  addOns: SurfAddOn[];
  settings: HostelSettings;
  waitlist?: WaitlistEntry[];
  onSelectBookingTab?: () => void;
}

type TimeframeOption = 'upcoming_14' | 'month_30' | 'season_90' | 'all_time';
type ChartFocusMode = 'overview' | 'revenue' | 'occupancy' | 'surfers';

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  bookings,
  rooms,
  addOns,
  settings,
  waitlist = [],
  onSelectBookingTab,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('month_30');
  const [focusMode, setFocusMode] = useState<ChartFocusMode>('overview');
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [exportedToast, setExportedToast] = useState(false);

  const currency = settings.currencySymbol || '€';
  const brandColor = settings.primaryBrandColor || '#0d9488';

  // Total bed capacity across active rooms
  const totalBedCapacity = useMemo(() => {
    return rooms.filter(r => r.isActive).reduce((sum, r) => sum + r.capacity, 0);
  }, [rooms]);

  // Compute date range based on timeframe
  const { dateRange, dateLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: Date[] = [];

    let daysPast = 7;
    let daysFuture = 23;

    if (timeframe === 'upcoming_14') {
      daysPast = 2;
      daysFuture = 14;
    } else if (timeframe === 'month_30') {
      daysPast = 10;
      daysFuture = 20;
    } else if (timeframe === 'season_90') {
      daysPast = 30;
      daysFuture = 60;
    } else {
      daysPast = 45;
      daysFuture = 45;
    }

    for (let i = -daysPast; i <= daysFuture; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }

    return {
      dateRange: dates,
      dateLabels: dates.map(d => d.toISOString().split('T')[0]),
    };
  }, [timeframe]);

  // Day-by-Day Revenue & Occupancy Timeline Data for Recharts
  const timelineData = useMemo(() => {
    return dateLabels.map((dateStr) => {
      const dayDate = new Date(dateStr + 'T00:00:00');
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      // Find bookings active on this date
      const activeBookings = bookings.filter((b) => {
        if (b.status === 'cancelled') return false;
        return dateStr >= b.checkInDate && dateStr < b.checkOutDate;
      });

      // Calculate beds occupied
      const occupiedBeds = activeBookings.reduce((sum, b) => sum + b.guestsCount, 0);
      const occupancyRate = totalBedCapacity > 0 
        ? Math.min(100, Math.round((occupiedBeds / totalBedCapacity) * 100)) 
        : 0;

      // Calculate apportioned daily revenue (room revenue / nights + addons / nights)
      let roomRevenueDaily = 0;
      let addOnsRevenueDaily = 0;

      activeBookings.forEach((b) => {
        const nights = Math.max(1, b.nights || 1);
        roomRevenueDaily += (b.roomSubtotal || 0) / nights;
        addOnsRevenueDaily += (b.addOnsSubtotal || 0) / nights;
      });

      // Format clean display date: e.g. "Sep 18"
      const label = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        date: dateStr,
        label,
        dayOfWeek,
        isToday,
        roomRevenue: Math.round(roomRevenueDaily),
        addOnsRevenue: Math.round(addOnsRevenueDaily),
        totalRevenue: Math.round(roomRevenueDaily + addOnsRevenueDaily),
        occupiedBeds,
        totalCapacity: totalBedCapacity,
        occupancyRate,
      };
    });
  }, [dateLabels, bookings, totalBedCapacity]);

  // Room by Room Performance Metrics
  const roomPerformanceData = useMemo(() => {
    return rooms.map((room) => {
      const roomBookings = bookings.filter(b => b.roomId === room.id && b.status !== 'cancelled');
      const totalRevenue = roomBookings.reduce((sum, b) => sum + (b.roomSubtotal || 0), 0);
      const totalNights = roomBookings.reduce((sum, b) => sum + (b.nights || 0), 0);
      const totalGuests = roomBookings.reduce((sum, b) => sum + (b.guestsCount || 0), 0);
      
      const occupancyScore = room.capacity > 0 
        ? Math.min(100, Math.round((totalGuests / (room.capacity * 10)) * 100))
        : 0;

      return {
        name: room.name.replace(/^(The\s+)/, '').slice(0, 18),
        fullName: room.name,
        type: room.typeLabel || room.type,
        capacity: room.capacity,
        revenue: Math.round(totalRevenue),
        nights: totalNights,
        bookingsCount: roomBookings.length,
        occupancyScore,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [rooms, bookings]);

  // Surfer Skill Level Breakdown
  const surferSkillData = useMemo(() => {
    const counts: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      non_surfer: 0,
    };

    bookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      const level = b.guest?.surfLevel || 'intermediate';
      counts[level] = (counts[level] || 0) + (b.guestsCount || 1);
    });

    const colors: Record<string, string> = {
      beginner: '#0d9488', // Teal
      intermediate: '#0284c7', // Sky Blue
      advanced: '#6366f1', // Indigo
      non_surfer: '#f59e0b', // Amber
    };

    const labels: Record<string, string> = {
      beginner: 'Beginner (Whitewater)',
      intermediate: 'Intermediate (Lineup)',
      advanced: 'Advanced (Reef & Point)',
      non_surfer: 'Non-Surfer (Chill & Sun)',
    };

    return Object.keys(counts).map((key) => ({
      name: labels[key] || key,
      key,
      value: counts[key],
      color: colors[key] || '#94a3b8',
    })).filter(item => item.value > 0);
  }, [bookings]);

  // Top Surf Add-ons Breakdown
  const addOnsPerformanceData = useMemo(() => {
    const addOnMap = new Map<string, { name: string; category: string; count: number; revenue: number }>();

    addOns.forEach((addon) => {
      addOnMap.set(addon.id, {
        name: addon.name,
        category: addon.category,
        count: 0,
        revenue: 0,
      });
    });

    bookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      b.addOns?.forEach((item) => {
        const existing = addOnMap.get(item.addOnId);
        const addonDef = addOns.find(a => a.id === item.addOnId);
        if (existing && addonDef) {
          const qty = item.quantity || 1;
          const days = item.days || 1;
          const totalUnits = addonDef.billingType === 'per_day' ? qty * days : qty;
          const rev = totalUnits * addonDef.price;
          existing.count += totalUnits;
          existing.revenue += rev;
        }
      });
    });

    return Array.from(addOnMap.values())
      .filter(a => a.count > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [addOns, bookings]);

  // Payment Status Distribution
  const paymentStatusData = useMemo(() => {
    const statuses: Record<string, { label: string; count: number; amount: number; color: string }> = {
      paid: { label: 'Paid in Full', count: 0, amount: 0, color: '#10b981' },
      deposit: { label: 'Deposit Paid', count: 0, amount: 0, color: '#0ea5e9' },
      pending: { label: 'Payment Pending', count: 0, amount: 0, color: '#f59e0b' },
      unpaid: { label: 'Unpaid / Arrival', count: 0, amount: 0, color: '#f43f5e' },
    };

    bookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      const status = b.paymentStatus || 'pending';
      if (statuses[status]) {
        statuses[status].count += 1;
        statuses[status].amount += (b.totalAmount || 0);
      }
    });

    return Object.values(statuses).filter(s => s.count > 0);
  }, [bookings]);

  // Aggregate Key Performance Indicators
  const kpis = useMemo(() => {
    const validBookings = bookings.filter(b => b.status !== 'cancelled');
    const totalRev = validBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const roomRev = validBookings.reduce((sum, b) => sum + (b.roomSubtotal || 0), 0);
    const surfRev = validBookings.reduce((sum, b) => sum + (b.addOnsSubtotal || 0), 0);

    const totalNights = validBookings.reduce((sum, b) => sum + (b.nights || 0), 0);
    const totalGuests = validBookings.reduce((sum, b) => sum + (b.guestsCount || 0), 0);

    // Average Length of Stay (ALOS)
    const alos = validBookings.length > 0 ? (totalNights / validBookings.length).toFixed(1) : '0';

    // Average Daily Rate (ADR)
    const adr = totalNights > 0 ? (roomRev / totalNights).toFixed(1) : '0';

    // Add-on Attachment Rate (% of bookings that have surf or extra add-ons)
    const withAddons = validBookings.filter(b => b.addOns && b.addOns.length > 0).length;
    const attachRate = validBookings.length > 0 
      ? Math.round((withAddons / validBookings.length) * 100) 
      : 0;

    // Average booking value
    const abv = validBookings.length > 0 ? (totalRev / validBookings.length).toFixed(0) : '0';

    return {
      totalRev,
      roomRev,
      surfRev,
      alos,
      adr,
      attachRate,
      abv,
      totalNights,
      totalGuests,
      validBookingsCount: validBookings.length,
    };
  }, [bookings]);

  // Handle Export CSV
  const handleExportSummary = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Hostel', settings.name],
      ['Generated At', new Date().toLocaleString()],
      ['Gross Revenue', `${currency}${kpis.totalRev.toFixed(2)}`],
      ['Accommodation Revenue', `${currency}${kpis.roomRev.toFixed(2)}`],
      ['Surf Experiences & Extras', `${currency}${kpis.surfRev.toFixed(2)}`],
      ['Surf Add-on Attach Rate', `${kpis.attachRate}%`],
      ['Average Length of Stay (Nights)', kpis.alos],
      ['Average Daily Rate', `${currency}${kpis.adr}`],
      ['Total Active Rooms', rooms.length.toString()],
      ['Total Bed Capacity', totalBedCapacity.toString()],
      ['Total Confirmed Bookings', kpis.validBookingsCount.toString()],
      ['Standby Waitlist Count', waitlist.length.toString()],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wavehaven_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedToast(true);
    setTimeout(() => setExportedToast(false), 3000);
  };

  // Custom Recharts Tooltip with pristine dark card styling
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs min-w-[210px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">{label} ({data.dayOfWeek})</span>
            {data.isToday && (
              <span className="text-[10px] bg-teal-500/20 text-teal-300 font-extrabold px-2 py-0.5 rounded-full border border-teal-500/40">
                Today
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
                Room Stays:
              </span>
              <span className="font-mono font-bold text-slate-100">{currency}{data.roomRevenue}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                Surf & Extras:
              </span>
              <span className="font-mono font-bold text-slate-100">{currency}{data.addOnsRevenue}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-1.5 font-bold">
              <span className="text-slate-300">Total Projected:</span>
              <span className="font-mono text-teal-300">{currency}{data.totalRevenue}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/60 pt-1 text-[11px]">
              <span className="text-slate-400">Bed Occupancy:</span>
              <span className="font-bold text-amber-300">{data.occupiedBeds} / {data.totalCapacity} ({data.occupancyRate}%)</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Interactive Filter Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Operations & Financial Analytics
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Live Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Visual booking velocity, occupancy trajectory, surf experience monetization, and guest skill patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Range Switches */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            {[
              { id: 'upcoming_14', label: '14 Days' },
              { id: 'month_30', label: '30 Days' },
              { id: 'season_90', label: 'Quarter' },
              { id: 'all_time', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id as TimeframeOption)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === t.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export Summary Button */}
          <button
            type="button"
            onClick={handleExportSummary}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
            title="Download CSV report of hostel analytics"
          >
            {exportedToast ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Gross Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Portfolio Rev
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
              {currency}{kpis.totalRev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +16%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Rooms: {currency}{Math.round(kpis.roomRev)}</span>
            <span className="text-teal-700 font-semibold">Surf: {currency}{Math.round(kpis.surfRev)}</span>
          </div>
        </div>

        {/* Surf Experience Attach Rate */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Surf Attach Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Waves className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
              {kpis.attachRate}%
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> High
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Lessons & Rentals</span>
            <span className="text-cyan-700 font-semibold">{currency}{Math.round(kpis.surfRev)} total</span>
          </div>
        </div>

        {/* Average Daily Rate & ALOS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ADR & Stay Length
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
              {currency}{kpis.adr}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ night</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Avg Stay (ALOS):</span>
            <span className="font-bold text-indigo-700">{kpis.alos} nights</span>
          </div>
        </div>

        {/* Avg Booking Value (ABV) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Avg Booking Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
              {currency}{kpis.abv}
            </span>
            <span className="text-xs font-semibold text-slate-400">per guest</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Standby Waitlist:</span>
            <span className="font-bold text-amber-700">{waitlist.length} in queue</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart 1: Revenue Velocity & Stream Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-heading font-extrabold text-slate-900">
                Revenue Trajectory & Stream Breakdown
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Area Projection
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Daily revenue pacing contrasting accommodation bed sales against high-margin surf add-ons.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-teal-600 inline-block" />
              <span className="text-slate-700">Room Stays</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-cyan-400 inline-block" />
              <span className="text-slate-700">Surf Add-ons</span>
            </div>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRoom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorAddons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                tickLine={false} 
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={Math.max(1, Math.floor(timelineData.length / 8))}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `${currency}${val}`}
              />
              <Tooltip content={<CustomTimelineTooltip />} />
              <Area 
                type="monotone" 
                dataKey="roomRevenue" 
                name="Room Stays"
                stackId="1" 
                stroke="#0d9488" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRoom)" 
              />
              <Area 
                type="monotone" 
                dataKey="addOnsRevenue" 
                name="Surf Add-ons"
                stackId="1" 
                stroke="#06b6d4" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAddons)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Occupancy Pace & Room Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Bed Occupancy Velocity (%) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-heading font-extrabold text-slate-900">
                Bed Occupancy Rate (%)
              </h3>
              <p className="text-xs text-slate-500">
                Percentage of active beds occupied vs. 85% optimal operating target.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
              Capacity: {totalBedCapacity} Beds
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  interval={Math.max(1, Math.floor(timelineData.length / 6))}
                />
                <YAxis 
                  domain={[0, 100]}
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  formatter={(val: any) => [`${val}% Occupied`, 'Occupancy']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <ReferenceLine y={85} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target 85%', fill: '#10b981', fontSize: 10, position: 'right' }} />
                <Area 
                  type="monotone" 
                  dataKey="occupancyRate" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorOccupancy)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Room-by-Room Yield & Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-heading font-extrabold text-slate-900">
                Room Revenue Yield
              </h3>
              <p className="text-xs text-slate-500">
                Gross accommodation sales ranked by room and dorm unit.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {roomPerformanceData.length} Units
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomPerformanceData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${currency}${val}`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                  width={110}
                />
                <Tooltip 
                  formatter={(val: any) => [`${currency}${val}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#0d9488" radius={[0, 8, 8, 0]}>
                  {roomPerformanceData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#0d9488' : index === 1 ? '#0284c7' : '#6366f1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Surfer Demographics & Top Add-ons Monetization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 4: Surfer Skill Distribution (Donut Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-heading font-extrabold text-slate-900">
              Surfer Skill Levels
            </h3>
            <p className="text-xs text-slate-500">
              Guest surf proficiency profile for coaching & board assignments.
            </p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={surferSkillData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                >
                  {surferSkillData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any) => [`${val} Guests`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label in Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-heading font-black text-slate-900">
                {kpis.totalGuests}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Surfers
              </span>
            </div>
          </div>

          {/* Custom Clean Legend */}
          <div className="space-y-1.5 pt-1">
            {surferSkillData.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value} ({Math.round((item.value / (kpis.totalGuests || 1)) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 5: Top Surf Add-ons Monetization */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-heading font-extrabold text-slate-900">
                Top Surf Add-on Experiences
              </h3>
              <p className="text-xs text-slate-500">
                Revenue generated from coaching, quiver rentals, wellness, and shuttles.
              </p>
            </div>
            <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-xl border border-cyan-200">
              Total Add-on Rev: {currency}{Math.round(kpis.surfRev)}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={addOnsPerformanceData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#475569', fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${currency}${val}`}
                />
                <Tooltip 
                  formatter={(val: any) => [`${currency}${val}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                  {addOnsPerformanceData.map((_, index) => (
                    <Cell 
                      key={`addon-${index}`} 
                      fill={index === 0 ? '#0d9488' : index === 1 ? '#06b6d4' : '#8b5cf6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Add-ons Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            {addOnsPerformanceData.slice(0, 3).map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] text-slate-500 font-semibold truncate">{item.name}</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{currency}{item.revenue} ({item.count} booked)</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Health & Payment Status Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-heading font-extrabold text-slate-900">
              Payment Pipeline & Receivables
            </h3>
            <p className="text-xs text-slate-500">
              Confirmed settlement vs. pending balance due upon arrival.
            </p>
          </div>

          {onSelectBookingTab && (
            <button
              type="button"
              onClick={onSelectBookingTab}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Manage in Bookings List</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {paymentStatusData.map((status) => (
            <div 
              key={status.label}
              className="p-4 rounded-2xl border transition-all"
              style={{
                borderColor: `${status.color}40`,
                backgroundColor: `${status.color}08`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{status.label}</span>
                <span 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
              </div>
              <div className="mt-2 text-xl font-heading font-black text-slate-900">
                {currency}{status.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {status.count} {status.count === 1 ? 'reservation' : 'reservations'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
