-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'coordinador', 'vendedor', 'capturista', 'viewer');
CREATE TYPE user_status AS ENUM ('activo', 'inactivo', 'bloqueado');
CREATE TYPE hotel_status AS ENUM ('activo', 'inactivo', 'mantenimiento');
CREATE TYPE quotation_status AS ENUM ('borrador', 'enviada', 'aprobada', 'rechazada', 'vencida', 'cancelada');
CREATE TYPE booking_status AS ENUM ('reserva', 'confirmada', 'cancelada', 'completada', 'no_show');
CREATE TYPE payment_status AS ENUM ('pendiente', 'parcial', 'pagado', 'reembolsado');
CREATE TYPE agreement_status AS ENUM ('activo', 'suspendido', 'vencido', 'cancelado');
CREATE TYPE event_type AS ENUM ('boda', 'cumpleanos', 'evento_corporativo', 'graduacion', 'reunion_familiar', 'conferencia', 'otro');
CREATE TYPE notification_type AS ENUM ('cotizacion_nueva', 'cotizacion_vencimiento', 'convenio_vencimiento', 'pago_pendiente', 'seguimiento');
CREATE TYPE activity_type AS ENUM ('cotizacion_creada', 'cotizacion_enviada', 'cotizacion_aprobada', 'llamada', 'email', 'reunion', 'whatsapp', 'nota');

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
      THEN first_name || ' ' || last_name
      ELSE COALESCE(first_name, last_name, email)
    END
  ) STORED,
  role user_role NOT NULL DEFAULT 'vendedor',
  status user_status NOT NULL DEFAULT 'activo',
  phone TEXT,
  employee_code TEXT UNIQUE,
  avatar_url TEXT,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Hotels table
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- e.g., 'TEC', 'MRL', 'PZY'
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'México',
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  status hotel_status NOT NULL DEFAULT 'activo',
  check_in_time TIME NOT NULL DEFAULT '15:00:00',
  check_out_time TIME NOT NULL DEFAULT '12:00:00',
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 16.00, -- IVA percentage
  ish_rate DECIMAL(5, 2) DEFAULT 3.00, -- ISH percentage (hospedaje)
  currency TEXT NOT NULL DEFAULT 'MXN',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on hotels
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hotels (all authenticated users can read)
CREATE POLICY "All users can view hotels"
  ON public.hotels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage hotels"
  ON public.hotels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );
