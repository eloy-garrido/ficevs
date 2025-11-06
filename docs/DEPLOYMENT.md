# 🚀 Guía de Deployment

Esta guía cubre todas las opciones para hacer deploy de tu aplicación de Ficha Clínica de Acupuntura.

## 📋 Tabla de Contenidos

- [Pre-requisitos](#pre-requisitos)
- [Configuración de Supabase](#configuración-de-supabase)
- [Netlify](#netlify-recomendado)
- [Vercel](#vercel)
- [GitHub Pages](#github-pages)
- [Otras Plataformas](#otras-plataformas)
- [Configuración Post-Deployment](#configuración-post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Pre-requisitos

Antes de hacer deploy, asegúrate de tener:

- ✅ Cuenta en [GitHub](https://github.com)
- ✅ Proyecto creado en [Supabase](https://supabase.com)
- ✅ Base de datos configurada (tablas + RLS + funciones)
- ✅ Credenciales de Supabase actualizadas en `js/config.js`

---

## Configuración de Supabase

### 1. Crear Proyecto

1. Ve a [https://supabase.com](https://supabase.com)
2. Click en "New Project"
3. Completa los datos:
   - **Name**: `ficha-clinica-acupuntura`
   - **Database Password**: (genera una segura)
   - **Region**: Elige la más cercana a tus usuarios
4. Click en "Create new project"
5. Espera a que se complete la inicialización (~2 minutos)

### 2. Obtener Credenciales

1. En tu proyecto, ve a **Settings** > **API**
2. Copia las siguientes credenciales:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Configurar Base de Datos

1. Ve a **SQL Editor**
2. Click en "New query"
3. Ejecuta los archivos SQL en orden:

```sql
-- Paso 1: Crear tablas
-- Copia y pega el contenido de sql/01_create_tables.sql
-- Click en "Run"

-- Paso 2: Configurar RLS
-- Copia y pega el contenido de sql/02_rls_policies.sql
-- Click en "Run"

-- Paso 3: Crear funciones
-- Copia y pega el contenido de sql/03_functions.sql
-- Click en "Run"
```

4. Verifica que las tablas se crearon:
   - Ve a **Table Editor**
   - Deberías ver: `fichas_clinicas`, `sesiones_tratamiento`, `pacientes`

### 4. Configurar Autenticación

1. Ve a **Authentication** > **Settings**
2. Configura las opciones:
   - **Enable Email Signup**: ON
   - **Enable Email Confirmations**: OFF (para desarrollo) / ON (para producción)
   - **Enable Anonymous Sign-ins**: ON (solo para demos)

3. (Opcional) Configurar Magic Links:
   - Ve a **Authentication** > **Email Templates**
   - Personaliza las plantillas de email

### 5. Actualizar Credenciales en el Código

Edita `js/config.js`:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://tu-proyecto.supabase.co',  // ← Reemplazar
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // ← Reemplazar
};
```

**⚠️ IMPORTANTE**: Haz commit de estos cambios antes de hacer deploy.

```bash
git add js/config.js
git commit -m "chore: Actualizar credenciales de Supabase"
git push origin main
```

---

## Netlify (Recomendado)

### Por qué Netlify?

- ✅ Gratis para proyectos ilimitados
- ✅ Deploy automático desde Git
- ✅ HTTPS gratis
- ✅ CDN global
- ✅ Excelente para PWAs

### Método 1: Deployment Automático desde GitHub

#### Paso 1: Conectar Repositorio

1. Ve a [https://app.netlify.com](https://app.netlify.com)
2. Click en "Add new site" > "Import an existing project"
3. Selecciona "GitHub"
4. Autoriza Netlify en GitHub
5. Selecciona el repositorio `ficevs`

#### Paso 2: Configurar Build

Netlify detectará automáticamente el archivo `netlify.toml`. Verifica que la configuración sea:

- **Build command**: `echo 'Sitio estático - sin build necesario'`
- **Publish directory**: `.` (raíz)

#### Paso 3: Deploy

1. Click en "Deploy site"
2. Espera ~1 minuto
3. ¡Listo! Tu sitio está en: `https://random-name.netlify.app`

#### Paso 4: Configurar Dominio Personalizado (Opcional)

1. Ve a **Site settings** > **Domain management**
2. Click en "Add custom domain"
3. Sigue las instrucciones para configurar DNS

### Método 2: Deploy desde CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify init

# Seguir las instrucciones en pantalla

# Deploy a producción
netlify deploy --prod
```

### Método 3: Deploy Manual (Drag & Drop)

1. Ve a [https://app.netlify.com](https://app.netlify.com)
2. Arrastra la carpeta del proyecto a la zona de drop
3. ¡Listo!

---

## Vercel

### Por qué Vercel?

- ✅ Gratis para proyectos personales
- ✅ Deploy automático desde Git
- ✅ HTTPS gratis
- ✅ CDN global ultra-rápido
- ✅ Excelente para aplicaciones JavaScript

### Método 1: Deployment desde GitHub

#### Paso 1: Conectar Repositorio

1. Ve a [https://vercel.com](https://vercel.com)
2. Click en "Import Project"
3. Selecciona "Import Git Repository"
4. Conecta GitHub y selecciona `ficevs`

#### Paso 2: Configurar Proyecto

Vercel detectará automáticamente el archivo `vercel.json`. Configuración:

- **Framework Preset**: Other
- **Build Command**: (vacío)
- **Output Directory**: `.`

#### Paso 3: Deploy

1. Click en "Deploy"
2. Espera ~30 segundos
3. ¡Listo! Tu sitio está en: `https://ficevs.vercel.app`

### Método 2: Deploy desde CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod
```

---

## GitHub Pages

### Por qué GitHub Pages?

- ✅ Completamente gratis
- ✅ Integración directa con GitHub
- ✅ HTTPS gratis
- ✅ Simple y confiable

### Método: Deployment desde Repositorio

#### Paso 1: Configurar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Click en **Settings**
3. Scroll hasta **Pages**
4. En "Source", selecciona:
   - **Branch**: `main`
   - **Folder**: `/root`
5. Click en "Save"

#### Paso 2: Esperar Deploy

- GitHub Pages tarda ~2-5 minutos en hacer el deploy
- Verás un mensaje: "Your site is published at..."
- Tu sitio estará en: `https://tu-usuario.github.io/ficevs`

#### Paso 3: (Opcional) Configurar Dominio Personalizado

1. En la misma sección de **Pages**
2. En "Custom domain", ingresa tu dominio
3. Configura los DNS según las instrucciones

### Limitaciones de GitHub Pages

- ⚠️ No soporta redirects nativamente
- ⚠️ No soporta headers personalizados
- ⚠️ Puede ser más lento que Netlify/Vercel

---

## Otras Plataformas

### Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar proyecto
firebase init hosting

# Seleccionar:
# - Public directory: .
# - Single-page app: Yes
# - GitHub auto-deploy: Yes (opcional)

# Deploy
firebase deploy --only hosting
```

### Cloudflare Pages

1. Ve a [https://pages.cloudflare.com](https://pages.cloudflare.com)
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Build command**: (vacío)
   - **Output directory**: `.`
4. Deploy!

### Render

1. Ve a [https://render.com](https://render.com)
2. Click en "New Static Site"
3. Conecta tu repositorio
4. Configura:
   - **Build Command**: (vacío)
   - **Publish directory**: `.`
5. Deploy!

---

## Configuración Post-Deployment

### 1. Verificar HTTPS

Todas las plataformas recomendadas proporcionan HTTPS automático. Verifica que tu sitio use `https://` en la URL.

### 2. Configurar PWA

La PWA debería funcionar automáticamente. Para verificar:

1. Abre Chrome DevTools
2. Ve a la pestaña "Application"
3. Verifica:
   - ✅ Service Worker registrado
   - ✅ Manifest.json cargado
   - ✅ Cache funcionando

### 3. Probar en Móviles

Prueba la instalación de la PWA:

**Android:**
1. Abre Chrome en tu móvil
2. Visita tu sitio
3. Deberías ver el banner "Agregar a pantalla de inicio"

**iOS:**
1. Abre Safari en tu iPhone
2. Visita tu sitio
3. Toca Compartir > Agregar a pantalla de inicio

### 4. Configurar Analytics (Opcional)

#### Google Analytics

Agrega al `<head>` de `index.html` y `ficha-clinica.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

### 5. Configurar Dominio Personalizado

#### En Netlify

1. Ve a **Domain settings**
2. Click en "Add custom domain"
3. Ingresa tu dominio (ej: `fichamtc.com`)
4. Configura los DNS según las instrucciones:

```
A record: 75.2.60.5
CNAME www: nombre-del-sitio.netlify.app
```

#### En Vercel

1. Ve a **Settings** > **Domains**
2. Click en "Add"
3. Ingresa tu dominio
4. Configura los DNS:

```
A record: 76.76.21.21
CNAME www: cname.vercel-dns.com
```

### 6. Configurar Email Transaccional (Opcional)

Si usas magic links, configura SMTP en Supabase:

1. Ve a **Settings** > **Auth**
2. Scroll hasta "SMTP Settings"
3. Configura con tu proveedor (SendGrid, Mailgun, etc.)

---

## Troubleshooting

### Error: "Failed to load resource"

**Causa**: Service Worker no encuentra los archivos

**Solución**:
```bash
# Limpia el caché del navegador
# Chrome: Ctrl+Shift+Del > Clear cache
# Recarga con Ctrl+Shift+R
```

### Error: "Supabase connection failed"

**Causa**: Credenciales incorrectas

**Solución**:
1. Verifica `js/config.js`
2. Asegúrate de que la URL y API Key sean correctas
3. Verifica que el proyecto de Supabase esté activo

### La PWA no se instala

**Causa**: HTTPS requerido para PWAs

**Solución**:
1. Asegúrate de estar usando HTTPS
2. Verifica que `manifest.json` sea accesible
3. Verifica que el Service Worker se registre correctamente

### Error: "RLS policy violation"

**Causa**: Row Level Security mal configurado

**Solución**:
1. Verifica que ejecutaste `02_rls_policies.sql`
2. Asegúrate de que el usuario esté autenticado
3. Verifica que `terapeuta_id` coincida con `auth.uid()`

### Los estilos no se cargan

**Causa**: Rutas relativas incorrectas

**Solución**:
Verifica que todos los archivos HTML tengan:
```html
<link rel="stylesheet" href="css/styles.css">
```

No uses `/css/styles.css` (ruta absoluta)

### El formulario no guarda

**Causa**: Error en JavaScript o Supabase

**Solución**:
1. Abre la consola del navegador (F12)
2. Revisa errores en rojo
3. Verifica que Supabase esté configurado
4. Verifica que las tablas existan

---

## 🎉 ¡Deployment Exitoso!

Si llegaste hasta aquí, tu aplicación debería estar funcionando perfectamente.

### Checklist Final

- [ ] Sitio accesible por HTTPS
- [ ] Login funciona
- [ ] Formulario guarda correctamente
- [ ] PWA instalable
- [ ] Responsive en móviles
- [ ] Service Worker activo
- [ ] Dominio personalizado configurado (opcional)

### Próximos Pasos

1. Comparte la URL con tus usuarios
2. Recolecta feedback
3. Itera y mejora
4. ¡Disfruta de tu aplicación!

---

## 💬 Soporte

¿Problemas con el deployment?

- 📧 Email: soporte@fichamtc.com
- 🐛 [GitHub Issues](https://github.com/eloy-garrido/ficevs/issues)
- 💬 [GitHub Discussions](https://github.com/eloy-garrido/ficevs/discussions)

---

**¡Buena suerte con tu deployment! 🚀**
