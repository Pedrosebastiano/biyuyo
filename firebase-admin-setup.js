import admin from "firebase-admin";

let messaging = null;

// Initialize Firebase Admin securely using Environment Variables
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("✅ Firebase Admin initialized from ENV.");
        }

        // Initialize messaging service only if app is initialized
        messaging = admin.messaging();

    } catch (err) {
        console.error("❌ Error initializing Firebase Admin:", err.message);
    }
} else {
    // Only warn, do not crash. This allows the server to run even if notifications are misconfigured.
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not set. Notifications disabled.");
}

export { messaging };
export default admin;
