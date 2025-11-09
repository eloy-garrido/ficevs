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
import { showConfirm, showAlert, showError } from './modalManager.js';

/**
 * Configura todos los event listeners de la aplicación
 */
export function setupEventListeners() {
    // Botón de logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        const confirmed = await showConfirm(
            'Cerrar Sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            {
                confirmText: 'Sí, Salir',
                cancelText: 'Cancelar',
                type: 'question'
            }
        );
        if (confirmed) {
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

    // Configurar dropdowns y tags
    setupKinesiologyDropdowns();
    setupKinesiologyTags();
    setupTagButtons();
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
                await showAlert('Sin Paciente', 'No hay un paciente seleccionado para eliminar', 'warning');
                return;
            }

            // Primera confirmación
            const confirmar1 = await showConfirm(
                'Eliminar Paciente',
                `Estás a punto de eliminar COMPLETAMENTE al paciente:\n\n${nombrePaciente} (${currentRut})\n\nEsto eliminará:\n• Todos los registros\n• Todas las fichas clínicas\n• Todo el historial de visitas\n\n¿Estás seguro de continuar?`,
                {
                    confirmText: 'Sí, Eliminar',
                    cancelText: 'Cancelar',
                    type: 'warning',
                    isDangerous: true
                }
            );

            if (!confirmar1) return;

            // Segunda confirmación (más seria)
            const confirmar2 = await showConfirm(
                'Última Confirmación',
                `Esta acción NO se puede deshacer.\n\nEscribe "CONFIRMAR" en tu mente y confirma para eliminar definitivamente al paciente ${nombrePaciente}.`,
                {
                    confirmText: 'Sí, Eliminar Definitivamente',
                    cancelText: 'Cancelar',
                    type: 'error',
                    isDangerous: true
                }
            );

            if (!confirmar2) return;

            try {
                await deletePatient(currentRut);
            } catch (error) {
                await showError('Error al Eliminar', error.message);
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

        // Observar cambios en el modal (cuando se abre/cierra)
        const observer = new MutationObserver(() => {
            const isHidden = modal.classList.contains('hidden');
            if (isHidden) {
                document.body.style.overflow = '';
            } else {
                document.body.style.overflow = 'hidden';
            }
        });

        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
}

/**
 * Configura los dropdowns (accordion) del formulario de kinesiología
 */
function setupKinesiologyDropdowns() {
    const toggleButtons = document.querySelectorAll('.dropdown-toggle');

    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = button.getAttribute('data-target');
            const content = document.getElementById(targetId);

            if (content) {
                const isHidden = content.classList.contains('hidden');

                // Toggle aria-expanded
                button.setAttribute('aria-expanded', !isHidden);

                // Toggle contenido
                if (isHidden) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            }
        });
    });
}

/**
 * Configura el sistema de tags para ubicaciones de dolor y técnicas
 */
function setupKinesiologyTags() {
    // Configurar tags para ubicación de dolor
    setupTagsContainer('kine-dolor-ubicacion', 'kine-dolor-tags', 'ubicacion-checkbox');

    // Configurar tags para técnicas
    setupTagsContainer('kine-tecnicas', 'kine-tecnicas-tags', 'tecnicas-checkbox');
}

/**
 * Configura un contenedor de tags
 * @param {string} inputName - Nombre de los inputs (checkboxes)
 * @param {string} containerId - ID del contenedor de tags
 * @param {string} checkboxClass - Clase de los checkboxes
 */
function setupTagsContainer(inputName, containerId, checkboxClass) {
    const container = document.getElementById(containerId);
    const checkboxes = document.querySelectorAll(`input[name="${inputName}"]`);

    if (!container || checkboxes.length === 0) return;

    // Mapeo de valores a etiquetas amigables
    const labelMap = {
        'cervical': 'Cervical',
        'hombro': 'Hombro',
        'codo': 'Codo',
        'muneca': 'Muñeca/Mano',
        'dorsal': 'Dorsal',
        'lumbar': 'Lumbar',
        'cadera': 'Cadera',
        'rodilla': 'Rodilla',
        'tobillo': 'Tobillo/Pie',
        'terapia_manual': 'Terapia Manual',
        'ejercicios': 'Ejercicios Terapéuticos',
        'electroterapia': 'Electroterapia',
        'ultrasonido': 'Ultrasonido',
        'calor_frio': 'Termoterapia/Crioterapia',
        'vendaje': 'Vendaje/Kinesiotape',
        'masoterapia': 'Masoterapia',
        'reeducacion': 'Reeducación Postural'
    };

    // Función para renderizar tags
    const updateTags = () => {
        container.innerHTML = '';
        let hasItems = false;

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                hasItems = true;
                const tag = document.createElement('div');
                tag.className = 'tag';
                tag.innerHTML = `
                    ${labelMap[checkbox.value] || checkbox.value}
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                `;

                tag.addEventListener('click', () => {
                    checkbox.checked = false;
                    updateTags();
                    // Disparar evento de cambio para el form manager
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                });

                container.appendChild(tag);
            }
        });

        // Si no hay items, mostrar placeholder
        if (!hasItems) {
            container.innerHTML = '<span class="text-xs text-gray-400 italic px-2 py-1">Sin selecciones</span>';
        }
    };

    // Agregar listeners a checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateTags);
    });

    // Render inicial
    updateTags();
}

/**
 * Configura los tag-buttons clickeables para ubicación y técnicas
 */
function setupTagButtons() {
    const tagButtons = document.querySelectorAll('.tag-button');

    tagButtons.forEach(button => {
        // Establecer estado inicial basado en checkboxes
        const value = button.getAttribute('data-value');
        const checkbox = document.querySelector(`input[value="${value}"]`);

        if (checkbox && checkbox.checked) {
            button.classList.add('active');
        }

        // Agregar listener al botón
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const checkbox = document.querySelector(`input[value="${value}"]`);

            if (checkbox) {
                checkbox.checked = !checkbox.checked;

                // Actualizar estado visual del botón
                if (checkbox.checked) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }

                // Disparar evento de cambio para actualizar los datos
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });
}
