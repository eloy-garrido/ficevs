/**
 * history.js
 * Funciones para gestionar el historial de visitas de pacientes
 */

import { getPatientSessionHistoryByRut } from './supabaseService.js';

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

        // Limpiar tabla
        historyTableBody.innerHTML = '';

        if (history && history.length > 0) {
            // Llenar tabla con historial
            history.forEach((sesion, index) => {
                const fecha = new Date(sesion.fecha_sesion).toLocaleDateString('es-CL');
                const motivo = sesion.motivo_consulta || 'No especificado';

                // Determinar tipo de sesión desde el campo tipo
                let tipo = 'No especificado';
                if (sesion.tipo === 'kinesiologia') {
                    tipo = 'Kinesiología';
                } else if (sesion.tipo === 'acupuntura') {
                    tipo = 'Acupuntura';
                }

                const row = document.createElement('tr');
                row.className = 'border-b border-purple-100 hover:bg-purple-50 transition-colors';
                row.innerHTML = `
                    <td class="py-2 px-2 font-medium">${fecha}</td>
                    <td class="py-2 px-2">${motivo}</td>
                    <td class="py-2 px-2">${tipo}</td>
                `;
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

        // Mostrar sección de historial con animación
        historySection.classList.remove('hidden');
        historySection.classList.add('animate-fade-in');

    } catch (error) {
        console.error('Error al cargar historial:', error);
    }
}

/**
 * Oculta la sección de historial de visitas
 */
export function hidePatientHistory() {
    const historySection = document.getElementById('patient-history');
    if (historySection) {
        historySection.classList.add('hidden');
    }
}

/**
 * Configura el evento del botón para ocultar el historial
 */
export function setupHideHistoryButton() {
    const hideHistoryBtn = document.getElementById('hide-history-btn');
    if (hideHistoryBtn) {
        hideHistoryBtn.addEventListener('click', hidePatientHistory);
    }
}
