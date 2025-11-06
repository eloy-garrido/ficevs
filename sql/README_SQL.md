# 📊 Configuración de Base de Datos Supabase

Esta carpeta contiene todos los archivos SQL necesarios para configurar la base de datos del sistema de Ficha Clínica de Acupuntura.

## 🚀 Orden de Ejecución

**IMPORTANTE**: Ejecuta los archivos en este orden exacto:

1. ✅ `01_create_tables.sql` - Crea las tablas principales
2. ✅ `02_rls_policies.sql` - Configura las políticas de seguridad (RLS)
3. ✅ `03_functions.sql` - Crea funciones útiles

## 📝 Cómo Ejecutar en Supabase

### Método 1: SQL Editor (Recomendado)

1. **Accede a tu proyecto de Supabase**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto: `hqbysakupbqwdfyprzya`

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New query"

3. **Ejecuta cada archivo en orden**
   - Copia el contenido de `01_create_tables.sql`
   - Pégalo en el editor
   - Haz clic en "Run" o presiona `Ctrl + Enter`
   - Espera el mensaje de confirmación
   - Repite con `02_rls_policies.sql` y luego `03_functions.sql`

### Método 2: Supabase CLI (Avanzado)

```bash
# Asegúrate de tener instalado Supabase CLI
npm install -g supabase

# Login
supabase login

# Ejecuta los archivos
supabase db execute --file sql/01_create_tables.sql
supabase db execute --file sql/02_rls_policies.sql
supabase db execute --file sql/03_functions.sql
```

## 📊 Estructura de Tablas Creadas

### 1. `fichas_clinicas`
Tabla principal que almacena las fichas clínicas completas.

**Campos principales:**
- `id` - UUID único
- `terapeuta_id` - Referencia al usuario autenticado
- `nombre_paciente` - Nombre del paciente
- `motivo_consulta` - Motivo de la consulta
- `datos_mtc` - JSONB con datos de lengua y pulso
- `sintomas_generales` - JSONB con síntomas y emociones
- `datos_dolor` - JSONB con información del dolor
- `diagnostico_terapeuta` - Diagnóstico final
- `plan_tratamiento` - Plan de tratamiento

### 2. `sesiones_tratamiento`
Almacena el historial de sesiones de cada ficha.

**Campos principales:**
- `id` - UUID único
- `ficha_id` - Referencia a la ficha clínica
- `fecha_sesion` - Fecha de la sesión
- `evolucion` - Evolución del paciente
- `puntos_utilizados` - Puntos de acupuntura usados
- `tecnicas_aplicadas` - Técnicas aplicadas

### 3. `pacientes` (Opcional)
Información básica de pacientes para gestión futura.

## 🔒 Seguridad (RLS)

Todas las tablas tienen **Row Level Security (RLS)** activado:

- ✅ Los terapeutas solo pueden ver/editar SUS propias fichas
- ✅ Los datos están protegidos automáticamente
- ✅ Cada consulta filtra por `terapeuta_id = auth.uid()`

## 🛠️ Funciones Útiles Creadas

### `get_fichas_with_stats(terapeuta_uuid)`
Obtiene fichas con estadísticas de sesiones.

```sql
SELECT * FROM get_fichas_with_stats(auth.uid());
```

### `search_fichas(terapeuta_uuid, search_term)`
Busca fichas por nombre o motivo de consulta.

```sql
SELECT * FROM search_fichas(auth.uid(), 'dolor lumbar');
```

### `get_ficha_completa(ficha_uuid, terapeuta_uuid)`
Obtiene una ficha con todas sus sesiones en formato JSON.

```sql
SELECT * FROM get_ficha_completa('uuid-de-la-ficha', auth.uid());
```

### `get_dashboard_stats(terapeuta_uuid)`
Obtiene estadísticas generales para el dashboard.

```sql
SELECT * FROM get_dashboard_stats(auth.uid());
```

### `create_sesion_from_ficha(...)`
Crea una nueva sesión de tratamiento.

```sql
SELECT create_sesion_from_ficha(
    'uuid-de-la-ficha',
    'Evolución favorable',
    ARRAY['E36', 'IG4'],
    ARRAY['Acupuntura', 'Moxibustión'],
    60,
    'Observaciones...',
    NOW() + INTERVAL '1 week'
);
```

## ✅ Verificación

Después de ejecutar todos los archivos, verifica que todo esté correcto:

```sql
-- Ver tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('fichas_clinicas', 'sesiones_tratamiento', 'pacientes');

-- Ver políticas RLS
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Ver funciones creadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';
```

## 🔄 Rollback (Deshacer)

Si necesitas eliminar todo y empezar de nuevo:

```sql
-- CUIDADO: Esto elimina todas las tablas y datos
DROP TABLE IF EXISTS public.sesiones_tratamiento CASCADE;
DROP TABLE IF EXISTS public.fichas_clinicas CASCADE;
DROP TABLE IF EXISTS public.pacientes CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS get_fichas_with_stats(UUID);
DROP FUNCTION IF EXISTS search_fichas(UUID, TEXT);
DROP FUNCTION IF EXISTS get_ficha_completa(UUID, UUID);
DROP FUNCTION IF EXISTS create_sesion_from_ficha(UUID, TEXT, TEXT[], TEXT[], INT, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID);
DROP FUNCTION IF EXISTS duplicate_ficha(UUID, TEXT);
```

## 📚 Recursos

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)

## 💡 Notas Importantes

1. **JSONB vs JSON**: Usamos JSONB para los campos `datos_mtc`, `sintomas_generales` y `datos_dolor` porque:
   - Es más eficiente para consultas
   - Soporta indexación GIN
   - Almacenamiento optimizado

2. **Índices**: Se crean automáticamente índices para:
   - Búsquedas por terapeuta
   - Búsquedas por fecha
   - Búsquedas en campos JSONB

3. **Timestamps**: Todos usan `TIMESTAMPTZ` (con zona horaria) para evitar problemas con diferentes zonas horarias.

4. **UUID**: Usamos UUID en lugar de integers para mayor seguridad y escalabilidad.

---

¿Problemas? Abre un issue en el repositorio o consulta la documentación de Supabase.
