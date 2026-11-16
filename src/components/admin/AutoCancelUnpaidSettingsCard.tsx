import React, { useState } from 'react';
import { 
  Clock, ShieldAlert, CheckCircle2, AlertTriangle, 
  RotateCcw, Play, Check, ChevronRight, User, Bed, 
  Calendar, DollarSign, Info, ShieldCheck
} from 'lucide-react';
import { Booking, HostelSettings } from '../../types';
import { 
  evaluateAutoCancellations, 
  executeBatchAutoCancellation, 
  getAutoCancelTimeRemaining,
  getBookingCreationAgeDays,
  isDepositReceived 
} from '../../utils/autoCancellation';

interface AutoCancelUnpaidSettingsCardProps {
  settings: HostelSettings;
  bookings: Booking[];
  onFieldChange: (field: keyof HostelSettings, value: any) => void;
  onBatchUpdateBookings?: (updatedBookings: Booking[]) => void;
  showToast?: (message: string) => void;
}

export const AutoCancelUnpaidSettingsCard: React.FC<AutoCancelUnpaidSettingsCardProps> = ({
  settings,
  bookings,
  onFieldChange,
  onBatchUpdateBookings,
  showToast,
}) => {
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<{
    timestamp: string;
    cancelledCount: number;
    cancelledRefs: string[];
  } | null>(null);

  const isEnabled = Boolean(settings.autoCancelUnpaidEnabled);
  const daysLimit = settings.autoCancelUnpaidDays && settings.autoCancelUnpaidDays > 0 ? settings.autoCancelUnpaidDays : 3;

  const evaluation = evaluateAutoCancellations(bookings, {
    ...settings,
    autoCancelUnpaidEnabled: isEnabled,
    autoCancelUnpaidDays: daysLimit,
  });

  const handleToggle = () => {
    const nextState = !isEnabled;
    onFieldChange('autoCancelUnpaidEnabled', nextState);
    if (showToast) {
      showToast(nextState 
        ? `Auto-cancel unpaid reservations enabled (${daysLimit} days grace window)` 
        : 'Auto-cancel unpaid reservations disabled'
      );
    }
  };

  const handleSelectDays = (days: number) => {
    onFieldChange('autoCancelUnpaidDays', days);
  };

  const handleRunCheckNow = async () => {
    if (!onBatchUpdateBookings) {
      if (showToast) showToast('Booking updater is not connected.');
      return;
    }

    setIsRunningCheck(true);
    try {
      // Simulate brief processing for pleasant UI feedback
      await new Promise((resolve) => setTimeout(resolve, 400));

      const { updatedBookings, cancelledBookings, count } = await executeBatchAutoCancellation(
        bookings,
        {
          ...settings,
          autoCancelUnpaidEnabled: true, // Force run even if currently toggled off during manual trigger
          autoCancelUnpaidDays: daysLimit,
        }
      );

      if (count > 0) {
        onBatchUpdateBookings(updatedBookings);
        const refs = cancelledBookings.map((b) => `#${b.referenceNumber}`);
        setLastCheckResult({
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cancelledCount: count,
          cancelledRefs: refs,
        });
        if (showToast) {
          showToast(`Successfully auto-cancelled ${count} unpaid reservation${count === 1 ? '' : 's'} (${refs.join(', ')})`);
        }
      } else {
        setLastCheckResult({
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cancelledCount: 0,
          cancelledRefs: [],
        });
        if (showToast) {
          showToast('No overdue unpaid reservations found. All active bookings are within grace period or paid.');
        }
      }
    } catch (err) {
      console.error('Error running auto-cancellation:', err);
      if (showToast) showToast('An error occurred while processing auto-cancellations.');
    } finally {
      setIsRunningCheck(false);
    }
  };

  const presetDays = [
    { value: 1, label: '1 Day', note: 'Fast turnover' },
    { value: 2, label: '2 Days', note: '48-hour hold' },
    { value: 3, label: '3 Days', note: 'Standard / Recommended' },
    { value: 5, label: '5 Days', note: 'Relaxed' },
    { value: 7, label: '7 Days', note: '1 Week max' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      {/* Card Header with Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            isEnabled ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-extrabold text-base text-slate-900">
                Auto-cancel Unpaid Reservations
              </h4>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {isEnabled ? 'Active Rule' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically cancel bookings if deposit is not received within a set number of days of booking creation.
            </p>
          </div>
        </div>

        {/* Enable / Disable Switch */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-600">
            {isEnabled ? 'Automated' : 'Manual only'}
          </span>
          <button
            type="button"
            id="toggle-auto-cancel-unpaid-btn"
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isEnabled ? 'bg-teal-600' : 'bg-slate-200'
            }`}
            role="switch"
            aria-checked={isEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Configuration Controls */}
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-sm text-slate-800 mb-1.5 flex items-center justify-between">
            <span>Cancellation Grace Window (X Days of Creation)</span>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200/60">
              Current: {daysLimit} day{daysLimit === 1 ? '' : 's'} ({daysLimit * 24} hours)
            </span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            If a reservation's payment status remains <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-mono font-bold text-[11px]">unpaid</code> or <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-mono font-bold text-[11px]">pending</code> {daysLimit} days after its creation timestamp, it is automatically marked as <span className="font-bold text-rose-600">cancelled</span>, releasing bed availability.
          </p>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {presetDays.map((preset) => {
              const isSelected = daysLimit === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelectDays(preset.value)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-600/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="font-extrabold text-sm">{preset.label}</div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                    {preset.note}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Days Input */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Or custom grace limit:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={daysLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1) {
                    onFieldChange('autoCancelUnpaidDays', val);
                  }
                }}
                className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-center font-bold text-slate-800 text-sm focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
              <span className="text-xs text-slate-500 font-semibold">days after creation</span>
            </div>
          </div>
        </div>

        {/* Live Inventory Status Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Live Unpaid Reservations Standings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="run-auto-cancel-check-btn"
                onClick={handleRunCheckNow}
                disabled={isRunningCheck}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isRunningCheck ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Auto-Cancel Check Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Unpaid */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-500">Active Without Deposit</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {evaluation.totalUnpaidActiveCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Status is unpaid or pending
              </div>
            </div>

            {/* Within Grace */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Within Grace Window
              </div>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                {evaluation.graceCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Created &lt; {daysLimit} days ago
              </div>
            </div>

            {/* Overdue Eligible */}
            <div className={`p-3 rounded-xl border transition-colors ${
              evaluation.overdueCount > 0 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : 'bg-white border-slate-200/80 text-slate-700'
            }`}>
              <div className="text-[11px] font-bold flex items-center gap-1">
                <AlertTriangle className={`w-3 h-3 ${evaluation.overdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>Overdue for Cancellation</span>
              </div>
              <div className={`text-xl font-extrabold mt-0.5 ${evaluation.overdueCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {evaluation.overdueCount}
              </div>
              <div className={`text-[10px] mt-0.5 ${evaluation.overdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {evaluation.overdueCount > 0 ? 'Deposit overdue — eligible for cancel' : 'No overdue reservations'}
              </div>
            </div>
          </div>

          {/* Last Check Result Feedback */}
          {lastCheckResult && (
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  Check ran at <strong>{lastCheckResult.timestamp}</strong>:{' '}
                  {lastCheckResult.cancelledCount > 0
                    ? `Auto-cancelled ${lastCheckResult.cancelledCount} reservation(s) (${lastCheckResult.cancelledRefs.join(', ')})`
                    : 'All reservations are up to date.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLastCheckResult(null)}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* List of Affected Unpaid Reservations */}
          {evaluation.totalUnpaidActiveCount > 0 ? (
            <div className="mt-2 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Unpaid Reservations Breakdown:
              </div>
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                {/* Eligible Overdue First */}
                {evaluation.eligibleForCancel.map((booking) => {
                  const ageDays = getBookingCreationAgeDays(booking).toFixed(1);
                  return (
                    <div
                      key={booking.id}
                      className="p-3 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">
                            {booking.guest.firstName} {booking.guest.lastName}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                            #{booking.referenceNumber}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            • {booking.roomName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Created {ageDays} days ago</span>
                          <span>•</span>
                          <span>Dates: {booking.checkInDate} → {booking.checkOutDate}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-800">{settings.currencySymbol}{booking.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Overdue (&gt; {daysLimit}d)</span>
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Within Grace Second */}
                {evaluation.pendingWithinGrace.map((booking) => {
                  const remaining = getAutoCancelTimeRemaining(booking, daysLimit);
                  const ageDays = getBookingCreationAgeDays(booking).toFixed(1);
                  return (
                    <div
                      key={booking.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {booking.guest.firstName} {booking.guest.lastName}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                            #{booking.referenceNumber}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            • {booking.roomName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Created {ageDays} days ago</span>
                          <span>•</span>
                          <span>Dates: {booking.checkInDate} → {booking.checkOutDate}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">{settings.currencySymbol}{booking.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{remaining.label}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-1 text-center bg-white rounded-xl border border-slate-200/80 p-3">
              No active reservations currently awaiting deposit payment.
            </div>
          )}
        </div>
      </div>

      {/* Audit & Webhook Notice */}
      <div className="flex items-start gap-2.5 pt-2 text-slate-500 text-xs">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          When marked as cancelled, reservations automatically append an internal audit note with the cancellation timestamp, free up beds on the 30-day occupancy grid, and trigger the <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold text-slate-700">booking.cancelled</code> webhook if configured.
        </p>
      </div>
    </div>
  );
};
