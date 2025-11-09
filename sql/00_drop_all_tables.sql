-- =====================================================
-- SCRIPT DE LIMPIEZA - BORRAR TODAS LAS TABLAS
-- =====================================================
-- ⚠️  ADVERTENCIA: Este script borra TODAS las tablas y datos
-- Solo usar si quieres empezar desde cero
-- Ejecutar en: Supabase SQL Editor
-- =====================================================

-- Desactivar triggers temporalmente para evitar errores
SET session_replication_role = 'replica';

-- =====================================================
-- BORRAR VISTAS
-- =====================================================
DROP VIEW IF EXISTS fichas_con_edad CASCADE;

-- =====================================================
-- BORRAR FUNCIONES
-- =====================================================
DROP FUNCTION IF EXISTS calcular_edad(DATE) CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_fichas_with_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS search_fichas(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- BORRAR TABLAS EN ORDEN INVERSO (por dependencias)
-- =====================================================
DROP TABLE IF EXISTS public.sesiones_tratamiento CASCADE;
DROP TABLE IF EXISTS public.fichas_clinicas CASCADE;
DROP TABLE IF EXISTS public.pacientes CASCADE;

-- Reactivar triggers
SET session_replication_role = 'origin';

-- =====================================================
-- CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ TODAS LAS TABLAS HAN SIDO ELIMINADAS';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Siguiente paso:';
    RAISE NOTICE '  1. Ejecutar: 01_create_all_tables.sql';
    RAISE NOTICE '  2. Ejecutar: 02_rls_policies.sql';
    RAISE NOTICE '  3. Ejecutar: 03_functions.sql';
    RAISE NOTICE '  4. Ejecutar: 04_create_admin_user.sql';
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
END $$;
