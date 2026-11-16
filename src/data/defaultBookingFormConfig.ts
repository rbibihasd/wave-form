import { BookingFormConfig } from '../types';

export const DEFAULT_BOOKING_FORM_CONFIG: BookingFormConfig = {
  id: 'form-config-default',
  name: 'WaveHaven Signature Surf & Stay Flow',
  description: 'Balanced 5-step hostel & surf camp booking flow with real-time bed availability, surf coaching packages, and instant check-in confirmation.',
  version: 1,
  heroBadgeText: 'Verified Direct Bed Booking',
  bannerNotice: '🏄 Book 4+ nights and enjoy free surfboard quiver locker & daily sunset roof yoga pass!',
  themeAccentColor: '#0d9488',
  showSavingsBadge: true,
  requireWaiver: true,
  updatedAt: new Date().toISOString(),
  steps: [
    {
      id: 'dates',
      stepNumber: 1,
      name: 'Dates & Guests',
      title: 'When are you paddling out?',
      subtitle: 'Select your arrival and departure dates to check real-time bed availability.',
      badge: 'Step 1 of 5',
      enabled: true,
      ctaButtonText: 'Check Real-Time Availability',
      customFields: [
        {
          id: 'field-surf-goal',
          label: 'Primary Trip Objective',
          type: 'select',
          options: ['Learn to Surf (Beginner)', 'Improve Technique & Turns', 'Surf High Performance Waves', 'Relax, Beach & Remote Work'],
          required: false,
          helpText: 'Helps our team assign you to optimal surf coaches and tide windows.',
          placeholder: 'Select your main focus',
          stepTarget: 'dates',
        },
      ],
    },
    {
      id: 'rooms',
      stepNumber: 2,
      name: 'Room / Bed',
      title: 'Choose your room or bunk',
      subtitle: 'Filter between oceanfront private suites or lively shared surf dorms.',
      badge: 'Step 2 of 5',
      enabled: true,
      ctaButtonText: 'Continue to Surf Add-ons',
      customFields: [],
    },
    {
      id: 'addons',
      stepNumber: 3,
      name: 'Surf Coaching & Add-ons',
      title: 'Customize your surf & stay package',
      subtitle: 'Boost your holiday with daily surf coaching, board quivers, organic breakfasts, and yoga.',
      badge: 'Step 3 of 5',
      enabled: true,
      ctaButtonText: 'Continue to Guest Details',
      customFields: [
        {
          id: 'field-wetsuit-size',
          label: 'Wetsuit Size (if renting gear/lessons)',
          type: 'select',
          options: ['XS', 'S', 'M', 'L', 'XL', 'Bringing My Own Wetsuit'],
          required: false,
          helpText: 'We prepare your 3/2 or 4/3 wetsuit so it is ready on your rack upon arrival.',
          stepTarget: 'addons',
        },
      ],
    },
    {
      id: 'guest',
      stepNumber: 4,
      name: 'Guest Details',
      title: 'Guest details & preferences',
      subtitle: 'Tell us who is paddling out so we can prepare your bed, surf locker, and arrival codes.',
      badge: 'Step 4 of 5',
      enabled: true,
      ctaButtonText: 'Review & Confirm Booking',
      customFields: [
        {
          id: 'field-dietary',
          label: 'Dietary Restrictions / Allergies',
          type: 'text',
          placeholder: 'e.g. Vegetarian, Vegan, Gluten-free, none',
          required: false,
          helpText: 'Important for communal dinners and breakfast buffet preparation.',
          stepTarget: 'guest',
        },
        {
          id: 'field-flight-transfer',
          label: 'Flight Number or Arrival Station (Optional)',
          type: 'text',
          placeholder: 'e.g. Flight TP1024 or Ericeira Bus Station',
          required: false,
          helpText: 'Enables our surf van dispatch to track arrival delays in real time.',
          stepTarget: 'guest',
        },
        {
          id: 'field-rules-agreement',
          label: 'I agree to the Surf House Quiet Hours (23:00 - 08:00) & Equipment Wash Station Rule',
          type: 'checkbox',
          required: true,
          defaultValue: true,
          helpText: 'Ensures great rest before dawn patrol sessions.',
          stepTarget: 'guest',
        },
      ],
    },
    {
      id: 'confirmation',
      stepNumber: 5,
      name: 'Confirmation',
      title: 'Reservation Confirmed & Locked In!',
      subtitle: 'Download your certified printable invoice with QR code or dispatch to WhatsApp.',
      badge: 'Final Step',
      enabled: true,
      ctaButtonText: 'Back to Stays Overview',
      customFields: [],
    },
  ],
};

export const PRESET_BOOKING_FORM_TEMPLATES: BookingFormConfig[] = [
  DEFAULT_BOOKING_FORM_CONFIG,
  {
    id: 'form-config-yoga-retreat',
    name: 'Surf & Yoga Wellness Retreat Flow',
    description: 'Specialized 5-step flow designed for mindful surf & yoga retreats with daily vinyasa classes, organic plant-based nutrition, and restorative wellness options.',
    version: 1,
    heroBadgeText: 'Mindful Surf & Yoga Retreat',
    bannerNotice: '🧘 Special Offer: 2 daily rooftop ocean-view yoga sessions and fresh cold-pressed morning juice included!',
    themeAccentColor: '#7c3aed',
    showSavingsBadge: true,
    requireWaiver: true,
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'dates',
        stepNumber: 1,
        name: 'Dates & Retreat Week',
        title: 'Choose your Wellness Swell Window',
        subtitle: 'Select your retreat arrival and departure dates to align with our tide and yoga schedules.',
        badge: 'Retreat Dates',
        enabled: true,
        ctaButtonText: 'Check Retreat Bed Availability',
        customFields: [
          {
            id: 'field-yoga-experience',
            label: 'Yoga & Meditation Experience',
            type: 'select',
            options: ['Beginner (First Time)', 'Practicing 1-2 years', 'Advanced Yogi', 'Yoga Teacher'],
            required: false,
            helpText: 'Allows our resident yoga instructor to tailor sequence intensity.',
            stepTarget: 'dates',
          },
        ],
      },
      {
        id: 'rooms',
        stepNumber: 2,
        name: 'Sanctuary Room / Bed',
        title: 'Select your Peaceful Stay Room',
        subtitle: 'Choose between private garden balcony suites or soothing quiet dorms.',
        badge: 'Sanctuary Selection',
        enabled: true,
        ctaButtonText: 'Continue to Wellness & Surf Options',
      },
      {
        id: 'addons',
        stepNumber: 3,
        name: 'Yoga, Meals & Surf Coaching',
        title: 'Curate your Wellness & Surf Pack',
        subtitle: 'Complement your stay with rooftop sunset yoga, healthy organic meals, and sound healing sessions.',
        badge: 'Wellness Packages',
        enabled: true,
        ctaButtonText: 'Continue to Guest Details',
        customFields: [
          {
            id: 'field-massage-booking',
            label: 'Interested in In-House Deep Tissue Sports Massage?',
            type: 'select',
            options: ['No thanks', '1x Post-Surf 60min Session', '2x Restorative 60min Sessions'],
            required: false,
            helpText: 'Conducted on the rooftop sun deck by licensed physiotherapists.',
            stepTarget: 'addons',
          },
        ],
      },
      {
        id: 'guest',
        stepNumber: 4,
        name: 'Guest Details & Health Info',
        title: 'Personal Details & Dietary Lifestyle',
        subtitle: 'Help us tailor your nutrition plan and prepare your wellness welcome basket.',
        badge: 'Health & Details',
        enabled: true,
        ctaButtonText: 'Review Retreat Reservation',
        customFields: [
          {
            id: 'field-dietary-spec',
            label: 'Dietary Preferences for Retreat Meals',
            type: 'select',
            options: ['Plant-Based / Vegan', 'Vegetarian', 'Pescatarian', 'No Dietary Restrictions'],
            required: true,
            helpText: 'Our private chef prepares fresh local seasonal ingredients for all shared meals.',
            stepTarget: 'guest',
          },
          {
            id: 'field-injuries',
            label: 'Prior Injuries or Physical Limitations (Optional)',
            type: 'text',
            placeholder: 'e.g. Lower back sensitivity, knee surgery, none',
            required: false,
            helpText: 'Shared confidentially with our surf and yoga coaching staff.',
            stepTarget: 'guest',
          },
          {
            id: 'field-wellness-waiver',
            label: 'I understand physical activity is involved and agree to practice within personal limits',
            type: 'checkbox',
            required: true,
            defaultValue: true,
            stepTarget: 'guest',
          },
        ],
      },
      {
        id: 'confirmation',
        stepNumber: 5,
        name: 'Retreat Confirmed',
        title: 'Your Retreat Spot is Confirmed!',
        subtitle: 'Namaste! Your spot at WaveHaven Wellness Camp is locked in. Save your QR voucher.',
        badge: 'All Set',
        enabled: true,
        ctaButtonText: 'Back to Overview',
      },
    ],
  },
  {
    id: 'form-config-digital-nomad',
    name: 'Digital Nomad Coliving & Surf Flow',
    description: 'Tailored for remote workers and coliving communities with high-speed fiber desk allocation, weekly stay incentives, and quiet work agreements.',
    version: 1,
    heroBadgeText: 'Work & Surf Coliving Hub',
    bannerNotice: '💻 Ultra-fast 500Mbps dual-redundant fiber Wi-Fi, ergonomic desk setup, and 24/7 quiet coworking room access!',
    themeAccentColor: '#0284c7',
    showSavingsBadge: true,
    requireWaiver: false,
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'dates',
        stepNumber: 1,
        name: 'Dates & Coliving Window',
        title: 'Choose your Coliving & Work Dates',
        subtitle: 'Book by the week or month. Special long-stay discounts automatically applied on 14+ nights.',
        badge: 'Nomad Dates',
        enabled: true,
        ctaButtonText: 'Check Desk & Bed Availability',
        customFields: [
          {
            id: 'field-work-schedule',
            label: 'Working Timezone & Hours',
            type: 'select',
            options: ['European (GMT / CET)', 'US East Coast (EST)', 'US West Coast (PST)', 'Flexible / Freelance'],
            required: false,
            helpText: 'Helps us place you in a quiet zone suited to your meeting schedule.',
            stepTarget: 'dates',
          },
        ],
      },
      {
        id: 'rooms',
        stepNumber: 2,
        name: 'Coliving Room / Bed',
        title: 'Select your Living & Work Quarters',
        subtitle: 'Choose between quiet double suites with private desk or budget-friendly worker dorms.',
        badge: 'Room Selection',
        enabled: true,
        ctaButtonText: 'Continue to Nomad Add-ons',
      },
      {
        id: 'addons',
        stepNumber: 3,
        name: 'Coworking & Surf Packages',
        title: 'Add Surf Passes & Coworking Amenities',
        subtitle: 'Add weekend surf lessons, 27-inch secondary monitor rentals, or daily barista coffee passes.',
        badge: 'Work & Wave Perks',
        enabled: true,
        ctaButtonText: 'Continue to Nomad Profile',
        customFields: [
          {
            id: 'field-monitor-rental',
            label: 'Reserve 27-Inch 4K External Monitor & USB-C Dock?',
            type: 'select',
            options: ['No, using laptop only', 'Yes, reserve monitor for my stay (€5/day)'],
            required: false,
            helpText: 'Includes HDMI/USB-C cables and height-adjustable stand.',
            stepTarget: 'addons',
          },
        ],
      },
      {
        id: 'guest',
        stepNumber: 4,
        name: 'Nomad Profile & Details',
        title: 'Remote Worker Profile',
        subtitle: 'Connect with our community before you land. Tell us what you work on!',
        badge: 'Nomad Profile',
        enabled: true,
        ctaButtonText: 'Review Coliving Reservation',
        customFields: [
          {
            id: 'field-profession',
            label: 'Profession / Company / Project',
            type: 'text',
            placeholder: 'e.g. Software Engineer, Designer, Founder, Writer',
            required: false,
            helpText: 'Shared on our in-house nomad Slack / WhatsApp community board.',
            stepTarget: 'guest',
          },
          {
            id: 'field-cowork-rules',
            label: 'I agree to use call booths for loud video calls and maintain silence in the quiet coworking lab',
            type: 'checkbox',
            required: true,
            defaultValue: true,
            stepTarget: 'guest',
          },
        ],
      },
      {
        id: 'confirmation',
        stepNumber: 5,
        name: 'Coliving Confirmed',
        title: 'Welcome to the WaveHaven Nomad Community!',
        subtitle: 'Your workstation and room are reserved. High-speed Wi-Fi passwords and Slack link sent to your phone.',
        badge: 'Confirmed',
        enabled: true,
        ctaButtonText: 'Back to Hostel Hub',
      },
    ],
  },
  {
    id: 'form-config-beginner-camp',
    name: 'Beginner Wave Academy Camp Flow',
    description: 'Optimized 5-step flow for first-time surfers with wetsuit and surfboard sizing questions, safety briefings, and video analysis focus.',
    version: 1,
    heroBadgeText: 'Zero-to-Hero Surf Camp',
    bannerNotice: '🏄 100% Wave Catch Guarantee: Certified ISA Level 2 instructors, soft-top quiver, and daily video coaching included!',
    themeAccentColor: '#059669',
    showSavingsBadge: true,
    requireWaiver: true,
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'dates',
        stepNumber: 1,
        name: 'Camp Dates',
        title: 'Pick your Beginner Surf Week',
        subtitle: 'Our progressive camps run Monday to Sunday, matching soft sandy beach break tides.',
        badge: 'Camp Dates',
        enabled: true,
        ctaButtonText: 'Check Camp Bed Availability',
      },
      {
        id: 'rooms',
        stepNumber: 2,
        name: 'Camp Room',
        title: 'Select your Camp Accommodation',
        subtitle: 'Stay in our friendly team dorms or book a private room for couples.',
        badge: 'Room Selection',
        enabled: true,
        ctaButtonText: 'Continue to Gear & Coaching',
      },
      {
        id: 'addons',
        stepNumber: 3,
        name: 'Academy Coaching & Gear',
        title: 'All-Inclusive Beginner Surf Pack',
        subtitle: 'Daily 2-hour group coaching, unlimited soft-top board usage, and evening video clinics.',
        badge: 'Coaching & Quiver',
        enabled: true,
        ctaButtonText: 'Continue to Surfer Profile',
        customFields: [
          {
            id: 'field-swimming-ability',
            label: 'Swimming Comfort Level in Ocean Water',
            type: 'select',
            options: ['Confident ocean swimmer', 'Can swim 100m in pool', 'Need life vest / extra instructor attention'],
            required: true,
            helpText: 'Safety is paramount. All lessons take place in waist-deep water with lifeguards on duty.',
            stepTarget: 'addons',
          },
        ],
      },
      {
        id: 'guest',
        stepNumber: 4,
        name: 'Surfer Details & Sizing',
        title: 'Wetsuit & Equipment Sizing Details',
        subtitle: 'Provide your height and weight so our gear master can set aside the perfect surfboard and wetsuit.',
        badge: 'Gear Sizing',
        enabled: true,
        ctaButtonText: 'Review Academy Booking',
        customFields: [
          {
            id: 'field-height-weight',
            label: 'Height (cm) & Weight (kg) for Board Sizing',
            type: 'text',
            placeholder: 'e.g. 178 cm / 72 kg',
            required: true,
            helpText: 'Ensures we prepare the right volume foamie surfboard for maximum wave catching.',
            stepTarget: 'guest',
          },
          {
            id: 'field-surf-safety-waiver',
            label: 'I understand water sports carry natural risks and agree to follow all instructor safety commands',
            type: 'checkbox',
            required: true,
            defaultValue: true,
            stepTarget: 'guest',
          },
        ],
      },
      {
        id: 'confirmation',
        stepNumber: 5,
        name: 'Academy Spot Locked In',
        title: 'You are on your way to catching green waves!',
        subtitle: 'Your beginner camp pass is locked in. See you on the beach!',
        badge: 'Ready to Surf',
        enabled: true,
        ctaButtonText: 'Back to Stays',
      },
    ],
  },
];

/**
 * Smart template generator that creates customized multi-step forms based on prompt keywords
 * without needing an external internet connection or code changes.
 */
export function generateSmartTemplateFromPrompt(prompt: string): BookingFormConfig {
  const p = prompt.toLowerCase();
  
  const isYoga = p.includes('yoga') || p.includes('wellness') || p.includes('meditat') || p.includes('retreat');
  const isNomad = p.includes('nomad') || p.includes('work') || p.includes('coliving') || p.includes('remote') || p.includes('desk');
  const isBeginner = p.includes('beginner') || p.includes('academy') || p.includes('learn') || p.includes('lesson');
  const isLuxury = p.includes('luxury') || p.includes('private') || p.includes('vip') || p.includes('suite') || p.includes('couples');
  const isFamily = p.includes('family') || p.includes('kids') || p.includes('children');
  const isWeekend = p.includes('weekend') || p.includes('party') || p.includes('short') || p.includes('bbq');

  let name = 'Custom AI-Generated Surf Booking Flow';
  let description = `Custom multi-step booking engine crafted for: "${prompt}"`;
  let themeAccentColor = '#0d9488';
  let heroBadge = 'AI Tailored Booking Flow';
  let banner = '🏄 Custom surf house experience tailored to your exact stay preferences.';

  if (isYoga) {
    name = 'Sunlit Surf & Yoga Sanctuary Flow';
    themeAccentColor = '#7c3aed';
    heroBadge = 'Mindful Surf & Yoga Experience';
    banner = '🧘 2 daily ocean-view yoga sessions, herbal infusions & organic brunch included!';
  } else if (isNomad) {
    name = 'Wave & Work Coliving Booking Engine';
    themeAccentColor = '#0284c7';
    heroBadge = 'High-Speed Coliving Hub';
    banner = '💻 500Mbps dual-mesh fiber Wi-Fi, 24/7 dedicated desk access & community dinners.';
  } else if (isBeginner) {
    name = 'First Waves Intensive Academy Flow';
    themeAccentColor = '#059669';
    heroBadge = 'Beginner Surf Academy';
    banner = '🏄 Daily video wave analysis, soft-top board quiver & certified ISA coaches.';
  } else if (isLuxury) {
    name = 'VIP Oceanfront Suite & Coaching Experience';
    themeAccentColor = '#f43f5e';
    heroBadge = 'Luxury Private Surf Retreat';
    banner = '👑 Private surf guide, premium oceanfront suite, airport transfers & evening seafood dinner.';
  } else if (isFamily) {
    name = 'Family Surf Adventure & Camp Flow';
    themeAccentColor = '#d97706';
    heroBadge = 'Family Friendly Surf Haven';
    banner = '🌴 Kid-friendly surf lessons, spacious family rooms, and beach picnic baskets.';
  } else if (isWeekend) {
    name = 'Weekend Surf & Sunset Social Flow';
    themeAccentColor = '#f59e0b';
    heroBadge = 'Weekend Waves Getaway';
    banner = '🔥 Saturday sunset rooftop BBQ, 2 group surf coaching sessions & welcome cocktail.';
  }

  // Derive custom fields tailored to prompt
  const step1CustomFields = [];
  const step3CustomFields = [];
  const step4CustomFields = [];

  if (isYoga) {
    step1CustomFields.push({
      id: 'field-yoga-level',
      label: 'Yoga Style Preference',
      type: 'select' as const,
      options: ['Vinyasa Flow', 'Yin & Restorative', 'Ashtanga', 'All Levels Welcome'],
      required: false,
      helpText: 'Allows our resident instructor to adjust sequences.',
      stepTarget: 'dates' as const,
    });
    step4CustomFields.push({
      id: 'field-yoga-diet',
      label: 'Dietary Preferences for Retreat Meals',
      type: 'select' as const,
      options: ['Plant-Based / Vegan', 'Vegetarian', 'Gluten-Free', 'No Restrictions'],
      required: true,
      helpText: 'For our organic communal retreat kitchen.',
      stepTarget: 'guest' as const,
    });
  }

  if (isNomad) {
    step1CustomFields.push({
      id: 'field-work-tz',
      label: 'Primary Work Timezone',
      type: 'select' as const,
      options: ['CET (European)', 'EST (US East Coast)', 'PST (US West Coast)', 'Other / Flexible'],
      required: false,
      helpText: 'Helps us allocate your workspace desk.',
      stepTarget: 'dates' as const,
    });
    step3CustomFields.push({
      id: 'field-second-screen',
      label: 'Request 27" 4K Monitor at Coworking Desk?',
      type: 'select' as const,
      options: ['No, laptop only', 'Yes, reserve monitor (€5/day)'],
      required: false,
      stepTarget: 'addons' as const,
    });
  }

  if (isBeginner) {
    step3CustomFields.push({
      id: 'field-swimming-conf',
      label: 'Ocean Swimming Comfort',
      type: 'select' as const,
      options: ['Confident', 'Moderate', 'Require close instructor supervision'],
      required: true,
      stepTarget: 'addons' as const,
    });
    step4CustomFields.push({
      id: 'field-wetsuit-size-req',
      label: 'Wetsuit & T-Shirt Size',
      type: 'select' as const,
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      required: true,
      stepTarget: 'guest' as const,
    });
  }

  // Common safety / request fields
  step4CustomFields.push({
    id: 'field-arrival-info',
    label: 'Estimated Arrival Time / Flight Details',
    type: 'text' as const,
    placeholder: 'e.g. 15:30 or Flight TP1024',
    required: false,
    helpText: 'Helps our team prepare your room and arrival pin codes.',
    stepTarget: 'guest' as const,
  });

  step4CustomFields.push({
    id: 'field-house-rules-agree',
    label: 'I agree to the Surf House Respect & Quiet Hours Policy (23:00 - 08:00)',
    type: 'checkbox' as const,
    required: true,
    defaultValue: true,
    stepTarget: 'guest' as const,
  });

  return {
    id: 'form-config-' + Date.now(),
    name,
    description,
    version: 1,
    heroBadgeText: heroBadge,
    bannerNotice: banner,
    themeAccentColor,
    showSavingsBadge: true,
    requireWaiver: isBeginner || isYoga,
    lastGeneratedPrompt: prompt,
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'dates',
        stepNumber: 1,
        name: isYoga ? 'Retreat Dates' : isNomad ? 'Coliving Dates' : 'Stay Dates',
        title: isYoga ? 'Select your Yoga & Surf Swell Window' : isNomad ? 'Select your Coliving & Work Dates' : 'When are you arriving at WaveHaven?',
        subtitle: 'Pick your check-in and check-out dates to view real-time bed and room availability.',
        badge: 'Step 1 of 5',
        enabled: true,
        ctaButtonText: 'Check Available Stays',
        customFields: step1CustomFields,
      },
      {
        id: 'rooms',
        stepNumber: 2,
        name: 'Room / Bed',
        title: isLuxury ? 'Select your Luxury Private Suite' : 'Choose your Bed or Private Room',
        subtitle: 'Choose between oceanfront private double suites or social surf dormitories.',
        badge: 'Step 2 of 5',
        enabled: true,
        ctaButtonText: 'Continue to Packages & Add-ons',
      },
      {
        id: 'addons',
        stepNumber: 3,
        name: isYoga ? 'Yoga & Coaching Pack' : isNomad ? 'Work & Wave Perks' : 'Surf Lessons & Add-ons',
        title: 'Enhance your Holiday with Add-on Packages',
        subtitle: 'Choose from certified coaching, board quivers, healthy breakfasts, and transfers.',
        badge: 'Step 3 of 5',
        enabled: true,
        ctaButtonText: 'Continue to Guest Details',
        customFields: step3CustomFields,
      },
      {
        id: 'guest',
        stepNumber: 4,
        name: 'Guest Profile & Preferences',
        title: 'Guest Details & Personalized Preferences',
        subtitle: 'Fill in your details so our front desk and surf instructors can prepare your arrival.',
        badge: 'Step 4 of 5',
        enabled: true,
        ctaButtonText: 'Review & Confirm Reservation',
        customFields: step4CustomFields,
      },
      {
        id: 'confirmation',
        stepNumber: 5,
        name: 'Reservation Confirmed',
        title: 'Your Stay is Officially Confirmed!',
        subtitle: 'A confirmation voucher and gate code have been prepared. Print your invoice or view QR code.',
        badge: 'Confirmed',
        enabled: true,
        ctaButtonText: 'Back to Overview',
      },
    ],
  };
}
