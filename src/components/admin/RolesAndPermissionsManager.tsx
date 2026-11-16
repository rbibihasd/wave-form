import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Users, Plus, CheckCircle2, Lock, 
  Key, UserCheck, Trash2, Edit3, Sparkles, AlertTriangle, 
  Info, RefreshCw, Eye, Check, Search, Filter, Shield, Zap, ChevronRight
} from 'lucide-react';
import { PermissionLevel, RolePermissionsMap, StaffRole, StaffUser, SystemResource } from '../../types';
import { 
  DEFAULT_ROLE_DEFINITIONS, 
  SYSTEM_RESOURCES, 
  getPermissionBadgeStyle, 
  getRoleBadgeStyle, 
  hasFullControl 
} from '../../utils/rbac';

interface RolesAndPermissionsManagerProps {
  staffUsers: StaffUser[];
  currentStaff: StaffUser;
  rolePermissions: Record<StaffRole, RolePermissionsMap>;
  onSwitchStaffUser: (user: StaffUser) => void;
  onUpdateRolePermissions: (matrix: Record<StaffRole, RolePermissionsMap>) => void;
  onAddStaffUser: (newUser: StaffUser) => void;
  onUpdateStaffUser: (updatedUser: StaffUser) => void;
  onDeleteStaffUser: (userId: string) => void;
}

export const RolesAndPermissionsManager: React.FC<RolesAndPermissionsManagerProps> = ({
  staffUsers,
  currentStaff,
  rolePermissions,
  onSwitchStaffUser,
  onUpdateRolePermissions,
  onAddStaffUser,
  onUpdateStaffUser,
  onDeleteStaffUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'directory' | 'guide'>('matrix');
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState<'all' | 'Operations' | 'Intelligence' | 'Setup & Security'>('all');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState<string>('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New staff form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<StaffRole>('manager');
  const [newUserDept, setNewUserDept] = useState('Front Desk & Operations');
  const [newUserPhone, setNewUserPhone] = useState('+351 912 000 000');
  const [newUserAvatar, setNewUserAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isSuperAdmin = currentStaff.role === 'super_admin';
  const canEditPermissions = isSuperAdmin || hasFullControl(currentStaff, 'roles_staff', rolePermissions);

  const handlePermissionChange = (role: StaffRole, resourceId: SystemResource, newLevel: PermissionLevel) => {
    if (!canEditPermissions) {
      showToast('⚠️ Only Super Admins with Full Control can modify the master role permission matrix.');
      return;
    }

    const updated = {
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        [resourceId]: newLevel,
      },
    };
    onUpdateRolePermissions(updated);
    showToast(`Updated ${role.toUpperCase()} permission for ${resourceId} to ${newLevel.replace('_', ' ').toUpperCase()}`);
  };

  const handleResetMatrix = () => {
    if (!canEditPermissions) {
      showToast('⚠️ Only Super Admins can reset the permission matrix.');
      return;
    }
    const defaults: Record<StaffRole, RolePermissionsMap> = {
      manager: { ...DEFAULT_ROLE_DEFINITIONS.manager.permissions },
      admin: { ...DEFAULT_ROLE_DEFINITIONS.admin.permissions },
      super_admin: { ...DEFAULT_ROLE_DEFINITIONS.super_admin.permissions },
    };
    onUpdateRolePermissions(defaults);
    showToast('Permission matrix reset to factory defaults.');
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      department: newUserDept.trim(),
      avatar: newUserAvatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      phone: newUserPhone.trim(),
      status: 'active',
      lastActive: 'Just added',
    };

    onAddStaffUser(newStaff);
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    showToast(`Added staff member ${newStaff.name} as ${newStaff.role.replace('_', ' ').toUpperCase()}`);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    onUpdateStaffUser(editingUser);
    setEditingUser(null);
    showToast(`Updated staff details for ${editingUser.name}`);
  };

  const handleDeleteStaff = (user: StaffUser) => {
    if (user.id === currentStaff.id) {
      showToast('⚠️ You cannot delete your currently active staff profile.');
      return;
    }
    const superAdminCount = staffUsers.filter((u) => u.role === 'super_admin').length;
    if (user.role === 'super_admin' && superAdminCount <= 1) {
      showToast('⚠️ Cannot delete the last remaining Super Admin.');
      return;
    }
    onDeleteStaffUser(user.id);
    showToast(`Removed staff member ${user.name}.`);
  };

  // Filtered resources
  const filteredResources = SYSTEM_RESOURCES.filter((res) => {
    if (resourceCategoryFilter === 'all') return true;
    return res.category === resourceCategoryFilter;
  });

  // Filtered staff
  const filteredStaff = staffUsers.filter((u) => {
    if (directoryRoleFilter !== 'all' && u.role !== directoryRoleFilter) return false;
    if (directorySearch) {
      const q = directorySearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
    }
    return true;
  });

  // Roles count
  const countSuperAdmin = staffUsers.filter((u) => u.role === 'super_admin').length;
  const countAdmin = staffUsers.filter((u) => u.role === 'admin').length;
  const countManager = staffUsers.filter((u) => u.role === 'manager').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-xl border border-slate-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)} 
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Active Persona Bar */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            <img 
              src={currentStaff.avatar} 
              alt={currentStaff.name} 
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-md"
            />
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
              currentStaff.role === 'super_admin' ? 'bg-purple-500' : currentStaff.role === 'admin' ? 'bg-teal-500' : 'bg-amber-500'
            }`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Current Active Persona</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                currentStaff.role === 'super_admin'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : currentStaff.role === 'admin'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {currentStaff.role === 'super_admin' ? '👑 Super Admin (Full Control)' : currentStaff.role === 'admin' ? '🛡️ Admin (High Control)' : '⚡ Manager (Manage Control)'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
              {currentStaff.name}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {currentStaff.department} • <span className="text-slate-400">{currentStaff.email}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
          {/* Quick Persona Switcher Chips */}
          <div className="bg-black/30 backdrop-blur-xs p-1.5 rounded-2xl border border-white/10 flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 px-2 hidden lg:inline">Switch Role:</span>
            {staffUsers.slice(0, 3).map((u) => {
              const isSelected = u.id === currentStaff.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  id={`btn-persona-${u.role}`}
                  onClick={() => {
                    onSwitchStaffUser(u);
                    showToast(`Switched active view to ${u.name} (${u.role.replace('_', ' ').toUpperCase()})`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-md font-black'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                  title={`Test app as ${u.name} (${u.role})`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    u.role === 'super_admin' ? 'bg-purple-500' : u.role === 'admin' ? 'bg-teal-500' : 'bg-amber-500'
                  }`} />
                  <span>{u.name.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-70">({u.role === 'super_admin' ? 'Super' : u.role === 'admin' ? 'Admin' : 'Mgr'})</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            id="btn-add-staff-top"
            onClick={() => setIsAddUserModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-black text-xs shadow-md shadow-teal-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Role Comparison Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Manager Card */}
        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-2xs hover:border-amber-400 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
              ⚡ Manager
            </span>
            <span className="text-xs font-bold text-slate-400">{countManager} Assigned</span>
          </div>
          <h3 className="font-heading font-black text-base text-slate-900">Hostel Operations Manager</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Daily front-desk operations, guest check-in/out, 30-day room allocations, housekeeping status, waitlist vacancy matching & WhatsApp dispatch.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">Default Permission:</span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-extrabold border border-amber-200">
              Manage Access
            </span>
          </div>
        </div>

        {/* Admin Card */}
        <div className="bg-white p-5 rounded-3xl border border-teal-200/80 shadow-2xs hover:border-teal-400 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-teal-100 text-teal-900 border border-teal-300">
              🛡️ Admin
            </span>
            <span className="text-xs font-bold text-slate-400">{countAdmin} Assigned</span>
          </div>
          <h3 className="font-heading font-black text-base text-slate-900">Hostel Administrator</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Elevated control over room inventory & pricing, surf add-on catalogue, booking form builder, stay notification templates, revenue forecasts & team coordination.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">Default Permission:</span>
            <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-extrabold border border-teal-200">
              Full Control (Ops)
            </span>
          </div>
        </div>

        {/* Super Admin Card */}
        <div className="bg-white p-5 rounded-3xl border border-purple-200/80 shadow-2xs hover:border-purple-400 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-purple-100 text-purple-900 border border-purple-300">
              👑 Super Admin
            </span>
            <span className="text-xs font-bold text-slate-400">{countSuperAdmin} Assigned</span>
          </div>
          <h3 className="font-heading font-black text-base text-slate-900">Super Administrator / Owner</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Unrestricted master privileges across all modules, fiscal tax rates, webhook secrets, currency configuration, destructive operations & permission matrix customization.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">Default Permission:</span>
            <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 font-black border border-purple-200">
              Full Control (100%)
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="tab-permissions-matrix"
            onClick={() => setActiveSubTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'matrix'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Permissions Matrix (Manage vs Full Control)</span>
          </button>

          <button
            type="button"
            id="tab-staff-directory"
            onClick={() => setActiveSubTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'directory'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Directory ({staffUsers.length})</span>
          </button>

          <button
            type="button"
            id="tab-permission-guide"
            onClick={() => setActiveSubTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'guide'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Access Tier Scope Guide</span>
          </button>
        </div>

        {activeSubTab === 'matrix' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetMatrix}
              disabled={!canEditPermissions}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Reset matrix to default settings"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: PERMISSIONS MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Permission Filter Bar & Info Notice */}
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Resource:</span>
              </span>
              {(['all', 'Operations', 'Intelligence', 'Setup & Security'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setResourceCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    resourceCategoryFilter === cat
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Modules (12)' : cat}
                </button>
              ))}
            </div>

            {!canEditPermissions && (
              <div className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-xl border border-amber-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Signed in as {currentStaff.role}. Modifying matrix requires Super Admin.</span>
              </div>
            )}
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3.5 px-5 font-heading font-extrabold text-slate-700 w-2/5">
                      Module & System Resource
                    </th>
                    <th className="py-3.5 px-4 font-heading font-extrabold text-amber-900 bg-amber-50/50 w-1/5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Manager</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-4 font-heading font-extrabold text-teal-900 bg-teal-50/50 w-1/5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <span>Admin</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-4 font-heading font-extrabold text-purple-900 bg-purple-50/50 w-1/5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Super Admin</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResources.map((res) => {
                    const managerLevel = rolePermissions.manager?.[res.id] || 'manage';
                    const adminLevel = rolePermissions.admin?.[res.id] || 'full_control';
                    const superAdminLevel = rolePermissions.super_admin?.[res.id] || 'full_control';

                    return (
                      <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Resource Info */}
                        <td className="py-4 px-5 align-top">
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                              <ShieldCheck className="w-4 h-4 text-teal-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-black text-slate-900 text-sm">
                                  {res.name}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                  {res.category}
                                </span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">
                                {res.description}
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-2 text-[10px]">
                                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  <strong>Manage:</strong> {res.manageScope}
                                </span>
                                <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <strong>Full Control:</strong> {res.fullControlScope}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Manager Column Selector */}
                        <td className="py-4 px-4 align-middle bg-amber-50/20 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <select
                              aria-label={`Permission for Manager on ${res.name}`}
                              value={managerLevel}
                              disabled={!canEditPermissions}
                              onChange={(e) => handlePermissionChange('manager', res.id, e.target.value as PermissionLevel)}
                              className={`py-1.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer focus:outline-hidden ${
                                managerLevel === 'full_control'
                                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                  : managerLevel === 'manage'
                                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                                  : 'bg-sky-100 text-sky-950 border-sky-300'
                              } disabled:opacity-80 disabled:cursor-not-allowed`}
                            >
                              <option value="view">👁️ View Only</option>
                              <option value="manage">⚡ Manage</option>
                              <option value="full_control">👑 Full Control</option>
                            </select>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {managerLevel === 'full_control' ? 'Unrestricted' : managerLevel === 'manage' ? 'Operations' : 'Read-only'}
                            </span>
                          </div>
                        </td>

                        {/* Admin Column Selector */}
                        <td className="py-4 px-4 align-middle bg-teal-50/20 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <select
                              aria-label={`Permission for Admin on ${res.name}`}
                              value={adminLevel}
                              disabled={!canEditPermissions}
                              onChange={(e) => handlePermissionChange('admin', res.id, e.target.value as PermissionLevel)}
                              className={`py-1.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer focus:outline-hidden ${
                                adminLevel === 'full_control'
                                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                  : adminLevel === 'manage'
                                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                                  : 'bg-sky-100 text-sky-950 border-sky-300'
                              } disabled:opacity-80 disabled:cursor-not-allowed`}
                            >
                              <option value="view">👁️ View Only</option>
                              <option value="manage">⚡ Manage</option>
                              <option value="full_control">👑 Full Control</option>
                            </select>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {adminLevel === 'full_control' ? 'Unrestricted' : adminLevel === 'manage' ? 'Operations' : 'Read-only'}
                            </span>
                          </div>
                        </td>

                        {/* Super Admin Column Selector */}
                        <td className="py-4 px-4 align-middle bg-purple-50/20 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <select
                              aria-label={`Permission for Super Admin on ${res.name}`}
                              value={superAdminLevel}
                              disabled={!canEditPermissions}
                              onChange={(e) => handlePermissionChange('super_admin', res.id, e.target.value as PermissionLevel)}
                              className={`py-1.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer focus:outline-hidden ${
                                superAdminLevel === 'full_control'
                                  ? 'bg-purple-100 text-purple-950 border-purple-300'
                                  : superAdminLevel === 'manage'
                                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                                  : 'bg-sky-100 text-sky-950 border-sky-300'
                              } disabled:opacity-80 disabled:cursor-not-allowed`}
                            >
                              <option value="full_control">👑 Full Control</option>
                              <option value="manage">⚡ Manage</option>
                              <option value="view">👁️ View Only</option>
                            </select>
                            <span className="text-[10px] text-slate-400 font-medium">Master Owner</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STAFF USER DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name, email, department..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter staff by role"
                value={directoryRoleFilter}
                onChange={(e) => setDirectoryRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Roles ({staffUsers.length})</option>
                <option value="manager">Managers ({countManager})</option>
                <option value="admin">Admins ({countAdmin})</option>
                <option value="super_admin">Super Admins ({countSuperAdmin})</option>
              </select>

              <button
                type="button"
                id="btn-add-staff-directory"
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          {/* Staff Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((user) => {
              const isCurrent = user.id === currentStaff.id;
              const roleBadge = getRoleBadgeStyle(user.role);

              return (
                <div
                  key={user.id}
                  className={`bg-white rounded-3xl border p-5 shadow-2xs transition-all relative ${
                    isCurrent ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider bg-teal-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                      Active You
                    </span>
                  )}

                  <div className="flex items-start gap-3.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-black text-slate-900 text-sm truncate">
                          {user.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{user.department}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border ${roleBadge.badgeClass}`}>
                        {roleBadge.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {user.role === 'super_admin' ? '👑 Full Control' : user.role === 'admin' ? '🛡️ High Control' : '⚡ Manage'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isCurrent && (
                        <button
                          type="button"
                          id={`btn-switch-user-${user.id}`}
                          onClick={() => {
                            onSwitchStaffUser(user);
                            showToast(`Switched active view to ${user.name}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors cursor-pointer"
                          title="Switch to this user to test app from their perspective"
                        >
                          Switch
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit staff role"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete staff member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PERMISSION SCOPE GUIDE */}
      {activeSubTab === 'guide' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="text-lg font-heading font-black text-slate-900">
              Understanding Permission Levels: Between Manage & Full Control
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Every staff member at WaveHaven operates within a designated security boundary. The system allows fine-tuning each module between View, Manage, and Full Control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* View Only Tier */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-sky-200 text-sky-900 flex items-center justify-center font-bold">
                  <Eye className="w-4 h-4" />
                </span>
                <span className="font-heading font-black text-sky-950 text-sm">
                  1. View Only
                </span>
              </div>
              <p className="text-xs text-sky-900 leading-relaxed">
                Read-only inspection. The user can view reports, inspect occupancy grids, read booking details, and view settings without any ability to modify data.
              </p>
              <ul className="text-[11px] text-sky-800 space-y-1 list-disc list-inside">
                <li>Read reservations and guests</li>
                <li>View live ocean weather & calendars</li>
                <li>View financial revenue projections</li>
              </ul>
            </div>

            {/* Manage Tier */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </span>
                <span className="font-heading font-black text-amber-950 text-sm">
                  2. Manage (Operational Control)
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Empowered to perform day-to-day operations and workflows. Can create, edit, update guest records, check-in, update housekeeping, send WhatsApp reminders, and convert waitlists.
              </p>
              <ul className="text-[11px] text-amber-800 space-y-1 list-disc list-inside">
                <li>Create walk-ins & edit bookings</li>
                <li>1-Click Convert waitlist matches</li>
                <li>Update bed cleaning status</li>
                <li>Dispatch stay reminders via WhatsApp</li>
                <li>Blocked from deleting rooms or resetting data</li>
              </ul>
            </div>

            {/* Full Control Tier */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </span>
                <span className="font-heading font-black text-emerald-950 text-sm">
                  3. Full Control (Unrestricted Master)
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Executive authority. Can create and delete physical room inventories, configure tax rates, rotate webhook secrets, modify Elementor booking forms, and edit the master permissions matrix.
              </p>
              <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside">
                <li>Permanent room & booking deletion</li>
                <li>Fiscal tax & currency symbol edits</li>
                <li>Webhook endpoints & secret keys</li>
                <li>Add/delete staff & customize role permissions</li>
                <li>Full database export and factory reset</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900">Add Staff Member</h3>
                  <p className="text-xs text-slate-400">Assign role between Manager, Admin & Super Admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kai Sterling"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="kai@wavehavensurf.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role & Permission Tier</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as StaffRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="manager">⚡ Manager (Operational Manage Control)</option>
                  <option value="admin">🛡️ Admin (High Control / Setup & Ops)</option>
                  <option value="super_admin">👑 Super Admin (Full Control / Unrestricted)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {newUserRole === 'manager' && 'Manage access for daily operations (bookings, calendar, waitlist, housekeeping).'}
                  {newUserRole === 'admin' && 'Full control over rooms, add-ons, notifications, and form builder.'}
                  {newUserRole === 'super_admin' && 'Master owner privileges with full control over all modules and fiscal settings.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Front Desk & Guest Experience"
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Phone</label>
                <input
                  type="tel"
                  placeholder="+351 912 345 678"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
                >
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-black text-base text-slate-900">
                Edit Staff: {editingUser.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Assignment</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as StaffRole })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="manager">⚡ Manager (Operational Manage Control)</option>
                  <option value="admin">🛡️ Admin (High Control / Setup & Ops)</option>
                  <option value="super_admin">👑 Super Admin (Full Control / Unrestricted)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'suspended' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
