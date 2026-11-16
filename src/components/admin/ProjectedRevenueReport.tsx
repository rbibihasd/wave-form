import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, Calendar, Bed, Sparkles, 
  ArrowUpRight, ArrowDownRight, Layers, Sliders, 
  Download, Filter, ChevronDown, ChevronUp, AlertCircle, 
  CheckCircle2, Users, Waves, ShieldCheck, HelpCircle, 
  RefreshCw, Info, ArrowRight, Eye, Sun
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  ComposedChart, Line
} from 'recharts';
import { Booking, HostelSettings, Room, SurfAddOn, AdminTab } from '../../types';
import { 
  calculate30DayProjectedRevenue, 
  ProjectedRevenueSummary, 
  DailyRevenueProjection 
} from '../../utils/projectedRevenue';

interface ProjectedRevenueReportProps {
  bookings: Booking[];
  rooms: Room[];
  addOns: SurfAddOn[];
  settings: HostelSettings;
  onNavigateToTab?: (tab: AdminTab) => void;
}

type ChartViewType = 'trajectory' | 'rooms' | 'composition' | 'cashflow';
type TableFilterType = 'all' | 'weekends' | 'high_occupancy' | 'low_occupancy';

export const ProjectedRevenueReport: React.FC<ProjectedRevenueReportProps> = ({
  bookings,
  rooms,
  addOns,
  settings,
  onNavigateToTab,
}) => {
  // Scenario simulation states
  const [rateMultiplier, setRateMultiplier] = useState<number>(1.0); // 1.0 = current rates
  const [occupancyBoost, setOccupancyBoost] = useState<number>(0); // 0 to 50%
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [chartView, setChartView] = useState<ChartViewType>('trajectory');
  const [tableFilter, setTableFilter] = useState<TableFilterType>('all');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const currency = settings.currencySymbol || '€';
  const brandColor = settings.primaryBrandColor || '#0d9488';

  // Base projection (actual current bookings and rates)
  const baseProjection: ProjectedRevenueSummary = useMemo(() => {
    return calculate30DayProjectedRevenue(bookings, rooms, addOns, settings, 1.0, 0);
  }, [bookings, rooms, addOns, settings]);

  // Simulated projection (if user adjusts rate multiplier or occupancy boost)
  const projection: ProjectedRevenueSummary = useMemo(() => {
    return calculate30DayProjectedRevenue(bookings, rooms, addOns, settings, rateMultiplier, occupancyBoost);
  }, [bookings, rooms, addOns, settings, rateMultiplier, occupancyBoost]);

  const simulatedDelta = projection.totalProjectedRevenue - baseProjection.totalProjectedRevenue;
  const simulatedPercent = baseProjection.totalProjectedRevenue > 0 
    ? ((simulatedDelta / baseProjection.totalProjectedRevenue) * 100).toFixed(1) 
    : '0';

  // Filtered daily list for the table
  const filteredDays = useMemo(() => {
    return projection.dailyProjections.filter((d) => {
      if (tableFilter === 'weekends') return d.isWeekend;
      if (tableFilter === 'high_occupancy') return d.occupancyPercent >= 70;
      if (tableFilter === 'low_occupancy') return d.occupancyPercent < 50;
      return true;
    });
  }, [projection.dailyProjections, tableFilter]);

  // Export 30-Day Projection CSV
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = [
        'Date',
        'Day',
        'Is Weekend',
        'Booked Rooms/Accommodation Revenue',
        'Surf Add-ons Revenue',
        'Total Projected Revenue',
        'Max Potential Rack Revenue',
        'Unsold Revenue Gap',
        'Booked Beds',
        'Total Available Beds',
        'Occupancy %',
        'ADR',
        'RevPAR',
        'Cash Collected (Est)',
        'Balance Due on Check-in (Est)',
        'Active Bookings Count'
      ];

      const rows = projection.dailyProjections.map((d) => [
        d.date,
        d.dayOfWeek,
        d.isWeekend ? 'Yes' : 'No',
        d.bookedAccommodationRevenue.toFixed(2),
        d.bookedAddOnsRevenue.toFixed(2),
        d.bookedTotalRevenue.toFixed(2),
        d.potentialMaxCapacityRevenue.toFixed(2),
        d.unsoldPotentialRevenue.toFixed(2),
        d.bookedBeds,
        d.totalAvailableBeds,
        `${d.occupancyPercent}%`,
        d.adr.toFixed(2),
        d.revPar.toFixed(2),
        d.estimatedCashCollected.toFixed(2),
        d.estimatedBalanceDueAtCheckIn.toFixed(2),
        d.confirmedBookingsCount,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + 
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `WaveHaven_30Day_Revenue_Projection_${projection.startDate}_to_${projection.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
                30-Day Projected Revenue Report
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                <Calendar className="w-3 h-3" />
                {projection.startDate} → {projection.endDate}
              </span>
              {rateMultiplier !== 1.0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                  Rate Simulation: {rateMultiplier > 1 ? `+${Math.round((rateMultiplier - 1) * 100)}%` : `${Math.round((rateMultiplier - 1) * 100)}%`}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Forward-looking 30-day forecast calculating confirmed booking income, active room rack rates, and potential unsold capacity.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer ${
                isSimulatorOpen || rateMultiplier !== 1.0 || occupancyBoost > 0
                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>What-If Simulator</span>
              {(rateMultiplier !== 1.0 || occupancyBoost > 0) && (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>{isExporting ? 'Exporting...' : 'Export 30-Day CSV'}</span>
            </button>
          </div>
        </div>

        {/* What-If Pricing & Occupancy Scenario Modeler Drawer */}
        {isSimulatorOpen && (
          <div className="mt-5 pt-5 border-t border-slate-100 bg-amber-50/60 -mx-5 -mb-5 p-5 rounded-b-3xl space-y-4 animate-in slide-in-from-top-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                  Scenario Modeler: Rate & Occupancy Sensitivity
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Impact on 30-day revenue:</span>
                <span className={`font-extrabold px-2 py-0.5 rounded-lg ${
                  simulatedDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {simulatedDelta >= 0 ? '+' : ''}{currency}{Math.round(simulatedDelta).toLocaleString()} ({simulatedPercent}%)
                </span>
                {(rateMultiplier !== 1.0 || occupancyBoost > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setRateMultiplier(1.0);
                      setOccupancyBoost(0);
                    }}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 underline ml-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rate Multiplier Slider */}
              <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Room Nightly Rates Adjustment:</span>
                  <span className="font-mono font-extrabold text-amber-700 text-sm">
                    {rateMultiplier === 1.0 ? 'Current Base Rates (100%)' : `${Math.round(rateMultiplier * 100)}% (${rateMultiplier > 1 ? '+' : ''}${Math.round((rateMultiplier - 1) * 100)}%)`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.30"
                  step="0.05"
                  value={rateMultiplier}
                  onChange={(e) => setRateMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>-20% Off</span>
                  <span>-10%</span>
                  <span className="font-bold text-slate-700">Current</span>
                  <span>+10%</span>
                  <span>+20%</span>
                  <span>+30% Peak</span>
                </div>
              </div>

              {/* Occupancy Boost Slider */}
              <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Simulate Unsold Beds Filled:</span>
                  <span className="font-mono font-extrabold text-amber-700 text-sm">
                    {occupancyBoost === 0 ? 'Only Existing Bookings (0% Boost)' : `+${occupancyBoost}% Unsold Beds Booked`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={occupancyBoost}
                  onChange={(e) => setOccupancyBoost(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>No Boost</span>
                  <span>+10% Beds</span>
                  <span>+25% Mid-Season</span>
                  <span>+50% High-Season</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total 30-Day Projected Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              30-Day Projected Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
              {currency}{Math.round(projection.totalProjectedRevenue).toLocaleString()}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Rooms / Accommodation:</span>
              <strong className="text-slate-800 font-mono">{currency}{Math.round(projection.totalAccommodationRevenue).toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span>Surf & Wellness Add-ons:</span>
              <strong className="text-teal-700 font-mono">+{currency}{Math.round(projection.totalAddOnsRevenue).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Metric 2: Potential Maximum Capacity (100% Rack Rate) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              100% Capacity Rack Potential
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
              {currency}{Math.round(projection.totalPotentialMaxRevenue).toLocaleString()}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Realization Rate:</span>
              <strong className="text-emerald-700 font-mono">{projection.realizationRate}%</strong>
            </div>
            <div className="flex justify-between">
              <span>Unsold Opportunity Gap:</span>
              <strong className="text-amber-700 font-mono">{currency}{Math.round(projection.totalUnsoldOpportunityGap).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Metric 3: Average Occupancy & Yield */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Forecasted Occupancy & ADR
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
              {projection.averageOccupancyPercent}%
            </p>
            <span className="text-xs text-slate-400 font-normal">
              avg occupancy
            </span>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Projected ADR (Bed/Night):</span>
              <strong className="text-slate-800 font-mono">{currency}{projection.projectedADR.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Projected RevPAR:</span>
              <strong className="text-cyan-700 font-mono">{currency}{projection.projectedRevPAR.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Metric 4: Front Desk Collections & Cash Flow */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Front Desk Cash Flow
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-heading font-black text-indigo-950">
              {currency}{Math.round(projection.totalBalanceDueOnArrival).toLocaleString()}
            </p>
            <span className="text-xs text-slate-400 font-normal">
              due on arrival
            </span>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Already Collected Deposits:</span>
              <strong className="text-emerald-700 font-mono">{currency}{Math.round(projection.totalCollectedRevenue).toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span>Unpaid / Pending at Risk:</span>
              <strong className="text-rose-600 font-mono">{currency}{Math.round(projection.unpaidPendingAtRiskRevenue).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-heading">
              Visual Revenue Dynamics (30-Day Window)
            </h3>
            <p className="text-xs text-slate-500">
              Daily trajectory comparing confirmed booked revenue against total potential capacity at current rack rates.
            </p>
          </div>

          {/* Chart View Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartView('trajectory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartView === 'trajectory' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Trajectory
            </button>
            <button
              type="button"
              onClick={() => setChartView('rooms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartView === 'rooms' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Room
            </button>
            <button
              type="button"
              onClick={() => setChartView('composition')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartView === 'composition' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Composition
            </button>
            <button
              type="button"
              onClick={() => setChartView('cashflow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartView === 'cashflow' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cash Flow
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-80 w-full pt-2">
          {chartView === 'trajectory' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={projection.dailyProjections}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="projRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="potentialGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${currency}${val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0]?.payload as DailyRevenueProjection;
                    if (!item) return null;

                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-2 border border-slate-800 min-w-[220px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-teal-400">
                            {item.formattedDate} ({item.dayOfWeek})
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isWeekend ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.isWeekend ? 'Weekend' : 'Weekday'}
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Confirmed Booked Rev:</span>
                            <strong className="text-teal-300 font-mono">{currency}{item.bookedTotalRevenue.toFixed(0)}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Max Rack Potential:</span>
                            <strong className="text-slate-300 font-mono">{currency}{item.potentialMaxCapacityRevenue.toFixed(0)}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Unsold Revenue Gap:</span>
                            <strong className="text-amber-400 font-mono">{currency}{item.unsoldPotentialRevenue.toFixed(0)}</strong>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-1">
                            <span className="text-slate-400">Occupancy:</span>
                            <strong className="text-emerald-400 font-mono">{item.occupancyPercent}% ({item.bookedBeds}/{item.totalAvailableBeds} beds)</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Day ADR / RevPAR:</span>
                            <span className="text-slate-200 font-mono">{currency}{item.adr.toFixed(0)} / {currency}{item.revPar.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }} 
                  iconType="circle"
                />
                {/* 100% Capacity Potential line */}
                <Line
                  type="monotone"
                  dataKey="potentialMaxCapacityRevenue"
                  name="100% Rack Capacity Potential"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
                {/* Booked Total Revenue Area */}
                <Area
                  type="monotone"
                  dataKey="bookedTotalRevenue"
                  name="Projected Booked Revenue"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fill="url(#projRevenueGradient)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {chartView === 'rooms' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projection.roomPerformance}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickFormatter={(val) => `${currency}${val}`}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="roomName" 
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                  width={150}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${currency}${Number(value).toLocaleString()}`,
                    name === 'projectedRevenue' ? '30-Day Booked' : '30-Day Potential'
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar 
                  dataKey="potentialRevenue" 
                  name="100% Capacity Potential" 
                  fill="#e2e8f0" 
                  radius={[0, 6, 6, 0]} 
                />
                <Bar 
                  dataKey="projectedRevenue" 
                  name="30-Day Booked Revenue" 
                  fill="#0d9488" 
                  radius={[0, 6, 6, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartView === 'composition' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projection.dailyProjections}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${currency}${val}`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [`${currency}${Number(val).toFixed(0)}`, name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar 
                  dataKey="bookedAccommodationRevenue" 
                  name="Room Accommodation" 
                  stackId="rev" 
                  fill="#0d9488" 
                />
                <Bar 
                  dataKey="bookedAddOnsRevenue" 
                  name="Surf & Wellness Add-ons" 
                  stackId="rev" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartView === 'cashflow' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projection.dailyProjections}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${currency}${val}`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [`${currency}${Number(val).toFixed(0)}`, name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar 
                  dataKey="estimatedCashCollected" 
                  name="Deposits / Prepaid Cash" 
                  stackId="cf" 
                  fill="#10b981" 
                />
                <Bar 
                  dataKey="estimatedBalanceDueAtCheckIn" 
                  name="Balance Due upon Arrival" 
                  stackId="cf" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Room Category Performance & Surf Add-ons Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Types Contribution Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Revenue by Room Type
              </h3>
              <p className="text-xs text-slate-500">
                Performance across dorm beds and private suites over next 30 days
              </p>
            </div>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('rooms')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>Manage Rates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {projection.roomTypeBreakdown.map((rt) => (
              <div key={rt.type} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-xs text-slate-900">{rt.typeLabel}</span>
                    <span className="text-[11px] text-slate-500 ml-2 font-mono">
                      {rt.bookedBedNights}/{rt.availableBedNights} bed nights
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {currency}{Math.round(rt.projectedRevenue).toLocaleString()}
                  </span>
                </div>

                {/* Progress bar showing realization rate */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-teal-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, rt.realizationPercent)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Occupancy: <strong className="text-slate-700">{rt.occupancyPercent}%</strong></span>
                  <span>Rack Potential: <strong className="text-slate-700 font-mono">{currency}{Math.round(rt.potentialRevenue).toLocaleString()}</strong></span>
                  <span>Yield: <strong className="text-teal-700 font-mono">{rt.realizationPercent}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Surf & Wellness Add-ons Forecast Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Projected Add-ons & Services
              </h3>
              <p className="text-xs text-slate-500">
                Scheduled surf coaching, board rentals, yoga, and meals
              </p>
            </div>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('addons')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>View Add-ons</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {projection.addOnsBreakdown.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No extra add-on services booked for this 30-day window yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {projection.addOnsBreakdown.map((addon) => (
                <div 
                  key={addon.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="font-bold text-slate-900 truncate">{addon.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {currency}{addon.price} unit rate • ~{Math.round(addon.estimatedUnits)} units scheduled
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-mono font-extrabold text-slate-900">
                      +{currency}{Math.round(addon.projectedRevenue).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-teal-600 font-medium">
                      Confirmed Add-on
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-800">
                <span>Total 30-Day Ancillary Revenue:</span>
                <span className="font-mono text-teal-700 font-extrabold text-sm">
                  +{currency}{Math.round(projection.totalAddOnsRevenue).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Day-by-Day 30-Day Revenue Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-heading">
              30-Day Daily Revenue Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Granular day-by-day breakdown with occupancy rates, rack capacity, and front desk cash flow.
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTableFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tableFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All 30 Days
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('weekends')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tableFilter === 'weekends'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Weekends Only
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('high_occupancy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tableFilter === 'high_occupancy'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              High Occupancy (≥70%)
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('low_occupancy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tableFilter === 'low_occupancy'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Opportunity Gap (&lt;50%)
            </button>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Date & Day</th>
                <th className="py-3 px-3 text-right">Booked Acc.</th>
                <th className="py-3 px-3 text-right">Add-ons</th>
                <th className="py-3 px-3 text-right">Total Revenue</th>
                <th className="py-3 px-3 text-right">Max Potential</th>
                <th className="py-3 px-3 text-right">Unsold Gap</th>
                <th className="py-3 px-3 text-center">Occupancy</th>
                <th className="py-3 px-3 text-right">ADR / RevPAR</th>
                <th className="py-3 px-3 text-right">Cash Due</th>
                <th className="py-3 px-2 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDays.map((day) => {
                const isExpanded = expandedDay === day.date;
                return (
                  <React.Fragment key={day.date}>
                    <tr className={`hover:bg-slate-50/80 transition-colors ${
                      day.isWeekend ? 'bg-amber-50/20' : ''
                    }`}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{day.formattedDate}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            day.isWeekend ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {day.dayOfWeek}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {currency}{day.bookedAccommodationRevenue.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-700">
                        {day.bookedAddOnsRevenue > 0 ? `+${currency}${day.bookedAddOnsRevenue.toFixed(0)}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-teal-700">
                        {currency}{day.bookedTotalRevenue.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {currency}{day.potentialMaxCapacityRevenue.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-700 font-bold">
                        {currency}{day.unsoldPotentialRevenue.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            day.occupancyPercent >= 75 ? 'bg-emerald-100 text-emerald-800' :
                            day.occupancyPercent >= 50 ? 'bg-teal-100 text-teal-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {day.occupancyPercent}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({day.bookedBeds}/{day.totalAvailableBeds})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-600">
                        {currency}{day.adr.toFixed(0)} / {currency}{day.revPar.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-900">
                        {currency}{day.estimatedBalanceDueAtCheckIn.toFixed(0)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                          title="Inspect active bookings and room occupancy on this day"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Drawer for Specific Day */}
                    {isExpanded && (
                      <tr className="bg-teal-50/40">
                        <td colSpan={10} className="p-4 border-b border-teal-100">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-teal-600" />
                                Active In-House Bookings for {day.formattedDate} ({day.activeBookings.length} bookings, {day.bookedBeds} guests)
                              </h4>
                              <span className="text-[11px] text-teal-700">
                                Total Day Revenue: <strong>{currency}{day.bookedTotalRevenue.toFixed(2)}</strong>
                              </span>
                            </div>

                            {day.activeBookings.length === 0 ? (
                              <p className="text-xs text-slate-500 italic">No bookings scheduled on this night yet.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {day.activeBookings.map((b) => (
                                  <div 
                                    key={b.id} 
                                    className="p-2.5 rounded-xl bg-white border border-teal-200/70 text-xs shadow-2xs space-y-1"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-slate-900 truncate">{b.guestName}</span>
                                      <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                                        #{b.referenceNumber}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">{b.roomName} ({b.guestsCount} guest{b.guestsCount > 1 ? 's' : ''})</p>
                                    <div className="flex justify-between items-center text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                                      <span>Nightly Rate: <strong className="font-mono text-slate-900">{currency}{b.nightlyTotalRate}</strong></span>
                                      <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[9px] ${
                                        b.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                        b.paymentStatus === 'deposit' ? 'bg-blue-100 text-blue-800' :
                                        'bg-rose-100 text-rose-800'
                                      }`}>
                                        {b.paymentStatus}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Room Occupancy Status for this day */}
                            <div className="pt-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                                Room Capacity Standing on {day.formattedDate}:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {day.roomBreakdown.map((r) => (
                                  <div 
                                    key={r.roomId}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] border flex items-center gap-1.5 ${
                                      r.isFullyBooked 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' 
                                        : r.bookedBeds > 0 
                                        ? 'bg-teal-50 border-teal-200 text-teal-800' 
                                        : 'bg-white border-slate-200 text-slate-500'
                                    }`}
                                  >
                                    <span>{r.roomName}:</span>
                                    <span className="font-mono font-bold">
                                      {r.bookedBeds}/{r.capacity} beds ({r.occupancyPercent}%)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
