-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('individual', 'empresa')), -- individual o empresa
  -- Individual fields
  first_name TEXT,
  last_name TEXT,
  -- Company fields
  company_name TEXT,
  rfc TEXT,
  -- Common fields
  email TEXT,
  phone TEXT,
  mobile TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'México',
  postal_code TEXT,
  -- CRM fields
  source TEXT, -- origen del contacto
  tags JSONB, -- etiquetas para segmentación
  notes TEXT,
  preferred_contact_method TEXT, -- email, phone, whatsapp
  birthday DATE,
  -- Tracking
  created_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id), -- vendedor asignado
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Client contacts (for companies)
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT, -- cargo en la empresa
  email TEXT,
  phone TEXT,
  mobile TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Client documents
CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'identificacion', 'contrato', 'otro'
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Client activity log
CREATE TABLE IF NOT EXISTS public.client_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB, -- datos adicionales según el tipo
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view clients"
  ON public.clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create clients"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Admins can manage all clients"
  ON public.clients FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS Policies for client contacts
CREATE POLICY "Users can view client contacts"
  ON public.client_contacts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = client_id AND (created_by = auth.uid() OR assigned_to = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Users can manage their client contacts"
  ON public.client_contacts FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = client_id AND (created_by = auth.uid() OR assigned_to = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- RLS Policies for client documents
CREATE POLICY "Users can view client documents"
  ON public.client_documents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = client_id AND (created_by = auth.uid() OR assigned_to = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Users can upload documents to their clients"
  ON public.client_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- RLS Policies for client activities
CREATE POLICY "Users can view client activities"
  ON public.client_activities FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE id = client_id AND (created_by = auth.uid() OR assigned_to = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Users can create activities for their clients"
  ON public.client_activities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
