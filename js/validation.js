/**
 * validation.js
 * Funciones de validación para la ficha clínica
 */

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar (ej: "12.345.678-9")
 * @returns {boolean} True si el RUT es válido
 */
export function validarRUT(rut) {
    // Limpiar formato
    rut = rut.replace(/\./g, '').replace(/-/g, '');

    if (rut.length < 2) return false;

    const dv = rut.slice(-1).toUpperCase();
    const numero = rut.slice(0, -1);

    if (!/^\d+$/.test(numero)) return false;

    // Calcular dígito verificador
    let suma = 0;
    let multiplo = 2;

    for (let i = numero.length - 1; i >= 0; i--) {
        suma += parseInt(numero[i]) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }

    const dvCalculado = 11 - (suma % 11);
    const dvEsperado = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : String(dvCalculado);

    return dv === dvEsperado;
}

/**
 * Muestra un mensaje de error de validación en el campo RUT
 * @param {HTMLInputElement} rutInput - El elemento input del RUT
 */
export function showRutError(rutInput) {
    if (!rutInput) return;
    rutInput.classList.add('border-red-500');

    if (!document.getElementById('rut-error')) {
        const errorMsg = document.createElement('p');
        errorMsg.id = 'rut-error';
        errorMsg.className = 'text-red-500 text-sm mt-1';
        errorMsg.textContent = 'RUT inválido';
        rutInput.parentElement.appendChild(errorMsg);
    }
}

/**
 * Limpia el mensaje de error de validación del RUT
 * @param {HTMLInputElement} rutInput - El elemento input del RUT
 */
export function clearRutError(rutInput) {
    if (!rutInput) return;
    rutInput.classList.remove('border-red-500');
    document.getElementById('rut-error')?.remove();
}

/**
 * Formatea un RUT con puntos y guión
 * @param {string} value - RUT sin formato
 * @returns {string} RUT formateado (ej: "12.345.678-9")
 */
export function formatRUT(value) {
    // Quitar caracteres especiales
    let cleanValue = value.replace(/[^0-9kK]/g, '');

    if (cleanValue.length > 0) {
        const dv = cleanValue.slice(-1);
        let number = cleanValue.slice(0, -1);
        number = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        if (cleanValue.length > 1) {
            return number + '-' + dv;
        } else {
            return cleanValue;
        }
    }

    return value;
}

/**
 * Calcula la edad basada en la fecha de nacimiento
 * @param {string} birthDateStr - Fecha de nacimiento (ISO format: "YYYY-MM-DD")
 * @returns {number|null} Edad calculada o null si la fecha es inválida
 */
export function calculateAge(birthDateStr) {
    if (!birthDateStr) return null;

    const birthDate = new Date(birthDateStr);

    if (isNaN(birthDate.getTime())) {
        return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age >= 0 ? age : null;
}
