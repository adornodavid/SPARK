-- Table: bookings (reservaciones de habitaciones)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights INTEGER NOT NULL,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  status booking_status DEFAULT 'pendiente',
  payment_status payment_status DEFAULT 'pendiente',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  special_requests TEXT,
  notes TEXT,
  internal_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: booking_rooms (habitaciones en la reservación)
CREATE TABLE booking_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: corporate_agreements (convenios corporativos)
CREATE TABLE corporate_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  agreement_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_percentage DECIMAL(5,2),
  special_rate DECIMAL(10,2),
  terms TEXT,
  status agreement_status DEFAULT 'vigente',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: agreement_rates (tarifas especiales por convenio)
CREATE TABLE agreement_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_id UUID NOT NULL REFERENCES corporate_agreements(id) ON DELETE CASCADE,
  room_type VARCHAR(100) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Users can view bookings" ON bookings
  FOR SELECT USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their bookings" ON bookings
  FOR UPDATE USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "Admins can delete bookings" ON bookings
  FOR DELETE USING (is_admin());

-- RLS Policies for booking_rooms
CREATE POLICY "Users can view booking rooms" ON booking_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_rooms.booking_id 
      AND (bookings.created_by = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users can manage their booking rooms" ON booking_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_rooms.booking_id 
      AND (bookings.created_by = auth.uid() OR is_admin())
    )
  );

-- RLS Policies for corporate_agreements
CREATE POLICY "Users can view agreements" ON corporate_agreements
  FOR SELECT USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "Users can create agreements" ON corporate_agreements
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their agreements" ON corporate_agreements
  FOR UPDATE USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "Admins can delete agreements" ON corporate_agreements
  FOR DELETE USING (is_admin());

-- RLS Policies for agreement_rates
CREATE POLICY "Users can view agreement rates" ON agreement_rates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM corporate_agreements 
      WHERE corporate_agreements.id = agreement_rates.agreement_id 
      AND (corporate_agreements.created_by = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users can manage agreement rates" ON agreement_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM corporate_agreements 
      WHERE corporate_agreements.id = agreement_rates.agreement_id 
      AND (corporate_agreements.created_by = auth.uid() OR is_admin())
    )
  );

-- Triggers
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporate_agreements_updated_at BEFORE UPDATE ON corporate_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate booking folio
CREATE OR REPLACE FUNCTION generate_booking_folio(p_hotel_id UUID, p_year INTEGER)
RETURNS VARCHAR AS $$
DECLARE
  hotel_code VARCHAR(3);
  consecutive INTEGER;
  new_folio VARCHAR(50);
BEGIN
  SELECT code INTO hotel_code FROM hotels WHERE id = p_hotel_id;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(folio FROM 9) AS INTEGER)), 0) + 1
  INTO consecutive
  FROM bookings
  WHERE folio LIKE hotel_code || '-RV-' || p_year || '%';
  
  new_folio := hotel_code || '-RV-' || p_year || '-' || LPAD(consecutive::TEXT, 4, '0');
  
  RETURN new_folio;
END;
$$ LANGUAGE plpgsql;
