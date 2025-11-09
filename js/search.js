/**
 * search.js
 * Funciones de búsqueda y autocompletado de pacientes
 */

import { validarRUT, formatRUT, clearRutError, showRutError } from './validation.js';
import { searchPatientByRut } from './supabaseService.js';

// Variables globales para el búsqueda
let searchTimeout = null;

/**
 * Muestra las sugerencias de pacientes en el dropdown
 * @param {Array} patients - Lista de pacientes encontrados
 * @param {HTMLElement} rutSuggestions - Elemento contenedor de sugerencias
 * @param {Function} onSelectPatient - Callback cuando se selecciona un paciente
 */
export function showSuggestions(patients, rutSuggestions, onSelectPatient) {
    if (!rutSuggestions) return;

    rutSuggestions.innerHTML = '';

    patients.forEach(patient => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item p-4 cursor-pointer hover:bg-blue-50 border-b border-blue-100 transition-colors';

        // Manejar nombre de tabla pacientes (nombre_completo) o fichas (nombre_paciente)
        const nombrePaciente = patient.nombre_completo || patient.nombre_paciente || 'Sin nombre';

        // Calcular edad si viene fecha_nacimiento pero no edad
        let edad = patient.edad || 'N/A';
        if (!patient.edad && patient.fecha_nacimiento) {
            const birthDate = new Date(patient.fecha_nacimiento);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            edad = calculatedAge;
        }

        suggestion.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-semibold text-gray-900">${nombrePaciente}</p>
                    <p class="text-sm text-gray-600">RUT: ${patient.rut}</p>
                    <p class="text-xs text-gray-500">Edad: ${edad} • Tel: ${patient.telefono || 'N/A'}</p>
                </div>
                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </div>
        `;

        suggestion.addEventListener('click', () => {
            onSelectPatient(patient);
            hideSuggestions(rutSuggestions);
        });

        rutSuggestions.appendChild(suggestion);
    });

    rutSuggestions.classList.remove('hidden');
}

/**
 * Oculta el dropdown de sugerencias
 * @param {HTMLElement} rutSuggestions - Elemento contenedor de sugerencias
 */
export function hideSuggestions(rutSuggestions) {
    if (rutSuggestions) {
        rutSuggestions.classList.add('hidden');
    }
}

/**
 * Configura el evento de búsqueda del RUT con autocompletado
 * @param {HTMLInputElement} rutInput - El elemento input del RUT
 * @param {HTMLElement} rutSuggestions - Elemento contenedor de sugerencias
 * @param {Function} onSelectPatient - Callback cuando se selecciona un paciente
 */
export function setupRutSearch(rutInput, rutSuggestions, onSelectPatient) {
    if (!rutInput || !rutSuggestions) return;

    // Formatear y buscar al escribir
    rutInput.addEventListener('input', async (e) => {
        e.target.value = formatRUT(e.target.value);

        // Buscar pacientes con debounce
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const rutValue = e.target.value.trim();

            // Buscar desde el primer carácter (búsqueda más inteligente)
            if (rutValue.length >= 1) {
                try {
                    // Limpiar el RUT para la búsqueda (quitar puntos y guiones)
                    const cleanRut = rutValue.replace(/[.\-]/g, '');

                    const patients = await searchPatientByRut(cleanRut);

                    if (patients && patients.length > 0) {
                        showSuggestions(patients, rutSuggestions, onSelectPatient);
                    } else {
                        hideSuggestions(rutSuggestions);
                    }
                } catch (error) {
                    console.error('Error al buscar pacientes:', error);
                    hideSuggestions(rutSuggestions);
                }
            } else {
                hideSuggestions(rutSuggestions);
            }
        }, 200); // 200ms de debounce (más rápido)
    });

    // Validar RUT al salir del campo
    rutInput.addEventListener('blur', (e) => {
        // Delay para permitir clic en sugerencias
        setTimeout(() => {
            const rut = e.target.value;
            if (rut && !validarRUT(rut)) {
                showRutError(rutInput);
            } else {
                clearRutError(rutInput);
            }
            hideSuggestions(rutSuggestions);
        }, 200);
    });

    // Mostrar sugerencias nuevamente al hacer focus
    rutInput.addEventListener('focus', async () => {
        const rutValue = rutInput.value.trim();
        if (rutValue.length >= 1) {
            try {
                // Limpiar el RUT para la búsqueda (quitar puntos y guiones)
                const cleanRut = rutValue.replace(/[.\-]/g, '');

                const patients = await searchPatientByRut(cleanRut);
                if (patients && patients.length > 0) {
                    showSuggestions(patients, rutSuggestions, onSelectPatient);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });
}
