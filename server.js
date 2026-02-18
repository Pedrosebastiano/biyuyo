import "dotenv/config";
import express from "express";
import pg from "pg";
import cors from "cors";
import cron from "node-cron";
import { messaging } from "./firebase-admin-setup.js";
import bcrypt from 'bcrypt';
import { calculateAndSaveMLFeatures } from './mlFeatures.js';

const { Pool } = pg;
const app = express();

// Enable CORS for all origins to avoid issues with Vercel deployment
app.use(cors({ origin: 'https://biyuyo-sand.vercel.app' }));
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
  
  import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

  const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
  const FROM_EMAIL = "MS_EZEOZi@test-z0vklo6veopl7qrx.mlsender.net"; // ej: noreply@trial-abc123.mlsender.net  mssp.SU0Xp2B.k68zxl2y7o94j905.1Xqtq63
  const FROM_NAME = "Biyuyo";
  
  if (process.env.MAILERSEND_API_KEY) {
    console.log("✅ MailerSend configurado");
  } else {
    console.error("❌ MAILERSEND_API_KEY no está configurada");
  }

  async function sendEmail(toEmail, toName, subject, htmlContent) {
    const sentFrom = new Sender(FROM_EMAIL, FROM_NAME);
    const recipients = [new Recipient(toEmail, toName)];
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(htmlContent);
    return await mailerSend.email.send(emailParams);
  }

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
      is_premium: newUser.is_premium || false,
    });

  } catch (err) {
    console.error("Error en signup:", err);
    res.status(500).json({ error: "Error al crear la cuenta" });
  }
});

// Agregar después del endpoint /signup existente

// --- LOGIN ---
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  try {
    // Buscar usuario por email
    const userResult = await pool.query(
      "SELECT user_id, name, email, password_hash FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = userResult.rows[0];

    // Verificar contraseña
    const bcrypt = await import('bcrypt');
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    console.log(`✅ Login exitoso: ${user.email}`);

    // Retornar datos del usuario (sin password_hash)
    res.json({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      is_premium: user.is_premium || false,
    });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// --- FORGOT PASSWORD (Solicitar reset) ---
// --- FORGOT PASSWORD (Solicitar reset) ---
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email es requerido" });
  }

  try {
    // Verificar que el usuario existe
    const userResult = await pool.query(
      "SELECT user_id, email, name FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({ 
        success: true, 
        message: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña" 
      });
    }

    const user = userResult.rows[0];

    // Generar token de reset (válido por 1 hora)
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en la base de datos
    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires = $2 
       WHERE user_id = $3`,
      [resetToken, resetExpires, user.user_id]
    );

    console.log(`🔑 Token de reset generado para ${user.email}: ${resetToken}`);

    // AGREGAR ESTO - verificar que las env vars están configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("❌ GMAIL_USER o GMAIL_APP_PASSWORD no están configuradas en las variables de entorno");
      return res.status(500).json({ 
        error: "El servicio de email no está configurado. Contacta al administrador." 
      });
    }

    // Enviar email con el token
    try {
      await sendEmail(
        user.email,
        user.name,
        'Recuperación de contraseña - Biyuyo',
        `<!DOCTYPE html><html><head><style>
          body{font-family:Arial,sans-serif;color:#333}
          .container{max-width:600px;margin:0 auto;padding:20px}
          .header{background:#2d509e;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
          .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
          .token-box{background:white;border:2px solid #2d509e;padding:20px;margin:20px 0;text-align:center;border-radius:8px}
          .token{font-size:22px;font-weight:bold;color:#2d509e;font-family:monospace;word-break:break-all}
          .warning{background:#fff3cd;border-left:4px solid #ffc107;padding:12px;margin:20px 0}
        </style></head><body>
          <div class="container">
            <div class="header"><h1>Biyuyo</h1><p>Recuperación de Contraseña</p></div>
            <div class="content">
              <p>Hola ${user.name},</p>
              <p>Usa este código para restablecer tu contraseña:</p>
              <div class="token-box"><div class="token">${resetToken}</div></div>
              <div class="warning">⚠️ Este código expira en <strong>1 hora</strong></div>
              <p>Si no solicitaste este cambio, ignora este correo.</p>
            </div>
          </div>
        </body></html>`
      );
      console.log(`📧 Email de recuperación enviado a ${user.email}`);
      res.json({ success: true, message: "Si el correo existe, recibirás instrucciones para restablecerla" });
    } catch (emailError) {
      console.error("❌ Error MailerSend:", emailError);
      res.status(500).json({ error: `Error al enviar el correo: ${emailError?.message}` });
    }

  } catch (err) {
    console.error("Error en forgot-password:", err);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

// --- RESET PASSWORD (Cambiar contraseña con token) ---
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  console.log("📥 Reset password request:", { 
    token: token?.substring(0, 10) + "...", 
    passwordLength: newPassword?.length 
  });

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token y nueva contraseña son requeridos" });
  }

  // Validaciones de contraseña
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({ error: "La contraseña debe contener al menos una letra mayúscula" });
  }

  if (!/[.!@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?]/.test(newPassword)) {
    return res.status(400).json({ error: "La contraseña debe contener al menos un carácter especial" });
  }

  try {
    // Buscar usuario con token y obtener tiempo de expiración
    const userResult = await pool.query(
      `SELECT user_id, email, name, reset_token_expires
       FROM users 
       WHERE reset_token = $1`,
      [token.trim()]
    );

    console.log("🔍 Token búsqueda resultado:", userResult.rows.length > 0 ? "Encontrado" : "No encontrado");

    if (userResult.rows.length === 0) {
      console.log("❌ Token no encontrado en base de datos");
      return res.status(400).json({ error: "Token inválido" });
    }

    const user = userResult.rows[0];
    
    // Comparar fechas en JavaScript (más confiable)
    const expiresAt = new Date(user.reset_token_expires);
    const now = new Date();
    
    console.log(`⏱️ Expira en: ${expiresAt.toISOString()}`);
    console.log(`⏱️ Ahora es: ${now.toISOString()}`);
    console.log(`⏱️ Diferencia: ${Math.round((expiresAt - now) / 1000 / 60)} minutos`);

    if (now > expiresAt) {
      console.log("⏰ Token expirado");
      return res.status(400).json({ error: "El token ha expirado. Solicita uno nuevo." });
    }

    // Hash de la nueva contraseña
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y limpiar token
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
       WHERE user_id = $2`,
      [password_hash, user.user_id]
    );

    console.log(`✅ Contraseña actualizada para: ${user.email}`);

    res.json({ 
      success: true, 
      message: "Contraseña actualizada exitosamente" 
    });

  } catch (err) {
    console.error("Error en reset-password:", err);
    res.status(500).json({ error: "Error al restablecer la contraseña" });
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
    const newExpense = result.rows[0];

    console.log("✅ Gasto guardado:", newExpense.expense_id);
    console.log("👤 user_id recibido:", user_id);
    console.log("📦 newExpense completo:", JSON.stringify(newExpense, null, 2));

    // Responder primero
    res.json(newExpense);

    // Calcular features DESPUÉS de responder, con await directo
    if (user_id) {
      console.log("🚀 [ML] Iniciando cálculo de features...");
      try {
        const featureId = await calculateAndSaveMLFeatures(
          newExpense.expense_id,
          user_id,
          {
            total_amount: newExpense.total_amount,
            macrocategoria: newExpense.macrocategoria,
            categoria: newExpense.categoria,
            created_at: newExpense.created_at,
          },
          pool
        );
        console.log("🎯 [ML] Feature ID retornado:", featureId);
      } catch (mlError) {
        console.error("💥 [ML] Error capturado en endpoint:", mlError);
      }
    } else {
      console.log("⚠️ [ML] No se calcularon features: user_id es null/undefined");
    }

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

// Obtener la suma de los saldos iniciales de todas las cuentas
app.get('/account-balance/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT SUM(balance) as total_initial FROM accounts WHERE user_id = $1',
      [userId]
    );
    // Si no tiene cuentas, retorna 0
    const initialBalance = result.rows[0].total_initial || 0;
    res.json({ success: true, initialBalance: Number(initialBalance) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener balance' });
  }
});

// Crear o actualizar una cuenta (Para el botón de "Ajustar Saldo")
// Simplificado: Crearemos una cuenta llamada "Principal" si no existe, o actualizaremos su saldo
app.post('/set-initial-balance', async (req, res) => {
  const { userId, amount } = req.body;
  try {
    // 1. Buscamos si ya tiene una cuenta "Efectivo/Principal"
    const existing = await pool.query(
      'SELECT * FROM accounts WHERE user_id = $1 AND name = $2',
      [userId, 'Principal']
    );

    if (existing.rows.length > 0) {
      // Actualizar
      await pool.query(
        'UPDATE accounts SET balance = $1 WHERE account_id = $2',
        [amount, existing.rows[0].account_id]
      );
    } else {
      // Crear nueva
      await pool.query(
        'INSERT INTO accounts (user_id, name, balance) VALUES ($1, $2, $3)',
        [userId, 'Principal', amount]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar saldo' });
  }
});


app.get("/reminders", async (req, res) => {
  const { userId } = req.query;
  
  try {
    let query = "SELECT * FROM reminders";
    let values = [];

    // ✅ FILTRAR por userId si se proporciona
    if (userId) {
      query += " WHERE user_id = $1";
      values.push(userId);
    }

    query += " ORDER BY next_payment_date ASC";

    const result = await pool.query(query, values);

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

    console.log(`✅ Recordatorios obtenidos para user ${userId || 'todos'}: ${recordatoriosFormateados.length}`);
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

// --- VERIFICACIÓN UNIMET (Enviar token) ---
app.post("/send-unimet-verification", async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id es requerido" });
  }

  try {
    const userResult = await pool.query(
      "SELECT user_id, email, name, is_premium FROM users WHERE user_id = $1",
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];
    const email = user.email.toLowerCase();
    const isUnimet =
      email.endsWith("@correo.unimet.edu.ve") ||
      email.endsWith("@unimet.edu.ve");

    if (!isUnimet) {
      return res.status(400).json({ error: "El correo no es de dominio Unimet" });
    }

    if (user.is_premium) {
      return res.status(400).json({ error: "La cuenta ya está verificada como Premium" });
    }

    const crypto = await import("crypto");
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 3600000);

    await pool.query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE user_id = $3`,
      [verificationToken, tokenExpires, user.user_id]
    );

    try {
      await sendEmail(
        user.email,
        user.name,
        'Verificación Unimet Premium - Biyuyo',
        `<!DOCTYPE html><html><head><style>
          body{font-family:Arial,sans-serif;color:#333}
          .container{max-width:600px;margin:0 auto;padding:20px}
          .header{background:#2d509e;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
          .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
          .token-box{background:white;border:2px solid #2d509e;padding:20px;margin:20px 0;text-align:center;border-radius:8px}
          .token{font-size:18px;font-weight:bold;color:#2d509e;font-family:monospace;word-break:break-all}
          .warning{background:#fff3cd;border-left:4px solid #ffc107;padding:12px;margin:20px 0}
        </style></head><body>
          <div class="container">
            <div class="header"><h1>Biyuyo</h1><p>Verificación Unimet</p></div>
            <div class="content">
              <p>Hola ${user.name},</p>
              <p>Tu código para activar <strong>Premium</strong>:</p>
              <div class="token-box"><div class="token">${verificationToken}</div></div>
              <div class="warning">⚠️ Expira en <strong>1 hora</strong></div>
              <p>Si no solicitaste esto, ignora este correo.</p>
            </div>
          </div>
        </body></html>`
      );
      console.log(`📧 Token Unimet enviado a ${user.email}`);
      res.json({ success: true, message: "Código de verificación enviado a tu correo" });
    } catch (emailError) {
      console.error("❌ Error MailerSend Unimet:", emailError);
      res.status(500).json({ error: `Error al enviar el correo: ${emailError?.message}` });
    }

  } catch (err) {
    console.error("Error en send-unimet-verification:", err);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

// --- VERIFICACIÓN UNIMET (Confirmar token y activar Premium) ---
app.post("/verify-unimet-token", async (req, res) => {
  const { user_id, token } = req.body;

  if (!user_id || !token) {
    return res.status(400).json({ error: "user_id y token son requeridos" });
  }

  try {
    const userResult = await pool.query(
      `SELECT user_id, email, name, reset_token_expires, is_premium
       FROM users WHERE user_id = $1 AND reset_token = $2`,
      [user_id, token.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Token inválido" });
    }

    const user = userResult.rows[0];
    const expiresAt = new Date(user.reset_token_expires);
    const now = new Date();

    if (now > expiresAt) {
      return res.status(400).json({ error: "El token ha expirado. Solicita uno nuevo." });
    }

    await pool.query(
      `UPDATE users SET is_premium = true, reset_token = NULL, reset_token_expires = NULL WHERE user_id = $1`,
      [user.user_id]
    );

    console.log(`⭐ Usuario ${user.email} verificado como Premium`);
    res.json({ success: true, message: "¡Cuenta verificada! Ahora tienes acceso Premium." });

  } catch (err) {
    console.error("Error en verify-unimet-token:", err);
    res.status(500).json({ error: "Error al verificar el token" });
  }
});

// --- OBTENER DATOS DE USUARIO ---
app.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT user_id, name, email, is_premium FROM users WHERE user_id = $1",
      [user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en GET /user/:user_id:", err);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

// --- FEEDBACK DE GASTOS (para ML) ---
app.post("/expenses/:expense_id/feedback", async (req, res) => {
  const { expense_id } = req.params;
  const { user_id, feedback } = req.body;

  // Validar que feedback sea 1, 0 o -1
  if (feedback === undefined || feedback === null || ![1, 0, -1].includes(Number(feedback))) {
    return res.status(400).json({ 
      error: "Feedback inválido. Debe ser 1 (buena decisión), 0 (neutral) o -1 (me arrepentí)" 
    });
  }

  if (!expense_id || !user_id) {
    return res.status(400).json({ error: "expense_id y user_id son requeridos" });
  }

  try {
    // Verificar que el gasto pertenece al usuario
    const checkQuery = `
      SELECT expense_id FROM expenses 
      WHERE expense_id = $1 AND user_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [expense_id, user_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Gasto no encontrado o no pertenece al usuario" });
    }

    // Guardar el feedback
    const updateQuery = `
      UPDATE expenses 
      SET user_feedback = $1 
      WHERE expense_id = $2 AND user_id = $3
      RETURNING expense_id, user_feedback
    `;
    const result = await pool.query(updateQuery, [Number(feedback), expense_id, user_id]);

    // También actualizar el label en expense_ml_features si existe
    await pool.query(
      `UPDATE expense_ml_features 
       SET label = $1, updated_at = NOW() 
       WHERE expense_id = $2`,
      [Number(feedback), expense_id]
    );

    console.log(`✅ Feedback guardado: gasto ${expense_id} → ${feedback}`);
    res.json({ 
      success: true, 
      expense_id: result.rows[0].expense_id,
      feedback: result.rows[0].user_feedback
    });

  } catch (err) {
    console.error("Error guardando feedback:", err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener estadísticas de feedback de un usuario (útil para el futuro modelo)
app.get("/expenses/feedback-stats/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE user_feedback = 1)  AS good_decisions,
        COUNT(*) FILTER (WHERE user_feedback = 0)  AS neutral_decisions,
        COUNT(*) FILTER (WHERE user_feedback = -1) AS regretted_decisions,
        COUNT(*) FILTER (WHERE user_feedback IS NULL) AS no_feedback,
        COUNT(*) AS total_expenses
      FROM expenses
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [user_id]);
    res.json({ success: true, stats: result.rows[0] });
  } catch (err) {
    console.error("Error obteniendo stats de feedback:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- VER ML FEATURES DE UN GASTO (útil para debugging y futuro dashboard) ---
app.get("/expenses/:expense_id/features", async (req, res) => {
  const { expense_id } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id es requerido" });
  }

  try {
    const query = `
      SELECT 
        f.*,
        e.user_feedback,
        e.negocio,
        e.created_at AS expense_date
      FROM expense_ml_features f
      JOIN expenses e ON e.expense_id = f.expense_id
      WHERE f.expense_id = $1 
        AND f.user_id = $2
    `;
    const result = await pool.query(query, [expense_id, user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Features no encontrados para este gasto" });
    }

    res.json({ success: true, features: result.rows[0] });
  } catch (err) {
    console.error("Error obteniendo features:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- RESUMEN DE ML FEATURES DEL USUARIO (para el futuro entrenamiento) ---
app.get("/ml/summary/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT
        COUNT(*)                                          AS total_expenses_with_features,
        COUNT(*) FILTER (WHERE e.user_feedback IS NOT NULL) AS labeled_expenses,
        COUNT(*) FILTER (WHERE e.user_feedback = 1)      AS good_decisions,
        COUNT(*) FILTER (WHERE e.user_feedback = 0)      AS neutral_decisions,
        COUNT(*) FILTER (WHERE e.user_feedback = -1)     AS regretted_decisions,
        ROUND(AVG(f.amount)::numeric, 2)                 AS avg_expense_amount,
        ROUND(AVG(f.balance_at_time)::numeric, 2)        AS avg_balance_at_time,
        ROUND(AVG(f.savings_rate)::numeric, 4)           AS avg_savings_rate,
        ROUND(AVG(f.amount_to_balance_ratio)::numeric, 4) AS avg_amount_to_balance_ratio,
        ROUND(AVG(f.overdue_reminders_count)::numeric, 2) AS avg_overdue_reminders
      FROM expense_ml_features f
      JOIN expenses e ON e.expense_id = f.expense_id
      WHERE f.user_id = $1
    `;
    const result = await pool.query(query, [user_id]);

    res.json({ 
      success: true, 
      summary: result.rows[0],
      ready_for_training: parseInt(result.rows[0].labeled_expenses) >= 50,
      message: parseInt(result.rows[0].labeled_expenses) < 50
        ? `Necesitas ${50 - parseInt(result.rows[0].labeled_expenses)} gastos con feedback más para entrenar el modelo`
        : "¡Tienes suficientes datos para entrenar el modelo!"
    });
  } catch (err) {
    console.error("Error obteniendo resumen ML:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/ml/last-features/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT
         monthly_income_avg,
         monthly_expense_avg,
         savings_rate,
         upcoming_reminders_amount,
         overdue_reminders_count,
         balance_at_time,
         updated_at
       FROM expense_ml_features
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, features: null });
    }

    res.json({ success: true, features: result.rows[0] });
  } catch (err) {
    console.error("Error en /ml/last-features:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- CONFIGURACIÓN DEL PUERTO ---
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en el puerto ${PORT}`);
});
