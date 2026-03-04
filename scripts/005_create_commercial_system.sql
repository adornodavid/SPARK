-- Room bookings
CREATE TABLE IF NOT EXISTS public.room_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio TEXT NOT NULL UNIQUE, -- e.g., TEC-RB-2025-0001
  hotel_id UUID NOT NULL REFERENCES public.hotels(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  
  -- Booking details
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL,
  adults INTEGER NOT NULL,
  children INTEGER DEFAULT 0,
  
  -- Status
  status booking_status NOT NULL DEFAULT 'reserva',
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL,
  ish DECIMAL(10, 2) DEFAULT 0, -- Impuesto Sobre Hospedaje
  total DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  
  -- Special requests
  special_requests TEXT,
  notes TEXT,
  
  -- Tracking
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Booking rooms (many-to-many)
CREATE TABLE IF NOT EXISTS public.booking_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.room_bookings(id) ON DELETE CASCADE,
  room_category_id UUID NOT NULL REFERENCES public.room_categories(id),
  room_id UUID REFERENCES public.rooms(id), -- assigned room
  tariff_id UUID REFERENCES public.room_tariffs(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  rate_per_night DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Corporate agreements (convenios)
CREATE TABLE IF NOT EXISTS public.corporate_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio TEXT NOT NULL UNIQUE, -- e.g., CONV-2025-0001
  client_id UUID NOT NULL REFERENCES public.clients(id),
  hotel_id UUID REFERENCES public.hotels(id), -- null = applies to all hotels
  
  -- Agreement details
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5, 2),
  special_rate DECIMAL(10, 2),
  currency TEXT DEFAULT 'MXN',
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  
  -- Status
  status agreement_status NOT NULL DEFAULT 'activo',
  
  -- Conditions
  terms_and_conditions TEXT,
  payment_terms TEXT,
  min_nights INTEGER,
  blackout_dates JSONB, -- fechas excluidas
  
  -- Tracking
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Agreement room categories (which categories are included)
CREATE TABLE IF NOT EXISTS public.agreement_room_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_id UUID NOT NULL REFERENCES public.corporate_agreements(id) ON DELETE CASCADE,
  room_category_id UUID NOT NULL REFERENCES public.room_categories(id),
  special_rate DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(agreement_id, room_category_id)
);

-- Enable RLS
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_room_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view bookings they created"
  ON public.room_bookings FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "Users can create bookings"
  ON public.room_bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their bookings"
  ON public.room_bookings FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all bookings"
  ON public.room_bookings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "Users can view booking rooms"
  ON public.booking_rooms FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_bookings
      WHERE id = booking_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')))
    )
  );

CREATE POLICY "Users can manage their booking rooms"
  ON public.booking_rooms FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_bookings
      WHERE id = booking_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "All users can view agreements"
  ON public.corporate_agreements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create agreements"
  ON public.corporate_agreements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all agreements"
  ON public.corporate_agreements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "Users can view agreement categories"
  ON public.agreement_room_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage agreement categories"
  ON public.agreement_room_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
