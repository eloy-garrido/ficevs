/**
 * =====================================================
 * GESTOR DE FORMULARIO MULTI-PASO
 * =====================================================
 * Maneja la navegación, validación y guardado del formulario
 * =====================================================
 */

import { APP_CONFIG } from './config.js';
import { createFichaClinica } from './supabaseService.js';
import { notifications, validators, formHelpers, storage, debugLog, debounce } from './utils.js';

/**
 * Estado del formulario
 */
const formState = {
    currentStep: 1,
    totalSteps: APP_CONFIG.form.totalSteps,
    formData: {},
    isSubmitting: false
};

/**
 * =====================================================
 * INICIALIZACIÓN
 * =====================================================
 */

export function initFormManager() {
    debugLog('🎯 Inicializando gestor de formulario');

    // Cargar borrador si existe
    if (storage.hasDraft()) {
        showDraftRecoveryDialog();
    }

    // Configurar navegación
    setupNavigation();

    // Configurar auto-guardado
    if (APP_CONFIG.storage.autoSaveDrafts) {
        setupAutoSave();
    }

    // Mostrar paso inicial
    updateUI();

    debugLog('✅ Gestor de formulario inicializado');
}

/**
 * =====================================================
 * NAVEGACIÓN ENTRE PASOS
 * =====================================================
 */

/**
 * Configura los botones de navegación
 */
function setupNavigation() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => previousStep());
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => nextStep());
    }

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Flecha derecha = siguiente paso
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
            e.preventDefault();
            nextStep();
        }

        // Ctrl/Cmd + Flecha izquierda = paso anterior
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
            e.preventDefault();
            previousStep();
        }
    });
}

/**
 * Avanza al siguiente paso
 */
export async function nextStep() {
    // Recolectar datos del paso actual
    const stepData = collectDataFromStep(formState.currentStep);

    // Validar datos del paso actual
    if (APP_CONFIG.form.validateOnStepChange) {
        const isValid = validateStep(formState.currentStep, stepData);
        if (!isValid) {
            notifications.warning('Por favor, completa todos los campos requeridos');
            return;
        }
    }

    // Guardar datos del paso
    Object.assign(formState.formData, stepData);

    // Si es el último paso, mostrar resumen y guardar
    if (formState.currentStep === formState.totalSteps) {
        await submitForm();
        return;
    }

    // Avanzar al siguiente paso
    formState.currentStep++;
    updateUI();

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Retrocede al paso anterior
 */
export function previousStep() {
    if (formState.currentStep <= 1) return;

    // Recolectar datos del paso actual (sin validar)
    const stepData = collectDataFromStep(formState.currentStep);
    Object.assign(formState.formData, stepData);

    // Retroceder
    formState.currentStep--;
    updateUI();

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Ir a un paso específico
 */
export function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > formState.totalSteps) return;

    formState.currentStep = stepNumber;
    updateUI();
}

/**
 * =====================================================
 * ACTUALIZACIÓN DE UI
 * =====================================================
 */

/**
 * Actualiza la interfaz según el paso actual
 */
function updateUI() {
    // Ocultar todos los pasos
    for (let i = 1; i <= formState.totalSteps; i++) {
        const stepDiv = document.getElementById(`step-${i}`);
        if (stepDiv) {
            stepDiv.classList.add('hidden');
        }
    }

    // Mostrar paso actual
    const currentStepDiv = document.getElementById(`step-${formState.currentStep}`);
    if (currentStepDiv) {
        currentStepDiv.classList.remove('hidden');
    }

    // Actualizar indicador de progreso
    updateProgressIndicator();

    // Actualizar botones
    updateNavigationButtons();

    // Actualizar indicadores de paso en la barra
    updateStepIndicators();

    // Si es el paso final, generar resumen
    if (formState.currentStep === formState.totalSteps && APP_CONFIG.form.showSummaryBeforeSave) {
        generateSummary();
    }

    // Restaurar datos del paso si existen
    restoreStepData(formState.currentStep);

    debugLog(`📄 Mostrando paso ${formState.currentStep}/${formState.totalSteps}`);
}

/**
 * Actualiza la barra de progreso
 */
function updateProgressIndicator() {
    // Ya no usamos progress-bar, pero mantenemos compatibilidad
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const progress = (formState.currentStep / formState.totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
    }

    const progressText = document.getElementById('progress-text');
    if (progressText) {
        progressText.textContent = `${formState.currentStep}/${formState.totalSteps}`;
    }
}

/**
 * Actualiza los botones de navegación
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Botón anterior
    if (prevBtn) {
        if (formState.currentStep === 1) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }
    }

    // Botón siguiente
    if (nextBtn) {
        if (formState.currentStep === formState.totalSteps) {
            nextBtn.textContent = 'Guardar Ficha';
            nextBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            nextBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        } else {
            nextBtn.textContent = 'Siguiente';
            nextBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            nextBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }
    }
}

/**
 * Actualiza los indicadores de paso en la barra superior
 */
function updateStepIndicators() {
    for (let i = 1; i <= formState.totalSteps; i++) {
        const indicator = document.getElementById(`step-indicator-${i}`);
        if (!indicator) continue;

        // Quitar todas las clases de estado
        indicator.classList.remove('bg-blue-600', 'bg-green-600', 'bg-gray-300', 'text-white', 'text-gray-600',
                                   'active', 'completed', 'from-blue-500', 'to-blue-600',
                                   'from-green-500', 'to-green-600', 'bg-gradient-to-br');

        if (i < formState.currentStep) {
            // Paso completado - verde con check
            indicator.classList.add('completed', 'text-white');
            indicator.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        } else if (i === formState.currentStep) {
            // Paso actual - azul activo
            indicator.classList.add('active', 'text-white');
            indicator.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
        } else {
            // Paso pendiente - gris
            indicator.classList.add('bg-gray-300', 'text-gray-600');
            indicator.style.background = '';
        }
    }

    // Actualizar líneas de progreso
    const progressLine1 = document.getElementById('progress-line-1');
    const progressLine2 = document.getElementById('progress-line-2');

    if (progressLine1) {
        progressLine1.style.width = formState.currentStep >= 2 ? '100%' : '0%';
    }

    if (progressLine2) {
        progressLine2.style.width = formState.currentStep >= 3 ? '100%' : '0%';
    }
}

/**
 * =====================================================
 * RECOLECCIÓN DE DATOS
 * =====================================================
 */

/**
 * Recolecta datos de un paso específico
 */
function collectDataFromStep(step) {
    const data = {};

    switch (step) {
        case 1:
            // Datos del paciente
            data.nombre_paciente = document.getElementById('nombre-paciente')?.value.trim();
            data.rut = document.getElementById('rut')?.value.trim();
            data.fecha_nacimiento = document.getElementById('fecha-nacimiento')?.value;
            data.edad = document.getElementById('edad')?.value;
            data.fecha_ingreso = document.getElementById('fecha-ingreso')?.value;
            // Combinar código de país + número de teléfono
            const telefonoCodigo = document.getElementById('telefono-codigo')?.value || '+569';
            const telefonoNumero = document.getElementById('telefono-numero')?.value.trim();
            data.telefono = telefonoNumero ? `${telefonoCodigo} ${telefonoNumero}` : '';
            data.email = document.getElementById('email')?.value.trim();
            data.ocupacion = document.getElementById('ocupacion')?.value.trim();
            data.direccion = document.getElementById('direccion')?.value.trim();
            data.motivo_consulta = document.getElementById('motivo-consulta')?.value.trim();
            break;

        case 2:
            // Datos de MTC (Lengua y Pulso)
            data.datos_mtc = {
                lengua: {
                    color: formHelpers.getRadioValue('lengua-color'),
                    saburra: formHelpers.getRadioValue('lengua-saburra'),
                    forma: formHelpers.getRadioValue('lengua-forma'),
                    observaciones: document.getElementById('lengua-observaciones')?.value.trim()
                },
                pulso: {
                    profundidad: formHelpers.getRadioValue('pulso-profundidad'),
                    velocidad: formHelpers.getRadioValue('pulso-velocidad'),
                    fuerza: formHelpers.getRadioValue('pulso-fuerza'),
                    calidad: formHelpers.getRadioValue('pulso-calidad'),
                    observaciones: document.getElementById('pulso-observaciones')?.value.trim()
                }
            };
            break;

        case 3:
            // Síntomas Generales
            data.sintomas_generales = {
                sintomas: formHelpers.getCheckedValues('sintomas'),
                emociones: formHelpers.getCheckedValues('emociones'),
                digestivos: formHelpers.getCheckedValues('digestivos'),
                menstruales: formHelpers.getCheckedValues('menstruales'),
                otros: document.getElementById('otros-sintomas')?.value.trim()
            };
            break;

        case 4:
            // Datos del Dolor
            data.datos_dolor = {
                ubicaciones: formHelpers.getCheckedValues('dolor-ubicacion'),
                tipo: formHelpers.getCheckedValues('dolor-tipo'),
                intensidad: document.getElementById('dolor-intensidad')?.value,
                frecuencia: formHelpers.getRadioValue('dolor-frecuencia'),
                factores_alivio: document.getElementById('factores-alivio')?.value.trim(),
                factores_agravacion: document.getElementById('factores-agravacion')?.value.trim()
            };
            break;

        case 5:
            // Diagnóstico y Plan
            data.diagnostico_terapeuta = document.getElementById('diagnostico')?.value.trim();
            data.plan_tratamiento = document.getElementById('plan-tratamiento')?.value.trim();
            data.puntos_acupuntura = document.getElementById('puntos-acupuntura')?.value
                .split(',')
                .map(p => p.trim())
                .filter(p => p.length > 0);
            data.tecnicas_aplicadas = formHelpers.getCheckedValues('tecnicas');
            data.recomendaciones = document.getElementById('recomendaciones')?.value.trim();
            data.consentimiento_aceptado = document.getElementById('consentimiento')?.checked || false;
            break;
    }

    return data;
}

/**
 * Restaura datos de un paso desde formData
 */
function restoreStepData(step) {
    if (Object.keys(formState.formData).length === 0) return;

    switch (step) {
        case 1:
            formHelpers.setFieldValue('nombre-paciente', formState.formData.nombre_paciente);
            formHelpers.setFieldValue('edad', formState.formData.edad);
            formHelpers.setFieldValue('telefono', formState.formData.telefono);
            formHelpers.setFieldValue('email', formState.formData.email);
            formHelpers.setFieldValue('ocupacion', formState.formData.ocupacion);
            formHelpers.setFieldValue('motivo-consulta', formState.formData.motivo_consulta);
            break;

        case 2:
            if (formState.formData.datos_mtc) {
                // Restaurar lengua
                if (formState.formData.datos_mtc.lengua) {
                    const lengua = formState.formData.datos_mtc.lengua;
                    formHelpers.setFieldValue('lengua-color', lengua.color);
                    formHelpers.setFieldValue('lengua-saburra', lengua.saburra);
                    formHelpers.setFieldValue('lengua-forma', lengua.forma);
                    formHelpers.setFieldValue('lengua-observaciones', lengua.observaciones);
                }
                // Restaurar pulso
                if (formState.formData.datos_mtc.pulso) {
                    const pulso = formState.formData.datos_mtc.pulso;
                    formHelpers.setFieldValue('pulso-profundidad', pulso.profundidad);
                    formHelpers.setFieldValue('pulso-velocidad', pulso.velocidad);
                    formHelpers.setFieldValue('pulso-fuerza', pulso.fuerza);
                    formHelpers.setFieldValue('pulso-calidad', pulso.calidad);
                    formHelpers.setFieldValue('pulso-observaciones', pulso.observaciones);
                }
            }
            break;

        // Casos 3, 4, 5 similar...
    }
}

/**
 * =====================================================
 * VALIDACIÓN
 * =====================================================
 */

/**
 * Valida un paso específico
 */
function validateStep(step, data) {
    // Limpiar errores previos
    formHelpers.clearAllErrors(document.querySelector(`#step-${step}`));

    let isValid = true;
    const errors = [];

    switch (step) {
        case 1:
            // Validar nombre del paciente
            const nombreError = validators.required(data.nombre_paciente, 'Nombre del paciente');
            if (nombreError) {
                formHelpers.showFieldError('nombre-paciente', nombreError);
                errors.push(nombreError);
                isValid = false;
            }

            // Validar RUT
            const rutError = validators.required(data.rut, 'RUT');
            if (rutError) {
                formHelpers.showFieldError('rut', rutError);
                errors.push(rutError);
                isValid = false;
            }

            // Validar fecha de nacimiento
            const fechaNacError = validators.required(data.fecha_nacimiento, 'Fecha de nacimiento');
            if (fechaNacError) {
                formHelpers.showFieldError('fecha-nacimiento', fechaNacError);
                errors.push(fechaNacError);
                isValid = false;
            }

            // Validar teléfono
            const telefonoNumeroInput = document.getElementById('telefono-numero');
            if (!telefonoNumeroInput?.value || telefonoNumeroInput.value.trim() === '') {
                formHelpers.showFieldError('telefono-numero', 'Teléfono es requerido');
                errors.push('Teléfono requerido');
                isValid = false;
            } else if (telefonoNumeroInput.value.length !== 8) {
                formHelpers.showFieldError('telefono-numero', 'Debe tener 8 dígitos');
                errors.push('Teléfono inválido');
                isValid = false;
            }

            // Validar motivo de consulta
            const motivoError = validators.required(data.motivo_consulta, 'Motivo de consulta');
            if (motivoError) {
                formHelpers.showFieldError('motivo-consulta', motivoError);
                errors.push(motivoError);
                isValid = false;
            }

            // Validar email (opcional pero si está debe ser válido)
            if (data.email) {
                const emailError = validators.email(data.email);
                if (emailError) {
                    formHelpers.showFieldError('email', emailError);
                    errors.push(emailError);
                    isValid = false;
                }
            }

            // Validar edad (opcional pero si está debe ser válida)
            if (data.edad) {
                const edadError = validators.age(data.edad);
                if (edadError) {
                    formHelpers.showFieldError('edad', edadError);
                    errors.push(edadError);
                    isValid = false;
                }
            }
            break;

        case 5:
            // Validar consentimiento
            if (!data.consentimiento_aceptado) {
                formHelpers.showFieldError('consentimiento', 'Debes aceptar el consentimiento informado');
                errors.push('Consentimiento requerido');
                isValid = false;
            }
            break;

        // Los pasos 2, 3, 4 son opcionales (no requieren validación estricta)
    }

    if (!isValid) {
        debugLog('❌ Validación fallida:', errors);
    }

    return isValid;
}

/**
 * =====================================================
 * RESUMEN Y GUARDADO
 * =====================================================
 */

/**
 * Genera el resumen de la ficha en el paso final
 */
function generateSummary() {
    const summaryDiv = document.getElementById('ficha-summary');
    if (!summaryDiv) return;

    const data = formState.formData;

    const summaryHTML = `
        <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-bold text-blue-900 mb-2">Datos del Paciente</h4>
                <p><strong>Nombre:</strong> ${data.nombre_paciente || 'N/A'}</p>
                <p><strong>Edad:</strong> ${data.edad || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${data.telefono || 'N/A'}</p>
                <p><strong>Email:</strong> ${data.email || 'N/A'}</p>
                <p><strong>Motivo:</strong> ${data.motivo_consulta || 'N/A'}</p>
            </div>

            <div class="bg-green-50 p-4 rounded-lg">
                <h4 class="font-bold text-green-900 mb-2">Diagnóstico MTC</h4>
                <p><strong>Lengua:</strong> ${data.datos_mtc?.lengua?.color || 'N/A'}</p>
                <p><strong>Pulso:</strong> ${data.datos_mtc?.pulso?.profundidad || 'N/A'}</p>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg">
                <h4 class="font-bold text-yellow-900 mb-2">Síntomas</h4>
                <p><strong>Principales:</strong> ${data.sintomas_generales?.sintomas?.join(', ') || 'N/A'}</p>
            </div>

            <div class="bg-red-50 p-4 rounded-lg">
                <h4 class="font-bold text-red-900 mb-2">Dolor</h4>
                <p><strong>Ubicación:</strong> ${data.datos_dolor?.ubicaciones?.join(', ') || 'N/A'}</p>
                <p><strong>Intensidad:</strong> ${data.datos_dolor?.intensidad || 'N/A'}/10</p>
            </div>
        </div>
    `;

    summaryDiv.innerHTML = summaryHTML;
}

/**
 * Envía el formulario
 */
async function submitForm() {
    if (formState.isSubmitting) return;

    try {
        formState.isSubmitting = true;

        // Recolectar datos del paso final
        const finalData = collectDataFromStep(formState.currentStep);
        Object.assign(formState.formData, finalData);

        // Validar paso final
        const isValid = validateStep(formState.currentStep, finalData);
        if (!isValid) {
            formState.isSubmitting = false;
            return;
        }

        // Guardar en Supabase
        const result = await createFichaClinica(formState.formData);

        // Limpiar borrador
        storage.clearDraft();

        // Mostrar éxito
        notifications.success('¡Ficha clínica guardada exitosamente!');

        // Redirigir o limpiar formulario
        setTimeout(() => {
            resetForm();
            // Opcionalmente: window.location.href = '/success.html';
        }, 2000);

    } catch (error) {
        console.error('❌ Error al guardar ficha:', error);
        notifications.error('Error al guardar la ficha. Por favor, intenta nuevamente.');
    } finally {
        formState.isSubmitting = false;
    }
}

/**
 * =====================================================
 * AUTO-GUARDADO
 * =====================================================
 */

/**
 * Configura el auto-guardado de borradores
 */
function setupAutoSave() {
    const autoSave = debounce(() => {
        const currentData = collectDataFromStep(formState.currentStep);
        Object.assign(formState.formData, currentData);
        storage.saveDraft(formState.formData);
        debugLog('💾 Auto-guardado realizado');
    }, APP_CONFIG.storage.autoSaveInterval);

    // Escuchar cambios en inputs
    document.addEventListener('input', autoSave);
    document.addEventListener('change', autoSave);
}

/**
 * Muestra diálogo de recuperación de borrador
 */
function showDraftRecoveryDialog() {
    const recover = confirm(
        '¿Deseas recuperar el borrador guardado previamente?'
    );

    if (recover) {
        const draft = storage.loadDraft();
        if (draft) {
            formState.formData = draft;
            notifications.success('Borrador recuperado exitosamente');
        }
    } else {
        storage.clearDraft();
    }
}

/**
 * =====================================================
 * UTILIDADES
 * =====================================================
 */

/**
 * Resetea el formulario completamente
 */
function resetForm() {
    formState.currentStep = 1;
    formState.formData = {};
    formState.isSubmitting = false;

    // Limpiar todos los campos
    for (let i = 1; i <= formState.totalSteps; i++) {
        const stepForm = document.querySelector(`#step-${i} form`);
        if (stepForm) {
            formHelpers.clearForm(stepForm);
        }
    }

    // Limpiar borrador
    storage.clearDraft();

    // Actualizar UI
    updateUI();

    debugLog('🔄 Formulario reseteado');
}

/**
 * Obtiene el estado actual del formulario
 */
export function getFormState() {
    return { ...formState };
}

/**
 * Exporta los datos del formulario
 */
export function exportFormData() {
    return { ...formState.formData };
}
