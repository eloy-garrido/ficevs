-- =====================================================
-- FICHA CLÍNICA - CREACIÓN COMPLETA DE TABLAS
-- =====================================================
-- Este archivo crea TODAS las tablas con TODOS los campos necesarios
-- Incluye campos base + campos extendidos (RUT, fecha_nacimiento, etc.)
-- Ejecutar en: Supabase SQL Editor
-- =====================================================

-- Habilitar la extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: fichas_clinicas
-- Almacena las fichas clínicas completas de los pacientes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.fichas_clinicas (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    terapeuta_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Metadatos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Datos del Paciente (Paso 1) - CAMPOS BASE
    nombre_paciente TEXT NOT NULL,
    edad INTEGER,
    telefono TEXT,
    email TEXT,
    ocupacion TEXT,
    motivo_consulta TEXT NOT NULL,

    -- Datos del Paciente (Paso 1) - CAMPOS EXTENDIDOS
    rut TEXT,                                    -- RUT del paciente (formato: 12.345.678-9)
    fecha_nacimiento DATE,                       -- Fecha de nacimiento
    direccion TEXT,                              -- Dirección completa
    fecha_ingreso DATE DEFAULT CURRENT_DATE,     -- Fecha de registro/ingreso

    -- Datos de Medicina Tradicional China (Paso 2)
    -- Almacenamiento JSONB para flexibilidad
    datos_mtc JSONB DEFAULT '{}'::jsonb,
    -- Estructura esperada:
    -- {
    --   "lengua": {
    --     "color": "string",
    --     "saburra": "string",
    --     "forma": "string",
    --     "observaciones": "string"
    --   },
    --   "pulso": {
    --     "profundidad": "string",
    --     "velocidad": "string",
    --     "fuerza": "string",
    --     "calidad": "string",
    --     "observaciones": "string"
    --   }
    -- }

    -- Síntomas Generales (Paso 3)
    sintomas_generales JSONB DEFAULT '{}'::jsonb,
    -- Estructura esperada:
    -- {
    --   "sintomas": ["dolor_cabeza", "insomnio", ...],
    --   "emociones": ["ansiedad", "irritabilidad", ...],
    --   "digestivos": ["estreñimiento", "gastritis", ...],
    --   "menstruales": ["irregularidad", "dolor", ...],
    --   "otros": "texto libre"
    -- }

    -- Datos del Dolor (Paso 4)
    datos_dolor JSONB DEFAULT '{}'::jsonb,
    -- Estructura esperada:
    -- {
    --   "ubicaciones": ["lumbar", "cervical", ...],
    --   "tipo": ["punzante", "sordo", ...],
    --   "intensidad": 1-10,
    --   "frecuencia": "string",
    --   "factores_alivio": "string",
    --   "factores_agravacion": "string"
    -- }

    -- Diagnóstico y Plan (Paso 5)
    diagnostico_terapeuta TEXT,
    plan_tratamiento TEXT,
    puntos_acupuntura TEXT[],
    tecnicas_aplicadas TEXT[],
    recomendaciones TEXT,

    -- Consentimiento
    consentimiento_aceptado BOOLEAN DEFAULT FALSE,
    fecha_consentimiento TIMESTAMPTZ,

    -- Sesiones de seguimiento
    numero_sesion INTEGER DEFAULT 1,
    es_primera_consulta BOOLEAN DEFAULT TRUE,

    -- Estado
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'archivado', 'cancelado'))
);

-- =====================================================
-- TABLA: sesiones_tratamiento
-- Almacena el historial de sesiones de tratamiento
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sesiones_tratamiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ficha_id UUID NOT NULL REFERENCES public.fichas_clinicas(id) ON DELETE CASCADE,
    terapeuta_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    fecha_sesion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    numero_sesion INTEGER NOT NULL,

    -- Datos de la sesión
    evolucion TEXT,
    puntos_utilizados TEXT[],
    tecnicas_aplicadas TEXT[],
    duracion_minutos INTEGER,

    -- Observaciones
    observaciones TEXT,
    proxima_cita TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: pacientes (Opcional - para gestión futura)
-- Almacena información básica de pacientes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    terapeuta_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    nombre_completo TEXT NOT NULL,
    fecha_nacimiento DATE,
    telefono TEXT,
    email TEXT,
    direccion TEXT,

    -- Datos médicos básicos
    alergias TEXT,
    medicamentos_actuales TEXT,
    condiciones_medicas TEXT,

    -- Metadatos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Índice único para evitar duplicados
    UNIQUE(terapeuta_id, email)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- =====================================================

-- Índice para búsquedas por terapeuta
CREATE INDEX IF NOT EXISTS idx_fichas_terapeuta
ON public.fichas_clinicas(terapeuta_id);

-- Índice para búsquedas por fecha de creación
CREATE INDEX IF NOT EXISTS idx_fichas_created_at
ON public.fichas_clinicas(created_at DESC);

-- Índice para búsquedas por nombre de paciente
CREATE INDEX IF NOT EXISTS idx_fichas_nombre_paciente
ON public.fichas_clinicas(nombre_paciente);

-- Índice para búsqueda por RUT
CREATE INDEX IF NOT EXISTS idx_fichas_rut
ON public.fichas_clinicas(rut);

-- Índice para búsqueda por fecha de ingreso
CREATE INDEX IF NOT EXISTS idx_fichas_fecha_ingreso
ON public.fichas_clinicas(fecha_ingreso DESC);

-- Índice GIN para búsquedas en campos JSONB
CREATE INDEX IF NOT EXISTS idx_fichas_datos_mtc
ON public.fichas_clinicas USING GIN(datos_mtc);

CREATE INDEX IF NOT EXISTS idx_fichas_sintomas
ON public.fichas_clinicas USING GIN(sintomas_generales);

CREATE INDEX IF NOT EXISTS idx_fichas_dolor
ON public.fichas_clinicas USING GIN(datos_dolor);

-- Índices para sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_ficha
ON public.sesiones_tratamiento(ficha_id);

CREATE INDEX IF NOT EXISTS idx_sesiones_fecha
ON public.sesiones_tratamiento(fecha_sesion DESC);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para fichas_clinicas
CREATE TRIGGER update_fichas_clinicas_updated_at
    BEFORE UPDATE ON public.fichas_clinicas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para pacientes
CREATE TRIGGER update_pacientes_updated_at
    BEFORE UPDATE ON public.pacientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN PARA CALCULAR EDAD
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
-- COMENTARIOS EN LAS TABLAS (DOCUMENTACIÓN)
-- =====================================================

COMMENT ON TABLE public.fichas_clinicas IS 'Almacena las fichas clínicas completas de acupuntura con todos los campos necesarios';
COMMENT ON TABLE public.sesiones_tratamiento IS 'Historial de sesiones de tratamiento por ficha';
COMMENT ON TABLE public.pacientes IS 'Información básica de pacientes registrados';

COMMENT ON COLUMN public.fichas_clinicas.datos_mtc IS 'Datos de diagnóstico MTC: lengua y pulso en formato JSONB';
COMMENT ON COLUMN public.fichas_clinicas.sintomas_generales IS 'Síntomas generales y emocionales en formato JSONB';
COMMENT ON COLUMN public.fichas_clinicas.datos_dolor IS 'Información detallada del dolor en formato JSONB';
COMMENT ON COLUMN public.fichas_clinicas.rut IS 'RUT del paciente (formato: 12.345.678-9)';
COMMENT ON COLUMN public.fichas_clinicas.fecha_nacimiento IS 'Fecha de nacimiento del paciente';
COMMENT ON COLUMN public.fichas_clinicas.direccion IS 'Dirección completa del paciente';
COMMENT ON COLUMN public.fichas_clinicas.fecha_ingreso IS 'Fecha de ingreso/registro al sistema';

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ TABLAS CREADAS EXITOSAMENTE';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '  ✓ fichas_clinicas (con TODOS los campos)';
    RAISE NOTICE '  ✓ sesiones_tratamiento';
    RAISE NOTICE '  ✓ pacientes';
    RAISE NOTICE '';
    RAISE NOTICE 'Campos incluidos en fichas_clinicas:';
    RAISE NOTICE '  ✓ Campos base: nombre, edad, teléfono, email, ocupación';
    RAISE NOTICE '  ✓ Campos extendidos: RUT, fecha_nacimiento, dirección, fecha_ingreso';
    RAISE NOTICE '  ✓ Campos JSONB: datos_mtc, sintomas_generales, datos_dolor';
    RAISE NOTICE '';
    RAISE NOTICE 'Siguiente paso:';
    RAISE NOTICE '  → Ejecutar: 02_rls_policies.sql';
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
END $$;
