/**
 * =====================================================
 * CONFIGURACIÓN DE SUPABASE
 * =====================================================
 * Este archivo contiene las credenciales y configuración
 * para conectar con Supabase
 * =====================================================
 */

// Credenciales de Supabase
const SUPABASE_CONFIG = {
    url: 'https://hqbysakupbqwdfyprzya.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxYnlzYWt1cGJxd2RmeXByenlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTE0NTMsImV4cCI6MjA3Nzg2NzQ1M30.ctzCo94xOuiVvytAJypPu1tuPVj2iLHZP82LOHsxE3E'
};

// Opciones de configuración
const APP_CONFIG = {
    // Nombre de la aplicación
    appName: 'Ficha Clínica de Acupuntura',

    // Versión
    version: '1.0.0',

    // Configuración de autenticación
    auth: {
        // Usar autenticación anónima para desarrollo
        // IMPORTANTE: En producción, cambiar a autenticación con email
        enableAnonymousAuth: true,

        // Redirección después del login
        redirectTo: window.location.origin + '/ficha-clinica.html',

        // Persistencia de sesión
        persistSession: true,

        // Detectar cambios de sesión
        detectSessionInUrl: true,

        // Auto-refresh token
        autoRefreshToken: true
    },

    // Configuración de almacenamiento local
    storage: {
        // Guardar borradores automáticamente
        autoSaveDrafts: true,

        // Intervalo de auto-guardado (en ms)
        autoSaveInterval: 30000, // 30 segundos

        // Clave para localStorage
        draftKey: 'ficha_clinica_draft'
    },

    // Configuración del formulario
    form: {
        // Número total de pasos
        totalSteps: 5,

        // Validar al cambiar de paso
        validateOnStepChange: true,

        // Mostrar resumen antes de guardar
        showSummaryBeforeSave: true
    },

    // Configuración de notificaciones
    notifications: {
        // Duración de notificaciones (en ms)
        duration: 3000,

        // Posición: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
        position: 'top-right'
    },

    // Modo debug
    debug: false
};

// Validar configuración
function validateConfig() {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.error('❌ Error: Credenciales de Supabase no configuradas');
        return false;
    }

    if (APP_CONFIG.debug) {
        console.log('✅ Configuración validada correctamente');
        console.log('📍 Supabase URL:', SUPABASE_CONFIG.url);
    }

    return true;
}

// Exportar configuración
export { SUPABASE_CONFIG, APP_CONFIG, validateConfig };
