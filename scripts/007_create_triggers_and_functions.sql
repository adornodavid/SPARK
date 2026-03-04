-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_categories_updated_at BEFORE UPDATE ON public.room_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_tariffs_updated_at BEFORE UPDATE ON public.room_tariffs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_spaces_updated_at BEFORE UPDATE ON public.event_spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_space_tariffs_updated_at BEFORE UPDATE ON public.event_space_tariffs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_contacts_updated_at BEFORE UPDATE ON public.client_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banquet_packages_updated_at BEFORE UPDATE ON public.banquet_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_additional_services_updated_at BEFORE UPDATE ON public.additional_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banquet_quotations_updated_at BEFORE UPDATE ON public.banquet_quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_bookings_updated_at BEFORE UPDATE ON public.room_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporate_agreements_updated_at BEFORE UPDATE ON public.corporate_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_goals_updated_at BEFORE UPDATE ON public.sales_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name,
    phone,
    role,
    employee_code,
    status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'vendedor'::user_role),
    COALESCE(NEW.raw_user_meta_data->>'employee_code', NULL),
    'activo'::user_status
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to handle login attempts and account locking
CREATE OR REPLACE FUNCTION public.check_login_attempts(user_id UUID)
RETURNS TABLE (is_locked BOOLEAN, locked_until TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  v_login_attempts INTEGER;
  v_locked_until TIMESTAMP WITH TIME ZONE;
  v_status user_status;
BEGIN
  SELECT login_attempts, profiles.locked_until, status
  INTO v_login_attempts, v_locked_until, v_status
  FROM public.profiles
  WHERE id = user_id;
  
  -- Check if account is blocked or inactive
  IF v_status = 'bloqueado' THEN
    RETURN QUERY SELECT true, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  IF v_status = 'inactivo' THEN
    RETURN QUERY SELECT true, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Check if locked and if lock has expired
  IF v_locked_until IS NOT NULL THEN
    IF v_locked_until > NOW() THEN
      RETURN QUERY SELECT true, v_locked_until;
      RETURN;
    ELSE
      -- Reset lock
      UPDATE public.profiles
      SET login_attempts = 0, locked_until = NULL
      WHERE id = user_id;
    END IF;
  END IF;
  
  RETURN QUERY SELECT false, NULL::TIMESTAMP WITH TIME ZONE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment login attempts
CREATE OR REPLACE FUNCTION public.increment_login_attempts(user_id UUID)
RETURNS void AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE public.profiles
  SET login_attempts = login_attempts + 1
  WHERE id = user_id
  RETURNING login_attempts INTO v_attempts;
  
  -- Lock account after 5 failed attempts
  IF v_attempts >= 5 THEN
    UPDATE public.profiles
    SET locked_until = NOW() + INTERVAL '15 minutes'
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset login attempts on successful login
CREATE OR REPLACE FUNCTION public.reset_login_attempts(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET login_attempts = 0, locked_until = NULL, last_login = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate folio numbers
CREATE OR REPLACE FUNCTION generate_folio(
  p_hotel_code TEXT,
  p_type TEXT, -- 'BQ' for banquet, 'RB' for room booking, 'CONV' for agreement
  p_year INTEGER
)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_folio TEXT;
BEGIN
  -- Get count of existing folios for this type and year
  IF p_type = 'BQ' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.banquet_quotations
    WHERE folio LIKE p_hotel_code || '-' || p_type || '-' || p_year || '-%';
  ELSIF p_type = 'RB' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.room_bookings
    WHERE folio LIKE p_hotel_code || '-' || p_type || '-' || p_year || '-%';
  ELSIF p_type = 'CONV' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.corporate_agreements
    WHERE folio LIKE 'CONV-' || p_year || '-%';
    
    -- Different format for agreements
    v_folio := 'CONV-' || p_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
    RETURN v_folio;
  END IF;
  
  -- Generate folio
  v_folio := p_hotel_code || '-' || p_type || '-' || p_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
  
  RETURN v_folio;
END;
$$ LANGUAGE plpgsql;
