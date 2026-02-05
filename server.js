import express from "express";
import pg from "pg";
import cors from "cors";
import admin from "firebase-admin";

const { Pool } = pg;
const app = express();

// ---------------------------------------------------------
// 1. CONFIGURACIÓN DE CORS MEJORADA (CRUCIAL PARA EL 404)
// ---------------------------------------------------------
// Esto permite que tu Frontend en el puerto 8080 hable con este servidor
app.use(cors({
  origin: ["http://localhost:8080", "http://127.0.0.1:8080"], // Orígenes permitidos
  methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
  allowedHeaders: ["Content-Type", "Authorization"] // Cabeceras permitidas
}));

app.use(express.json());

// MiddleWare de Logging (Para ver en la terminal qué llega)
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// NOTA DE SEGURIDAD: Eventualmente moveremos esto a variables de entorno.
const connectionString =
  "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ---------------------------------------------------------
// 2. INICIALIZACIÓN DE FIREBASE SEGURA
// ---------------------------------------------------------
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    // Verificamos si ya existe una app iniciada para evitar errores
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("🔥 Firebase Admin inicializado correctamente.");
    } else {
        console.log("🔥 Firebase Admin ya estaba activo.");
    }
  } catch (err) {
    console.error("❌ Error inicializando Firebase Admin:", err.message);
  }
} else {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON no está configurada. Envío de notificaciones deshabilitado.");
}

// --- FUNCIONES AUXILIARES DE NOTIFICACIÓN ---

async function sendFcmToTokens(tokens = [], title = "Recordatorio", body = "Tienes un nuevo recordatorio", data = {}) {
  if (!admin.apps.length) return;
  if (!Array.isArray(tokens) || tokens.length === 0) return;

  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`📨 FCM Personal: enviados=${response.successCount}, fallidos=${response.failureCount}`);
  } catch (err) {
    console.error("❌ Error enviando FCM:", err.message);
  }
}

async function sendNotificationToTopic(topic = "all", title, body, data = {}) {
  if (!admin.apps.length) return;
  
  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    topic: topic,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`📢 Notificación enviada al tema '${topic}' con éxito:`, response);
  } catch (err) {
    console.error("❌ Error enviando notificación de tema:", err.message);
  }
}

// ==========================================
// RUTAS DE LA API
// ==========================================

app.get("/", (req, res) => {
  res.send("¡Hola! El servidor de Biyuyo está funcionando y listo ☁️");
});

// --- SUSCRIPCIÓN (La ruta que te daba problemas) ---
// La ponemos arriba para asegurar que Express la lea rápido
app.post("/subscribe", async (req, res) => {
  const { token, topic } = req.body;
  
  console.log("🔔 Petición de suscripción recibida para tema:", topic || "all");

  if (!token) {
    console.log("⚠️ Intento de suscripción sin token");
    return res.status(400).json({ error: "Token es requerido" });
  }

  try {
    await admin.messaging().subscribeToTopic(token, topic || "all");
    
    console.log(`✅ DISPOSITIVO SUSCRITO CON ÉXITO AL TEMA: ${topic || "all"}`);
    res.json({ success: true, message: `Suscrito a ${topic || "all"}` });
  } catch (error) {
    console.error("❌ Error al suscribir al tema en Firebase:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- USUARIOS ---
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users/token", async (req, res) => {
  const { user_id, token } = req.body;
  if (!user_id || !token) return res.status(400).json({ error: "Faltan datos" });

  try {
    await pool.query(
      `INSERT INTO user_push_tokens (user_id, token, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, token) DO UPDATE SET token = EXCLUDED.token, created_at = NOW();`,
      [user_id, token]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GASTOS ---
app.post("/expenses", async (req, res) => {
  const { macrocategoria, categoria, negocio, total_amount, user_id, receipt_image_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO expenses (macrocategoria, categoria, negocio, total_amount, user_id, receipt_image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
      [macrocategoria, categoria, negocio, total_amount, user_id, receipt_image_url || null]
    );
    console.log("✅ Gasto guardado exitosamente");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error guardando gasto:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/expenses", async (req, res) => {
  const { userId } = req.query;
  try {
    let query = "SELECT * FROM expenses";
    let values = [];
    if (userId) {
      query += " WHERE user_id = $1";
      values.push(userId);
    }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INGRESOS ---
app.post("/incomes", async (req, res) => {
  const { macrocategoria, categoria, negocio, total_amount, user_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO incomes (macrocategoria, categoria, negocio, total_amount, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
      [macrocategoria, categoria, negocio, total_amount, user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/incomes", async (req, res) => {
  const { userId } = req.query;
  try {
    let query = "SELECT * FROM incomes";
    let values = [];
    if (userId) {
      query += " WHERE user_id = $1";
      values.push(userId);
    }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RECORDATORIOS ---
app.post("/reminders", async (req, res) => {
  const { user_id, nombre, macrocategoria, categoria, negocio, monto, fecha_proximo_pago, frecuencia, es_cuota, cuota_actual } = req.body;

  try {
    const query = `
      INSERT INTO reminders (user_id, reminder_name, macrocategoria, categoria, negocio, total_amount, next_payment_date, payment_frequency, is_installment, installment_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
    `;
    const values = [user_id, nombre, macrocategoria, categoria, negocio, monto, fecha_proximo_pago, frecuencia, es_cuota, cuota_actual];

    const result = await pool.query(query, values);
    const saved = result.rows[0];

    console.log("✅ Recordatorio guardado:", saved.reminder_id);

    // 1. Notificación General (Topic 'all')
    await sendNotificationToTopic("all", "🔔 Nuevo Recordatorio", `${nombre} - Pago para: ${negocio}`);
    
    // 2. Notificación Personal (Tokens)
    try {
      const tokenRes = await pool.query("SELECT token FROM user_push_tokens WHERE user_id = $1", [user_id]);
      const tokens = tokenRes.rows.map(r => r.token).filter(Boolean);
      if (tokens.length > 0) {
        await sendFcmToTokens(tokens, "Recordatorio creado", `${nombre} - vence: ${fecha_proximo_pago}`, { reminder_id: saved.reminder_id });
      }
    } catch (err) {
      console.error("Error buscando tokens:", err.message);
    }

    res.json(saved);
  } catch (err) {
    console.error("Error guardando recordatorio:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/reminders", async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query("SELECT * FROM reminders ORDER BY next_payment_date ASC");
    const recordatoriosFormateados = result.rows.map((row) => ({
      id: row.reminder_id,
      user_id: row.user_id,
      nombre: row.reminder_name,
      macrocategoria: row.macrocategoria,
      categoria: row.categoria,
      negocio: row.negocio,
      monto: row.total_amount,
      fecha_proximo_pago: row.next_payment_date,
      frecuencia: row.payment_frequency,
      es_cuota: row.is_installment,
      cuota_actual: row.installment_number,
    }));
    res.json(recordatoriosFormateados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- OTROS GETS (Exchange Rates, Accounts) ---
app.get("/exchange-rates", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM exchange_rates ORDER BY rate_date DESC LIMIT 30");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/accounts", async (req, res) => {
  const { userId } = req.query;
  try {
    let query = "SELECT * FROM accounts";
    let values = [];
    if (userId) {
      query += " WHERE user_id = $1";
      values.push(userId);
    }
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/exchange-rates/latest", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM exchange_rates ORDER BY rate_date DESC LIMIT 1");
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INICIO ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en el puerto ${PORT}`);
});