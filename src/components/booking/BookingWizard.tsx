import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Bed, Sparkles, UserCheck, CheckCircle2, Waves, ShieldCheck, Tag, Info, Layers, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { Booking, GuestInfo, HostelSettings, Room, SelectedAddOn, SurfAddOn, SurfSkillLevel, BookingFormConfig, BookingStepConfig } from '../../types';
import { calculateNights, getTodayString, addDaysToString } from '../../utils/date';
import { DEFAULT_BOOKING_FORM_CONFIG } from '../../data/defaultBookingFormConfig';
import { StepDates } from './StepDates';
import { StepRooms } from './StepRooms';
import { StepAddOns } from './StepAddOns';
import { StepGuestDetails } from './StepGuestDetails';
import { StepConfirmation } from './StepConfirmation';
import { StepDynamicCustom } from './StepDynamicCustom';
import { dispatchWebhook } from '../../utils/webhook';
import { LiveWeatherTicker } from '../weather/LiveWeatherTicker';
import { INITIAL_OCEAN_SPOTS } from '../../data/oceanSpotsData';
import { LiveOceanSpot } from '../../types/weather';

interface BookingWizardProps {
  rooms: Room[];
  addOns: SurfAddOn[];
  bookings: Booking[];
  settings: HostelSettings;
  selectedOceanSpot?: LiveOceanSpot;
  onSelectOceanSpot?: (spot: LiveOceanSpot) => void;
  onSaveBooking: (newBooking: Booking) => void;
  onGoToAdmin: () => void;
  onOpenWeatherView?: () => void;
  onOpenScanner?: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  rooms,
  addOns,
  bookings,
  settings,
  selectedOceanSpot,
  onSelectOceanSpot,
  onSaveBooking,
  onGoToAdmin,
  onOpenWeatherView,
  onOpenScanner,
}) => {
  const today = getTodayString();
  const defaultCheckOut = addDaysToString(today, 4);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [checkIn, setCheckIn] = useState<string>(today);
  const [checkOut, setCheckOut] = useState<string>(defaultCheckOut);
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [surfLevel, setSurfLevel] = useState<SurfSkillLevel>('intermediate');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || 'room-1');
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([
    { addOnId: 'addon-1', quantity: 1, days: 3 }, // Coaching pre-selected by default
  ]);
  const [guest, setGuest] = useState<GuestInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    surfLevel: 'intermediate',
    arrivalEstimatedTime: '15:00',
    specialRequests: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const nights = calculateNights(checkIn, checkOut);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Calculate pricing
  const isDorm = selectedRoom?.type.startsWith('dorm');
  const roomSubtotal = selectedRoom ? selectedRoom.pricePerNight * nights * (isDorm ? guestsCount : 1) : 0;

  const addOnsSubtotal = selectedAddOns.reduce((sum, sel) => {
    const def = addOns.find((a) => a.id === sel.addOnId);
    if (!def) return sum;
    if (def.billingType === 'per_day') {
      return sum + def.price * sel.quantity * (sel.days || nights);
    }
    return sum + def.price * sel.quantity;
  }, 0);

  const taxAmount = (roomSubtotal + addOnsSubtotal) * (settings.taxRatePercent / 100);
  const totalAmount = roomSubtotal + addOnsSubtotal + taxAmount;

  // Multi-step dynamic form configuration
  const formConfig: BookingFormConfig = settings.bookingFormConfig || DEFAULT_BOOKING_FORM_CONFIG;

  // Compute enabled interactive steps list from formConfig (excluding confirmation which is terminal)
  const activeInputSteps: BookingStepConfig[] = formConfig.steps.filter((s) => s.enabled !== false && s.id !== 'confirmation');

  // Active step index (0 to activeInputSteps.length)
  // When activeStepIndex === activeInputSteps.length, we are on the confirmation screen!
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});

  // Reference for smooth direct scrolling to the room selection step
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const [quickBookNotice, setQuickBookNotice] = useState<boolean>(false);

  // Returning visitor detection and history state
  const [isReturningVisitor, setIsReturningVisitor] = useState<boolean>(() => {
    try {
      const visited = localStorage.getItem('surf_lodge_has_visited');
      const prevGuest = localStorage.getItem('surf_lodge_last_guest_details');
      const prevBooking = localStorage.getItem('surf_lodge_last_booking');
      return visited === 'true' || !!prevGuest || !!prevBooking;
    } catch {
      return false;
    }
  });

  const [returningGuestName, setReturningGuestName] = useState<string>(() => {
    try {
      const prev = localStorage.getItem('surf_lodge_last_guest_details');
      if (prev) {
        const parsed = JSON.parse(prev);
        if (parsed.firstName) return parsed.firstName;
      }
    } catch {
      // ignore
    }
    return '';
  });

  // Track initial visit in localStorage so subsequent visits or page reloads recognize returning visitor
  useEffect(() => {
    try {
      localStorage.setItem('surf_lodge_has_visited', 'true');
    } catch {
      // ignore
    }
  }, []);

  // Quick Book handler: directly transitions to room selection step and scrolls into view
  const handleQuickBook = () => {
    // If returning visitor has saved profile, pre-fill contact info
    try {
      const prev = localStorage.getItem('surf_lodge_last_guest_details');
      if (prev && (!guest.firstName || !guest.phone)) {
        const parsed = JSON.parse(prev);
        setGuest((prevG) => ({
          ...prevG,
          firstName: parsed.firstName || prevG.firstName,
          lastName: parsed.lastName || prevG.lastName,
          email: parsed.email || prevG.email,
          phone: parsed.phone || prevG.phone,
          country: parsed.country || prevG.country,
          surfLevel: parsed.surfLevel || prevG.surfLevel,
        }));
        if (parsed.surfLevel) {
          setSurfLevel(parsed.surfLevel);
        }
      }
    } catch {
      // ignore
    }

    if (confirmedBooking) {
      setConfirmedBooking(null);
    }

    // Determine the step index for the 'rooms' selection step
    const roomsStepIdx = activeInputSteps.findIndex((s) => s.id === 'rooms');
    const targetIdx = roomsStepIdx >= 0 ? roomsStepIdx : 1;
    setActiveStepIndex(targetIdx);
    setQuickBookNotice(true);

    // Directly scroll smoothly to the room selection step container
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (stepContainerRef.current) {
          stepContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          const el = document.getElementById('wizard-step-container');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    });

    // Auto-dismiss the quick book feedback pill after 5 seconds
    setTimeout(() => {
      setQuickBookNotice(false);
    }, 5000);
  };

  // Helper icon for a step
  const getStepIcon = (step: BookingStepConfig) => {
    if (step.id === 'dates') return Calendar;
    if (step.id === 'rooms') return Bed;
    if (step.id === 'addons') return Sparkles;
    if (step.id === 'guest') return UserCheck;
    if (step.id === 'confirmation') return CheckCircle2;
    if (step.iconName === 'ShieldCheck') return ShieldCheck;
    if (step.iconName === 'Waves') return Waves;
    return Layers;
  };

  // Steps array for the stepper bar
  const confirmationConfig = formConfig.steps.find((s) => s.id === 'confirmation') || {
    id: 'confirmation',
    stepNumber: activeInputSteps.length + 1,
    name: 'Confirmation',
    title: 'Booking Confirmed!',
    subtitle: 'Your surf lodge stay is secured.',
    enabled: true,
  };

  const steps = [
    ...activeInputSteps.map((s, idx) => ({
      index: idx,
      id: s.id,
      label: s.name,
      icon: getStepIcon(s),
      config: s,
    })),
    {
      index: activeInputSteps.length,
      id: 'confirmation',
      label: confirmationConfig.name || 'Confirmation',
      icon: CheckCircle2,
      config: confirmationConfig,
    },
  ];

  const handleCompleteBooking = async () => {
    // Generate unique booking reference
    const refNum = 'WH-' + Math.floor(1000 + Math.random() * 9000);
    const newBooking: Booking = {
      id: 'booking-' + Date.now(),
      referenceNumber: refNum,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights,
      guestsCount,
      guest: {
        ...guest,
        surfLevel,
        customResponses,
      },
      addOns: selectedAddOns,
      roomSubtotal,
      addOnsSubtotal,
      taxAmount,
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      whatsappSentCount: 0,
      webhookSentCount: 0,
    };

    // Save to store
    onSaveBooking(newBooking);
    setConfirmedBooking(newBooking);

    // Save last guest details and booking for returning visitor convenience
    try {
      localStorage.setItem('surf_lodge_has_visited', 'true');
      localStorage.setItem('surf_lodge_last_guest_details', JSON.stringify(newBooking.guest));
      localStorage.setItem('surf_lodge_last_booking', JSON.stringify({
        referenceNumber: newBooking.referenceNumber,
        roomId: newBooking.roomId,
        roomName: newBooking.roomName,
        guestName: `${newBooking.guest.firstName} ${newBooking.guest.lastName}`.trim(),
      }));
    } catch {
      // ignore
    }

    // Lightweight webhook automatic dispatch if enabled
    if (settings.webhookEnabled && settings.autoSendWebhookOnBooking) {
      dispatchWebhook('booking.created', newBooking, settings);
    }

    setActiveStepIndex(activeInputSteps.length);
  };

  const handleResetBooking = () => {
    setConfirmedBooking(null);
    setActiveStepIndex(0);
    setCheckIn(today);
    setCheckOut(addDaysToString(today, 4));
    setGuestsCount(1);
    setSelectedAddOns([]);
    setCustomResponses({});
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Operating Status Notice Banner if not regular open */}
      {settings.operatingStatus && settings.operatingStatus !== 'open' && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
          settings.operatingStatus === 'seasonal_break'
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            settings.operatingStatus === 'seasonal_break' ? 'bg-amber-500' : 'bg-rose-500'
          }`} />
          <div className="flex-1">
            <span className="font-extrabold uppercase mr-1.5">
              {settings.operatingStatus === 'seasonal_break' ? 'Seasonal Notice:' : 'Maintenance Notice:'}
            </span>
            {settings.maintenanceNotice || (
              settings.operatingStatus === 'seasonal_break'
                ? `${settings.name} is currently on seasonal break. Pre-bookings for the upcoming surf season remain open!`
                : `${settings.name} property is undergoing seasonal surf lodge upgrades.`
            )}
          </div>
        </div>
      )}

      {/* Live Ocean Weather & Wave Conditions Ticker */}
      {onOpenWeatherView && (
        <LiveWeatherTicker
          selectedSpot={selectedOceanSpot}
          onSelectSpot={onSelectOceanSpot}
          onOpenWeatherView={onOpenWeatherView}
        />
      )}

      {/* Promotional Banner from Booking Form Builder */}
      {formConfig.bannerNotice && (
        <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-teal-900 text-teal-50 border border-teal-700/60 shadow-xs flex items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-teal-800 text-teal-200 shrink-0">
              <Sparkles className="w-4 h-4 text-teal-300" />
            </span>
            <span>{formConfig.bannerNotice}</span>
          </div>
          {formConfig.showSavingsBadge && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-800/80 text-teal-200 border border-teal-600/40 shrink-0">
              <Tag className="w-3 h-3" />
              Direct Booking Perk
            </span>
          )}
        </div>
      )}

      {/* BookingWizard Component Header with Quick Book Call-to-Action for Returning Visitors */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                <Waves className="w-5 h-5" />
              </span>
              <span>{settings.name || 'Surf Lodge'} Booking</span>
            </h1>
            {isReturningVisitor && (
              <span 
                id="returning-visitor-badge"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                <span>Returning Visitor{returningGuestName ? `: Welcome back, ${returningGuestName}!` : ''}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {isReturningVisitor
              ? 'Welcome back! Use Quick Book to bypass step 1 and jump straight to available rooms.'
              : 'Select your stay dates, explore available lodge rooms, and customize your surf adventure.'}
          </p>
        </div>

        {/* Quick Book Call-to-Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="quick-book-cta-btn"
            onClick={handleQuickBook}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95 group focus:outline-hidden focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: settings.primaryBrandColor || '#0d9488',
            }}
            title="Fast-track to room selection for returning visitors"
          >
            <div className="p-1 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col text-left">
              <span className="leading-tight font-extrabold tracking-wide flex items-center gap-1">
                Quick Book
              </span>
              <span className="text-[10px] font-medium text-white/85 leading-tight">
                {isReturningVisitor ? 'Skip to Rooms &rarr;' : 'Returning Visitors &rarr;'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 ml-1 opacity-80 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Multi-step Header Stepper */}
      <div className="mb-6 sm:mb-8 overflow-x-auto scrollbar-none pb-2">
        <div className="flex items-center justify-between relative px-1 min-w-[440px] md:min-w-0">
          {/* Base track: strictly aligned to the vertical center of the 44px circle (top-[22px]) and bounds (left-6 right-6) */}
          <div className="absolute left-6 right-6 top-[22px] -translate-y-1/2 h-1 bg-slate-200/90 rounded-full z-0 overflow-hidden">
            {/* Animated active progress fill */}
            <div
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${(activeStepIndex / Math.max(1, steps.length - 1)) * 100}%`,
                backgroundColor: settings.primaryBrandColor || '#0d9488',
              }}
            />
          </div>

          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = activeStepIndex > step.index;
            const isCurrent = activeStepIndex === step.index;

            return (
              <button
                key={step.id}
                type="button"
                id={`stepper-step-${step.index + 1}`}
                disabled={step.index > activeStepIndex && !confirmedBooking}
                onClick={() => {
                  if (step.index < activeStepIndex && !confirmedBooking) {
                    setActiveStepIndex(step.index);
                  }
                }}
                className={`relative z-10 flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed touch-manipulation min-w-[44px] min-h-[44px] justify-start focus:outline-hidden ${
                  step.index < activeStepIndex ? 'hover:opacity-90 active:scale-95' : ''
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 relative ${
                    isCompleted
                      ? 'text-white shadow-sm ring-2 ring-white'
                      : isCurrent
                      ? 'bg-slate-900 text-white ring-4 shadow-md scale-105'
                      : 'bg-white text-slate-400 border border-slate-200 shadow-2xs group-hover:border-slate-300'
                  }`}
                  style={
                    isCompleted
                      ? { backgroundColor: settings.primaryBrandColor || '#0d9488' }
                      : isCurrent
                      ? {
                          boxShadow: `0 4px 14px -2px ${(settings.primaryBrandColor || '#0d9488')}40`,
                        }
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white drop-shadow-2xs" />
                  ) : (
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isCurrent ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                  )}

                  {/* Step number badge indicator */}
                  <span
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center border shadow-2xs ${
                      isCompleted
                        ? 'bg-emerald-500 text-white border-white'
                        : isCurrent
                        ? 'bg-teal-500 text-white border-white'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {step.index + 1}
                  </span>
                </div>

                <span
                  className={`hidden sm:block text-[11px] font-bold mt-2 whitespace-nowrap transition-colors duration-200 ${
                    isCurrent
                      ? 'text-slate-900 font-extrabold'
                      : isCompleted
                      ? 'font-bold'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                  style={isCompleted ? { color: settings.primaryBrandColor || '#0d9488' } : undefined}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile active step title indicator */}
        <div className="sm:hidden text-center mt-3">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200/80 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            <span>
              Step {activeStepIndex + 1} of {steps.length}: {steps[activeStepIndex]?.label}
            </span>
          </span>
        </div>
      </div>

      {/* Step Components Container */}
      <div 
        ref={stepContainerRef}
        id="wizard-step-container"
        className="bg-white/85 backdrop-blur-xs rounded-3xl p-3.5 sm:p-7 md:p-8 border border-slate-200/80 shadow-xs scroll-mt-8"
      >
        {/* Quick Book Notification Toast / Banner */}
        {quickBookNotice && (
          <div 
            id="quick-book-activated-banner"
            className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-900 flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-lg bg-amber-200/80 text-amber-800 shrink-0">
                <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
              </span>
              <span>
                <strong>Quick Book Activated:</strong> You have been fast-tracked directly to room selection.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setQuickBookNotice(false)}
              className="text-amber-800 hover:text-amber-950 text-xs font-bold underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeStepIndex === activeInputSteps.length && confirmedBooking ? (
          <StepConfirmation
            booking={confirmedBooking}
            room={selectedRoom}
            addOns={addOns}
            settings={settings}
            onGoToAdmin={onGoToAdmin}
            onResetBooking={handleResetBooking}
          />
        ) : (() => {
          const currentStepObj = activeInputSteps[activeStepIndex] || activeInputSteps[0];
          if (!currentStepObj) return null;

          const goNext = () => {
            if (activeStepIndex < activeInputSteps.length - 1) {
              setActiveStepIndex(activeStepIndex + 1);
            } else {
              handleCompleteBooking();
            }
          };

          const goBack = () => {
            if (activeStepIndex > 0) {
              setActiveStepIndex(activeStepIndex - 1);
            }
          };

          if (currentStepObj.id === 'dates') {
            return (
              <StepDates
                checkIn={checkIn}
                checkOut={checkOut}
                guestsCount={guestsCount}
                surfLevel={surfLevel}
                selectedSpot={selectedOceanSpot}
                onSelectSpot={onSelectOceanSpot}
                onOpenWeatherView={onOpenWeatherView}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
                onGuestsCountChange={setGuestsCount}
                onSurfLevelChange={setSurfLevel}
                onNext={goNext}
              />
            );
          }

          if (currentStepObj.id === 'rooms') {
            return (
              <StepRooms
                rooms={rooms}
                bookings={bookings}
                selectedRoomId={selectedRoomId}
                checkIn={checkIn}
                checkOut={checkOut}
                nights={nights}
                guestsCount={guestsCount}
                settings={settings}
                onSelectRoom={setSelectedRoomId}
                onNext={goNext}
                onBack={goBack}
                onOpenScanner={onOpenScanner}
              />
            );
          }

          if (currentStepObj.id === 'addons') {
            return (
              <StepAddOns
                addOns={addOns}
                selectedAddOns={selectedAddOns}
                nights={nights}
                guestsCount={guestsCount}
                settings={settings}
                onChangeSelectedAddOns={setSelectedAddOns}
                onNext={goNext}
                onBack={goBack}
              />
            );
          }

          if (currentStepObj.id === 'guest') {
            return (
              <StepGuestDetails
                guest={guest}
                onChangeGuest={setGuest}
                onNext={goNext}
                onBack={goBack}
                stepConfig={currentStepObj}
              />
            );
          }

          // Custom Step created via Elementor Pro Drag & Drop Builder
          return (
            <StepDynamicCustom
              step={currentStepObj}
              customResponses={customResponses}
              onChangeResponses={setCustomResponses}
              onNext={goNext}
              onBack={goBack}
              settings={settings}
            />
          );
        })()}
      </div>
    </div>
  );
};
