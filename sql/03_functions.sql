-- =====================================================
-- FICHA CLÍNICA - FUNCIONES Y TRIGGERS ÚTILES
-- =====================================================
-- Este archivo crea funciones útiles para el sistema
-- Ejecutar en: Supabase SQL Editor (DESPUÉS de 02_rls_policies.sql)
-- =====================================================

-- =====================================================
-- FUNCIÓN: get_fichas_with_stats
-- Obtiene fichas con estadísticas de sesiones
-- =====================================================

CREATE OR REPLACE FUNCTION get_fichas_with_stats(terapeuta_uuid UUID)
RETURNS TABLE (
    id UUID,
    nombre_paciente TEXT,
    motivo_consulta TEXT,
    created_at TIMESTAMPTZ,
    estado TEXT,
    total_sesiones BIGINT,
    ultima_sesion TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.nombre_paciente,
        f.motivo_consulta,
        f.created_at,
        f.estado,
        COUNT(s.id) as total_sesiones,
        MAX(s.fecha_sesion) as ultima_sesion
    FROM public.fichas_clinicas f
    LEFT JOIN public.sesiones_tratamiento s ON f.id = s.ficha_id
    WHERE f.terapeuta_id = terapeuta_uuid
    GROUP BY f.id, f.nombre_paciente, f.motivo_consulta, f.created_at, f.estado
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: search_fichas
-- Búsqueda de fichas por nombre o motivo de consulta
-- =====================================================

CREATE OR REPLACE FUNCTION search_fichas(
    terapeuta_uuid UUID,
    search_term TEXT
)
RETURNS TABLE (
    id UUID,
    nombre_paciente TEXT,
    motivo_consulta TEXT,
    created_at TIMESTAMPTZ,
    estado TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.nombre_paciente,
        f.motivo_consulta,
        f.created_at,
        f.estado
    FROM public.fichas_clinicas f
    WHERE f.terapeuta_id = terapeuta_uuid
    AND (
        f.nombre_paciente ILIKE '%' || search_term || '%'
        OR f.motivo_consulta ILIKE '%' || search_term || '%'
    )
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: get_ficha_completa
-- Obtiene una ficha con todas sus sesiones
-- =====================================================

CREATE OR REPLACE FUNCTION get_ficha_completa(ficha_uuid UUID, terapeuta_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'ficha', row_to_json(f.*),
        'sesiones', COALESCE(
            (SELECT json_agg(row_to_json(s.*))
             FROM public.sesiones_tratamiento s
             WHERE s.ficha_id = ficha_uuid
             ORDER BY s.fecha_sesion DESC),
            '[]'::json
        )
    )
    INTO result
    FROM public.fichas_clinicas f
    WHERE f.id = ficha_uuid
    AND f.terapeuta_id = terapeuta_uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: create_sesion_from_ficha
-- Crea una nueva sesión automáticamente desde una ficha
-- =====================================================

CREATE OR REPLACE FUNCTION create_sesion_from_ficha(
    ficha_uuid UUID,
    evolucion_text TEXT,
    puntos_array TEXT[],
    tecnicas_array TEXT[],
    duracion INT,
    observaciones_text TEXT DEFAULT NULL,
    proxima_cita_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_sesion_id UUID;
    next_numero INT;
    terapeuta_uuid UUID;
BEGIN
    -- Obtener el terapeuta_id y calcular el número de sesión
    SELECT
        f.terapeuta_id,
        COALESCE(MAX(s.numero_sesion), 0) + 1
    INTO terapeuta_uuid, next_numero
    FROM public.fichas_clinicas f
    LEFT JOIN public.sesiones_tratamiento s ON f.id = s.ficha_id
    WHERE f.id = ficha_uuid
    GROUP BY f.terapeuta_id;

    -- Verificar que el terapeuta actual es el dueño
    IF terapeuta_uuid != auth.uid() THEN
        RAISE EXCEPTION 'No autorizado para crear sesión en esta ficha';
    END IF;

    -- Crear la sesión
    INSERT INTO public.sesiones_tratamiento (
        ficha_id,
        terapeuta_id,
        numero_sesion,
        evolucion,
        puntos_utilizados,
        tecnicas_aplicadas,
        duracion_minutos,
        observaciones,
        proxima_cita
    ) VALUES (
        ficha_uuid,
        terapeuta_uuid,
        next_numero,
        evolucion_text,
        puntos_array,
        tecnicas_array,
        duracion,
        observaciones_text,
        proxima_cita_date
    )
    RETURNING id INTO new_sesion_id;

    RETURN new_sesion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: get_dashboard_stats
-- Obtiene estadísticas generales para el dashboard
-- =====================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(terapeuta_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_fichas', (
            SELECT COUNT(*)
            FROM public.fichas_clinicas
            WHERE terapeuta_id = terapeuta_uuid
            AND estado = 'activo'
        ),
        'fichas_mes_actual', (
            SELECT COUNT(*)
            FROM public.fichas_clinicas
            WHERE terapeuta_id = terapeuta_uuid
            AND created_at >= date_trunc('month', CURRENT_DATE)
        ),
        'sesiones_mes_actual', (
            SELECT COUNT(*)
            FROM public.sesiones_tratamiento
            WHERE terapeuta_id = terapeuta_uuid
            AND fecha_sesion >= date_trunc('month', CURRENT_DATE)
        ),
        'pacientes_nuevos_semana', (
            SELECT COUNT(*)
            FROM public.fichas_clinicas
            WHERE terapeuta_id = terapeuta_uuid
            AND es_primera_consulta = TRUE
            AND created_at >= date_trunc('week', CURRENT_DATE)
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: duplicate_ficha
-- Duplica una ficha para una nueva sesión (útil para seguimiento)
-- =====================================================

CREATE OR REPLACE FUNCTION duplicate_ficha(
    original_ficha_uuid UUID,
    nuevo_motivo TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_ficha_id UUID;
    original_ficha RECORD;
BEGIN
    -- Obtener la ficha original
    SELECT * INTO original_ficha
    FROM public.fichas_clinicas
    WHERE id = original_ficha_uuid
    AND terapeuta_id = auth.uid();

    -- Verificar que existe
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ficha no encontrada o no autorizado';
    END IF;

    -- Crear nueva ficha con datos similares
    INSERT INTO public.fichas_clinicas (
        terapeuta_id,
        nombre_paciente,
        edad,
        telefono,
        email,
        ocupacion,
        motivo_consulta,
        datos_mtc,
        sintomas_generales,
        datos_dolor,
        es_primera_consulta,
        numero_sesion
    ) VALUES (
        auth.uid(),
        original_ficha.nombre_paciente,
        original_ficha.edad,
        original_ficha.telefono,
        original_ficha.email,
        original_ficha.ocupacion,
        COALESCE(nuevo_motivo, original_ficha.motivo_consulta),
        original_ficha.datos_mtc,
        original_ficha.sintomas_generales,
        original_ficha.datos_dolor,
        FALSE,
        original_ficha.numero_sesion + 1
    )
    RETURNING id INTO new_ficha_id;

    RETURN new_ficha_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: auto_archive_old_fichas
-- Archiva automáticamente fichas sin actividad por más de 1 año
-- =====================================================

CREATE OR REPLACE FUNCTION auto_archive_old_fichas()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.fichas_clinicas
    SET estado = 'archivado'
    WHERE estado = 'activo'
    AND updated_at < NOW() - INTERVAL '1 year'
    AND NOT EXISTS (
        SELECT 1
        FROM public.sesiones_tratamiento
        WHERE ficha_id = fichas_clinicas.id
        AND fecha_sesion > NOW() - INTERVAL '1 year'
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta diariamente (requiere pg_cron extension en Supabase Pro)
-- Para Supabase Free, puedes llamar esta función manualmente o desde un Edge Function
-- CREATE TRIGGER trigger_auto_archive
-- AFTER INSERT ON public.fichas_clinicas
-- FOR EACH STATEMENT
-- EXECUTE FUNCTION auto_archive_old_fichas();

-- =====================================================
-- GRANTS PARA FUNCIONES
-- =====================================================

GRANT EXECUTE ON FUNCTION get_fichas_with_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_fichas(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ficha_completa(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_sesion_from_ficha(UUID, TEXT, TEXT[], TEXT[], INT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION duplicate_ficha(UUID, TEXT) TO authenticated;

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '===================================';
    RAISE NOTICE 'Funciones creadas exitosamente!';
    RAISE NOTICE '===================================';
    RAISE NOTICE 'Funciones disponibles:';
    RAISE NOTICE '  ✓ get_fichas_with_stats()';
    RAISE NOTICE '  ✓ search_fichas()';
    RAISE NOTICE '  ✓ get_ficha_completa()';
    RAISE NOTICE '  ✓ create_sesion_from_ficha()';
    RAISE NOTICE '  ✓ get_dashboard_stats()';
    RAISE NOTICE '  ✓ duplicate_ficha()';
    RAISE NOTICE '';
    RAISE NOTICE '¡Base de datos lista para usar!';
    RAISE NOTICE '===================================';
END $$;
