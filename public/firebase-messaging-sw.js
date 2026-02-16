/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBMZdbsXTWqLTL8ySCuvlxHu8ktZAAlwfY",
    authDomain: "biyuyo-8c90c.firebaseapp.com",
    projectId: "biyuyo-8c90c",
    storageBucket: "biyuyo-8c90c.firebasestorage.app",
    messagingSenderId: "532684541321",
    appId: "1:532684541321:web:b809ac3628b77ccc782558",
    measurementId: "G-MND794NJWS"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message: ', payload);

    if (payload.notification) {
        // Browser handles it automatically
        return;
    }

    const notificationTitle = payload.data?.title || 'Biyuyo Alerta';
    const notificationOptions = {
        body: payload.data?.body,
        icon: '/favicon.ico'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
