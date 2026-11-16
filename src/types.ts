export type RoomType = 'dorm_mixed' | 'dorm_female' | 'private_suite' | 'private_double';

export type SurfSkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'non_surfer';

export type BookingStatus = 'confirmed' | 'pending' | 'checked_in' | 'checked_out' | 'cancelled';

export type PaymentStatus = 'paid' | 'deposit' | 'pending' | 'unpaid';

export type RoomOperationalStatus = 'active' | 'maintenance' | 'inactive';

export interface RoomMaintenanceBlock {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'maintenance' | 'inactive';
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  typeLabel: string;
  capacity: number; // Total beds/guests capacity
  pricePerNight: number;
  description: string;
  shortDescription: string;
  image: string;
  amenities: string[];
  bedType: string;
  bathroomType: 'shared' | 'private_ensuite';
  hasOceanView: boolean;
  hasAirConditioning: boolean;
  isActive: boolean;
  status?: RoomOperationalStatus;
  maintenanceBlocks?: RoomMaintenanceBlock[];
}

export interface SurfAddOn {
  id: string;
  name: string;
  category: 'surf_lesson' | 'equipment' | 'wellness' | 'meal' | 'transport';
  price: number;
  billingType: 'per_day' | 'per_stay' | 'per_person';
  description: string;
  iconName: string;
  popular?: boolean;
}

export interface SelectedAddOn {
  addOnId: string;
  quantity: number;
  days?: number;
}

export type GuestLoyaltyStatus = 'new' | 'returning' | 'vip' | 'local_legend';
export type SupportedLanguage = 'en' | 'es' | 'ar' | 'pt' | 'fr' | 'de' | 'it' | string;

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // WhatsApp number including country code
  country: string;
  surfLevel: SurfSkillLevel;
  preferredLanguage?: SupportedLanguage;
  arrivalEstimatedTime?: string;
  specialRequests?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  customResponses?: Record<string, any>;
  loyaltyStatus?: GuestLoyaltyStatus | string;
}

export interface Booking {
  id: string;
  referenceNumber: string; // e.g., "WH-8291"
  roomId: string;
  roomName: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  nights: number;
  guestsCount: number;
  guest: GuestInfo;
  addOns: SelectedAddOn[];
  roomSubtotal: number;
  addOnsSubtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  adminNotes?: string;
  whatsappSentCount: number;
  webhookSentCount: number;
  lastNotificationSent?: string;
  stayReminderSent?: boolean;
  cancellationReason?: string; // e.g. "Auto-cancelled: deposit not received within 3 days"
  autoCancelledAt?: string; // ISO date timestamp if auto-cancelled
}

export type ThemeCornerRadius = 'sharp' | 'subtle' | 'rounded' | 'playful' | 'pill';
export type ThemeBorderWidth = 'none' | 'thin' | 'medium' | 'bold';
export type ThemeShadowIntensity = 'none' | 'subtle' | 'medium' | 'elevated' | 'dramatic';

export interface ThemeConfig {
  cornerRadius: ThemeCornerRadius;
  borderWidth: ThemeBorderWidth;
  shadowIntensity: ThemeShadowIntensity;
  presetId?: string;
  customRadiusPx?: number; // Optional fine-tuning pixel radius (0 to 36)
  customBorderPx?: number; // Optional fine-tuning pixel border width (0 to 4)
}

export interface HostelSettings {
  // Brand & Visual Identity
  name: string;
  tagline: string;
  primaryBrandColor?: string; // Hex color string, e.g. '#0d9488'
  logoUrl?: string; // Custom logo URL or uploaded base64 data URL
  brandFooterStyle?: 'dark' | 'brand_tint' | 'midnight';
  themeConfig?: ThemeConfig; // Global UI corner radii, border widths & shadow intensities
  location: string;
  country: string;
  city?: string;
  phone: string; // Hostel WhatsApp phone number with country code, e.g. 351912345678
  emergencyPhone?: string; // 24/7 host emergency line
  email: string;
  address: string;
  googleMapsUrl: string;
  operatingStatus?: 'open' | 'seasonal_break' | 'maintenance';
  maintenanceNotice?: string;
  environmentMode?: 'demo' | 'live'; // 'demo' (mock sandbox data) or 'live' (production deployment)
  timezone?: string;
  defaultLanguage?: SupportedLanguage;

  // Stay & House Policies
  checkInTime: string; // e.g. "14:00"
  checkOutTime: string; // e.g. "11:00"
  quietHours?: string; // e.g. "23:00 - 08:00"
  minStayNights?: number; // e.g. 1 or 2
  maxStayNights?: number; // e.g. 30
  maxGuestsPerBooking?: number; // e.g. 8
  ageRestriction?: 'all_ages' | '18_plus' | '21_plus';
  cancellationPolicy?: 'flexible_48h' | 'moderate_7d' | 'strict_14d';
  houseRules?: string;

  // Financial & Front Desk
  currency: string;
  currencySymbol: string;
  taxRatePercent: number;
  depositRequirementPercent?: number; // 0, 20, 50, 100
  autoCancelUnpaidEnabled?: boolean; // Whether unpaid/pending reservations without deposit are auto-cancelled
  autoCancelUnpaidDays?: number; // Days after booking creation before auto-cancelling if deposit not received
  keyDepositAmount?: number; // Refundable key/locker deposit
  acceptedPaymentMethods?: string[]; // ['cash', 'card', 'mbway', 'paypal', 'revolut']
  bankTransferDetails?: string;

  // Surf School & Amenities
  morningSurfSessionTime?: string; // e.g. "09:30"
  afternoonSurfSessionTime?: string; // e.g. "14:30"
  surfForecastUrl?: string; // Surf forecast / webcam link
  wifiNetworkName?: string;
  wifiPassword?: string;
  requireWaiver?: boolean;

  // WhatsApp & Guest Automation
  autoRemindDaysBefore: number; // e.g. 2 days before check-in
  autoSendWelcomeGuide?: boolean;
  customWhatsAppGreeting?: string;
  autoEmailReceiptDraftEnabled?: boolean;
  autoRespondersConfig?: AutoRespondersConfig;

  // Webhook & Integrations
  webhookUrl: string;
  webhookEnabled: boolean;
  autoSendWebhookOnBooking: boolean;
  webhookSecret?: string;
  webhookEvents?: {
    onBookingCreated: boolean;
    onBookingStatusChange: boolean;
    onReminderSent: boolean;
    onCancellation: boolean;
  };

  // Multi-Step Book Stay Form Builder Config
  bookingFormConfig?: BookingFormConfig;

  // Invoice Voucher & Document Builder Config
  invoiceTemplateConfig?: InvoiceTemplateConfig;
}

export type FormElementType =
  | 'heading'
  | 'text'
  | 'input_text'
  | 'input_textarea'
  | 'input_select'
  | 'input_checkbox'
  | 'input_number'
  | 'input_date'
  | 'input_phone'
  | 'input_email'
  | 'input_radio'
  | 'input_time'
  | 'input_toggle'
  | 'badge_pills'
  | 'input_file'
  | 'input_signature'
  | 'rating_stars'
  | 'price_breakdown'
  | 'countdown_timer'
  | 'image'
  | 'alert'
  | 'icon_box'
  | 'testimonial'
  | 'faq'
  | 'divider'
  | 'button';

export interface FormElementStyles {
  align?: 'left' | 'center' | 'right';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  borderStyle?: 'none' | 'solid' | 'dashed';
}

export interface FormElement {
  id: string;
  type: FormElementType;
  title?: string;
  content?: string;
  subtitle?: string;
  fieldKey?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  helpText?: string;
  icon?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  alertType?: 'info' | 'success' | 'warning' | 'tip';
  faqItems?: { question: string; answer: string }[];
  rating?: number;
  author?: string;
  min?: number;
  max?: number;
  defaultValue?: string | number | boolean;
  styles?: FormElementStyles;
  // Extended properties for advanced & regular elements
  countryCode?: string; // for input_phone
  fileTypes?: string[]; // for input_file (e.g. ['PDF', 'JPG', 'PNG'])
  maxFileSizeMb?: number; // for input_file
  signaturePrompt?: string; // for input_signature
  currency?: string; // for price_breakdown
  basePrice?: number; // for price_breakdown
  depositPercent?: number; // for price_breakdown
  timerMinutes?: number; // for countdown_timer
  badgeItems?: string[]; // for badge_pills (multi-select tag chips)
}

export interface BookingFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number';
  placeholder?: string;
  options?: string[]; // for select
  required: boolean;
  helpText?: string;
  stepTarget?: string;
  defaultValue?: string | boolean | number;
}

export interface BookingStepConfig {
  id: string; // 'dates' | 'rooms' | 'addons' | 'guest' | 'confirmation' | custom step id
  stepNumber: number;
  name: string; // e.g. "Dates & Waves"
  title: string; // e.g. "When are you paddling out?"
  subtitle: string;
  badge?: string;
  enabled: boolean;
  ctaButtonText?: string;
  customFields?: BookingFormField[];
  isCustomStep?: boolean;
  iconName?: string; // Optional icon identifier for step badge
  elements?: FormElement[]; // Elementor Pro drag & drop widgets
}

export interface BookingFormConfig {
  id: string;
  name: string; // e.g. "Signature Surf & Stay Flow"
  description: string;
  version: number;
  heroBadgeText?: string;
  bannerNotice?: string;
  themeAccentColor?: string;
  steps: BookingStepConfig[];
  requireWaiver?: boolean;
  showSavingsBadge?: boolean;
  lastGeneratedPrompt?: string;
  updatedAt?: string;
}

export interface InvoiceTemplateConfig {
  id: string;
  name: string;
  updatedAt?: string;

  // Header & Issuer details
  title: string; // e.g. "OFFICIAL INVOICE"
  subtitle?: string; // e.g. "Surf House & Ocean Lodge"
  invoiceNumberPrefix: string; // e.g. "INV" (generates INV-2026-REF)
  taxIdLabel: string; // e.g. "NIF / VAT"
  taxIdNumber: string; // e.g. "PT 509 876 543"
  showLogo: boolean;
  accentColor?: string; // Hex color string, e.g. "#0d9488"

  // Section titles & custom labels
  guestSectionTitle: string; // e.g. "Billed To (Lead Guest)"
  staySectionTitle: string; // e.g. "Accommodation Particulars"
  chargesTableTitle: string; // e.g. "Itemized Charges & Services"
  qrSectionTitle: string; // e.g. "Instant Reservation QR Verification"
  qrSectionDescription: string; // custom instructions text
  notesSectionTitle: string; // e.g. "Check-in Guidelines & Gate Instructions:"
  checkInInstructions: string; // custom check-in & gate instructions
  paymentInstructions?: string; // payment terms / settlement note

  // Bottom seal & watermark
  certifiedBadgeText: string; // e.g. "WaveHaven Certified"
  stampLocation: string; // e.g. "Ericeira, Portugal"
  watermarkText: string; // e.g. "WaveHaven Certified"
  footerLegalText?: string; // e.g. "Official Reception Check-in Voucher • Printed for Guest Check-in"

  // Feature toggles (Builder blocks)
  showQrCode: boolean;
  showSurfLevel: boolean;
  showWifiDetails: boolean;
  showReceptionSeal: boolean;
  showWatermark: boolean;
  showTaxBreakdown: boolean;
  showPaymentStatusBadge: boolean;
  showBankDetails?: boolean;
  bankDetailsText?: string;

  // WhatsApp Message Customization & Blocks
  whatsappCustomIntro?: string;
  whatsappCustomOutro?: string;
  whatsappIncludeGuidelines?: boolean;
  whatsappIncludeBreakdown?: boolean;
  whatsappIncludeVoucherLink?: boolean;
  whatsappMessageTemplate?: string;
}

export interface NotificationTemplate {
  id: string;
  type: 'booking_confirmation' | 'upcoming_stay_reminder' | 'checkin_guide' | 'checkout_thanks' | 'email_receipt' | 'invoice';
  title: string;
  subject: string;
  daysTrigger: number; // e.g. 2 for 2 days before arrival
  content: string; // Template with placeholders
  isActive: boolean;
  channel?: 'whatsapp' | 'email' | 'both';
  emailSubject?: string;
  mimicWhatsAppFormat?: boolean;
}

export type AutoResponderTriggerStatus = 'confirmed' | 'cancelled' | 'pending' | 'checked_in' | 'checked_out';

export interface AutoResponderRule {
  id: string;
  name: string;
  triggerStatus: AutoResponderTriggerStatus;
  triggerLabel: string;
  enabled: boolean;
  channel: 'whatsapp';
  templateContent: string;
  description: string;
  autoOpenWhatsApp?: boolean;
  triggersCount: number;
  lastTriggeredAt?: string;
}

export interface AutoResponderLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerStatus: AutoResponderTriggerStatus;
  bookingId: string;
  bookingRef: string;
  guestName: string;
  guestPhone: string;
  messagePreview: string;
  timestamp: string;
  status: 'dispatched' | 'simulated' | 'failed';
}

export interface AutoRespondersConfig {
  masterEnabled: boolean;
  rules: AutoResponderRule[];
  autoOpenMode: 'prompt' | 'auto_open' | 'background_log';
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  bookingRef: string;
  endpoint: string;
  status: 'success' | 'failed' | 'simulated';
  statusCode?: number;
  payloadSummary: string;
}

export interface RoomAvailability {
  roomId: string;
  totalCapacity: number;
  bookedBeds: number;
  availableBeds: number;
  isAvailable: boolean;
  occupancyPercent: number;
  isMaintenance?: boolean;
  isInactive?: boolean;
  maintenanceReason?: string;
  activeMaintenanceBlock?: RoomMaintenanceBlock;
}

export type WaitlistStatus = 'waiting' | 'notified' | 'converted' | 'cancelled';
export type WaitlistPriority = 'normal' | 'high' | 'vip';

export interface WaitlistEntry {
  id: string;
  queueNumber: number; // Position in room queue (#1, #2, etc.)
  roomId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestsCount: number;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country?: string;
    surfLevel?: SurfSkillLevel;
    notes?: string;
  };
  priority: WaitlistPriority;
  status: WaitlistStatus;
  createdAt: string;
  notifiedAt?: string;
  convertedAt?: string;
  convertedBookingId?: string;
  adminNotes?: string;
}

export type AdminTab = 
  | 'bookings' 
  | 'monthlyGrid'
  | 'calendar' 
  | 'housekeeping' 
  | 'rooms' 
  | 'analytics' 
  | 'revenueReport'
  | 'waitlist' 
  | 'notifications' 
  | 'addons' 
  | 'settings'
  | 'roles';

export type StaffRole = 'manager' | 'admin' | 'super_admin';

export type PermissionLevel = 'view' | 'manage' | 'full_control';

export type SystemResource =
  | 'bookings'
  | 'calendar_grid'
  | 'housekeeping'
  | 'waitlist'
  | 'rooms'
  | 'addons'
  | 'revenue_reports'
  | 'notifications'
  | 'form_builder'
  | 'settings'
  | 'webhooks'
  | 'roles_staff';

export type RolePermissionsMap = Record<SystemResource, PermissionLevel>;

export interface RoleDefinition {
  id: StaffRole;
  name: string;
  badgeLabel: string;
  description: string;
  defaultLevel: PermissionLevel;
  badgeColor: string;
  permissions: RolePermissionsMap;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  department: string;
  avatar: string;
  phone?: string;
  status: 'active' | 'suspended';
  lastActive: string;
  customPermissionsOverride?: Partial<RolePermissionsMap>;
}

export type CleaningStatus = 'needs_cleaning' | 'in_progress' | 'ready';

export interface RoomCleaningChecklist {
  linensChanged: boolean;
  towelsReplaced: boolean;
  bathroomSanitized: boolean;
  floorsMopped: boolean;
  trashEmptied: boolean;
  suppliesRestocked: boolean;
}

export interface RoomCleaningRecord {
  roomId: string;
  status: CleaningStatus;
  lastCleanedAt?: string;
  cleanedBy?: string;
  notes?: string;
  priority?: 'high' | 'normal' | 'low';
  checklist?: RoomCleaningChecklist;
  maintenanceNeeded?: boolean;
  maintenanceNotes?: string;
}

