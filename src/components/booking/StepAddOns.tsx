import React from 'react';
import { Waves, Sparkles, ShieldCheck, Sun, Coffee, Car, Plus, Minus, Check, ArrowLeft } from 'lucide-react';
import { HostelSettings, SelectedAddOn, SurfAddOn } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface StepAddOnsProps {
  addOns: SurfAddOn[];
  selectedAddOns: SelectedAddOn[];
  nights: number;
  guestsCount: number;
  settings: HostelSettings;
  onChangeSelectedAddOns: (addOns: SelectedAddOn[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepAddOns: React.FC<StepAddOnsProps> = ({
  addOns,
  selectedAddOns,
  nights,
  guestsCount,
  settings,
  onChangeSelectedAddOns,
  onNext,
  onBack,
}) => {
  const { t } = useLanguage();
  const getIcon = (name: string) => {
    switch (name) {
      case 'Waves':
        return <Waves className="w-5 h-5 text-cyan-600" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-teal-600" />;
      case 'Sun':
        return <Sun className="w-5 h-5 text-amber-600" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-amber-700" />;
      case 'Car':
        return <Car className="w-5 h-5 text-emerald-600" />;
      default:
        return <Waves className="w-5 h-5 text-teal-600" />;
    }
  };

  const isAddOnSelected = (addOnId: string) => {
    return selectedAddOns.some((item) => item.addOnId === addOnId);
  };

  const getSelectedEntry = (addOnId: string) => {
    return selectedAddOns.find((item) => item.addOnId === addOnId);
  };

  const handleToggle = (addOn: SurfAddOn) => {
    if (isAddOnSelected(addOn.id)) {
      onChangeSelectedAddOns(selectedAddOns.filter((item) => item.addOnId !== addOn.id));
    } else {
      const defaultDays = addOn.billingType === 'per_day' ? nights : 1;
      const defaultQty = addOn.billingType === 'per_person' ? guestsCount : 1;
      onChangeSelectedAddOns([
        ...selectedAddOns,
        { addOnId: addOn.id, quantity: defaultQty, days: defaultDays },
      ]);
    }
  };

  const updateQuantity = (addOnId: string, delta: number) => {
    onChangeSelectedAddOns(
      selectedAddOns.map((item) => {
        if (item.addOnId === addOnId) {
          const newQty = Math.max(1, Math.min(10, item.quantity + delta));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const updateDays = (addOnId: string, delta: number) => {
    onChangeSelectedAddOns(
      selectedAddOns.map((item) => {
        if (item.addOnId === addOnId) {
          const newDays = Math.max(1, Math.min(nights, (item.days || nights) + delta));
          return { ...item, days: newDays };
        }
        return item;
      })
    );
  };

  // Calculate live add-ons total
  const addOnsTotal = selectedAddOns.reduce((sum, sel) => {
    const def = addOns.find((a) => a.id === sel.addOnId);
    if (!def) return sum;
    if (def.billingType === 'per_day') {
      return sum + def.price * sel.quantity * (sel.days || nights);
    }
    return sum + def.price * sel.quantity;
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
            {t.booking.addonsTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t.booking.addonsSubtitle}
          </p>
        </div>

        {selectedAddOns.length > 0 && (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 px-3.5 py-1.5 rounded-xl text-xs font-bold self-start sm:self-auto flex items-center gap-2">
            <span>{selectedAddOns.length} selected</span>
            <span>•</span>
            <span className="font-extrabold text-teal-900">
              +{settings.currencySymbol}{addOnsTotal.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Add-ons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addOns.map((addOn) => {
          const isSelected = isAddOnSelected(addOn.id);
          const entry = getSelectedEntry(addOn.id);

          return (
            <div
              key={addOn.id}
              id={`addon-card-${addOn.id}`}
              className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
              }`}
            >
              <div>
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {getIcon(addOn.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-slate-900 leading-tight">
                          {addOn.name}
                        </h4>
                        {addOn.popular && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/60">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {settings.currencySymbol}{addOn.price}{' '}
                        {addOn.billingType === 'per_day' ? '/ day' : addOn.billingType === 'per_stay' ? '/ stay' : '/ person'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(addOn)}
                    aria-label={isSelected ? `Remove ${addOn.name}` : `Add ${addOn.name}`}
                    className={`w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center transition-all touch-manipulation active:scale-95 ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'border-2 border-slate-300 hover:border-teal-500 text-transparent hover:text-slate-400 bg-white'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {addOn.description}
                </p>
              </div>

              {/* Adjust Quantity / Days if Selected */}
              {isSelected && entry && (
                <div className="pt-3 mt-2 border-t border-teal-200/60 flex flex-wrap items-center justify-between gap-2.5 text-xs bg-white/80 p-3 rounded-xl border border-teal-100">
                  {addOn.billingType === 'per_day' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 font-bold">Days:</span>
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => updateDays(addOn.id, -1)}
                          disabled={(entry.days || nights) <= 1}
                          aria-label="Decrease days"
                          className="w-11 h-11 sm:w-9 sm:h-9 min-w-[44px] min-h-[44px] rounded-lg bg-white flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 shadow-2xs active:scale-95 touch-manipulation cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 font-extrabold text-slate-900 text-sm">
                          {entry.days || nights}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateDays(addOn.id, 1)}
                          disabled={(entry.days || nights) >= nights}
                          aria-label="Increase days"
                          className="w-11 h-11 sm:w-9 sm:h-9 min-w-[44px] min-h-[44px] rounded-lg bg-white flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 shadow-2xs active:scale-95 touch-manipulation cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-slate-700 font-bold">Qty:</span>
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => updateQuantity(addOn.id, -1)}
                        disabled={entry.quantity <= 1}
                        aria-label="Decrease quantity"
                        className="w-11 h-11 sm:w-9 sm:h-9 min-w-[44px] min-h-[44px] rounded-lg bg-white flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 shadow-2xs active:scale-95 touch-manipulation cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 font-extrabold text-slate-900 text-sm">
                        {entry.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(addOn.id, 1)}
                        aria-label="Increase quantity"
                        className="w-11 h-11 sm:w-9 sm:h-9 min-w-[44px] min-h-[44px] rounded-lg bg-white flex items-center justify-center font-bold text-slate-700 shadow-2xs active:scale-95 touch-manipulation cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto min-h-[48px] h-12 px-5 py-3 rounded-xl border border-slate-200 sm:border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors order-2 sm:order-1 touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.common.back}</span>
        </button>

        <button
          type="button"
          id="btn-step3-next"
          onClick={onNext}
          className="w-full sm:w-auto min-h-[48px] h-12 px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 touch-manipulation active:scale-[0.99]"
        >
          <span>{t.booking.continueToGuest}</span>
          <span className="text-base font-bold">→</span>
        </button>
      </div>
    </div>
  );
};
