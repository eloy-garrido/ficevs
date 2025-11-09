/**
 * Sistema de Modales Personalizados
 * Reemplaza alert() y confirm() con modales amigables y diseño mejorado
 */

// Crear estilos para los modales si no existen
function initModalStyles() {
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            /* Modal Container */
            .custom-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(45, 62, 45, 0.45);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease-out;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            /* Modal Content */
            .custom-modal {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 248, 0.95) 100%);
                backdrop-filter: blur(20px) saturate(180%) brightness(1.1);
                -webkit-backdrop-filter: blur(20px) saturate(180%) brightness(1.1);
                border: 1px solid rgba(122, 152, 114, 0.2);
                border-radius: 20px;
                box-shadow: 0 25px 50px rgba(122, 152, 114, 0.15), 0 0 1px rgba(122, 152, 114, 0.1);
                padding: 2rem;
                max-width: 450px;
                width: 90%;
                animation: slideUp 0.3s ease-out;
                position: relative;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            /* Modal Header */
            .modal-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .modal-icon {
                width: 3rem;
                height: 3rem;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .modal-icon svg {
                width: 1.5rem;
                height: 1.5rem;
            }

            /* Icon variations */
            .modal-icon.success {
                background: linear-gradient(135deg, #a8c5a0 0%, #8fb185 100%);
            }

            .modal-icon.error {
                background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            }

            .modal-icon.warning {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            }

            .modal-icon.info {
                background: linear-gradient(135deg, #7a9872 0%, #5a7852 100%);
            }

            .modal-icon.question {
                background: linear-gradient(135deg, #7a9872 0%, #5a7852 100%);
            }

            .modal-icon svg {
                color: white;
            }

            /* Modal Title */
            .modal-title {
                font-size: 1.25rem;
                font-weight: 700;
                color: #2d3e2d;
                margin: 0;
            }

            /* Modal Body */
            .modal-body {
                margin: 1.5rem 0 2rem 0;
            }

            .modal-message {
                font-size: 0.95rem;
                color: #5a6b5a;
                line-height: 1.6;
                margin: 0;
            }

            /* Modal Footer */
            .modal-footer {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }

            .modal-footer.single-button {
                justify-content: center;
            }

            /* Buttons */
            .modal-button {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 10px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                outline: none;
            }

            .modal-button:active {
                transform: scale(0.98);
            }

            .modal-button.primary {
                background: linear-gradient(135deg, #7a9872 0%, #5a7852 100%);
                color: white;
                flex: 1;
            }

            .modal-button.primary:hover {
                box-shadow: 0 8px 20px rgba(122, 152, 114, 0.4);
                transform: translateY(-2px);
            }

            .modal-button.success {
                background: linear-gradient(135deg, #a8c5a0 0%, #8fb185 100%);
                color: white;
                flex: 1;
            }

            .modal-button.success:hover {
                box-shadow: 0 8px 20px rgba(168, 197, 160, 0.4);
                transform: translateY(-2px);
            }

            .modal-button.danger {
                background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                color: white;
                flex: 1;
            }

            .modal-button.danger:hover {
                box-shadow: 0 8px 20px rgba(220, 38, 38, 0.4);
                transform: translateY(-2px);
            }

            .modal-button.secondary {
                background: #f0f4f0;
                color: #2d3e2d;
                flex: 1;
                border: 1px solid #c9d9c3;
            }

            .modal-button.secondary:hover {
                background: #e5eee5;
                border-color: #a8c5a0;
                transform: translateY(-2px);
            }

            .modal-button.cancel {
                background: transparent;
                color: #7a9872;
                border: 2px solid #c9d9c3;
                flex: 1;
            }

            .modal-button.cancel:hover {
                background: #f8faf8;
                border-color: #a8c5a0;
                transform: translateY(-2px);
            }

            /* Close Button */
            .modal-close-btn {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #a8c5a0;
                cursor: pointer;
                transition: color 0.2s ease;
                padding: 0;
                width: 2rem;
                height: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-close-btn:hover {
                color: #7a9872;
            }

            /* Responsive */
            @media (max-width: 640px) {
                .custom-modal {
                    padding: 1.5rem;
                    max-width: 95%;
                }

                .modal-footer {
                    flex-direction: column;
                }

                .modal-button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Muestra un modal de alerta (solo botón de confirmación)
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de alerta: 'success', 'error', 'warning', 'info'
 * @returns {Promise} Se resuelve cuando el usuario cierra el modal
 */
export function showAlert(title, message, type = 'info') {
    initModalStyles();
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const iconType = type === 'success' ? 'success' :
                        type === 'error' ? 'error' :
                        type === 'warning' ? 'warning' : 'info';

        const icons = {
            success: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
            error: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
            warning: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
            info: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
        };

        overlay.innerHTML = `
            <div class="custom-modal">
                <button class="modal-close-btn" aria-label="Cerrar">×</button>
                <div class="modal-header">
                    <div class="modal-icon ${iconType}">
                        ${icons[iconType]}
                    </div>
                    <div>
                        <h2 class="modal-title">${title}</h2>
                    </div>
                </div>
                <div class="modal-body">
                    <p class="modal-message">${message}</p>
                </div>
                <div class="modal-footer single-button">
                    <button class="modal-button primary confirm-btn">Aceptar</button>
                </div>
            </div>
        `;

        const closeBtn = overlay.querySelector('.modal-close-btn');
        const confirmBtn = overlay.querySelector('.confirm-btn');

        const cleanup = () => {
            overlay.remove();
            resolve();
        };

        closeBtn.addEventListener('click', cleanup);
        confirmBtn.addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });

        document.body.appendChild(overlay);
    });
}

/**
 * Muestra un modal de confirmación (Sí/No)
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje a mostrar
 * @param {object} options - Opciones del modal
 * @returns {Promise<boolean>} true si usuario confirma, false si cancela
 */
export function showConfirm(title, message, options = {}) {
    initModalStyles();
    return new Promise((resolve) => {
        const {
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'question',
            isDangerous = false
        } = options;

        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const icons = {
            success: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
            error: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
            warning: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
            question: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5.75.75 0 00-1.098.75h.008a.75.75 0 00.7.75h.008c.123 0 .285.125.285.363V9a.75.75 0 00-1.5 0V8.663a2.116 2.116 0 003.467-1.663c0-.927-.316-1.78-.9-2.467a3.01 3.01 0 00-2.485-1.23H10a3 3 0 00-3 3c0 .34.027.675.08 1M7 14a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd"/></svg>',
            info: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
        };

        const buttonClass = isDangerous ? 'danger' : 'success';

        overlay.innerHTML = `
            <div class="custom-modal">
                <button class="modal-close-btn" aria-label="Cerrar">×</button>
                <div class="modal-header">
                    <div class="modal-icon ${type}">
                        ${icons[type]}
                    </div>
                    <div>
                        <h2 class="modal-title">${title}</h2>
                    </div>
                </div>
                <div class="modal-body">
                    <p class="modal-message">${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-button cancel cancel-btn">${cancelText}</button>
                    <button class="modal-button ${buttonClass} confirm-btn">${confirmText}</button>
                </div>
            </div>
        `;

        const closeBtn = overlay.querySelector('.modal-close-btn');
        const confirmBtn = overlay.querySelector('.confirm-btn');
        const cancelBtn = overlay.querySelector('.cancel-btn');

        const cleanup = (result) => {
            overlay.remove();
            resolve(result);
        };

        closeBtn.addEventListener('click', () => cleanup(false));
        confirmBtn.addEventListener('click', () => cleanup(true));
        cancelBtn.addEventListener('click', () => cleanup(false));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });

        document.body.appendChild(overlay);
        confirmBtn.focus();
    });
}

/**
 * Muestra un modal de éxito
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje a mostrar
 * @returns {Promise} Se resuelve cuando el usuario cierra el modal
 */
export function showSuccess(title, message) {
    return showAlert(title, message, 'success');
}

/**
 * Muestra un modal de error
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje a mostrar
 * @returns {Promise} Se resuelve cuando el usuario cierra el modal
 */
export function showError(title, message) {
    return showAlert(title, message, 'error');
}

/**
 * Muestra un modal de advertencia
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje a mostrar
 * @returns {Promise} Se resuelve cuando el usuario cierra el modal
 */
export function showWarning(title, message) {
    return showAlert(title, message, 'warning');
}

/**
 * Muestra un modal de información
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje a mostrar
 * @returns {Promise} Se resuelve cuando el usuario cierra el modal
 */
export function showInfo(title, message) {
    return showAlert(title, message, 'info');
}

export default {
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo
};
