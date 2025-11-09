-- =====================================================
-- MIGRACIÓN: Agregar campo tipo_profesional
-- =====================================================
-- Este script agrega el campo tipo_profesional a la tabla fichas_clinicas
-- para almacenar qué tipo de profesional atiende (kinesiologo o acupunturista)
-- =====================================================

-- Agregar columna tipo_profesional si no existe
ALTER TABLE public.fichas_clinicas
ADD COLUMN IF NOT EXISTS tipo_profesional TEXT
CHECK (tipo_profesional IN ('kinesiologo', 'acupunturista'));

-- Comentario explicativo
COMMENT ON COLUMN public.fichas_clinicas.tipo_profesional IS
'Tipo de profesional que atiende: kinesiologo o acupunturista';

-- Crear índice para búsquedas rápidas por tipo de profesional
CREATE INDEX IF NOT EXISTS idx_fichas_tipo_profesional
ON public.fichas_clinicas(tipo_profesional);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Campo tipo_profesional agregado exitosamente a fichas_clinicas';
END $$;
