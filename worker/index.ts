/// <reference lib="webworker" />
export type { };
declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
    const data = event.data?.json();
    const title = data?.title || 'New Notification';
    const options = {
        body: data?.body || '',
        icon: data?.icon || '/icon-v2-192x192.png',
        badge: '/icon-v2-192x192.png', // Android small icon
        data: {
            url: data?.url || '/',
        },
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
