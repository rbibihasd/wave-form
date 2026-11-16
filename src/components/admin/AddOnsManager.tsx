import React, { useState } from 'react';
import { Sparkles, Plus, Edit2, Trash2, X, Waves, ShieldCheck, Sun, Coffee, Car } from 'lucide-react';
import { SurfAddOn } from '../../types';

interface AddOnsManagerProps {
  addOns: SurfAddOn[];
  currencySymbol: string;
  onUpdateAddOn: (addOn: SurfAddOn) => void;
  onAddAddOn: (addOn: SurfAddOn) => void;
  onDeleteAddOn: (addOnId: string) => void;
}

export const AddOnsManager: React.FC<AddOnsManagerProps> = ({
  addOns,
  currencySymbol,
  onUpdateAddOn,
  onAddAddOn,
  onDeleteAddOn,
}) => {
  const [editingAddOn, setEditingAddOn] = useState<SurfAddOn | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const initialNewAddOn: SurfAddOn = {
    id: 'addon-' + Date.now(),
    name: 'New Surf Package',
    category: 'surf_lesson',
    price: 35,
    billingType: 'per_day',
    description: 'Custom surf house activity or rental option.',
    iconName: 'Waves',
    popular: false,
  };

  const [formAddOn, setFormAddOn] = useState<SurfAddOn>(initialNewAddOn);

  const handleStartEdit = (addOn: SurfAddOn) => {
    setEditingAddOn(addOn);
    setFormAddOn({ ...addOn });
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    setEditingAddOn(null);
    setFormAddOn({ ...initialNewAddOn, id: 'addon-' + Date.now() });
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      onAddAddOn(formAddOn);
    } else {
      onUpdateAddOn(formAddOn);
    }
    setEditingAddOn(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-slate-900">
            Surf & Camp Add-ons Management
          </h3>
          <p className="text-xs text-slate-500">
            Configure coaching lessons, equipment rentals, yoga flows, and camp packages.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartCreate}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-teal-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Package / Service</span>
        </button>
      </div>

      {/* Add-ons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {addOns.map((addOn) => (
          <div
            key={addOn.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-heading font-bold text-base text-slate-900 leading-snug">
                    {addOn.name}
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Category: {addOn.category.replace('_', ' ')}
                  </span>
                </div>
                {addOn.popular && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    Popular
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                {addOn.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-lg font-black text-slate-900">
                  {currencySymbol}{addOn.price}
                </span>
                <span className="text-[11px] text-slate-400 ml-1">
                  {addOn.billingType === 'per_day' ? '/ day' : addOn.billingType === 'per_stay' ? '/ stay' : '/ person'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStartEdit(addOn)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${addOn.name}?`)) {
                      onDeleteAddOn(addOn.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {(editingAddOn || isCreating) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
              <h3 className="font-heading font-extrabold text-base text-white">
                {isCreating ? 'Add Surf Service' : `Edit ${formAddOn.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingAddOn(null);
                  setIsCreating(false);
                }}
                className="text-white hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={formAddOn.name}
                  onChange={(e) => setFormAddOn({ ...formAddOn, name: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Price ({currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    value={formAddOn.price}
                    onChange={(e) => setFormAddOn({ ...formAddOn, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Billing Interval</label>
                  <select
                    value={formAddOn.billingType}
                    onChange={(e) => setFormAddOn({ ...formAddOn, billingType: e.target.value as any })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="per_day">Per Day</option>
                    <option value="per_stay">Per Stay (One-time)</option>
                    <option value="per_person">Per Person</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={formAddOn.category}
                    onChange={(e) => setFormAddOn({ ...formAddOn, category: e.target.value as any })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="surf_lesson">Surf Lesson & Coaching</option>
                    <option value="equipment">Board & Wetsuit Quiver</option>
                    <option value="wellness">Yoga & Recovery</option>
                    <option value="meal">Breakfast & Meals</option>
                    <option value="transport">Van Shuttle</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Icon Style</label>
                  <select
                    value={formAddOn.iconName}
                    onChange={(e) => setFormAddOn({ ...formAddOn, iconName: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="Waves">Waves (Coaching)</option>
                    <option value="Sparkles">Sparkles (Quiver)</option>
                    <option value="ShieldCheck">Shield (Wetsuit)</option>
                    <option value="Sun">Sun (Yoga)</option>
                    <option value="Coffee">Coffee (Breakfast)</option>
                    <option value="Car">Car (Shuttle)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formAddOn.description}
                  onChange={(e) => setFormAddOn({ ...formAddOn, description: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAddOn.popular || false}
                    onChange={(e) => setFormAddOn({ ...formAddOn, popular: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">Highlight as "Popular / Recommended"</span>
                </label>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddOn(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
