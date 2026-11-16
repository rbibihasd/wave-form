import React, { useState } from 'react';
import { User, Phone, Mail, Globe, Clock, FileText, ShieldAlert, ArrowLeft, MessageSquare, CheckSquare, HelpCircle } from 'lucide-react';
import { GuestInfo, BookingStepConfig } from '../../types';

interface StepGuestDetailsProps {
  guest: GuestInfo;
  onChangeGuest: (guest: GuestInfo) => void;
  onNext: () => void;
  onBack: () => void;
  stepConfig?: BookingStepConfig;
}

export const StepGuestDetails: React.FC<StepGuestDetailsProps> = ({
  guest,
  onChangeGuest,
  onNext,
  onBack,
  stepConfig,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const customFields = stepConfig?.customFields || [];
  const customResponses = guest.customResponses || {};

  const handleCustomResponseChange = (fieldId: string, value: any) => {
    onChangeGuest({
      ...guest,
      customResponses: {
        ...customResponses,
        [fieldId]: value,
      },
    });
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!guest.firstName.trim()) err.firstName = 'First name is required';
    if (!guest.lastName.trim()) err.lastName = 'Last name is required';
    if (!guest.email.trim() || !guest.email.includes('@')) err.email = 'Valid email is required';
    if (!guest.phone.trim() || guest.phone.replace(/[^0-9]/g, '').length < 7) {
      err.phone = 'WhatsApp number with country code is required (e.g. +351 912 345 678)';
    }

    // Validate required custom fields
    customFields.forEach((field) => {
      if (field.required) {
        const val = customResponses[field.id];
        if (val === undefined || val === null || val === '' || (field.type === 'checkbox' && val !== true)) {
          err[field.id] = `${field.label} is required`;
        }
      }
    });

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const headerTitle = stepConfig?.title || 'Lead Guest & WhatsApp Contact';
  const headerSubtitle = stepConfig?.subtitle || 'Used to send your direct WhatsApp booking voucher and automated upcoming stay surf alerts.';
  const nextButtonText = stepConfig?.ctaButtonText || 'Review & Confirm Booking';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
          {headerTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {headerSubtitle}
        </p>
      </div>

      {/* WhatsApp Feature Notification Box */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3.5 text-emerald-900 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-emerald-950 mb-0.5">
            Direct WhatsApp Reservation Dispatch (No-API Setup)
          </p>
          <p className="text-emerald-800 leading-relaxed">
            Upon finishing, you can dispatch the full booking itinerary directly to our front desk via WhatsApp with one tap, receiving your instant confirmation and digital check-in guide.
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              First Name *
            </label>
            <input
              id="input-first-name"
              type="text"
              placeholder="e.g. Kai"
              value={guest.firstName}
              onChange={(e) => onChangeGuest({ ...guest, firstName: e.target.value })}
              className={`w-full h-11 sm:h-10 bg-slate-50 border rounded-xl px-3.5 text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white transition-all ${
                errors.firstName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-teal-500'
              }`}
            />
            {errors.firstName && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              Last Name *
            </label>
            <input
              id="input-last-name"
              type="text"
              placeholder="e.g. Lennox"
              value={guest.lastName}
              onChange={(e) => onChangeGuest({ ...guest, lastName: e.target.value })}
              className={`w-full h-11 sm:h-10 bg-slate-50 border rounded-xl px-3.5 text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white transition-all ${
                errors.lastName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-teal-500'
              }`}
            />
            {errors.lastName && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Contact Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              Email Address *
            </label>
            <input
              id="input-guest-email"
              type="email"
              placeholder="kai.surfer@example.com"
              value={guest.email}
              onChange={(e) => onChangeGuest({ ...guest, email: e.target.value })}
              className={`w-full h-11 sm:h-10 bg-slate-50 border rounded-xl px-3.5 text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white transition-all ${
                errors.email ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-teal-500'
              }`}
            />
            {errors.email && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              WhatsApp Phone Number *
            </label>
            <input
              id="input-guest-phone"
              type="tel"
              placeholder="+351 912 345 678 (Include country code)"
              value={guest.phone}
              onChange={(e) => onChangeGuest({ ...guest, phone: e.target.value })}
              className={`w-full h-11 sm:h-10 bg-slate-50 border rounded-xl px-3.5 text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white transition-all ${
                errors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-teal-500'
              }`}
            />
            {errors.phone ? (
              <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Must include country code for WhatsApp link</p>
            )}
          </div>
        </div>

        {/* Country & Arrival Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              Country / Nationality
            </label>
            <input
              id="input-guest-country"
              type="text"
              placeholder="e.g. Portugal, France, Germany, USA"
              value={guest.country}
              onChange={(e) => onChangeGuest({ ...guest, country: e.target.value })}
              className="w-full h-11 sm:h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              Estimated Arrival Time
            </label>
            <input
              id="input-arrival-time"
              type="text"
              placeholder="e.g. 15:30 (Check-in from 14:00)"
              value={guest.arrivalEstimatedTime || ''}
              onChange={(e) => onChangeGuest({ ...guest, arrivalEstimatedTime: e.target.value })}
              className="w-full h-11 sm:h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500"
            />
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            Special Requests, Dietary Requirements or Surf Goals
          </label>
          <textarea
            id="input-special-requests"
            rows={2}
            placeholder="e.g. Vegetarian breakfast, bottom bunk requested, bringing own 6'2 board, flight number..."
            value={guest.specialRequests || ''}
            onChange={(e) => onChangeGuest({ ...guest, specialRequests: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500"
          />
        </div>

        {/* Emergency Contact */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Emergency Contact (Recommended for Surf House)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              id="input-emergency-name"
              type="text"
              placeholder="Contact Name (e.g. Sarah Lennox)"
              value={guest.emergencyContactName || ''}
              onChange={(e) => onChangeGuest({ ...guest, emergencyContactName: e.target.value })}
              className="w-full h-11 sm:h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-base sm:text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white"
            />
            <input
              id="input-emergency-phone"
              type="tel"
              placeholder="Contact Phone Number"
              value={guest.emergencyContactPhone || ''}
              onChange={(e) => onChangeGuest({ ...guest, emergencyContactPhone: e.target.value })}
              className="w-full h-11 sm:h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-base sm:text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white"
            />
          </div>
        </div>

        {/* Custom Form Builder Questions */}
        {customFields.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                Additional Preferences & Stay Information
              </h3>
              <p className="text-[11px] text-slate-500">
                Configured via the Stay Form Builder for your stay type.
              </p>
            </div>

            <div className="space-y-3.5">
              {customFields.map((field) => {
                const value = customResponses[field.id] ?? field.defaultValue ?? '';
                const hasError = Boolean(errors[field.id]);

                return (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder={field.placeholder || 'Your answer'}
                        value={value}
                        onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 ${
                          hasError ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200'
                        }`}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        rows={2}
                        placeholder={field.placeholder || 'Your answer'}
                        value={value}
                        onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 ${
                          hasError ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200'
                        }`}
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        value={value}
                        onChange={(e) => handleCustomResponseChange(field.id, e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-teal-500 ${
                          hasError ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200'
                        }`}
                      >
                        <option value="">Select option...</option>
                        {field.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'checkbox' && (
                      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(e) => handleCustomResponseChange(field.id, e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded-md mt-0.5"
                        />
                        <span className="text-xs font-semibold text-slate-800 leading-snug">
                          {field.label}
                        </span>
                      </label>
                    )}

                    {field.helpText && (
                      <p className="text-[11px] text-slate-400">{field.helpText}</p>
                    )}
                    {hasError && (
                      <p className="text-[11px] text-rose-600 font-medium">{errors[field.id]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto min-h-[48px] h-12 px-5 py-3 rounded-xl border border-slate-200 sm:border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors order-2 sm:order-1 touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          id="btn-step4-next"
          onClick={handleNext}
          className="w-full sm:w-auto min-h-[48px] h-12 px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 touch-manipulation active:scale-[0.99]"
        >
          <span>{nextButtonText}</span>
          <span className="text-base font-bold">→</span>
        </button>
      </div>
    </div>
  );
};
