import React, { useState, useId, useRef, useEffect, useCallback } from 'react';
import { 
  Sliders, Eye, Save, Plus, Trash2, Edit3, ArrowRight, ArrowLeft, 
  Check, Info, HelpCircle, Layers, Palette, ShieldCheck, 
  Calendar, Bed, Tag, MessageSquare, AlertCircle, Wand2, 
  ExternalLink, ChevronRight, ChevronLeft, Copy, CheckSquare, GripVertical,
  Type, AlignLeft, AlignCenter, AlignRight, ListFilter, Image as ImageIcon,
  AlertTriangle, Sparkles, Star, Minus, Smartphone, Tablet, Monitor,
  RotateCcw, FileText, Layout, X, ChevronDown, ChevronUp, Coffee,
  Waves, Sun, Zap, Award, Lock, CheckCircle2, Search, ArrowUpDown,
  Phone, Mail, Radio, Clock, ToggleRight, Upload, PenTool, Calculator, Timer, CheckCircle
} from 'lucide-react';
import { 
  BookingFormConfig, 
  BookingStepConfig, 
  FormElement, 
  FormElementType, 
  FormElementStyles,
  HostelSettings, 
  Room, 
  SurfAddOn 
} from '../../types';

interface ElementorProStepBuilderProps {
  formConfig: BookingFormConfig;
  settings: HostelSettings;
  rooms?: Room[];
  addOns?: SurfAddOn[];
  onUpdateConfig: (updater: (prev: BookingFormConfig) => BookingFormConfig) => void;
  onSaveAndPublish: () => void;
  isDirty?: boolean;
}

// Widget Catalog Definition for Elementor Pro Drawer
interface WidgetDefinition {
  type: FormElementType;
  label: string;
  category: 'form' | 'advanced' | 'content' | 'hospitality';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  defaultData: () => Partial<FormElement>;
}

const WIDGET_CATALOG: WidgetDefinition[] = [
  // ==========================================
  // REGULAR FORM INPUTS (12 Elements)
  // ==========================================
  {
    type: 'input_text',
    label: 'Text Input',
    category: 'form',
    icon: Type,
    description: 'Single-line guest input for names, flights, gear',
    badge: 'Regular',
    defaultData: () => ({
      title: 'Flight Number or Arrival Time',
      placeholder: 'e.g. Flight TP1024 arriving 14:30',
      fieldKey: `custom_text_${Date.now()}`,
      required: false,
      helpText: 'Helps us coordinate your hostel transfer and check-in schedule.',
    }),
  },
  {
    type: 'input_textarea',
    label: 'Textarea Notes',
    category: 'form',
    icon: FileText,
    description: 'Multi-line notes, requests, or dietary details',
    badge: 'Regular',
    defaultData: () => ({
      title: 'Special Requests & Dietary Requirements',
      placeholder: 'e.g. Vegetarian diet, allergic to peanuts, late check-in...',
      fieldKey: `custom_notes_${Date.now()}`,
      required: false,
      helpText: 'Shared directly with the kitchen and surf lodge team.',
    }),
  },
  {
    type: 'input_select',
    label: 'Dropdown Select',
    category: 'form',
    icon: ListFilter,
    description: 'Menu choice for wetsuits, boards, or packages',
    badge: 'Regular',
    defaultData: () => ({
      title: 'Wetsuit Thickness & Sizing',
      fieldKey: `wetsuit_size_${Date.now()}`,
      options: ['Small (3/2mm)', 'Medium (3/2mm)', 'Large (3/2mm)', 'XL (3/2mm)', 'Bringing My Own Quiver'],
      required: false,
      helpText: 'We prepare matching sanitized gear ready in your locker.',
    }),
  },
  {
    type: 'input_checkbox',
    label: 'Waiver / Checkbox',
    category: 'form',
    icon: CheckSquare,
    description: 'Safety acknowledgement, quiet hours or agreement',
    badge: 'Legal',
    defaultData: () => ({
      title: 'Watersports Safety & Surf House Quiet Hours Agreement',
      content: 'I agree to respect the 23:00 - 08:00 quiet hours, rinse sand before entering, and follow surf instructor safety instructions.',
      fieldKey: `waiver_agreement_${Date.now()}`,
      required: true,
      helpText: 'Required for all hostel residents and surf academy participants.',
    }),
  },
  {
    type: 'input_number',
    label: 'Number Stepper',
    category: 'form',
    icon: Sliders,
    description: 'Numeric counter for boards, towels, or surf days',
    badge: 'Regular',
    defaultData: () => ({
      title: 'Extra Towels or Yoga Mats Needed',
      fieldKey: `extra_qty_${Date.now()}`,
      min: 0,
      max: 10,
      defaultValue: 1,
      helpText: 'Complimentary for guests staying 3+ nights.',
    }),
  },
  {
    type: 'input_date',
    label: 'Date Selector',
    category: 'form',
    icon: Calendar,
    description: 'Specific milestone or arrival pickup date',
    badge: 'Regular',
    defaultData: () => ({
      title: 'Target Surf Lesson Date',
      fieldKey: `lesson_date_${Date.now()}`,
      required: false,
      helpText: 'Our coaches select the optimal tide window for your session.',
    }),
  },
  {
    type: 'input_phone',
    label: 'Phone & WhatsApp',
    category: 'form',
    icon: Phone,
    description: 'International number with country dial code and WhatsApp badge',
    badge: 'Regular',
    defaultData: () => ({
      title: 'WhatsApp Mobile Number',
      placeholder: '912 345 678',
      countryCode: '+351',
      fieldKey: `guest_phone_${Date.now()}`,
      required: true,
      helpText: 'We send digital front-door lock codes and morning surf tide reports via WhatsApp.',
    }),
  },
  {
    type: 'input_email',
    label: 'Email Address',
    category: 'form',
    icon: Mail,
    description: 'Validated traveler email with quick domain shortcuts',
    badge: 'Regular',
    defaultData: () => ({
      title: 'Confirmation Email Address',
      placeholder: 'surfer@example.com',
      fieldKey: `guest_email_${Date.now()}`,
      required: true,
      helpText: 'Instant booking voucher, PDF receipt, and invoice dispatched immediately.',
    }),
  },
  {
    type: 'input_radio',
    label: 'Choice Cards / Radio',
    category: 'form',
    icon: Radio,
    description: 'Interactive choice cards for surf skill, room vibe, or packages',
    badge: 'Regular',
    defaultData: () => ({
      title: 'Your Surf Skill Level',
      fieldKey: `surf_level_${Date.now()}`,
      options: [
        'Beginner (First time or whitewash pop-up)',
        'Intermediate (Green waves & angled take-offs)',
        'Advanced (Point breaks, barrels & reef spots)'
      ],
      defaultValue: 'Beginner (First time or whitewash pop-up)',
      required: true,
      helpText: 'Head coaches use this to group compatible surfers into ideal tide windows.',
    }),
  },
  {
    type: 'input_time',
    label: 'Arrival Time Window',
    category: 'form',
    icon: Clock,
    description: 'Target check-in hour or shuttle flight arrival slot',
    badge: 'Regular',
    defaultData: () => ({
      title: 'Estimated Arrival Time at Lodge',
      fieldKey: `arrival_window_${Date.now()}`,
      options: [
        'Morning Early (09:00 - 12:00)',
        'Standard Check-in (14:00 - 18:00)',
        'Sunset Arrival (18:00 - 21:00)',
        'Late Night Self-Checkin (21:00+)'
      ],
      defaultValue: 'Standard Check-in (14:00 - 18:00)',
      required: false,
      helpText: 'Lets our hosts welcome you with cold kombucha and hand over your locker key.',
    }),
  },
  {
    type: 'input_toggle',
    label: 'Switch Toggle',
    category: 'form',
    icon: ToggleRight,
    description: 'Modern interactive on/off switch for shuttle or special perks',
    badge: 'Regular',
    defaultData: () => ({
      title: 'Airport / Station Shuttle Transfer Required',
      subtitle: 'Our surf van meets you directly at terminal arrivals with board racks ready',
      fieldKey: `shuttle_required_${Date.now()}`,
      defaultValue: false,
      helpText: 'Flat €15 per passenger, billed at reception during check-in.',
    }),
  },
  {
    type: 'badge_pills',
    label: 'Multi-Tag Chips',
    category: 'form',
    icon: Tag,
    description: 'Clickable multi-select tags for dietary needs, hobbies, or surf goals',
    badge: 'Regular',
    defaultData: () => ({
      title: 'Dietary Preferences & Lodge Interests',
      fieldKey: `guest_interests_${Date.now()}`,
      badgeItems: [
        'Vegetarian',
        'Vegan',
        'Gluten-Free',
        'Sunset Yoga',
        'Remote Coworking',
        'Surf Video Analysis',
        'Beach Bonfire'
      ],
      helpText: 'Select all that apply so our kitchen and events host can prepare ahead.',
    }),
  },

  // ==========================================
  // ADVANCED ELEMENTS (5 Elements)
  // ==========================================
  {
    type: 'input_file',
    label: 'Document / ID Upload',
    category: 'advanced',
    icon: Upload,
    description: 'Dropzone for passport photo, student card, or travel insurance',
    badge: 'Advanced',
    defaultData: () => ({
      title: 'Government ID or Passport Photo',
      fieldKey: `passport_doc_${Date.now()}`,
      fileTypes: ['PDF', 'JPG', 'PNG'],
      maxFileSizeMb: 10,
      required: false,
      helpText: 'Required by national border hospitality laws; skip front desk lines upon arrival.',
    }),
  },
  {
    type: 'input_signature',
    label: 'Digital Signature Pad',
    category: 'advanced',
    icon: PenTool,
    description: 'Digital signature canvas for ocean safety waiver and house rules',
    badge: 'Advanced',
    defaultData: () => ({
      title: 'Guest Digital Signature & Ocean Waiver',
      fieldKey: `guest_signature_${Date.now()}`,
      signaturePrompt: 'I hereby confirm that I can swim 100 meters in open ocean water and agree to the hostel house rules.',
      required: true,
      helpText: 'Sign with your finger, stylus, or trackpad cursor to finalize liability waiver.',
    }),
  },
  {
    type: 'rating_stars',
    label: 'Star / Skill Rating',
    category: 'advanced',
    icon: Star,
    description: 'Interactive rating scale for surf fitness, swimming, or prior stays',
    badge: 'Advanced',
    defaultData: () => ({
      title: 'Rate Your Ocean Swimming & Fitness Stamina',
      fieldKey: `ocean_confidence_${Date.now()}`,
      rating: 4,
      max: 5,
      helpText: '1 = Beginner swimmer in calm bays, 5 = Strong open-ocean swimmer in heavy surf.',
    }),
  },
  {
    type: 'price_breakdown',
    label: 'Live Rate & Price Calculator',
    category: 'advanced',
    icon: Calculator,
    description: 'Real-time interactive investment breakdown with deposit & taxes',
    badge: 'Advanced',
    defaultData: () => ({
      title: 'Live Rate & Investment Calculator',
      currency: '€',
      basePrice: 38,
      depositPercent: 30,
      content: 'Includes daily artisan breakfast buffet, high-speed fiber coworking, and secured surfboard locker.',
      helpText: 'Lock in your booking today with only a 30% deposit; balance payable upon arrival.',
    }),
  },
  {
    type: 'countdown_timer',
    label: 'Rate Lock / Countdown Ticker',
    category: 'advanced',
    icon: Timer,
    description: 'Urgency countdown ticker locking early bird rates and held beds',
    badge: 'Advanced',
    defaultData: () => ({
      title: 'Seasonal Early-Bird Rate Reserved',
      timerMinutes: 15,
      alertType: 'tip',
      content: 'High demand dates! Your selected bed & complimentary surfboard storage are reserved for 15 minutes.',
    }),
  },

  // ==========================================
  // CONTENT & MEDIA (6 Elements)
  // ==========================================
  {
    type: 'heading',
    label: 'Heading Title',
    category: 'content',
    icon: AlignLeft,
    description: 'Section divider headline with high-contrast text',
    defaultData: () => ({
      title: 'Prepare for Your Ocean Adventure',
      subtitle: 'Personalize your stay with custom gear fitting and lodge perks',
      styles: { align: 'left', fontSize: 'xl' },
    }),
  },
  {
    type: 'text',
    label: 'Text Description',
    category: 'content',
    icon: Type,
    description: 'Informative paragraph with rich layout instructions',
    defaultData: () => ({
      content: 'Our surf camp lodge is situated 200m from the break. We offer daily sunset yoga, high-speed fiber internet for remote workers, and secure oceanfront board storage.',
      styles: { align: 'left', fontSize: 'base' },
    }),
  },
  {
    type: 'image',
    label: 'Image Banner',
    category: 'content',
    icon: ImageIcon,
    description: 'Atmospheric photograph of the beach or hostel facilities',
    defaultData: () => ({
      title: 'Sunset Surf & Social Terrace',
      imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
      content: 'Relax with fellow travelers on our ocean-facing panoramic sun deck.',
    }),
  },
  {
    type: 'alert',
    label: 'Notice / Alert Box',
    category: 'content',
    icon: AlertTriangle,
    description: 'Highlighted promo, seasonal notice, or travel tip',
    badge: 'Notice',
    defaultData: () => ({
      title: 'Direct Booking Exclusive Perk Included',
      content: 'All guests booking via this official portal receive free surfboard rack storage and complimentary welcome smoothie on arrival!',
      alertType: 'tip',
    }),
  },
  {
    type: 'divider',
    label: 'Divider & Spacer',
    category: 'content',
    icon: Minus,
    description: 'Clean visual separator line between questionnaire blocks',
    defaultData: () => ({
      styles: { borderStyle: 'solid', padding: 'md' },
    }),
  },
  {
    type: 'button',
    label: 'Action / Info Button',
    category: 'content',
    icon: ExternalLink,
    description: 'External link to surf forecast, hostel guide, or map',
    defaultData: () => ({
      buttonText: 'View Today Surf Webcam & Wind Forecast',
      buttonUrl: 'https://magicseaweed.com',
      styles: { align: 'left' },
    }),
  },

  // ==========================================
  // HOSPITALITY & SOCIAL (3 Elements)
  // ==========================================
  {
    type: 'icon_box',
    label: 'Perk / Feature Box',
    category: 'hospitality',
    icon: Sparkles,
    description: 'Boutique amenity highlight card with icon and description',
    badge: 'Perk',
    defaultData: () => ({
      title: 'High-Speed Fiber Wifi & Ocean Coworking',
      content: 'Dedicated quiet pods with 500 Mbps symmetrical fiber, ergonomic desks, and specialty espresso on tap.',
      icon: 'Waves',
    }),
  },
  {
    type: 'testimonial',
    label: 'Guest Review',
    category: 'hospitality',
    icon: Star,
    description: 'Social proof quote with 5-star rating and traveler badge',
    defaultData: () => ({
      content: 'The vibe at WaveHaven is unmatched! Super clean dorms, world-class coaching, and healthy communal dinners every night.',
      author: 'Chloe M., London UK • Stayed 10 nights',
      rating: 5,
    }),
  },
  {
    type: 'faq',
    label: 'FAQ Accordion',
    category: 'hospitality',
    icon: HelpCircle,
    description: 'Interactive expandable Q&A addressing common traveler questions',
    defaultData: () => ({
      title: 'Common Questions About Stays & Lessons',
      faqItems: [
        { question: 'What time are surf lessons held?', answer: 'Lessons depend on daily tides. Typically morning session is 09:30 and afternoon session is 14:30.' },
        { question: 'Is breakfast included in all stays?', answer: 'Yes! Organic buffet breakfast with fresh bread, fruit, and artisanal coffee is included every morning from 08:00 to 10:30.' },
        { question: 'Can I store my own surfboard securely?', answer: 'Absolutely. We provide dedicated locked board racks and warm wetsuit wash stations at no extra cost.' },
      ],
    }),
  },
];

export const ElementorProStepBuilder: React.FC<ElementorProStepBuilderProps> = ({
  formConfig,
  settings,
  rooms = [],
  addOns = [],
  onUpdateConfig,
  onSaveAndPublish,
  isDirty = false,
}) => {
  // Active step selected in the Elementor builder
  const [activeStepId, setActiveStepId] = useState<string>(formConfig.steps[0]?.id || 'dates');
  
  // Element selection & inspector state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'content' | 'style' | 'advanced'>('content');
  
  // Left sidebar category filter & search
  const [widgetFilter, setWidgetFilter] = useState<'all' | 'form' | 'advanced' | 'content' | 'hospitality'>('all');
  const [widgetSearch, setWidgetSearch] = useState<string>('');
  
  // Responsive preview mode (Elementor top bar switcher)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewPureMode, setIsPreviewPureMode] = useState<boolean>(false);
  
  // Tablet & Mobile responsive workspace mode ('split' | 'canvas' | 'dock')
  const [builderLayoutMode, setBuilderLayoutMode] = useState<'split' | 'canvas' | 'dock'>('split');
  
  // Drag & drop live visual state
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState<boolean>(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingWidgetType, setDraggingWidgetType] = useState<FormElementType | null>(null);
  const [internalDragIndex, setInternalDragIndex] = useState<number | null>(null);

  // New Custom Step Modal State
  const [showAddStepModal, setShowAddStepModal] = useState<boolean>(false);
  const [newStepName, setNewStepName] = useState<string>('');
  const [newStepTitle, setNewStepTitle] = useState<string>('');
  const [newStepSubtitle, setNewStepSubtitle] = useState<string>('');
  const [newStepPlacement, setNewStepPlacement] = useState<string>('after_rooms');
  const [newStepIcon, setNewStepIcon] = useState<string>('ShieldCheck');

  // Step Settings Drawer
  const [showStepSettings, setShowStepSettings] = useState<boolean>(false);

  // --- STEP SELECTOR & REORDER RIBBON SCROLL & NAV LOGIC ---
  const stepsRibbonRef = useRef<HTMLDivElement>(null);
  const [canScrollRibbonLeft, setCanScrollRibbonLeft] = useState(false);
  const [canScrollRibbonRight, setCanScrollRibbonRight] = useState(false);

  const checkRibbonScroll = useCallback(() => {
    const el = stepsRibbonRef.current;
    if (!el) return;
    setCanScrollRibbonLeft(el.scrollLeft > 4);
    setCanScrollRibbonRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = stepsRibbonRef.current;
    if (!el) return;
    checkRibbonScroll();
    el.addEventListener('scroll', checkRibbonScroll, { passive: true });
    window.addEventListener('resize', checkRibbonScroll);
    return () => {
      el.removeEventListener('scroll', checkRibbonScroll);
      window.removeEventListener('resize', checkRibbonScroll);
    };
  }, [checkRibbonScroll, formConfig.steps.length]);

  const scrollRibbon = (direction: 'left' | 'right') => {
    const el = stepsRibbonRef.current;
    if (!el) return;
    const distance = 240;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const handleRibbonWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && !e.shiftKey) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // Auto-scroll selected step into view
  useEffect(() => {
    const el = stepsRibbonRef.current;
    if (!el) return;
    const activeEl = el.querySelector(`[data-step-button-id="${activeStepId}"]`) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeStepId]);

  // Active step object
  const currentStep = formConfig.steps.find((s) => s.id === activeStepId) || formConfig.steps[0];
  const stepElements: FormElement[] = currentStep?.elements || [];

  // Selected element object
  const selectedElement = stepElements.find((el) => el.id === selectedElementId) || null;

  // Filtered widget catalog
  const filteredWidgets = WIDGET_CATALOG.filter((w) => {
    const matchesCat = widgetFilter === 'all' || w.category === widgetFilter;
    const matchesSearch = !widgetSearch || 
      w.label.toLowerCase().includes(widgetSearch.toLowerCase()) || 
      w.description.toLowerCase().includes(widgetSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Helper to add element to current step
  const handleAddElement = (type: FormElementType, atIndex?: number) => {
    const def = WIDGET_CATALOG.find((w) => w.type === type);
    const newElement: FormElement = {
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      ...(def ? def.defaultData() : {}),
    };

    onUpdateConfig((prev) => {
      const updatedSteps = prev.steps.map((step) => {
        if (step.id !== activeStepId) return step;
        const currentList = [...(step.elements || [])];
        if (atIndex !== undefined && atIndex >= 0 && atIndex <= currentList.length) {
          currentList.splice(atIndex, 0, newElement);
        } else {
          currentList.push(newElement);
        }
        return { ...step, elements: currentList };
      });
      return { ...prev, steps: updatedSteps };
    });

    setSelectedElementId(newElement.id);
  };

  // Helper to update selected element properties
  const handleUpdateElement = (elementId: string, updates: Partial<FormElement>) => {
    onUpdateConfig((prev) => {
      const updatedSteps = prev.steps.map((step) => {
        if (step.id !== activeStepId) return step;
        const updatedElements = (step.elements || []).map((el) => {
          if (el.id !== elementId) return el;
          return { ...el, ...updates };
        });
        return { ...step, elements: updatedElements };
      });
      return { ...prev, steps: updatedSteps };
    });
  };

  // Helper to duplicate an element
  const handleDuplicateElement = (elementId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const elToClone = stepElements.find((el) => el.id === elementId);
    if (!elToClone) return;

    const cloned: FormElement = {
      ...JSON.parse(JSON.stringify(elToClone)),
      id: `el_${Date.now()}_clone`,
      title: elToClone.title ? `${elToClone.title} (Copy)` : undefined,
      fieldKey: elToClone.fieldKey ? `${elToClone.fieldKey}_copy` : undefined,
    };

    const idx = stepElements.findIndex((el) => el.id === elementId);
    onUpdateConfig((prev) => {
      const updatedSteps = prev.steps.map((step) => {
        if (step.id !== activeStepId) return step;
        const currentList = [...(step.elements || [])];
        currentList.splice(idx + 1, 0, cloned);
        return { ...step, elements: currentList };
      });
      return { ...prev, steps: updatedSteps };
    });

    setSelectedElementId(cloned.id);
  };

  // Helper to delete an element
  const handleDeleteElement = (elementId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onUpdateConfig((prev) => {
      const updatedSteps = prev.steps.map((step) => {
        if (step.id !== activeStepId) return step;
        return {
          ...step,
          elements: (step.elements || []).filter((el) => el.id !== elementId),
        };
      });
      return { ...prev, steps: updatedSteps };
    });

    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  // Reorder elements via Drag and Drop
  const handleMoveElement = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    onUpdateConfig((prev) => {
      const updatedSteps = prev.steps.map((step) => {
        if (step.id !== activeStepId) return step;
        const list = [...(step.elements || [])];
        const [moved] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, moved);
        return { ...step, elements: list };
      });
      return { ...prev, steps: updatedSteps };
    });
  };

  // Create a brand new Custom Step
  const handleCreateCustomStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepName.trim()) return;

    const customStepId = `step_custom_${Date.now()}`;
    const newStep: BookingStepConfig = {
      id: customStepId,
      stepNumber: formConfig.steps.length + 1,
      name: newStepName.trim(),
      title: newStepTitle.trim() || newStepName.trim(),
      subtitle: newStepSubtitle.trim() || 'Please complete this step before proceeding.',
      badge: `Step Custom`,
      enabled: true,
      isCustomStep: true,
      iconName: newStepIcon,
      ctaButtonText: 'Continue to Next Step',
      elements: [
        {
          id: `el_init_head_${Date.now()}`,
          type: 'heading',
          title: newStepTitle.trim() || newStepName.trim(),
          subtitle: newStepSubtitle.trim() || 'Tailor your stay with our team',
          styles: { align: 'left', fontSize: 'xl' },
        },
        {
          id: `el_init_alert_${Date.now()}`,
          type: 'alert',
          title: 'Guest Experience Customization',
          content: 'The preferences you select here are automatically sent to our guest relations host.',
          alertType: 'info',
        },
      ],
    };

    onUpdateConfig((prev) => {
      const currentSteps = [...prev.steps];
      let insertIndex = currentSteps.length - 1; // Default before confirmation

      if (newStepPlacement === 'after_dates') {
        const idx = currentSteps.findIndex((s) => s.id === 'dates');
        if (idx !== -1) insertIndex = idx + 1;
      } else if (newStepPlacement === 'after_rooms') {
        const idx = currentSteps.findIndex((s) => s.id === 'rooms');
        if (idx !== -1) insertIndex = idx + 1;
      } else if (newStepPlacement === 'after_addons') {
        const idx = currentSteps.findIndex((s) => s.id === 'addons');
        if (idx !== -1) insertIndex = idx + 1;
      } else if (newStepPlacement === 'after_guest') {
        const idx = currentSteps.findIndex((s) => s.id === 'guest');
        if (idx !== -1) insertIndex = idx + 1;
      }

      currentSteps.splice(insertIndex, 0, newStep);

      // Re-number steps sequentially
      const renumbered = currentSteps.map((step, idx) => ({
        ...step,
        stepNumber: idx + 1,
        badge: `Step ${idx + 1} of ${currentSteps.length}`,
      }));

      return { ...prev, steps: renumbered };
    });

    setActiveStepId(customStepId);
    setShowAddStepModal(false);
    setNewStepName('');
    setNewStepTitle('');
    setNewStepSubtitle('');
  };

  // Delete an entire custom step
  const handleDeleteCustomStep = (stepId: string) => {
    if (!window.confirm('Are you sure you want to delete this custom step and all its elements?')) return;
    onUpdateConfig((prev) => {
      const remaining = prev.steps.filter((s) => s.id !== stepId);
      const renumbered = remaining.map((step, idx) => ({
        ...step,
        stepNumber: idx + 1,
        badge: `Step ${idx + 1} of ${remaining.length}`,
      }));
      return { ...prev, steps: renumbered };
    });

    setActiveStepId(formConfig.steps[0]?.id || 'dates');
    setSelectedElementId(null);
  };

  // Reorder steps left/right
  const handleShiftStep = (stepIndex: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? stepIndex - 1 : stepIndex + 1;
    if (targetIndex < 0 || targetIndex >= formConfig.steps.length) return;

    onUpdateConfig((prev) => {
      const steps = [...prev.steps];
      const [moved] = steps.splice(stepIndex, 1);
      steps.splice(targetIndex, 0, moved);

      const renumbered = steps.map((s, idx) => ({
        ...s,
        stepNumber: idx + 1,
        badge: `Step ${idx + 1} of ${steps.length}`,
      }));

      return { ...prev, steps: renumbered };
    });
  };

  return (
    <div className="space-y-4">
      {/* TOP CONTROL BAR: ELEMENTOR BRANDED HEADER */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-600 to-teal-500 flex items-center justify-center font-black text-white text-lg shadow-md ring-2 ring-white/10 shrink-0">
            <span>E</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                Elementor Pro Step Builder
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PRO DRAG & DROP
              </span>
              {isDirty && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 animate-pulse">
                  Unsaved Draft
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Drag widgets onto steps or build custom booking steps with real-time responsive styling.
            </p>
          </div>
        </div>

        {/* Right Controls: Device Mode, Add Step, Publish */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
          {/* Device Preview Switchers */}
          <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-lg transition-colors ${
                previewDevice === 'desktop' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('tablet')}
              className={`p-1.5 rounded-lg transition-colors ${
                previewDevice === 'tablet' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-lg transition-colors ${
                previewDevice === 'mobile' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile View (390px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Preview Toggle */}
          <button
            type="button"
            onClick={() => setIsPreviewPureMode(!isPreviewPureMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              isPreviewPureMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Clean Guest Preview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isPreviewPureMode ? 'Exit Preview' : 'Clean Preview'}</span>
          </button>

          {/* Add Step Button */}
          <button
            type="button"
            onClick={() => setShowAddStepModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Step</span>
          </button>

          {/* Publish Button */}
          <button
            type="button"
            onClick={onSaveAndPublish}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Publish Form</span>
          </button>
        </div>
      </div>

      {/* STEP SELECTOR & REORDER RIBBON WITH COMPLETE SCROLL & JUMP NAVIGATION */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-xs space-y-2.5">
        {/* Ribbon Upper Control Bar: Step Quick Jump & Stepping Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Step Navigator:</span>
            </span>

            {/* Direct Step Jump Dropdown */}
            <select
              value={activeStepId}
              onChange={(e) => {
                setActiveStepId(e.target.value);
                setSelectedElementId(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500 cursor-pointer shadow-2xs"
            >
              {formConfig.steps.map((step, idx) => (
                <option key={step.id} value={step.id}>
                  Step {idx + 1}: {step.name} ({step.elements?.length || 0} widgets)
                </option>
              ))}
            </select>
          </div>

          {/* Stepping controls & counter */}
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
                      if (curIdx > 0) {
                        setActiveStepId(formConfig.steps[curIdx - 1].id);
                        setSelectedElementId(null);
                      }
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
                      if (curIdx < formConfig.steps.length - 1) {
                        setActiveStepId(formConfig.steps[curIdx + 1].id);
                        setSelectedElementId(null);
                      }
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
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollRibbon('left')}
            disabled={!canScrollRibbonLeft}
            className={`p-2 rounded-xl border transition-all shrink-0 z-10 ${
              canScrollRibbonLeft
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs active:scale-95 cursor-pointer'
                : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
            }`}
            title="Scroll steps left"
            aria-label="Scroll steps left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable ribbon container with wheel scroll */}
          <div
            ref={stepsRibbonRef}
            onWheel={handleRibbonWheel}
            className="flex-1 flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
          >
            {formConfig.steps.map((step, idx) => {
              const isSelected = activeStepId === step.id;
              const elementCount = step.elements?.length || 0;
              return (
                <div key={step.id} className="relative group/step flex items-center shrink-0">
                  <button
                    data-step-button-id={step.id}
                    type="button"
                    onClick={() => {
                      setActiveStepId(step.id);
                      setSelectedElementId(null);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap touch-manipulation cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-teal-500/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                      isSelected ? 'bg-teal-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[140px]">{step.name}</span>
                    {elementCount > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                        isSelected ? 'bg-slate-800 text-teal-300' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {elementCount} {elementCount === 1 ? 'widget' : 'widgets'}
                      </span>
                    )}
                    {step.isCustomStep && (
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-rose-100 text-rose-700">
                        Custom
                      </span>
                    )}
                  </button>

                  {/* Step Shift / Reorder Hover Controls */}
                  <div className="hidden group-hover/step:flex items-center absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-1.5 py-0.5 shadow-md border border-slate-700 gap-1 z-20">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShiftStep(idx, 'left');
                        }}
                        className="text-slate-300 hover:text-teal-300 p-0.5"
                        title="Move step left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    )}
                    {idx < formConfig.steps.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShiftStep(idx, 'right');
                        }}
                        className="text-slate-300 hover:text-teal-300 p-0.5"
                        title="Move step right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {step.isCustomStep && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomStep(step.id);
                        }}
                        className="text-rose-400 hover:text-rose-200 p-0.5 ml-0.5"
                        title="Delete step"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setShowAddStepModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border border-dashed border-teal-400 text-teal-700 bg-teal-50/60 hover:bg-teal-100/80 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Step</span>
            </button>
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollRibbon('right')}
            disabled={!canScrollRibbonRight}
            className={`p-2 rounded-xl border transition-all shrink-0 z-10 ${
              canScrollRibbonRight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs active:scale-95 cursor-pointer'
                : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
            }`}
            title="Scroll steps right"
            aria-label="Scroll steps right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TABLET / MOBILE WORKSPACE MODE SWITCHER */}
      <div className="lg:hidden flex flex-wrap items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-2xl border border-slate-800 text-xs font-bold shadow-sm gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-slate-300 font-extrabold">Tablet Workspace View:</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            id="tablet-view-split-btn"
            onClick={() => setBuilderLayoutMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              builderLayoutMode === 'split' ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Split View
          </button>
          <button
            type="button"
            id="tablet-view-canvas-btn"
            onClick={() => setBuilderLayoutMode('canvas')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              builderLayoutMode === 'canvas' ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Canvas View
          </button>
          <button
            type="button"
            id="tablet-view-dock-btn"
            onClick={() => setBuilderLayoutMode('dock')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              builderLayoutMode === 'dock' ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            {selectedElement ? 'Inspector' : 'Widgets'}
          </button>
        </div>
      </div>

      {/* MAIN BUILDER WORKSPACE: SIDEBAR (ELEMENTOR DOCK) + CANVAS */}
      <div className={`grid grid-cols-1 ${
        builderLayoutMode === 'split' ? 'md:grid-cols-12' : ''
      } lg:grid-cols-12 gap-5 items-start`}>
        {/* LEFT DOCK: ELEMENTOR SIDEBAR */}
        <div className={`${
          builderLayoutMode === 'canvas' ? 'hidden lg:flex' : 'flex'
        } ${
          builderLayoutMode === 'split' ? 'md:col-span-5 lg:col-span-4' : 'col-span-1 lg:col-span-4'
        } bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex-col max-h-[860px]`}>
          {/* DOCK TOP BAR */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            {selectedElement ? (
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => setSelectedElementId(null)}
                  className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Elements</span>
                </button>
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider truncate max-w-[150px]">
                  {selectedElement.type.replace('_', ' ')}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-black tracking-wider uppercase text-slate-300">
                    Elementor Widgets
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {filteredWidgets.length} Available
                </span>
              </div>
            )}
          </div>

          {/* DOCK CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {/* MODE A: WIDGET DRAWER (When no element is selected) */}
            {!selectedElement && (
              <div className="space-y-4">
                {/* Search Widgets */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={widgetSearch}
                    onChange={(e) => setWidgetSearch(e.target.value)}
                    placeholder="Search widget by name..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-2xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden"
                  />
                  {widgetSearch && (
                    <button
                      type="button"
                      onClick={() => setWidgetSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Category Pills with horizontal mouse wheel support */}
                <div 
                  onWheel={(e) => {
                    if (e.deltaY !== 0 && !e.shiftKey) {
                      e.currentTarget.scrollLeft += e.deltaY;
                    }
                  }}
                  className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent hover:scrollbar-thumb-slate-700"
                >
                  {[
                    { id: 'all', label: `All (${WIDGET_CATALOG.length})` },
                    { id: 'form', label: 'Regular Inputs' },
                    { id: 'advanced', label: 'Advanced' },
                    { id: 'content', label: 'Content' },
                    { id: 'hospitality', label: 'Perks & Social' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setWidgetFilter(cat.id as any)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors ${
                        widgetFilter === cat.id
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Drag instruction notice */}
                <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    <strong className="text-slate-200">Drag</strong> any widget to the canvas, or click <strong className="text-teal-300">(+)</strong> to insert.
                  </span>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredWidgets.map((w) => {
                    const Icon = w.icon;
                    return (
                      <div
                        key={w.type}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', w.type);
                          e.dataTransfer.effectAllowed = 'copy';
                          setDraggingWidgetType(w.type);
                        }}
                        onDragEnd={() => {
                          setDraggingWidgetType(null);
                        }}
                        className="group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-800/90 hover:border-teal-500/70 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:-translate-y-0.5 select-none"
                      >
                        {w.badge && (
                          <span className="absolute top-1.5 right-1.5 text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                            {w.badge}
                          </span>
                        )}

                        <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-teal-500/20 text-slate-300 group-hover:text-teal-400 flex items-center justify-center mb-2 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>

                        <span className="text-xs font-bold text-slate-200 group-hover:text-white leading-tight">
                          {w.label}
                        </span>

                        {/* Quick 1-click add button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddElement(w.type);
                          }}
                          className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-teal-600 text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                          title="Click to insert at bottom of step"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODE B: ELEMENT INSPECTOR (When an element is selected) */}
            {selectedElement && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* 3 Inspector Tabs: Content, Style, Advanced */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInspectorTab('content')}
                    className={`py-1.5 text-xs font-bold rounded-xl transition-colors ${
                      inspectorTab === 'content' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorTab('style')}
                    className={`py-1.5 text-xs font-bold rounded-xl transition-colors ${
                      inspectorTab === 'style' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Style
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorTab('advanced')}
                    className={`py-1.5 text-xs font-bold rounded-xl transition-colors ${
                      inspectorTab === 'advanced' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Advanced
                  </button>
                </div>

                {/* TAB 1: CONTENT */}
                {inspectorTab === 'content' && (
                  <div className="space-y-3.5 text-xs">
                    {/* Widget Title / Question Label */}
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Widget Title / Label
                      </label>
                      <input
                        type="text"
                        value={selectedElement.title || ''}
                        onChange={(e) => handleUpdateElement(selectedElement.id, { title: e.target.value })}
                        placeholder="e.g. Wetsuit Sizing or Arrival Note"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Subtitle / Description if applicable */}
                    {['heading', 'text', 'alert', 'icon_box', 'image'].includes(selectedElement.type) && (
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Subtitle / Supporting Content
                        </label>
                        <textarea
                          rows={3}
                          value={selectedElement.content || selectedElement.subtitle || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateElement(selectedElement.id, { content: val, subtitle: val });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* Form Input Specific Controls */}
                    {selectedElement.type.startsWith('input_') && (
                      <>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Placeholder Text
                          </label>
                          <input
                            type="text"
                            value={selectedElement.placeholder || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { placeholder: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Helper Hint Text
                          </label>
                          <input
                            type="text"
                            value={selectedElement.helpText || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { helpText: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>

                        {/* Select Options Manager */}
                        {selectedElement.type === 'input_select' && (
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">
                              Dropdown Options (Comma-separated)
                            </label>
                            <textarea
                              rows={3}
                              value={selectedElement.options ? selectedElement.options.join(', ') : ''}
                              onChange={(e) => {
                                const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                handleUpdateElement(selectedElement.id, { options: arr });
                              }}
                              placeholder="Small, Medium, Large, XL"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                            />
                          </div>
                        )}

                        {/* Required Toggle */}
                        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <span className="font-bold text-slate-300">Required Field</span>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedElement.required)}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { required: e.target.checked })}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-800 border-slate-700"
                          />
                        </div>

                        {/* Internal Field Key */}
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Internal Field Key (for Guest Record)
                          </label>
                          <input
                            type="text"
                            value={selectedElement.fieldKey || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { fieldKey: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                      </>
                    )}

                    {/* Image URL & Alt */}
                    {selectedElement.type === 'image' && (
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Image Web URL
                        </label>
                        <input
                          type="text"
                          value={selectedElement.imageUrl || ''}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { imageUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* Alert Type */}
                    {selectedElement.type === 'alert' && (
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Alert Banner Tone
                        </label>
                        <select
                          value={selectedElement.alertType || 'info'}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { alertType: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                        >
                          <option value="tip">Green (Tip / Highlight)</option>
                          <option value="info">Blue (Information)</option>
                          <option value="warning">Amber (Warning)</option>
                          <option value="success">Teal (Success)</option>
                        </select>
                      </div>
                    )}

                    {/* Button Link */}
                    {selectedElement.type === 'button' && (
                      <>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Button Text
                          </label>
                          <input
                            type="text"
                            value={selectedElement.buttonText || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { buttonText: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Target URL (or #anchor)
                          </label>
                          <input
                            type="text"
                            value={selectedElement.buttonUrl || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { buttonUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                      </>
                    )}

                    {/* Phone Specific Controls */}
                    {selectedElement.type === 'input_phone' && (
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Default Country Dial Code
                        </label>
                        <input
                          type="text"
                          value={selectedElement.countryCode || '+351'}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { countryCode: e.target.value })}
                          placeholder="+351"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* Radio Options Controls */}
                    {selectedElement.type === 'input_radio' && (
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Radio Option Cards (Comma-separated)
                        </label>
                        <textarea
                          rows={3}
                          value={selectedElement.options ? selectedElement.options.join(', ') : ''}
                          onChange={(e) => {
                            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            handleUpdateElement(selectedElement.id, { options: arr });
                          }}
                          placeholder="Beginner, Intermediate, Advanced"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* Time Window Options */}
                    {selectedElement.type === 'input_time' && (
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Arrival Time Slots (Comma-separated)
                        </label>
                        <textarea
                          rows={3}
                          value={selectedElement.options ? selectedElement.options.join(', ') : ''}
                          onChange={(e) => {
                            const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            handleUpdateElement(selectedElement.id, { options: arr });
                          }}
                          placeholder="Morning (09:00 - 12:00), Afternoon (14:00 - 18:00), Evening (18:00 - 21:00)"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* Toggle Switch Controls */}
                    {selectedElement.type === 'input_toggle' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Switch Subtitle / Details
                          </label>
                          <input
                            type="text"
                            value={selectedElement.subtitle || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { subtitle: e.target.value })}
                            placeholder="e.g. Shared transfer €15/person"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <span className="font-bold text-slate-300">Default Turned On</span>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedElement.defaultValue)}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { defaultValue: e.target.checked })}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-800 border-slate-700"
                          />
                        </div>
                      </div>
                    )}

                    {/* Multi-Tag Chips (badge_pills) */}
                    {selectedElement.type === 'badge_pills' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Tag Items (Comma-separated)
                          </label>
                          <textarea
                            rows={3}
                            value={selectedElement.badgeItems ? selectedElement.badgeItems.join(', ') : ''}
                            onChange={(e) => {
                              const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                              handleUpdateElement(selectedElement.id, { badgeItems: arr });
                            }}
                            placeholder="Vegetarian, Vegan, Gluten-Free, Yoga, Surf Video Analysis"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Helper Hint Text
                          </label>
                          <input
                            type="text"
                            value={selectedElement.helpText || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { helpText: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Internal Field Key
                          </label>
                          <input
                            type="text"
                            value={selectedElement.fieldKey || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { fieldKey: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* File Upload Controls */}
                    {selectedElement.type === 'input_file' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Max File Size (MB)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={selectedElement.maxFileSizeMb || 10}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { maxFileSizeMb: Number(e.target.value) || 10 })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Accepted File Extensions (Comma-separated)
                          </label>
                          <input
                            type="text"
                            value={selectedElement.fileTypes ? selectedElement.fileTypes.join(', ') : 'PDF, JPG, PNG'}
                            onChange={(e) => {
                              const arr = e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
                              handleUpdateElement(selectedElement.id, { fileTypes: arr });
                            }}
                            placeholder="PDF, JPG, PNG"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* Digital Signature Controls */}
                    {selectedElement.type === 'input_signature' && (
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Legal Waiver / Declaration Prompt
                        </label>
                        <textarea
                          rows={3}
                          value={selectedElement.signaturePrompt || ''}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { signaturePrompt: e.target.value })}
                          placeholder="I hereby acknowledge ocean risk guidelines..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* Star Rating Controls */}
                    {selectedElement.type === 'rating_stars' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Maximum Stars / Scale
                          </label>
                          <select
                            value={selectedElement.max || 5}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { max: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          >
                            <option value={5}>5 Stars (Standard Scale)</option>
                            <option value={10}>10 Points (Detailed Scale)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Default Star Value
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={selectedElement.max || 5}
                            value={selectedElement.rating || 4}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { rating: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Helper Hint Text
                          </label>
                          <input
                            type="text"
                            value={selectedElement.helpText || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { helpText: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">
                            Internal Field Key
                          </label>
                          <input
                            type="text"
                            value={selectedElement.fieldKey || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { fieldKey: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* Price Breakdown Controls */}
                    {selectedElement.type === 'price_breakdown' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Currency Symbol</label>
                            <input
                              type="text"
                              value={selectedElement.currency || '€'}
                              onChange={(e) => handleUpdateElement(selectedElement.id, { currency: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Base Price / Night</label>
                            <input
                              type="number"
                              value={selectedElement.basePrice || 38}
                              onChange={(e) => handleUpdateElement(selectedElement.id, { basePrice: Number(e.target.value) })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Required Deposit Percentage (%)</label>
                          <input
                            type="number"
                            min={10}
                            max={100}
                            value={selectedElement.depositPercent || 30}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { depositPercent: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Included Amenities Description</label>
                          <textarea
                            rows={2}
                            value={selectedElement.content || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { content: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* Countdown Timer Controls */}
                    {selectedElement.type === 'countdown_timer' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Hold Duration (Minutes)</label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={selectedElement.timerMinutes || 15}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { timerMinutes: Number(e.target.value) || 15 })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Urgency Notice Message</label>
                          <textarea
                            rows={2}
                            value={selectedElement.content || ''}
                            onChange={(e) => handleUpdateElement(selectedElement.id, { content: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: STYLE */}
                {inspectorTab === 'style' && (
                  <div className="space-y-3.5 text-xs">
                    {/* Alignment */}
                    <div>
                      <label className="block text-slate-400 font-bold mb-1.5">
                        Text Alignment
                      </label>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => handleUpdateElement(selectedElement.id, {
                              styles: { ...(selectedElement.styles || {}), align }
                            })}
                            className={`py-1.5 rounded-lg flex items-center justify-center capitalize font-bold transition-colors ${
                              (selectedElement.styles?.align || 'left') === align
                                ? 'bg-teal-500 text-slate-950'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                            {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                            {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Typography Scale
                      </label>
                      <select
                        value={selectedElement.styles?.fontSize || 'base'}
                        onChange={(e) => handleUpdateElement(selectedElement.id, {
                          styles: { ...(selectedElement.styles || {}), fontSize: e.target.value as any }
                        })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                      >
                        <option value="sm">Small (Compact)</option>
                        <option value="base">Standard (16px)</option>
                        <option value="lg">Subheading (18px)</option>
                        <option value="xl">Display Headline (20px)</option>
                        <option value="2xl">Hero Title (24px)</option>
                      </select>
                    </div>

                    {/* Card Background Tint */}
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Container Tint
                      </label>
                      <select
                        value={selectedElement.styles?.bgColor || 'default'}
                        onChange={(e) => handleUpdateElement(selectedElement.id, {
                          styles: { ...(selectedElement.styles || {}), bgColor: e.target.value }
                        })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                      >
                        <option value="default">Default Neutral Card</option>
                        <option value="teal_soft">Teal Soft (#f0fdfa)</option>
                        <option value="amber_warm">Warm Amber (#fffbeb)</option>
                        <option value="rose_subtle">Rose Subtle (#fff1f2)</option>
                        <option value="slate_pure">Pure Crisp White</option>
                      </select>
                    </div>

                    {/* Corner Radius */}
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Border Radius
                      </label>
                      <select
                        value={selectedElement.styles?.borderRadius || 'md'}
                        onChange={(e) => handleUpdateElement(selectedElement.id, {
                          styles: { ...(selectedElement.styles || {}), borderRadius: e.target.value as any }
                        })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                      >
                        <option value="none">Sharp Corners (0px)</option>
                        <option value="sm">Subtle (8px)</option>
                        <option value="md">Rounded (16px)</option>
                        <option value="lg">Smooth Curved (24px)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB 3: ADVANCED */}
                {inspectorTab === 'advanced' && (
                  <div className="space-y-3.5 text-xs">
                    {/* Padding */}
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Inner Padding
                      </label>
                      <select
                        value={selectedElement.styles?.padding || 'md'}
                        onChange={(e) => handleUpdateElement(selectedElement.id, {
                          styles: { ...(selectedElement.styles || {}), padding: e.target.value as any }
                        })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-hidden"
                      >
                        <option value="none">None (0px)</option>
                        <option value="sm">Compact (8px)</option>
                        <option value="md">Comfortable (16px)</option>
                        <option value="lg">Spacious (24px)</option>
                      </select>
                    </div>

                    {/* Duplicate and Delete Actions */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicateElement(selectedElement.id)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                      >
                        <Copy className="w-3.5 h-3.5 text-teal-400" />
                        <span>Duplicate Widget</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteElement(selectedElement.id)}
                        className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold flex items-center justify-center gap-2 transition-colors border border-rose-500/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Widget</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT AREA: THE ELEMENTOR CANVAS */}
        <div className={`${
          builderLayoutMode === 'dock' ? 'hidden lg:flex' : 'flex'
        } ${
          builderLayoutMode === 'split' ? 'md:col-span-7 lg:col-span-8' : 'col-span-1 lg:col-span-8'
        } flex-col items-center w-full min-w-0`}>
          {/* Active Step Info Bar */}
          <div className="w-full bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Editing {currentStep.badge || `Step ${currentStep.stepNumber}`}
                </span>
                {currentStep.isCustomStep && (
                  <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    Custom Step
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                {currentStep.name}: {currentStep.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {currentStep.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowStepSettings(!showStepSettings)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-600" />
                <span>Step Settings</span>
              </button>
            </div>
          </div>

          {/* STEP SETTINGS COLLAPSIBLE DRAWER */}
          {showStepSettings && (
            <div className="w-full bg-white rounded-3xl p-5 border border-teal-200 shadow-sm mb-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Step Header & Button Labels
                </h4>
                <button
                  type="button"
                  onClick={() => setShowStepSettings(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Step Tab Label</label>
                  <input
                    type="text"
                    value={currentStep.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateConfig((prev) => ({
                        ...prev,
                        steps: prev.steps.map((s) => s.id === currentStep.id ? { ...s, name: val } : s),
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Step Badge Tag</label>
                  <input
                    type="text"
                    value={currentStep.badge || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateConfig((prev) => ({
                        ...prev,
                        steps: prev.steps.map((s) => s.id === currentStep.id ? { ...s, badge: val } : s),
                      }));
                    }}
                    placeholder="e.g. Step 3 of 5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Main Header Title</label>
                  <input
                    type="text"
                    value={currentStep.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateConfig((prev) => ({
                        ...prev,
                        steps: prev.steps.map((s) => s.id === currentStep.id ? { ...s, title: val } : s),
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Step Subtitle</label>
                  <textarea
                    rows={2}
                    value={currentStep.subtitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateConfig((prev) => ({
                        ...prev,
                        steps: prev.steps.map((s) => s.id === currentStep.id ? { ...s, subtitle: val } : s),
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Next Button Text</label>
                  <input
                    type="text"
                    value={currentStep.ctaButtonText || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateConfig((prev) => ({
                        ...prev,
                        steps: prev.steps.map((s) => s.id === currentStep.id ? { ...s, ctaButtonText: val } : s),
                      }));
                    }}
                    placeholder="Continue to Next Step"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* RESPONSIVE CANVAS CONTAINER */}
          <div
            className={`w-full transition-all duration-300 ${
              previewDevice === 'mobile'
                ? 'max-w-[390px]'
                : previewDevice === 'tablet'
                ? 'max-w-[768px]'
                : 'max-w-full'
            }`}
          >
            {/* Visual Canvas Paper */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                setIsDraggingOverCanvas(true);
              }}
              onDragLeave={(e) => {
                // Avoid flickering if leaving to child
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsDraggingOverCanvas(false);
                  setDragOverIndex(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOverCanvas(false);
                const widgetType = (e.dataTransfer.getData('text/plain') || draggingWidgetType) as FormElementType;
                if (widgetType) {
                  handleAddElement(widgetType, dragOverIndex !== null ? dragOverIndex : undefined);
                }
                setDragOverIndex(null);
                setDraggingWidgetType(null);
              }}
              className={`bg-white rounded-3xl p-5 sm:p-7 border transition-all duration-200 shadow-md min-h-[500px] space-y-4 ${
                isDraggingOverCanvas
                  ? 'border-teal-500 ring-4 ring-teal-500/20 bg-teal-50/10'
                  : 'border-slate-200'
              }`}
            >
              {/* Step Header Live Preview */}
              <div className="pb-3 border-b border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 block mb-1">
                  {currentStep.badge || `Step ${currentStep.stepNumber}`}
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {currentStep.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentStep.subtitle}
                </p>
              </div>

              {/* Standard Step Core Notice if default step */}
              {!currentStep.isCustomStep && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>
                      Standard <strong>{currentStep.name}</strong> core controls will render here on the guest site.
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Hostel Engine
                  </span>
                </div>
              )}

              {/* RENDER DROPPED ELEMENTS */}
              {stepElements.map((el, index) => {
                const isSelected = selectedElementId === el.id;
                const alignClass = el.styles?.align === 'center' ? 'text-center' : el.styles?.align === 'right' ? 'text-right' : 'text-left';
                const bgClass = el.styles?.bgColor === 'teal_soft' 
                  ? 'bg-teal-50/70 border-teal-200' 
                  : el.styles?.bgColor === 'amber_warm'
                  ? 'bg-amber-50/70 border-amber-200'
                  : el.styles?.bgColor === 'rose_subtle'
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-white border-slate-200';

                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    draggable={!isPreviewPureMode}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', `internal:${index}`);
                      setInternalDragIndex(index);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(index);
                    }}
                    className={`relative group rounded-2xl transition-all duration-150 cursor-pointer ${
                      !isPreviewPureMode
                        ? isSelected
                          ? 'ring-2 ring-teal-500 border-teal-500 shadow-md'
                          : 'hover:ring-2 hover:ring-teal-400/50 border border-transparent'
                        : ''
                    }`}
                  >
                    {/* Elementor Pro Floating Top-Right Controls */}
                    {!isPreviewPureMode && (
                      <div className={`absolute -top-3.5 right-3 z-30 flex items-center gap-1 bg-slate-950 text-white px-2 py-0.5 rounded-full shadow-md text-[10px] font-bold transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <span className="flex items-center gap-0.5 text-teal-300 font-mono pr-1 border-r border-slate-700 cursor-grab">
                          <GripVertical className="w-3 h-3" />
                          <span>#{index + 1}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedElementId(el.id);
                            setInspectorTab('content');
                          }}
                          className="hover:text-teal-300 p-0.5"
                          title="Edit Widget in Inspector"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDuplicateElement(el.id, e)}
                          className="hover:text-teal-300 p-0.5"
                          title="Duplicate Widget"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteElement(el.id, e)}
                          className="hover:text-rose-400 p-0.5"
                          title="Delete Widget"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* LIVE WIDGET RENDERING */}
                    <div className={`p-4 rounded-2xl border ${bgClass} ${alignClass} space-y-2`}>
                      {/* TYPE: HEADING */}
                      {el.type === 'heading' && (
                        <div>
                          <h3 className={`font-black text-slate-900 ${
                            el.styles?.fontSize === '2xl' ? 'text-2xl' : el.styles?.fontSize === 'xl' ? 'text-xl' : 'text-lg'
                          }`}>
                            {el.title || 'Untitled Heading'}
                          </h3>
                          {el.subtitle && (
                            <p className="text-xs text-slate-500 mt-1 font-medium">{el.subtitle}</p>
                          )}
                        </div>
                      )}

                      {/* TYPE: TEXT PARAGRAPH */}
                      {el.type === 'text' && (
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {el.content || 'Write descriptive information for your guests here.'}
                        </p>
                      )}

                      {/* TYPE: INPUT TEXT */}
                      {el.type === 'input_text' && (
                        <div className="space-y-1 text-left">
                          <label className="block text-xs font-bold text-slate-800">
                            {el.title || 'Text Input'} {el.required && <span className="text-rose-500">*</span>}
                          </label>
                          <input
                            type="text"
                            disabled
                            placeholder={el.placeholder || 'Type here...'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                          />
                          {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: INPUT TEXTAREA */}
                      {el.type === 'input_textarea' && (
                        <div className="space-y-1 text-left">
                          <label className="block text-xs font-bold text-slate-800">
                            {el.title || 'Textarea Notes'} {el.required && <span className="text-rose-500">*</span>}
                          </label>
                          <textarea
                            rows={3}
                            disabled
                            placeholder={el.placeholder || 'Type instructions or notes here...'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                          />
                          {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: INPUT SELECT */}
                      {el.type === 'input_select' && (
                        <div className="space-y-1 text-left">
                          <label className="block text-xs font-bold text-slate-800">
                            {el.title || 'Select Option'} {el.required && <span className="text-rose-500">*</span>}
                          </label>
                          <select
                            disabled
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
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
                      {el.type === 'input_checkbox' && (
                        <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-200/80 space-y-1.5 text-left">
                          <label className="flex items-start gap-2.5 text-xs font-bold text-slate-900 cursor-pointer">
                            <input
                              type="checkbox"
                              disabled
                              checked
                              className="w-4 h-4 rounded text-teal-600 mt-0.5"
                            />
                            <span>{el.title || 'Legal Waiver Agreement'} {el.required && <span className="text-rose-500">*</span>}</span>
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
                      {el.type === 'input_number' && (
                        <div className="space-y-1 text-left">
                          <label className="block text-xs font-bold text-slate-800">
                            {el.title || 'Quantity / Count'}
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                              <button type="button" disabled className="px-3 py-1 text-slate-400 font-bold">-</button>
                              <span className="px-4 py-1 text-xs font-bold text-slate-800">{el.defaultValue || 1}</span>
                              <button type="button" disabled className="px-3 py-1 text-slate-400 font-bold">+</button>
                            </div>
                            {el.helpText && <span className="text-[11px] text-slate-500">{el.helpText}</span>}
                          </div>
                        </div>
                      )}

                      {/* TYPE: INPUT DATE */}
                      {el.type === 'input_date' && (
                        <div className="space-y-1 text-left">
                          <label className="block text-xs font-bold text-slate-800">
                            {el.title || 'Date Selection'} {el.required && <span className="text-rose-500">*</span>}
                          </label>
                          <div className="relative">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              disabled
                              placeholder={el.placeholder || 'YYYY-MM-DD'}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 font-medium"
                            />
                          </div>
                          {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: INPUT PHONE */}
                      {el.type === 'input_phone' && (
                        <div className="space-y-1 text-left">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              {el.title || 'WhatsApp Mobile Number'} {el.required && <span className="text-rose-500">*</span>}
                            </label>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              WhatsApp
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shrink-0">
                              {el.countryCode || '+351'}
                            </div>
                            <input
                              type="text"
                              disabled
                              placeholder={el.placeholder || '912 345 678'}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                            />
                          </div>
                          {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: INPUT EMAIL */}
                      {el.type === 'input_email' && (
                        <div className="space-y-1.5 text-left">
                          <label className="block text-xs font-bold text-slate-800">
                            {el.title || 'Email Address'} {el.required && <span className="text-rose-500">*</span>}
                          </label>
                          <div className="relative">
                            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              disabled
                              placeholder={el.placeholder || 'surfer@example.com'}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 font-medium"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {['@gmail.com', '@icloud.com', '@outlook.com'].map((dom) => (
                              <span key={dom} className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {dom}
                              </span>
                            ))}
                          </div>
                          {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: INPUT RADIO */}
                      {el.type === 'input_radio' && (
                        <div className="space-y-2 text-left">
                          <label className="block text-xs font-bold text-slate-800">
                            {el.title || 'Select Choice'} {el.required && <span className="text-rose-500">*</span>}
                          </label>
                          <div className="grid grid-cols-1 gap-1.5">
                            {(el.options || ['Option 1', 'Option 2', 'Option 3']).map((opt, i) => (
                              <div
                                key={i}
                                className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                                  i === 0 ? 'bg-teal-50/60 border-teal-300 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  i === 0 ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="text-xs">{opt}</span>
                              </div>
                            ))}
                          </div>
                          {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: INPUT TIME */}
                      {el.type === 'input_time' && (
                        <div className="space-y-2 text-left">
                          <label className="block text-xs font-bold text-slate-800">
                            {el.title || 'Arrival Time Window'} {el.required && <span className="text-rose-500">*</span>}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(el.options || [
                              'Morning (09:00 - 12:00)',
                              'Check-in (14:00 - 18:00)',
                              'Sunset (18:00 - 21:00)',
                              'Late Night (21:00+)'
                            ]).map((slot, i) => (
                              <div
                                key={i}
                                className={`p-2 rounded-xl border text-center text-xs flex items-center justify-center gap-1.5 ${
                                  i === 1 ? 'bg-teal-500 text-slate-950 font-black border-teal-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <Clock className="w-3 h-3 shrink-0" />
                                <span className="truncate">{slot}</span>
                              </div>
                            ))}
                          </div>
                          {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: INPUT TOGGLE */}
                      {el.type === 'input_toggle' && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-left">
                          <div className="pr-4">
                            <h4 className="text-xs font-bold text-slate-900">{el.title || 'Enable Setting'}</h4>
                            {el.subtitle && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{el.subtitle}</p>}
                            {el.helpText && <p className="text-[10px] text-teal-600 mt-1 font-semibold">{el.helpText}</p>}
                          </div>
                          <div className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                            el.defaultValue ? 'bg-teal-500 justify-end' : 'bg-slate-300 justify-start'
                          }`}>
                            <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                          </div>
                        </div>
                      )}

                      {/* TYPE: MULTI-TAG CHIPS */}
                      {el.type === 'badge_pills' && (
                        <div className="space-y-2 text-left">
                          <label className="block text-xs font-bold text-slate-800">
                            {el.title || 'Select Preferences'}
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {(el.badgeItems || ['Vegetarian', 'Vegan', 'Gluten-Free', 'Sunset Yoga', 'Surf Video Analysis']).map((tag, i) => (
                              <span
                                key={i}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 ${
                                  i < 2
                                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                <Tag className="w-3 h-3" />
                                <span>{tag}</span>
                                {i < 2 && <Check className="w-3 h-3 text-teal-600" />}
                              </span>
                            ))}
                          </div>
                          {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: FILE UPLOAD */}
                      {el.type === 'input_file' && (
                        <div className="space-y-1.5 text-left">
                          <label className="block text-xs font-bold text-slate-800">
                            {el.title || 'Upload Document'} {el.required && <span className="text-rose-500">*</span>}
                          </label>
                          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50/70 hover:bg-slate-50 transition-colors">
                            <Upload className="w-6 h-6 text-teal-600 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-slate-700">Drag & drop your file or <span className="text-teal-600 underline">browse</span></p>
                            <div className="flex items-center justify-center gap-1.5 mt-2">
                              {(el.fileTypes || ['PDF', 'JPG', 'PNG']).map((ft) => (
                                <span key={ft} className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                  {ft}
                                </span>
                              ))}
                              <span className="text-[10px] text-slate-400">• Max {el.maxFileSizeMb || 10}MB</span>
                            </div>
                          </div>
                          {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: DIGITAL SIGNATURE */}
                      {el.type === 'input_signature' && (
                        <div className="space-y-2 text-left">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              {el.title || 'Digital Signature & Waiver'} {el.required && <span className="text-rose-500">*</span>}
                            </label>
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                              <PenTool className="w-3 h-3 text-teal-600" />
                              Legally Binding
                            </span>
                          </div>
                          {el.signaturePrompt && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed italic">
                              "{el.signaturePrompt}"
                            </p>
                          )}
                          <div className="h-20 bg-white border border-dashed border-slate-300 rounded-xl flex flex-col justify-end p-2 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-xl text-teal-600/40 italic font-serif select-none">
                                John Doe (Sample Signature)
                              </span>
                            </div>
                            <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-[10px] text-slate-400">
                              <span>Sign above with finger or stylus</span>
                              <span className="text-teal-600 font-bold">Clear Canvas</span>
                            </div>
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
                            {[...Array(el.max || 5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < (el.rating || 4)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-slate-700 ml-2">
                              {el.rating || 4} / {el.max || 5} (Proficient)
                            </span>
                          </div>
                          {el.helpText && <p className="text-[11px] text-slate-400">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: PRICE BREAKDOWN */}
                      {el.type === 'price_breakdown' && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 text-white space-y-3 text-left shadow-xs">
                          <div className="flex items-center justify-between border-b border-teal-800/60 pb-2">
                            <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-teal-400" />
                              <span className="text-xs font-black uppercase tracking-wider text-teal-300">
                                {el.title || 'Live Rate Breakdown'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                              Instant Guaranteed
                            </span>
                          </div>
                          <div className="space-y-1.5 text-xs text-slate-300">
                            <div className="flex justify-between">
                              <span>Standard Dorm / Private Bed:</span>
                              <span className="font-bold text-white">{el.currency || '€'}{el.basePrice || 38} / night</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Estimated 4 Nights Stay:</span>
                              <span className="font-bold text-white">{el.currency || '€'}{(el.basePrice || 38) * 4}</span>
                            </div>
                            <div className="flex justify-between text-teal-300 font-bold border-t border-teal-800/40 pt-1">
                              <span>Due Today ({el.depositPercent || 30}% Deposit):</span>
                              <span className="text-sm font-black text-white">{el.currency || '€'}{Math.round(((el.basePrice || 38) * 4) * ((el.depositPercent || 30) / 100))}</span>
                            </div>
                          </div>
                          {el.content && <p className="text-[11px] text-teal-200/80 leading-relaxed pt-1">{el.content}</p>}
                          {el.helpText && <p className="text-[10px] text-teal-400/70">{el.helpText}</p>}
                        </div>
                      )}

                      {/* TYPE: COUNTDOWN TIMER */}
                      {el.type === 'countdown_timer' && (
                        <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/80 text-teal-950 flex items-center justify-between text-left">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Timer className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-900">{el.title || 'Rates Held'}</div>
                              <div className="text-[11px] text-slate-600 mt-0.5 leading-tight">{el.content || 'Your bed selection is locked for this session.'}</div>
                            </div>
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-teal-300 font-mono text-xs font-black tracking-widest shrink-0 shadow-xs">
                            {el.timerMinutes || 15}:00
                          </div>
                        </div>
                      )}

                      {/* TYPE: IMAGE */}
                      {el.type === 'image' && (
                        <div className="space-y-2">
                          <img
                            src={el.imageUrl || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80'}
                            alt={el.title || 'Hostel image'}
                            className="w-full h-44 object-cover rounded-xl"
                          />
                          {el.title && <div className="text-xs font-bold text-slate-900">{el.title}</div>}
                          {el.content && <p className="text-[11px] text-slate-500">{el.content}</p>}
                        </div>
                      )}

                      {/* TYPE: ALERT */}
                      {el.type === 'alert' && (
                        <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-left ${
                          el.alertType === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : el.alertType === 'tip'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-teal-50 border-teal-200 text-teal-900'
                        }`}>
                          <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-black">{el.title || 'Notice'}</div>
                            <div className="text-[11px] mt-0.5 leading-relaxed">{el.content}</div>
                          </div>
                        </div>
                      )}

                      {/* TYPE: ICON BOX */}
                      {el.type === 'icon_box' && (
                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
                          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
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
                            {el.faqItems?.map((faq, i) => (
                              <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                  <span>{faq.question}</span>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">{faq.answer}</p>
                              </div>
                            ))}
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
                          <button
                            type="button"
                            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-black shadow-xs inline-flex items-center gap-1.5"
                          >
                            <span>{el.buttonText || 'Click Here'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* CLASSIC ELEMENTOR PRO EMPTY / BOTTOM DROPZONE */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOverCanvas(true);
                  setDragOverIndex(stepElements.length);
                }}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  isDraggingOverCanvas && dragOverIndex === stepElements.length
                    ? 'border-teal-500 bg-teal-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-teal-400 bg-slate-50/60 hover:bg-teal-50/20'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 text-teal-600 flex items-center justify-center mx-auto mb-2.5">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Drag Widget from Left Panel Here
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Drag elements from the Elementor sidebar, or click "Add" on any widget to build this step.
                </p>
              </div>

              {/* Step Navigation Buttons Mock */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
                >
                  <span>{currentStep.ctaButtonText || 'Continue to Next Step'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD NEW CUSTOM STEP (ELEMENTOR PRO STYLE) */}
      {showAddStepModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-rose-500 text-white font-black text-xs flex items-center justify-center">
                  +
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Add New Booking Step
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStepModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomStep} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Step Name (Header Tab) *
                </label>
                <input
                  type="text"
                  required
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  placeholder="e.g. Surf Waiver & Sizing, Arrival Details"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Step Main Title
                </label>
                <input
                  type="text"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  placeholder="e.g. Personalize Your Surf & Stay Experience"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-semibold focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Step Subtitle Instructions
                </label>
                <textarea
                  rows={2}
                  value={newStepSubtitle}
                  onChange={(e) => setNewStepSubtitle(e.target.value)}
                  placeholder="e.g. Please choose your wetsuit preferences and read the lodge guidelines."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Placement in Booking Flow
                </label>
                <select
                  value={newStepPlacement}
                  onChange={(e) => setNewStepPlacement(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold"
                >
                  <option value="after_dates">After Dates (Step 1)</option>
                  <option value="after_rooms">After Room / Bed Selection (Step 2)</option>
                  <option value="after_addons">After Surf Add-ons & Coaching (Step 3)</option>
                  <option value="after_guest">After Guest Details (Before Confirmation)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStepModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-sm"
                >
                  Create Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
