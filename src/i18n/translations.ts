import { SupportedLanguage } from '../types';

export type { SupportedLanguage };

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  isRTL?: boolean;
  isCustom?: boolean;
}

export const DEFAULT_SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', isRTL: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', isRTL: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isRTL: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isRTL: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true },
];

export const SUPPORTED_LANGUAGES: LanguageOption[] = DEFAULT_SUPPORTED_LANGUAGES;

export const translations = {
  en: {
    languageName: 'English',
    nav: {
      bookStay: 'Book Stay',
      liveWeather: 'Ocean & Waves',
      admin: 'Admin Portal',
      adminDashboard: 'Admin Dashboard',
      staffLogin: 'Staff Login',
      logout: 'Log Out',
      guestBooking: 'Guest Booking',
      settings: 'Settings',
      lookupRef: 'Lookup REF',
      findBooking: 'Find Booking',
      whatsAppChat: 'WhatsApp Support',
      surfCamp: 'Surf Lodge',
      scanner: 'Scan QR',
    },
    common: {
      save: 'Save',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      saved: 'Saved successfully!',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      close: 'Close',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      continue: 'Continue',
      loading: 'Loading...',
      status: 'Status',
      yes: 'Yes',
      no: 'No',
      filter: 'Filter',
      all: 'All',
      total: 'Total',
      date: 'Date',
      time: 'Time',
      night: 'night',
      nights: 'nights',
      guest: 'guest',
      guests: 'guests',
      room: 'room',
      rooms: 'rooms',
      bed: 'bed',
      beds: 'beds',
      currency: 'Currency',
      actions: 'Actions',
      required: 'Required',
      optional: 'Optional',
      copy: 'Copy',
      copied: 'Copied!',
      view: 'View',
      print: 'Print',
      download: 'Download',
      share: 'Share',
      details: 'Details',
      notes: 'Notes',
    },
    steps: {
      dates: 'Dates & Guests',
      rooms: 'Room & Beds',
      addons: 'Surf & Add-ons',
      guest: 'Guest Details',
      confirm: 'Confirmation',
    },
    booking: {
      datesTitle: 'Select Stay Dates & Guests',
      datesSubtitle: 'Choose your check-in and check-out to check live bed availability and surf conditions.',
      checkIn: 'Check-In Date',
      checkOut: 'Check-Out Date',
      stayDuration: 'Stay Duration',
      numberOfGuests: 'Number of Guests',
      searchBreakPlaceholder: 'Search world region or break...',
      checkAvailability: 'View Available Rooms',
      bestRateGuarantee: 'Direct Booking Guarantee: Best surf rates & flexible equipment swaps.',
      minNightsNotice: 'Minimum stay requirement: {count} night(s).',
      operatingBreakNotice: 'Hostel is currently on seasonal break. Pre-bookings for upcoming season remain open!',
      
      roomsTitle: 'Choose Your Room or Dorm Bed',
      roomsSubtitle: 'Select an ocean-view suite, cozy private room, or social shared dormitory.',
      availableBeds: 'beds left',
      privateRoomBadge: 'Entire Private Room',
      dormBedBadge: 'Shared Dormitory Bed',
      perNight: 'per night',
      totalForStay: 'total for {nights} night(s)',
      selectRoom: 'Select Room',
      selectedRoom: 'Selected Room',
      selected: 'Selected',
      filterAll: 'All Accommodations',
      filterPrivate: 'Private Rooms',
      filterDorm: 'Shared Dorms',
      noRoomsFound: 'No rooms match your guest count or filters. Try adjusting dates or guests.',
      continueToAddons: 'Continue to Surf & Add-ons',
      backToDates: 'Back to Dates',

      addonsTitle: 'Surf Packages, Gear & Experiences',
      addonsSubtitle: 'Enhance your stay with daily surf coaching, premium board rentals, rooftop yoga, and healthy meals.',
      addBtn: 'Add',
      removeBtn: 'Remove',
      perDay: 'per day',
      perStay: 'per stay',
      addonsSubtotal: 'Add-ons Subtotal',
      skipAddons: 'Skip Add-ons',
      continueToGuest: 'Continue to Guest Details',
      backToRooms: 'Back to Rooms',

      guestTitle: 'Guest Information & Preferences',
      guestSubtitle: 'Provide your details for immediate reservation confirmation and WhatsApp dispatch.',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      phone: 'WhatsApp / Mobile Number',
      country: 'Country / Nationality',
      surfLevel: 'Surf Skill Level',
      preferredLanguage: 'Preferred Language for Messages',
      estimatedArrival: 'Estimated Arrival Time',
      specialRequests: 'Special Requests / Board preferences',
      emergencyContactName: 'Emergency Contact Name',
      emergencyContactPhone: 'Emergency Contact Phone',
      termsAgreement: 'I agree to the hostel house rules, check-in policy, and stay terms.',
      confirmAndBook: 'Confirm & Complete Booking',
      backToAddons: 'Back to Surf & Add-ons',
      processing: 'Processing Reservation...',

      confirmationTitle: 'Reservation Confirmed!',
      confirmationSubtitle: 'Your surf stay is locked in. We have generated your verified booking voucher.',
      bookingRef: 'Booking Reference',
      sendHostelWhatsApp: 'Send to Hostel WhatsApp',
      saveMyWhatsApp: 'Save to My WhatsApp',
      viewTaxInvoice: 'View Official Tax Invoice & QR',
      copyVoucher: 'Copy Booking Voucher',
      makeAnotherBooking: 'Make Another Booking',
      goToAdmin: 'Go to Admin Dashboard',
      arrivalReminder: 'Arrival check-in opens at {time}. Feel free to drop luggage early if catching morning waves!',
    },
    weather: {
      liveConditions: 'Live Ocean Conditions',
      waveHeight: 'Wave Height',
      swell: 'Swell',
      wind: 'Wind',
      waterTemp: 'Water Temp',
      tide: 'Tide',
      airTemp: 'Air Temp',
      sportRating: 'Surf Rating',
      viewFullForecast: 'View Full Forecast',
      searchPlaceholder: 'Search world region or break...',
      bookForThisSpot: 'Book Stay for this Spot',
      globalBreaks: 'Global Iconic Breaks',
      localBreaks: 'Local Coast Breaks',
    },
    admin: {
      portalTitle: 'WaveHaven Operations & Front Desk',
      portalSubtitle: 'Real-time availability engine, bookings editor, standby room queues, and multi-language automation.',
      formLocationBtn: 'Form Location: {city}, {country}',
      tabs: {
        bookings: 'Bookings',
        calendar: 'Calendar',
        monthlyGrid: '30-Day Grid',
        rooms: 'Rooms & Beds',
        addOns: 'Surf Add-Ons',
        waitlist: 'Waitlist',
        revenueReport: 'Revenue Report',
        analytics: 'Charts & Analytics',
        housekeeping: 'Housekeeping',
        notifications: 'WhatsApp & Templates',
        settings: 'Settings',
        roles: 'Roles & Staff',
      },
      addWalkIn: 'Add Walk-in',
      smartSearch: 'Smart Search',
      themeUI: 'Theme UI',
      liveWeather: 'Waves & Weather',
      autoCancelledAlert: 'Auto-cancelled {count} overdue unpaid reservation(s).',
      waitlistMatchAlert: 'Waitlist match found! {count} guest(s) can be converted to rooms.',
      convertOneClick: 'Convert to Booking',
    },
    settings: {
      title: 'Hostel Settings & Automation',
      languageCardTitle: 'Language & Guest Communications',
      languageCardSubtitle: 'Select the operational language for UI controls, booking steps, and automated guest-facing WhatsApp messages.',
      activeLanguage: 'Active System Language',
      languageDesc: 'Choose English, Spanish, or Arabic. All customer-facing messages and confirmation vouchers will automatically render in this language.',
      english: 'English (UK / US)',
      spanish: 'Español (Spanish)',
      arabic: 'العربية (Arabic)',
      previewWhatsApp: 'Live WhatsApp Message Preview ({lang}):',
      saveLanguageSuccess: 'Language preference saved successfully!',
      tabs: {
        brand: 'Brand & Visuals',
        theme: 'Theme Customizer',
        identity: 'Hostel Identity & Location',
        language: 'Language & Localization',
        policies: 'Stay & Cancellation Policies',
        finance: 'Finance & Deposit Rules',
        surf: 'Surf & Equipment Rules',
        bookingBuilder: 'Booking Form Builder',
        whatsapp: 'WhatsApp & Automation',
        webhook: 'Webhooks & API',
        system: 'System Health',
      },
    },
    surfLevels: {
      beginner: 'Beginner (Whitewater & Pop-up)',
      intermediate: 'Intermediate (Green waves & trimming)',
      advanced: 'Advanced (Reef breaks & tube riding)',
      non_surfer: 'Non-Surfer (Beach & Yoga enthusiast)',
    },
    whatsapp: {
      reservationTitle: 'RESERVATION',
      alohaGreeting: 'Aloha! Here are the reservation details:',
      bookingRef: 'Booking Ref:',
      leadGuest: 'Lead Guest:',
      phone: 'Phone:',
      email: 'Email:',
      country: 'Country:',
      surfLevel: 'Surf Level:',
      accommodation: 'Accommodation:',
      checkIn: 'Check-in:',
      checkOut: 'Check-out:',
      fromTime: 'from',
      byTime: 'by',
      duration: 'Duration:',
      nightSingle: 'night',
      nightPlural: 'nights',
      guests: 'Guests:',
      surfAddOns: 'Surf & Stay Add-ons:',
      totalAmount: 'Total Booking Amount:',
      paymentStatus: 'Payment Status:',
      hostelAddress: 'Hostel Address:',
      generatedFooter: 'Generated by WaveHaven Booking System (Direct WhatsApp Dispatch - No API Required)',
      
      upcomingAlertTitle: 'UPCOMING STAY SURF ALERT - WAVEHAVEN',
      upcomingGreeting: 'Hey {name}! We are excited to welcome you {daysText}!',
      today: '*TODAY*',
      tomorrow: '*TOMORROW*',
      inDays: 'in *{days} days*',
      reservationDetails: 'Reservation Details:',
      localSurfBriefing: 'Local Surf & Conditions Briefing:',
      localSurfText: 'Clean offshore winds are forecast, with ocean swells around 3 to 5 feet! Surf gear racks and wetsuit lockers are ready for your arrival.',
      arrivalFrontDesk: 'Arrival & Front Desk:',
      frontDeskHours: 'Front Desk hours: 08:00 - 22:00',
      wifiReady: 'High-speed Wi-Fi & social lounge access ready on arrival.',
      remainingBalance: 'Remaining Balance: {amount} (due at check-in)',
      paymentSettled: 'Payment: Fully settled ✅',
      flightChangeNote: 'If your flight or arrival time changes, simply reply directly to this WhatsApp!',
      seeYouSoon: 'See you on the waves soon! 🏄‍♀️🤙',
      teamSignoff: 'WaveHaven Surf House Team',

      invoiceTitle: 'OFFICIAL BOOKING INVOICE & VOUCHER',
      invoiceDetails: 'Invoice Details:',
      invoiceNumber: 'Invoice Number:',
      dateOfIssue: 'Date of Issue:',
      staySummary: 'Stay Summary:',
      financialBreakdown: 'Financial Breakdown:',
      roomSubtotal: 'Room Subtotal:',
      addOnsSubtotal: 'Add-ons Subtotal:',
      taxTaxes: 'Local Taxes & VAT:',
      paidInFull: '✅ PAID IN FULL',
      depositConfirmed: '💳 DEPOSIT CONFIRMED',
      pendingSettlement: '⏳ PENDING SETTLEMENT',

      checkInGuideTitle: 'WELCOME TO WAVEHAVEN TODAY!',
      checkInGuideGreeting: 'Aloha {name}! Today is check-in day ({date}).',
      roomReadyText: 'Your room/bed in *{room}* will be squeaky clean and ready for you by {time}.',
      gateCode: 'Main Surf Gate Code: *SHAKA-2026*',
      wifiAccess: 'Guest Wi-Fi: *WaveHaven_Surf_Guest* (Pass: *barrelrider*)',
      sunsetBriefing: 'Join us at 18:30 on the rooftop for sunset drinks and surf briefing! 🍹',

      depositReminderTitle: 'PENDING RESERVATION DEPOSIT REMINDER',
      depositReminderGreeting: 'Hello {name}! We have placed your room/bed on hold for your upcoming surf stay.',
      depositActionText: 'To secure your reservation, please finalize your deposit of {depositAmount} {currency}.',
      paymentMethods: 'Accepted Payment Methods: Credit/Debit Card, Bank Transfer, MBWay, Revolut.',

      cancellationTitle: 'RESERVATION CANCELLATION NOTICE',
      cancellationGreeting: 'Hello {name}, your booking #{ref} has been cancelled.',
      cancellationReason: 'Reason: {reason}',
      cancellationFarewell: 'We hope to welcome you on another swell in the future. Mahalo!',
    },
  },

  es: {
    languageName: 'Español',
    nav: {
      bookStay: 'Reservar Estancia',
      liveWeather: 'Océano y Olas',
      admin: 'Portal Admin',
      adminDashboard: 'Panel de Control',
      staffLogin: 'Acceso Staff',
      logout: 'Cerrar Sesión',
      guestBooking: 'Reservas Huéspedes',
      settings: 'Configuración',
      lookupRef: 'Consultar REF',
      findBooking: 'Buscar Reserva',
      whatsAppChat: 'Soporte WhatsApp',
      surfCamp: 'Surf Lodge',
      scanner: 'Escanear QR',
    },
    common: {
      save: 'Guardar',
      saveChanges: 'Guardar Cambios',
      saving: 'Guardando...',
      saved: '¡Guardado con éxito!',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      search: 'Buscar',
      close: 'Cerrar',
      confirm: 'Confirmar',
      back: 'Volver',
      next: 'Siguiente',
      continue: 'Continuar',
      loading: 'Cargando...',
      status: 'Estado',
      yes: 'Sí',
      no: 'No',
      filter: 'Filtrar',
      all: 'Todos',
      total: 'Total',
      date: 'Fecha',
      time: 'Hora',
      night: 'noche',
      nights: 'noches',
      guest: 'huésped',
      guests: 'huéspedes',
      room: 'habitación',
      rooms: 'habitaciones',
      bed: 'cama',
      beds: 'camas',
      currency: 'Moneda',
      actions: 'Acciones',
      required: 'Obligatorio',
      optional: 'Opcional',
      copy: 'Copiar',
      copied: '¡Copiado!',
      view: 'Ver',
      print: 'Imprimir',
      download: 'Descargar',
      share: 'Compartir',
      details: 'Detalles',
      notes: 'Notas',
    },
    steps: {
      dates: 'Fechas y Huéspedes',
      rooms: 'Habitación y Camas',
      addons: 'Surf y Extras',
      guest: 'Datos del Huésped',
      confirm: 'Confirmación',
    },
    booking: {
      datesTitle: 'Elige Fechas de Estancia y Huéspedes',
      datesSubtitle: 'Selecciona tu entrada y salida para consultar disponibilidad de camas en vivo y condiciones de surf.',
      checkIn: 'Fecha de Entrada',
      checkOut: 'Fecha de Salida',
      stayDuration: 'Duración de Estancia',
      numberOfGuests: 'Número de Huéspedes',
      searchBreakPlaceholder: 'Buscar región u ola del mundo...',
      checkAvailability: 'Ver Habitaciones Disponibles',
      bestRateGuarantee: 'Garantía de Reserva Directa: Mejor tarifa de surf y cambio flexible de tablas.',
      minNightsNotice: 'Requisito de estancia mínima: {count} noche(s).',
      operatingBreakNotice: 'El hostel está actualmente en pausa de temporada. ¡Pre-reservas abiertas para la próxima temporada!',
      
      roomsTitle: 'Elige tu Habitación o Cama en Dormitorio',
      roomsSubtitle: 'Elige una suite con vista al mar, acogedora habitación privada o dormitorio compartido social.',
      availableBeds: 'camas libres',
      privateRoomBadge: 'Habitación Privada Completa',
      dormBedBadge: 'Cama en Dormitorio Compartido',
      perNight: 'por noche',
      totalForStay: 'total por {nights} noche(s)',
      selectRoom: 'Seleccionar Habitación',
      selectedRoom: 'Habitación Seleccionada',
      selected: 'Seleccionado',
      filterAll: 'Todo el Alojamiento',
      filterPrivate: 'Habitaciones Privadas',
      filterDorm: 'Dormitorios Compartidos',
      noRoomsFound: 'Ninguna habitación coincide con tus fechas o huéspedes. Prueba ajustando las fechas.',
      continueToAddons: 'Continuar a Surf y Extras',
      backToDates: 'Volver a Fechas',

      addonsTitle: 'Paquetes de Surf, Tablas y Experiencias',
      addonsSubtitle: 'Mejora tu estancia con clases diarias de surf, alquiler de tablas de calidad, yoga en la azotea y desayunos.',
      addBtn: 'Añadir',
      removeBtn: 'Quitar',
      perDay: 'por día',
      perStay: 'por estancia',
      addonsSubtotal: 'Subtotal de Extras',
      skipAddons: 'Avanzar sin Extras',
      continueToGuest: 'Continuar a Datos del Huésped',
      backToRooms: 'Volver a Habitaciones',

      guestTitle: 'Datos del Huésped y Preferencias',
      guestSubtitle: 'Introduce tus datos de contacto para la confirmación inmediata y envío de bono por WhatsApp.',
      firstName: 'Nombre',
      lastName: 'Apellidos',
      email: 'Correo Electrónico',
      phone: 'Número WhatsApp / Móvil',
      country: 'País / Nacionalidad',
      surfLevel: 'Nivel de Surf',
      preferredLanguage: 'Idioma Preferido para Mensajes',
      estimatedArrival: 'Hora Estimada de Llegada',
      specialRequests: 'Peticiones Especiales / Medidas de tabla',
      emergencyContactName: 'Contacto de Emergencia (Nombre)',
      emergencyContactPhone: 'Contacto de Emergencia (Teléfono)',
      termsAgreement: 'Acepto las normas del hostel, política de check-in y condiciones de estancia.',
      confirmAndBook: 'Confirmar y Finalizar Reserva',
      backToAddons: 'Volver a Surf y Extras',
      processing: 'Procesando Reserva...',

      confirmationTitle: '¡Reserva Confirmada!',
      confirmationSubtitle: 'Tu estancia de surf está asegurada. Hemos generado tu bono oficial verificado.',
      bookingRef: 'Referencia de Reserva',
      sendHostelWhatsApp: 'Enviar al WhatsApp del Hostel',
      saveMyWhatsApp: 'Guardar en Mi WhatsApp',
      viewTaxInvoice: 'Ver Factura Oficial y QR',
      copyVoucher: 'Copiar Bono de Reserva',
      makeAnotherBooking: 'Hacer Otra Reserva',
      goToAdmin: 'Ir al Panel de Administración',
      arrivalReminder: 'El check-in abre a las {time}. ¡Puedes dejar tu equipaje antes si vas a surfear por la mañana!',
    },
    weather: {
      liveConditions: 'Condiciones del Océano en Vivo',
      waveHeight: 'Altura de Olas',
      swell: 'Mar de Fondo',
      wind: 'Viento',
      waterTemp: 'Temp. Agua',
      tide: 'Marea',
      airTemp: 'Temp. Aire',
      sportRating: 'Calificación de Surf',
      viewFullForecast: 'Ver Pronóstico Completo',
      searchPlaceholder: 'Buscar región u ola del mundo...',
      bookForThisSpot: 'Reservar Estancia para este Pico',
      globalBreaks: 'Picos Icónicos Globales',
      localBreaks: 'Picos Locales de la Costa',
    },
    admin: {
      portalTitle: 'Operaciones y Recepción WaveHaven',
      portalSubtitle: 'Motor de disponibilidad en vivo, gestor de reservas, colas de espera y automatización multilingüe.',
      formLocationBtn: 'Ubicación Formulario: {city}, {country}',
      tabs: {
        bookings: 'Reservas',
        calendar: 'Calendario',
        monthlyGrid: 'Cuadrícula 30 Días',
        rooms: 'Habitaciones y Camas',
        addOns: 'Extras de Surf',
        waitlist: 'Lista de Espera',
        revenueReport: 'Informe de Ingresos',
        analytics: 'Gráficos y Estadísticas',
        housekeeping: 'Limpieza',
        notifications: 'WhatsApp y Plantillas',
        settings: 'Configuración',
        roles: 'Roles y Personal',
      },
      addWalkIn: 'Añadir Presencial',
      smartSearch: 'Búsqueda Inteligente',
      themeUI: 'Diseño UI',
      liveWeather: 'Olas y Clima',
      autoCancelledAlert: 'Se auto-cancelaron {count} reserva(s) impagadas vencidas.',
      waitlistMatchAlert: '¡Coincidencia en lista de espera! {count} huésped(es) pueden asignarse a habitaciones.',
      convertOneClick: 'Convertir a Reserva',
    },
    settings: {
      title: 'Configuración del Hostel y Automatización',
      languageCardTitle: 'Idioma y Comunicaciones con Huéspedes',
      languageCardSubtitle: 'Selecciona el idioma operativo para la interfaz, formulario de reserva y mensajes automáticos de WhatsApp.',
      activeLanguage: 'Idioma Activo del Sistema',
      languageDesc: 'Elige entre Inglés, Español o Árabe. Todos los mensajes para clientes y bonos de confirmación se generarán en este idioma.',
      english: 'English (Inglés)',
      spanish: 'Español (Spanish)',
      arabic: 'العربية (Árabe)',
      previewWhatsApp: 'Vista Previa del Mensaje de WhatsApp ({lang}):',
      saveLanguageSuccess: '¡Preferencia de idioma guardada con éxito!',
      tabs: {
        brand: 'Marca y Visuales',
        theme: 'Personalizador de Tema',
        identity: 'Identidad y Ubicación',
        language: 'Idioma y Localización',
        policies: 'Políticas y Cancelaciones',
        finance: 'Finanzas y Depósitos',
        surf: 'Normas de Surf y Equipo',
        bookingBuilder: 'Editor del Formulario',
        whatsapp: 'WhatsApp y Automatización',
        webhook: 'Webhooks y API',
        system: 'Estado del Sistema',
      },
    },
    surfLevels: {
      beginner: 'Principiante (Espumas y Puesta en Pie)',
      intermediate: 'Intermedio (Olas abiertas y giros básicos)',
      advanced: 'Avanzado (Reef breaks y tubos)',
      non_surfer: 'No surfista (Playa y Yoga)',
    },
    whatsapp: {
      reservationTitle: 'RESERVA',
      alohaGreeting: '¡Hola! Aquí tienes los detalles confirmados de tu reserva:',
      bookingRef: 'Ref. de Reserva:',
      leadGuest: 'Huésped Principal:',
      phone: 'Teléfono:',
      email: 'Email:',
      country: 'País:',
      surfLevel: 'Nivel de Surf:',
      accommodation: 'Alojamiento:',
      checkIn: 'Entrada:',
      checkOut: 'Salida:',
      fromTime: 'a partir de las',
      byTime: 'hasta las',
      duration: 'Duración:',
      nightSingle: 'noche',
      nightPlural: 'noches',
      guests: 'Huéspedes:',
      surfAddOns: 'Extras de Surf y Estancia:',
      totalAmount: 'Importe Total de la Reserva:',
      paymentStatus: 'Estado del Pago:',
      hostelAddress: 'Dirección del Hostel:',
      generatedFooter: 'Generado por el sistema de reservas WaveHaven (Envío directo por WhatsApp - Sin API)',

      upcomingAlertTitle: 'ALERTA DE SURF - PRÓXIMA ESTANCIA WAVEHAVEN',
      upcomingGreeting: '¡Hola {name}! ¡Estamos emocionados de recibirte {daysText}!',
      today: '*HOY*',
      tomorrow: '*MAÑANA*',
      inDays: 'en *{days} días*',
      reservationDetails: 'Detalles de la Reserva:',
      localSurfBriefing: 'Informe Local de Olas y Condiciones:',
      localSurfText: '¡Se pronostican vientos terrales limpios y olas de 1 a 1.5 metros! Racks para tablas y taquillas para trajes listos para tu llegada.',
      arrivalFrontDesk: 'Llegada y Recepción:',
      frontDeskHours: 'Horario de recepción: 08:00 - 22:00',
      wifiReady: 'Wi-Fi de alta velocidad y acceso al salón social listos a tu llegada.',
      remainingBalance: 'Saldo Pendiente: {amount} (a pagar en recepción)',
      paymentSettled: 'Pago: Totalmente liquidado ✅',
      flightChangeNote: 'Si tu vuelo u hora de llegada cambia, ¡simplemente responde directamente a este WhatsApp!',
      seeYouSoon: '¡Nos vemos en las olas muy pronto! 🏄‍♀️🤙',
      teamSignoff: 'Equipo de WaveHaven Surf House',

      invoiceTitle: 'FACTURA OFICIAL Y BONO DE RESERVA',
      invoiceDetails: 'Detalles de la Factura:',
      invoiceNumber: 'Número de Factura:',
      dateOfIssue: 'Fecha de Emisión:',
      staySummary: 'Resumen de la Estancia:',
      financialBreakdown: 'Desglose Financiero:',
      roomSubtotal: 'Subtotal Habitación:',
      addOnsSubtotal: 'Subtotal Extras:',
      taxTaxes: 'Impuestos y Tasas:',
      paidInFull: '✅ PAGADO AL COMPLETO',
      depositConfirmed: '💳 DEPÓSITO CONFIRMADO',
      pendingSettlement: '⏳ PENDIENTE DE LIQUIDACIÓN',

      checkInGuideTitle: '¡BIENVENIDO A WAVEHAVEN HOY!',
      checkInGuideGreeting: '¡Aloha {name}! Hoy es tu día de llegada ({date}).',
      roomReadyText: 'Tu habitación/cama en *{room}* estará reluciente y lista para ti a las {time}.',
      gateCode: 'Código del Portón de Surf: *SHAKA-2026*',
      wifiAccess: 'Wi-Fi de Huéspedes: *WaveHaven_Surf_Guest* (Clave: *barrelrider*)',
      sunsetBriefing: '¡Únete a nosotros a las 18:30 en la azotea para bebidas al atardecer y charla de surf! 🍹',

      depositReminderTitle: 'RECORDATORIO DE DEPÓSITO DE RESERVA',
      depositReminderGreeting: '¡Hola {name}! Hemos reservado provisionalmente tu habitación/cama para tu próxima estancia.',
      depositActionText: 'Para asegurar tu reserva, por favor abona el depósito de {depositAmount} {currency}.',
      paymentMethods: 'Métodos Aceptados: Tarjeta de Crédito/Débito, Transferencia, MBWay, Revolut.',

      cancellationTitle: 'AVISO DE CANCELACIÓN DE RESERVA',
      cancellationGreeting: 'Hola {name}, tu reserva #{ref} ha sido cancelada.',
      cancellationReason: 'Motivo: {reason}',
      cancellationFarewell: 'Esperamos recibirte en otro swell en el futuro. ¡Mahalo!',
    },
  },

  ar: {
    languageName: 'العربية',
    nav: {
      bookStay: 'حجز إقامة',
      liveWeather: 'المحيط والأمواج',
      admin: 'بوابة الإدارة',
      adminDashboard: 'لوحة التحكم',
      staffLogin: 'دخول الموظفين',
      logout: 'تسجيل الخروج',
      guestBooking: 'حجز النزلاء',
      settings: 'الإعدادات',
      lookupRef: 'بحث بالمرجع',
      findBooking: 'البحث عن حجز',
      whatsAppChat: 'دعم واتساب',
      surfCamp: 'نزل ركوب الأمواج',
      scanner: 'مسح رمز QR',
    },
    common: {
      save: 'حفظ',
      saveChanges: 'حفظ التغييرات',
      saving: 'جارٍ الحفظ...',
      saved: 'تم الحفظ بنجاح!',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      search: 'بحث',
      close: 'إغلاق',
      confirm: 'تأكيد',
      back: 'رجوع',
      next: 'التالي',
      continue: 'متابعة',
      loading: 'جارٍ التحميل...',
      status: 'الحالة',
      yes: 'نعم',
      no: 'لا',
      filter: 'تصفية',
      all: 'الكل',
      total: 'الإجمالي',
      date: 'التاريخ',
      time: 'الوقت',
      night: 'ليلة',
      nights: 'ليالٍ',
      guest: 'نزيل',
      guests: 'نزلاء',
      room: 'غرفة',
      rooms: 'غرف',
      bed: 'سرير',
      beds: 'أسِرّة',
      currency: 'العملة',
      actions: 'الإجراءات',
      required: 'مطلوب',
      optional: 'اختياري',
      copy: 'نسخ',
      copied: 'تم النسخ!',
      view: 'عرض',
      print: 'طباعة',
      download: 'تنزيل',
      share: 'مشاركة',
      details: 'التفاصيل',
      notes: 'ملاحظات',
    },
    steps: {
      dates: 'التواريخ والنزلاء',
      rooms: 'الغرفة والأسِرّة',
      addons: 'ركوب الأمواج والإضافات',
      guest: 'بيانات النزيل',
      confirm: 'تأكيد الحجز',
    },
    booking: {
      datesTitle: 'اختر تواريخ الإقامة وعدد النزلاء',
      datesSubtitle: 'حدد تاريخي الوصول والمغادرة للتحقق المباشر من توافر الأسِرّة وحالة الأمواج.',
      checkIn: 'تاريخ الوصول',
      checkOut: 'تاريخ المغادرة',
      stayDuration: 'مدة الإقامة',
      numberOfGuests: 'عدد النزلاء',
      searchBreakPlaceholder: 'ابحث عن منطقة أو نقطة أمواج...',
      checkAvailability: 'عرض الغرف المتاحة',
      bestRateGuarantee: 'ضمان الحجز المباشر: أفضل الأسعار ومرونة استبدال المعدات.',
      minNightsNotice: 'الحد الأدنى للإقامة: {count} ليالٍ.',
      operatingBreakNotice: 'النزل في استراحة موسمية حالياً. الحجز المسبق للموسم القادم مفتوح!',
      
      roomsTitle: 'اختر غرفتك أو سريرك المشترك',
      roomsSubtitle: 'اختر جناحاً مطلاً على المحيط، أو غرفة خاصة مريحة، أو عنبراً مشتركاً.',
      availableBeds: 'أسِرّة متبقية',
      privateRoomBadge: 'غرفة خاصة بالكامل',
      dormBedBadge: 'سرير في عنبر مشترك',
      perNight: 'لكل ليلة',
      totalForStay: 'الإجمالي لـ {nights} ليالٍ',
      selectRoom: 'اختيار الغرفة',
      selectedRoom: 'الغرفة المحددة',
      selected: 'تم الاختيار',
      filterAll: 'جميع خيارات الإقامة',
      filterPrivate: 'غرف خاصة',
      filterDorm: 'عنابر مشتركة',
      noRoomsFound: 'لا توجد غرف تطابق عدد النزلاء أو الفلاتر المحددة. جرب تعديل التواريخ أو النزلاء.',
      continueToAddons: 'المتابعة إلى إضافات ركوب الأمواج',
      backToDates: 'العودة إلى التواريخ',

      addonsTitle: 'باقات ركوب الأمواج والمعدات والتجارب',
      addonsSubtitle: 'ارتقِ بإقامتك مع تدريب ركوب الأمواج اليومي، وتأجير الألواح الممتازة، ويوغا السطح، والوجبات الصحية.',
      addBtn: 'إضافة',
      removeBtn: 'إزالة',
      perDay: 'يومياً',
      perStay: 'لكل إقامة',
      addonsSubtotal: 'المجموع الفرعي للإضافات',
      skipAddons: 'تخطي الإضافات',
      continueToGuest: 'المتابعة إلى بيانات النزيل',
      backToRooms: 'العودة إلى الغرف',

      guestTitle: 'معلومات النزيل وتفضيلاته',
      guestSubtitle: 'أدخل بياناتك لتأكيد الحجز الفوري وإرسال تفاصيل الإقامة عبر واتساب.',
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      email: 'البريد الإلكتروني',
      phone: 'رقم الواتساب / الجوال',
      country: 'الدولة / الجنسية',
      surfLevel: 'مستوى ركوب الأمواج',
      preferredLanguage: 'اللغة المفضلة للرسائل',
      estimatedArrival: 'الوقت المتوقع للوصول',
      specialRequests: 'طلبات خاصة / تفضيلات الألواح',
      emergencyContactName: 'اسم جهة الاتصال في حالات الطوارئ',
      emergencyContactPhone: 'هاتف جهة الاتصال في حالات الطوارئ',
      termsAgreement: 'أوافق على قواعد النزل وسياسة تسجيل الوصول وشروط الإقامة.',
      confirmAndBook: 'تأكيد وإتمام الحجز',
      backToAddons: 'العودة إلى الإضافات',
      processing: 'جارٍ معالجة الحجز...',

      confirmationTitle: 'تم تأكيد الحجز بنجاح!',
      confirmationSubtitle: 'تم تأكيد إقامتك معنا. قمنا بإنشاء قسيمة الحجز المعتمدة الخاصة بك.',
      bookingRef: 'مرجع الحجز',
      sendHostelWhatsApp: 'إرسال إلى واتساب النزل',
      saveMyWhatsApp: 'حفظ في واتساب الخاص بي',
      viewTaxInvoice: 'عرض الفاتورة الضريبية ورمز QR',
      copyVoucher: 'نسخ قسيمة الحجز',
      makeAnotherBooking: 'إجراء حجز آخر',
      goToAdmin: 'الانتقال إلى لوحة الإدارة',
      arrivalReminder: 'يبدأ تسجيل الوصول في {time}. يمكنك وضع حقائبك مبكراً إذا كنت متوجهاً للأمواج الصباحية!',
    },
    weather: {
      liveConditions: 'حالة المحيط المباشرة',
      waveHeight: 'ارتفاع الموج',
      swell: 'حركة الموج (Swell)',
      wind: 'الرياح',
      waterTemp: 'حرارة الماء',
      tide: 'المد والجزر',
      airTemp: 'حرارة الجو',
      sportRating: 'تقييم الأمواج',
      viewFullForecast: 'عرض التوقعات الكاملة',
      searchPlaceholder: 'ابحث عن منطقة أو نقطة أمواج...',
      bookForThisSpot: 'احجز إقامة لهذه النقطة',
      globalBreaks: 'أشهر نقاط الأمواج العالمية',
      localBreaks: 'نقاط الأمواج الساحلية المحلية',
    },
    admin: {
      portalTitle: 'عمليات ومكتب استقبال WaveHaven',
      portalSubtitle: 'نظام التوافر الفوري، إدارة الحجوزات، قوائم الانتظار، والأتمتة متعددة اللغات.',
      formLocationBtn: 'موقع النموذج: {city}، {country}',
      tabs: {
        bookings: 'الحجوزات',
        calendar: 'التقويم',
        monthlyGrid: 'شبكة 30 يوماً',
        rooms: 'الغرف والأسِرّة',
        addOns: 'إضافات السيرف',
        waitlist: 'قائمة الانتظار',
        revenueReport: 'تقرير الإيرادات',
        analytics: 'المخططات والتحليلات',
        housekeeping: 'خدمة الغرف والتنظيف',
        notifications: 'الواتساب والقوالب',
        settings: 'الإعدادات',
        roles: 'فريق العمل والأدوار',
      },
      addWalkIn: 'إضافة حجز مباشر',
      smartSearch: 'بحث ذكي',
      themeUI: 'تخصيص الواجهة',
      liveWeather: 'الأمواج والطقس',
      autoCancelledAlert: 'تم إلغاء {count} حجز غير مدفوع تلقائياً.',
      waitlistMatchAlert: 'تم العثور على تطابق في قائمة الانتظار! يمكن تحويل {count} نزيل(اء) إلى غرف.',
      convertOneClick: 'تحويل إلى حجز',
    },
    settings: {
      title: 'إعدادات النزل والأتمتة',
      languageCardTitle: 'اللغة والتواصل مع النزلاء',
      languageCardSubtitle: 'حدد اللغة التشغيلية لواجهة الاستخدام وخطوات الحجز ورسائل الواتساب التلقائية للنزلاء.',
      activeLanguage: 'لغة النظام النشطة',
      languageDesc: 'اختر الإنجليزية، أو الإسبانية، أو العربية. ستظهر جميع رسائل النزلاء وقسائم التأكيد بهذه اللغة تلقائياً.',
      english: 'الإنجليزية (English)',
      spanish: 'الإسبانية (Español)',
      arabic: 'العربية (Arabic)',
      previewWhatsApp: 'معاينة رسالة الواتساب المباشرة ({lang}):',
      saveLanguageSuccess: 'تم حفظ تفضيل اللغة بنجاح!',
      tabs: {
        brand: 'الهوية والمظهر',
        theme: 'مخصص القالب',
        identity: 'بيانات النزل والموقع',
        language: 'اللغة والترجمة',
        policies: 'سياسات الإقامة والإلغاء',
        finance: 'المالية وقواعد العربون',
        surf: 'قواعد ركوب الأمواج والمعدات',
        bookingBuilder: 'منشئ نموذج الحجز',
        whatsapp: 'الواتساب والأتمتة',
        webhook: 'الويبهوك والربط البرمجي',
        system: 'حالة النظام',
      },
    },
    surfLevels: {
      beginner: 'مبتدئ (المياه البيضاء والوقوف على اللوح)',
      intermediate: 'متوسط (الأمواج الخضراء وتوجيه اللوح)',
      advanced: 'متقدم (الشعاب المرجانية وركوب الأنابيب)',
      non_surfer: 'غير ممارس (استجمام وشاطئ ويوغا)',
    },
    whatsapp: {
      reservationTitle: 'تفاصيل الحجز',
      alohaGreeting: 'أهلاً بك! إليك تفاصيل حجز إقامتك:',
      bookingRef: 'مرجع الحجز:',
      leadGuest: 'النزيل الأساسي:',
      phone: 'الهاتف:',
      email: 'البريد الإلكتروني:',
      country: 'الدولة:',
      surfLevel: 'مستوى ركوب الأمواج:',
      accommodation: 'الإقامة:',
      checkIn: 'تسجيل الوصول:',
      checkOut: 'تسجيل المغادرة:',
      fromTime: 'من',
      byTime: 'حتى',
      duration: 'المدة:',
      nightSingle: 'ليلة',
      nightPlural: 'ليالٍ',
      guests: 'النزلاء:',
      surfAddOns: 'إضافات ركوب الأمواج والإقامة:',
      totalAmount: 'إجمالي قيمة الحجز:',
      paymentStatus: 'حالة الدفع:',
      hostelAddress: 'عنوان النزل:',
      generatedFooter: 'تم الإنشاء عبر نظام حجز WaveHaven (إرسال مباشر عبر واتساب دون الحاجة لواجهة برمجة)',

      upcomingAlertTitle: 'تنبيه الأمواج للإقامة القادمة - WAVEHAVEN',
      upcomingGreeting: 'مرحباً {name}! نحن متحمسون جداً لاستقبالك {daysText}!',
      today: '*اليوم*',
      tomorrow: '*غداً*',
      inDays: 'خلال *{days} أيام*',
      reservationDetails: 'تفاصيل الحجز:',
      localSurfBriefing: 'تقرير الأمواج والظروف المحلية:',
      localSurfText: 'توقعات برياح بحرية مثالية وأمواج بارتفاع 3 إلى 5 أقدام! حاملات الألواح وخزائن بدلات الغوص جاهزة لاستقبالك.',
      arrivalFrontDesk: 'الوصول والاستقبال:',
      frontDeskHours: 'ساعات عمل مكتب الاستقبال: 08:00 - 22:00',
      wifiReady: 'واي فاي عالي السرعة وصالة الاستراحة جاهزة فور وصولك.',
      remainingBalance: 'المبلغ المتبقي: {amount} (يُسدد عند تسجيل الوصول)',
      paymentSettled: 'حالة الدفع: تم السداد بالكامل ✅',
      flightChangeNote: 'إذا تغير موعد رحلتك أو توقيت وصولك، يكفي الرد مباشرة على هذه الرسالة في واتساب!',
      seeYouSoon: 'نتطلع لرؤيتك على الأمواج قريباً! 🏄‍♀️🤙',
      teamSignoff: 'فريق نزل WaveHaven Surf House',

      invoiceTitle: 'فاتورة الحجز الرسمية وقسيمة الإقامة',
      invoiceDetails: 'تفاصيل الفاتورة:',
      invoiceNumber: 'رقم الفاتورة:',
      dateOfIssue: 'تاريخ الإصدار:',
      staySummary: 'ملخص الإقامة:',
      financialBreakdown: 'التفصيل المالي:',
      roomSubtotal: 'المجموع الفرعي للغرفة:',
      addOnsSubtotal: 'المجموع الفرعي للإضافات:',
      taxTaxes: 'الضرائب المحلية وضريبة القيمة المضافة:',
      paidInFull: '✅ تم الدفع بالكامل',
      depositConfirmed: '💳 تم تأكيد العربون',
      pendingSettlement: '⏳ بانتظار التسوية',

      checkInGuideTitle: 'مرحباً بك في WAVEHAVEN اليوم!',
      checkInGuideGreeting: 'أهلاً {name}! اليوم هو موعد وصولك ({date}).',
      roomReadyText: 'غرفتك/سريرك في *{room}* ستكون نظيفة وجاهزة لاستقبالك بحلول {time}.',
      gateCode: 'رمز بوابة ركوب الأمواج الرئيسية: *SHAKA-2026*',
      wifiAccess: 'واي فاي النزلاء: *WaveHaven_Surf_Guest* (كلمة المرور: *barrelrider*)',
      sunsetBriefing: 'انضم إلينا في تمام 18:30 على السطح لمشروبات الغروب ولقاء الأمواج! 🍹',

      depositReminderTitle: 'تذكير بعربون الحجز المعلق',
      depositReminderGreeting: 'مرحباً {name}! لقد حجزنا غرفتك/سريرك مبدئياً لإقامتك القادمة.',
      depositActionText: 'لتأكيد حجزك نهائياً، يرجى سداد عربون قدره {depositAmount} {currency}.',
      paymentMethods: 'طرق الدفع المقبولة: بطاقة ائتمان/خصم، تحويل بنكي، MBWay، Revolut.',

      cancellationTitle: 'إشعار إلغاء الحجز',
      cancellationGreeting: 'مرحباً {name}، لقد تم إلغاء حجزك #{ref}.',
      cancellationReason: 'السبب: {reason}',
      cancellationFarewell: 'نأمل أن نلتقي بك في موجة أخرى في المستقبل. مع تحياتنا!',
    },
  },
} as const;

export type Translations = typeof translations.en;

export const CUSTOM_LANGUAGES_KEY = 'wavehaven_custom_languages';
export const CUSTOM_TRANSLATIONS_KEY = 'wavehaven_custom_translations';

// Deep merge helper
function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const output = { ...target };
  if (source && typeof source === 'object') {
    Object.keys(source).forEach((key) => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key as keyof T] = deepMerge(target[key as keyof T], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

export function getAllSupportedLanguages(): LanguageOption[] {
  if (typeof window === 'undefined') return DEFAULT_SUPPORTED_LANGUAGES;
  try {
    const raw = localStorage.getItem(CUSTOM_LANGUAGES_KEY);
    if (!raw) return DEFAULT_SUPPORTED_LANGUAGES;
    const custom: LanguageOption[] = JSON.parse(raw);
    const existingCodes = new Set(DEFAULT_SUPPORTED_LANGUAGES.map(l => l.code));
    const merged = [...DEFAULT_SUPPORTED_LANGUAGES];
    custom.forEach(c => {
      if (!existingCodes.has(c.code)) {
        merged.push({ ...c, isCustom: true });
      }
    });
    return merged;
  } catch {
    return DEFAULT_SUPPORTED_LANGUAGES;
  }
}

export function saveCustomLanguage(lang: LanguageOption): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAllSupportedLanguages();
    const filtered = current.filter(l => l.code !== lang.code && l.isCustom);
    filtered.push({ ...lang, isCustom: true });
    localStorage.setItem(CUSTOM_LANGUAGES_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to save custom language', err);
  }
}

export function deleteCustomLanguage(code: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUSTOM_LANGUAGES_KEY);
    if (!raw) return;
    const custom: LanguageOption[] = JSON.parse(raw);
    const filtered = custom.filter(l => l.code !== code);
    localStorage.setItem(CUSTOM_LANGUAGES_KEY, JSON.stringify(filtered));

    // Also remove translations
    const rawTrans = localStorage.getItem(CUSTOM_TRANSLATIONS_KEY);
    if (rawTrans) {
      const allTrans = JSON.parse(rawTrans);
      delete allTrans[code];
      localStorage.setItem(CUSTOM_TRANSLATIONS_KEY, JSON.stringify(allTrans));
    }
  } catch (err) {
    console.error('Failed to delete custom language', err);
  }
}

export function getTranslations(lang: SupportedLanguage = 'en'): Translations {
  // Base dictionary fallback
  const baseDict = (translations as any)[lang] || translations.en;
  
  if (typeof window === 'undefined') {
    return baseDict as Translations;
  }

  try {
    const raw = localStorage.getItem(CUSTOM_TRANSLATIONS_KEY);
    if (!raw) return baseDict as Translations;
    const allCustom = JSON.parse(raw);
    const customForLang = allCustom[lang];
    if (!customForLang) return baseDict as Translations;
    return deepMerge(baseDict, customForLang) as Translations;
  } catch {
    return baseDict as Translations;
  }
}

export function saveLanguageTranslations(lang: SupportedLanguage, overrides: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUSTOM_TRANSLATIONS_KEY);
    const allCustom = raw ? JSON.parse(raw) : {};
    allCustom[lang] = deepMerge(allCustom[lang] || {}, overrides);
    localStorage.setItem(CUSTOM_TRANSLATIONS_KEY, JSON.stringify(allCustom));
  } catch (err) {
    console.error('Failed to save language translations', err);
  }
}

export function resetLanguageTranslations(lang: SupportedLanguage): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUSTOM_TRANSLATIONS_KEY);
    if (!raw) return;
    const allCustom = JSON.parse(raw);
    delete allCustom[lang];
    localStorage.setItem(CUSTOM_TRANSLATIONS_KEY, JSON.stringify(allCustom));
  } catch (err) {
    console.error('Failed to reset language translations', err);
  }
}

export function importLanguageTranslations(lang: SupportedLanguage, jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null) return false;
    saveLanguageTranslations(lang, parsed);
    return true;
  } catch {
    return false;
  }
}

export function exportLanguageTranslations(lang: SupportedLanguage): string {
  const current = getTranslations(lang);
  return JSON.stringify(current, null, 2);
}

export function formatTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : `{${key}}`;
  });
}

