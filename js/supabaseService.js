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
 * Crea una nueva sesión de acupuntura
 * Requiere que el paciente ya exista en la tabla pacientes
 */
export async function createSesionAcupuntura(sesionData) {
    try {
        // loader.show() es manejado por formManager.js, no lo llamamos aquí para evitar modales conflictivos
        // loader.show('Guardando sesión de acupuntura...');

        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener el número de sesión actual para este paciente
        const { data: sesiones, error: countError } = await supabase
            .from('sesiones_acupuntura')
            .select('numero_sesion')
            .eq('paciente_id', sesionData.paciente_id)
            .order('numero_sesion', { ascending: false })
            .limit(1);

        if (countError) throw countError;

        const nextNumero = sesiones && sesiones.length > 0
            ? sesiones[0].numero_sesion + 1
            : 1;

        // Preparar datos para inserción
        const payload = {
            paciente_id: sesionData.paciente_id,
            profesional_id: user.id,

            // Datos de la sesión
            motivo_consulta: sesionData.motivo_consulta,
            fecha_sesion: sesionData.fecha_sesion || new Date().toISOString(),
            numero_sesion: nextNumero,

            // Diagnóstico MTC
            datos_mtc: sesionData.datos_mtc || {},
            diagnostico_mtc: sesionData.diagnostico_mtc || null,

            // Síntomas y dolor
            sintomas_generales: sesionData.sintomas_generales || {},
            datos_dolor: sesionData.datos_dolor || {},

            // Puntos y técnicas
            puntos_acupuntura: sesionData.puntos_acupuntura || [],
            tecnicas_aplicadas: sesionData.tecnicas_aplicadas || [],

            // Detalles
            duracion_minutos: sesionData.duracion_minutos || null,
            recomendaciones: sesionData.recomendaciones || null,
            observaciones: sesionData.observaciones || null,
            proxima_cita: sesionData.proxima_cita || null
        };

        debugLog('📤 Enviando sesión de acupuntura a Supabase:', payload);

        const { data, error } = await supabase
            .from('sesiones_acupuntura')
            .insert([payload])
            .select()
            .single();

        // loader.hide() es manejado por formManager.js
        // loader.hide();

        if (error) {
            console.error('❌ Error de Supabase:', error);
            console.error('📋 Detalles del error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        debugLog('✅ Sesión de acupuntura creada:', data.id);
        return data;

    } catch (error) {
        // loader.hide() es manejado por formManager.js
        // loader.hide();
        console.error('❌ Error al crear sesión:', error);

        let errorMsg = 'Error al guardar la sesión de acupuntura';
        if (error.message) {
            errorMsg += ': ' + error.message;
        }

        notifications.error(errorMsg);
        throw error;
    }
}

/**
 * Crea una nueva sesión de kinesiología
 * Requiere que el paciente ya exista en la tabla pacientes
 */
export async function createSesionKinesiologia(sesionData) {
    try {
        // loader.show() es manejado por formManager.js, no lo llamamos aquí para evitar modales conflictivos
        // loader.show('Guardando sesión de kinesiología...');

        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener el número de sesión actual para este paciente
        const { data: sesiones, error: countError } = await supabase
            .from('sesiones_kinesiologia')
            .select('numero_sesion')
            .eq('paciente_id', sesionData.paciente_id)
            .order('numero_sesion', { ascending: false })
            .limit(1);

        if (countError) throw countError;

        const nextNumero = sesiones && sesiones.length > 0
            ? sesiones[0].numero_sesion + 1
            : 1;

        // Preparar datos para inserción
        const payload = {
            paciente_id: sesionData.paciente_id,
            profesional_id: user.id,

            // Datos de la sesión
            motivo_consulta: sesionData.motivo_consulta,
            fecha_sesion: sesionData.fecha_sesion || new Date().toISOString(),
            numero_sesion: nextNumero,

            // Evaluación funcional (mapeo de nombres)
            movilidad_articular: sesionData.evaluacion_funcional?.movilidad || null,
            fuerza_muscular: sesionData.evaluacion_funcional?.fuerza || null,
            analisis_postural: sesionData.evaluacion_funcional?.postura || null,

            // Evaluación del dolor
            ubicacion_dolor: sesionData.evaluacion_dolor?.ubicaciones || [],
            intensidad_dolor: sesionData.evaluacion_dolor?.intensidad || null,
            caracteristicas_dolor: sesionData.evaluacion_dolor?.caracteristicas || null,

            // Pruebas especiales y diagnóstico
            tests_especiales: sesionData.pruebas_diagnostico?.tests || null,
            diagnostico: sesionData.pruebas_diagnostico?.diagnostico || null,

            // Plan de tratamiento
            objetivos_tratamiento: sesionData.plan_tratamiento?.objetivos || null,
            frecuencia_sesiones: sesionData.plan_tratamiento?.frecuencia || null,
            duracion_estimada: sesionData.plan_tratamiento?.duracion || null,
            ejercicios_casa: sesionData.plan_tratamiento?.ejercicios_casa || null,

            // Técnicas aplicadas
            tecnicas_aplicadas: sesionData.tecnicas_aplicadas || [],

            // Detalles
            duracion_minutos: sesionData.duracion_minutos || null,
            recomendaciones: sesionData.recomendaciones || null,
            observaciones: sesionData.observaciones || null,
            proxima_cita: sesionData.proxima_cita || null,

            // Consentimiento informado
            consentimiento_informado: sesionData.consentimiento_informado || false
        };

        debugLog('📤 Enviando sesión de kinesiología a Supabase:', payload);

        const { data, error } = await supabase
            .from('sesiones_kinesiologia')
            .insert([payload])
            .select()
            .single();

        // loader.hide() es manejado por formManager.js
        // loader.hide();

        if (error) {
            console.error('❌ Error de Supabase:', error);
            console.error('📋 Detalles del error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        debugLog('✅ Sesión de kinesiología creada:', data.id);
        return data;

    } catch (error) {
        // loader.hide() es manejado por formManager.js
        // loader.hide();
        console.error('❌ Error al crear sesión:', error);

        let errorMsg = 'Error al guardar la sesión de kinesiología';
        if (error.message) {
            errorMsg += ': ' + error.message;
        }

        notifications.error(errorMsg);
        throw error;
    }
}

/**
 * Obtiene todas las sesiones de acupuntura del terapeuta
 */
export async function getSesionesAcupuntura(filters = {}) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        let query = supabase
            .from('sesiones_acupuntura')
            .select('*, pacientes(rut, nombre_completo)')
            .eq('profesional_id', user.id)
            .order('fecha_sesion', { ascending: false });

        // Aplicar filtros opcionales
        if (filters.paciente_id) {
            query = query.eq('paciente_id', filters.paciente_id);
        }

        if (filters.nombre_paciente) {
            query = query.ilike('pacientes.nombre_completo', `%${filters.nombre_paciente}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        debugLog('✅ Sesiones de acupuntura obtenidas:', data.length);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener sesiones de acupuntura:', error);
        notifications.error('Error al cargar las sesiones');
        throw error;
    }
}

/**
 * Obtiene todas las sesiones de kinesiología del terapeuta
 */
export async function getSesionesKinesiologia(filters = {}) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        let query = supabase
            .from('sesiones_kinesiologia')
            .select('*, pacientes(rut, nombre_completo)')
            .eq('profesional_id', user.id)
            .order('fecha_sesion', { ascending: false });

        // Aplicar filtros opcionales
        if (filters.paciente_id) {
            query = query.eq('paciente_id', filters.paciente_id);
        }

        if (filters.nombre_paciente) {
            query = query.ilike('pacientes.nombre_completo', `%${filters.nombre_paciente}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        debugLog('✅ Sesiones de kinesiología obtenidas:', data.length);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener sesiones de kinesiología:', error);
        notifications.error('Error al cargar las sesiones');
        throw error;
    }
}

/**
 * Obtiene una sesión de acupuntura específica por ID
 */
export async function getSesionAcupunturaById(sesionId) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('sesiones_acupuntura')
            .select('*, pacientes(*)')
            .eq('id', sesionId)
            .eq('profesional_id', user.id)
            .single();

        if (error) throw error;

        debugLog('✅ Sesión de acupuntura obtenida:', data.id);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener sesión:', error);
        notifications.error('Error al cargar la sesión');
        throw error;
    }
}

/**
 * Obtiene una sesión de kinesiología específica por ID
 */
export async function getSesionKinesiologiaById(sesionId) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('sesiones_kinesiologia')
            .select('*, pacientes(*)')
            .eq('id', sesionId)
            .eq('profesional_id', user.id)
            .single();

        if (error) throw error;

        debugLog('✅ Sesión de kinesiología obtenida:', data.id);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener sesión:', error);
        notifications.error('Error al cargar la sesión');
        throw error;
    }
}

/**
 * Valida que el RUT del paciente coincida con el RUT de una sesión
 * IMPORTANTE: Previene actualizaciones cruzadas entre pacientes
 */
export async function validateSessionPatientRut(sesionId, sessionType, expectedRut) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const tabla = sessionType === 'acupuntura' ? 'sesiones_acupuntura' : 'sesiones_kinesiologia';

        // Obtener la sesión con datos del paciente
        const { data, error } = await supabase
            .from(tabla)
            .select('id, paciente_id, pacientes(rut)')
            .eq('id', sesionId)
            .eq('profesional_id', user.id)
            .single();

        if (error || !data) {
            throw new Error(`Sesión no encontrada: ${sesionId}`);
        }

        // Obtener el RUT del paciente asociado a la sesión
        const sesionPatientRut = data.pacientes?.rut;

        // Comparar RUTs (normalizados)
        const normalizedExpectedRut = (expectedRut || '').replace(/[.\-]/g, '').trim();
        const normalizedSessionRut = (sesionPatientRut || '').replace(/[.\-]/g, '').trim();

        if (normalizedExpectedRut !== normalizedSessionRut) {
            throw new Error(
                `Conflicto de paciente: Intento de actualizar sesión del paciente ${normalizedSessionRut} ` +
                `con datos del paciente ${normalizedExpectedRut}. Por seguridad, esta operación ha sido rechazada.`
            );
        }

        debugLog('✅ Validación de RUT exitosa para sesión:', sesionId);
        return true;

    } catch (error) {
        console.error('❌ Error en validación de RUT:', error);
        throw error;
    }
}

/**
 * Actualiza una sesión de acupuntura
 */
export async function updateSesionAcupuntura(sesionId, updates) {
    try {
        // loader.show() es manejado por formManager.js, no lo llamamos aquí para evitar modales conflictivos
        // loader.show('Actualizando sesión...');

        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('sesiones_acupuntura')
            .update(updates)
            .eq('id', sesionId)
            .eq('profesional_id', user.id)
            .select()
            .single();

        // loader.hide() es manejado por formManager.js
        // loader.hide();

        if (error) throw error;

        notifications.success('Sesión actualizada exitosamente!');
        debugLog('✅ Sesión actualizada:', data.id);

        return data;

    } catch (error) {
        // loader.hide() es manejado por formManager.js
        // loader.hide();
        console.error('❌ Error al actualizar sesión:', error);
        notifications.error('Error al actualizar la sesión');
        throw error;
    }
}

/**
 * Actualiza una sesión de kinesiología
 */
export async function updateSesionKinesiologia(sesionId, updates) {
    try {
        // loader.show() es manejado por formManager.js, no lo llamamos aquí para evitar modales conflictivos
        // loader.show('Actualizando sesión...');

        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Mapear datos a nombres de columnas correctas
        const mappedUpdates = {};

        // Mapear campos de evaluación funcional
        if (updates.evaluacion_funcional) {
            mappedUpdates.movilidad_articular = updates.evaluacion_funcional.movilidad || null;
            mappedUpdates.fuerza_muscular = updates.evaluacion_funcional.fuerza || null;
            mappedUpdates.analisis_postural = updates.evaluacion_funcional.postura || null;
        }

        // Mapear campos de evaluación del dolor
        if (updates.evaluacion_dolor) {
            mappedUpdates.ubicacion_dolor = updates.evaluacion_dolor.ubicaciones || [];
            mappedUpdates.intensidad_dolor = updates.evaluacion_dolor.intensidad || null;
            mappedUpdates.caracteristicas_dolor = updates.evaluacion_dolor.caracteristicas || null;
        }

        // Mapear campos de pruebas diagnóstico
        if (updates.pruebas_diagnostico) {
            mappedUpdates.tests_especiales = updates.pruebas_diagnostico.tests || null;
            mappedUpdates.diagnostico = updates.pruebas_diagnostico.diagnostico || null;
        }

        // Mapear campos de plan de tratamiento
        if (updates.plan_tratamiento) {
            mappedUpdates.objetivos_tratamiento = updates.plan_tratamiento.objetivos || null;
            mappedUpdates.frecuencia_sesiones = updates.plan_tratamiento.frecuencia || null;
            mappedUpdates.duracion_estimada = updates.plan_tratamiento.duracion || null;
            mappedUpdates.ejercicios_casa = updates.plan_tratamiento.ejercicios_casa || null;
        }

        // Copiar otros campos que no necesitan mapeo
        if (updates.motivo_consulta !== undefined) mappedUpdates.motivo_consulta = updates.motivo_consulta;
        if (updates.tecnicas_aplicadas !== undefined) mappedUpdates.tecnicas_aplicadas = updates.tecnicas_aplicadas;
        if (updates.recomendaciones !== undefined) mappedUpdates.recomendaciones = updates.recomendaciones;
        if (updates.consentimiento_informado !== undefined) mappedUpdates.consentimiento_informado = updates.consentimiento_informado;
        if (updates.duracion_minutos !== undefined) mappedUpdates.duracion_minutos = updates.duracion_minutos;
        if (updates.observaciones !== undefined) mappedUpdates.observaciones = updates.observaciones;
        if (updates.proxima_cita !== undefined) mappedUpdates.proxima_cita = updates.proxima_cita;

        debugLog('📤 Actualizando sesión de kinesiología con:', mappedUpdates);

        const { data, error } = await supabase
            .from('sesiones_kinesiologia')
            .update(mappedUpdates)
            .eq('id', sesionId)
            .eq('profesional_id', user.id)
            .select()
            .single();

        // loader.hide() es manejado por formManager.js
        // loader.hide();

        if (error) throw error;

        notifications.success('Sesión actualizada exitosamente!');
        debugLog('✅ Sesión actualizada:', data.id);

        return data;

    } catch (error) {
        // loader.hide() es manejado por formManager.js
        // loader.hide();
        console.error('❌ Error al actualizar sesión:', error);
        notifications.error('Error al actualizar la sesión');
        throw error;
    }
}

/**
 * Elimina una sesión de acupuntura
 */
export async function deleteSesionAcupuntura(sesionId) {
    try {
        loader.show('Eliminando sesión...');

        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const result = await supabase
            .from('sesiones_acupuntura')
            .delete()
            .eq('id', sesionId)
            .eq('profesional_id', user.id);

        loader.hide();

        if (result.error) throw result.error;

        notifications.success('Sesión eliminada');
        debugLog('✅ Sesión eliminada:', sesionId);

        return result.data;

    } catch (error) {
        loader.hide();
        console.error('❌ Error al eliminar sesión:', error);
        notifications.error('Error al eliminar la sesión');
        throw error;
    }
}

/**
 * Elimina una sesión de kinesiología
 */
export async function deleteSesionKinesiologia(sesionId) {
    try {
        loader.show('Eliminando sesión...');

        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const result = await supabase
            .from('sesiones_kinesiologia')
            .delete()
            .eq('id', sesionId)
            .eq('profesional_id', user.id);

        loader.hide();

        if (result.error) throw result.error;

        notifications.success('Sesión eliminada');
        debugLog('✅ Sesión eliminada:', sesionId);

        return result.data;

    } catch (error) {
        loader.hide();
        console.error('❌ Error al eliminar sesión:', error);
        notifications.error('Error al eliminar la sesión');
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
 * Busca sesiones de acupuntura por texto (paciente o motivo)
 */
export async function searchSesionesAcupuntura(searchTerm) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('sesiones_acupuntura')
            .select('*, pacientes(rut, nombre_completo)')
            .eq('profesional_id', user.id)
            .or(`motivo_consulta.ilike.%${searchTerm}%,pacientes.nombre_completo.ilike.%${searchTerm}%`)
            .order('fecha_sesion', { ascending: false });

        if (error) throw error;

        debugLog('🔍 Búsqueda de sesiones completada:', data.length, 'resultados');
        return data;

    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        notifications.error('Error al buscar sesiones');
        throw error;
    }
}

/**
 * Busca sesiones de kinesiología por texto (paciente o motivo)
 */
export async function searchSesionesKinesiologia(searchTerm) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('sesiones_kinesiologia')
            .select('*, pacientes(rut, nombre_completo)')
            .eq('profesional_id', user.id)
            .or(`motivo_consulta.ilike.%${searchTerm}%,pacientes.nombre_completo.ilike.%${searchTerm}%`)
            .order('fecha_sesion', { ascending: false });

        if (error) throw error;

        debugLog('🔍 Búsqueda de sesiones completada:', data.length, 'resultados');
        return data;

    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        notifications.error('Error al buscar sesiones');
        throw error;
    }
}

/**
 * Busca pacientes por RUT (para autocompletado)
 * IMPORTANTE: Busca en la tabla 'pacientes' para evitar duplicados
 */
export async function searchPatientByRut(rut) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Limpiar el RUT de búsqueda (ya viene limpio desde el frontend)
        const searchRut = rut.trim();

        if (searchRut.length < 1) {
            return []; // No buscar si está vacío
        }

        // Estrategia de búsqueda: Obtener todos los pacientes del terapeuta
        // y filtrar en el cliente comparando RUTs sin formato
        // Esto evita problemas de formato (puntos y guiones) y es más confiable
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .eq('terapeuta_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error en consulta de búsqueda:', error);
            throw error;
        }

        // Filtrar en el cliente comparando RUTs limpios
        const filtered = (data || []).filter(p => {
            const cleanDbRut = (p.rut || '').replace(/[.\-]/g, '').toLowerCase();
            const cleanSearchRut = searchRut.replace(/[.\-]/g, '').toLowerCase();
            return cleanDbRut.startsWith(cleanSearchRut);
        }).slice(0, 5);

        debugLog('🔍 Búsqueda por RUT en tabla pacientes:', filtered.length, 'pacientes encontrados');
        return filtered;

    } catch (error) {
        console.error('❌ Error al buscar por RUT:', error);
        return [];
    }
}

/**
 * Obtiene el historial de sesiones (acupuntura + kinesiología) de un paciente por RUT
 */
export async function getPatientSessionHistoryByRut(rut) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Primero obtener el paciente por RUT
        const { data: paciente, error: patientError } = await supabase
            .from('pacientes')
            .select('id')
            .eq('rut', rut)
            .eq('terapeuta_id', user.id)
            .single();

        if (patientError || !paciente) {
            debugLog('ℹ️ Paciente no encontrado con RUT:', rut);
            return [];
        }

        // Obtener sesiones de acupuntura
        const { data: acupuntura, error: acupunturaError } = await supabase
            .from('sesiones_acupuntura')
            .select('id, fecha_sesion, motivo_consulta, numero_sesion')
            .eq('paciente_id', paciente.id)
            .order('fecha_sesion', { ascending: false });

        if (acupunturaError) {
            console.error('Error al obtener sesiones de acupuntura:', acupunturaError);
        }

        // Obtener sesiones de kinesiología
        const { data: kinesiologia, error: kinesiologiaError } = await supabase
            .from('sesiones_kinesiologia')
            .select('id, fecha_sesion, motivo_consulta, numero_sesion')
            .eq('paciente_id', paciente.id)
            .order('fecha_sesion', { ascending: false });

        if (kinesiologiaError) {
            console.error('Error al obtener sesiones de kinesiología:', kinesiologiaError);
        }

        // Combinar y ordenar todas las sesiones
        const allSessions = [
            ...(acupuntura || []).map(s => ({ ...s, tipo: 'acupuntura' })),
            ...(kinesiologia || []).map(s => ({ ...s, tipo: 'kinesiologia' }))
        ].sort((a, b) => new Date(b.fecha_sesion) - new Date(a.fecha_sesion));

        debugLog('📋 Historial obtenido:', allSessions.length, 'sesiones');
        return allSessions;

    } catch (error) {
        console.error('❌ Error al obtener historial del paciente:', error);
        return [];
    }
}

/**
 * =====================================================
 * GESTIÓN DE PACIENTES (Tabla pacientes)
 * =====================================================
 */

/**
 * Busca un paciente en la tabla pacientes por RUT
 */
export async function getPatientByRut(rut) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        if (!rut) {
            return null;
        }

        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .eq('terapeuta_id', user.id)
            .eq('rut', rut.trim())
            .single();

        if (error) {
            // Si no existe, error.code será 'PGRST116'
            if (error.code === 'PGRST116') {
                debugLog('ℹ️ Paciente no existe en tabla pacientes:', rut);
                return null;
            }
            throw error;
        }

        debugLog('✅ Paciente encontrado en tabla pacientes:', data);
        return data;

    } catch (error) {
        console.error('❌ Error al buscar paciente:', error);
        return null;
    }
}

/**
 * Crea o actualiza un paciente en la tabla pacientes
 * Asegura que solo exista un paciente por RUT
 */
export async function createOrUpdatePatient(patientData) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        if (!patientData.rut) {
            debugLog('⚠️ No se puede crear/actualizar paciente sin RUT');
            return null;
        }

        // Verificar si el paciente ya existe
        const existingPatient = await getPatientByRut(patientData.rut);

        const payload = {
            terapeuta_id: user.id,
            rut: patientData.rut,
            nombre_completo: patientData.nombre_paciente,
            fecha_nacimiento: patientData.fecha_nacimiento || null,
            telefono: patientData.telefono || null,
            email: patientData.email || null,
            direccion: patientData.direccion || null,
            ocupacion: patientData.ocupacion || null,
            // Campos médicos se pueden agregar después
            alergias: null,
            medicamentos_actuales: null,
            condiciones_medicas: null
        };

        if (existingPatient) {
            // Actualizar paciente existente
            const { data, error } = await supabase
                .from('pacientes')
                .update(payload)
                .eq('id', existingPatient.id)
                .select()
                .single();

            if (error) throw error;

            debugLog('✅ Paciente actualizado:', data);
            return data;
        } else {
            // Crear nuevo paciente
            const { data, error } = await supabase
                .from('pacientes')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            debugLog('✅ Nuevo paciente creado:', data);
            return data;
        }

    } catch (error) {
        console.error('❌ Error al crear/actualizar paciente:', error);
        throw error;
    }
}

/**
 * Elimina un paciente y todas sus sesiones por RUT
 * PELIGRO: Esta operación es irreversible
 */
export async function deletePatientByRut(rut) {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        if (!rut) {
            throw new Error('RUT no proporcionado');
        }

        debugLog('🗑️ Iniciando eliminación de paciente con RUT:', rut);

        // 1. Obtener el ID del paciente por RUT
        const { data: paciente, error: pacienteSearchError } = await supabase
            .from('pacientes')
            .select('id')
            .eq('terapeuta_id', user.id)
            .eq('rut', rut)
            .single();

        if (pacienteSearchError || !paciente) {
            throw new Error('Paciente no encontrado con RUT: ' + rut);
        }

        const pacienteId = paciente.id;
        debugLog('✅ Paciente encontrado con ID:', pacienteId);

        // 2. Eliminar todas las sesiones de acupuntura del paciente
        const { error: acupunturaError } = await supabase
            .from('sesiones_acupuntura')
            .delete()
            .eq('paciente_id', pacienteId)
            .eq('profesional_id', user.id);

        if (acupunturaError) {
            console.error('Error al eliminar sesiones de acupuntura:', acupunturaError);
            throw new Error('Error al eliminar sesiones de acupuntura: ' + acupunturaError.message);
        }

        debugLog('✅ Sesiones de acupuntura eliminadas');

        // 3. Eliminar todas las sesiones de kinesiología del paciente
        const { error: kinesiologiaError } = await supabase
            .from('sesiones_kinesiologia')
            .delete()
            .eq('paciente_id', pacienteId)
            .eq('profesional_id', user.id);

        if (kinesiologiaError) {
            console.error('Error al eliminar sesiones de kinesiología:', kinesiologiaError);
            throw new Error('Error al eliminar sesiones de kinesiología: ' + kinesiologiaError.message);
        }

        debugLog('✅ Sesiones de kinesiología eliminadas');

        // 4. Eliminar el registro del paciente
        const { error: pacienteDeleteError } = await supabase
            .from('pacientes')
            .delete()
            .eq('id', pacienteId)
            .eq('terapeuta_id', user.id);

        if (pacienteDeleteError) {
            console.error('Error al eliminar paciente:', pacienteDeleteError);
            throw new Error('Error al eliminar paciente: ' + pacienteDeleteError.message);
        }

        debugLog('✅ Paciente eliminado completamente');
        notifications.success('Paciente y todas sus sesiones eliminadas exitosamente');
        return { success: true, message: 'Paciente eliminado exitosamente' };

    } catch (error) {
        console.error('❌ Error al eliminar paciente:', error);
        notifications.error('Error al eliminar paciente: ' + error.message);
        throw error;
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

        // Obtener conteos de pacientes
        const { count: totalPacientes } = await supabase
            .from('pacientes')
            .select('*', { count: 'exact' })
            .eq('terapeuta_id', user.id);

        // Obtener sesiones del mes actual
        const fechaActual = new Date();
        const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1).toISOString();

        const { count: sesionesAcupunturaMes } = await supabase
            .from('sesiones_acupuntura')
            .select('*', { count: 'exact' })
            .eq('profesional_id', user.id)
            .gte('fecha_sesion', primerDiaMes);

        const { count: sesionesKinesiologiaMes } = await supabase
            .from('sesiones_kinesiologia')
            .select('*', { count: 'exact' })
            .eq('profesional_id', user.id)
            .gte('fecha_sesion', primerDiaMes);

        const sesionesTotal = (sesionesAcupunturaMes || 0) + (sesionesKinesiologiaMes || 0);

        debugLog('📊 Estadísticas obtenidas');
        return {
            total_pacientes: totalPacientes || 0,
            sesiones_mes_actual: sesionesTotal,
            sesiones_acupuntura_mes: sesionesAcupunturaMes || 0,
            sesiones_kinesiologia_mes: sesionesKinesiologiaMes || 0
        };

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        // No mostrar notificación de error aquí para no interrumpir la UX
        return {
            total_pacientes: 0,
            sesiones_mes_actual: 0,
            sesiones_acupuntura_mes: 0,
            sesiones_kinesiologia_mes: 0
        };
    }
}

/**
 * Obtiene sesiones de acupuntura con estadísticas
 */
export async function getSesionesAcupunturaWithStats() {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('sesiones_acupuntura')
            .select('*, pacientes(id, nombre_completo, rut)')
            .eq('profesional_id', user.id)
            .order('fecha_sesion', { ascending: false });

        if (error) throw error;

        debugLog('📊 Sesiones de acupuntura con stats obtenidas:', data.length);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener sesiones con stats:', error);
        return [];
    }
}

/**
 * Obtiene sesiones de kinesiología con estadísticas
 */
export async function getSesionesKinesiologiaWithStats() {
    try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('sesiones_kinesiologia')
            .select('*, pacientes(id, nombre_completo, rut)')
            .eq('profesional_id', user.id)
            .order('fecha_sesion', { ascending: false });

        if (error) throw error;

        debugLog('📊 Sesiones de kinesiología con stats obtenidas:', data.length);
        return data;

    } catch (error) {
        console.error('❌ Error al obtener sesiones con stats:', error);
        return [];
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
 * Exporta una sesión de acupuntura a JSON
 */
export function exportSesionAcupunturaToJSON(sesion, paciente) {
    const dataStr = JSON.stringify({ sesion, paciente }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `sesion-acupuntura-${paciente.nombre_completo}-${sesion.id}.json`;
    link.click();

    URL.revokeObjectURL(url);

    notifications.success('Sesión exportada exitosamente!');
}

/**
 * Exporta una sesión de kinesiología a JSON
 */
export function exportSesionKinesiologiaToJSON(sesion, paciente) {
    const dataStr = JSON.stringify({ sesion, paciente }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `sesion-kinesiologia-${paciente.nombre_completo}-${sesion.id}.json`;
    link.click();

    URL.revokeObjectURL(url);

    notifications.success('Sesión exportada exitosamente!');
}

/**
 * Genera resumen de una sesión de acupuntura para imprimir
 */
export function generateSesionAcupunturaSummary(sesion, paciente) {
    return `
FICHA DE SESIÓN DE ACUPUNTURA
===================================

DATOS DEL PACIENTE:
- Nombre: ${paciente.nombre_completo}
- RUT: ${paciente.rut}

DATOS DE LA SESIÓN:
- Fecha: ${new Date(sesion.fecha_sesion).toLocaleString('es-ES')}
- Sesión #: ${sesion.numero_sesion}
- Motivo de Consulta: ${sesion.motivo_consulta}

DIAGNÓSTICO MTC:
${sesion.diagnostico_mtc || 'No especificado'}

SÍNTOMAS GENERALES:
${JSON.stringify(sesion.sintomas_generales, null, 2)}

DATOS DEL DOLOR:
${JSON.stringify(sesion.datos_dolor, null, 2)}

PUNTOS DE ACUPUNTURA:
${sesion.puntos_acupuntura?.join(', ') || 'No especificados'}

TÉCNICAS APLICADAS:
${sesion.tecnicas_aplicadas?.join(', ') || 'No especificadas'}

DURACIÓN: ${sesion.duracion_minutos ? sesion.duracion_minutos + ' minutos' : 'No especificada'}

RECOMENDACIONES:
${sesion.recomendaciones || 'No especificadas'}

OBSERVACIONES:
${sesion.observaciones || 'No especificadas'}

PRÓXIMA CITA: ${sesion.proxima_cita ? new Date(sesion.proxima_cita).toLocaleString('es-ES') : 'Por agendar'}

===================================
Fecha de registro: ${new Date(sesion.created_at).toLocaleString('es-ES')}
    `.trim();
}

/**
 * Genera resumen de una sesión de kinesiología para imprimir
 */
export function generateSesionKinesiologiaSummary(sesion, paciente) {
    return `
FICHA DE SESIÓN DE KINESIOLOGÍA
===================================

DATOS DEL PACIENTE:
- Nombre: ${paciente.nombre_completo}
- RUT: ${paciente.rut}

DATOS DE LA SESIÓN:
- Fecha: ${new Date(sesion.fecha_sesion).toLocaleString('es-ES')}
- Sesión #: ${sesion.numero_sesion}
- Motivo de Consulta: ${sesion.motivo_consulta}

DIAGNÓSTICO:
${sesion.diagnostico || 'No especificado'}

PLAN DE TRATAMIENTO:
${sesion.plan_tratamiento || 'No especificado'}

TÉCNICAS APLICADAS:
${sesion.tecnicas_aplicadas?.join(', ') || 'No especificadas'}

DURACIÓN: ${sesion.duracion_minutos ? sesion.duracion_minutos + ' minutos' : 'No especificada'}

RECOMENDACIONES:
${sesion.recomendaciones || 'No especificadas'}

OBSERVACIONES:
${sesion.observaciones || 'No especificadas'}

PRÓXIMA CITA: ${sesion.proxima_cita ? new Date(sesion.proxima_cita).toLocaleString('es-ES') : 'Por agendar'}

===================================
Fecha de registro: ${new Date(sesion.created_at).toLocaleString('es-ES')}
    `.trim();
}
