/**
 * =====================================================
 * UTILIDADES GENERALES
 * =====================================================
 * Funciones de ayuda reutilizables en toda la aplicación
 * =====================================================
 */

import { APP_CONFIG } from './config.js';

/**
 * Sistema de notificaciones
 */
export const notifications = {
    container: null,

    init() {
        // Crear contenedor si no existe
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = `fixed ${this.getPositionClass()} z-50 space-y-2 p-4`;
            document.body.appendChild(this.container);
        }
    },

    getPositionClass() {
        const position = APP_CONFIG.notifications.position;
        const positions = {
            'top-right': 'top-0 right-0',
            'top-left': 'top-0 left-0',
            'bottom-right': 'bottom-0 right-0',
            'bottom-left': 'bottom-0 left-0'
        };
        return positions[position] || positions['top-right'];
    },

    show(message, type = 'info', duration = APP_CONFIG.notifications.duration) {
        this.init();

        const notification = document.createElement('div');
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 translate-x-0 opacity-100`;
        notification.innerHTML = `
            <span class="text-xl font-bold">${icons[type]}</span>
            <span class="flex-1">${message}</span>
            <button class="text-white hover:text-gray-200 font-bold" onclick="this.parentElement.remove()">×</button>
        `;

        this.container.appendChild(notification);

        // Auto-remover después de la duración especificada
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'error', duration);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration);
    },

    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

/**
 * Validaciones
 */
export const validators = {
    /**
     * Valida que un campo no esté vacío
     */
    required(value, fieldName = 'Este campo') {
        if (!value || value.trim() === '') {
            return `${fieldName} es requerido`;
        }
        return null;
    },

    /**
     * Valida email
     */
    email(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
            return 'Email inválido';
        }
        return null;
    },

    /**
     * Valida teléfono (formato flexible)
     */
    phone(value) {
        const phoneRegex = /^[+]?[\d\s\-()]{8,}$/;
        if (value && !phoneRegex.test(value)) {
            return 'Teléfono inválido';
        }
        return null;
    },

    /**
     * Valida edad
     */
    age(value) {
        const age = parseInt(value);
        if (isNaN(age) || age < 0 || age > 150) {
            return 'Edad inválida';
        }
        return null;
    },

    /**
     * Valida que al menos un checkbox esté seleccionado
     */
    atLeastOne(checkboxes, fieldName = 'Al menos una opción') {
        const checked = Array.from(checkboxes).some(cb => cb.checked);
        if (!checked) {
            return `${fieldName} debe ser seleccionada`;
        }
        return null;
    }
};

/**
 * Manejo de localStorage
 */
export const storage = {
    /**
     * Guarda un borrador del formulario
     */
    saveDraft(data) {
        try {
            const draft = {
                data,
                timestamp: new Date().toISOString(),
                version: APP_CONFIG.version
            };
            localStorage.setItem(APP_CONFIG.storage.draftKey, JSON.stringify(draft));
            if (APP_CONFIG.debug) {
                console.log('💾 Borrador guardado:', draft);
            }
            return true;
        } catch (error) {
            console.error('❌ Error al guardar borrador:', error);
            return false;
        }
    },

    /**
     * Recupera un borrador del formulario
     */
    loadDraft() {
        try {
            const draftStr = localStorage.getItem(APP_CONFIG.storage.draftKey);
            if (!draftStr) return null;

            const draft = JSON.parse(draftStr);
            if (APP_CONFIG.debug) {
                console.log('📂 Borrador recuperado:', draft);
            }
            return draft.data;
        } catch (error) {
            console.error('❌ Error al cargar borrador:', error);
            return null;
        }
    },

    /**
     * Elimina el borrador
     */
    clearDraft() {
        try {
            localStorage.removeItem(APP_CONFIG.storage.draftKey);
            if (APP_CONFIG.debug) {
                console.log('🗑️ Borrador eliminado');
            }
            return true;
        } catch (error) {
            console.error('❌ Error al eliminar borrador:', error);
            return false;
        }
    },

    /**
     * Verifica si existe un borrador
     */
    hasDraft() {
        return localStorage.getItem(APP_CONFIG.storage.draftKey) !== null;
    }
};

/**
 * Helpers de formulario
 */
export const formHelpers = {
    /**
     * Obtiene valores de checkboxes seleccionados
     */
    getCheckedValues(name) {
        const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    },

    /**
     * Obtiene valores de radios seleccionados
     */
    getRadioValue(name) {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        return radio ? radio.value : null;
    },

    /**
     * Limpia un formulario
     */
    clearForm(formElement) {
        if (formElement instanceof HTMLFormElement) {
            formElement.reset();
        }
    },

    /**
     * Establece el valor de un campo
     */
    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        if (field.type === 'checkbox') {
            field.checked = value;
        } else if (field.type === 'radio') {
            document.querySelector(`input[name="${field.name}"][value="${value}"]`)?.click();
        } else {
            field.value = value;
        }
    },

    /**
     * Muestra errores de validación en un campo
     */
    showFieldError(fieldId, errorMessage) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Eliminar error previo si existe
        this.clearFieldError(fieldId);

        // Agregar clase de error
        field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');

        // Crear mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1';
        errorDiv.id = `${fieldId}-error`;
        errorDiv.textContent = errorMessage;

        // Insertar después del campo
        field.parentElement.appendChild(errorDiv);
    },

    /**
     * Limpia errores de validación de un campo
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Quitar clases de error
        field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');

        // Eliminar mensaje de error
        const errorDiv = document.getElementById(`${fieldId}-error`);
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    /**
     * Limpia todos los errores de un formulario
     */
    clearAllErrors(formElement) {
        const errorDivs = formElement.querySelectorAll('[id$="-error"]');
        errorDivs.forEach(div => div.remove());

        const errorFields = formElement.querySelectorAll('.border-red-500');
        errorFields.forEach(field => {
            field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        });
    }
};

/**
 * Utilidades de fecha
 */
export const dateHelpers = {
    /**
     * Formatea una fecha a formato local
     */
    formatDate(date, locale = 'es-ES') {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Formatea una fecha y hora
     */
    formatDateTime(date, locale = 'es-ES') {
        return new Date(date).toLocaleString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Obtiene fecha actual en formato ISO
     */
    now() {
        return new Date().toISOString();
    },

    /**
     * Calcula edad desde fecha de nacimiento
     */
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    }
};

/**
 * Utilidades de texto
 */
export const textHelpers = {
    /**
     * Capitaliza la primera letra
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Trunca texto
     */
    truncate(str, maxLength = 50) {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
    },

    /**
     * Sanitiza HTML (previene XSS)
     */
    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

/**
 * Loader/Spinner
 */
export const loader = {
    show(message = 'Cargando...') {
        // Eliminar loader existente si hay uno
        this.hide();

        const loaderDiv = document.createElement('div');
        loaderDiv.id = 'app-loader';
        loaderDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loaderDiv.innerHTML = `
            <div class="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
                <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                <p class="text-gray-700 font-medium">${message}</p>
            </div>
        `;

        document.body.appendChild(loaderDiv);
    },

    hide() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.remove();
        }
    }
};

/**
 * Debounce para optimizar eventos frecuentes
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Log condicional (solo si debug está activo)
 */
export function debugLog(...args) {
    if (APP_CONFIG.debug) {
        console.log('[DEBUG]', ...args);
    }
}
