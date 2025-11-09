/**
 * =====================================================
 * GESTOR DE FORMULARIO MULTI-PASO
 * =====================================================
 * Maneja la navegación, validación y guardado del formulario
 * =====================================================
 */

import { APP_CONFIG } from './config.js';
import {
    createOrUpdatePatient,
    createSesionAcupuntura,
    createSesionKinesiologia,
    updateSesionAcupuntura,
    updateSesionKinesiologia,
    validateSessionPatientRut,
    getPatientByRut
} from './supabaseService.js';
import { notifications, validators, formHelpers, storage, debugLog, debounce } from './utils.js';
import { showConfirm, showSuccess } from './modalManager.js';

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

export async function initFormManager() {
    debugLog('🎯 Inicializando gestor de formulario');

    // Cargar borrador si existe
    if (storage.hasDraft()) {
        await showDraftRecoveryDialog();
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

    // Si estamos en el paso 1, guardar automáticamente en la BD
    if (formState.currentStep === 1) {
        await saveStep1Data();
        return; // saveStep1Data() manejará la transición al paso 2
    }

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
    // Ocultar todos los pasos básicos
    for (let i = 1; i <= formState.totalSteps; i++) {
        const stepDiv = document.getElementById(`step-${i}`);
        if (stepDiv) {
            stepDiv.classList.add('hidden');
        }
    }

    // Ocultar formularios condicionales (paso 2)
    const kinesiologoForm = document.getElementById('step-2-kinesiologo');
    const acupuntristaForm = document.getElementById('step-2-acupunturista');
    if (kinesiologoForm) kinesiologoForm.classList.add('hidden');
    if (acupuntristaForm) acupuntristaForm.classList.add('hidden');

    // Mostrar paso actual
    if (formState.currentStep === 1) {
        // Paso 1: Datos personales + selección de profesional
        const step1 = document.getElementById('step-1');
        if (step1) step1.classList.remove('hidden');
    } else if (formState.currentStep === 2) {
        // Paso 2: Mostrar formulario según profesional seleccionado
        const profesional = formState.formData.profesional ||
                           document.querySelector('input[name="profesional"]:checked')?.value;

        if (profesional === 'kinesiologo' && kinesiologoForm) {
            kinesiologoForm.classList.remove('hidden');
        } else if (profesional === 'acupunturista' && acupuntristaForm) {
            acupuntristaForm.classList.remove('hidden');
        }
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
    // El nuevo diseño no usa progress-bar ni progress-text
    // Todo se maneja en updateStepIndicators()
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
            // Paso pendiente - semi-transparente blanco
            indicator.classList.add('text-white');
            indicator.style.background = 'rgba(255, 255, 255, 0.25)';
        }
    }

    // Actualizar líneas de progreso
    const progressLine1 = document.getElementById('progress-line-1');

    if (progressLine1) {
        progressLine1.style.width = formState.currentStep >= 2 ? '100%' : '0%';
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
            // Selección de profesional
            data.profesional = document.querySelector('input[name="profesional"]:checked')?.value;
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
    let stepElement = document.querySelector(`#step-${step}`);

    // Para el paso 2, buscar el formulario específico del profesional seleccionado
    if (step === 2) {
        const profesional = formState.formData.profesional ||
                           document.querySelector('input[name="profesional"]:checked')?.value;
        if (profesional === 'kinesiologo') {
            stepElement = document.getElementById('step-2-kinesiologo');
        } else if (profesional === 'acupunturista') {
            stepElement = document.getElementById('step-2-acupunturista');
        }
    }

    formHelpers.clearAllErrors(stepElement);

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

            // Validar que se haya seleccionado un profesional
            const profesionalSelected = document.querySelector('input[name="profesional"]:checked');
            if (!profesionalSelected) {
                const errorDiv = document.getElementById('profesional-error');
                if (errorDiv) errorDiv.classList.remove('hidden');
                errors.push('Debe seleccionar un profesional');
                isValid = false;
            } else {
                const errorDiv = document.getElementById('profesional-error');
                if (errorDiv) errorDiv.classList.add('hidden');
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
 * GUARDADO AUTOMÁTICO DEL PASO 1
 * ===================================================== */

/**
 * Muestra el modal de guardado
 */
function showSaveModal() {
    const modal = document.getElementById('save-modal');
    const savingState = document.getElementById('save-modal-saving');
    const successState = document.getElementById('save-modal-success');

    if (modal) {
        modal.classList.remove('hidden');
        savingState.classList.remove('hidden');
        successState.classList.add('hidden');
    }
}

/**
 * Cambia el modal al estado de éxito
 */
function showSaveSuccess() {
    const savingState = document.getElementById('save-modal-saving');
    const successState = document.getElementById('save-modal-success');

    if (savingState && successState) {
        savingState.classList.add('hidden');
        successState.classList.remove('hidden');
    }
}

/**
 * Cierra el modal de guardado
 */
function hideSaveModal() {
    const modal = document.getElementById('save-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Guarda los datos del paso 1 (datos del paciente) en la base de datos
 */
async function saveStep1Data() {
    try {
        // Mostrar modal de guardado
        showSaveModal();

        // Simular delay mínimo para que se vea la animación
        await new Promise(resolve => setTimeout(resolve, 800));

        // Preparar datos del paciente
        const patientData = {
            nombre_paciente: formState.formData.nombre_paciente || '',
            rut: formState.formData.rut || null,
            fecha_nacimiento: formState.formData.fecha_nacimiento || null,
            telefono: formState.formData.telefono || null,
            email: formState.formData.email || null,
            ocupacion: formState.formData.ocupacion || null,
            direccion: formState.formData.direccion || null
        };

        debugLog('📤 Datos del paciente a registrar:', patientData);

        // Crear o actualizar el paciente en la tabla pacientes
        if (patientData.rut) {
            try {
                const paciente = await createOrUpdatePatient(patientData);
                debugLog('✅ Paciente registrado/actualizado:', paciente.id);

                // Guardar el ID del paciente en el estado del formulario
                formState.pacienteId = paciente.id;
            } catch (patientError) {
                console.error('❌ Error al registrar paciente:', patientError);
                throw new Error('Error al registrar los datos del paciente: ' + patientError.message);
            }
        } else {
            throw new Error('El RUT es requerido para registrar un paciente');
        }

        // Ahora guardar sesión mínima (solo fecha, motivo y profesional)
        const profesional = formState.formData.profesional;

        if (profesional === 'acupunturista') {
            // Crear sesión de acupuntura mínima
            const sesionData = {
                paciente_id: formState.pacienteId,
                motivo_consulta: formState.formData.motivo_consulta || 'No especificado',
                // Todos los demás campos quedarán null (datos MTC, sintomas, etc.)
            };

            debugLog('📤 Creando sesión de acupuntura mínima:', sesionData);
            const sesionResult = await createSesionAcupuntura(sesionData);
            debugLog('✅ Sesión de acupuntura creada:', sesionResult.id);

            // Guardar el ID de la sesión para posible actualización posterior
            formState.sesionId = sesionResult.id;
            formState.sesionType = 'acupuntura';

        } else if (profesional === 'kinesiologo') {
            // Crear sesión de kinesiología mínima
            const sesionData = {
                paciente_id: formState.pacienteId,
                motivo_consulta: formState.formData.motivo_consulta || 'No especificado',
                // Todos los demás campos quedarán null (diagnostico, plan, técnicas, etc.)
            };

            debugLog('📤 Creando sesión de kinesiología mínima:', sesionData);
            const sesionResult = await createSesionKinesiologia(sesionData);
            debugLog('✅ Sesión de kinesiología creada:', sesionResult.id);

            // Guardar el ID de la sesión para posible actualización posterior
            formState.sesionId = sesionResult.id;
            formState.sesionType = 'kinesiologia';
        }

        // Mostrar estado de éxito
        showSaveSuccess();

        // Esperar un momento para que se vea el éxito
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Ocultar modal
        hideSaveModal();

        // Avanzar al paso 2
        formState.currentStep++;
        updateUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error al guardar paso 1:', error);
        console.error('Error completo:', JSON.stringify(error, null, 2));
        hideSaveModal();

        // Mostrar mensaje de error más específico
        let errorMessage = 'Error al guardar los datos. ';
        if (error.message) {
            errorMessage += error.message;
        } else if (error.details) {
            errorMessage += error.details;
        } else {
            errorMessage += 'Por favor, intenta nuevamente.';
        }
        notifications.error(errorMessage);
    }
}

/**
 * =====================================================
 * RESUMEN Y GUARDADO
 * ===================================================== */

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
 * Envía el formulario y crea la sesión correspondiente
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

        // Determinar qué tipo de sesión crear basado en el profesional seleccionado
        const profesional = formState.formData.profesional;

        if (!formState.pacienteId) {
            throw new Error('Error: Paciente no registrado. Por favor, intenta nuevamente desde el paso 1.');
        }

        let sesionResult;

        // Verificar si es una actualización de sesión existente o una creación nueva
        const isUpdate = !!formState.sesionId;

        if (profesional === 'acupunturista') {
            // Preparar datos para sesión de acupuntura
            const sesionData = {
                motivo_consulta: formState.formData.motivo_consulta,
                datos_mtc: formState.formData.datos_mtc || {},
                diagnostico_mtc: formState.formData.diagnostico_terapeuta || null,
                sintomas_generales: formState.formData.sintomas_generales || {},
                datos_dolor: formState.formData.datos_dolor || {},
                puntos_acupuntura: formState.formData.puntos_acupuntura || [],
                tecnicas_aplicadas: formState.formData.tecnicas_aplicadas || [],
                recomendaciones: formState.formData.recomendaciones || null
            };

            if (isUpdate && formState.sesionType === 'acupuntura') {
                // Validar que el RUT del paciente coincida antes de actualizar
                const currentRut = formState.formData.rut;
                await validateSessionPatientRut(formState.sesionId, 'acupuntura', currentRut);

                // Actualizar sesión existente
                debugLog('📝 Actualizando sesión de acupuntura:', sesionData);
                sesionResult = await updateSesionAcupuntura(formState.sesionId, sesionData);
            } else {
                // Crear sesión nueva
                sesionData.paciente_id = formState.pacienteId;
                debugLog('📤 Creando sesión de acupuntura:', sesionData);
                sesionResult = await createSesionAcupuntura(sesionData);
            }

        } else if (profesional === 'kinesiologo') {
            // Preparar datos para sesión de kinesiología
            const sesionData = {
                motivo_consulta: formState.formData.motivo_consulta,
                diagnostico: formState.formData.diagnostico_terapeuta || null,
                plan_tratamiento: formState.formData.plan_tratamiento || null,
                tecnicas_aplicadas: formState.formData.tecnicas_aplicadas || [],
                recomendaciones: formState.formData.recomendaciones || null
            };

            if (isUpdate && formState.sesionType === 'kinesiologia') {
                // Validar que el RUT del paciente coincida antes de actualizar
                const currentRut = formState.formData.rut;
                await validateSessionPatientRut(formState.sesionId, 'kinesiologia', currentRut);

                // Actualizar sesión existente
                debugLog('📝 Actualizando sesión de kinesiología:', sesionData);
                sesionResult = await updateSesionKinesiologia(formState.sesionId, sesionData);
            } else {
                // Crear sesión nueva
                sesionData.paciente_id = formState.pacienteId;
                debugLog('📤 Creando sesión de kinesiología:', sesionData);
                sesionResult = await createSesionKinesiologia(sesionData);
            }

        } else {
            throw new Error('Tipo de profesional no válido');
        }

        // Limpiar borrador
        storage.clearDraft();

        // Mostrar éxito
        notifications.success('¡Sesión guardada exitosamente!');

        debugLog('✅ Sesión creada con ID:', sesionResult.id);

        // Redirigir o limpiar formulario
        setTimeout(() => {
            resetForm();
            // Opcionalmente: window.location.href = '/success.html';
        }, 2000);

    } catch (error) {
        console.error('❌ Error al guardar sesión:', error);
        notifications.error('Error al guardar la sesión. Por favor, intenta nuevamente.');
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
async function showDraftRecoveryDialog() {
    const recover = await showConfirm(
        'Recuperar Borrador',
        '¿Deseas recuperar el borrador guardado previamente?',
        {
            confirmText: 'Sí, Recuperar',
            cancelText: 'No, Comenzar Nuevo',
            type: 'question'
        }
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
 * Obtiene el estado actual del formulario (copia para lectura)
 */
export function getFormState() {
    return { ...formState };
}

/**
 * Obtiene una referencia al objeto formState interno
 * IMPORTANTE: Usar solo cuando sea necesario sincronizar cambios globales
 */
export function getFormStateRef() {
    return formState;
}

/**
 * Exporta los datos del formulario
 */
export function exportFormData() {
    return { ...formState.formData };
}
