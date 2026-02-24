import admin from "firebase-admin";

let messaging = null;

// Initialize Firebase Admin securely using Environment Variables
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
        let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
        // Remove surrounding quotes if Render or the user added them incorrectly
        if (rawJson.startsWith("'") && rawJson.endsWith("'")) {
            rawJson = rawJson.slice(1, -1).trim();
        } else if (rawJson.startsWith('"') && rawJson.endsWith('"')) {
            // Look for double quotes that might be accidental wrapping
            try {
                // If it's valid JSON directly, great. 
                // If not, maybe it's stringyfied twice.
                JSON.parse(rawJson);
            } catch (e) {
                rawJson = rawJson.slice(1, -1).trim();
            }
        }

        const serviceAccount = JSON.parse(rawJson);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("✅ Firebase Admin initialized from ENV.");
        }

        // Initialize messaging service only if app is initialized
        messaging = admin.messaging();

    } catch (err) {
        console.error("❌ Error initializing Firebase Admin (parsing JSON):", err.message);
    }
} else {
    // Only warn, do not crash. This allows the server to run even if notifications are misconfigured.
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not set. Notifications disabled.");
}

export { messaging };
export default admin;
