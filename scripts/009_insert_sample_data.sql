-- Script para insertar datos de muestra en clientes, cotizaciones, reservaciones y convenios
-- Fecha: 2026-01-26

-- ============================================
-- INSERTAR CLIENTES DE MUESTRA
-- ============================================

INSERT INTO clientes (nombre, apellidopaterno, apellidomaterno, email, telefono, celular, direccion, tipo, fuente, notas, fechacreacion, fechamodificacion)
VALUES 
('Juan', 'García', 'López', 'juan.garcia@email.com', '8112345678', '8187654321', 'Av. Constitución 123, Monterrey', 'individual', 'web', 'Cliente frecuente, prefiere eventos corporativos', NOW(), NOW()),
('María', 'Rodríguez', 'Martínez', 'maria.rodriguez@empresa.com', '8123456789', '8198765432', 'Blvd. Díaz Ordaz 456, San Pedro', 'corporativo', 'referido', 'Empresa de tecnología, eventos trimestrales', NOW(), NOW()),
('Carlos', 'Hernández', 'Sánchez', 'carlos.hernandez@gmail.com', '8134567890', '8109876543', 'Calzada del Valle 789, Monterrey', 'individual', 'redes sociales', 'Eventos sociales, bodas y XV años', NOW(), NOW()),
('Ana', 'Martínez', 'Flores', 'ana.martinez@corporativo.mx', '8145678901', '8120987654', 'Av. Lázaro Cárdenas 321, Monterrey', 'corporativo', 'web', 'Cliente VIP, grandes eventos empresariales', NOW(), NOW()),
('Roberto', 'López', 'Ramírez', 'roberto.lopez@hotmail.com', '8156789012', '8131098765', 'Av. Morones Prieto 654, Monterrey', 'individual', 'publicidad', 'Eventos deportivos y recreativos', NOW(), NOW()),
('Laura', 'González', 'Ruiz', 'laura.gonzalez@gmail.com', '8167890123', '8142109876', 'Av. Constitución 987, San Nicolás', 'individual', 'referido', 'Cliente nuevo, interesada en bodas', NOW(), NOW()),
('Fernando', 'Díaz', 'Torres', 'fernando.diaz@empresa.com', '8178901234', '8153210987', 'Av. Constitución 147, Apodaca', 'corporativo', 'web', 'Eventos corporativos mensuales', NOW(), NOW()),
('Patricia', 'Morales', 'Castro', 'patricia.morales@yahoo.com', '8189012345', '8164321098', 'Blvd. Rogelio Cantú 258, San Pedro', 'individual', 'redes sociales', 'Eventos sociales pequeños', NOW(), NOW());

-- ============================================
-- INSERTAR COTIZACIONES DE MUESTRA
-- ============================================

-- Nota: Asumiendo que ya existen hoteles con ids 1-3, salones con ids 1-5, y montajes con ids 1-3

INSERT INTO cotizaciones (
    folio, nombreevento, hotelid, salonid, montajeid, clienteid,
    fechainicio, fechafin, horainicio, horafin, numeroinvitados,
    tipoevento, subtotal, impuestos, porcentajedescuento, montodescuento,
    totalmonto, estatus, validohasta, cotizadopor, fechacreacion, fechaactualizacion, activo
)
VALUES 
('HIPFE1', 'Conferencia Anual 2026', 1, 1, 1, 1, '2026-03-15', '2026-03-15', '09:00:00', '18:00:00', 150, 'corporativo', 45000.00, 7200.00, 10.00, 4500.00, 47700.00, 'cotizada', '2026-02-28', 1, NOW(), NOW(), true),
('HIPFE2', 'Boda Rodríguez - García', 1, 2, 2, 2, '2026-05-20', '2026-05-20', '19:00:00', '02:00:00', 200, 'social', 85000.00, 13600.00, 5.00, 4250.00, 94350.00, 'confirmada', '2026-04-15', 1, NOW(), NOW(), true),
('HIPFE3', 'XV Años Daniela', 1, 3, 3, 3, '2026-04-10', '2026-04-10', '20:00:00', '03:00:00', 120, 'social', 35000.00, 5600.00, 0.00, 0.00, 40600.00, 'cotizada', '2026-03-20', 1, NOW(), NOW(), true),
('HIPFE4', 'Capacitación Empresarial', 2, 1, 1, 4, '2026-06-05', '2026-06-06', '08:00:00', '17:00:00', 80, 'corporativo', 28000.00, 4480.00, 15.00, 4200.00, 28280.00, 'cancelada', '2026-05-15', 1, NOW(), NOW(), true),
('HIPFE5', 'Torneo de Golf', 2, 2, 2, 5, '2026-07-12', '2026-07-12', '07:00:00', '15:00:00', 60, 'deportivo', 22000.00, 3520.00, 8.00, 1760.00, 23760.00, 'cotizada', '2026-06-25', 1, NOW(), NOW(), true),
('HIPFE6', 'Reunión Anual Accionistas', 1, 1, 1, 4, '2026-08-18', '2026-08-18', '10:00:00', '16:00:00', 100, 'corporativo', 38000.00, 6080.00, 12.00, 4560.00, 39520.00, 'confirmada', '2026-07-30', 1, NOW(), NOW(), true),
('HIPFE7', 'Baby Shower Martínez', 2, 3, 3, 6, '2026-09-22', '2026-09-22', '15:00:00', '19:00:00', 50, 'social', 15000.00, 2400.00, 0.00, 0.00, 17400.00, 'cotizada', '2026-09-01', 1, NOW(), NOW(), true);

-- ============================================
-- INSERTAR RESERVACIONES DE MUESTRA (BOOKINGS)
-- ============================================

INSERT INTO reservaciones (
    folio, nombreevento, hotelid, salonid, montajeid, clienteid,
    fechainicio, fechafin, horainicio, horafin, numeroinvitados, adultos, menores, noches,
    subtotal, impuestos, totalmonto, montopagado, estatus, estatusdepago,
    solicitudesespeciales, notas, notasinternas, creadopor,
    fechacreacion, fechaactualizacion, fechaconfirmacion
)
VALUES 
('RESV-001', 'Conferencia Tech Summit', 1, 1, 1, 1, '2026-02-20', '2026-02-20', '09:00:00', '18:00:00', 150, 150, 0, 0, 45000.00, 7200.00, 52200.00, 26100.00, 'confirmada', 'parcial', 'Requiere proyector 4K y sonido premium', 'Cliente frecuente', 'Anticipo recibido', 1, NOW(), NOW(), NOW()),
('RESV-002', 'Boda González - Pérez', 1, 2, 2, 2, '2026-06-15', '2026-06-15', '19:00:00', '02:00:00', 200, 180, 20, 0, 85000.00, 13600.00, 98600.00, 98600.00, 'confirmada', 'pagado', 'Menú vegetariano para 15 personas, sillas tiffany', 'Decoración elegante', 'Todo pagado, revisar montaje especial', 1, NOW(), NOW(), NOW()),
('RESV-003', 'Evento Corporativo Q1', 2, 1, 1, 4, '2026-03-25', '2026-03-26', '08:00:00', '17:00:00', 80, 80, 0, 1, 28000.00, 4480.00, 32480.00, 32480.00, 'confirmada', 'pagado', 'Coffee break cada 2 horas', 'Cliente VIP', 'Requiere factura', 1, NOW(), NOW(), NOW()),
('RESV-004', 'XV Años Sofía', 1, 3, 3, 3, '2026-04-30', '2026-04-30', '20:00:00', '03:00:00', 120, 100, 20, 0, 35000.00, 5600.00, 40600.00, 10000.00, 'pendiente', 'parcial', 'Tema rosa y dorado', 'Primera celebración', 'Falta segundo pago', 1, NOW(), NOW(), NULL),
('RESV-005', 'Convención Médica', 2, 2, 1, 7, '2026-05-08', '2026-05-09', '08:00:00', '18:00:00', 100, 100, 0, 1, 42000.00, 6720.00, 48720.00, 15000.00, 'confirmada', 'parcial', 'Requiere micrófono inalámbrico y pantallas múltiples', 'Evento anual', 'Revisar requerimientos AV', 1, NOW(), NOW(), NOW()),
('RESV-006', 'Fiesta Corporativa Fin de Año', 1, 2, 2, 4, '2026-12-20', '2026-12-20', '20:00:00', '02:00:00', 180, 180, 0, 0, 65000.00, 10400.00, 75400.00, 0.00, 'pendiente', 'pendiente', 'Barra libre y DJ', 'Evento anual', 'Esperando anticipo', 1, NOW(), NOW(), NULL),
('RESV-007', 'Graduación Preparatoria', 2, 3, 3, 8, '2026-07-15', '2026-07-15', '18:00:00', '23:00:00', 90, 70, 20, 0, 25000.00, 4000.00, 29000.00, 29000.00, 'confirmada', 'pagado', 'Pantalla para proyección de fotos', 'Evento familiar', 'Todo listo', 1, NOW(), NOW(), NOW());

-- ============================================
-- INSERTAR CONVENIOS DE MUESTRA (AGREEMENTS)
-- ============================================

INSERT INTO convenios (
    company_name, agreement_code, hotel_id, client_id, contact_name, 
    contact_email, contact_phone, start_date, end_date,
    discount_percentage, special_rate, terms, notes, status,
    created_by, created_at, updated_at
)
VALUES 
('Grupo Empresarial del Norte', 'CONV-2026-001', 1, 4, 'Ana Martínez', 'ana.martinez@corporativo.mx', '8145678901', '2026-01-01', '2026-12-31', 15.00, NULL, 'Descuento del 15% en salones para eventos corporativos durante todo 2026. Válido de lunes a viernes.', 'Cliente VIP con eventos mensuales', 'activo', 1, NOW(), NOW()),
('Tech Innovators SA', 'CONV-2026-002', 1, 2, 'María Rodríguez', 'maria.rodriguez@empresa.com', '8123456789', '2026-02-01', '2027-01-31', 12.00, 8500.00, 'Tarifa especial de $8,500 por evento y 12% de descuento adicional en servicios. Mínimo 4 eventos al año.', 'Empresa tecnológica con eventos trimestrales', 'activo', 1, NOW(), NOW()),
('Asociación Médica Regional', 'CONV-2026-003', 2, 7, 'Fernando Díaz', 'fernando.diaz@empresa.com', '8178901234', '2026-03-01', '2026-09-30', 10.00, NULL, 'Descuento del 10% en salones para congresos y conferencias médicas. Incluye equipo audiovisual sin costo.', 'Convenios para eventos médicos y capacitaciones', 'activo', 1, NOW(), NOW()),
('Despacho Legal & Asociados', 'CONV-2025-004', 1, 1, 'Juan García', 'juan.garcia@email.com', '8112345678', '2025-06-01', '2026-05-31', 8.00, NULL, 'Descuento del 8% en salones de reuniones. Incluye servicio de café y snacks.', 'Convenio anual para reuniones de socios', 'vencido', 1, '2025-06-01', NOW()),
('Club Deportivo Monterrey', 'CONV-2026-005', 2, 5, 'Roberto López', 'roberto.lopez@hotmail.com', '8156789012', '2026-01-15', '2026-12-31', 20.00, 6000.00, 'Tarifa especial de $6,000 por evento deportivo con 20% de descuento en servicios de catering.', 'Eventos deportivos y torneos', 'activo', 1, NOW(), NOW()),
('Instituto Educativo Superior', 'CONV-2026-006', 1, 3, 'Carlos Hernández', 'carlos.hernandez@gmail.com', '8134567890', '2026-04-01', '2027-03-31', 18.00, NULL, 'Descuento del 18% para eventos educativos. Válido para graduaciones, conferencias y ceremonias.', 'Institución educativa con múltiples eventos anuales', 'pendiente', 1, NOW(), NOW());

-- ============================================
-- ACTUALIZAR SECUENCIAS (si es necesario)
-- ============================================

-- Actualizar la secuencia de clientes
SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes));

-- Actualizar la secuencia de cotizaciones
SELECT setval('cotizaciones_id_seq', (SELECT MAX(id) FROM cotizaciones));

-- Actualizar la secuencia de reservaciones
SELECT setval('reservaciones_id_seq', (SELECT MAX(id) FROM reservaciones));

-- Actualizar la secuencia de convenios
SELECT setval('convenios_id_seq', (SELECT MAX(id) FROM convenios));

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Datos de muestra insertados exitosamente:';
    RAISE NOTICE '- % clientes', (SELECT COUNT(*) FROM clientes);
    RAISE NOTICE '- % cotizaciones', (SELECT COUNT(*) FROM cotizaciones);
    RAISE NOTICE '- % reservaciones', (SELECT COUNT(*) FROM reservaciones);
    RAISE NOTICE '- % convenios', (SELECT COUNT(*) FROM convenios);
END $$;
