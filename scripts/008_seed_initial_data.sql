-- Insert menu categories
INSERT INTO public.menu_categories (name, display_order) VALUES
  ('Entradas', 1),
  ('Ensaladas', 2),
  ('Platos Fuertes', 3),
  ('Guarniciones', 4),
  ('Postres', 5),
  ('Bebidas', 6)
ON CONFLICT DO NOTHING;

-- Insert sample additional services categories data
INSERT INTO public.additional_services (name, description, category, price, unit, is_available) VALUES
  ('DJ Profesional', 'Servicio de DJ con equipo de sonido profesional', 'musica', 5000.00, 'evento', true),
  ('Banda en vivo', 'Banda musical en vivo (4 horas)', 'musica', 15000.00, 'evento', true),
  ('Decoración básica', 'Decoración con globos y centros de mesa', 'decoracion', 3000.00, 'evento', true),
  ('Decoración premium', 'Decoración completa con flores naturales y iluminación', 'decoracion', 10000.00, 'evento', true),
  ('Fotógrafo', 'Servicio de fotografía profesional (6 horas)', 'fotografia', 8000.00, 'evento', true),
  ('Video', 'Servicio de video profesional con edición', 'fotografia', 12000.00, 'evento', true),
  ('Sillas tiffany', 'Renta de sillas tiffany', 'mobiliario', 50.00, 'pieza', true),
  ('Mantelería premium', 'Mantelería de alta calidad', 'mobiliario', 200.00, 'pieza', true)
ON CONFLICT DO NOTHING;

-- Note: Hotels, rooms, and specific data will be added by the admin through the UI
-- or can be provided via CSV import in the future
