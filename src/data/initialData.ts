import { Room, SurfAddOn, Booking, HostelSettings, NotificationTemplate, WaitlistEntry, InvoiceTemplateConfig } from '../types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'Ocean Breeze 6-Bed Dorm',
    type: 'dorm_mixed',
    typeLabel: 'Mixed Surf Dorm',
    capacity: 6,
    pricePerNight: 28,
    description: 'Spacious mixed dormitory right by the garden patio. Features handcrafted wooden bunk beds with privacy curtains, orthopedic mattresses, personal reading lights, charging stations, and lockable gear storage.',
    shortDescription: 'Social dorm with personal locker, reading light & AC',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80',
    amenities: ['Air Conditioning', 'Lockable Surf Gear Trunk', 'Orthopedic Bunk Bed', 'High-Speed Wi-Fi', 'Daily Cleaning', 'Individual Power Socket & Light'],
    bedType: 'Single Pod Bunk',
    bathroomType: 'shared',
    hasOceanView: false,
    hasAirConditioning: true,
    isActive: true,
  },
  {
    id: 'room-2',
    name: 'Mermaid Sanctuary 4-Bed Female Dorm',
    type: 'dorm_female',
    typeLabel: 'Female-Only Dorm',
    capacity: 4,
    pricePerNight: 34,
    description: 'Bright and cozy female-only dorm with ensuite powder nook, full-length mirror, premium linens, secure lockers, and direct access to the hammock sun terrace.',
    shortDescription: 'Quiet female dorm with extra vanity & sun deck access',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    amenities: ['Ensuite Vanity Nook', 'Lockable Trunk', 'Direct Sun Terrace Access', 'Air Conditioning', 'Organic Toiletries', 'Orthopedic Bed'],
    bedType: 'Curtained Wooden Bunk',
    bathroomType: 'shared',
    hasOceanView: false,
    hasAirConditioning: true,
    isActive: true,
  },
  {
    id: 'room-3',
    name: 'Sunset Shaka 4-Bed Mixed Dorm',
    type: 'dorm_mixed',
    typeLabel: 'Semi-Private Dorm',
    capacity: 4,
    pricePerNight: 36,
    description: 'Small group vibe, ideal for surfers wanting peace and solid rest before morning dawn patrol. Features custom oversized bunks, sound insulation, and personal safe.',
    shortDescription: '4-bed chill dorm optimized for good rest & dawn patrols',
    image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=900&q=80',
    amenities: ['Sound Insulation', 'Individual Safe', 'Surfboard Wall Mount', 'Fast Wi-Fi', 'Air Conditioning'],
    bedType: 'XL Heavy Timber Bunk',
    bathroomType: 'shared',
    hasOceanView: true,
    hasAirConditioning: true,
    isActive: true,
  },
  {
    id: 'room-4',
    name: 'The Point Break Private Double',
    type: 'private_double',
    typeLabel: 'Private Double Room',
    capacity: 2,
    pricePerNight: 85,
    description: 'Intimate bohemian private sanctuary featuring a plush queen-size bed, private teak balcony overlooking the palm garden, private ensuite bathroom with rainfall hot shower, and artisanal surf decor.',
    shortDescription: 'Queen bed, ensuite rainfall bath & private garden balcony',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80',
    amenities: ['Private Ensuite Hot Shower', 'Private Garden Balcony', 'Queen Bed', 'Mini-Fridge', 'Workspace Desk', 'Daily Housekeeping'],
    bedType: 'Queen Bed',
    bathroomType: 'private_ensuite',
    hasOceanView: true,
    hasAirConditioning: true,
    isActive: true,
  },
  {
    id: 'room-5',
    name: 'The Pipeline Oceanfront Suite',
    type: 'private_suite',
    typeLabel: 'Deluxe Penthouse Suite',
    capacity: 3,
    pricePerNight: 135,
    description: 'The crown jewel of WaveHaven Surf House. Panoramic glass sliding doors opening to an expansive oceanfront terrace where you can check the wave sets from your bed. Features King bed, daybed lounge, ensuite soaking bath, and premium audio.',
    shortDescription: 'Panoramic ocean view, private sun deck & check waves from bed',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    amenities: ['180° Panoramic Wave Check Deck', 'King Bed + Daybed', 'Ensuite Luxury Bath', 'Espresso Machine', 'Air Conditioning', 'Surround Sound'],
    bedType: 'King Bed + Daybed',
    bathroomType: 'private_ensuite',
    hasOceanView: true,
    hasAirConditioning: true,
    isActive: true,
  },
];

export const INITIAL_ADDONS: SurfAddOn[] = [
  {
    id: 'addon-1',
    name: 'Daily Surf Coaching & Video Analysis',
    category: 'surf_lesson',
    price: 45,
    billingType: 'per_day',
    description: '2-hour certified instructor surf session suited to your skill level, board and wetsuit included, plus evening video technique review.',
    iconName: 'Waves',
    popular: true,
  },
  {
    id: 'addon-2',
    name: 'Premium Board Quiver Rental',
    category: 'equipment',
    price: 20,
    billingType: 'per_day',
    description: 'Unlimited access to over 30 quality surfboards (Torq, Channel Islands, Catch Surf foamies, funboards, longboards). Swap anytime based on conditions.',
    iconName: 'Sparkles',
    popular: true,
  },
  {
    id: 'addon-3',
    name: 'Neoprene Wetsuit (Rip Curl 3/2 or 4/3)',
    category: 'equipment',
    price: 8,
    billingType: 'per_day',
    description: 'Freshly washed high-performance wetsuit kept dry and clean in your personal rack size.',
    iconName: 'ShieldCheck',
  },
  {
    id: 'addon-4',
    name: 'Sunrise & Sunset Rooftop Yoga',
    category: 'wellness',
    price: 15,
    billingType: 'per_day',
    description: '75-minute vinyasa & restorative stretch flow specifically designed to open shoulders, hips, and aid surf recovery on the ocean-view deck.',
    iconName: 'Sun',
    popular: true,
  },
  {
    id: 'addon-5',
    name: 'Daily Wholesome Surfer Breakfast Buffet',
    category: 'meal',
    price: 12,
    billingType: 'per_day',
    description: 'Hearty organic breakfast: açai & smoothie bowls, avocado sourdough toast, fresh tropical fruit, eggs to order, and specialty espresso.',
    iconName: 'Coffee',
    popular: true,
  },
  {
    id: 'addon-6',
    name: 'Airport / Station Surf Van Transfer',
    category: 'transport',
    price: 35,
    billingType: 'per_stay',
    description: 'Direct hassle-free private transfer in our surf van with roof board racks directly to the hostel doorstep.',
    iconName: 'Car',
  },
];

export const DEFAULT_INVOICE_TEMPLATE: InvoiceTemplateConfig = {
  id: 'tpl-invoice-default',
  name: 'WaveHaven Ocean Standard',
  updatedAt: new Date().toISOString(),
  title: 'OFFICIAL INVOICE',
  subtitle: 'Surf House & Ocean Lodge',
  invoiceNumberPrefix: 'INV',
  taxIdLabel: 'NIF / VAT',
  taxIdNumber: 'PT 509 876 543',
  showLogo: true,
  accentColor: '#0d9488',

  guestSectionTitle: 'Billed To (Lead Guest)',
  staySectionTitle: 'Accommodation Particulars',
  chargesTableTitle: 'Itemized Charges & Services',
  qrSectionTitle: 'Instant Reservation QR Verification',
  qrSectionDescription: 'Scan this QR code with any smartphone camera to switch directly to your verified reservation voucher and download your PDF invoice anytime.',
  notesSectionTitle: 'Check-in Guidelines & Gate Instructions:',
  checkInInstructions: 'Reception is open daily from 08:00 to 22:00. For late arrivals, message our WhatsApp desk (+{hostelPhone}).',
  paymentInstructions: 'Balance due at reception upon arrival via Card, MB WAY, Revolut, or Cash.',

  certifiedBadgeText: 'WaveHaven Certified',
  stampLocation: 'Ericeira, Portugal',
  watermarkText: 'WaveHaven Certified',
  footerLegalText: 'Official Reception Check-in Voucher • Printed for Guest Check-in',

  showQrCode: true,
  showSurfLevel: true,
  showWifiDetails: true,
  showReceptionSeal: true,
  showWatermark: true,
  showTaxBreakdown: true,
  showPaymentStatusBadge: true,
  showBankDetails: false,
  bankDetailsText: 'IBAN: PT50 0033 0000 1234 5678 9015 4 • BIC/SWIFT: BCPTPTLX',

  whatsappCustomIntro: 'Aloha {guestName}! Your stay at {hostelName} is confirmed. Here is your official reservation & invoice details:',
  whatsappCustomOutro: 'Safe travels and see you soon on the waves! 🌊🤙',
  whatsappIncludeGuidelines: true,
  whatsappIncludeBreakdown: true,
  whatsappIncludeVoucherLink: true,
};

export const INVOICE_TEMPLATE_PRESETS: { id: string; label: string; description: string; template: InvoiceTemplateConfig }[] = [
  {
    id: 'ocean_standard',
    label: 'WaveHaven Ocean Standard',
    description: 'Comprehensive hospitality voucher with QR code, surf skills badge, gate guidelines & certified seal.',
    template: {
      ...DEFAULT_INVOICE_TEMPLATE,
      id: 'tpl-ocean-standard',
      name: 'WaveHaven Ocean Standard',
    },
  },
  {
    id: 'corporate_tax',
    label: 'Corporate Tax & Audit',
    description: 'Formal NIF/VAT accounting format with itemized taxes, bank wire IBAN info & official legal fiscal stamp.',
    template: {
      ...DEFAULT_INVOICE_TEMPLATE,
      id: 'tpl-corporate-tax',
      name: 'Corporate Tax & Audit',
      title: 'TAX INVOICE & PROOF OF STAY',
      subtitle: 'Hospitality & Accommodation Services Ltd.',
      invoiceNumberPrefix: 'TAX',
      taxIdLabel: 'Fiscal VAT / NIF ID',
      taxIdNumber: 'PT 509 876 543',
      accentColor: '#1e293b',
      guestSectionTitle: 'Tax Client / Lead Guest',
      staySectionTitle: 'Fiscal Stay & Lodging Period',
      chargesTableTitle: 'Itemized Net & Taxable Services',
      notesSectionTitle: 'Fiscal Settlement & VAT Notes:',
      checkInInstructions: 'Standard check-in voucher. Subject to Portuguese hospitality VAT legislation under Article 18.º do CIVA.',
      paymentInstructions: 'Payment settled electronically or due at reception. Tax invoice validated by WaveHaven accounting.',
      certifiedBadgeText: 'Tax Audit Certified',
      stampLocation: 'Fiscal Authority Lisbon, PT',
      watermarkText: 'TAX CERTIFIED 2026',
      footerLegalText: 'Official Tax Invoice Voucher • Valid for Corporate Expense & VAT Reclamation',
      showSurfLevel: false,
      showBankDetails: true,
      bankDetailsText: 'Bank Wire / IBAN: PT50 0033 0000 1234 5678 9015 4 • BIC: BCPTPTLX • Beneficiary: WaveHaven Surf House Lda',
    },
  },
  {
    id: 'surf_pass',
    label: 'Surf Pass & Gate Voucher',
    description: 'Fast-track arrival voucher prioritizing QR gate code, beach quiver locker access, and Wi-Fi credentials.',
    template: {
      ...DEFAULT_INVOICE_TEMPLATE,
      id: 'tpl-surf-pass',
      name: 'Surf Pass & Gate Voucher',
      title: 'SURF PASS & ARRIVAL VOUCHER',
      subtitle: 'WaveHaven Beach House & Surf Quiver',
      invoiceNumberPrefix: 'SURF',
      accentColor: '#0284c7',
      guestSectionTitle: 'Surfer Details',
      staySectionTitle: 'Beach Lodge Session',
      chargesTableTitle: 'Bed & Surf Rental Breakdown',
      qrSectionTitle: 'Fast-Track Check-In QR Pass',
      qrSectionDescription: 'Present this QR pass at the front gate or board locker to receive your room key and wetsuit bundle.',
      notesSectionTitle: 'Surf House House Guidelines & Wave Desk:',
      checkInInstructions: 'Surf quiver lockers open 24/7. Daily surf lesson board meetings take place at 09:30 on the deck!',
      paymentInstructions: 'Surf lessons and equipment rentals charged to room folio.',
      certifiedBadgeText: 'Beach Pass Valid',
      stampLocation: 'Ericeira Surf Reserve',
      watermarkText: 'WAVEHAVEN SURFER',
      footerLegalText: 'Surf Pass Voucher • Keep on smartphone or print for check-in desk',
      showSurfLevel: true,
      showWifiDetails: true,
      showBankDetails: false,
    },
  },
];

export const INITIAL_SETTINGS: HostelSettings = {
  name: 'WaveHaven Surf House & Hostel',
  tagline: 'Eat. Sleep. Surf. Connect.',
  primaryBrandColor: '#0d9488',
  logoUrl: '',
  brandFooterStyle: 'dark',
  invoiceTemplateConfig: DEFAULT_INVOICE_TEMPLATE,
  themeConfig: {
    cornerRadius: 'rounded',
    borderWidth: 'thin',
    shadowIntensity: 'medium',
    presetId: 'coastal_organic',
    customRadiusPx: 16,
    customBorderPx: 1,
  },
  location: 'Praia do Sul, Ericeira, Portugal',
  country: 'Portugal',
  city: 'Ericeira',
  phone: '351912345678', // Default hostel WhatsApp number with country code
  emergencyPhone: '351918765432',
  email: 'hello@wavehavensurf.com',
  currency: 'EUR',
  currencySymbol: '€',
  taxRatePercent: 6, // 6% hospitality tax
  checkInTime: '14:00',
  checkOutTime: '11:00',
  quietHours: '23:00 - 08:00',
  minStayNights: 1,
  maxStayNights: 30,
  maxGuestsPerBooking: 8,
  ageRestriction: '18_plus',
  cancellationPolicy: 'flexible_48h',
  houseRules: '1. Rinse all surfboards and wetsuits at the outdoor wash station before entering.\n2. Respect quiet hours in dorms from 23:00 to 08:00.\n3. Keep communal kitchen clean and label your personal groceries.\n4. No smoking or wax melting indoors.\n5. Lockers provided in all rooms - bring your own padlock or rent at reception.',
  address: 'Rua das Ondas 42, 2655-321 Ericeira',
  googleMapsUrl: 'https://maps.google.com/?q=Ericeira+Portugal',
  operatingStatus: 'open',
  maintenanceNotice: '',
  timezone: 'Europe/Lisbon',
  depositRequirementPercent: 20,
  autoCancelUnpaidEnabled: false,
  autoCancelUnpaidDays: 3,
  keyDepositAmount: 20,
  acceptedPaymentMethods: ['cash', 'card', 'mbway', 'revolut'],
  bankTransferDetails: 'IBAN: PT50 0035 0123 4567 8901 2345 6\nBIC: CGDIPTPL\nBeneficiary: WaveHaven Surf House Lda',
  morningSurfSessionTime: '09:30',
  afternoonSurfSessionTime: '14:30',
  surfForecastUrl: 'https://magicseaweed.com/Ericeira-Surf-Report/123/',
  wifiNetworkName: 'WaveHaven-Surf-Guest',
  wifiPassword: 'CatchWaves2026',
  requireWaiver: true,
  webhookUrl: 'https://webhook.site/demo-surfhouse-notifications',
  webhookEnabled: true,
  autoSendWebhookOnBooking: true,
  autoRemindDaysBefore: 2,
  autoSendWelcomeGuide: true,
  customWhatsAppGreeting: 'Aloha from WaveHaven Surf House!',
  autoEmailReceiptDraftEnabled: true,
  webhookSecret: 'whsec_surfhouse_live_token',
  webhookEvents: {
    onBookingCreated: true,
    onBookingStatusChange: true,
    onReminderSent: true,
    onCancellation: true,
  },
};

export const INITIAL_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl-1',
    type: 'booking_confirmation',
    title: 'Instant Booking Voucher (WhatsApp)',
    subject: 'Reservation Confirmed at WaveHaven Surf House',
    daysTrigger: 0,
    content: `🤙 *WAVEHAVEN SURF HOUSE - RESERVATION CONFIRMED* 🤙

Aloha {guestName}! Your spot at WaveHaven Surf House is officially booked!

📋 *Booking Ref:* {bookingRef}
🏠 *Room / Dorm:* {roomName}
📅 *Check-in:* {checkInDate} (from {checkInTime})
📅 *Check-out:* {checkOutDate} (until {checkOutTime})
👥 *Guests:* {guestsCount} | *Nights:* {nights}
🏄 *Surf Level:* {surfLevel}

*Add-ons:*
{addOnsList}

💰 *Total Amount:* {totalAmount} {currency}
💳 *Payment Status:* {paymentStatus}

📍 *Location:* {address}
🗺️ *Map:* {googleMapsUrl}
📲 *Hostel WhatsApp:* +{hostelPhone}

We can't wait to catch waves together! If you need airport transfer or early check-in, reply to this message! 🏄‍♂️✨`,
    isActive: true,
  },
  {
    id: 'tpl-2',
    type: 'upcoming_stay_reminder',
    title: 'Upcoming Stay & Surf Check-in Reminder',
    subject: 'Ready for the waves? Your stay starts soon!',
    daysTrigger: 2,
    content: `🌊 *GET READY FOR THE SWELL!* 🌊

Hey {guestName}! We are stoked to welcome you to WaveHaven in *{daysUntil} days* (Check-in: {checkInDate} from {checkInTime}).

🏄 *Swell & Wind Forecast:*
The current forecast shows clean 3-5ft offshore sets rolling in this week! Perfect conditions for both lessons and free sessions.

🎒 *Quick Surf House Packing Checklist:*
• High-protection reef-safe zinc sunscreen
• Beach towel & reusable water bottle
• Your favorite board/wetsuit (or grab one from our in-house quiver)

🔑 *Check-in Instructions:*
Our front desk is open from 08:00 to 22:00. If arriving late, reply here and we'll send your digital key code!

See you on the beach! 🤙
WaveHaven Team`,
    isActive: true,
  },
  {
    id: 'tpl-3',
    type: 'checkin_guide',
    title: 'Check-in Day Welcome & Gate Code',
    subject: 'Welcome today to WaveHaven Surf House!',
    daysTrigger: 0,
    content: `🏄‍♂️ *WELCOME TO WAVEHAVEN TODAY!*

Aloha {guestName}! Today is check-in day ({checkInDate}).

Your room/bed in *{roomName}* will be squeaky clean and ready for you by {checkInTime}.

📍 Address: {address}
🔑 Main Surf Gate Code: *SHAKA-2026*
📶 Guest Wi-Fi: *WaveHaven_Surf_Guest* (Pass: *barrelrider*)

Join us at 18:30 on the rooftop for sunset drinks and surf briefing! 🍹`,
    isActive: true,
  },
  {
    id: 'tpl-email-receipt',
    type: 'email_receipt',
    title: 'Automated Email Receipt Draft',
    subject: '🏄‍♂️ Booking Receipt & Wave Voucher - #{bookingRef} | WaveHaven Surf House',
    daysTrigger: 0,
    channel: 'email',
    isActive: true,
    mimicWhatsAppFormat: true,
    content: `🏄‍♂️ *WAVEHAVEN SURF HOUSE - OFFICIAL BOOKING RECEIPT* 🤙

Aloha {guestName}!
Your reservation at WaveHaven Surf House is confirmed. Here is your automated booking receipt and check-in voucher.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RESERVATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Booking Reference: #{bookingRef}
• Lead Guest: {guestName}
• Contact Email: {email}
• WhatsApp / Mobile: {phone}
• Country of Origin: {country}
• Surf Skill Level: {surfLevel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛏️ STAY & ACCOMMODATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Room / Dorm: {roomName}
• Check-in Date: {checkInDate} (Open from {checkInTime})
• Check-out Date: {checkOutDate} (Check-out by {checkOutTime})
• Duration of Stay: {nights} night(s) | {guestsCount} guest(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 SURF & HOSPITALITY ADD-ONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{addOnsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 PAYMENT & FINANCIAL BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total Stay Amount: {totalAmount} {currency}
• Payment Status: {paymentStatus}
• Balance Due at Arrival: {balanceDue} {currency}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 LOCATION & ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Address: {address}
• Google Maps: {googleMapsUrl}
• Hostel Reception WhatsApp: +{hostelPhone}
• Front Desk Hours: 08:00 - 22:00
{notes}

🏄 Arrival Tip: If arriving after 22:00, reply to this email or send a quick WhatsApp to reception for late-arrival surf gate digital keypad instructions.

See you on the waves soon! 🌊
🤙 WaveHaven Front Desk Team`,
  },
];

// Generate dates relative to current date for realistic demonstration
const now = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const addDays = (d: Date, days: number) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

// Seed sample bookings: some arriving tomorrow, some in 3 days, some active
export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'booking-101',
    referenceNumber: 'WH-4821',
    roomId: 'room-1',
    roomName: 'Ocean Breeze 6-Bed Dorm',
    checkInDate: formatDate(addDays(now, 1)), // Arriving tomorrow (perfect for notification testing)
    checkOutDate: formatDate(addDays(now, 5)),
    nights: 4,
    guestsCount: 1,
    guest: {
      firstName: 'Mateo',
      lastName: 'Silva',
      email: 'mateo.silva@surfworld.io',
      phone: '34612987654',
      country: 'Spain',
      surfLevel: 'intermediate',
      arrivalEstimatedTime: '15:30',
      specialRequests: 'Bottom bunk preferred near the surfboard rack.',
      emergencyContactName: 'Elena Silva',
      emergencyContactPhone: '34699887766',
      loyaltyStatus: 'returning',
    },
    addOns: [
      { addOnId: 'addon-1', quantity: 1, days: 3 }, // 3 days lessons
      { addOnId: 'addon-5', quantity: 1, days: 4 }, // breakfast
    ],
    roomSubtotal: 112,
    addOnsSubtotal: 183,
    taxAmount: 17.7,
    totalAmount: 312.7,
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    adminNotes: 'Returning guest from last season, loves reef breaks.',
    whatsappSentCount: 1,
    webhookSentCount: 1,
    lastNotificationSent: new Date(Date.now() - 3 * 86400000).toISOString(),
    stayReminderSent: false,
  },
  {
    id: 'booking-102',
    referenceNumber: 'WH-5912',
    roomId: 'room-4',
    roomName: 'The Point Break Private Double',
    checkInDate: formatDate(addDays(now, 2)), // Arriving in 2 days
    checkOutDate: formatDate(addDays(now, 7)),
    nights: 5,
    guestsCount: 2,
    guest: {
      firstName: 'Sophie',
      lastName: 'Dupont',
      email: 'sophie.dupont@paris.fr',
      phone: '33678901234',
      country: 'France',
      surfLevel: 'beginner',
      arrivalEstimatedTime: '18:00',
      specialRequests: 'Celebrating 2-year anniversary with partner Lucas. Vegetarian breakfast.',
      loyaltyStatus: 'vip',
    },
    addOns: [
      { addOnId: 'addon-1', quantity: 2, days: 4 }, // Lessons for 2
      { addOnId: 'addon-4', quantity: 2, days: 5 }, // Yoga
      { addOnId: 'addon-6', quantity: 1, days: 1 }, // Airport transfer
    ],
    roomSubtotal: 425,
    addOnsSubtotal: 545,
    taxAmount: 58.2,
    totalAmount: 1028.2,
    status: 'confirmed',
    paymentStatus: 'deposit',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    adminNotes: 'Booked airport transfer from Lisbon airport flight TP1024.',
    whatsappSentCount: 1,
    webhookSentCount: 1,
    stayReminderSent: false,
  },
  {
    id: 'booking-103',
    referenceNumber: 'WH-6304',
    roomId: 'room-5',
    roomName: 'The Pipeline Oceanfront Suite',
    checkInDate: formatDate(addDays(now, 0)), // Arriving today!
    checkOutDate: formatDate(addDays(now, 4)),
    nights: 4,
    guestsCount: 2,
    guest: {
      firstName: 'Liam',
      lastName: 'O\'Connor',
      email: 'liam.surfs@dublin.ie',
      phone: '353871234567',
      country: 'Ireland',
      surfLevel: 'advanced',
      arrivalEstimatedTime: '14:15',
      specialRequests: 'Wants to test 6\'0 shortboard from quiver.',
      loyaltyStatus: 'new',
    },
    addOns: [
      { addOnId: 'addon-2', quantity: 1, days: 4 }, // Quiver rental
      { addOnId: 'addon-5', quantity: 2, days: 4 }, // Breakfast for 2
    ],
    roomSubtotal: 540,
    addOnsSubtotal: 176,
    taxAmount: 42.96,
    totalAmount: 758.96,
    status: 'checked_in',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    adminNotes: 'Checked in at 14:10, given key card and locker 5.',
    whatsappSentCount: 2,
    webhookSentCount: 2,
    lastNotificationSent: new Date().toISOString(),
    stayReminderSent: true,
  },
  {
    id: 'booking-104',
    referenceNumber: 'WH-7210',
    roomId: 'room-2',
    roomName: 'Mermaid Sanctuary 4-Bed Female Dorm',
    checkInDate: formatDate(addDays(now, 6)),
    checkOutDate: formatDate(addDays(now, 10)),
    nights: 4,
    guestsCount: 1,
    guest: {
      firstName: 'Camila',
      lastName: 'Morales',
      email: 'camila.morales@rio.br',
      phone: '5521998877665',
      country: 'Brazil',
      surfLevel: 'intermediate',
      arrivalEstimatedTime: '16:00',
      loyaltyStatus: 'new',
    },
    addOns: [
      { addOnId: 'addon-4', quantity: 1, days: 4 },
    ],
    roomSubtotal: 136,
    addOnsSubtotal: 60,
    taxAmount: 11.76,
    totalAmount: 207.76,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    adminNotes: 'Awaiting deposit payment transfer confirmation.',
    whatsappSentCount: 0,
    webhookSentCount: 1,
    stayReminderSent: false,
  },
  {
    id: 'booking-105',
    referenceNumber: 'WH-8834',
    roomId: 'room-3',
    roomName: 'Sunset Shaka 4-Bed Mixed Dorm',
    checkInDate: formatDate(addDays(now, 3)),
    checkOutDate: formatDate(addDays(now, 8)),
    nights: 5,
    guestsCount: 1,
    guest: {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.j@surfaustralia.com',
      phone: '61412345678',
      country: 'Australia',
      surfLevel: 'advanced',
      arrivalEstimatedTime: '11:00',
      specialRequests: 'Dawn patrol enthusiast, early risers bunk.',
      loyaltyStatus: 'returning',
    },
    addOns: [
      { addOnId: 'addon-2', quantity: 1, days: 5 },
    ],
    roomSubtotal: 180,
    addOnsSubtotal: 110,
    taxAmount: 17.4,
    totalAmount: 307.4,
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    adminNotes: 'Paid in full via Stripe card terminal.',
    whatsappSentCount: 1,
    webhookSentCount: 1,
    stayReminderSent: false,
  },
  {
    id: 'booking-106',
    referenceNumber: 'WH-9102',
    roomId: 'room-4',
    roomName: 'The Point Break Private Double',
    checkInDate: formatDate(addDays(now, 14)),
    checkOutDate: formatDate(addDays(now, 20)),
    nights: 6,
    guestsCount: 2,
    guest: {
      firstName: 'Kai',
      lastName: 'Takahashi',
      email: 'kai.t@tokyo-waves.jp',
      phone: '819012345678',
      country: 'Japan',
      surfLevel: 'intermediate',
      arrivalEstimatedTime: '17:30',
      specialRequests: 'Would love video analysis for surf coaching.',
      loyaltyStatus: 'local_legend',
    },
    addOns: [
      { addOnId: 'addon-1', quantity: 2, days: 5 },
      { addOnId: 'addon-3', quantity: 2, days: 1 },
    ],
    roomSubtotal: 510,
    addOnsSubtotal: 470,
    taxAmount: 58.8,
    totalAmount: 1038.8,
    status: 'confirmed',
    paymentStatus: 'deposit',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    adminNotes: '30% deposit received. Balance due upon arrival.',
    whatsappSentCount: 1,
    webhookSentCount: 1,
    stayReminderSent: false,
  },
  {
    id: 'booking-107',
    referenceNumber: 'WH-3091',
    roomId: 'room-1',
    roomName: 'Ocean Breeze 6-Bed Dorm',
    checkInDate: formatDate(addDays(now, 8)),
    checkOutDate: formatDate(addDays(now, 12)),
    nights: 4,
    guestsCount: 1,
    guest: {
      firstName: 'Marco',
      lastName: 'Rossi',
      email: 'marco.rossi@surfmilano.it',
      phone: '393312345678',
      country: 'Italy',
      surfLevel: 'beginner',
      arrivalEstimatedTime: '14:00',
      specialRequests: 'Awaiting deposit bank transfer confirmation.',
      loyaltyStatus: 'new',
    },
    addOns: [],
    roomSubtotal: 112,
    addOnsSubtotal: 0,
    taxAmount: 6.72,
    totalAmount: 118.72,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    adminNotes: 'Tentative reservation hold. Deposit not yet received.',
    whatsappSentCount: 0,
    webhookSentCount: 0,
    stayReminderSent: false,
  },
  {
    id: 'booking-108',
    referenceNumber: 'WH-2048',
    roomId: 'room-3',
    roomName: 'Sunset Shaka 4-Bed Mixed Dorm',
    checkInDate: formatDate(addDays(now, 16)),
    checkOutDate: formatDate(addDays(now, 21)),
    nights: 5,
    guestsCount: 1,
    guest: {
      firstName: 'Mateo',
      lastName: 'Silva',
      email: 'mateo.silva@surfworld.io',
      phone: '34612987654', // Matched phone with WH-4821
      country: 'Spain',
      surfLevel: 'intermediate',
      arrivalEstimatedTime: '16:00',
      specialRequests: 'Returning for the mid-season swell. Bottom bunk please!',
      emergencyContactName: 'Elena Silva',
      emergencyContactPhone: '34699887766',
      loyaltyStatus: 'returning',
    },
    addOns: [
      { addOnId: 'addon-1', quantity: 1, days: 3 },
    ],
    roomSubtotal: 180,
    addOnsSubtotal: 135,
    taxAmount: 18.9,
    totalAmount: 333.9,
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    adminNotes: 'Second stay booked this season. Profile matched by phone number.',
    whatsappSentCount: 1,
    webhookSentCount: 1,
    stayReminderSent: false,
  },
  {
    id: 'booking-109',
    referenceNumber: 'WH-1120',
    roomId: 'room-1',
    roomName: 'Ocean Breeze 6-Bed Dorm',
    checkInDate: formatDate(addDays(now, -14)),
    checkOutDate: formatDate(addDays(now, -10)),
    nights: 4,
    guestsCount: 1,
    guest: {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.j@surfaustralia.com',
      phone: '61412345678', // Matched phone with WH-8834
      country: 'Australia',
      surfLevel: 'advanced',
      loyaltyStatus: 'returning',
    },
    addOns: [],
    roomSubtotal: 112,
    addOnsSubtotal: 0,
    taxAmount: 6.72,
    totalAmount: 118.72,
    status: 'checked_out',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    adminNotes: 'Previous stay completed. Dawn patrol legend, matched by phone.',
    whatsappSentCount: 2,
    webhookSentCount: 2,
    stayReminderSent: true,
  },
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 'waitlist-1',
    queueNumber: 1,
    roomId: 'room-4',
    roomName: 'The Point Break Private Double',
    checkInDate: formatDate(addDays(now, 2)),
    checkOutDate: formatDate(addDays(now, 6)),
    nights: 4,
    guestsCount: 2,
    guest: {
      firstName: 'Jonas',
      lastName: 'Berg',
      email: 'jonas.berg@stockholm.se',
      phone: '46701234567',
      country: 'Sweden',
      surfLevel: 'intermediate',
      notes: 'Honeymoon surf trip, willing to upgrade to suite if double is unavailable.',
    },
    priority: 'vip',
    status: 'waiting',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    adminNotes: 'VIP guest from surf camp partner in Ericeira.',
  },
  {
    id: 'waitlist-2',
    queueNumber: 1,
    roomId: 'room-5',
    roomName: 'The Pipeline Oceanfront Suite',
    checkInDate: formatDate(addDays(now, 8)),
    checkOutDate: formatDate(addDays(now, 12)),
    nights: 4,
    guestsCount: 2,
    guest: {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.j@surfaustralia.com',
      phone: '61412345678',
      country: 'Australia',
      surfLevel: 'advanced',
      notes: 'Traveling with 3 boards, requesting wave check deck room.',
    },
    priority: 'high',
    status: 'waiting',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    adminNotes: 'Looking specifically for Oceanfront Suite view.',
  },
  {
    id: 'waitlist-3',
    queueNumber: 1,
    roomId: 'room-1',
    roomName: 'Ocean Breeze 6-Bed Dorm',
    checkInDate: formatDate(addDays(now, 1)),
    checkOutDate: formatDate(addDays(now, 5)),
    nights: 4,
    guestsCount: 1,
    guest: {
      firstName: 'Lucas',
      lastName: 'Meyer',
      email: 'lucas.m@berlin-surf.de',
      phone: '4915123456789',
      country: 'Germany',
      surfLevel: 'beginner',
      notes: 'Solo backpacker, joining surf school coaching group.',
    },
    priority: 'normal',
    status: 'notified',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    notifiedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    adminNotes: 'WhatsApp notification sent with 24-hour reservation hold.',
  },
];
