import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, Sliders, Eye, Save, RotateCcw, Download, Upload, 
  CheckCircle2, Plus, Trash2, Edit3, ArrowRight, ArrowLeft, 
  Check, Info, HelpCircle, Layers, Palette, ShieldCheck, 
  Calendar, Bed, Tag, MessageSquare, AlertCircle, Wand2, 
  ExternalLink, ChevronRight, ChevronLeft, Copy, CheckSquare, Layout
} from 'lucide-react';
import { BookingFormConfig, BookingStepConfig, BookingFormField, HostelSettings, Room, SurfAddOn } from '../../types';
import { DEFAULT_BOOKING_FORM_CONFIG, PRESET_BOOKING_FORM_TEMPLATES } from '../../data/defaultBookingFormConfig';
import { requestAIBookingForm } from '../../utils/aiFormBuilder';
import { ElementorProStepBuilder } from './ElementorProStepBuilder';

interface BookingFormBuilderProps {
  settings: HostelSettings;
  rooms?: Room[];
  addOns?: SurfAddOn[];
  onSaveFormConfig: (newConfig: BookingFormConfig) => void;
  onPreviewLiveBooking?: () => void;
}

export const BookingFormBuilder: React.FC<BookingFormBuilderProps> = ({
  settings,
  rooms = [],
  addOns = [],
  onSaveFormConfig,
  onPreviewLiveBooking,
}) => {
  const currentConfig: BookingFormConfig = settings.bookingFormConfig || DEFAULT_BOOKING_FORM_CONFIG;

  // Working copy in builder
  const [formConfig, setFormConfig] = useState<BookingFormConfig>({ ...currentConfig });
  const [isDirty, setIsDirty] = useState(false);
  const [builderTab, setBuilderTab] = useState<'elementor' | 'ai_prompt' | 'visual_steps' | 'templates' | 'live_preview' | 'styling'>('elementor');
  const [activeStepId, setActiveStepId] = useState<string>('dates');

  // --- TOP SUB-NAVIGATION TABS SCROLL & NAV LOGIC ---
  const tabsNavRef = useRef<HTMLDivElement>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);

  const checkTabsScroll = useCallback(() => {
    const el = tabsNavRef.current;
    if (!el) return;
    setCanScrollTabsLeft(el.scrollLeft > 4);
    setCanScrollTabsRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabsNavRef.current;
    if (!el) return;
    checkTabsScroll();
    el.addEventListener('scroll', checkTabsScroll, { passive: true });
    window.addEventListener('resize', checkTabsScroll);
    return () => {
      el.removeEventListener('scroll', checkTabsScroll);
      window.removeEventListener('resize', checkTabsScroll);
    };
  }, [checkTabsScroll]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsNavRef.current;
    if (!el) return;
    const offset = 260;
    el.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    });
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && !e.shiftKey) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // Auto-scroll active tab into view
  useEffect(() => {
    const el = tabsNavRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-tab-id="${builderTab}"]`) as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [builderTab]);

  // --- VISUAL STEPS STEP NAVIGATOR SCROLL & NAV LOGIC ---
  const stepsNavRef = useRef<HTMLDivElement>(null);
  const [canScrollStepsLeft, setCanScrollStepsLeft] = useState(false);
  const [canScrollStepsRight, setCanScrollStepsRight] = useState(false);

  const checkStepsScroll = useCallback(() => {
    const el = stepsNavRef.current;
    if (!el) return;
    setCanScrollStepsLeft(el.scrollLeft > 4);
    setCanScrollStepsRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = stepsNavRef.current;
    if (!el) return;
    checkStepsScroll();
    el.addEventListener('scroll', checkStepsScroll, { passive: true });
    window.addEventListener('resize', checkStepsScroll);
    return () => {
      el.removeEventListener('scroll', checkStepsScroll);
      window.removeEventListener('resize', checkStepsScroll);
    };
  }, [checkStepsScroll, formConfig.steps.length]);

  const scrollSteps = (direction: 'left' | 'right') => {
    const el = stepsNavRef.current;
    if (!el) return;
    const offset = 220;
    el.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    });
  };

  const handleStepsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && !e.shiftKey) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // Auto-scroll active step into view in visual steps
  useEffect(() => {
    const el = stepsNavRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-step-nav-id="${activeStepId}"]`) as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeStepId]);

  // --- PREVIEW SANDBOX STEP NAVIGATOR SCROLL LOGIC ---
  const previewStepsNavRef = useRef<HTMLDivElement>(null);
  const [canScrollPreviewLeft, setCanScrollPreviewLeft] = useState(false);
  const [canScrollPreviewRight, setCanScrollPreviewRight] = useState(false);

  const checkPreviewScroll = useCallback(() => {
    const el = previewStepsNavRef.current;
    if (!el) return;
    setCanScrollPreviewLeft(el.scrollLeft > 4);
    setCanScrollPreviewRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = previewStepsNavRef.current;
    if (!el) return;
    checkPreviewScroll();
    el.addEventListener('scroll', checkPreviewScroll, { passive: true });
    window.addEventListener('resize', checkPreviewScroll);
    return () => {
      el.removeEventListener('scroll', checkPreviewScroll);
      window.removeEventListener('resize', checkPreviewScroll);
    };
  }, [checkPreviewScroll, formConfig.steps.length]);

  const scrollPreviewSteps = (direction: 'left' | 'right') => {
    const el = previewStepsNavRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -200 : 200,
      behavior: 'smooth',
    });
  };

  const handlePreviewWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && !e.shiftKey) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // AI Prompt generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    config: BookingFormConfig;
    source: string;
    message: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Field editing modal/drawer state
  const [editingFieldStepId, setEditingFieldStepId] = useState<'dates' | 'rooms' | 'addons' | 'guest' | null>(null);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [fieldForm, setFieldForm] = useState<BookingFormField>({
    id: '',
    label: '',
    type: 'text',
    placeholder: '',
    options: [],
    required: false,
    helpText: '',
  });
  const [optionsInput, setOptionsInput] = useState('');

  // Interactive Live Preview State
  const [previewStep, setPreviewStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [previewFieldValues, setPreviewFieldValues] = useState<Record<string, any>>({});

  // Auto-scroll active preview step button into view
  useEffect(() => {
    const el = previewStepsNavRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-preview-step="${previewStep}"]`) as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [previewStep]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateConfig = (updater: (prev: BookingFormConfig) => BookingFormConfig) => {
    setFormConfig((prev) => {
      const next = updater(prev);
      return { ...next, updatedAt: new Date().toISOString() };
    });
    setIsDirty(true);
  };

  // Save changes to settings
  const handleSaveAndPublish = () => {
    onSaveFormConfig(formConfig);
    setIsDirty(false);
    showToast('Multi-step booking form successfully published to live website!');
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm('Reset the booking flow builder to standard WaveHaven factory defaults?')) {
      setFormConfig({ ...DEFAULT_BOOKING_FORM_CONFIG });
      setIsDirty(true);
      showToast('Form reset to default configuration');
    }
  };

  // Handle AI generation with one prompt
  const handleGenerateWithAI = async (promptToUse?: string) => {
    const prompt = (promptToUse || aiPrompt).trim();
    if (!prompt) {
      setAiError('Please enter a description or click one of the suggested prompts below.');
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    setAiResult(null);

    try {
      const res = await requestAIBookingForm(prompt);
      if (res.success && res.config) {
        setAiResult({
          config: res.config,
          source: res.source,
          message: res.message,
        });
        showToast('New multi-step booking template generated with AI!');
      } else {
        throw new Error('Could not generate template');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAITemplate = () => {
    if (aiResult?.config) {
      setFormConfig({ ...aiResult.config });
      setIsDirty(true);
      setBuilderTab('visual_steps');
      showToast(`Applied "${aiResult.config.name}" to the builder!`);
    }
  };

  const handleApplyPreset = (preset: BookingFormConfig) => {
    setFormConfig({ ...preset, id: 'form-config-' + Date.now() });
    setIsDirty(true);
    showToast(`Loaded "${preset.name}" preset!`);
  };

  // Step field editing
  const handleOpenAddField = (stepId: 'dates' | 'rooms' | 'addons' | 'guest') => {
    setEditingFieldStepId(stepId);
    setEditingFieldIndex(null);
    setFieldForm({
      id: `field-${Date.now()}`,
      label: '',
      type: 'text',
      placeholder: '',
      options: [],
      required: false,
      helpText: '',
      stepTarget: stepId,
    });
    setOptionsInput('');
  };

  const handleOpenEditField = (stepId: 'dates' | 'rooms' | 'addons' | 'guest', index: number) => {
    const step = formConfig.steps.find((s) => s.id === stepId);
    const field = step?.customFields?.[index];
    if (!field) return;

    setEditingFieldStepId(stepId);
    setEditingFieldIndex(index);
    setFieldForm({ ...field });
    setOptionsInput(field.options ? field.options.join(', ') : '');
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFieldStepId || !fieldForm.label.trim()) return;

    const parsedOptions = fieldForm.type === 'select'
      ? optionsInput.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const updatedField: BookingFormField = {
      ...fieldForm,
      options: parsedOptions,
      stepTarget: editingFieldStepId,
    };

    handleUpdateConfig((prev) => {
      const newSteps = prev.steps.map((step) => {
        if (step.id !== editingFieldStepId) return step;
        const currentFields = [...(step.customFields || [])];
        if (editingFieldIndex !== null && editingFieldIndex >= 0) {
          currentFields[editingFieldIndex] = updatedField;
        } else {
          currentFields.push(updatedField);
        }
        return { ...step, customFields: currentFields };
      });
      return { ...prev, steps: newSteps };
    });

    setEditingFieldStepId(null);
    setEditingFieldIndex(null);
    showToast('Custom question saved');
  };

  const handleDeleteField = (stepId: string, index: number) => {
    handleUpdateConfig((prev) => {
      const newSteps = prev.steps.map((step) => {
        if (step.id !== stepId) return step;
        const currentFields = [...(step.customFields || [])];
        currentFields.splice(index, 1);
        return { ...step, customFields: currentFields };
      });
      return { ...prev, steps: newSteps };
    });
    showToast('Custom question removed');
  };

  // Export / Import
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formConfig, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `wavehaven_booking_form_${formConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Exported form configuration as JSON');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.steps && Array.isArray(json.steps)) {
          setFormConfig(json);
          setIsDirty(true);
          showToast('Imported booking form template successfully!');
        } else {
          alert('Invalid booking form JSON schema');
        }
      } catch (err) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  // Preset prompts for 1-click AI generation
  const SUGGESTED_AI_PROMPTS = [
    {
      label: '🧘 Surf & Yoga Retreat',
      prompt: 'A 7-day Surf & Yoga Wellness retreat flow with daily vinyasa classes, organic plant-based smoothies, and dietary questions',
    },
    {
      label: '💻 Digital Nomad Coliving',
      prompt: 'Digital Nomad 30-day coliving stay with high-speed fiber desk reservation, 24/7 quiet hours agreement, and remote work questions',
    },
    {
      label: '🏄‍♂️ Beginner Wave Camp',
      prompt: 'Beginner surf camp with 5 group lessons, wetsuit sizing questions, soft-top board quiver, and surf safety waiver',
    },
    {
      label: '🌴 Weekend Social Getaway',
      prompt: 'Weekend surf escape with Saturday rooftop BBQ pass, sunset cocktails, 2 group lessons, and airport surf van pickup',
    },
    {
      label: '👑 Luxury Oceanfront Coaching',
      prompt: 'VIP private oceanfront penthouse suite with dedicated private surf instructor, seafood dinner, and arrival champagne',
    },
  ];

  const currentActiveStep = formConfig.steps.find((s) => s.id === activeStepId) || formConfig.steps[0];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/70">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                Book Stay Form Multi-Step Builder
                {isDirty && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300/80">
                    Unsaved Changes
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Customize steps, questions, and templates with AI via one prompt — no coding required.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={!isDirty}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
              isDirty
                ? 'bg-teal-600 hover:bg-teal-700 text-white active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Publish to Live Form</span>
          </button>

          <button
            type="button"
            onClick={() => setBuilderTab('live_preview')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Interactive Preview"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Preview Sandbox</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Reset to Factory Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs transition-colors"
            title="Export Form Configuration JSON"
          >
            <Download className="w-4 h-4 text-slate-500" />
          </button>

          <label
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs transition-colors cursor-pointer"
            title="Import Form Configuration JSON"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Sub-Navigation Tabs with Complete Scroll & Jump Controls */}
      <div className="space-y-2">
        {/* Navigation Control Bar: Quick Jump Dropdown & Prev/Next Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span>Section Navigator:</span>
            </span>

            {/* Direct Tab Jump Dropdown */}
            <select
              value={builderTab}
              onChange={(e) => setBuilderTab(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs focus:outline-hidden focus:border-teal-500 cursor-pointer"
            >
              {[
                { id: 'elementor', label: '1. Elementor Pro Drag & Drop (PRO)' },
                { id: 'ai_prompt', label: '2. Generate with AI (1 Prompt)' },
                { id: 'visual_steps', label: `3. Multi-Step Editor (${formConfig.steps.length} Steps)` },
                { id: 'templates', label: `4. Template Presets (${PRESET_BOOKING_FORM_TEMPLATES.length} Presets)` },
                { id: 'styling', label: '5. Branding & Notice Banner' },
                { id: 'live_preview', label: '6. Interactive Sandbox' },
              ].map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stepping controls & counter */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {(() => {
              const allTabs = ['elementor', 'ai_prompt', 'visual_steps', 'templates', 'styling', 'live_preview'] as const;
              const curIdx = allTabs.indexOf(builderTab);
              return (
                <>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Tab {curIdx + 1} of {allTabs.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (curIdx > 0) setBuilderTab(allTabs[curIdx - 1]);
                    }}
                    disabled={curIdx <= 0}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                    title="Previous Tab"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (curIdx < allTabs.length - 1) setBuilderTab(allTabs[curIdx + 1]);
                    }}
                    disabled={curIdx >= allTabs.length - 1}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                    title="Next Tab"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              );
            })()}
          </div>
        </div>

        {/* Scrollable Navigator Bar with Left / Right Chevrons */}
        <div className="relative flex items-center gap-1.5">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            disabled={!canScrollTabsLeft}
            className={`p-2 rounded-xl border transition-all shrink-0 z-10 ${
              canScrollTabsLeft
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs active:scale-95 cursor-pointer'
                : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
            }`}
            title="Scroll tabs left"
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable container with mouse wheel support */}
          <div
            ref={tabsNavRef}
            onWheel={handleTabsWheel}
            className="flex-1 flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
          >
            {[
              { id: 'elementor', label: 'Elementor Pro Drag & Drop', icon: Layout, badge: 'PRO' },
              { id: 'ai_prompt', label: 'Generate with AI (1 Prompt)', icon: Sparkles, badge: 'Smart' },
              { id: 'visual_steps', label: 'Multi-Step Editor', icon: Layers, count: formConfig.steps.length },
              { id: 'templates', label: 'Template Presets', icon: Tag, count: PRESET_BOOKING_FORM_TEMPLATES.length },
              { id: 'styling', label: 'Branding & Notice Banner', icon: Palette },
              { id: 'live_preview', label: 'Interactive Sandbox', icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = builderTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab-id={tab.id}
                  type="button"
                  onClick={() => setBuilderTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap touch-manipulation cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                      isActive ? 'bg-teal-500 text-slate-900' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            disabled={!canScrollTabsRight}
            className={`p-2 rounded-xl border transition-all shrink-0 z-10 ${
              canScrollTabsRight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs active:scale-95 cursor-pointer'
                : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
            }`}
            title="Scroll tabs right"
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB 1: GENERATE WITH AI VIA ONE PROMPT */}
      {builderTab === 'ai_prompt' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-linear-to-br from-teal-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-black uppercase tracking-wider mb-3 border border-teal-400/30">
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Single-Prompt Form Architect</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mb-2">
                Generate a Complete Multi-Step Booking System in Seconds
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-medium">
                Describe the stay or retreat package you want to offer in natural language. Our AI engine instantly creates custom step descriptions, tailored guest questions, package add-ons, and promo banners.
              </p>

              {/* Prompt Input Box */}
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Create a 7-day all-inclusive Surf & Yoga Retreat for beginners with daily vinyasa classes, wetsuit fitting questions, organic brunch plan, and airport shuttle..."
                    className="w-full bg-slate-900/90 border-2 border-teal-500/50 focus:border-teal-400 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-hidden transition-all shadow-inner"
                  />
                </div>

                {/* Suggested prompt chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    Quick Prompts:
                  </span>
                  {SUGGESTED_AI_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiPrompt(item.prompt);
                        handleGenerateWithAI(item.prompt);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-teal-400/50 transition-all active:scale-95"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {aiError && (
                  <div className="p-3 bg-rose-950/70 border border-rose-600/60 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{aiError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateWithAI()}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        <span>AI Architecting Form System...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-slate-950" />
                        <span>Generate Full Form with AI</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Powered by Google Gemini 3.8 Flash
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Result Card */}
          {aiResult && (
            <div className="bg-white rounded-3xl p-6 border-2 border-teal-500 shadow-md space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">
                      Generated Template Ready
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {aiResult.config.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleApplyAITemplate}
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply to Live Form Builder</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium">
                {aiResult.config.description}
              </p>

              {aiResult.config.bannerNotice && (
                <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs text-teal-900 font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Promo Banner: {aiResult.config.bannerNotice}</span>
                </div>
              )}

              {/* Steps breakdown preview */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Generated 5-Step Structure & Questions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                  {aiResult.config.steps.map((step, idx) => (
                    <div key={step.id} className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded-md">
                          Step {idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {step.customFields?.length || 0} fields
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 line-clamp-1">{step.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-2">{step.subtitle}</div>
                      {step.customFields && step.customFields.length > 0 && (
                        <div className="pt-1 border-t border-slate-200/60">
                          {step.customFields.map((f) => (
                            <div key={f.id} className="text-[10px] text-slate-600 truncate flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                              <span className="truncate">{f.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Flow Summary Banner */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                Currently Active on Guest Page
              </span>
              <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-2">
                <span>{formConfig.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{formConfig.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBuilderTab('visual_steps')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Inspect Steps & Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: ELEMENTOR PRO DRAG & DROP BUILDER */}
      {builderTab === 'elementor' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <ElementorProStepBuilder
            formConfig={formConfig}
            settings={settings}
            rooms={rooms}
            addOns={addOns}
            onUpdateConfig={handleUpdateConfig}
            onSaveAndPublish={handleSaveAndPublish}
            isDirty={isDirty}
          />
        </div>
      )}

      {/* TAB 2: MULTI-STEP VISUAL EDITOR */}
      {builderTab === 'visual_steps' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Elementor Pro Quick Jump Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-600 to-teal-500 flex items-center justify-center font-black text-white text-lg shadow-md shrink-0">
                E
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">Elementor Pro Drag & Drop Step Builder</h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    FEATURED
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Build steps with draggable form widgets, images, alerts, testimonials, FAQs, and custom questions.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBuilderTab('elementor')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs font-black shadow-md flex items-center gap-2 active:scale-95 transition-all shrink-0"
            >
              <Layout className="w-4 h-4" />
              <span>Launch Elementor Pro Builder</span>
            </button>
          </div>

          {/* Step Selector Horizontal Bar with Scroll & Jump Navigation */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-xs space-y-2.5">
            {/* Step Navigator Header with Direct Jump Select & Stepping Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  <span>Step Navigator:</span>
                </span>
                <select
                  value={activeStepId}
                  onChange={(e) => setActiveStepId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500 cursor-pointer shadow-2xs"
                >
                  {formConfig.steps.map((step, idx) => (
                    <option key={step.id} value={step.id}>
                      Step {idx + 1}: {step.name} ({step.customFields?.length || 0} questions)
                    </option>
                  ))}
                </select>
              </div>

              {/* Prev / Next Step Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {(() => {
                  const curIdx = formConfig.steps.findIndex((s) => s.id === activeStepId);
                  return (
                    <>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Step {curIdx + 1} of {formConfig.steps.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (curIdx > 0) setActiveStepId(formConfig.steps[curIdx - 1].id);
                        }}
                        disabled={curIdx <= 0}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                        title="Navigate to previous step"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Prev Step</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (curIdx < formConfig.steps.length - 1) setActiveStepId(formConfig.steps[curIdx + 1].id);
                        }}
                        disabled={curIdx >= formConfig.steps.length - 1}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                        title="Navigate to next step"
                      >
                        <span className="hidden sm:inline">Next Step</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Scrollable Step list with left/right scroll chevrons */}
            <div className="relative flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollSteps('left')}
                disabled={!canScrollStepsLeft}
                className={`p-2 rounded-xl border transition-all shrink-0 z-10 ${
                  canScrollStepsLeft
                    ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-2xs active:scale-95 cursor-pointer'
                    : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                }`}
                title="Scroll steps left"
                aria-label="Scroll steps left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={stepsNavRef}
                onWheel={handleStepsWheel}
                className="flex-1 flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
              >
                {formConfig.steps.map((step, idx) => {
                  const isSelected = activeStepId === step.id;
                  const fieldCount = step.customFields?.length || 0;
                  return (
                    <button
                      key={step.id}
                      data-step-nav-id={step.id}
                      type="button"
                      onClick={() => setActiveStepId(step.id)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 border whitespace-nowrap touch-manipulation cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                        isSelected ? 'bg-white text-teal-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <span>{step.name}</span>
                      {fieldCount > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                          isSelected ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-800'
                        }`}>
                          +{fieldCount} Q's
                        </span>
                      )}
                      {!step.enabled && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-300 text-slate-700">
                          Disabled
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollSteps('right')}
                disabled={!canScrollStepsRight}
                className={`p-2 rounded-xl border transition-all shrink-0 z-10 ${
                  canScrollStepsRight
                    ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-2xs active:scale-95 cursor-pointer'
                    : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                }`}
                title="Scroll steps right"
                aria-label="Scroll steps right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Step Config Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">
                  Editing Step {currentActiveStep.stepNumber} of 5
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {currentActiveStep.name} Configuration
                </h3>
              </div>

              {/* Step Enable toggle if applicable */}
              {currentActiveStep.id === 'addons' && (
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={currentActiveStep.enabled}
                    onChange={(e) => {
                      handleUpdateConfig((prev) => ({
                        ...prev,
                        steps: prev.steps.map((s) => s.id === 'addons' ? { ...s, enabled: e.target.checked } : s),
                      }));
                    }}
                    className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
                  />
                  <span>Enable Surf Add-ons & Lessons Step</span>
                </label>
              )}
            </div>

            {/* Editable Step Text Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Step Tab Label
                </label>
                <input
                  type="text"
                  value={currentActiveStep.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateConfig((prev) => ({
                      ...prev,
                      steps: prev.steps.map((s) => s.id === currentActiveStep.id ? { ...s, name: val } : s),
                    }));
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Step Badge / Header Tag
                </label>
                <input
                  type="text"
                  value={currentActiveStep.badge || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateConfig((prev) => ({
                      ...prev,
                      steps: prev.steps.map((s) => s.id === currentActiveStep.id ? { ...s, badge: val } : s),
                    }));
                  }}
                  placeholder="e.g. Step 1 of 5 or Quick Checkout"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Main Step Header Title
                </label>
                <input
                  type="text"
                  value={currentActiveStep.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateConfig((prev) => ({
                      ...prev,
                      steps: prev.steps.map((s) => s.id === currentActiveStep.id ? { ...s, title: val } : s),
                    }));
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Explanatory Subtitle / Instructions
                </label>
                <textarea
                  rows={2}
                  value={currentActiveStep.subtitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateConfig((prev) => ({
                      ...prev,
                      steps: prev.steps.map((s) => s.id === currentActiveStep.id ? { ...s, subtitle: val } : s),
                    }));
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Next Step Button Call-to-Action Text
                </label>
                <input
                  type="text"
                  value={currentActiveStep.ctaButtonText || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateConfig((prev) => ({
                      ...prev,
                      steps: prev.steps.map((s) => s.id === currentActiveStep.id ? { ...s, ctaButtonText: val } : s),
                    }));
                  }}
                  placeholder="e.g. Continue to Next Step"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            {/* Custom Questions / Fields Section */}
            {currentActiveStep.id !== 'confirmation' && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-teal-600" />
                      <span>Custom Questions & Guest Fields for this Step</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Add questions for dietary choices, wetsuit sizes, flight details, or waivers.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddField(currentActiveStep.id as any)}
                    className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                {(!currentActiveStep.customFields || currentActiveStep.customFields.length === 0) ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    No custom questions configured for this step yet. Click "Add Question" to ask guests for specific info.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentActiveStep.customFields.map((field, fIdx) => (
                      <div
                        key={field.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {field.label}
                            </span>
                            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md border border-rose-200/70">
                                Required
                              </span>
                            )}
                          </div>
                          {field.helpText && (
                            <p className="text-[11px] text-slate-500 truncate">{field.helpText}</p>
                          )}
                          {field.type === 'select' && field.options && (
                            <div className="flex items-center gap-1 flex-wrap pt-1">
                              {field.options.map((opt, oIdx) => (
                                <span key={oIdx} className="text-[9px] px-1.5 py-0.2 rounded-md bg-white text-slate-600 border border-slate-200">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditField(currentActiveStep.id as any, fIdx)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Edit question"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(currentActiveStep.id, fIdx)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATES LIBRARY */}
      {builderTab === 'templates' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-black text-slate-900 mb-1">
              Curated Multi-Step Form Presets
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Switch between pre-engineered booking flows designed for different hostel business models in 1 click.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_BOOKING_FORM_TEMPLATES.map((preset) => {
                const isCurrentlyLoaded = formConfig.name === preset.name;
                return (
                  <div
                    key={preset.id}
                    className={`p-5 rounded-3xl border-2 transition-all space-y-4 flex flex-col justify-between ${
                      isCurrentlyLoaded
                        ? 'border-teal-500 bg-teal-50/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-2xs"
                          style={{ backgroundColor: preset.themeAccentColor || '#0d9488' }}
                        >
                          {preset.heroBadgeText || 'Preset Flow'}
                        </span>
                        {isCurrentlyLoaded && (
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active in Builder
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900">{preset.name}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{preset.description}</p>

                      {preset.bannerNotice && (
                        <div className="text-[11px] p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                          {preset.bannerNotice}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">
                        {preset.steps.length} Steps • {preset.steps.reduce((acc, s) => acc + (s.customFields?.length || 0), 0)} Custom Q's
                      </span>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isCurrentlyLoaded
                            ? 'bg-slate-200 text-slate-600 cursor-default'
                            : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95 shadow-xs'
                        }`}
                      >
                        {isCurrentlyLoaded ? 'Loaded in Builder' : 'Load Template'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BRANDING & STYLING */}
      {builderTab === 'styling' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                Booking Flow Branding & Header Styling
              </h3>
              <p className="text-xs text-slate-500">
                Configure top promotional announcements, theme accent colors, and trust badges.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Flow Name (Internal & Admin View)
                </label>
                <input
                  type="text"
                  value={formConfig.name}
                  onChange={(e) => handleUpdateConfig((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hero Top Trust Badge
                </label>
                <input
                  type="text"
                  value={formConfig.heroBadgeText || ''}
                  onChange={(e) => handleUpdateConfig((prev) => ({ ...prev, heroBadgeText: e.target.value }))}
                  placeholder="e.g. Official Direct Booking Engine"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Theme Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formConfig.themeAccentColor || '#0d9488'}
                    onChange={(e) => handleUpdateConfig((prev) => ({ ...prev, themeAccentColor: e.target.value }))}
                    className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formConfig.themeAccentColor || '#0d9488'}
                    onChange={(e) => handleUpdateConfig((prev) => ({ ...prev, themeAccentColor: e.target.value }))}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Promotional Top Announcement Banner (Visible on all steps)
                </label>
                <textarea
                  rows={2}
                  value={formConfig.bannerNotice || ''}
                  onChange={(e) => handleUpdateConfig((prev) => ({ ...prev, bannerNotice: e.target.value }))}
                  placeholder="e.g. 🏄 Free surfboard quiver rental & video coaching included for all stays of 4+ nights!"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.showSavingsBadge ?? true}
                    onChange={(e) => handleUpdateConfig((prev) => ({ ...prev, showSavingsBadge: e.target.checked }))}
                    className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
                  />
                  <span>Display "Best Direct Price Guaranteed" badge in wizard header</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.requireWaiver ?? true}
                    onChange={(e) => handleUpdateConfig((prev) => ({ ...prev, requireWaiver: e.target.checked }))}
                    className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
                  />
                  <span>Enforce Watersports Liability & Quiet Hours Acknowledgement</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INTERACTIVE LIVE PREVIEW SANDBOX */}
      {builderTab === 'live_preview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider">
                  Interactive Sandbox Preview
                </span>
                <h3 className="text-base font-black text-white">
                  {formConfig.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Step through your customized flow below. Changes made in the builder update here immediately.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewStep(1)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  Restart from Step 1
                </button>
              </div>
            </div>

            {/* Sandbox Step Navigation with Full Scroll Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-[11px] font-bold text-slate-400">
                  Step {previewStep} of {formConfig.steps.length} Preview
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (previewStep > 1) setPreviewStep((previewStep - 1) as any);
                    }}
                    disabled={previewStep <= 1}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-bold transition-all flex items-center gap-1 border border-slate-700 active:scale-95"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (previewStep < formConfig.steps.length) setPreviewStep((previewStep + 1) as any);
                    }}
                    disabled={previewStep >= formConfig.steps.length}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-bold transition-all flex items-center gap-1 border border-slate-700 active:scale-95"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="relative flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollPreviewSteps('left')}
                  disabled={!canScrollPreviewLeft}
                  className={`p-1.5 rounded-xl border transition-all shrink-0 z-10 ${
                    canScrollPreviewLeft
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-teal-400 shadow-xs active:scale-95 cursor-pointer'
                      : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                  title="Scroll steps left"
                  aria-label="Scroll steps left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div
                  ref={previewStepsNavRef}
                  onWheel={handlePreviewWheel}
                  className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-600"
                >
                  {formConfig.steps.map((s, idx) => {
                    const isStepActive = previewStep === s.stepNumber;
                    return (
                      <button
                        key={s.id}
                        data-preview-step={s.stepNumber}
                        type="button"
                        onClick={() => setPreviewStep(s.stepNumber as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap touch-manipulation cursor-pointer ${
                          isStepActive
                            ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-sm'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        <span>{idx + 1}.</span>
                        <span>{s.name}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => scrollPreviewSteps('right')}
                  disabled={!canScrollPreviewRight}
                  className={`p-1.5 rounded-xl border transition-all shrink-0 z-10 ${
                    canScrollPreviewRight
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-teal-400 shadow-xs active:scale-95 cursor-pointer'
                      : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                  title="Scroll steps right"
                  aria-label="Scroll steps right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Preview Viewport */}
            <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-inner space-y-6">
              {/* Promo Banner if set */}
              {formConfig.bannerNotice && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{formConfig.bannerNotice}</span>
                </div>
              )}

              {/* Step Header */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                  {formConfig.steps[previewStep - 1]?.badge || `Step ${previewStep} of 5`}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {formConfig.steps[previewStep - 1]?.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {formConfig.steps[previewStep - 1]?.subtitle}
                </p>
              </div>

              {/* Step Mock Contents */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                {previewStep === 1 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 font-bold block mb-1">Check-in Date</span>
                        <span className="font-bold text-slate-800">Tomorrow (14:00)</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 font-bold block mb-1">Check-out Date</span>
                        <span className="font-bold text-slate-800">In 4 Days (11:00)</span>
                      </div>
                    </div>
                  </div>
                )}

                {previewStep === 2 && (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-white rounded-xl border-2 border-teal-500 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">Ocean Breeze 6-Bed Dorm</div>
                        <div className="text-slate-500 text-[11px]">Mixed Dorm • Bunk Bed with Privacy Curtain</div>
                      </div>
                      <span className="font-black text-teal-700">€28 / night</span>
                    </div>
                  </div>
                )}

                {previewStep === 3 && (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">Daily Surf Coaching & Video Analysis</div>
                        <div className="text-slate-500 text-[11px]">2 hours certified coach + wetsuit/board</div>
                      </div>
                      <span className="font-bold text-teal-700">€45 / day</span>
                    </div>
                  </div>
                )}

                {previewStep === 4 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[11px] block">Full Name</span>
                      <span className="font-bold">Mateo Silva</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[11px] block">WhatsApp Phone</span>
                      <span className="font-bold">+34 612 987 654</span>
                    </div>
                  </div>
                )}

                {previewStep === 5 && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <div className="font-black text-emerald-900 text-sm">Reservation Complete!</div>
                    <div className="text-xs text-emerald-700">Official invoice ready with QR code.</div>
                  </div>
                )}

                {/* Custom questions rendered dynamically for this step */}
                {formConfig.steps[previewStep - 1]?.customFields && formConfig.steps[previewStep - 1].customFields!.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Custom Builder Questions for this Step:
                    </span>
                    {formConfig.steps[previewStep - 1].customFields!.map((f) => (
                      <div key={f.id} className="space-y-1">
                        <label className="block text-xs font-bold text-slate-800">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        {f.type === 'text' && (
                          <input
                            type="text"
                            placeholder={f.placeholder || 'Your answer'}
                            value={previewFieldValues[f.id] || ''}
                            onChange={(e) => setPreviewFieldValues({ ...previewFieldValues, [f.id]: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                          />
                        )}
                        {f.type === 'textarea' && (
                          <textarea
                            rows={2}
                            placeholder={f.placeholder || 'Your answer'}
                            value={previewFieldValues[f.id] || ''}
                            onChange={(e) => setPreviewFieldValues({ ...previewFieldValues, [f.id]: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                          />
                        )}
                        {f.type === 'select' && (
                          <select
                            value={previewFieldValues[f.id] || ''}
                            onChange={(e) => setPreviewFieldValues({ ...previewFieldValues, [f.id]: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                          >
                            <option value="">Select an option...</option>
                            {f.options?.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        {f.type === 'checkbox' && (
                          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(previewFieldValues[f.id])}
                              onChange={(e) => setPreviewFieldValues({ ...previewFieldValues, [f.id]: e.target.checked })}
                              className="w-4 h-4 text-teal-600 rounded-md"
                            />
                            <span>{f.label}</span>
                          </label>
                        )}
                        {f.helpText && <p className="text-[10px] text-slate-400">{f.helpText}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewStep((p) => Math.max(1, p - 1) as any)}
                  disabled={previewStep === 1}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewStep((p) => Math.min(5, p + 1) as any)}
                  disabled={previewStep === 5}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                >
                  <span>{formConfig.steps[previewStep - 1]?.ctaButtonText || 'Next Step'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CUSTOM QUESTION */}
      {editingFieldStepId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingFieldIndex !== null ? 'Edit Custom Question' : 'Add Question / Field'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingFieldStepId(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveField} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question Label / Prompt *
                </label>
                <input
                  type="text"
                  required
                  value={fieldForm.label}
                  onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                  placeholder="e.g. Wetsuit Size, Dietary Needs, Flight Number"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Input Type
                  </label>
                  <select
                    value={fieldForm.type}
                    onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="text">Single-line Text</option>
                    <option value="textarea">Multi-line Textarea</option>
                    <option value="select">Dropdown Select</option>
                    <option value="checkbox">Checkbox (Waiver / Agreement)</option>
                    <option value="number">Numeric</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Requirement
                  </label>
                  <select
                    value={fieldForm.required ? 'true' : 'false'}
                    onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.value === 'true' })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="false">Optional</option>
                    <option value="true">Required (*)</option>
                  </select>
                </div>
              </div>

              {fieldForm.type === 'select' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dropdown Options (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={optionsInput}
                    onChange={(e) => setOptionsInput(e.target.value)}
                    placeholder="e.g. Small, Medium, Large, XL"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Placeholder / Sample Text
                </label>
                <input
                  type="text"
                  value={fieldForm.placeholder || ''}
                  onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                  placeholder="e.g. Vegetarian, none, Flight TP1024"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Helper / Explanatory Hint
                </label>
                <input
                  type="text"
                  value={fieldForm.helpText || ''}
                  onChange={(e) => setFieldForm({ ...fieldForm, helpText: e.target.value })}
                  placeholder="e.g. Helps our team prepare your equipment and welcome basket."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFieldStepId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
