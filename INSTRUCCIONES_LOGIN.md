# 🔐 Instrucciones para Configurar el Login

Este documento explica cómo crear el usuario administrador de demo para acceder al sistema.

---

## 📋 Credenciales de Acceso

```
Usuario:     admin@example.com
Contraseña:  admin
```

**Estas credenciales ya están pre-llenadas en la pantalla de login.**

---

## 🚀 Método Rápido: Crear Usuario desde Dashboard de Supabase

### Paso 1: Acceder a Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **hqbysakupbqwdfyprzya**

### Paso 2: Crear Usuario Admin

1. En el menú lateral, click en **Authentication**
2. Click en **Users**
3. Click en el botón **"Add user"** (esquina superior derecha)
4. Completa el formulario:

```
Email:               admin@example.com
Password:            admin
Auto Confirm User:   ✅ SÍ (MUY IMPORTANTE)
```

5. Click en **"Create new user"**

### Paso 3: Verificar

Deberías ver el usuario creado en la lista:

```
📧 admin@example.com
✅ Confirmed
🕐 Created: [fecha actual]
```

---

## ✅ ¡Listo para Usar!

Ahora puedes:

1. Abrir tu aplicación (localhost o URL deployada)
2. Verás la pantalla de login con las credenciales pre-llenadas
3. Click en **"Iniciar Sesión"**
4. Serás redirigido al formulario de ficha clínica

---

## 🔧 Método Alternativo: Crear Usuario desde SQL

Si prefieres usar SQL (avanzado):

### Opción A: Confirmar Email Manualmente

Si ya creaste el usuario pero no confirmaste el email:

```sql
-- Ejecutar en Supabase SQL Editor
UPDATE auth.users
SET
    email_confirmed_at = NOW(),
    confirmation_token = NULL,
    confirmation_sent_at = NULL
WHERE email = 'admin@example.com';
```

### Opción B: Verificar que el Usuario Existe

```sql
-- Ejecutar en Supabase SQL Editor
SELECT
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users
WHERE email = 'admin@example.com';
```

**Resultado esperado:**

```
id: [uuid]
email: admin@example.com
email_confirmed: true
created_at: [fecha]
```

---

## ❌ Troubleshooting

### Problema: "Invalid login credentials"

**Causa:** El usuario no existe o la contraseña es incorrecta.

**Solución:**
1. Verifica que creaste el usuario en Supabase Dashboard
2. Verifica que usaste exactamente:
   - Email: `admin@example.com`
   - Password: `admin`

### Problema: "Email not confirmed"

**Causa:** No marcaste "Auto Confirm User" al crear el usuario.

**Solución 1 (Dashboard):**
1. Ve a Authentication > Users
2. Click en el usuario admin@example.com
3. En la sección "User Settings"
4. Busca "Email Confirmed At"
5. Si está vacío, click en "Confirm email"

**Solución 2 (SQL):**
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@example.com';
```

### Problema: El usuario no aparece en la lista

**Causa:** El usuario no se creó correctamente.

**Solución:**
Repite el proceso de creación desde el Dashboard (Paso 2).

### Problema: "Too many requests"

**Causa:** Intentaste loguearte muchas veces con credenciales incorrectas.

**Solución:**
Espera 1 minuto y vuelve a intentar.

---

## 🔒 Seguridad en Producción

**⚠️ IMPORTANTE:** Estas credenciales son SOLO para demostración.

### Para Producción:

1. **Cambiar la contraseña:**
   - Usa una contraseña fuerte (mínimo 12 caracteres)
   - Incluye mayúsculas, minúsculas, números y símbolos
   - Ejemplo: `Admin2025!Secure#MTC`

2. **Usar un email real:**
   - Cambia `admin@example.com` por un email real
   - Ejemplo: `tu-email@tudominio.com`

3. **Habilitar confirmación de email:**
   - NO uses "Auto Confirm User" en producción
   - El usuario recibirá un email de confirmación

4. **Configurar SMTP en Supabase:**
   - Ve a Settings > Auth
   - Configura SMTP con tu proveedor de email
   - (SendGrid, Mailgun, etc.)

5. **Deshabilitar auth anónima:**
   - En `js/config.js`, cambia:
   ```javascript
   auth: {
       enableAnonymousAuth: false,  // Cambiar a false
       // ...
   }
   ```

6. **Ocultar credenciales:**
   - Elimina el banner azul de credenciales en `index.html`
   - Elimina los `value=""` pre-llenados en los inputs

---

## 📚 Recursos Adicionales

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Crear usuarios en Supabase](https://supabase.com/docs/guides/auth/managing-user-data)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✨ Resumen Rápido

```bash
# 1. Ir a Supabase Dashboard
#    https://supabase.com/dashboard

# 2. Authentication > Users > Add user
#    Email: admin@example.com
#    Password: admin
#    Auto Confirm: YES ✅

# 3. Abrir aplicación y login
#    Las credenciales ya están pre-llenadas!
```

---

**¿Problemas?** Consulta la sección de Troubleshooting arriba o revisa los archivos:
- `sql/04_create_admin_user.sql` - Script SQL completo
- `README.md` - Documentación general del proyecto
