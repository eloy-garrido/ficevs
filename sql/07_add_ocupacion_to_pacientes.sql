-- =====================================================
-- MIGRACIÓN: Agregar campo ocupacion a tabla pacientes
-- =====================================================
-- Este script agrega el campo ocupacion a la tabla pacientes
-- para almacenar la ocupación del paciente
-- =====================================================

-- Agregar columna ocupacion si no existe
ALTER TABLE public.pacientes
ADD COLUMN IF NOT EXISTS ocupacion TEXT;

-- Comentario explicativo
COMMENT ON COLUMN public.pacientes.ocupacion IS
'Ocupación o profesión del paciente';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Campo ocupacion agregado exitosamente a tabla pacientes';
END $$;
