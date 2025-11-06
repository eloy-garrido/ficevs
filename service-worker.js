/**
 * =====================================================
 * SERVICE WORKER - PWA
 * =====================================================
 * Permite que la aplicación funcione offline y mejora
 * el rendimiento mediante caché
 * =====================================================
 */

const CACHE_NAME = 'ficha-clinica-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/ficha-clinica.html',
    '/css/styles.css',
    '/js/config.js',
    '/js/auth.js',
    '/js/utils.js',
    '/js/formManager.js',
    '/js/supabaseService.js',
    '/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

/**
 * Instalación del Service Worker
 * Cachea los archivos estáticos necesarios
 */
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Instalando...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Service Worker: Archivos cacheados');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('❌ Error al cachear archivos:', error);
            })
    );

    // Fuerza la activación inmediata
    self.skipWaiting();
});

/**
 * Activación del Service Worker
 * Limpia cachés antiguas
 */
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activado');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // Toma control de todas las páginas inmediatamente
    return self.clients.claim();
});

/**
 * Intercepción de Fetch
 * Estrategia: Network First, con fallback a Cache
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Solo cachear GET requests
    if (request.method !== 'GET') {
        return;
    }

    // No cachear llamadas a Supabase API
    if (request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Si la respuesta es válida, cachearla y devolverla
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Si falla la red, intentar obtener de caché
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('📦 Sirviendo desde caché:', request.url);
                        return cachedResponse;
                    }

                    // Si no hay caché, devolver página offline
                    if (request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

/**
 * Sincronización en segundo plano (Background Sync)
 * Para guardar datos cuando vuelva la conexión
 */
self.addEventListener('sync', (event) => {
    console.log('🔄 Service Worker: Sincronización en segundo plano');

    if (event.tag === 'sync-fichas') {
        event.waitUntil(
            syncFichas()
        );
    }
});

/**
 * Función para sincronizar fichas guardadas localmente
 */
async function syncFichas() {
    try {
        // Obtener fichas pendientes de sincronización desde IndexedDB o localStorage
        const pendingFichas = await getPendingFichas();

        if (pendingFichas.length === 0) {
            console.log('✅ No hay fichas pendientes de sincronización');
            return;
        }

        console.log(`🔄 Sincronizando ${pendingFichas.length} fichas...`);

        // Enviar cada ficha a Supabase
        for (const ficha of pendingFichas) {
            try {
                const response = await fetch('https://hqbysakupbqwdfyprzya.supabase.co/rest/v1/fichas_clinicas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                    },
                    body: JSON.stringify(ficha)
                });

                if (response.ok) {
                    // Eliminar de la lista de pendientes
                    await removePendingFicha(ficha.id);
                    console.log('✅ Ficha sincronizada:', ficha.id);
                }
            } catch (error) {
                console.error('❌ Error al sincronizar ficha:', error);
            }
        }

        console.log('✅ Sincronización completada');

    } catch (error) {
        console.error('❌ Error en sincronización:', error);
    }
}

/**
 * Obtiene fichas pendientes de sincronización
 */
async function getPendingFichas() {
    try {
        const pendingStr = localStorage.getItem('pending_fichas');
        return pendingStr ? JSON.parse(pendingStr) : [];
    } catch (error) {
        console.error('Error al obtener fichas pendientes:', error);
        return [];
    }
}

/**
 * Elimina una ficha de la lista de pendientes
 */
async function removePendingFicha(fichaId) {
    try {
        const pending = await getPendingFichas();
        const filtered = pending.filter(f => f.id !== fichaId);
        localStorage.setItem('pending_fichas', JSON.stringify(filtered));
    } catch (error) {
        console.error('Error al eliminar ficha pendiente:', error);
    }
}

/**
 * Notificaciones Push (opcional)
 */
self.addEventListener('push', (event) => {
    console.log('🔔 Service Worker: Notificación push recibida');

    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Ficha Clínica';
    const options = {
        body: data.body || 'Nueva notificación',
        icon: '/assets/images/icon-192x192.png',
        badge: '/assets/images/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

/**
 * Manejo de clics en notificaciones
 */
self.addEventListener('notificationclick', (event) => {
    console.log('🖱️ Service Worker: Click en notificación');

    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

console.log('✅ Service Worker cargado correctamente');
