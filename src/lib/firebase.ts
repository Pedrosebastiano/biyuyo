// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyBMZdbsXTWqLTL8ySCuvlxHu8ktZAAlwfY",
    authDomain: "biyuyo-8c90c.firebaseapp.com",
    projectId: "biyuyo-8c90c",
    storageBucket: "biyuyo-8c90c.firebasestorage.app",
    messagingSenderId: "532684541321",
    appId: "1:532684541321:web:b809ac3628b77ccc782558",
    measurementId: "G-MND794NJWS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
export default app;
