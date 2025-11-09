/**
 * =====================================================
 * SERVICIO DE SUPABASE
 * =====================================================
 * Maneja todas las operaciones con la base de datos
 * =====================================================
 */

import { getSupabaseClient, getCurrentUser } from './auth.js';
import { notifications, loader, debugLog } from './utils.js';

/**
 * =====================================================
 * OPERACIONES CON FICHAS CLÍNICAS
 * =====================================================
 */

/**
 * Crea una nueva ficha clínica
 */
export async function createFichaClinica(fichaData) {
    try {
        loader.show('Guardando ficha clínica...');

        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Preparar datos para inserción
        const payload = {
            terapeuta_id: user.id,

            // Datos del paciente (Paso 1)
            nombre_paciente: fichaData.nombre_paciente,
            rut: fichaData.rut || null,
            fecha_nacimiento: fichaData.fecha_nacimiento || null,
            edad: fichaData.edad ? parseInt(fichaData.edad) : null,
            fecha_ingreso: fichaData.fecha_ingreso || new Date().toISOString().split('T')[0],
            telefono: fichaData.telefono || null,
            email: fichaData.email || null,
            ocupacion: fichaData.ocupacion || null,
            direccion: fichaData.direccion || null,
            motivo_consulta: fichaData.motivo_consulta,

            // Datos MTC (Paso 2) - JSONB
            datos_mtc: fichaData.datos_mtc || {},

            // Síntomas Generales (Paso 3) - JSONB
            sintomas_generales: fichaData.sintomas_generales || {},

            // Datos del Dolor (Paso 4) - JSONB
            datos_dolor: fichaData.datos_dolor || {},

            // Diagnóstico y Plan (Paso 5)
            diagnostico_terapeuta: fichaData.diagnostico_terapeuta || null,
            plan_tratamiento: fichaData.plan_tratamiento || null,
            puntos_acupuntura: fichaData.puntos_acupuntura || [],
            tecnicas_aplicadas: fichaData.tecnicas_aplicadas || [],
            recomendaciones: fichaData.recomendaciones || null,

            // Consentimiento
            consentimiento_aceptado: fichaData.consentimiento_aceptado || false,
            fecha_consentimiento: fichaData.consentimiento_aceptado ? new Date().toISOString() : null,

            // Estado
            estado: 'activo'
        };

        debugLog('📤 Enviando ficha a Supabase:', payload);

        const { data, error } = await supabase
            .from('fichas_clinicas')
            .insert([payload])
            .select()
            .single();

        loader.hide();

        if (error) {
            console.error('❌ Error de Supabase:', error);
            console.error('📋 Detalles del error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            console.error('📦 Payload enviado:', payload);
            throw error;
        }

        notifications.success('Ficha clínica guardada exitosamente!');
        debugLog('✅ Ficha creada:', data.id);

        return data;

    } catch (error) {
        loader.hide();
        console.error('❌ Error al crear ficha:', error);

        // Mensaje de error más descriptivo
        let errorMsg = 'Error al guardar la ficha clínica';
        if (error.message) {
            errorMsg += ': ' + error.message;
        }
        if (error.details) {
            errorMsg += ' (' + error.details + ')';
        }

        notifications.error(errorMsg);
        throw error;
    }
}

/**
 * Obtiene todas las fichas del terapeuta
 */
export async function getFichasClinicas(filters = {}) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        let query = supabase
            .from('fichas_clinicas')
            .select('*')
            .eq('terapeuta_id', user.id)
            .order('created_at', { ascending: false });

        // Aplicar filtros opcionales
        if (filters.estado) {
            query = query.eq('estado', filters.estado);
        }

        if (filters.nombre_paciente) {
            query = query.ilike('nombre_paciente', `%${filters.nombre_paciente}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        debugLog('✅ Fichas obtenidas:', data.length);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener fichas:', error);
        notifications.error('Error al cargar las fichas');
        throw error;
    }
}

/**
 * Obtiene una ficha específica por ID
 */
export async function getFichaClinicaById(fichaId) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('fichas_clinicas')
            .select('*')
            .eq('id', fichaId)
            .eq('terapeuta_id', user.id)
            .single();

        if (error) throw error;

        debugLog('✅ Ficha obtenida:', data.id);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener ficha:', error);
        notifications.error('Error al cargar la ficha');
        throw error;
    }
}

/**
 * Actualiza una ficha clínica
 */
export async function updateFichaClinica(fichaId, updates) {
    try {
        loader.show('Actualizando ficha...');

        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('fichas_clinicas')
            .update(updates)
            .eq('id', fichaId)
            .eq('terapeuta_id', user.id)
            .select()
            .single();

        loader.hide();

        if (error) throw error;

        notifications.success('Ficha actualizada exitosamente!');
        debugLog('✅ Ficha actualizada:', data.id);

        return data;

    } catch (error) {
        loader.hide();
        console.error('❌ Error al actualizar ficha:', error);
        notifications.error('Error al actualizar la ficha');
        throw error;
    }
}

/**
 * Elimina (o archiva) una ficha clínica
 */
export async function deleteFichaClinica(fichaId, soft = true) {
    try {
        loader.show(soft ? 'Archivando ficha...' : 'Eliminando ficha...');

        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        let result;

        if (soft) {
            // Soft delete: cambiar estado a archivado
            result = await supabase
                .from('fichas_clinicas')
                .update({ estado: 'archivado' })
                .eq('id', fichaId)
                .eq('terapeuta_id', user.id)
                .select()
                .single();
        } else {
            // Hard delete: eliminar permanentemente
            result = await supabase
                .from('fichas_clinicas')
                .delete()
                .eq('id', fichaId)
                .eq('terapeuta_id', user.id);
        }

        loader.hide();

        if (result.error) throw result.error;

        notifications.success(soft ? 'Ficha archivada' : 'Ficha eliminada');
        debugLog('✅ Ficha eliminada/archivada:', fichaId);

        return result.data;

    } catch (error) {
        loader.hide();
        console.error('❌ Error al eliminar/archivar ficha:', error);
        notifications.error('Error al procesar la operación');
        throw error;
    }
}

/**
 * =====================================================
 * OPERACIONES CON SESIONES DE TRATAMIENTO
 * =====================================================
 */

/**
 * Crea una nueva sesión de tratamiento
 */
export async function createSesionTratamiento(sesionData) {
    try {
        loader.show('Guardando sesión...');

        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener el número de sesión actual
        const { data: sesiones, error: countError } = await supabase
            .from('sesiones_tratamiento')
            .select('numero_sesion')
            .eq('ficha_id', sesionData.ficha_id)
            .order('numero_sesion', { ascending: false })
            .limit(1);

        if (countError) throw countError;

        const nextNumero = sesiones && sesiones.length > 0
            ? sesiones[0].numero_sesion + 1
            : 1;

        const payload = {
            ficha_id: sesionData.ficha_id,
            terapeuta_id: user.id,
            numero_sesion: nextNumero,
            fecha_sesion: sesionData.fecha_sesion || new Date().toISOString(),
            evolucion: sesionData.evolucion,
            puntos_utilizados: sesionData.puntos_utilizados || [],
            tecnicas_aplicadas: sesionData.tecnicas_aplicadas || [],
            duracion_minutos: sesionData.duracion_minutos || null,
            observaciones: sesionData.observaciones || null,
            proxima_cita: sesionData.proxima_cita || null
        };

        const { data, error } = await supabase
            .from('sesiones_tratamiento')
            .insert([payload])
            .select()
            .single();

        loader.hide();

        if (error) throw error;

        notifications.success('Sesión guardada exitosamente!');
        debugLog('✅ Sesión creada:', data.id);

        return data;

    } catch (error) {
        loader.hide();
        console.error('❌ Error al crear sesión:', error);
        notifications.error('Error al guardar la sesión');
        throw error;
    }
}

/**
 * Obtiene todas las sesiones de una ficha
 */
export async function getSesionesByFicha(fichaId) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('sesiones_tratamiento')
            .select('*')
            .eq('ficha_id', fichaId)
            .eq('terapeuta_id', user.id)
            .order('fecha_sesion', { ascending: false });

        if (error) throw error;

        debugLog('✅ Sesiones obtenidas:', data.length);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener sesiones:', error);
        notifications.error('Error al cargar las sesiones');
        throw error;
    }
}

/**
 * =====================================================
 * BÚSQUEDA Y FILTROS
 * =====================================================
 */

/**
 * Busca fichas por texto
 */
export async function searchFichas(searchTerm) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('fichas_clinicas')
            .select('*')
            .eq('terapeuta_id', user.id)
            .or(`nombre_paciente.ilike.%${searchTerm}%,motivo_consulta.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        debugLog('🔍 Búsqueda completada:', data.length, 'resultados');
        return data;

    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        notifications.error('Error al buscar fichas');
        throw error;
    }
}

/**
 * Busca pacientes por RUT (para autocompletado)
 */
export async function searchPatientByRut(rut) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Buscar tanto con el formato original como limpio
        const searchRut = rut.trim();

        if (searchRut.length < 3) {
            return []; // No buscar si es muy corto
        }

        // Búsqueda flexible: busca el RUT tal como viene (con formato)
        const { data, error } = await supabase
            .from('fichas_clinicas')
            .select('*')
            .eq('terapeuta_id', user.id)
            .ilike('rut', `${searchRut}%`)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error en consulta de búsqueda:', error);
            throw error;
        }

        debugLog('🔍 Búsqueda por RUT:', data.length, 'pacientes encontrados');
        return data || [];

    } catch (error) {
        console.error('❌ Error al buscar por RUT:', error);
        return [];
    }
}

/**
 * =====================================================
 * ESTADÍSTICAS Y REPORTES
 * =====================================================
 */

/**
 * Obtiene estadísticas del dashboard
 */
export async function getDashboardStats() {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Llamar a la función de base de datos
        const { data, error } = await supabase
            .rpc('get_dashboard_stats', { terapeuta_uuid: user.id });

        if (error) throw error;

        debugLog('📊 Estadísticas obtenidas:', data);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        // No mostrar notificación de error aquí para no interrumpir la UX
        return {
            total_fichas: 0,
            fichas_mes_actual: 0,
            sesiones_mes_actual: 0,
            pacientes_nuevos_semana: 0
        };
    }
}

/**
 * Obtiene fichas con estadísticas
 */
export async function getFichasWithStats() {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .rpc('get_fichas_with_stats', { terapeuta_uuid: user.id });

        if (error) throw error;

        debugLog('📊 Fichas con stats obtenidas:', data.length);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener fichas con stats:', error);
        // Fallback: obtener fichas normales
        return await getFichasClinicas();
    }
}

/**
 * =====================================================
 * UTILIDADES
 * =====================================================
 */

/**
 * Verifica la conexión con Supabase
 */
export async function checkConnection() {
    try {
        const supabase = getSupabaseClient();

        // Intentar una consulta simple
        const { error } = await supabase
            .from('fichas_clinicas')
            .select('count')
            .limit(1);

        if (error) throw error;

        debugLog('✅ Conexión con Supabase OK');
        return true;

    } catch (error) {
        console.error('❌ Error de conexión con Supabase:', error);
        return false;
    }
}

/**
 * Exporta una ficha a JSON
 */
export function exportFichaToJSON(ficha) {
    const dataStr = JSON.stringify(ficha, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ficha-${ficha.nombre_paciente}-${ficha.id}.json`;
    link.click();

    URL.revokeObjectURL(url);

    notifications.success('Ficha exportada exitosamente!');
}

/**
 * Genera resumen de una ficha para imprimir
 */
export function generateFichaSummary(ficha) {
    return `
FICHA CLÍNICA DE ACUPUNTURA
===================================

DATOS DEL PACIENTE:
- Nombre: ${ficha.nombre_paciente}
- Edad: ${ficha.edad || 'No especificada'}
- Teléfono: ${ficha.telefono || 'No especificado'}
- Email: ${ficha.email || 'No especificado'}
- Ocupación: ${ficha.ocupacion || 'No especificada'}

MOTIVO DE CONSULTA:
${ficha.motivo_consulta}

DIAGNÓSTICO MTC:
${JSON.stringify(ficha.datos_mtc, null, 2)}

SÍNTOMAS GENERALES:
${JSON.stringify(ficha.sintomas_generales, null, 2)}

DATOS DEL DOLOR:
${JSON.stringify(ficha.datos_dolor, null, 2)}

DIAGNÓSTICO Y TRATAMIENTO:
${ficha.diagnostico_terapeuta || 'No especificado'}

PLAN DE TRATAMIENTO:
${ficha.plan_tratamiento || 'No especificado'}

PUNTOS DE ACUPUNTURA:
${ficha.puntos_acupuntura?.join(', ') || 'No especificados'}

TÉCNICAS APLICADAS:
${ficha.tecnicas_aplicadas?.join(', ') || 'No especificadas'}

RECOMENDACIONES:
${ficha.recomendaciones || 'No especificadas'}

===================================
Fecha de creación: ${new Date(ficha.created_at).toLocaleString('es-ES')}
Consentimiento: ${ficha.consentimiento_aceptado ? 'Sí' : 'No'}
    `.trim();
}
