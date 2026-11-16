import React, { useEffect, useState } from 'react';
import { 
  getStoredAddOns, getStoredBookings, getStoredRooms, 
  getStoredSettings, getStoredTemplates, getStoredWaitlist, saveStoredAddOns, 
  saveStoredBookings, saveStoredRooms, saveStoredSettings, 
  saveStoredTemplates, saveStoredWaitlist,
  getStoredStaffUsers, getStoredCurrentStaffUser, getStoredRolePermissions,
  saveStoredStaffUsers, saveStoredCurrentStaffUser, saveStoredRolePermissions,
  getStoredAdminAuth, saveStoredAdminAuth
} from './utils/storage';
import { 
  Booking, HostelSettings, NotificationTemplate, Room, SurfAddOn, 
  WaitlistEntry, AdminTab, StaffUser, StaffRole, RolePermissionsMap 
} from './types';
import { Navbar } from './components/Navbar';
import { BookingWizard } from './components/booking/BookingWizard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { getStayUrgencyBadge } from './utils/date';
import { Waves, Shield, CalendarCheck, MessageCircle, MapPin, Heart } from 'lucide-react';
import { createWhatsAppUrl } from './utils/whatsapp';
import { BookingInvoiceModal } from './components/invoice/BookingInvoiceModal';
import { ReservationLookupModal } from './components/invoice/ReservationLookupModal';
import { applyThemeStyles } from './utils/theme';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  const [currentView, setCurrentView] = useState<'booking' | 'admin' | 'admin-login'>('booking');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => getStoredAdminAuth());
  const [adminTab, setAdminTab] = useState<AdminTab>('bookings');
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [lookupStartWithScanner, setLookupStartWithScanner] = useState(false);
  const [activeInvoiceBooking, setActiveInvoiceBooking] = useState<Booking | null>(null);

  const handleOpenScanner = () => {
    setLookupStartWithScanner(true);
    setIsLookupModalOpen(true);
  };

  const handleOpenLookup = () => {
    setLookupStartWithScanner(false);
    setIsLookupModalOpen(true);
  };

  const handleViewChange = (view: 'booking' | 'admin' | 'admin-login', tab?: string) => {
    if (view === 'admin' && !isAdminAuthenticated) {
      setCurrentView('admin-login');
      if (tab) {
        setAdminTab(tab as AdminTab);
      }
      return;
    }
    setCurrentView(view);
    if (tab) {
      setAdminTab(tab as AdminTab);
    }
  };

  const handleLoginSuccess = (user: StaffUser) => {
    setIsAdminAuthenticated(true);
    saveStoredAdminAuth(true);
    setCurrentStaff(user);
    saveStoredCurrentStaffUser(user);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    saveStoredAdminAuth(false);
    setCurrentView('booking');
  };

  // Core synchronized application state
  const [rooms, setRooms] = useState<Room[]>(getStoredRooms());
  const [bookings, setBookings] = useState<Booking[]>(getStoredBookings());
  const [addOns, setAddOns] = useState<SurfAddOn[]>(getStoredAddOns());
  const [settings, setSettings] = useState<HostelSettings>(getStoredSettings());
  const [templates, setTemplates] = useState<NotificationTemplate[]>(getStoredTemplates());
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(getStoredWaitlist());
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(getStoredStaffUsers());
  const [currentStaff, setCurrentStaff] = useState<StaffUser>(getStoredCurrentStaffUser());
  const [rolePermissions, setRolePermissions] = useState<Record<StaffRole, RolePermissionsMap>>(getStoredRolePermissions());

  // Listen for ?ref= or #ref= URL parameters (from QR codes, email, or WhatsApp links)
  useEffect(() => {
    const handleUrlRefCheck = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        let refCode = urlParams.get('ref');
        
        if (!refCode && window.location.hash) {
          const hashMatch = window.location.hash.match(/ref=([A-Za-z0-9-]+)/i);
          if (hashMatch) {
            refCode = hashMatch[1];
          }
        }

        if (refCode) {
          const cleanRef = refCode.trim().replace(/^#/, '').toUpperCase();
          const found = bookings.find(
            (b) => b.referenceNumber.toUpperCase() === cleanRef ||
                   b.referenceNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanRef.replace(/[^A-Za-z0-9]/g, '')
          );
          if (found) {
            setActiveInvoiceBooking(found);
          } else {
            setIsLookupModalOpen(true);
          }
        }
      } catch {
        // Safe URL parse fallback
      }
    };

    handleUrlRefCheck();
    window.addEventListener('popstate', handleUrlRefCheck);
    return () => window.removeEventListener('popstate', handleUrlRefCheck);
  }, [bookings]);

  // Listen for storage events to keep state synced
  useEffect(() => {
    const handleStorageUpdate = () => {
      setRooms(getStoredRooms());
      setBookings(getStoredBookings());
      setAddOns(getStoredAddOns());
      setSettings(getStoredSettings());
      setTemplates(getStoredTemplates());
      setWaitlist(getStoredWaitlist());
      setStaffUsers(getStoredStaffUsers());
      setCurrentStaff(getStoredCurrentStaffUser());
      setRolePermissions(getStoredRolePermissions());
      setIsAdminAuthenticated(getStoredAdminAuth());
    };

    window.addEventListener('wavehaven_storage_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('wavehaven_storage_updated', handleStorageUpdate);
    };
  }, []);

  // Staff and Role Permissions CRUD
  const handleSwitchStaff = (user: StaffUser) => {
    setCurrentStaff(user);
    saveStoredCurrentStaffUser(user);
  };

  const handleUpdateRolePermissions = (matrix: Record<StaffRole, RolePermissionsMap>) => {
    setRolePermissions(matrix);
    saveStoredRolePermissions(matrix);
  };

  const handleAddStaffUser = (newUser: StaffUser) => {
    const updated = [...staffUsers, newUser];
    setStaffUsers(updated);
    saveStoredStaffUsers(updated);
  };

  const handleUpdateStaffUser = (updatedUser: StaffUser) => {
    const updated = staffUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setStaffUsers(updated);
    saveStoredStaffUsers(updated);
    if (currentStaff.id === updatedUser.id) {
      setCurrentStaff(updatedUser);
      saveStoredCurrentStaffUser(updatedUser);
    }
  };

  const handleDeleteStaffUser = (userId: string) => {
    const updated = staffUsers.filter((u) => u.id !== userId);
    setStaffUsers(updated);
    saveStoredStaffUsers(updated);
  };

  // Apply hostel UI theme customizer (corner radii, border widths, shadows, and brand colors)
  useEffect(() => {
    applyThemeStyles(settings.themeConfig, settings.primaryBrandColor || '#0d9488');
  }, [settings.themeConfig, settings.primaryBrandColor]);

  // Bookings CRUD
  const handleSaveNewBooking = (newBooking: Booking) => {
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    saveStoredBookings(updated);
  };

  const handleUpdateBooking = (updatedBooking: Booking) => {
    const updated = bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
    setBookings(updated);
    saveStoredBookings(updated);
  };

  const handleBatchUpdateBookings = (updatedList: Booking[]) => {
    const map = new Map(updatedList.map((b) => [b.id, b]));
    const updated = bookings.map((b) => map.get(b.id) || b);
    setBookings(updated);
    saveStoredBookings(updated);
  };

  const handleDeleteBooking = (bookingId: string) => {
    const updated = bookings.filter((b) => b.id !== bookingId);
    setBookings(updated);
    saveStoredBookings(updated);
  };

  // Waitlist CRUD
  const handleAddWaitlistEntry = (newEntry: WaitlistEntry) => {
    const updated = [newEntry, ...waitlist];
    setWaitlist(updated);
    saveStoredWaitlist(updated);
  };

  const handleUpdateWaitlistEntry = (updatedEntry: WaitlistEntry) => {
    const updated = waitlist.map((w) => (w.id === updatedEntry.id ? updatedEntry : w));
    setWaitlist(updated);
    saveStoredWaitlist(updated);
  };

  const handleDeleteWaitlistEntry = (entryId: string) => {
    const updated = waitlist.filter((w) => w.id !== entryId);
    setWaitlist(updated);
    saveStoredWaitlist(updated);
  };

  const handleConvertWaitlistToBooking = (entry: WaitlistEntry, newBooking: Booking) => {
    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    saveStoredBookings(updatedBookings);

    const updatedWaitlist = waitlist.map((w) => (w.id === entry.id ? { ...w, status: 'converted' as const } : w));
    setWaitlist(updatedWaitlist);
    saveStoredWaitlist(updatedWaitlist);
  };

  // Rooms CRUD
  const handleUpdateRoom = (updatedRoom: Room) => {
    const updated = rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    setRooms(updated);
    saveStoredRooms(updated);
  };

  const handleBatchUpdateRooms = (updatedRoomsList: Room[]) => {
    const map = new Map(updatedRoomsList.map((r) => [r.id, r]));
    const updated = rooms.map((r) => map.get(r.id) || r);
    setRooms(updated);
    saveStoredRooms(updated);
  };

  const handleAddRoom = (newRoom: Room) => {
    const updated = [...rooms, newRoom];
    setRooms(updated);
    saveStoredRooms(updated);
  };

  const handleDeleteRoom = (roomId: string) => {
    const updated = rooms.filter((r) => r.id !== roomId);
    setRooms(updated);
    saveStoredRooms(updated);
  };

  // Add-ons CRUD
  const handleUpdateAddOn = (updatedAddOn: SurfAddOn) => {
    const updated = addOns.map((a) => (a.id === updatedAddOn.id ? updatedAddOn : a));
    setAddOns(updated);
    saveStoredAddOns(updated);
  };

  const handleAddAddOn = (newAddOn: SurfAddOn) => {
    const updated = [...addOns, newAddOn];
    setAddOns(updated);
    saveStoredAddOns(updated);
  };

  const handleDeleteAddOn = (addOnId: string) => {
    const updated = addOns.filter((a) => a.id !== addOnId);
    setAddOns(updated);
    saveStoredAddOns(updated);
  };

  // Settings & Templates
  const handleSaveSettings = (newSettings: HostelSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleUpdateTemplate = (updatedTemplate: NotificationTemplate) => {
    const updated = templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t));
    setTemplates(updated);
    saveStoredTemplates(updated);
  };

  // Calculate upcoming stay count for badge
  const upcomingCount = bookings.filter((b) => {
    if (b.status === 'cancelled' || b.status === 'checked_out') return false;
    const badge = getStayUrgencyBadge(b.checkInDate);
    return badge.days >= 0 && badge.days <= 2 && !b.stayReminderSent;
  }).length;

  const directWhatsAppUrl = createWhatsAppUrl(
    settings.phone,
    `Aloha ${settings.name}! I would like to inquire about booking a surf stay. 🏄`
  );

  return (
    <LanguageProvider initialDefaultLanguage={settings.defaultLanguage || 'en'}>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        adminTab={adminTab}
        onViewChange={handleViewChange}
        settings={settings}
        upcomingCount={upcomingCount}
        onOpenLookup={handleOpenLookup}
        currentStaff={currentStaff}
        isAdminAuthenticated={isAdminAuthenticated}
        onLogout={handleAdminLogout}
        staffUsers={staffUsers}
        onSwitchStaff={handleSwitchStaff}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16 w-full max-w-full min-w-0">
        {currentView === 'booking' ? (
          <BookingWizard
            rooms={rooms}
            addOns={addOns}
            bookings={bookings}
            settings={settings}
            onSaveBooking={handleSaveNewBooking}
            onGoToAdmin={() => handleViewChange('admin')}
            onOpenScanner={handleOpenScanner}
          />
        ) : currentView === 'admin-login' || (!isAdminAuthenticated && currentView === 'admin') ? (
          <AdminLoginView
            settings={settings}
            staffUsers={staffUsers}
            onLoginSuccess={handleLoginSuccess}
            onBackToBooking={() => handleViewChange('booking')}
          />
        ) : (
          <AdminDashboard
            bookings={bookings}
            rooms={rooms}
            addOns={addOns}
            settings={settings}
            templates={templates}
            waitlist={waitlist}
            initialTab={adminTab}
            onTabChange={setAdminTab}
            onLogout={handleAdminLogout}
            onGoToBooking={() => handleViewChange('booking')}
            onUpdateBooking={handleUpdateBooking}
            onBatchUpdateBookings={handleBatchUpdateBookings}
            onDeleteBooking={handleDeleteBooking}
            onAddBooking={handleSaveNewBooking}
            onUpdateRoom={handleUpdateRoom}
            onAddRoom={handleAddRoom}
            onDeleteRoom={handleDeleteRoom}
            onBatchUpdateRooms={handleBatchUpdateRooms}
            onUpdateAddOn={handleUpdateAddOn}
            onAddAddOn={handleAddAddOn}
            onDeleteAddOn={handleDeleteAddOn}
            onSaveSettings={handleSaveSettings}
            onUpdateTemplate={handleUpdateTemplate}
            onAddWaitlistEntry={handleAddWaitlistEntry}
            onUpdateWaitlistEntry={handleUpdateWaitlistEntry}
            onDeleteWaitlistEntry={handleDeleteWaitlistEntry}
            onConvertWaitlistToBooking={handleConvertWaitlistToBooking}
            staffUsers={staffUsers}
            currentStaff={currentStaff}
            rolePermissions={rolePermissions}
            onSwitchStaffUser={handleSwitchStaff}
            onUpdateRolePermissions={handleUpdateRolePermissions}
            onAddStaffUser={handleAddStaffUser}
            onUpdateStaffUser={handleUpdateStaffUser}
            onDeleteStaffUser={handleDeleteStaffUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer 
        className="bg-slate-900 text-white border-t text-xs py-10 transition-colors duration-300"
        style={{
          borderTopColor: `${settings.primaryBrandColor || '#0d9488'}45`,
          borderTopWidth: '2px',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            {/* Brand */}
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <div 
                  className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center overflow-hidden shadow-md shrink-0"
                  style={{
                    boxShadow: `0 2px 10px -2px ${(settings.primaryBrandColor || '#0d9488')}40`,
                  }}
                >
                  <img 
                    src={settings.logoUrl} 
                    alt={settings.name} 
                    className="w-full h-full object-contain" 
                  />
                </div>
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold shadow-md shrink-0 transition-colors duration-300"
                  style={{ 
                    backgroundColor: settings.primaryBrandColor || '#0d9488',
                    boxShadow: `0 4px 12px -2px ${(settings.primaryBrandColor || '#0d9488')}50`
                  }}
                >
                  <Waves className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="font-heading font-extrabold text-base text-white flex items-center gap-2">
                  <span>{settings.name}</span>
                </h4>
                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin 
                    className="w-3.5 h-3.5 transition-colors duration-300" 
                    style={{ color: settings.primaryBrandColor || '#0d9488' }} 
                  />
                  {settings.address}
                </p>
              </div>
            </div>

            {/* Quick Links & WhatsApp */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleViewChange('booking')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={
                  currentView === 'booking'
                    ? { backgroundColor: settings.primaryBrandColor || '#0d9488', color: '#ffffff' }
                    : { color: '#94a3b8' }
                }
              >
                Guest Booking Flow
              </button>

              <button
                type="button"
                onClick={() => handleViewChange('admin')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={
                  currentView === 'admin' && adminTab !== 'settings'
                    ? { backgroundColor: settings.primaryBrandColor || '#0d9488', color: '#ffffff' }
                    : { color: '#94a3b8' }
                }
              >
                Admin Operations
              </button>

              <button
                type="button"
                onClick={() => handleViewChange('admin', 'settings')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={
                  currentView === 'admin' && adminTab === 'settings'
                    ? { backgroundColor: settings.primaryBrandColor || '#0d9488', color: '#ffffff' }
                    : { color: '#94a3b8' }
                }
              >
                Brand & Settings
              </button>

              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-100" />
                <span>WhatsApp Desk (+{settings.phone})</span>
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <p>
              © {new Date().getFullYear()} {settings.name}. Real-time Bed Availability & Direct WhatsApp Dispatch Engine.
            </p>
            <p className="flex items-center gap-1">
              <span>Made with pure salt water &</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
              <span>for global wave chasers.</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Reservation Lookup Modal (Allows any user to search by REF or scan QR) */}
      <ReservationLookupModal
        isOpen={isLookupModalOpen}
        onClose={() => {
          setIsLookupModalOpen(false);
          setLookupStartWithScanner(false);
        }}
        bookings={bookings}
        settings={settings}
        initialScanning={lookupStartWithScanner}
        onSelectBooking={(b) => {
          setActiveInvoiceBooking(b);
        }}
      />

      {/* Official Booking Invoice & QR Modal for looked-up or scanned reservations */}
      {activeInvoiceBooking && (
        <BookingInvoiceModal
          booking={activeInvoiceBooking}
          room={rooms.find((r) => r.id === activeInvoiceBooking.roomId)}
          addOns={addOns}
          settings={settings}
          isOpen={!!activeInvoiceBooking}
          onClose={() => {
            setActiveInvoiceBooking(null);
            if (window.location.search.includes('ref=') || window.location.hash.includes('ref=')) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }}
        />
      )}
      </div>
    </LanguageProvider>
  );
}
