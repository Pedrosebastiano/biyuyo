import admin from "firebase-admin";

// CONFIGURACIÓN CON VARIABLE DE ENTORNO
// Esto evita tener que subir el archivo JSON a Git
// El JSON se carga desde la variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("✅ Firebase Admin inicializado correctamente desde ENV.");
        }
    } catch (err) {
        console.error("❌ Error inicializando Firebase Admin:", err.message);
    }
} else {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON no configurada.");
    console.warn("   Crea un archivo .env con:");
    console.warn("   FIREBASE_SERVICE_ACCOUNT_JSON='{...tu JSON aquí...}'");
}

export const messaging = admin.messaging;
export default admin;

