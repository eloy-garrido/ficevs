# 📋 Ficha Clínica de Acupuntura

Sistema completo de gestión de fichas clínicas para profesionales de Medicina Tradicional China (MTC) y Acupuntura. Desarrollado con tecnologías web modernas, Supabase como backend y diseñado para funcionar en cualquier dispositivo.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## ✨ Características Principales

- 📝 **Formulario Multi-Paso Completo**
  - Datos del paciente
  - Diagnóstico MTC (lengua y pulso)
  - Síntomas generales y emocionales
  - Evaluación del dolor
  - Plan de tratamiento

- 🔒 **Seguridad Total**
  - Row Level Security (RLS) de Supabase
  - Cada terapeuta solo ve sus propias fichas
  - Autenticación segura (email, magic link, anónima)

- 📱 **Responsive & PWA**
  - Funciona perfecto en móviles, tablets y PC
  - Instalable como app nativa
  - Funcionalidad offline

- ☁️ **En la Nube**
  - Datos respaldados automáticamente
  - Acceso desde cualquier lugar
  - Sincronización en tiempo real

- 🚀 **Rápido y Ligero**
  - Sin frameworks pesados
  - Carga instantánea
  - Vanilla JavaScript + Tailwind CSS

- 💾 **Auto-Guardado**
  - Guardado automático de borradores
  - Recuperación de sesión
  - No pierdas tu trabajo

## 🏗️ Arquitectura del Proyecto

```
ficevs/
├── index.html                 # Landing page con login
├── ficha-clinica.html        # Formulario multi-paso
├── manifest.json             # Configuración PWA
├── service-worker.js         # Service Worker para offline
├── netlify.toml             # Config Netlify
├── vercel.json              # Config Vercel
├── css/
│   └── styles.css           # Estilos personalizados
├── js/
│   ├── config.js            # Configuración Supabase
│   ├── auth.js              # Módulo de autenticación
│   ├── supabaseService.js   # Servicio de base de datos
│   ├── formManager.js       # Gestor del formulario
│   └── utils.js             # Utilidades generales
├── sql/
│   ├── 01_create_tables.sql # Creación de tablas
│   ├── 02_rls_policies.sql  # Políticas de seguridad
│   ├── 03_functions.sql     # Funciones de BD
│   └── README_SQL.md        # Documentación SQL
├── assets/
│   └── images/              # Imágenes e iconos
└── docs/
    └── DEPLOYMENT.md        # Guía de deployment
```

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/eloy-garrido/ficevs.git
cd ficevs
```

### 2. Configurar Supabase

#### 2.1. Crear Proyecto en Supabase

1. Ve a [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Anota la URL y la API Key (anon public)

#### 2.2. Ejecutar Scripts SQL

En el SQL Editor de Supabase, ejecuta en orden:

```sql
-- 1. Crear tablas
-- Ejecutar: sql/01_create_tables.sql

-- 2. Configurar seguridad (RLS)
-- Ejecutar: sql/02_rls_policies.sql

-- 3. Crear funciones útiles
-- Ejecutar: sql/03_functions.sql
```

Consulta `sql/README_SQL.md` para instrucciones detalladas.

#### 2.3. Configurar Credenciales

Edita `js/config.js` y agrega tus credenciales:

```javascript
const SUPABASE_CONFIG = {
    url: 'TU_SUPABASE_URL',
    anonKey: 'TU_SUPABASE_ANON_KEY'
};
```

### 3. Ejecutar Localmente

#### Opción A: Python Server (Recomendado)

```bash
# Python 3
python -m http.server 8000

# Abrir en el navegador
# http://localhost:8000
```

#### Opción B: Node.js Server

```bash
# Instalar http-server globalmente
npm install -g http-server

# Ejecutar servidor
http-server -p 8000

# Abrir en el navegador
# http://localhost:8000
```

#### Opción C: VS Code Live Server

1. Instala la extensión "Live Server"
2. Click derecho en `index.html`
3. Selecciona "Open with Live Server"

## 🌐 Deployment

### Netlify (Recomendado)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Conecta tu repositorio de GitHub
2. Netlify detectará automáticamente la configuración (`netlify.toml`)
3. Deploy automático!

**URL de ejemplo:** `https://ficha-clinica-mtc.netlify.app`

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Importa tu repositorio de GitHub
2. Vercel usará la configuración de `vercel.json`
3. Deploy automático!

**URL de ejemplo:** `https://ficha-clinica-mtc.vercel.app`

### GitHub Pages

```bash
# 1. Asegúrate de estar en la rama main
git checkout main

# 2. Push al repositorio
git push origin main

# 3. En GitHub, ve a Settings > Pages
# 4. Selecciona "main" como source branch
# 5. Guarda y espera el deployment
```

Consulta `docs/DEPLOYMENT.md` para más detalles.

## 📱 Características PWA

### Instalar como App

**En Android:**
1. Abre el sitio en Chrome
2. Toca el menú (⋮)
3. Selecciona "Agregar a pantalla de inicio"

**En iOS:**
1. Abre el sitio en Safari
2. Toca el botón de compartir (□↑)
3. Selecciona "Agregar a pantalla de inicio"

**En Desktop:**
1. Abre el sitio en Chrome
2. Click en el ícono de instalar (+) en la barra de direcciones
3. Confirma la instalación

### Funcionalidad Offline

La aplicación cachea automáticamente:
- Páginas HTML
- Estilos CSS
- Scripts JavaScript
- Assets estáticos

Los datos del formulario se guardan localmente y se sincronizan cuando vuelve la conexión.

## 🔧 Configuración Avanzada

### Autenticación

Edita `js/config.js` para configurar:

```javascript
auth: {
    // Usar autenticación anónima (solo desarrollo)
    enableAnonymousAuth: true,

    // Redirección después del login
    redirectTo: window.location.origin + '/ficha-clinica.html',

    // Persistir sesión
    persistSession: true
}
```

### Auto-Guardado

Configura el intervalo de auto-guardado:

```javascript
storage: {
    autoSaveDrafts: true,
    autoSaveInterval: 30000, // 30 segundos
}
```

### Modo Debug

Activa logs detallados:

```javascript
debug: true
```

## 📊 Base de Datos

### Tablas Principales

- **fichas_clinicas**: Almacena las fichas completas
- **sesiones_tratamiento**: Historial de sesiones
- **pacientes**: Información de pacientes (opcional)

### Funciones Disponibles

```sql
-- Obtener fichas con estadísticas
SELECT * FROM get_fichas_with_stats(auth.uid());

-- Buscar fichas
SELECT * FROM search_fichas(auth.uid(), 'término de búsqueda');

-- Estadísticas del dashboard
SELECT * FROM get_dashboard_stats(auth.uid());
```

Consulta `sql/README_SQL.md` para más detalles.

## 🎨 Personalización

### Colores

Edita `css/styles.css` para cambiar los colores:

```css
:root {
    --primary-color: #2563eb;
    --primary-dark: #1d4ed8;
    --success-color: #10b981;
    /* ... */
}
```

### Logo e Iconos

Reemplaza las imágenes en `assets/images/`:

```
icon-72x72.png
icon-192x192.png
icon-512x512.png
favicon.png
```

## 📝 Uso

### 1. Acceso

Visita la URL de tu deployment o `localhost:8000`

### 2. Login

Opciones de autenticación:
- Email y contraseña
- Magic Link (email sin contraseña)
- Modo invitado (demo)

### 3. Crear Ficha

El formulario tiene 5 pasos:

1. **Datos del Paciente**: Nombre, edad, motivo de consulta
2. **Diagnóstico MTC**: Lengua y pulso
3. **Síntomas Generales**: Síntomas, emociones, digestivos
4. **Evaluación del Dolor**: Ubicación, tipo, intensidad
5. **Plan de Tratamiento**: Diagnóstico, puntos, técnicas

### 4. Guardar

- Auto-guardado cada 30 segundos
- Guardado manual con botón "Guardar Borrador"
- Guardado final en paso 5

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Tailwind CSS
- **Backend**: Supabase (PostgreSQL + REST API)
- **Autenticación**: Supabase Auth
- **Hosting**: Netlify / Vercel / GitHub Pages
- **PWA**: Service Workers, Web App Manifest

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 💬 Soporte

¿Tienes preguntas o problemas?

- 📧 Email: soporte@fichamtc.com
- 🐛 Issues: [GitHub Issues](https://github.com/eloy-garrido/ficevs/issues)
- 💬 Discusiones: [GitHub Discussions](https://github.com/eloy-garrido/ficevs/discussions)

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) - Backend as a Service increíble
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS utility-first
- Comunidad de desarrolladores de código abierto

## 🗺️ Roadmap

- [ ] Dashboard con estadísticas
- [ ] Exportación a PDF
- [ ] Recordatorios de citas
- [ ] Múltiples idiomas (i18n)
- [ ] Plantillas de tratamiento
- [ ] Integración con calendarios
- [ ] Análisis de datos agregados

---

**Hecho con ❤️ para profesionales de Medicina Tradicional China**

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
