/**
 * =====================================================
 * MÓDULO DE AUTENTICACIÓN
 * =====================================================
 * Maneja toda la lógica de autenticación con Supabase
 * =====================================================
 */

import { SUPABASE_CONFIG, APP_CONFIG } from './config.js';
import { notifications, loader, debugLog } from './utils.js';

// Cliente de Supabase (se inicializa después)
let supabase = null;

/**
 * Inicializa el cliente de Supabase
 */
export async function initSupabase() {
    try {
        // Verificar que el script de Supabase esté cargado
        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase client no está cargado. Asegúrate de incluir el script del CDN.');
        }

        // Crear cliente de Supabase
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            {
                auth: {
                    persistSession: APP_CONFIG.auth.persistSession,
                    detectSessionInUrl: APP_CONFIG.auth.detectSessionInUrl,
                    autoRefreshToken: APP_CONFIG.auth.autoRefreshToken
                }
            }
        );

        debugLog('✅ Supabase client inicializado');

        // Verificar sesión actual
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            debugLog('👤 Sesión activa encontrada:', session.user.id);
        } else {
            debugLog('🔓 No hay sesión activa');
        }

        // Escuchar cambios de autenticación
        supabase.auth.onAuthStateChange((event, session) => {
            debugLog('🔄 Estado de auth cambió:', event);

            if (event === 'SIGNED_IN') {
                debugLog('✅ Usuario autenticado:', session.user.id);
            } else if (event === 'SIGNED_OUT') {
                debugLog('🔒 Usuario desconectado');
            } else if (event === 'TOKEN_REFRESHED') {
                debugLog('🔄 Token refrescado');
            }
        });

        return supabase;

    } catch (error) {
        console.error('❌ Error al inicializar Supabase:', error);
        notifications.error('Error al conectar con el servidor. Por favor, recarga la página.');
        throw error;
    }
}

/**
 * Obtiene el cliente de Supabase
 */
export function getSupabaseClient() {
    if (!supabase) {
        throw new Error('Supabase no ha sido inicializado. Llama a initSupabase() primero.');
    }
    return supabase;
}

/**
 * =====================================================
 * MÉTODOS DE AUTENTICACIÓN
 * =====================================================
 */

/**
 * Registro con email y contraseña
 */
export async function signUpWithEmail(email, password, metadata = {}) {
    try {
        loader.show('Registrando usuario...');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });

        loader.hide();

        if (error) throw error;

        if (data.user && !data.user.confirmed_at) {
            notifications.info('Por favor, verifica tu email para completar el registro.');
        } else {
            notifications.success('Registro exitoso!');
        }

        return { user: data.user, session: data.session };

    } catch (error) {
        loader.hide();
        console.error('❌ Error en registro:', error);
        notifications.error(error.message || 'Error al registrar usuario');
        throw error;
    }
}

/**
 * Login con email y contraseña
 */
export async function signInWithEmail(email, password) {
    try {
        loader.show('Iniciando sesión...');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        loader.hide();

        if (error) throw error;

        notifications.success('Bienvenido!');
        debugLog('✅ Login exitoso:', data.user.id);

        return { user: data.user, session: data.session };

    } catch (error) {
        loader.hide();
        console.error('❌ Error en login:', error);
        notifications.error(error.message || 'Error al iniciar sesión');
        throw error;
    }
}

/**
 * Login con Magic Link (email sin contraseña)
 */
export async function signInWithMagicLink(email) {
    try {
        loader.show('Enviando link mágico...');

        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: APP_CONFIG.auth.redirectTo
            }
        });

        loader.hide();

        if (error) throw error;

        notifications.success('Link mágico enviado! Revisa tu email.');
        debugLog('✅ Magic link enviado a:', email);

        return data;

    } catch (error) {
        loader.hide();
        console.error('❌ Error al enviar magic link:', error);
        notifications.error(error.message || 'Error al enviar link');
        throw error;
    }
}

/**
 * Login Anónimo (para desarrollo/pruebas)
 * IMPORTANTE: No recomendado para producción
 */
export async function signInAnonymously() {
    try {
        loader.show('Iniciando sesión anónima...');

        const { data, error } = await supabase.auth.signInAnonymously();

        loader.hide();

        if (error) throw error;

        notifications.info('Sesión anónima iniciada. Los datos no persistirán.');
        debugLog('✅ Login anónimo exitoso:', data.user.id);

        return { user: data.user, session: data.session };

    } catch (error) {
        loader.hide();
        console.error('❌ Error en login anónimo:', error);
        notifications.error('Error al iniciar sesión anónima');
        throw error;
    }
}

/**
 * Logout
 */
export async function signOut() {
    try {
        loader.show('Cerrando sesión...');

        const { error } = await supabase.auth.signOut();

        loader.hide();

        if (error) throw error;

        notifications.success('Sesión cerrada');
        debugLog('✅ Logout exitoso');

        // Redirigir a la página de inicio
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);

    } catch (error) {
        loader.hide();
        console.error('❌ Error al cerrar sesión:', error);
        notifications.error('Error al cerrar sesión');
        throw error;
    }
}

/**
 * =====================================================
 * MÉTODOS DE SESIÓN
 * =====================================================
 */

/**
 * Obtiene el usuario actual
 */
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        return user;

    } catch (error) {
        console.error('❌ Error al obtener usuario:', error);
        return null;
    }
}

/**
 * Obtiene la sesión actual
 */
export async function getCurrentSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        return session;

    } catch (error) {
        console.error('❌ Error al obtener sesión:', error);
        return null;
    }
}

/**
 * Verifica si el usuario está autenticado
 */
export async function isAuthenticated() {
    const session = await getCurrentSession();
    return session !== null;
}

/**
 * Requiere autenticación (redirige si no está autenticado)
 */
export async function requireAuth(redirectTo = '/index.html') {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
        notifications.warning('Debes iniciar sesión para acceder a esta página');
        setTimeout(() => {
            window.location.href = redirectTo;
        }, 1500);
        return false;
    }

    return true;
}

/**
 * =====================================================
 * MÉTODOS DE RECUPERACIÓN DE CONTRASEÑA
 * =====================================================
 */

/**
 * Envía email de recuperación de contraseña
 */
export async function resetPasswordForEmail(email) {
    try {
        loader.show('Enviando email de recuperación...');

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        loader.hide();

        if (error) throw error;

        notifications.success('Email de recuperación enviado! Revisa tu bandeja de entrada.');
        debugLog('✅ Email de recuperación enviado a:', email);

        return data;

    } catch (error) {
        loader.hide();
        console.error('❌ Error al enviar email de recuperación:', error);
        notifications.error('Error al enviar email de recuperación');
        throw error;
    }
}

/**
 * Actualiza la contraseña del usuario
 */
export async function updatePassword(newPassword) {
    try {
        loader.show('Actualizando contraseña...');

        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        loader.hide();

        if (error) throw error;

        notifications.success('Contraseña actualizada exitosamente!');
        debugLog('✅ Contraseña actualizada');

        return data;

    } catch (error) {
        loader.hide();
        console.error('❌ Error al actualizar contraseña:', error);
        notifications.error('Error al actualizar contraseña');
        throw error;
    }
}

/**
 * =====================================================
 * HELPER PARA AUTENTICACIÓN AUTOMÁTICA EN DESARROLLO
 * =====================================================
 */

/**
 * Auto-login para desarrollo (usa auth anónima si está habilitada)
 */
export async function autoLogin() {
    if (!APP_CONFIG.auth.enableAnonymousAuth) {
        debugLog('⚠️ Auto-login deshabilitado');
        return false;
    }

    const authenticated = await isAuthenticated();

    if (authenticated) {
        debugLog('✅ Usuario ya autenticado');
        return true;
    }

    debugLog('🔄 Intentando auto-login...');

    try {
        await signInAnonymously();
        return true;
    } catch (error) {
        console.error('❌ Error en auto-login:', error);
        return false;
    }
}

/**
 * =====================================================
 * EXPORTAR CLIENTE SUPABASE
 * =====================================================
 */

export { supabase };
