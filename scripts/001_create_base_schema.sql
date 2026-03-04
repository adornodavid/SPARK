-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'vendedor', 'coordinador', 'capturista');
CREATE TYPE user_status AS ENUM ('activo', 'inactivo', 'bloqueado');
CREATE TYPE hotel_status AS ENUM ('activo', 'inactivo');
CREATE TYPE quotation_status AS ENUM ('borrador', 'enviada', 'aceptada', 'rechazada', 'cancelada', 'expirada');
CREATE TYPE booking_status AS ENUM ('pendiente', 'confirmada', 'cancelada', 'completada', 'no_show');
CREATE TYPE payment_status AS ENUM ('pendiente', 'parcial', 'pagado', 'reembolsado');
CREATE TYPE agreement_status AS ENUM ('vigente', 'vencido', 'suspendido', 'cancelado');
CREATE TYPE notification_type AS ENUM ('sistema', 'cotizacion', 'reservacion', 'convenio', 'tarea');

-- Table: hotels
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'México',
  postal_code VARCHAR(10),
  timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
  tax_id VARCHAR(50),
  status hotel_status DEFAULT 'activo',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  employee_code VARCHAR(20) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'vendedor',
  status user_status DEFAULT 'activo',
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  room_type VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 1,
  base_rate DECIMAL(10,2),
  amenities JSONB DEFAULT '[]',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, room_number)
);

-- Table: event_spaces (salones)
CREATE TABLE event_spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  capacity_standing INTEGER,
  capacity_seated INTEGER,
  capacity_theater INTEGER,
  capacity_classroom INTEGER,
  capacity_banquet INTEGER,
  area_sqm DECIMAL(10,2),
  base_rate DECIMAL(10,2),
  amenities JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, code)
);

-- Table: clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_type VARCHAR(50) DEFAULT 'individual',
  company_name VARCHAR(255),
  tax_id VARCHAR(50),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  mobile VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(10),
  preferred_contact VARCHAR(50) DEFAULT 'email',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source VARCHAR(100),
  tags JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: client_contacts (contactos adicionales)
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: banquet_packages
CREATE TABLE banquet_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  package_type VARCHAR(50),
  base_price DECIMAL(10,2) NOT NULL,
  price_per_person DECIMAL(10,2),
  min_guests INTEGER,
  max_guests INTEGER,
  includes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: menu_categories
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: menu_items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  dietary_info JSONB DEFAULT '[]',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE banquet_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('superadmin', 'admin') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (is_admin());

-- RLS Policies for hotels
CREATE POLICY "Anyone authenticated can view hotels" ON hotels
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage hotels" ON hotels
  FOR ALL USING (is_admin());

-- RLS Policies for rooms
CREATE POLICY "Anyone authenticated can view rooms" ON rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage rooms" ON rooms
  FOR ALL USING (is_admin());

-- RLS Policies for event_spaces
CREATE POLICY "Anyone authenticated can view event spaces" ON event_spaces
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage event spaces" ON event_spaces
  FOR ALL USING (is_admin());

-- RLS Policies for clients
CREATE POLICY "Users can view clients" ON clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their assigned clients" ON clients
  FOR UPDATE USING (assigned_to = auth.uid() OR is_admin());

CREATE POLICY "Admins can delete clients" ON clients
  FOR DELETE USING (is_admin());

-- RLS Policies for client_contacts
CREATE POLICY "Users can view client contacts" ON client_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = client_contacts.client_id
    )
  );

CREATE POLICY "Users can manage contacts for their clients" ON client_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_contacts.client_id 
      AND (clients.assigned_to = auth.uid() OR is_admin())
    )
  );

-- RLS Policies for banquet packages
CREATE POLICY "Anyone authenticated can view packages" ON banquet_packages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage packages" ON banquet_packages
  FOR ALL USING (is_admin());

-- RLS Policies for menu categories
CREATE POLICY "Anyone authenticated can view menu categories" ON menu_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage menu categories" ON menu_categories
  FOR ALL USING (is_admin());

-- RLS Policies for menu items
CREATE POLICY "Anyone authenticated can view menu items" ON menu_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage menu items" ON menu_items
  FOR ALL USING (is_admin());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_spaces_updated_at BEFORE UPDATE ON event_spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banquet_packages_updated_at BEFORE UPDATE ON banquet_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
