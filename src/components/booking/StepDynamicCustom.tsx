import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ArrowLeft, Check, Sparkles, Star, 
  HelpCircle, ChevronDown, ChevronUp, ExternalLink,
  Waves, AlertTriangle, CheckSquare, Calendar, Sliders,
  Phone, Mail, Radio, Clock, Tag, Upload, PenTool,
  Calculator, Timer, FileText, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { BookingStepConfig, FormElement, HostelSettings } from '../../types';

interface StepDynamicCustomProps {
  step: BookingStepConfig;
  customResponses: Record<string, any>;
  onChangeResponses: (updated: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  settings?: HostelSettings;
}

export const StepDynamicCustom: React.FC<StepDynamicCustomProps> = ({
  step,
  customResponses,
  onChangeResponses,
  onNext,
  onBack,
  settings,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(15 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const elements = step.elements || [];

  const handleFieldChange = (fieldKey: string, value: any) => {
    onChangeResponses({
      ...customResponses,
      [fieldKey]: value,
    });
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleProceed = () => {
    // Validate required fields
    for (const el of elements) {
      if (el.required && el.fieldKey) {
        const val = customResponses[el.fieldKey];
        if (el.type === 'input_checkbox' && !val) {
          setValidationError(`Please agree to the "${el.title}" agreement before proceeding.`);
          return;
        }
        if (el.type === 'input_signature' && (!val || typeof val !== 'string' || !val.trim())) {
          setValidationError(`Please provide your digital signature for "${el.title}".`);
          return;
        }
        if (el.type === 'input_file' && !val) {
          setValidationError(`Please upload the required document for "${el.title}".`);
          return;
        }
        if (val === undefined || val === null || val === '') {
          setValidationError(`Please fill in the required field: "${el.title}".`);
          return;
        }
      }
    }

    setValidationError(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-slate-100 pb-4">
        {step.badge && (
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/70 inline-flex items-center gap-1 mb-2">
            <Sparkles className="w-3 h-3 text-teal-600" />
            <span>{step.badge}</span>
          </span>
        )}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {step.title}
        </h2>
        {step.subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            {step.subtitle}
          </p>
        )}
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2 animate-shake">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Render All Elements of the Step */}
      <div className="space-y-4">
        {elements.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            No specific elements configured for this step yet. Click "Next" to continue.
          </div>
        ) : (
          elements.map((el) => {
            const alignClass = el.styles?.align === 'center' ? 'text-center' : el.styles?.align === 'right' ? 'text-right' : 'text-left';
            const bgClass = el.styles?.bgColor === 'teal_soft' 
              ? 'bg-teal-50/70 border-teal-200' 
              : el.styles?.bgColor === 'amber_warm'
              ? 'bg-amber-50/70 border-amber-200'
              : el.styles?.bgColor === 'rose_subtle'
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-white border-slate-200/90';

            return (
              <div
                key={el.id}
                className={`p-4 sm:p-5 rounded-2xl border ${bgClass} ${alignClass} shadow-2xs space-y-2`}
              >
                {/* TYPE: HEADING */}
                {el.type === 'heading' && (
                  <div>
                    <h3 className={`font-black text-slate-900 ${
                      el.styles?.fontSize === '2xl' ? 'text-2xl' : el.styles?.fontSize === 'xl' ? 'text-xl' : 'text-lg'
                    }`}>
                      {el.title}
                    </h3>
                    {el.subtitle && (
                      <p className="text-xs text-slate-500 mt-1">{el.subtitle}</p>
                    )}
                  </div>
                )}

                {/* TYPE: TEXT */}
                {el.type === 'text' && (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {el.content}
                  </p>
                )}

                {/* TYPE: INPUT TEXT */}
                {el.type === 'input_text' && el.fieldKey && (
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title} {el.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={customResponses[el.fieldKey] ?? ''}
                      onChange={(e) => handleFieldChange(el.fieldKey!, e.target.value)}
                      placeholder={el.placeholder || 'Your answer...'}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-hidden transition-colors"
                    />
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: INPUT TEXTAREA */}
                {el.type === 'input_textarea' && el.fieldKey && (
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title} {el.required && <span className="text-rose-500">*</span>}
                    </label>
                    <textarea
                      rows={3}
                      value={customResponses[el.fieldKey] ?? ''}
                      onChange={(e) => handleFieldChange(el.fieldKey!, e.target.value)}
                      placeholder={el.placeholder || 'Type here...'}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-hidden transition-colors"
                    />
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: INPUT SELECT */}
                {el.type === 'input_select' && el.fieldKey && (
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title} {el.required && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      value={customResponses[el.fieldKey] ?? ''}
                      onChange={(e) => handleFieldChange(el.fieldKey!, e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-hidden transition-colors"
                    >
                      <option value="">Select an option...</option>
                      {el.options?.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: INPUT CHECKBOX / WAIVER */}
                {el.type === 'input_checkbox' && el.fieldKey && (
                  <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200/80 text-left space-y-1.5">
                    <label className="flex items-start gap-2.5 text-xs font-bold text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(customResponses[el.fieldKey])}
                        onChange={(e) => handleFieldChange(el.fieldKey!, e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 mt-0.5"
                      />
                      <span>{el.title} {el.required && <span className="text-rose-500">*</span>}</span>
                    </label>
                    {el.content && (
                      <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                        {el.content}
                      </p>
                    )}
                    {el.helpText && <p className="text-[10px] text-slate-400 pl-6">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: INPUT NUMBER */}
                {el.type === 'input_number' && el.fieldKey && (
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            const currentVal = Number(customResponses[el.fieldKey!] ?? el.defaultValue ?? 1);
                            const minVal = el.min ?? 0;
                            if (currentVal > minVal) {
                              handleFieldChange(el.fieldKey!, currentVal - 1);
                            }
                          }}
                          className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="px-4 py-1.5 text-xs font-bold text-slate-900">
                          {customResponses[el.fieldKey] ?? el.defaultValue ?? 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const currentVal = Number(customResponses[el.fieldKey!] ?? el.defaultValue ?? 1);
                            const maxVal = el.max ?? 99;
                            if (currentVal < maxVal) {
                              handleFieldChange(el.fieldKey!, currentVal + 1);
                            }
                          }}
                          className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          +
                        </button>
                      </div>
                      {el.helpText && <span className="text-[11px] text-slate-500">{el.helpText}</span>}
                    </div>
                  </div>
                )}

                {/* TYPE: INPUT DATE */}
                {el.type === 'input_date' && el.fieldKey && (
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title} {el.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="date"
                      value={customResponses[el.fieldKey] ?? ''}
                      onChange={(e) => handleFieldChange(el.fieldKey!, e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-hidden"
                    />
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: INPUT PHONE */}
                {el.type === 'input_phone' && el.fieldKey && (
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        {el.title} {el.required && <span className="text-rose-500">*</span>}
                      </label>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        WhatsApp Connected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shrink-0">
                        {el.countryCode || '+351'}
                      </div>
                      <input
                        type="tel"
                        value={customResponses[el.fieldKey] ?? ''}
                        onChange={(e) => handleFieldChange(el.fieldKey!, e.target.value)}
                        placeholder={el.placeholder || '912 345 678'}
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-hidden transition-colors"
                      />
                    </div>
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: INPUT EMAIL */}
                {el.type === 'input_email' && el.fieldKey && (
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title} {el.required && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={customResponses[el.fieldKey] ?? ''}
                        onChange={(e) => handleFieldChange(el.fieldKey!, e.target.value)}
                        placeholder={el.placeholder || 'surfer@example.com'}
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-hidden transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {['@gmail.com', '@icloud.com', '@outlook.com'].map((dom) => (
                        <button
                          key={dom}
                          type="button"
                          onClick={() => {
                            const curr = String(customResponses[el.fieldKey!] || '');
                            const username = curr.includes('@') ? curr.split('@')[0] : curr;
                            if (username) {
                              handleFieldChange(el.fieldKey!, `${username}${dom}`);
                            }
                          }}
                          className="text-[10px] font-medium text-slate-500 hover:text-teal-600 bg-slate-100 hover:bg-teal-50 px-2 py-0.5 rounded-md border border-slate-200 transition-colors"
                        >
                          {dom}
                        </button>
                      ))}
                    </div>
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: INPUT RADIO */}
                {el.type === 'input_radio' && el.fieldKey && (
                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title} {el.required && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(el.options || ['Beginner', 'Intermediate', 'Advanced']).map((opt, i) => {
                        const isSelected = customResponses[el.fieldKey!] === opt;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleFieldChange(el.fieldKey!, opt)}
                            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                              isSelected
                                ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 text-slate-950 font-bold'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: INPUT TIME */}
                {el.type === 'input_time' && el.fieldKey && (
                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title} {el.required && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(el.options || [
                        'Morning (09:00 - 12:00)',
                        'Check-in (14:00 - 18:00)',
                        'Sunset (18:00 - 21:00)',
                        'Late Night (21:00+)'
                      ]).map((slot, i) => {
                        const isSelected = customResponses[el.fieldKey!] === slot;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleFieldChange(el.fieldKey!, slot)}
                            className={`p-2.5 rounded-xl border text-center text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-teal-600 text-white font-bold border-teal-600 shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`} />
                            <span className="leading-tight">{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: INPUT TOGGLE */}
                {el.type === 'input_toggle' && el.fieldKey && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-left">
                    <div className="pr-4">
                      <h4 className="text-xs font-bold text-slate-900">{el.title}</h4>
                      {el.subtitle && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{el.subtitle}</p>}
                      {el.helpText && <p className="text-[10px] text-teal-600 mt-1 font-semibold">{el.helpText}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current = Boolean(customResponses[el.fieldKey!] ?? el.defaultValue ?? false);
                        handleFieldChange(el.fieldKey!, !current);
                      }}
                      className={`w-12 h-6.5 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                        Boolean(customResponses[el.fieldKey!] ?? el.defaultValue ?? false)
                          ? 'bg-teal-600 justify-end'
                          : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform" />
                    </button>
                  </div>
                )}

                {/* TYPE: MULTI-TAG CHIPS */}
                {el.type === 'badge_pills' && (
                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title || 'Select Preferences'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(el.badgeItems || ['Vegetarian', 'Vegan', 'Gluten-Free', 'Sunset Yoga', 'Surf Video Analysis']).map((tag, i) => {
                        const currentSelected: string[] = Array.isArray(customResponses[el.fieldKey || 'tags'])
                          ? customResponses[el.fieldKey || 'tags']
                          : [];
                        const isSelected = currentSelected.includes(tag);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const key = el.fieldKey || 'tags';
                              const next = isSelected
                                ? currentSelected.filter((t) => t !== tag)
                                : [...currentSelected, tag];
                              handleFieldChange(key, next);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 transition-all ${
                              isSelected
                                ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            <Tag className={`w-3 h-3 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                            <span>{tag}</span>
                            {isSelected ? (
                              <Check className="w-3 h-3 text-teal-600" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: FILE UPLOAD */}
                {el.type === 'input_file' && el.fieldKey && (
                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title} {el.required && <span className="text-rose-500">*</span>}
                    </label>
                    {customResponses[el.fieldKey] ? (
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-bold text-slate-800">
                            {customResponses[el.fieldKey].name || 'Document Attached'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFieldChange(el.fieldKey!, null)}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-2xl p-4 text-center bg-slate-50/70 hover:bg-teal-50/30 transition-colors cursor-pointer block">
                        <Upload className="w-6 h-6 text-teal-600 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-700">Click to upload document or drag & drop</p>
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                          {(el.fileTypes || ['PDF', 'JPG', 'PNG']).map((ft) => (
                            <span key={ft} className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                              {ft}
                            </span>
                          ))}
                          <span className="text-[10px] text-slate-400">• Max {el.maxFileSizeMb || 10}MB</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFieldChange(el.fieldKey!, { name: file.name, size: file.size });
                            }
                          }}
                        />
                      </label>
                    )}
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: DIGITAL SIGNATURE */}
                {el.type === 'input_signature' && el.fieldKey && (
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        {el.title} {el.required && <span className="text-rose-500">*</span>}
                      </label>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-teal-600" />
                        Legally Binding
                      </span>
                    </div>
                    {el.signaturePrompt && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed italic">
                        "{el.signaturePrompt}"
                      </p>
                    )}
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={customResponses[el.fieldKey] ?? ''}
                        onChange={(e) => handleFieldChange(el.fieldKey!, e.target.value)}
                        placeholder="Type full legal name to digitally sign (e.g. Johnathan Doe)"
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium font-serif italic text-base focus:outline-hidden transition-colors"
                      />
                      {customResponses[el.fieldKey] && (
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[10px] text-emerald-800 flex items-center justify-between font-mono">
                          <span>Signed: {customResponses[el.fieldKey]}</span>
                          <span>Verified: {new Date().toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: RATING STARS */}
                {el.type === 'rating_stars' && (
                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-bold text-slate-800">
                      {el.title || 'Rating Scale'}
                    </label>
                    <div className="flex items-center gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      {[...Array(el.max || 5)].map((_, i) => {
                        const key = el.fieldKey || 'rating';
                        const score = Number(customResponses[key] ?? el.rating ?? 4);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleFieldChange(key, i + 1)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                i < score
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {customResponses[el.fieldKey || 'rating'] ?? el.rating ?? 4} / {el.max || 5} Stars
                      </span>
                    </div>
                    {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                  </div>
                )}

                {/* TYPE: PRICE BREAKDOWN */}
                {el.type === 'price_breakdown' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 text-white space-y-3 text-left shadow-md">
                    <div className="flex items-center justify-between border-b border-teal-800/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-teal-300">
                          {el.title || 'Live Guaranteed Pricing'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        Best Rate Direct
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Nightly Base Rate:</span>
                        <span className="font-bold text-white">{el.currency || '€'}{el.basePrice || 38} / night</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Complimentary High-speed WiFi & Board Storage:</span>
                        <span className="text-emerald-400 font-bold">Included Free</span>
                      </div>
                      <div className="flex justify-between text-teal-300 font-bold border-t border-teal-800/50 pt-2 text-sm">
                        <span>Required Deposit to Confirm ({el.depositPercent || 30}%):</span>
                        <span className="text-base font-black text-white">{el.currency || '€'}{Math.round((el.basePrice || 38) * ((el.depositPercent || 30) / 100))}</span>
                      </div>
                    </div>
                    {el.content && <p className="text-[11px] text-teal-200/80 leading-relaxed pt-1">{el.content}</p>}
                  </div>
                )}

                {/* TYPE: COUNTDOWN TIMER */}
                {el.type === 'countdown_timer' && (
                  <div className="p-3.5 sm:p-4 rounded-2xl border border-teal-200 bg-teal-50/80 text-teal-950 flex items-center justify-between text-left shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Timer className="w-4.5 h-4.5 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">{el.title || 'Bed Availability Held'}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{el.content || 'Your selected dates & rate are locked for this session.'}</div>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-teal-300 font-mono text-xs sm:text-sm font-black tracking-wider shrink-0 shadow-xs">
                      {Math.floor(timerSecondsLeft / 60).toString().padStart(2, '0')}:{(timerSecondsLeft % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                )}

                {/* TYPE: IMAGE */}
                {el.type === 'image' && (
                  <div className="space-y-2">
                    <img
                      src={el.imageUrl || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80'}
                      alt={el.title || 'Hostel experience'}
                      className="w-full h-48 object-cover rounded-xl shadow-xs"
                    />
                    {el.title && <div className="text-xs font-bold text-slate-900">{el.title}</div>}
                    {el.content && <p className="text-[11px] text-slate-500">{el.content}</p>}
                  </div>
                )}

                {/* TYPE: ALERT */}
                {el.type === 'alert' && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 text-left ${
                    el.alertType === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : el.alertType === 'tip'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-teal-50 border-teal-200 text-teal-900'
                  }`}>
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      {el.title && <div className="text-xs font-black">{el.title}</div>}
                      <div className="text-xs mt-0.5 leading-relaxed">{el.content}</div>
                    </div>
                  </div>
                )}

                {/* TYPE: ICON BOX */}
                {el.type === 'icon_box' && (
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <Waves className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{el.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">{el.content}</p>
                    </div>
                  </div>
                )}

                {/* TYPE: TESTIMONIAL */}
                {el.type === 'testimonial' && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(el.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 italic font-medium">"{el.content}"</p>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{el.author}</div>
                  </div>
                )}

                {/* TYPE: FAQ ACCORDION */}
                {el.type === 'faq' && (
                  <div className="space-y-2 text-left">
                    {el.title && <h4 className="text-xs font-black text-slate-900">{el.title}</h4>}
                    <div className="space-y-1.5">
                      {el.faqItems?.map((faq, i) => {
                        const isOpen = openFaqIndex === i;
                        return (
                          <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                              className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center justify-between text-left"
                            >
                              <span>{faq.question}</span>
                              {isOpen ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                            </button>
                            {isOpen && (
                              <div className="p-3 bg-white text-[11px] text-slate-600 border-t border-slate-200">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TYPE: DIVIDER */}
                {el.type === 'divider' && (
                  <div className="py-2">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                )}

                {/* TYPE: BUTTON */}
                {el.type === 'button' && (
                  <div>
                    <a
                      href={el.buttonUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-xs inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>{el.buttonText || 'Learn More'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stepper Navigation Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 sm:px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="px-5 sm:px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <span>{step.ctaButtonText || 'Continue to Next Step'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
