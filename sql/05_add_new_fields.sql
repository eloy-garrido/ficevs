-- =====================================================
-- MIGRACIÓN: AGREGAR NUEVOS CAMPOS
-- =====================================================
-- Este archivo agrega los nuevos campos al sistema
-- Ejecutar en: Supabase SQL Editor (DESPUÉS de 04_create_admin_user.sql)
-- =====================================================

-- =====================================================
-- AGREGAR NUEVOS CAMPOS A LA TABLA fichas_clinicas
-- =====================================================

-- RUT del paciente
ALTER TABLE public.fichas_clinicas
ADD COLUMN IF NOT EXISTS rut TEXT;

-- Fecha de nacimiento del paciente
ALTER TABLE public.fichas_clinicas
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

-- Dirección del paciente
ALTER TABLE public.fichas_clinicas
ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Fecha de ingreso (para registro histórico)
ALTER TABLE public.fichas_clinicas
ADD COLUMN IF NOT EXISTS fecha_ingreso DATE DEFAULT CURRENT_DATE;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice para búsqueda por RUT
CREATE INDEX IF NOT EXISTS idx_fichas_rut
ON public.fichas_clinicas(rut);

-- Índice para búsqueda por fecha de ingreso
CREATE INDEX IF NOT EXISTS idx_fichas_fecha_ingreso
ON public.fichas_clinicas(fecha_ingreso DESC);

-- =====================================================
-- AGREGAR CONSTRAINT DE RUT ÚNICO POR TERAPEUTA
-- =====================================================

-- Esto evita que un terapeuta tenga múltiples fichas con el mismo RUT
-- (Opcional: comentar si quieres permitir múltiples fichas por paciente)

-- ALTER TABLE public.fichas_clinicas
-- ADD CONSTRAINT unique_rut_per_terapeuta
-- UNIQUE (terapeuta_id, rut);

-- =====================================================
-- FUNCIÓN PARA CALCULAR EDAD DESDE FECHA DE NACIMIENTO
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_edad(fecha_nac DATE)
RETURNS INTEGER AS $$
DECLARE
    edad INTEGER;
BEGIN
    IF fecha_nac IS NULL THEN
        RETURN NULL;
    END IF;

    edad := DATE_PART('year', AGE(fecha_nac));

    RETURN edad;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- VISTA PARA FICHAS CON EDAD CALCULADA
-- =====================================================

CREATE OR REPLACE VIEW fichas_con_edad AS
SELECT
    f.*,
    calcular_edad(f.fecha_nacimiento) as edad_calculada
FROM public.fichas_clinicas f;

-- =====================================================
-- COMENTARIOS EN LAS NUEVAS COLUMNAS
-- =====================================================

COMMENT ON COLUMN public.fichas_clinicas.rut IS 'RUT del paciente (formato: 12.345.678-9)';
COMMENT ON COLUMN public.fichas_clinicas.fecha_nacimiento IS 'Fecha de nacimiento del paciente';
COMMENT ON COLUMN public.fichas_clinicas.direccion IS 'Dirección completa del paciente';
COMMENT ON COLUMN public.fichas_clinicas.fecha_ingreso IS 'Fecha de ingreso/registro al sistema';

-- =====================================================
-- ACTUALIZAR FUNCIÓN get_fichas_with_stats
-- =====================================================

-- Actualizar la función para incluir los nuevos campos
CREATE OR REPLACE FUNCTION get_fichas_with_stats(terapeuta_uuid UUID)
RETURNS TABLE (
    id UUID,
    nombre_paciente TEXT,
    rut TEXT,
    edad INTEGER,
    fecha_nacimiento DATE,
    motivo_consulta TEXT,
    created_at TIMESTAMPTZ,
    fecha_ingreso DATE,
    estado TEXT,
    total_sesiones BIGINT,
    ultima_sesion TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.nombre_paciente,
        f.rut,
        f.edad,
        f.fecha_nacimiento,
        f.motivo_consulta,
        f.created_at,
        f.fecha_ingreso,
        f.estado,
        COUNT(s.id) as total_sesiones,
        MAX(s.fecha_sesion) as ultima_sesion
    FROM public.fichas_clinicas f
    LEFT JOIN public.sesiones_tratamiento s ON f.id = s.ficha_id
    WHERE f.terapeuta_id = terapeuta_uuid
    GROUP BY f.id, f.nombre_paciente, f.rut, f.edad, f.fecha_nacimiento,
             f.motivo_consulta, f.created_at, f.fecha_ingreso, f.estado
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ACTUALIZAR FUNCIÓN search_fichas
-- =====================================================

-- Actualizar la función de búsqueda para incluir RUT
CREATE OR REPLACE FUNCTION search_fichas(
    terapeuta_uuid UUID,
    search_term TEXT
)
RETURNS TABLE (
    id UUID,
    nombre_paciente TEXT,
    rut TEXT,
    motivo_consulta TEXT,
    created_at TIMESTAMPTZ,
    estado TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.nombre_paciente,
        f.rut,
        f.motivo_consulta,
        f.created_at,
        f.estado
    FROM public.fichas_clinicas f
    WHERE f.terapeuta_id = terapeuta_uuid
    AND (
        f.nombre_paciente ILIKE '%' || search_term || '%'
        OR f.motivo_consulta ILIKE '%' || search_term || '%'
        OR f.rut ILIKE '%' || search_term || '%'
    )
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver la estructura actualizada de la tabla
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'fichas_clinicas'
ORDER BY ordinal_position;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Si quieres agregar datos de ejemplo para testing:
/*
INSERT INTO public.fichas_clinicas (
    terapeuta_id,
    nombre_paciente,
    rut,
    fecha_nacimiento,
    edad,
    telefono,
    email,
    direccion,
    ocupacion,
    motivo_consulta,
    fecha_ingreso,
    consentimiento_aceptado,
    estado
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
    'Juan Pérez González',
    '12.345.678-9',
    '1985-03-15',
    38,
    '+569 87654321',
    'juan@ejemplo.com',
    'Av. Providencia 123, Depto. 45, Providencia, Santiago',
    'Ingeniero Civil',
    'Dolor lumbar crónico hace 3 meses',
    CURRENT_DATE,
    true,
    'activo'
);
*/

-- =====================================================
-- ROLLBACK (SI ES NECESARIO)
-- =====================================================

-- Si necesitas revertir los cambios:
/*
ALTER TABLE public.fichas_clinicas DROP COLUMN IF EXISTS rut;
ALTER TABLE public.fichas_clinicas DROP COLUMN IF EXISTS fecha_nacimiento;
ALTER TABLE public.fichas_clinicas DROP COLUMN IF EXISTS direccion;
ALTER TABLE public.fichas_clinicas DROP COLUMN IF EXISTS fecha_ingreso;

DROP INDEX IF EXISTS idx_fichas_rut;
DROP INDEX IF EXISTS idx_fichas_fecha_ingreso;

DROP FUNCTION IF EXISTS calcular_edad(DATE);
DROP VIEW IF EXISTS fichas_con_edad;
*/

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '===================================';
    RAISE NOTICE 'Migración completada exitosamente!';
    RAISE NOTICE '===================================';
    RAISE NOTICE 'Nuevos campos agregados:';
    RAISE NOTICE '  ✓ rut (TEXT)';
    RAISE NOTICE '  ✓ fecha_nacimiento (DATE)';
    RAISE NOTICE '  ✓ direccion (TEXT)';
    RAISE NOTICE '  ✓ fecha_ingreso (DATE)';
    RAISE NOTICE '';
    RAISE NOTICE 'Funciones actualizadas:';
    RAISE NOTICE '  ✓ get_fichas_with_stats()';
    RAISE NOTICE '  ✓ search_fichas()';
    RAISE NOTICE '  ✓ calcular_edad() [NUEVA]';
    RAISE NOTICE '';
    RAISE NOTICE 'Vista creada:';
    RAISE NOTICE '  ✓ fichas_con_edad';
    RAISE NOTICE '===================================';
END $$;
