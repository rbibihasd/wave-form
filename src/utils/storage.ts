import { Booking, HostelSettings, NotificationTemplate, Room, SurfAddOn, WaitlistEntry, RoomCleaningRecord, CleaningStatus, StaffUser, StaffRole, RolePermissionsMap, InvoiceTemplateConfig } from '../types';
import { INITIAL_ADDONS, INITIAL_BOOKINGS, INITIAL_ROOMS, INITIAL_SETTINGS, INITIAL_TEMPLATES, INITIAL_WAITLIST, DEFAULT_INVOICE_TEMPLATE } from '../data/initialData';
import { DEFAULT_ROLE_DEFINITIONS, INITIAL_STAFF_USERS } from './rbac';

const KEYS = {
  ROOMS: 'wavehaven_rooms_v1',
  BOOKINGS: 'wavehaven_bookings_v1',
  ADDONS: 'wavehaven_addons_v1',
  SETTINGS: 'wavehaven_settings_v1',
  TEMPLATES: 'wavehaven_templates_v1',
  WAITLIST: 'wavehaven_waitlist_v1',
  HOUSEKEEPING: 'wavehaven_housekeeping_v1',
  STAFF_USERS: 'wavehaven_staff_users_v1',
  CURRENT_STAFF_USER: 'wavehaven_current_staff_v1',
  ROLE_PERMISSIONS: 'wavehaven_role_permissions_v1',
  ADMIN_AUTH: 'wavehaven_admin_auth_v1',
  INVOICE_TEMPLATE: 'wavehaven_invoice_template_v1',
};


export function getStoredRooms(): Room[] {
  try {
    const raw = localStorage.getItem(KEYS.ROOMS);
    if (!raw) {
      try {
        localStorage.setItem(KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
      } catch {}
      return INITIAL_ROOMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ROOMS;
  }
}

export function saveStoredRooms(rooms: Room[]) {
  localStorage.setItem(KEYS.ROOMS, JSON.stringify(rooms));
  notifyStorageChange();
}

export function getStoredBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(KEYS.BOOKINGS);
    if (!raw) {
      try {
        localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
      } catch {}
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveStoredBookings(bookings: Booking[]) {
  localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
  notifyStorageChange();
}

export function getStoredAddOns(): SurfAddOn[] {
  try {
    const raw = localStorage.getItem(KEYS.ADDONS);
    if (!raw) {
      try {
        localStorage.setItem(KEYS.ADDONS, JSON.stringify(INITIAL_ADDONS));
      } catch {}
      return INITIAL_ADDONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ADDONS;
  }
}

export function saveStoredAddOns(addOns: SurfAddOn[]) {
  localStorage.setItem(KEYS.ADDONS, JSON.stringify(addOns));
  notifyStorageChange();
}

export function getStoredSettings(): HostelSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) {
      try {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      } catch {}
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_SETTINGS,
      ...parsed,
      invoiceTemplateConfig: parsed.invoiceTemplateConfig || getStoredInvoiceTemplate(),
      webhookEvents: {
        ...INITIAL_SETTINGS.webhookEvents,
        ...(parsed.webhookEvents || {}),
      },
    };
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveStoredSettings(settings: HostelSettings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  if (settings.invoiceTemplateConfig) {
    try {
      localStorage.setItem(KEYS.INVOICE_TEMPLATE, JSON.stringify(settings.invoiceTemplateConfig));
    } catch {}
  }
  notifyStorageChange();
}

export function getStoredInvoiceTemplate(): InvoiceTemplateConfig {
  try {
    const raw = localStorage.getItem(KEYS.INVOICE_TEMPLATE);
    if (!raw) {
      try {
        localStorage.setItem(KEYS.INVOICE_TEMPLATE, JSON.stringify(DEFAULT_INVOICE_TEMPLATE));
      } catch {}
      return DEFAULT_INVOICE_TEMPLATE;
    }
    return {
      ...DEFAULT_INVOICE_TEMPLATE,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_INVOICE_TEMPLATE;
  }
}

export function saveStoredInvoiceTemplate(template: InvoiceTemplateConfig) {
  try {
    localStorage.setItem(KEYS.INVOICE_TEMPLATE, JSON.stringify(template));
    // Also sync into settings if settings exists
    const settingsRaw = localStorage.getItem(KEYS.SETTINGS);
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      parsed.invoiceTemplateConfig = template;
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(parsed));
    }
    notifyStorageChange();
  } catch (e) {
    console.error('Error saving invoice template:', e);
  }
}

export function getStoredWaitlist(): WaitlistEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.WAITLIST);
    if (!raw) {
      try {
        localStorage.setItem(KEYS.WAITLIST, JSON.stringify(INITIAL_WAITLIST));
      } catch {}
      return INITIAL_WAITLIST;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_WAITLIST;
  }
}

export function saveStoredWaitlist(waitlist: WaitlistEntry[]) {
  localStorage.setItem(KEYS.WAITLIST, JSON.stringify(waitlist));
  notifyStorageChange();
}

export function getInitialHousekeeping(roomsList: Room[]): Record<string, RoomCleaningRecord> {
  const initial: Record<string, RoomCleaningRecord> = {};
  roomsList.forEach((room, idx) => {
    let status: CleaningStatus = 'ready';
    let cleanedBy = 'Maria S.';
    const lastCleanedAt = new Date(Date.now() - 1000 * 60 * (25 + idx * 40)).toISOString();
    let priority: 'high' | 'normal' | 'low' = 'normal';
    let notes = '';

    if (idx === 0) {
      status = 'needs_cleaning';
      cleanedBy = '';
      priority = 'high';
      notes = 'Turnover required: guest checkout at 11:00, arrival expected at 14:30.';
    } else if (idx === 1) {
      status = 'in_progress';
      cleanedBy = 'Carlos R.';
      priority = 'high';
      notes = 'Stripping linens & floor sanitize. Extra bath towels requested.';
    } else if (idx === 2) {
      status = 'needs_cleaning';
      cleanedBy = '';
      priority = 'normal';
      notes = 'Standard daily refresh & trash disposal.';
    } else {
      status = 'ready';
      cleanedBy = idx % 2 === 0 ? 'Maria S.' : 'Elena T.';
      notes = 'Sanitized & inspected. Fresh towels and linen set.';
    }

    initial[room.id] = {
      roomId: room.id,
      status,
      lastCleanedAt: status === 'ready' ? lastCleanedAt : undefined,
      cleanedBy: status !== 'needs_cleaning' ? cleanedBy : undefined,
      notes,
      priority,
      checklist: {
        linensChanged: status === 'ready',
        towelsReplaced: status === 'ready',
        bathroomSanitized: status === 'ready',
        floorsMopped: status === 'ready',
        trashEmptied: status === 'ready',
        suppliesRestocked: status === 'ready',
      },
    };
  });
  return initial;
}

export function getStoredHousekeeping(roomsList?: Room[]): Record<string, RoomCleaningRecord> {
  try {
    const raw = localStorage.getItem(KEYS.HOUSEKEEPING);
    if (!raw) {
      const activeRooms = roomsList || getStoredRooms();
      const initial = getInitialHousekeeping(activeRooms);
      saveStoredHousekeeping(initial);
      return initial;
    }
    const parsed: Record<string, RoomCleaningRecord> = JSON.parse(raw);
    return parsed;
  } catch {
    const activeRooms = roomsList || getStoredRooms();
    return getInitialHousekeeping(activeRooms);
  }
}

export function saveStoredHousekeeping(records: Record<string, RoomCleaningRecord>) {
  localStorage.setItem(KEYS.HOUSEKEEPING, JSON.stringify(records));
  notifyStorageChange();
}


export interface FullSystemBackup {
  version: string;
  exportedAt: string;
  system: string;
  rooms: Room[];
  bookings: Booking[];
  addOns: SurfAddOn[];
  settings: HostelSettings;
  templates: NotificationTemplate[];
  waitlist?: WaitlistEntry[];
}

export function getFullSystemBackup(): FullSystemBackup {
  return {
    version: '1.2.0',
    exportedAt: new Date().toISOString(),
    system: 'WaveHaven Surf House & Hostel System Engine',
    rooms: getStoredRooms(),
    bookings: getStoredBookings(),
    addOns: getStoredAddOns(),
    settings: getStoredSettings(),
    templates: getStoredTemplates(),
    waitlist: getStoredWaitlist(),
  };
}

export function restoreFullSystemBackup(data: Partial<FullSystemBackup>): { success: boolean; message: string } {
  try {
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid backup format: object expected' };
    }

    if (Array.isArray(data.rooms)) {
      saveStoredRooms(data.rooms);
    }
    if (Array.isArray(data.bookings)) {
      saveStoredBookings(data.bookings);
    }
    if (Array.isArray(data.addOns)) {
      saveStoredAddOns(data.addOns);
    }
    if (data.settings && typeof data.settings === 'object') {
      saveStoredSettings({ ...INITIAL_SETTINGS, ...data.settings });
    }
    if (Array.isArray(data.templates)) {
      saveStoredTemplates(data.templates);
    }
    if (Array.isArray(data.waitlist)) {
      saveStoredWaitlist(data.waitlist);
    }

    notifyStorageChange();
    return { success: true, message: 'Full system data restored successfully!' };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown restore error';
    return { success: false, message: `Failed to restore system: ${errMsg}` };
  }
}

export function getSystemStorageDiagnostics() {
  try {
    let totalBytes = 0;
    for (const key of Object.values(KEYS)) {
      const item = localStorage.getItem(key);
      if (item) totalBytes += item.length * 2; // UTF-16 approx
    }
    const kbUsed = (totalBytes / 1024).toFixed(1);
    const roomsCount = getStoredRooms().length;
    const bookingsCount = getStoredBookings().length;
    const addOnsCount = getStoredAddOns().length;
    const templatesCount = getStoredTemplates().length;
    const waitlistCount = getStoredWaitlist().length;

    return {
      kbUsed,
      roomsCount,
      bookingsCount,
      addOnsCount,
      templatesCount,
      waitlistCount,
      lastSync: new Date().toLocaleTimeString(),
    };
  } catch {
    return {
      kbUsed: '0',
      roomsCount: 0,
      bookingsCount: 0,
      addOnsCount: 0,
      templatesCount: 0,
      waitlistCount: 0,
      lastSync: 'Now',
    };
  }
}

export function getStoredTemplates(): NotificationTemplate[] {
  try {
    const raw = localStorage.getItem(KEYS.TEMPLATES);
    if (!raw) {
      try {
        localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
      } catch {}
      return INITIAL_TEMPLATES;
    }
    const parsed: NotificationTemplate[] = JSON.parse(raw);
    const existingIds = new Set(parsed.map((t) => t.id));
    const missing = INITIAL_TEMPLATES.filter((t) => !existingIds.has(t.id));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      try {
        localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(merged));
      } catch {}
      return merged;
    }
    return parsed;
  } catch {
    return INITIAL_TEMPLATES;
  }
}

export function saveStoredTemplates(templates: NotificationTemplate[]) {
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
  notifyStorageChange();
}

export function getStoredStaffUsers(): StaffUser[] {
  try {
    const raw = localStorage.getItem(KEYS.STAFF_USERS);
    if (!raw) {
      try {
        localStorage.setItem(KEYS.STAFF_USERS, JSON.stringify(INITIAL_STAFF_USERS));
      } catch {}
      return INITIAL_STAFF_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STAFF_USERS;
  }
}

export function saveStoredStaffUsers(users: StaffUser[]) {
  localStorage.setItem(KEYS.STAFF_USERS, JSON.stringify(users));
  notifyStorageChange();
}

export function getStoredCurrentStaffUser(): StaffUser {
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_STAFF_USER);
    const allUsers = getStoredStaffUsers();
    if (!raw) {
      const defaultUser = allUsers[0] || INITIAL_STAFF_USERS[0];
      try {
        localStorage.setItem(KEYS.CURRENT_STAFF_USER, JSON.stringify(defaultUser.id));
      } catch {}
      return defaultUser;
    }
    const parsedId = JSON.parse(raw);
    const found = allUsers.find((u) => u.id === (parsedId.id || parsedId));
    return found || allUsers[0] || INITIAL_STAFF_USERS[0];
  } catch {
    return INITIAL_STAFF_USERS[0];
  }
}

export function saveStoredCurrentStaffUser(user: StaffUser) {
  localStorage.setItem(KEYS.CURRENT_STAFF_USER, JSON.stringify(user.id));
  notifyStorageChange();
}

export function getStoredRolePermissions(): Record<StaffRole, RolePermissionsMap> {
  try {
    const raw = localStorage.getItem(KEYS.ROLE_PERMISSIONS);
    const defaults: Record<StaffRole, RolePermissionsMap> = {
      manager: DEFAULT_ROLE_DEFINITIONS.manager.permissions,
      admin: DEFAULT_ROLE_DEFINITIONS.admin.permissions,
      super_admin: DEFAULT_ROLE_DEFINITIONS.super_admin.permissions,
    };
    if (!raw) {
      try {
        localStorage.setItem(KEYS.ROLE_PERMISSIONS, JSON.stringify(defaults));
      } catch {}
      return defaults;
    }
    const parsed = JSON.parse(raw);
    return {
      manager: { ...defaults.manager, ...(parsed.manager || {}) },
      admin: { ...defaults.admin, ...(parsed.admin || {}) },
      super_admin: { ...defaults.super_admin, ...(parsed.super_admin || {}) },
    };
  } catch {
    return {
      manager: DEFAULT_ROLE_DEFINITIONS.manager.permissions,
      admin: DEFAULT_ROLE_DEFINITIONS.admin.permissions,
      super_admin: DEFAULT_ROLE_DEFINITIONS.super_admin.permissions,
    };
  }
}

export function saveStoredRolePermissions(matrix: Record<StaffRole, RolePermissionsMap>) {
  localStorage.setItem(KEYS.ROLE_PERMISSIONS, JSON.stringify(matrix));
  notifyStorageChange();
}

export function getStoredAdminAuth(): boolean {
  try {
    return localStorage.getItem(KEYS.ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function saveStoredAdminAuth(isAuthenticated: boolean) {
  try {
    if (isAuthenticated) {
      localStorage.setItem(KEYS.ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(KEYS.ADMIN_AUTH);
    }
  } catch {
    // safe fallback
  }
  notifyStorageChange();
}

export function resetAllDataToDefault() {
  localStorage.setItem(KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
  localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
  localStorage.setItem(KEYS.ADDONS, JSON.stringify(INITIAL_ADDONS));
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
  localStorage.setItem(KEYS.WAITLIST, JSON.stringify(INITIAL_WAITLIST));
  localStorage.setItem(KEYS.HOUSEKEEPING, JSON.stringify(getInitialHousekeeping(INITIAL_ROOMS)));
  localStorage.setItem(KEYS.STAFF_USERS, JSON.stringify(INITIAL_STAFF_USERS));
  localStorage.setItem(KEYS.CURRENT_STAFF_USER, JSON.stringify(INITIAL_STAFF_USERS[0].id));
  localStorage.setItem(KEYS.ROLE_PERMISSIONS, JSON.stringify({
    manager: DEFAULT_ROLE_DEFINITIONS.manager.permissions,
    admin: DEFAULT_ROLE_DEFINITIONS.admin.permissions,
    super_admin: DEFAULT_ROLE_DEFINITIONS.super_admin.permissions,
  }));
  notifyStorageChange();
}

/**
 * Prepares the hostel database for real live production by removing all sample / demo
 * bookings and waitlist entries while preserving all room definitions, add-ons,
 * custom settings, pricing, and invoice configurations.
 */
export function purgeDemoBookingsForLiveLaunch() {
  localStorage.setItem(KEYS.BOOKINGS, JSON.stringify([]));
  localStorage.setItem(KEYS.WAITLIST, JSON.stringify([]));
  // Update environmentMode to live
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.environmentMode = 'live';
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(parsed));
    }
  } catch {}
  notifyStorageChange();
}

/**
 * Re-seeds rich sample demo bookings, guest profiles, and waitlist requests
 * for staff training, investor demonstrations, and testing.
 */
export function seedDemoBookingsForTesting() {
  localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
  localStorage.setItem(KEYS.WAITLIST, JSON.stringify(INITIAL_WAITLIST));
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.environmentMode = 'demo';
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(parsed));
    }
  } catch {}
  notifyStorageChange();
}

export function isLiveEnvironment(): boolean {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.environmentMode === 'live';
    }
  } catch {}
  return false;
}

export function notifyStorageChange() {
  setTimeout(() => {
    window.dispatchEvent(new Event('wavehaven_storage_updated'));
  }, 0);
}
