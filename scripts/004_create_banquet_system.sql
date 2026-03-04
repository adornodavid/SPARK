-- Banquet packages
CREATE TABLE IF NOT EXISTS public.banquet_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_per_person DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  min_guests INTEGER NOT NULL,
  max_guests INTEGER,
  includes JSONB, -- lista de lo que incluye
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Menu categories (entradas, platos fuertes, postres, etc.)
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Menu items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'MXN',
  is_vegetarian BOOLEAN NOT NULL DEFAULT false,
  is_vegan BOOLEAN NOT NULL DEFAULT false,
  allergens JSONB, -- lista de alérgenos
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Additional services (DJ, decoración, fotografía, etc.)
CREATE TABLE IF NOT EXISTS public.additional_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE, -- null = disponible en todos
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'musica', 'decoracion', 'fotografia', 'mobiliario', 'otro'
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  unit TEXT NOT NULL, -- 'evento', 'hora', 'pieza'
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Banquet quotations
CREATE TABLE IF NOT EXISTS public.banquet_quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio TEXT NOT NULL UNIQUE, -- e.g., TEC-BQ-2025-0001
  hotel_id UUID NOT NULL REFERENCES public.hotels(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  event_space_id UUID REFERENCES public.event_spaces(id),
  
  -- Event details
  event_type event_type NOT NULL,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_start_time TIME,
  event_end_time TIME,
  guests_count INTEGER NOT NULL,
  
  -- Package and pricing
  package_id UUID REFERENCES public.banquet_packages(id),
  base_price_per_person DECIMAL(10, 2) NOT NULL,
  space_rental DECIMAL(10, 2) DEFAULT 0,
  
  -- Totals
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  
  -- Status and workflow
  status quotation_status NOT NULL DEFAULT 'borrador',
  version INTEGER NOT NULL DEFAULT 1,
  parent_quotation_id UUID REFERENCES public.banquet_quotations(id), -- for revisions
  
  -- Validity
  valid_until DATE NOT NULL,
  
  -- Special conditions
  notes TEXT,
  terms_and_conditions TEXT,
  payment_terms TEXT,
  
  -- Tracking
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Quotation menu items
CREATE TABLE IF NOT EXISTS public.quotation_menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES public.banquet_quotations(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Quotation services
CREATE TABLE IF NOT EXISTS public.quotation_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES public.banquet_quotations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.additional_services(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.banquet_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banquet_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies (all authenticated can read, vendedores can create, admins can manage)
CREATE POLICY "All users can view packages"
  ON public.banquet_packages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage packages"
  ON public.banquet_packages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "All users can view menu categories"
  ON public.menu_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage menu categories"
  ON public.menu_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "All users can view menu items"
  ON public.menu_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage menu items"
  ON public.menu_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "All users can view services"
  ON public.additional_services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage services"
  ON public.additional_services FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "Users can view quotations they created"
  ON public.banquet_quotations FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "Users can create quotations"
  ON public.banquet_quotations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their quotations"
  ON public.banquet_quotations FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all quotations"
  ON public.banquet_quotations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "Users can view quotation menu items"
  ON public.quotation_menu_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.banquet_quotations
      WHERE id = quotation_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
    )
  );

CREATE POLICY "Users can manage their quotation menu items"
  ON public.quotation_menu_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.banquet_quotations
      WHERE id = quotation_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view quotation services"
  ON public.quotation_services FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.banquet_quotations
      WHERE id = quotation_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
    )
  );

CREATE POLICY "Users can manage their quotation services"
  ON public.quotation_services FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.banquet_quotations
      WHERE id = quotation_id AND created_by = auth.uid()
    )
  );
