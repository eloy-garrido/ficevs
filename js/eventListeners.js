/**
 * eventListeners.js
 * Configuración de event listeners para la ficha clínica
 */

import { signOut } from './auth.js';
import { storage } from './utils.js';
import { setupRutSearch } from './search.js';
import { loadPatientData, deletePatient } from './patientLoader.js';
import { calculateAge } from './validation.js';
import { setupHideHistoryButton, closeSessionDetailModal } from './history.js';

/**
 * Configura todos los event listeners de la aplicación
 */
export function setupEventListeners() {
    // Botón de logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            await signOut();
        }
    });

    // Botón de guardar borrador manual
    document.getElementById('save-draft-btn')?.addEventListener('click', () => {
        // La función de guardado está en formManager.js
        storage.saveDraft(window.formState?.formData || {});
    });

    // Actualizar valor de intensidad de dolor (Acupuntura)
    setupPainIntensitySlider('dolor-intensidad', 'dolor-intensidad-valor');

    // Actualizar valor de intensidad de dolor (Kinesiología)
    setupPainIntensitySlider('kine-dolor-intensidad', 'kine-dolor-intensidad-valor');

    // Setear fecha de ingreso automáticamente a hoy
    setupIngresoDate();

    // Calcular edad automáticamente desde fecha de nacimiento
    setupAgeCalculation();

    // Configurar búsqueda de pacientes por RUT
    setupRutSearchFeature();

    // Validar formato de teléfono (solo números)
    setupPhoneValidation();

    // Configurar historial de visitas
    setupHistoryFeature();

    // Configurar eliminación de paciente
    setupDeletePatient();

    // Configurar modal de detalles de sesión
    setupSessionDetailModal();
}

/**
 * Configura el slider de intensidad de dolor
 * @param {string} sliderId - ID del input slider
 * @param {string} valueId - ID del elemento donde se muestra el valor
 */
function setupPainIntensitySlider(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const valueElement = document.getElementById(valueId);

    if (slider && valueElement) {
        slider.addEventListener('input', (e) => {
            valueElement.textContent = e.target.value;
        });
    }
}

/**
 * Setea la fecha de ingreso a la fecha actual
 */
function setupIngresoDate() {
    const fechaIngresoInput = document.getElementById('fecha-ingreso');
    if (fechaIngresoInput && !fechaIngresoInput.value) {
        const today = new Date().toISOString().split('T')[0];
        fechaIngresoInput.value = today;
    }
}

/**
 * Configura el cálculo automático de edad
 */
function setupAgeCalculation() {
    const fechaNacimientoInput = document.getElementById('fecha-nacimiento');
    const edadInput = document.getElementById('edad');

    if (fechaNacimientoInput && edadInput) {
        fechaNacimientoInput.addEventListener('change', (e) => {
            const age = calculateAge(e.target.value);
            edadInput.value = age || '';
        });
    }
}

/**
 * Configura la búsqueda de pacientes por RUT
 */
function setupRutSearchFeature() {
    const rutInput = document.getElementById('rut');
    const rutSuggestions = document.getElementById('rut-suggestions');

    if (rutInput && rutSuggestions) {
        setupRutSearch(rutInput, rutSuggestions, loadPatientData);
    }
}

/**
 * Configura la validación del teléfono (solo números)
 */
function setupPhoneValidation() {
    const telefonoNumeroInput = document.getElementById('telefono-numero');
    if (telefonoNumeroInput) {
        telefonoNumeroInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
}

/**
 * Configura la funcionalidad del historial de visitas
 */
function setupHistoryFeature() {
    setupHideHistoryButton();
}

/**
 * Configura el botón de eliminación de paciente
 */
function setupDeletePatient() {
    const deletePatientBtn = document.getElementById('delete-patient-btn');
    if (deletePatientBtn) {
        deletePatientBtn.addEventListener('click', async () => {
            // Obtener RUT del paciente actual
            const currentRut = window.formState?.existingPatientRut || document.getElementById('rut')?.value.trim();
            const nombrePaciente = document.getElementById('nombre-paciente')?.value.trim();

            if (!currentRut) {
                alert('No hay un paciente seleccionado para eliminar');
                return;
            }

            // Primera confirmación
            const confirmar1 = confirm(
                `⚠️ ADVERTENCIA: Estás a punto de eliminar COMPLETAMENTE al paciente:\n\n` +
                `Nombre: ${nombrePaciente}\n` +
                `RUT: ${currentRut}\n\n` +
                `Esto eliminará:\n` +
                `• Todos los registros en la tabla de pacientes\n` +
                `• Todas las fichas clínicas asociadas\n` +
                `• Todo el historial de visitas\n\n` +
                `¿Estás seguro de continuar?`
            );

            if (!confirmar1) return;

            // Segunda confirmación (más seria)
            const confirmar2 = confirm(
                `🚨 ÚLTIMA CONFIRMACIÓN\n\n` +
                `Esta acción NO se puede deshacer.\n\n` +
                `Escribe "CONFIRMAR" en tu mente y presiona OK para eliminar definitivamente al paciente ${nombrePaciente}.`
            );

            if (!confirmar2) return;

            try {
                await deletePatient(currentRut);
            } catch (error) {
                alert('❌ ' + error.message);
            }
        });
    }
}

/**
 * Configura los eventos del modal de detalles de sesión
 */
function setupSessionDetailModal() {
    const modal = document.getElementById('session-detail-modal');
    const closeBtn = document.getElementById('close-session-modal');
    const closeBtnBottom = document.getElementById('close-session-modal-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeSessionDetailModal);
    }

    if (closeBtnBottom) {
        closeBtnBottom.addEventListener('click', closeSessionDetailModal);
    }

    // Cerrar modal al hacer click fuera del contenido
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSessionDetailModal();
            }
        });

        // Cerrar modal con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeSessionDetailModal();
            }
        });
    }
}
