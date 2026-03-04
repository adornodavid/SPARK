-- Table: quotations (cotizaciones de banquetes)
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE RESTRICT,
  event_space_id UUID REFERENCES event_spaces(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  event_name VARCHAR(255),
  event_type VARCHAR(100),
  event_date DATE,
  event_start_time TIME,
  event_end_time TIME,
  guest_count INTEGER,
  status quotation_status DEFAULT 'borrador',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  internal_notes TEXT,
  valid_until DATE,
  accepted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: quotation_items (servicios en la cotización)
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  package_id UUID REFERENCES banquet_packages(id) ON DELETE SET NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: quotation_versions (historial de cambios)
CREATE TABLE quotation_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quotation_id, version_number)
);

-- Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotations
CREATE POLICY "Users can view quotations" ON quotations
  FOR SELECT USING (
    created_by = auth.uid() OR 
    is_admin() OR
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = quotations.client_id 
      AND clients.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can create quotations" ON quotations
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their quotations" ON quotations
  FOR UPDATE USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "Admins can delete quotations" ON quotations
  FOR DELETE USING (is_admin());

-- RLS Policies for quotation_items
CREATE POLICY "Users can view quotation items" ON quotation_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_items.quotation_id 
      AND (quotations.created_by = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users can manage their quotation items" ON quotation_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_items.quotation_id 
      AND (quotations.created_by = auth.uid() OR is_admin())
    )
  );

-- RLS Policies for quotation_versions
CREATE POLICY "Users can view quotation versions" ON quotation_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_versions.quotation_id 
      AND (quotations.created_by = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users can create quotation versions" ON quotation_versions
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Triggers
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate folio
CREATE OR REPLACE FUNCTION generate_quotation_folio(p_hotel_id UUID, p_year INTEGER)
RETURNS VARCHAR AS $$
DECLARE
  hotel_code VARCHAR(3);
  consecutive INTEGER;
  new_folio VARCHAR(50);
BEGIN
  SELECT code INTO hotel_code FROM hotels WHERE id = p_hotel_id;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(folio FROM 9) AS INTEGER)), 0) + 1
  INTO consecutive
  FROM quotations
  WHERE folio LIKE hotel_code || '-BQ-' || p_year || '%';
  
  new_folio := hotel_code || '-BQ-' || p_year || '-' || LPAD(consecutive::TEXT, 4, '0');
  
  RETURN new_folio;
END;
$$ LANGUAGE plpgsql;
