// public/sw.js
self.addEventListener('push', event => {
  const data = event.data.json();
  console.log('Push received:', data);

  const title = data.title || 'GoBus Notification';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/vite.svg', // A path to an icon
    badge: '/vite.svg', // A path to a badge icon
    data: data.data || {} // To handle clicks
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    // Here you would handle what happens when a notification is clicked.
    // e.g., open a specific page of the app
    console.log('Notification click received:', event.notification.data);
    event.waitUntil(
        clients.openWindow('/') // Opens the base URL of the app
    );
});
