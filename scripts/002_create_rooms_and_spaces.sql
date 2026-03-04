-- Room categories
CREATE TABLE IF NOT EXISTS public.room_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Estándar', 'Suite Junior', 'Master Suite'
  description TEXT,
  max_occupancy INTEGER NOT NULL,
  amenities JSONB, -- array of amenities
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id, name)
);

-- Room tariffs (rack rates, corporate rates, etc.)
CREATE TABLE IF NOT EXISTS public.room_tariffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.room_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Tarifa Rack', 'Tarifa Corporativa'
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  valid_from DATE NOT NULL,
  valid_until DATE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Individual rooms inventory
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.room_categories(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor INTEGER,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id, room_number)
);

-- Event spaces (salones)
CREATE TABLE IF NOT EXISTS public.event_spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity_theater INTEGER, -- capacidad teatro
  capacity_banquet INTEGER, -- capacidad banquete
  capacity_cocktail INTEGER, -- capacidad coctel
  capacity_classroom INTEGER, -- capacidad escuela
  area_m2 DECIMAL(10, 2),
  amenities JSONB, -- audio, video, wifi, etc.
  is_available BOOLEAN NOT NULL DEFAULT true,
  photos JSONB, -- array of photo URLs
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hotel_id, name)
);

-- Event space tariffs
CREATE TABLE IF NOT EXISTS public.event_space_tariffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.event_spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Renta por día', 'Renta por hora'
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  unit TEXT NOT NULL, -- 'día', 'hora', 'evento'
  valid_from DATE NOT NULL,
  valid_until DATE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_space_tariffs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (all authenticated users can read, admins can manage)
CREATE POLICY "All users can view room categories"
  ON public.room_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage room categories"
  ON public.room_categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "All users can view room tariffs"
  ON public.room_tariffs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage room tariffs"
  ON public.room_tariffs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "All users can view rooms"
  ON public.rooms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage rooms"
  ON public.rooms FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "All users can view event spaces"
  ON public.event_spaces FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage event spaces"
  ON public.event_spaces FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "All users can view event space tariffs"
  ON public.event_space_tariffs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage event space tariffs"
  ON public.event_space_tariffs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
