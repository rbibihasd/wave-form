/**
 * Supabase & Cloud Deployment Utilities
 * Provides server-friendly schema generation, environment detection,
 * and live cloud database integration helpers for Vercel, Supabase, and self-hosted servers.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

const SUPABASE_STORAGE_URL_KEY = 'wavehaven_supabase_url';
const SUPABASE_STORAGE_ANON_KEY = 'wavehaven_supabase_anon_key';

export function getSupabaseConfig(): SupabaseConfig {
  let url = '';
  let anonKey = '';

  if (typeof window !== 'undefined') {
    url = localStorage.getItem(SUPABASE_STORAGE_URL_KEY) || '';
    anonKey = localStorage.getItem(SUPABASE_STORAGE_ANON_KEY) || '';
  }

  // Fallback to Vite env variables if not in localStorage
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  if (!url && metaEnv?.VITE_SUPABASE_URL) {
    url = metaEnv.VITE_SUPABASE_URL;
  }
  if (!anonKey && metaEnv?.VITE_SUPABASE_ANON_KEY) {
    anonKey = metaEnv.VITE_SUPABASE_ANON_KEY;
  }

  const isConfigured = Boolean(url && anonKey && url.includes('supabase.co'));

  return { url, anonKey, isConfigured };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUPABASE_STORAGE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_STORAGE_ANON_KEY, anonKey.trim());
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SUPABASE_STORAGE_URL_KEY);
    localStorage.removeItem(SUPABASE_STORAGE_ANON_KEY);
  }
}

/**
 * Generates production-ready Supabase PostgreSQL DDL migration script.
 * Can be executed in the Supabase SQL Editor with 1-click.
 */
export function generateSupabaseSQL(): string {
  return `-- ====================================================================
-- WaveHaven Surf House & Hostel — Supabase PostgreSQL Database Schema
-- Compatible with Supabase, PostgreSQL 14+, Vercel, AWS RDS, Docker
-- Generated on: ${new Date().toISOString()}
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Hostel Settings & Configurations Table
CREATE TABLE IF NOT EXISTS public.hostel_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'WaveHaven Surf House & Hostel',
  tagline TEXT DEFAULT 'Eat. Sleep. Surf. Connect.',
  primary_brand_color TEXT DEFAULT '#0d9488',
  logo_url TEXT,
  phone TEXT NOT NULL DEFAULT '351912345678',
  emergency_phone TEXT DEFAULT '351918765432',
  email TEXT NOT NULL DEFAULT 'hello@wavehavensurf.com',
  currency TEXT NOT NULL DEFAULT 'EUR',
  currency_symbol TEXT NOT NULL DEFAULT '€',
  tax_rate_percent NUMERIC(5, 2) DEFAULT 6.00,
  check_in_time TEXT DEFAULT '14:00',
  check_out_time TEXT DEFAULT '11:00',
  quiet_hours TEXT DEFAULT '23:00 - 08:00',
  min_stay_nights INT DEFAULT 1,
  max_stay_nights INT DEFAULT 30,
  max_guests_per_booking INT DEFAULT 8,
  deposit_requirement_percent INT DEFAULT 20,
  cancellation_policy TEXT DEFAULT 'flexible_48h',
  address TEXT DEFAULT 'Rua das Ondas 42, 2655-321 Ericeira',
  location TEXT DEFAULT 'Praia do Sul, Ericeira, Portugal',
  google_maps_url TEXT,
  wifi_network_name TEXT DEFAULT 'WaveHaven_Guest',
  wifi_password TEXT DEFAULT 'barrelrider2026',
  invoice_template_config JSONB,
  theme_config JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rooms & Accommodations Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  type_label TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  price_per_night NUMERIC(10, 2) NOT NULL,
  description TEXT,
  short_description TEXT,
  image TEXT,
  amenities TEXT[] DEFAULT '{}',
  bed_type TEXT,
  bathroom_type TEXT DEFAULT 'shared',
  has_ocean_view BOOLEAN DEFAULT false,
  has_air_conditioning BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Surf Add-ons & Equipment Table
CREATE TABLE IF NOT EXISTS public.surf_addons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  billing_type TEXT NOT NULL DEFAULT 'per_day',
  description TEXT,
  icon_name TEXT DEFAULT 'Waves',
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bookings & Reservations Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
  room_name TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights INT NOT NULL,
  guests_count INT NOT NULL DEFAULT 1,
  guest JSONB NOT NULL,
  add_ons JSONB DEFAULT '[]',
  room_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  add_ons_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  whatsapp_sent_count INT DEFAULT 0,
  webhook_sent_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Waitlist Entries Table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id TEXT PRIMARY KEY,
  guest JSONB NOT NULL,
  preferred_room_id TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INT DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Custom Translations & Languages Table
CREATE TABLE IF NOT EXISTS public.custom_translations (
  lang_code TEXT PRIMARY KEY,
  lang_name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  flag TEXT DEFAULT '🌐',
  is_rtl BOOLEAN DEFAULT false,
  translations_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON public.bookings(reference_number);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.hostel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surf_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_translations ENABLE ROW LEVEL SECURITY;

-- Allow read access to public
CREATE POLICY "Public read access for rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Public read access for addons" ON public.surf_addons FOR SELECT USING (true);
CREATE POLICY "Public read access for settings" ON public.hostel_settings FOR SELECT USING (true);
CREATE POLICY "Public read access for translations" ON public.custom_translations FOR SELECT USING (true);
CREATE POLICY "Public insert access for bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select by reference for bookings" ON public.bookings FOR SELECT USING (true);

-- ====================================================================
-- Schema setup complete. Ready for Vercel, Supabase, and Node servers!
-- ====================================================================
`;
}

/**
 * Triggers a download of the Supabase SQL migration file.
 */
export function downloadSupabaseSchemaSQL(): void {
  const sql = generateSupabaseSQL();
  const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `wavehaven_supabase_schema_${new Date().toISOString().split('T')[0]}.sql`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Pings Supabase API endpoint to verify connectivity.
 */
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL and Anon Key are required.' };
  }

  try {
    const cleanUrl = url.replace(/\/$/, '');
    const pingEndpoint = `${cleanUrl}/rest/v1/`;
    const res = await fetch(pingEndpoint, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });

    if (res.ok || res.status === 200 || res.status === 404) {
      return { success: true, message: 'Connected successfully to Supabase API!' };
    }
    return { success: false, message: `Supabase returned HTTP status: ${res.status}` };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Network error or invalid Supabase URL';
    return { success: false, message: errorMessage };
  }
}
