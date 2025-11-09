# 📋 Instrucciones de Instalación de Base de Datos

## 🚨 IMPORTANTE: Actualización del Esquema

**NOTA:** La tabla `pacientes` ha sido actualizada para incluir el campo `rut` y prevenir duplicados. Si ya ejecutaste los scripts anteriormente, **DEBES recrear la base de datos** ejecutando `00_drop_all_tables.sql` seguido de `01_create_all_tables.sql`.

## 🚨 IMPORTANTE: Empezar desde cero

Si ya tienes tablas creadas y están dando errores, sigue estos pasos:

## 📝 Orden de Ejecución

### Paso 1: Limpiar Base de Datos (Si es necesario)

Si ya ejecutaste scripts anteriores y tienes errores, **primero limpia todo**:

```sql
-- Ejecutar en Supabase SQL Editor
-- Este script borra TODAS las tablas y datos
```

**Archivo a ejecutar:** `00_drop_all_tables.sql`

⚠️ **ADVERTENCIA:** Esto borrará TODOS los datos. Hazlo solo si estás seguro.

---

### Paso 2: Crear Todas las Tablas

```sql
-- Ejecutar en Supabase SQL Editor
-- Este script crea TODAS las tablas con TODOS los campos
```

**Archivo a ejecutar:** `01_create_all_tables.sql`

✅ Este archivo crea:
- Tabla `fichas_clinicas` con TODOS los campos (incluye rut, fecha_nacimiento, direccion, fecha_ingreso)
- Tabla `sesiones_tratamiento`
- Tabla `pacientes` con campo `rut` y restricción única por RUT (previene duplicados)
- Todos los índices necesarios
- Función `calcular_edad()`
- Triggers automáticos

---

### Paso 3: Configurar Políticas RLS

```sql
-- Ejecutar en Supabase SQL Editor
-- Configura seguridad a nivel de fila
```

**Archivo a ejecutar:** `02_rls_policies.sql`

---

### Paso 4: Crear Funciones Auxiliares

```sql
-- Ejecutar en Supabase SQL Editor
-- Crea funciones para estadísticas y búsquedas
```

**Archivo a ejecutar:** `03_functions.sql`

---

### Paso 5: Crear Usuario Admin (Opcional)

```sql
-- Solo si necesitas crear un usuario de prueba
-- Credenciales: admin@example.com / admin123
```

**Archivo a ejecutar:** `04_create_admin_user.sql`

---

## ✅ Verificación

Después de ejecutar todos los scripts, verifica que todo esté bien:

```sql
-- Verificar tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar columnas de fichas_clinicas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fichas_clinicas'
ORDER BY ordinal_position;
```

Deberías ver estas columnas en `fichas_clinicas`:
- ✅ `id`
- ✅ `terapeuta_id`
- ✅ `nombre_paciente`
- ✅ `edad`
- ✅ `telefono`
- ✅ `email`
- ✅ `ocupacion`
- ✅ `motivo_consulta`
- ✅ **`rut`** ← Importante
- ✅ **`fecha_nacimiento`** ← Importante
- ✅ **`direccion`** ← Importante
- ✅ **`fecha_ingreso`** ← Importante
- ✅ `datos_mtc` (JSONB)
- ✅ `sintomas_generales` (JSONB)
- ✅ `datos_dolor` (JSONB)
- ✅ `estado`
- ✅ `created_at`
- ✅ `updated_at`

---

## 📁 Archivos OBSOLETOS (No usar)

Estos archivos están desactualizados y **NO deben ejecutarse**:

- ❌ `05_add_new_fields.sql` - Ya no es necesario (campos incluidos en `01_create_all_tables.sql`)

---

## 🔧 Troubleshooting

### Error: "column X does not exist"

**Solución:**
1. Ejecuta `00_drop_all_tables.sql` para limpiar
2. Ejecuta `01_create_all_tables.sql` para crear TODO desde cero

### Error: "table already exists"

**Solución:**
1. Si ya tienes las tablas pero con campos faltantes, ejecuta `00_drop_all_tables.sql` primero
2. Luego ejecuta `01_create_all_tables.sql`

### Error: "PGRST204" o "schema cache"

**Solución:**
Este error significa que Supabase tiene en cache una versión antigua del esquema.

1. Ejecuta `00_drop_all_tables.sql`
2. Ejecuta `01_create_all_tables.sql`
3. En Supabase, ve a **Settings → API** y haz clic en "Restart" si es necesario

---

## 🎯 Resumen Rápido

Si tienes errores y quieres empezar limpio:

```bash
# En Supabase SQL Editor, ejecuta en orden:
1. 00_drop_all_tables.sql      # Limpia todo
2. 01_create_all_tables.sql    # Crea todo
3. 02_rls_policies.sql         # Seguridad
4. 03_functions.sql            # Funciones auxiliares
5. 04_create_admin_user.sql    # Usuario de prueba (opcional)
```

✅ **Listo!** Tu base de datos estará completamente configurada.

---

## 📞 Soporte

Si sigues teniendo problemas:
1. Verifica que ejecutaste los scripts en el orden correcto
2. Revisa los mensajes de error en Supabase SQL Editor
3. Asegúrate de estar usando la versión PostgreSQL 15+
