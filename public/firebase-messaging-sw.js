/* eslint-disable no-undef */
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyBMZdbsXTWqLTL8ySCuvlxHu8ktZAAlwfY",
    authDomain: "biyuyo-8c90c.firebaseapp.com",
    projectId: "biyuyo-8c90c",
    storageBucket: "biyuyo-8c90c.firebasestorage.app",
    messagingSenderId: "532684541321",
    appId: "1:532684541321:web:b809ac3628b77ccc782558",
    measurementId: "G-MND794NJWS"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Check if the payload contains a 'notification' property.
    // If it does, the browser automatically shows a notification, so we shouldn't show another one.
    if (payload.notification) {
        console.log('[firebase-messaging-sw.js] Browser will handle this notification automatically.');
        return;
    }

    // Customize notification here (ONLY for data-only messages)
    const notificationTitle = payload.data?.title || 'Biyuyo Notification';
    const notificationOptions = {
        body: payload.data?.body,
        icon: '/favicon.ico'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
