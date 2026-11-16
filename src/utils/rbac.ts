import { PermissionLevel, RoleDefinition, RolePermissionsMap, StaffRole, StaffUser, SystemResource } from '../types';

export const SYSTEM_RESOURCES: {
  id: SystemResource;
  name: string;
  category: 'Operations' | 'Intelligence' | 'Setup & Security';
  description: string;
  manageScope: string;
  fullControlScope: string;
}[] = [
  {
    id: 'bookings',
    name: 'Bookings & Reservations',
    category: 'Operations',
    description: 'Guest bookings, walk-ins, payment statuses, check-in & check-out.',
    manageScope: 'Create walk-ins, edit stay details, check-in/out guests, update payments.',
    fullControlScope: 'Permanent booking deletion, financial overrides, batch cancellations.',
  },
  {
    id: 'calendar_grid',
    name: 'Calendar & Monthly Grid',
    category: 'Operations',
    description: '30-day occupancy grid, monthly bed schedule, slot allocations.',
    manageScope: 'Assign beds, adjust guest room moves, inspect daily occupancies.',
    fullControlScope: 'Lock grid dates, override capacity limits, force schedule reassignment.',
  },
  {
    id: 'housekeeping',
    name: 'Housekeeping & Sanitization',
    category: 'Operations',
    description: 'Daily room turnover schedules, bed sanitization checklists, maintenance notes.',
    manageScope: 'Update cleaning status, complete sanitization checklists, report maintenance.',
    fullControlScope: 'Assign staff cleaners, configure checklist items, clear history.',
  },
  {
    id: 'waitlist',
    name: 'Waitlist & Vacancy Matching',
    category: 'Operations',
    description: 'Standby guest queue, automated vacancy detection & 1-click conversion.',
    manageScope: 'Add waitlisted guests, send WhatsApp alerts, 1-click convert open beds.',
    fullControlScope: 'Override queue rankings, purge waitlist entries, customize matching rules.',
  },
  {
    id: 'rooms',
    name: 'Rooms & Bed Inventories',
    category: 'Setup & Security',
    description: 'Dorm pricing, private suites, bed capacities & scheduled maintenance blocks.',
    manageScope: 'Toggle active status, schedule maintenance blocks, update descriptions.',
    fullControlScope: 'Add new rooms, delete rooms permanently, modify physical capacities.',
  },
  {
    id: 'addons',
    name: 'Surf Add-ons & Equipment',
    category: 'Setup & Security',
    description: 'Surf lessons, board rentals, wetsuits, yoga sessions & meal packages.',
    manageScope: 'Add surf add-ons to bookings, toggle availability, edit descriptions.',
    fullControlScope: 'Create new add-on packages, set base pricing, delete packages.',
  },
  {
    id: 'revenue_reports',
    name: 'Revenue & Yield Analytics',
    category: 'Intelligence',
    description: '30-day forward projected revenue, ADR, occupancy trends & yield forecasting.',
    manageScope: 'View revenue graphs, forward booking trends, and ADR metrics.',
    fullControlScope: 'Export financial ledgers, configure yield targets, run cash-flow models.',
  },
  {
    id: 'notifications',
    name: 'Guest Stay Notifications',
    category: 'Intelligence',
    description: 'WhatsApp arrival reminders, check-in guides & email receipt templates.',
    manageScope: 'Dispatch manual notifications, preview templates, send test messages.',
    fullControlScope: 'Edit notification templates, alter automated trigger timings, modify channels.',
  },
  {
    id: 'form_builder',
    name: 'Booking Flow & Form Builder',
    category: 'Setup & Security',
    description: 'Multi-step guest booking wizard steps, custom inputs, Elementor Pro widgets.',
    manageScope: 'Preview booking steps and toggle non-critical guest inputs.',
    fullControlScope: 'Add/remove steps, inject Elementor widgets, customize required waiver.',
  },
  {
    id: 'settings',
    name: 'Hostel Settings & Policies',
    category: 'Setup & Security',
    description: 'Hostel brand, currency, tax rates, house rules, quiet hours & theme styling.',
    manageScope: 'Update quiet hours, contact details, surf session times, and house rules.',
    fullControlScope: 'Modify fiscal tax rates, currency symbol, brand visual theme, reset data.',
  },
  {
    id: 'webhooks',
    name: 'Webhooks & Integrations',
    category: 'Setup & Security',
    description: 'Outgoing webhook dispatches for external PMS, Zapier, and accounting.',
    manageScope: 'View webhook dispatch logs and trigger manual test pings.',
    fullControlScope: 'Modify webhook URLs, generate/rotate webhook secret keys, toggle events.',
  },
  {
    id: 'roles_staff',
    name: 'Staff & Roles Management',
    category: 'Setup & Security',
    description: 'Role permissions (Manager, Admin, Super Admin) and staff user accounts.',
    manageScope: 'View staff directory, assign operational tasks, check duty statuses.',
    fullControlScope: 'Add/delete staff accounts, edit role permissions matrix between manage & full control.',
  },
];

export const DEFAULT_ROLE_DEFINITIONS: Record<StaffRole, RoleDefinition> = {
  manager: {
    id: 'manager',
    name: 'Hostel Operations Manager',
    badgeLabel: 'Manager',
    description: 'Front-desk & operational manager with Manage access across daily check-ins, bookings, calendar, waitlist, and housekeeping.',
    defaultLevel: 'manage',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    permissions: {
      bookings: 'manage',
      calendar_grid: 'manage',
      housekeeping: 'manage',
      waitlist: 'manage',
      rooms: 'manage',
      addons: 'manage',
      revenue_reports: 'view',
      notifications: 'manage',
      form_builder: 'view',
      settings: 'view',
      webhooks: 'view',
      roles_staff: 'view',
    },
  },
  admin: {
    id: 'admin',
    name: 'Hostel Administrator',
    badgeLabel: 'Admin',
    description: 'Elevated administrator with Full Control over bookings, rooms, add-ons, notifications, and form builder, plus Manage access for settings, webhooks, and staff.',
    defaultLevel: 'full_control',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    permissions: {
      bookings: 'full_control',
      calendar_grid: 'full_control',
      housekeeping: 'full_control',
      waitlist: 'full_control',
      rooms: 'full_control',
      addons: 'full_control',
      revenue_reports: 'full_control',
      notifications: 'full_control',
      form_builder: 'full_control',
      settings: 'manage',
      webhooks: 'manage',
      roles_staff: 'manage',
    },
  },
  super_admin: {
    id: 'super_admin',
    name: 'Super Administrator / Owner',
    badgeLabel: 'Super Admin',
    description: 'Master administrator with unrestricted Full Control across all modules, fiscal controls, and role/permission matrix customization.',
    defaultLevel: 'full_control',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    permissions: {
      bookings: 'full_control',
      calendar_grid: 'full_control',
      housekeeping: 'full_control',
      waitlist: 'full_control',
      rooms: 'full_control',
      addons: 'full_control',
      revenue_reports: 'full_control',
      notifications: 'full_control',
      form_builder: 'full_control',
      settings: 'full_control',
      webhooks: 'full_control',
      roles_staff: 'full_control',
    },
  },
};

export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-alex-superadmin',
    name: 'Alex Morgan',
    email: 'alex@wavehavensurf.com',
    role: 'super_admin',
    department: 'Hostel Ownership & Executive',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    phone: '+351 912 345 678',
    status: 'active',
    lastActive: 'Active Now',
  },
  {
    id: 'staff-marcus-admin',
    name: 'Marcus Vance',
    email: 'marcus@wavehavensurf.com',
    role: 'admin',
    department: 'Camp Operations & Surf School',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    phone: '+351 913 882 190',
    status: 'active',
    lastActive: '12 mins ago',
  },
  {
    id: 'staff-sofia-manager',
    name: 'Sofia Silva',
    email: 'sofia@wavehavensurf.com',
    role: 'manager',
    department: 'Front Desk & Guest Experience',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    phone: '+351 918 204 771',
    status: 'active',
    lastActive: '3 mins ago',
  },
];

const PERMISSION_WEIGHTS: Record<PermissionLevel, number> = {
  view: 1,
  manage: 2,
  full_control: 3,
};

export function getEffectivePermission(
  user: StaffUser,
  resource: SystemResource,
  roleMatrix: Record<StaffRole, RolePermissionsMap> = {
    manager: DEFAULT_ROLE_DEFINITIONS.manager.permissions,
    admin: DEFAULT_ROLE_DEFINITIONS.admin.permissions,
    super_admin: DEFAULT_ROLE_DEFINITIONS.super_admin.permissions,
  }
): PermissionLevel {
  // If user has specific per-resource override
  if (user.customPermissionsOverride && user.customPermissionsOverride[resource]) {
    return user.customPermissionsOverride[resource]!;
  }

  const rolePerms = roleMatrix[user.role] || DEFAULT_ROLE_DEFINITIONS[user.role]?.permissions;
  return rolePerms?.[resource] || 'view';
}

export function hasPermission(
  user: StaffUser,
  resource: SystemResource,
  requiredLevel: PermissionLevel,
  roleMatrix?: Record<StaffRole, RolePermissionsMap>
): boolean {
  const current = getEffectivePermission(user, resource, roleMatrix);
  return PERMISSION_WEIGHTS[current] >= PERMISSION_WEIGHTS[requiredLevel];
}

export function canManage(
  user: StaffUser,
  resource: SystemResource,
  roleMatrix?: Record<StaffRole, RolePermissionsMap>
): boolean {
  return hasPermission(user, resource, 'manage', roleMatrix);
}

export function hasFullControl(
  user: StaffUser,
  resource: SystemResource,
  roleMatrix?: Record<StaffRole, RolePermissionsMap>
): boolean {
  return hasPermission(user, resource, 'full_control', roleMatrix);
}

export function getRoleBadgeStyle(role: StaffRole): {
  badgeClass: string;
  label: string;
  dotColor: string;
} {
  switch (role) {
    case 'super_admin':
      return {
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-black',
        label: 'Super Admin',
        dotColor: 'bg-purple-600',
      };
    case 'admin':
      return {
        badgeClass: 'bg-teal-100 text-teal-900 border-teal-300 font-extrabold',
        label: 'Admin',
        dotColor: 'bg-teal-600',
      };
    case 'manager':
      return {
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        label: 'Manager',
        dotColor: 'bg-amber-600',
      };
    default:
      return {
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
        label: role,
        dotColor: 'bg-slate-500',
      };
  }
}

export function getPermissionBadgeStyle(level: PermissionLevel): {
  badgeClass: string;
  label: string;
  description: string;
  pillColor: string;
} {
  switch (level) {
    case 'full_control':
      return {
        badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-black',
        label: 'Full Control',
        description: 'Complete read, write, delete, override, and administrative control.',
        pillColor: 'bg-emerald-600 text-white',
      };
    case 'manage':
      return {
        badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300 font-extrabold',
        label: 'Manage',
        description: 'Operational control: create, edit, check-in, update, and manage daily tasks.',
        pillColor: 'bg-amber-600 text-white',
      };
    case 'view':
      return {
        badgeClass: 'bg-sky-100 text-sky-950 border border-sky-300 font-medium',
        label: 'View Only',
        description: 'Read-only visibility without edit, update, or delete privileges.',
        pillColor: 'bg-sky-600 text-white',
      };
  }
}
