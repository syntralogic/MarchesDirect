/* Marchés Direct — service worker (5 nov.).
   Rôle volontairement limité : rendre le site installable et afficher les notifications « votre dossier a avancé ».
   Aucune mise en cache des pages : après chaque mise en ligne, le visiteur a toujours la dernière version. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = {}; }
  const title = data.title || 'Votre dossier a avancé';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || 'Touchez pour voir où en est votre dossier avec Elena.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'md-dossier',
    renotify: true,
    data: { url: data.url || '/mon-espace' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/mon-espace';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
