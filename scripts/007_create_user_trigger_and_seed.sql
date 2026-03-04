-- Create trigger function to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Nuevo'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'vendedor'),
    'activo'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial hotel data
INSERT INTO public.hotels (code, name, legal_name, email, phone, status)
VALUES 
  ('HTL', 'Hotel Principal', 'Hotel Principal S.A. de C.V.', 'info@hotelprincipal.com', '+52 55 1234 5678', 'activo')
ON CONFLICT (code) DO NOTHING;

-- Note: Para crear el primer usuario administrador, debes registrarte en la aplicación
-- y luego ejecutar este SQL para actualizar tu rol:
-- 
-- UPDATE public.profiles 
-- SET role = 'superadmin', 
--     first_name = 'Tu Nombre',
--     last_name = 'Tu Apellido'
-- WHERE id = 'TU_USER_ID_AQUI';
