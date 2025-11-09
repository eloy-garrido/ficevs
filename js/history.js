/**
 * history.js
 * Funciones para gestionar el historial de visitas de pacientes
 */

import { getPatientSessionHistoryByRut } from './supabaseService.js';

// Almacenar historial en memoria para acceso rápido
let patientHistoryCache = [];

// Estado actual de filtros
let filterState = {
    date: null,
    professional: 'all'
};

/**
 * Carga y muestra el historial de visitas del paciente
 * @param {string} rut - RUT del paciente
 */
export async function loadPatientHistory(rut) {
    try {
        const history = await getPatientSessionHistoryByRut(rut);

        const historySection = document.getElementById('patient-history');
        const historyTableBody = document.getElementById('history-table-body');
        const noHistoryMsg = document.getElementById('no-history-msg');

        if (!historySection || !historyTableBody) return;

        // Guardar historial en caché
        patientHistoryCache = history || [];

        // Limpiar tabla
        historyTableBody.innerHTML = '';

        if (history && history.length > 0) {
            // Llenar tabla con historial
            history.forEach((sesion, index) => {
                const fecha = new Date(sesion.fecha_sesion).toLocaleDateString('es-CL');
                const motivo = sesion.motivo_consulta || 'No especificado';
                const motivoTruncado = motivo.length > 50 ? motivo.substring(0, 50) + '...' : motivo;

                // Determinar tipo de sesión desde el campo tipo
                let tipo = 'No especificado';
                if (sesion.tipo === 'kinesiologia') {
                    tipo = 'Kinesiología';
                } else if (sesion.tipo === 'acupuntura') {
                    tipo = 'Acupuntura';
                }

                const row = document.createElement('tr');
                row.className = 'border-b border-purple-100 hover:bg-purple-50 transition-colors cursor-pointer';
                row.style.maxWidth = '100%';
                row.innerHTML = `
                    <td class="py-2 px-2 font-medium">${fecha}</td>
                    <td class="py-2 px-2 truncate-reason" title="${motivo}">${motivoTruncado}</td>
                    <td class="py-2 px-2">${tipo}</td>
                `;

                // Agregar evento click para abrir modal
                row.addEventListener('click', () => {
                    openSessionDetailModal(sesion);
                });

                historyTableBody.appendChild(row);
            });

            // Mostrar tabla, ocultar mensaje
            if (noHistoryMsg) noHistoryMsg.classList.add('hidden');
            historyTableBody.parentElement.classList.remove('hidden');
        } else {
            // Mostrar mensaje, ocultar tabla
            if (noHistoryMsg) noHistoryMsg.classList.remove('hidden');
            historyTableBody.parentElement.classList.add('hidden');
        }

        // Mostrar sección de historial pero con contenido oculto (expandible)
        historySection.classList.remove('hidden');
        historySection.classList.add('animate-fade-in');

        // Ocultar el contenido del historial por defecto
        hidePatientHistory();

    } catch (error) {
        console.error('Error al cargar historial:', error);
    }
}

/**
 * Abre el modal con los detalles completos de una sesión
 * @param {Object} sesion - Datos de la sesión
 */
export async function openSessionDetailModal(sesion) {
    const modal = document.getElementById('session-detail-modal');
    if (!modal) return;

    try {
        // Actualizar cabecera
        const fecha = new Date(sesion.fecha_sesion).toLocaleDateString('es-CL');
        const tipo = sesion.tipo === 'kinesiologia' ? 'Kinesiología' : 'Acupuntura';
        document.getElementById('modal-session-header').textContent = `${tipo} - ${fecha}`;

        // Motivo de consulta completo
        document.getElementById('modal-consultation-reason').textContent = sesion.motivo_consulta || 'Sin datos';

        // Cargar datos detallados de la sesión específica
        const sessionContent = document.getElementById('modal-session-content');
        sessionContent.innerHTML = '<p class="text-xs text-gray-500">Cargando información...</p>';

        // Obtener datos completos de la sesión según el tipo
        if (sesion.tipo === 'kinesiologia') {
            await loadKinesiologiaSessionDetails(sesion.id, sessionContent);
        } else if (sesion.tipo === 'acupuntura') {
            await loadAcupunturaSessionDetails(sesion.id, sessionContent);
        }

        // Mostrar modal
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error al abrir modal de sesión:', error);
        document.getElementById('modal-session-content').innerHTML =
            '<p class="text-sm text-red-600">Error al cargar los detalles de la sesión</p>';
    }
}

/**
 * Carga los detalles de una sesión de kinesiología
 */
async function loadKinesiologiaSessionDetails(sessionId, contentContainer) {
    try {
        const { getSupabaseClient, getCurrentUser } = await import('./auth.js');
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        // Obtener datos de la sesión
        const { data: sesion, error } = await supabase
            .from('sesiones_kinesiologia')
            .select('*')
            .eq('id', sessionId)
            .eq('profesional_id', user.id)
            .single();

        if (error || !sesion) {
            contentContainer.innerHTML = '<p class="text-sm text-gray-500">Sin datos disponibles</p>';
            return;
        }

        // Obtener datos del profesional (usuario actual)
        const { data: { user: userProfile }, error: userError } = await supabase.auth.getUser();
        const profesionalNombre = userProfile?.user_metadata?.nombre || user.email || 'Sin datos';

        const html = `
            <div class="space-y-3">
                <!-- Información del Profesional -->
                <div class="border-t pt-3">
                    <h4 class="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Kinesiológo</h4>
                    <p class="text-sm text-gray-900">${profesionalNombre}</p>
                </div>

                <!-- Evaluación Funcional -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Movilidad Articular</h4>
                    <p class="text-sm text-gray-900 bg-blue-50 p-2 rounded border border-blue-200">${sesion.movilidad_articular || 'Sin información'}</p>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Fuerza Muscular</h4>
                    <p class="text-sm text-gray-900 bg-blue-50 p-2 rounded border border-blue-200">${sesion.fuerza_muscular || 'Sin información'}</p>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Análisis Postural</h4>
                    <p class="text-sm text-gray-900 bg-blue-50 p-2 rounded border border-blue-200">${sesion.analisis_postural || 'Sin información'}</p>
                </div>

                <!-- Ubicación del Dolor -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Ubicación del Dolor</h4>
                    <p class="text-sm text-gray-900 bg-red-50 p-2 rounded border border-red-200">${sesion.ubicacion_dolor ? Object.values(sesion.ubicacion_dolor).filter(v => v).join(', ') || 'Sin información' : 'Sin información'}</p>
                </div>

                <!-- Evaluación del Dolor -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700">Intensidad del Dolor: <span class="text-red-600">${sesion.intensidad_dolor ? sesion.intensidad_dolor + '/10' : 'Sin información'}</span></h4>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Características del Dolor</h4>
                    <p class="text-sm text-gray-900 bg-red-50 p-2 rounded border border-red-200">${sesion.caracteristicas_dolor || 'Sin información'}</p>
                </div>

                <!-- Pruebas Especiales -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Pruebas Especiales</h4>
                    <p class="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">${sesion.tests_especiales || 'Sin información'}</p>
                </div>

                <!-- Diagnóstico -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Diagnóstico Kinesiológico</h4>
                    <p class="text-sm text-gray-900 bg-purple-50 p-2 rounded border border-purple-200">${sesion.diagnostico || 'Sin información'}</p>
                </div>

                <!-- Plan de Tratamiento -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Plan de Tratamiento</h4>
                    <p class="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">${sesion.plan_tratamiento || 'Sin información'}</p>
                </div>

                <!-- Objetivos -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Objetivos del Tratamiento</h4>
                    <p class="text-sm text-gray-900 bg-yellow-50 p-2 rounded border border-yellow-200">${sesion.objetivos_tratamiento || 'Sin información'}</p>
                </div>

                <!-- Técnicas Aplicadas -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Técnicas Aplicadas</h4>
                    <div class="text-sm text-gray-900 bg-yellow-50 p-2 rounded border border-yellow-200">
                        ${sesion.tecnicas_aplicadas && sesion.tecnicas_aplicadas.length > 0 ? sesion.tecnicas_aplicadas.join(', ') : 'Sin información'}
                    </div>
                </div>

                <!-- Frecuencia y Duración -->
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <h4 class="text-xs font-bold text-gray-700">Frecuencia de Sesiones</h4>
                        <p class="text-gray-900">${sesion.frecuencia_sesiones || 'Sin información'}</p>
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-gray-700">Duración Estimada</h4>
                        <p class="text-gray-900">${sesion.duracion_estimada || 'Sin información'}</p>
                    </div>
                </div>

                <!-- Duración de la Sesión -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700">Duración de Sesión:</h4>
                    <p class="text-sm text-gray-900">${sesion.duracion_minutos ? sesion.duracion_minutos + ' minutos' : 'Sin información'}</p>
                </div>

                <!-- Ejercicios en Casa -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Ejercicios en Casa / Recomendaciones</h4>
                    <p class="text-sm text-gray-900 bg-indigo-50 p-2 rounded border border-indigo-200">${sesion.ejercicios_casa || 'Sin información'}</p>
                </div>

                <!-- Consentimiento Informado -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700">Consentimiento Informado:</h4>
                    <p class="text-sm text-gray-900">${sesion.consentimiento_informado ? '✓ Consentimiento otorgado' : 'Sin consentimiento registrado'}</p>
                </div>

                <!-- Recomendaciones -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Recomendaciones</h4>
                    <p class="text-sm text-gray-900 bg-purple-50 p-2 rounded border border-purple-200">${sesion.recomendaciones || 'Sin información'}</p>
                </div>

                <!-- Observaciones -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Observaciones</h4>
                    <p class="text-sm text-gray-900 bg-gray-100 p-2 rounded border border-gray-300">${sesion.observaciones || 'Sin información'}</p>
                </div>
            </div>
        `;

        contentContainer.innerHTML = html || '<p class="text-sm text-gray-500">Sin datos adicionales disponibles</p>';
    } catch (error) {
        console.error('Error al cargar detalles de kinesiología:', error);
        contentContainer.innerHTML = '<p class="text-sm text-gray-500">Sin datos disponibles</p>';
    }
}

/**
 * Carga los detalles de una sesión de acupuntura
 */
async function loadAcupunturaSessionDetails(sessionId, contentContainer) {
    try {
        const { getSupabaseClient, getCurrentUser } = await import('./auth.js');
        const supabase = getSupabaseClient();
        const user = await getCurrentUser();

        // Obtener datos de la sesión
        const { data: sesion, error } = await supabase
            .from('sesiones_acupuntura')
            .select('*')
            .eq('id', sessionId)
            .eq('profesional_id', user.id)
            .single();

        if (error || !sesion) {
            contentContainer.innerHTML = '<p class="text-sm text-gray-500">Sin datos disponibles</p>';
            return;
        }

        // Obtener datos del profesional (usuario actual)
        const { data: { user: userProfile }, error: userError } = await supabase.auth.getUser();
        const profesionalNombre = userProfile?.user_metadata?.nombre || user.email || 'Sin datos';

        const html = `
            <div class="space-y-3">
                <!-- Información del Profesional -->
                <div class="border-t pt-3">
                    <h4 class="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Acupuntor</h4>
                    <p class="text-sm text-gray-900">${profesionalNombre}</p>
                </div>

                <!-- Evaluación Lengua -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Lengua - Color</h4>
                    <p class="text-sm text-gray-900 bg-blue-50 p-2 rounded border border-blue-200">${sesion.lengua_color || 'Sin información'}</p>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Lengua - Saburra</h4>
                    <p class="text-sm text-gray-900 bg-blue-50 p-2 rounded border border-blue-200">${sesion.lengua_saburra || 'Sin información'}</p>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Lengua - Forma</h4>
                    <p class="text-sm text-gray-900 bg-blue-50 p-2 rounded border border-blue-200">${sesion.lengua_forma || 'Sin información'}</p>
                </div>

                <!-- Evaluación Pulso -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Pulso - Profundidad</h4>
                    <p class="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">${sesion.pulso_profundidad || 'Sin información'}</p>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Pulso - Velocidad</h4>
                    <p class="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">${sesion.pulso_velocidad || 'Sin información'}</p>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Pulso - Fuerza</h4>
                    <p class="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">${sesion.pulso_fuerza || 'Sin información'}</p>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Pulso - Calidad</h4>
                    <p class="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">${sesion.pulso_calidad || 'Sin información'}</p>
                </div>

                <!-- Síntomas Generales -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Síntomas Principales</h4>
                    <p class="text-sm text-gray-900 bg-yellow-50 p-2 rounded border border-yellow-200">${sesion.sintomas || 'Sin información'}</p>
                </div>

                <!-- Emociones -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Estado Emocional</h4>
                    <p class="text-sm text-gray-900 bg-purple-50 p-2 rounded border border-purple-200">${sesion.emociones || 'Sin información'}</p>
                </div>

                <!-- Evaluación del Dolor -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700">Intensidad del Dolor: <span class="text-red-600">${sesion.dolor_intensidad ? sesion.dolor_intensidad + '/10' : 'Sin información'}</span></h4>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Frecuencia del Dolor</h4>
                    <p class="text-sm text-gray-900 bg-red-50 p-2 rounded border border-red-200">${sesion.dolor_frecuencia || 'Sin información'}</p>
                </div>

                <!-- Factores de Alivio/Agravación -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">¿Qué alivia el dolor?</h4>
                    <p class="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">${sesion.factores_alivio || 'Sin información'}</p>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">¿Qué agrava el dolor?</h4>
                    <p class="text-sm text-gray-900 bg-red-50 p-2 rounded border border-red-200">${sesion.factores_agravacion || 'Sin información'}</p>
                </div>

                <!-- Diagnóstico MTC -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Diagnóstico (MTC)</h4>
                    <p class="text-sm text-gray-900 bg-blue-50 p-2 rounded border border-blue-200">${sesion.diagnostico_mtc || 'Sin información'}</p>
                </div>

                <!-- Plan de Tratamiento -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Plan de Tratamiento</h4>
                    <p class="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">${sesion.plan_tratamiento || 'Sin información'}</p>
                </div>

                <!-- Puntos de Acupuntura -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Puntos de Acupuntura</h4>
                    <div class="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">
                        ${sesion.puntos_acupuntura ? (Array.isArray(sesion.puntos_acupuntura) ? sesion.puntos_acupuntura.join(', ') : sesion.puntos_acupuntura) : 'Sin información'}
                    </div>
                </div>

                <!-- Técnicas Aplicadas -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Técnicas Aplicadas</h4>
                    <div class="text-sm text-gray-900 bg-yellow-50 p-2 rounded border border-yellow-200">
                        ${sesion.tecnicas_aplicadas && sesion.tecnicas_aplicadas.length > 0 ? sesion.tecnicas_aplicadas.join(', ') : 'Sin información'}
                    </div>
                </div>

                <!-- Duración -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700">Duración:</h4>
                    <p class="text-sm text-gray-900">${sesion.duracion_minutos ? sesion.duracion_minutos + ' minutos' : 'Sin información'}</p>
                </div>

                <!-- Recomendaciones -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Recomendaciones</h4>
                    <p class="text-sm text-gray-900 bg-purple-50 p-2 rounded border border-purple-200">${sesion.recomendaciones || 'Sin información'}</p>
                </div>

                <!-- Observaciones -->
                <div>
                    <h4 class="text-xs font-bold text-gray-700 mb-1">Observaciones</h4>
                    <p class="text-sm text-gray-900 bg-gray-100 p-2 rounded border border-gray-300">${sesion.observaciones || 'Sin información'}</p>
                </div>
            </div>
        `;

        contentContainer.innerHTML = html || '<p class="text-sm text-gray-500">Sin datos disponibles</p>';
    } catch (error) {
        console.error('Error al cargar detalles de acupuntura:', error);
        contentContainer.innerHTML = '<p class="text-sm text-gray-500">Sin datos disponibles</p>';
    }
}

/**
 * Cierra el modal de detalles de sesión
 */
export function closeSessionDetailModal() {
    const modal = document.getElementById('session-detail-modal');
    if (!modal) return;
    modal.classList.add('hidden');
}

/**
 * Oculta el contenido del historial y muestra un botón para volver a abrirlo
 */
export function hidePatientHistory() {
    const historyContent = document.getElementById('history-content');
    const showHistoryBtn = document.getElementById('show-history-btn-container');

    if (historyContent) {
        historyContent.classList.add('hidden');
    }
    if (showHistoryBtn) {
        showHistoryBtn.classList.remove('hidden');
    }
}

/**
 * Muestra el contenido del historial y oculta el botón de mostrar
 */
export function showPatientHistory() {
    const historyContent = document.getElementById('history-content');
    const showHistoryBtn = document.getElementById('show-history-btn-container');

    if (historyContent) {
        historyContent.classList.remove('hidden');
    }
    if (showHistoryBtn) {
        showHistoryBtn.classList.add('hidden');
    }
}

/**
 * Filtra la tabla de historial por fecha
 */
function filterHistoryByDate() {
    const dateFilter = document.getElementById('history-date-filter').value;
    filterState.date = dateFilter;
    applyAllFilters();
}

/**
 * Limpia el filtro de fecha y muestra todas las filas
 */
function clearDateFilter() {
    const dateFilter = document.getElementById('history-date-filter');
    const noFilteredResultsMsg = document.getElementById('no-filtered-results-msg');
    const historyTableBody = document.getElementById('history-table-body');

    if (dateFilter) {
        dateFilter.value = '';
    }

    filterState.date = null;

    if (noFilteredResultsMsg) {
        noFilteredResultsMsg.classList.add('hidden');
    }

    if (historyTableBody) {
        historyTableBody.querySelectorAll('tr').forEach(row => {
            row.classList.remove('hidden');
        });
    }

    applyAllFilters();
}

/**
 * Filtra la tabla de historial por profesional
 */
function filterHistoryByProfessional(professionalType) {
    filterState.professional = professionalType;
    applyAllFilters();
}

/**
 * Aplica todos los filtros activos a la tabla
 */
function applyAllFilters() {
    const historyTableBody = document.getElementById('history-table-body');
    const noFilteredResultsMsg = document.getElementById('no-filtered-results-msg');

    if (!historyTableBody) return;

    const rows = historyTableBody.querySelectorAll('tr');
    let visibleCount = 0;

    // Convertir fecha del filtro de fecha si existe
    let searchDate = '';
    if (filterState.date) {
        searchDate = formatDateForComparison(filterState.date);
    }

    rows.forEach((row, index) => {
        // Obtener datos de la fila
        const dateCell = row.querySelector('td:nth-child(1)');
        const profesionalCell = row.querySelector('td:nth-child(3)');

        const rowDate = dateCell ? dateCell.textContent.trim() : '';
        const rowProfessional = profesionalCell ? profesionalCell.textContent.trim() : '';

        // Convertir nombre de profesional a tipo
        let rowProfessionalType = 'unknown';
        if (rowProfessional === 'Kinesiología') {
            rowProfessionalType = 'kinesiologia';
        } else if (rowProfessional === 'Acupuntura') {
            rowProfessionalType = 'acupuntura';
        }

        // Aplicar filtros
        let showRow = true;

        // Filtro de fecha
        if (searchDate && rowDate !== searchDate) {
            showRow = false;
        }

        // Filtro de profesional
        if (filterState.professional !== 'all' && rowProfessionalType !== filterState.professional) {
            showRow = false;
        }

        // Mostrar u ocultar fila
        if (showRow) {
            row.classList.remove('hidden');
            visibleCount++;
        } else {
            row.classList.add('hidden');
        }
    });

    // Mostrar mensaje si no hay resultados
    if (noFilteredResultsMsg) {
        if (visibleCount === 0 && (searchDate || filterState.professional !== 'all')) {
            noFilteredResultsMsg.classList.remove('hidden');
        } else {
            noFilteredResultsMsg.classList.add('hidden');
        }
    }
}

/**
 * Convierte una fecha ISO (YYYY-MM-DD) al formato de búsqueda esperado (DD/MM/YYYY)
 */
function formatDateForComparison(dateString) {
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return dateString;
    }
}

/**
 * Configura los eventos de los botones del historial
 */
export function setupHistoryControls() {
    // Botón para ocultar
    const hideHistoryBtn = document.getElementById('hide-history-btn');
    if (hideHistoryBtn) {
        hideHistoryBtn.addEventListener('click', hidePatientHistory);
    }

    // Botón para mostrar
    const showHistoryBtn = document.getElementById('show-history-btn');
    if (showHistoryBtn) {
        showHistoryBtn.addEventListener('click', showPatientHistory);
    }

    // Filtro por fecha
    const dateFilter = document.getElementById('history-date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', filterHistoryByDate);
    }

    // Botón para limpiar filtro
    const clearFilterBtn = document.getElementById('clear-date-filter');
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', clearDateFilter);
    }

    // Filtros por profesional
    const professionalTags = document.querySelectorAll('.professional-filter-tag');
    professionalTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();

            // Remover clase active de todos los botones
            professionalTags.forEach(t => t.classList.remove('active'));

            // Agregar clase active al botón clickeado
            tag.classList.add('active');

            // Aplicar filtro
            const professional = tag.getAttribute('data-professional');
            filterHistoryByProfessional(professional);
        });
    });

    // Marcar "Todos" como activo por defecto
    const allTag = document.querySelector('[data-professional="all"]');
    if (allTag) {
        allTag.classList.add('active');
    }
}

/**
 * Configura el evento del botón para ocultar el historial (función heredada)
 */
export function setupHideHistoryButton() {
    setupHistoryControls();
}
