/**
 * patientLoader.js
 * Funciones para cargar y gestionar datos de pacientes
 */

import { calculateAge } from './validation.js';
import { loadPatientHistory } from './history.js';

/**
 * Carga los datos de un paciente en el formulario
 * @param {Object} patient - Objeto del paciente con sus datos
 */
export async function loadPatientData(patient) {
    console.log('📋 Cargando datos del paciente:', patient);

    // Llenar solo los datos demográficos del paciente
    // NO cargar motivo_consulta ya que cada visita tiene su propio motivo
    document.getElementById('rut').value = patient.rut || '';

    // Manejar ambos campos: nombre_completo (tabla pacientes) y nombre_paciente (tabla fichas)
    document.getElementById('nombre-paciente').value = patient.nombre_completo || patient.nombre_paciente || '';

    document.getElementById('fecha-nacimiento').value = patient.fecha_nacimiento || '';

    // Calcular edad desde fecha_nacimiento si no viene el campo edad
    if (patient.fecha_nacimiento && !patient.edad) {
        const age = calculateAge(patient.fecha_nacimiento);
        document.getElementById('edad').value = age || '';
    } else {
        document.getElementById('edad').value = patient.edad || '';
    }

    // Separar el teléfono en código y número
    if (patient.telefono) {
        const telefonoParts = patient.telefono.split(' ');
        if (telefonoParts.length >= 2) {
            document.getElementById('telefono-codigo').value = telefonoParts[0];
            document.getElementById('telefono-numero').value = telefonoParts[1];
        } else {
            document.getElementById('telefono-numero').value = patient.telefono;
        }
    }

    document.getElementById('email').value = patient.email || '';
    document.getElementById('ocupacion').value = patient.ocupacion || '';
    document.getElementById('direccion').value = patient.direccion || '';

    // NO cargar motivo_consulta - cada visita es única
    // Dejar que el usuario ingrese un nuevo motivo
    document.getElementById('motivo-consulta').value = '';
    document.getElementById('motivo-consulta').placeholder = 'Ingrese el motivo de esta consulta...';

    // Usar fecha actual para nueva ficha
    document.getElementById('fecha-ingreso').value = new Date().toISOString().split('T')[0];

    // Guardar referencia al paciente existente (no al ID de ficha)
    // Esto nos ayudará a saber que es un paciente recurrente
    if (window.formState) {
        window.formState.existingPatientRut = patient.rut;
        window.formState.isExistingPatient = true;

        // Limpiar IDs de sesión anteriores para evitar conflictos
        // cuando se carga un paciente diferente
        window.formState.sesionId = null;
        window.formState.sesionType = null;
    }

    // Cargar y mostrar historial de visitas anteriores
    await loadPatientHistory(patient.rut);

    // Mostrar notificación
    console.log('✅ Datos del paciente cargados:', patient.nombre_completo || patient.nombre_paciente);

    // Agregar indicador visual de que se cargaron datos existentes
    const rutInput = document.getElementById('rut');
    if (rutInput) {
        rutInput.classList.add('border-green-500');
        setTimeout(() => {
            rutInput.classList.remove('border-green-500');
        }, 2000);
    }

    // Desplazar a la sección de selección de profesional
    const profesionalSection = document.querySelector('[id*="profesional"]')?.closest('section') || document.querySelector('section');
    if (profesionalSection) {
        setTimeout(() => {
            profesionalSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }

    // Mostrar mensaje instructivo
    showNotification('✓ Paciente cargado. Por favor, selecciona un profesional y haz clic en "Siguiente"');
}

/**
 * Muestra una notificación temporal en la pantalla
 * @param {string} message - Mensaje a mostrar
 * @param {number} duration - Duración en ms (por defecto 4000)
 */
export function showNotification(message, duration = 4000) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, duration);
}

/**
 * Elimina un paciente y todos sus registros asociados
 * @param {string} rut - RUT del paciente a eliminar
 */
export async function deletePatient(rut) {
    try {
        const { deletePatientByRut } = await import('./supabaseService.js');

        // Eliminar paciente
        await deletePatientByRut(rut);

        // Mostrar mensaje de éxito
        alert('✅ Paciente eliminado exitosamente');

        // Limpiar formulario y recargar página
        window.location.reload();

    } catch (error) {
        console.error('Error al eliminar paciente:', error);
        throw new Error('Error al eliminar paciente: ' + error.message);
    }
}
