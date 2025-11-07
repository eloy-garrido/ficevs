-- =====================================================
-- CREAR USUARIO ADMINISTRADOR
-- =====================================================
-- Este archivo crea el usuario administrador para la demo
-- Ejecutar en: Supabase SQL Editor (DESPUÉS de 03_functions.sql)
-- =====================================================

-- IMPORTANTE: Este script crea un usuario de demostración
-- Para producción, debes crear usuarios mediante la interfaz
-- de Supabase Auth o la API de registro

-- =====================================================
-- OPCIÓN 1: Crear usuario mediante inserción directa
-- (Solo funciona si tienes acceso directo a auth.users)
-- =====================================================

-- Nota: Supabase no permite inserción directa en auth.users
-- por seguridad. Debes usar la API o el Dashboard.

-- =====================================================
-- OPCIÓN 2: Usar la API de Supabase (RECOMENDADO)
-- =====================================================

-- No se puede ejecutar desde SQL. Debes hacerlo de una de estas formas:

-- 1. Desde el Dashboard de Supabase:
--    - Ve a Authentication > Users
--    - Click en "Add user"
--    - Email: admin@example.com
--    - Password: admin
--    - Auto Confirm User: YES (importante para demo)
--    - Click en "Create new user"

-- 2. Desde la línea de comandos con curl:
/*
curl -X POST 'https://TU_PROYECTO.supabase.co/auth/v1/signup' \
-H "apikey: TU_ANON_KEY" \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@example.com",
  "password": "admin",
  "email_confirm": true
}'
*/

-- 3. Desde JavaScript (ejecutar en la consola del navegador en tu sitio):
/*
const { data, error } = await supabase.auth.signUp({
  email: 'admin@example.com',
  password: 'admin',
  options: {
    emailRedirectTo: window.location.origin,
    data: {
      role: 'admin',
      name: 'Administrador'
    }
  }
});
console.log(data, error);
*/

-- =====================================================
-- VERIFICAR QUE EL USUARIO FUE CREADO
-- =====================================================

-- Ejecuta esta query para verificar:
SELECT
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'admin@example.com';

-- Si ves el usuario, ¡está creado!

-- =====================================================
-- ACTUALIZAR DATOS DEL USUARIO (OPCIONAL)
-- =====================================================

-- Si necesitas actualizar el metadata del usuario:
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'name', 'Administrador',
    'created_via', 'sql_script'
)
WHERE email = 'admin@example.com';

-- =====================================================
-- CONFIRMAR EMAIL AUTOMÁTICAMENTE (PARA DEMO)
-- =====================================================

-- Si el usuario no puede loguearse porque el email no está confirmado:
UPDATE auth.users
SET
    email_confirmed_at = NOW(),
    confirmation_token = NULL,
    confirmation_sent_at = NULL
WHERE email = 'admin@example.com'
AND email_confirmed_at IS NULL;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Ejecuta esto para ver el estado final del usuario:
SELECT
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'admin@example.com';

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- Si el usuario no puede loguearse:

-- 1. Verificar que el email está confirmado:
SELECT email, email_confirmed_at
FROM auth.users
WHERE email = 'admin@example.com';

-- Si email_confirmed_at es NULL, ejecuta:
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@example.com';

-- 2. Verificar que no está bloqueado:
SELECT email, banned_until
FROM auth.users
WHERE email = 'admin@example.com';

-- Si banned_until tiene una fecha, ejecuta:
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'admin@example.com';

-- 3. Resetear contraseña (si olvidaste la contraseña):
-- Esto debes hacerlo desde el Dashboard de Supabase:
-- Authentication > Users > admin@example.com > Send Password Reset

-- =====================================================
-- ELIMINAR USUARIO (SI ES NECESARIO)
-- =====================================================

-- CUIDADO: Esto eliminará el usuario permanentemente
-- DELETE FROM auth.users WHERE email = 'admin@example.com';

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '===================================';
    RAISE NOTICE 'INSTRUCCIONES PARA CREAR USUARIO ADMIN';
    RAISE NOTICE '===================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Opción 1 (RECOMENDADA):';
    RAISE NOTICE '  1. Ve a Authentication > Users en Supabase Dashboard';
    RAISE NOTICE '  2. Click en "Add user"';
    RAISE NOTICE '  3. Email: admin@example.com';
    RAISE NOTICE '  4. Password: admin';
    RAISE NOTICE '  5. Auto Confirm User: YES';
    RAISE NOTICE '  6. Click en "Create new user"';
    RAISE NOTICE '';
    RAISE NOTICE 'Opción 2 (Confirmar email si ya creaste el usuario):';
    RAISE NOTICE '  Ejecuta el UPDATE de email_confirmed_at arriba';
    RAISE NOTICE '';
    RAISE NOTICE 'Credenciales de acceso:';
    RAISE NOTICE '  Email: admin@example.com';
    RAISE NOTICE '  Password: admin';
    RAISE NOTICE '===================================';
END $$;
