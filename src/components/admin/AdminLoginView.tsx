import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowLeft, 
  Waves, AlertCircle, Sparkles, CheckCircle2, KeyRound 
} from 'lucide-react';
import { HostelSettings, StaffUser } from '../../types';
import { getRoleBadgeStyle } from '../../utils/rbac';
import { useLanguage } from '../../context/LanguageContext';

interface AdminLoginViewProps {
  settings: HostelSettings;
  staffUsers: StaffUser[];
  onLoginSuccess: (user: StaffUser) => void;
  onBackToBooking: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  settings,
  staffUsers,
  onLoginSuccess,
  onBackToBooking,
}) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const brandColor = settings.primaryBrandColor || '#0d9488';

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your staff email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find staff by email
      const matched = staffUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail || u.name.toLowerCase() === cleanEmail
      );

      if (!matched) {
        setIsLoading(false);
        setError(`No active staff account found with email "${cleanEmail}". Click a demo profile below to test.`);
        return;
      }

      if (matched.status === 'suspended') {
        setIsLoading(false);
        setError('This staff account has been suspended. Please contact the administrator.');
        return;
      }

      // Successful login
      setIsLoading(false);
      onLoginSuccess(matched);
    }, 400);
  };

  const handleQuickDemoLogin = (user: StaffUser) => {
    setEmail(user.email);
    setPassword('admin123');
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(user);
    }, 300);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Return to Booking Form button */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          type="button"
          id="admin-login-back-to-booking-top"
          onClick={onBackToBooking}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Guest Booking</span>
        </button>

        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Hostel Staff Portal
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl relative overflow-hidden">
        {/* Top Brand Banner */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center mb-1">
            {settings.logoUrl ? (
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src={settings.logoUrl}
                  alt={settings.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div
                className="w-13 h-13 rounded-2xl text-white flex items-center justify-center font-bold shadow-md"
                style={{ backgroundColor: brandColor }}
              >
                <Waves className="w-7 h-7" />
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
            Staff Dashboard Login
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Authorized access for hostel managers, operators, and reception personnel at {settings.name}.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            id="admin-login-error-alert"
            className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-login-email"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Staff Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-login-email"
                type="text"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@wavehavensurf.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admin-login-password"
                className="block text-xs font-bold text-slate-700"
              >
                Password
              </label>
              <span className="text-[11px] text-slate-400">
                Demo password: <span className="font-mono text-teal-700 font-bold">admin123</span>
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                id="admin-login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                id="admin-login-remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span>Remember this session</span>
            </label>

            <span className="text-slate-400 text-[11px]">Protected Portal</span>
          </div>

          <button
            type="submit"
            id="admin-login-btn-submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: brandColor }}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating Staff...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Fast Demo Logins Section */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Click Demo Accounts
            </span>
            <span className="text-[10px] text-slate-400">Click to log in</span>
          </div>

          <div className="space-y-2">
            {staffUsers.slice(0, 3).map((user) => {
              const roleInfo = getRoleBadgeStyle(user.role);
              return (
                <button
                  key={user.id}
                  type="button"
                  id={`admin-login-demo-${user.id}`}
                  onClick={() => handleQuickDemoLogin(user)}
                  disabled={isLoading}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-left flex items-center justify-between transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-teal-900">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${roleInfo.badgeClass}`}>
                    {roleInfo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-5 pt-4 text-center border-t border-slate-100">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>256-Bit Encrypted Hostel Management System</span>
          </p>
        </div>
      </div>
    </div>
  );
};
