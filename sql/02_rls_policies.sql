-- =====================================================
-- FICHA CLÍNICA - ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Este archivo configura las políticas de seguridad a nivel de fila
-- Garantiza que los terapeutas solo vean sus propias fichas
-- Ejecutar en: Supabase SQL Editor (DESPUÉS de 01_create_tables.sql)
-- =====================================================

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE public.fichas_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_tratamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA: fichas_clinicas
-- =====================================================

-- Política: Los terapeutas pueden ver solo SUS fichas
CREATE POLICY "Terapeutas pueden ver sus propias fichas"
ON public.fichas_clinicas
FOR SELECT
USING (auth.uid() = terapeuta_id);

-- Política: Los terapeutas pueden crear fichas
CREATE POLICY "Terapeutas pueden crear fichas"
ON public.fichas_clinicas
FOR INSERT
WITH CHECK (auth.uid() = terapeuta_id);

-- Política: Los terapeutas pueden actualizar solo SUS fichas
CREATE POLICY "Terapeutas pueden actualizar sus propias fichas"
ON public.fichas_clinicas
FOR UPDATE
USING (auth.uid() = terapeuta_id)
WITH CHECK (auth.uid() = terapeuta_id);

-- Política: Los terapeutas pueden eliminar solo SUS fichas
CREATE POLICY "Terapeutas pueden eliminar sus propias fichas"
ON public.fichas_clinicas
FOR DELETE
USING (auth.uid() = terapeuta_id);

-- =====================================================
-- POLÍTICAS PARA: sesiones_tratamiento
-- =====================================================

-- Política: Ver sesiones de sus propias fichas
CREATE POLICY "Terapeutas pueden ver sesiones de sus fichas"
ON public.sesiones_tratamiento
FOR SELECT
USING (
    auth.uid() = terapeuta_id
    OR EXISTS (
        SELECT 1 FROM public.fichas_clinicas
        WHERE fichas_clinicas.id = sesiones_tratamiento.ficha_id
        AND fichas_clinicas.terapeuta_id = auth.uid()
    )
);

-- Política: Crear sesiones para sus fichas
CREATE POLICY "Terapeutas pueden crear sesiones para sus fichas"
ON public.sesiones_tratamiento
FOR INSERT
WITH CHECK (
    auth.uid() = terapeuta_id
    AND EXISTS (
        SELECT 1 FROM public.fichas_clinicas
        WHERE fichas_clinicas.id = sesiones_tratamiento.ficha_id
        AND fichas_clinicas.terapeuta_id = auth.uid()
    )
);

-- Política: Actualizar sesiones de sus fichas
CREATE POLICY "Terapeutas pueden actualizar sesiones de sus fichas"
ON public.sesiones_tratamiento
FOR UPDATE
USING (auth.uid() = terapeuta_id)
WITH CHECK (auth.uid() = terapeuta_id);

-- Política: Eliminar sesiones de sus fichas
CREATE POLICY "Terapeutas pueden eliminar sesiones de sus fichas"
ON public.sesiones_tratamiento
FOR DELETE
USING (auth.uid() = terapeuta_id);

-- =====================================================
-- POLÍTICAS PARA: pacientes
-- =====================================================

-- Política: Los terapeutas pueden ver solo SUS pacientes
CREATE POLICY "Terapeutas pueden ver sus propios pacientes"
ON public.pacientes
FOR SELECT
USING (auth.uid() = terapeuta_id);

-- Política: Los terapeutas pueden crear pacientes
CREATE POLICY "Terapeutas pueden crear pacientes"
ON public.pacientes
FOR INSERT
WITH CHECK (auth.uid() = terapeuta_id);

-- Política: Los terapeutas pueden actualizar solo SUS pacientes
CREATE POLICY "Terapeutas pueden actualizar sus propios pacientes"
ON public.pacientes
FOR UPDATE
USING (auth.uid() = terapeuta_id)
WITH CHECK (auth.uid() = terapeuta_id);

-- Política: Los terapeutas pueden eliminar solo SUS pacientes
CREATE POLICY "Terapeutas pueden eliminar sus propios pacientes"
ON public.pacientes
FOR DELETE
USING (auth.uid() = terapeuta_id);

-- =====================================================
-- POLÍTICAS ESPECIALES PARA ADMINISTRADORES (OPCIONAL)
-- =====================================================

-- Si deseas que ciertos usuarios tengan acceso total (ej: administradores),
-- puedes crear políticas adicionales basadas en un campo is_admin en la tabla de usuarios
-- o usando metadata de Supabase Auth

-- Ejemplo (comentado por defecto):
/*
CREATE POLICY "Administradores tienen acceso total a fichas"
ON public.fichas_clinicas
FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
*/

-- =====================================================
-- GRANTS DE PERMISOS
-- =====================================================

-- Asegurar que los usuarios autenticados tengan permisos en las tablas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fichas_clinicas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sesiones_tratamiento TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pacientes TO authenticated;

-- Permisos para usuarios anónimos (solo si usas auth anónima - NO RECOMENDADO para producción)
-- GRANT SELECT ON public.fichas_clinicas TO anon;

-- =====================================================
-- VERIFICACIÓN DE POLÍTICAS
-- =====================================================

-- Para verificar que las políticas están activas, ejecuta:
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '===================================';
    RAISE NOTICE 'RLS Policies configuradas exitosamente!';
    RAISE NOTICE '===================================';
    RAISE NOTICE 'Tablas protegidas:';
    RAISE NOTICE '  - fichas_clinicas';
    RAISE NOTICE '  - sesiones_tratamiento';
    RAISE NOTICE '  - pacientes';
    RAISE NOTICE '';
    RAISE NOTICE 'Siguiente paso: Ejecutar 03_functions.sql';
    RAISE NOTICE '===================================';
END $$;
