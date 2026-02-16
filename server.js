import "dotenv/config";
import express from "express";
import pg from "pg";
import cors from "cors";
import cron from "node-cron";
import { messaging } from "./firebase-admin-setup.js";
import bcrypt from 'bcrypt';

const { Pool } = pg;
const app = express();

// Enable CORS for all origins to avoid issues with Vercel deployment
app.use(cors());
app.use(express.json());

// MiddleWare de Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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

// --- RUTA DE PRUEBA ---
app.get("/", (req, res) => {
  res.send("¡Hola! El servidor de Biyuyo (Current) está funcionando y listo ☁️");
});

// --- TOKEN PUSH NOTIFICATIONS ---
app.post("/save-token", async (req, res) => {
  const { token, user_id } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Upsert: Si ya existe el token, actualizamos su 'updated_at'
    const query = `
        INSERT INTO user_tokens (token, user_id, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (token) 
        DO UPDATE SET updated_at = NOW(), user_id = EXCLUDED.user_id;
      `;

    await pool.query(query, [token, user_id || null]);
    console.log("🔔 Token FCM guardado/actualizado.");
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving token:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- CRON JOB: RECORDATORIOS ---
// --- CRON JOB: RECORDATORIOS ---
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Sólo ejecutar en horas específicas (y minuto 0) para evitar spam y duplicados
  // 9:00 -> Todos types (Antes, Durante, Después)
  // 13:00 -> Después (2da notificación del día para vencidos)
  // 17:00 -> Durante (2da notificación del día para "hoy")
  // 18:00 -> Después (3ra notificación del día para vencidos)
  const validHours = [9, 13, 17, 18];

  // Verificación estricta de hora y minuto
  if (currentMinute !== 0 || !validHours.includes(currentHour)) {
    return;
  }

  console.log(`⏰ Ejecutando cron de recordatorios (${currentHour}:${currentMinute})...`);

  try {
    // 1. Obtener TODOS los recordatorios activos con sus tokens
    // Se trae todo para evaluar la lógica compleja de fechas en JS
    const remindersQuery = `
              SELECT r.*, ut.token 
              FROM reminders r
              LEFT JOIN user_tokens ut ON r.user_id = ut.user_id 
          `;

    const { rows } = await pool.query(remindersQuery);

    if (rows.length === 0) {
      console.log("📅 No hay recordatorios activos.");
      return;
    }

    // 2. Procesar cada recordatorio
    for (const row of rows) {
      if (!messaging) continue;
      if (!row.token) continue;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const paymentDate = new Date(row.next_payment_date);
      paymentDate.setHours(0, 0, 0, 0);

      // Calcular diferencia en días: (Payment - Today)
      // > 0: Futuro (Faltan X días)
      // 0: Hoy
      // < 0: Pasado (Vencido hace X días)
      // Usamos Math.round para evitar problemas de horas intermedias, aunque seteamos a 0
      const diffTime = paymentDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let shouldNotify = false;
      let notificationTitle = "";
      let notificationBody = "";

      const frequency = (row.payment_frequency || "").toLowerCase();

      // --- LOGICA HEURÍSTICA ---

      // A) Días ANTES de la fecha (diffDays > 0)
      if (diffDays > 0) {
        // Solo enviamos a las 9 AM
        if (currentHour === 9) {
          let startDaysBefore = 7; // Default (Month-ish)

          if (frequency.includes("diario") || frequency.includes("daily")) {
            startDaysBefore = 1;
          } else if (frequency.includes("semanal") || frequency.includes("weekly")) {
            startDaysBefore = 2; // "Start 2 days before" -> Días 2 y 1
          } else if (frequency.includes("mensual") || frequency.includes("monthly")) {
            startDaysBefore = 7; // "Start a week before" -> Días 7..1
          } else if (
            frequency.includes("anual") || frequency.includes("yearly") ||
            frequency.includes("bimestral") || frequency.includes("trimestral") ||
            frequency.includes("semestral")
          ) {
            // Periodo mayor -> 2 semanas antes
            startDaysBefore = 14;
          }

          if (diffDays <= startDaysBefore) {
            shouldNotify = true;
            notificationTitle = "⏳ Recordatorio Próximo";
            notificationBody = `Tu pago de ${row.reminder_name} vence en ${diffDays} día${diffDays !== 1 ? 's' : ''}.`;
          }
        }
      }

      // B) El DÍA de la notificación (diffDays === 0)
      else if (diffDays === 0) {
        // Enviar 2 notificaciones: 9 AM y 17 PM
        if (currentHour === 9 || currentHour === 17) {
          shouldNotify = true;
          notificationTitle = "🔔 ¡Es Hoy!";
          notificationBody = `Hoy vence tu pago de: ${row.reminder_name} ($${row.total_amount})`;
        }
      }

      // C) Días DESPUÉS de la notificación (diffDays < 0)
      else {
        // Enviar 3 notificaciones diarias: 9 AM, 13 PM, 18 PM
        // Solo enviamos si el recordatorio sigue activo (asumimos que si row existe y fecha es vieja, está impago)
        if (currentHour === 9 || currentHour === 13 || currentHour === 18) {
          shouldNotify = true;
          const daysOverdue = Math.abs(diffDays);
          notificationTitle = "⚠️ Pago Vencido";
          notificationBody = `Tu pago de ${row.reminder_name} está vencido por ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''}.`;
        }
      }

      // --- ENVIAR NOTIFICACIÓN ---
      if (shouldNotify) {
        const message = {
          notification: {
            title: notificationTitle,
            body: notificationBody,
          },
          token: row.token
        };

        try {
          // Log extra para depuración
          console.log(`📤 Enviando notificación (${currentHour}:00) a User ${row.user_id} - ${row.reminder_name} (Days: ${diffDays})`);

          await messaging.send(message);

          // Actualizamos notified_at solo para registro, aunque la lógica ya no depende estrictamente de él para bloqueo diario simple
          await pool.query(
            "UPDATE reminders SET notified_at = NOW() WHERE reminder_id = $1",
            [row.reminder_id]
          );
        } catch (sendError) {
          console.error(`❌ Error enviando FCM a ${row.user_id}:`, sendError.message);
        }
      }
    }

  } catch (err) {
    console.error("❌ Error en cron job:", err);
  }
});

// --- SIGNUP ---
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  try {
    // Hash password using bcrypt
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Este correo ya está registrado" });
    }

    // Insert user
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING user_id, name, email, created_at`,
      [name, email.toLowerCase(), password_hash]
    );

    const newUser = userResult.rows[0];

    // Create default account for the user
    await pool.query(
      `INSERT INTO accounts (user_id, name, balance) 
       VALUES ($1, $2, $3)`,
      [newUser.user_id, "Cuenta Principal", 0]
    );

    console.log(`✅ Usuario creado exitosamente: ${newUser.email}`);

    // Return user data (without password hash)
    res.json({
      user_id: newUser.user_id,
      name: newUser.name,
      email: newUser.email,
      created_at: newUser.created_at,
    });

  } catch (err) {
    console.error("Error en signup:", err);
    res.status(500).json({ error: "Error al crear la cuenta" });
  }
});

// --- USUARIOS ---
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- GASTOS (EXPENSES) ---
app.post("/expenses", async (req, res) => {
  const {
    macrocategoria,
    categoria,
    negocio,
    total_amount,
    user_id,
    receipt_image_url,
  } = req.body;

  try {
    const query = `
      INSERT INTO expenses (macrocategoria, categoria, negocio, total_amount, user_id, receipt_image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      macrocategoria,
      categoria,
      negocio,
      total_amount,
      user_id,
      receipt_image_url || null,
    ];

    const result = await pool.query(query, values);
    console.log("✅ Gasto guardado exitosamente:", result.rows[0]);
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- INGRESOS (INCOMES) ---
app.post("/incomes", async (req, res) => {
  const { macrocategoria, categoria, negocio, total_amount, user_id } =
    req.body;

  try {
    const query = `
      INSERT INTO incomes (macrocategoria, categoria, negocio, total_amount, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [macrocategoria, categoria, negocio, total_amount, user_id];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error guardando ingreso:", err.message);
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- RECORDATORIOS (REMINDERS) ---
app.post("/reminders", async (req, res) => {
  const {
    user_id,
    nombre,
    macrocategoria,
    categoria,
    negocio,
    monto,
    fecha_proximo_pago,
    frecuencia,
    es_cuota,
    cuota_actual,
  } = req.body;

  try {
    const query = `
      INSERT INTO reminders (
        user_id, 
        reminder_name, 
        macrocategoria, 
        categoria, 
        negocio, 
        total_amount, 
        next_payment_date, 
        payment_frequency, 
        is_installment, 
        installment_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const values = [
      user_id,
      nombre,
      macrocategoria,
      categoria,
      negocio,
      monto,
      fecha_proximo_pago,
      frecuencia,
      es_cuota,
      cuota_actual,
    ];

    const result = await pool.query(query, values);
    const newReminder = result.rows[0];

    // ✨ IMMEDIATE NOTIFICATION: Si el recordatorio es para HOY, enviar notificación ahora
    if (messaging) {
      try {
        const reminderDate = new Date(fecha_proximo_pago);
        const today = new Date();
        // Comparar strings YYYY-MM-DD
        if (reminderDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
          const { rows: tokens } = await pool.query("SELECT token FROM user_tokens WHERE user_id = $1", [user_id]);

          if (tokens.length > 0) {
            // Enviar solo al dueño
            for (const t of tokens) {
              try {
                await messaging.send({
                  notification: {
                    title: "🔔 Nuevo Recordatorio",
                    body: `Para hoy: ${nombre} ($${monto})`,
                  },
                  token: t.token
                });
              } catch (e) {
                console.error("Error sending immediate notification:", e.message);
              }
            }
            // Mark notified
            await pool.query("UPDATE reminders SET notified_at = NOW() WHERE reminder_id = $1", [newReminder.reminder_id]);
          }
        }
      } catch (e) {
        console.error("Error in immediate notification logic:", e);
        // Don't fail the request
      }
    }

    res.json(newReminder);
  } catch (err) {
    console.error("Error guardando recordatorio:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/reminders", async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query(
      "SELECT * FROM reminders ORDER BY next_payment_date ASC",
    );

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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- TASAS DE CAMBIO (EXCHANGE RATES) ---
app.get("/exchange-rates", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM exchange_rates ORDER BY rate_date DESC LIMIT 30",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- CUENTAS (ACCOUNTS) ---
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/exchange-rates/latest", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM exchange_rates ORDER BY rate_date DESC LIMIT 1",
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- CONFIGURACIÓN DEL PUERTO ---
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en el puerto ${PORT}`);
});
