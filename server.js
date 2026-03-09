import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import express from "express";
import pg from "pg";
import cors from "cors";
import cron from "node-cron";
import { messaging } from "./firebase-admin-setup.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { calculateAndSaveMLFeatures } from "./mlFeatures.js";
import crypto from "crypto";
import http from "http";
import { spawn, exec } from "child_process";
import path from "path";
import fs from "fs";

const { Pool } = pg;
const app = express();

// Enable CORS for all origins to avoid issues with Vercel deployment
// Enable CORS for all origins to avoid issues with Vercel deployment and Localhost
const allowedOrigins = [
  "https://biyuyo-sand.vercel.app",
  "https://biyuyo-pruebas.onrender.com", // <-- Added production domain
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }
      var msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    },
  }),
);
// MiddleWare de Logging
app.use((req, res, next) => {
  if (!req.url.startsWith("/api/ml") && !req.url.startsWith("/api/decision")) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

// --- REVERSE PROXY & ORQUESTADOR DE SERVICIOS IA ---
let mlServicesReady = false;
let mlInitializationStatus = "Iniciando...";

function createLocalProxy(targetPort, serviceName) {
  return (req, res) => {
    if (!mlServicesReady) {
      return res.status(503).json({
        error: "El servicio de IA se está inicializando.",
        status: mlInitializationStatus,
        service: serviceName,
      });
    }

    const options = {
      hostname: "127.0.0.1",
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${targetPort}` },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    // Timeout de 30 segundos para el proxy (útil para modelos lentos)
    proxyReq.setTimeout(30000, () => {
      console.warn(`[Proxy] ⚠️ Timeout en ${serviceName}`);
      proxyReq.destroy();
      if (!res.headersSent) {
        res
          .status(504)
          .json({ error: "Tiempo de espera agotado en el servicio de IA." });
      }
    });

    req.pipe(proxyReq, { end: true });

    proxyReq.on("error", (err) => {
      console.error(
        `[Proxy] ❌ Error conectando a ${serviceName} (puerto ${targetPort}):`,
        err.message,
      );
      res.status(502).json({
        error: `El servicio ${serviceName} no está disponible.`,
        details: err.message,
      });
    });
  };
}

app.use("/api/ml", createLocalProxy(8000, "Simulador ML"));
app.use("/api/decision", createLocalProxy(8001, "IA Decisión"));

async function startMLServices() {
  console.log("🐍 INFO: Iniciando servicios de IA en segundo plano...");
  mlInitializationStatus = "Instalando dependencias de Python...";

  const pythonLibsDir = path.resolve("./python_libs");
  if (!fs.existsSync(pythonLibsDir)) {
    fs.mkdirSync(pythonLibsDir, { recursive: true });
  }

  // Ejecutamos la instalación en background
  const installCmd = `python3 -m pip install --no-cache-dir --upgrade --target ${pythonLibsDir} -r ML/requirements.txt -r ml_decision/requirements.txt --quiet --break-system-packages`;

  exec(installCmd, (err) => {
    if (err) {
      console.error(
        "❌ ERROR: Falló la instalación de dependencias Python:",
        err.message,
      );
      mlInitializationStatus = "Error en instalación. Reintentando pronto...";
      setTimeout(startMLServices, 30000); // Reintento largo
      return;
    }

    console.log("✅ INFO: Dependencias Python listas.");
    mlInitializationStatus = "Lanzando APIs de IA...";

    const env = { ...process.env, PYTHONPATH: pythonLibsDir };

    const spawnService = (file, port, name) => {
      console.log(`🤖 Lanzando ${name} en puerto ${port}...`);
      const proc = spawn("python3", [file], { env });

      proc.stdout.on("data", (data) => console.log(`[${name}] ${data}`));
      proc.stderr.on("data", (data) =>
        console.error(`[${name} ERROR] ${data}`),
      );

      proc.on("close", (code) => {
        console.warn(
          `⚠️ ${name} se cerró con código ${code}. Reiniciando en 5s...`,
        );
        mlServicesReady = false;
        setTimeout(() => spawnService(file, port, name), 5000);
      });
    };

    spawnService("ML/api.py", 8000, "Simulador-API");
    spawnService("ml_decision/decision_api.py", 8001, "Decision-API");

    // Damos unos segundos para que arranquen antes de marcar como listos
    setTimeout(() => {
      mlServicesReady = true;
      mlInitializationStatus = "Servicios activos";
      console.log("🚀 INFO: Servicios de IA listos para recibir tráfico.");
    }, 10000);
  });
}

// Lanzar orquestación SIN bloquear el event loop principal del servidor
if (process.env.NODE_ENV === "production" || process.env.RENDER) {
  startMLServices();
} else {
  // En local, asumimos que el usuario usa 'npm run start:win' que ya lanza todo
  mlServicesReady = true;
}

app.use(express.json({ limit: '25mb' }));

// NOTA DE SEGURIDAD: Eventualmente moveremos esto a variables de entorno.
const connectionString =
  "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const POSTMARK_TOKEN = process.env.POSTMARK_API_TOKEN;
const SENDER_EMAIL = process.env.POSTMARK_SENDER_EMAIL;

console.log(
  POSTMARK_TOKEN ? "✅ Postmark configurado" : "❌ Falta POSTMARK_API_TOKEN",
);

async function sendEmail(toEmail, toName, subject, htmlContent) {
  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": POSTMARK_TOKEN,
    },
    body: JSON.stringify({
      From: `Biyuyo <${SENDER_EMAIL}>`,
      To: `${toName} <${toEmail}>`,
      Subject: subject,
      HtmlBody: htmlContent,
      MessageStream: "outbound",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.Message || "Error enviando email");
  }
  return await response.json();
}

// --- RUTA DE PRUEBA ---
app.get("/", (req, res) => {
  res.send(
    "¡Hola! El servidor de Biyuyo (Current) está funcionando y listo ☁️",
  );
});

// Proxy functions moved above express.json()

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

  console.log(
    `⏰ Ejecutando cron de recordatorios (${currentHour}:${currentMinute})...`,
  );

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
          } else if (
            frequency.includes("semanal") ||
            frequency.includes("weekly")
          ) {
            startDaysBefore = 2; // "Start 2 days before" -> Días 2 y 1
          } else if (
            frequency.includes("mensual") ||
            frequency.includes("monthly")
          ) {
            startDaysBefore = 7; // "Start a week before" -> Días 7..1
          } else if (
            frequency.includes("anual") ||
            frequency.includes("yearly") ||
            frequency.includes("bimestral") ||
            frequency.includes("trimestral") ||
            frequency.includes("semestral")
          ) {
            // Periodo mayor -> 2 semanas antes
            startDaysBefore = 14;
          }

          if (diffDays <= startDaysBefore) {
            shouldNotify = true;
            notificationTitle = "⏳ Recordatorio Próximo";
            notificationBody = `Tu pago de ${row.reminder_name} vence en ${diffDays} día${diffDays !== 1 ? "s" : ""}.`;
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
          notificationBody = `Tu pago de ${row.reminder_name} está vencido por ${daysOverdue} día${daysOverdue !== 1 ? "s" : ""}.`;
        }
      }

      // --- ENVIAR NOTIFICACIÓN ---
      if (shouldNotify) {
        const message = {
          notification: {
            title: notificationTitle,
            body: notificationBody,
          },
          token: row.token,
        };

        try {
          // Log extra para depuración
          console.log(
            `📤 Enviando notificación (${currentHour}:00) a User ${row.user_id} - ${row.reminder_name} (Days: ${diffDays})`,
          );

          await messaging.send(message);

          // Actualizamos notified_at solo para registro, aunque la lógica ya no depende estrictamente de él para bloqueo diario simple
          await pool.query(
            "UPDATE reminders SET notified_at = NOW() WHERE reminder_id = $1",
            [row.reminder_id],
          );
        } catch (sendError) {
          console.error(
            `❌ Error enviando FCM a ${row.user_id}:`,
            sendError.message,
          );
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
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  try {
    // Hash password using bcrypt
    const bcrypt = await import("bcrypt");
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Este correo ya está registrado" });
    }

    // Insert user
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING user_id, name, email, created_at`,
      [name, email.toLowerCase(), password_hash],
    );

    const newUser = userResult.rows[0];

    // Create default account for the user
    await pool.query(
      `INSERT INTO accounts (user_id, name, balance) 
       VALUES ($1, $2, $3)`,
      [newUser.user_id, "Cuenta Principal", 0],
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
      [email.toLowerCase()],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = userResult.rows[0];

    // Verificar contraseña
    const bcrypt = await import("bcrypt");
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
      [email.toLowerCase()],
    );

    if (userResult.rows.length === 0) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({
        success: true,
        message:
          "Si el correo existe, recibirás instrucciones para restablecer tu contraseña",
      });
    }

    const user = userResult.rows[0];

    // Generar token de reset (válido por 1 hora)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en la base de datos
    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires = $2 
       WHERE user_id = $3`,
      [resetToken, resetExpires, user.user_id],
    );

    console.log(`🔑 Token de reset generado para ${user.email}: ${resetToken}`);

    // AGREGAR ESTO - verificar que las env vars están configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error(
        "❌ GMAIL_USER o GMAIL_APP_PASSWORD no están configuradas en las variables de entorno",
      );
      return res.status(500).json({
        error:
          "El servicio de email no está configurado. Contacta al administrador.",
      });
    }

    // Enviar email con el token
    try {
      await sendEmail(
        user.email,
        user.name,
        "Recuperación de contraseña - Biyuyo",
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#2d509e;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
            <h1>Biyuyo</h1><p>Recuperación de Contraseña</p>
          </div>
          <div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px">
            <p>Hola ${user.name},</p>
            <p>Usa este código para restablecer tu contraseña:</p>
            <div style="background:white;border:2px solid #2d509e;padding:20px;margin:20px 0;text-align:center;border-radius:8px">
              <span style="font-size:22px;font-weight:bold;color:#2d509e;font-family:monospace">${resetToken}</span>
            </div>
            <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px;margin:20px 0">
              ⚠️ Este código expira en <strong>1 hora</strong>
            </div>
            <p>Si no solicitaste esto, ignora este correo.</p>
          </div>
        </div>`,
      );
      console.log(`📧 Email enviado a ${user.email}`);
      res.json({
        success: true,
        message:
          "Si el correo existe, recibirás instrucciones para restablecerla",
      });
    } catch (emailError) {
      console.error("❌ Error Postmark:", emailError);
      res
        .status(500)
        .json({ error: `Error al enviar el correo: ${emailError?.message}` });
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
    passwordLength: newPassword?.length,
  });

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token y nueva contraseña son requeridos" });
  }

  // Validaciones de contraseña
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({
      error: "La contraseña debe contener al menos una letra mayúscula",
    });
  }

  if (!/[.!@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?]/.test(newPassword)) {
    return res.status(400).json({
      error: "La contraseña debe contener al menos un carácter especial",
    });
  }

  try {
    // Buscar usuario con token y obtener tiempo de expiración
    const userResult = await pool.query(
      `SELECT user_id, email, name, reset_token_expires
       FROM users 
       WHERE reset_token = $1`,
      [token.trim()],
    );

    console.log(
      "🔍 Token búsqueda resultado:",
      userResult.rows.length > 0 ? "Encontrado" : "No encontrado",
    );

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
    console.log(
      `⏱️ Diferencia: ${Math.round((expiresAt - now) / 1000 / 60)} minutos`,
    );

    if (now > expiresAt) {
      console.log("⏰ Token expirado");
      return res
        .status(400)
        .json({ error: "El token ha expirado. Solicita uno nuevo." });
    }

    // Hash de la nueva contraseña
    const bcrypt = await import("bcrypt");
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y limpiar token
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
       WHERE user_id = $2`,
      [password_hash, user.user_id],
    );

    console.log(`✅ Contraseña actualizada para: ${user.email}`);

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
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

// --- METAS DE AHORRO (SAVINGS GOALS) ---

// Obtener metas de un usuario
app.get("/goals/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching goals:", err);
    res.status(500).json({ error: err.message });
  }
});

// Crear nueva meta
app.post("/goals", async (req, res) => {
  const { user_id, title, target_amount, current_amount, deadline, icon } = req.body;

  if (!user_id || !title || !target_amount) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO goals (user_id, title, target_amount, current_amount, deadline, icon)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, title, target_amount, current_amount || 0, deadline, icon || "target"],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating goal:", err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar meta
app.delete("/goals/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM goals WHERE id = $1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meta no encontrada" });
    }
    res.json({ message: "Meta eliminada correctamente", goal: result.rows[0] });
  } catch (err) {
    console.error("Error deleting goal:", err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar progreso de meta
app.patch("/goals/:id", async (req, res) => {
  const { id } = req.params;
  const { current_amount } = req.body;

  try {
    const result = await pool.query(
      "UPDATE goals SET current_amount = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [current_amount, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meta no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating goal:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- PERFILES COMPARTIDOS (SHARED PROFILES) ---

// Crear perfil compartido
app.post("/shared", async (req, res) => {
  const { name, user_id } = req.body;

  if (!name || !user_id) {
    return res.status(400).json({ error: "Nombre y user_id son requeridos" });
  }

  try {
    console.log("🚀 [VERSION 2] Iniciando creación de perfil compartido...");
    // Generar un código único de 8 caracteres
    const finalCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    console.log(
      `🎲 [V2] Perfil: "${name}", ID Usuario: ${user_id}, Código Generado: ${finalCode}`,
    );

    if (!finalCode || typeof finalCode !== "string" || finalCode.length !== 8) {
      console.error(
        "❌ [V2] Error crítico: El código generado no es válido:",
        finalCode,
      );
      return res.status(500).json({
        error: "No se pudo generar un código de invitación (V2 error)",
      });
    }

    // 1. Crear el perfil compartido
    const insertSharedQuery =
      "INSERT INTO shared (name, created_at, share_code) VALUES ($1, NOW(), $2) RETURNING *";
    console.log(
      `🛠 [V2] Ejecutando Query con params: ["${name}", "${finalCode}"]`,
    );

    const sharedResult = await pool.query(insertSharedQuery, [name, finalCode]);
    const newShared = sharedResult.rows[0];

    // 2. Asociar al creador
    await pool.query(
      `INSERT INTO shared_account (shared_id, user_id) VALUES ($1, $2)`,
      [newShared.shared_id, user_id],
    );

    // 3. Crear cuenta por defecto para el perfil compartido
    await pool.query(
      `INSERT INTO accounts (user_id, name, balance, shared_id) VALUES ($1, $2, $3, $4)`,
      [user_id, "Cuenta Principal", 0, newShared.shared_id],
    );

    console.log(
      `✅ Perfil compartido creado: ${newShared.name} (Code: ${newShared.share_code})`,
    );
    res.json(newShared);
  } catch (err) {
    console.error("Error creando perfil compartido:", err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener perfiles compartidos de un usuario
app.get("/shared/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM shared_account sa2 WHERE sa2.shared_id = s.shared_id) as member_count
       FROM shared s
       JOIN shared_account sa ON s.shared_id = sa.shared_id
       WHERE sa.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error obteniendo perfiles compartidos:", err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener un perfil compartido por ID
app.get("/shared/:sharedId", async (req, res) => {
  const { sharedId } = req.params;
  try {
    const result = await pool.query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM shared_account sa WHERE sa.shared_id = s.shared_id) as member_count
       FROM shared s WHERE s.shared_id = $1`,
      [sharedId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Perfil compartido no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error obteniendo perfil compartido:", err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener un perfil compartido por Share Code
app.get("/shared/code/:shareCode", async (req, res) => {
  const { shareCode } = req.params;
  try {
    const result = await pool.query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM shared_account sa WHERE sa.shared_id = s.shared_id) as member_count
       FROM shared s WHERE s.share_code = $1`,
      [shareCode.toUpperCase()],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Perfil compartido no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error obteniendo perfil compartido por código:", err);
    res.status(500).json({ error: err.message });
  }
});

// Unirse a un perfil compartido
app.post("/shared/join", async (req, res) => {
  const { share_code, user_id } = req.body;

  if (!share_code || !user_id) {
    return res
      .status(400)
      .json({ error: "share_code y user_id son requeridos" });
  }

  try {
    // Verificar que el perfil existe mediante el share_code
    const sharedExists = await pool.query(
      `SELECT shared_id, name, share_code FROM shared WHERE share_code = $1`,
      [share_code.toUpperCase()],
    );
    if (sharedExists.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Perfil compartido no encontrado con ese código" });
    }

    const { shared_id, name } = sharedExists.rows[0];

    // Verificar que el usuario no esté ya asociado
    const alreadyJoined = await pool.query(
      `SELECT * FROM shared_account WHERE shared_id = $1 AND user_id = $2`,
      [shared_id, user_id],
    );
    if (alreadyJoined.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Ya perteneces a este perfil compartido" });
    }

    await pool.query(
      `INSERT INTO shared_account (shared_id, user_id) VALUES ($1, $2)`,
      [shared_id, user_id],
    );

    console.log(
      `✅ Usuario ${user_id} se unió al perfil compartido ${name} (Code: ${share_code})`,
    );
    res.json({ success: true, profile: sharedExists.rows[0] });
  } catch (err) {
    console.error("Error uniéndose al perfil compartido:", err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener miembros de un perfil compartido
app.get("/shared/:sharedId/members", async (req, res) => {
  const { sharedId } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.email
       FROM shared_account sa
       JOIN users u ON sa.user_id = u.user_id
       WHERE sa.shared_id = $1`,
      [sharedId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error obteniendo miembros:", err);
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
    shared_id,
  } = req.body;

  try {
    const query = `
      INSERT INTO expenses (macrocategoria, categoria, negocio, total_amount, user_id, receipt_image_url, shared_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      macrocategoria,
      categoria,
      negocio,
      total_amount,
      user_id,
      receipt_image_url || null,
      shared_id || null,
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
          pool,
        );
        console.log("🎯 [ML] Feature ID retornado:", featureId);
      } catch (mlError) {
        console.error("💥 [ML] Error capturado en endpoint:", mlError);
      }
    } else {
      console.log(
        "⚠️ [ML] No se calcularon features: user_id es null/undefined",
      );
    }
  } catch (err) {
    console.error("Error guardando gasto:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/expenses", async (req, res) => {
  const { userId, sharedId } = req.query;
  try {
    let query = `
      SELECT t.*, u.name as creator_name 
      FROM expenses t
      LEFT JOIN users u ON t.user_id = u.user_id
    `;
    let values = [];
    let conditions = [];

    if (sharedId) {
      conditions.push(`t.shared_id = $${conditions.length + 1}`);
      values.push(sharedId);
    } else if (userId) {
      conditions.push(`t.user_id = $${conditions.length + 1}`);
      values.push(userId);
      conditions.push(`t.shared_id IS NULL`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY t.created_at DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- INGRESOS (INCOMES) ---
app.post("/incomes", async (req, res) => {
  const {
    macrocategoria,
    categoria,
    negocio,
    total_amount,
    user_id,
    shared_id,
  } = req.body;

  try {
    const query = `
      INSERT INTO incomes (macrocategoria, categoria, negocio, total_amount, user_id, shared_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      macrocategoria,
      categoria,
      negocio,
      total_amount,
      user_id,
      shared_id || null,
    ];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error guardando ingreso:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/incomes", async (req, res) => {
  const { userId, sharedId } = req.query;
  try {
    let query = `
      SELECT t.*, u.name as creator_name 
      FROM incomes t
      LEFT JOIN users u ON t.user_id = u.user_id
    `;
    let values = [];
    let conditions = [];

    if (sharedId) {
      conditions.push(`t.shared_id = $${conditions.length + 1}`);
      values.push(sharedId);
    } else if (userId) {
      conditions.push(`t.user_id = $${conditions.length + 1}`);
      values.push(userId);
      conditions.push(`t.shared_id IS NULL`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
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
    shared_id,
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
        installment_number,
        shared_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      shared_id || null,
    ];

    const result = await pool.query(query, values);
    const newReminder = result.rows[0];

    // ✨ IMMEDIATE NOTIFICATION: Si el recordatorio es para HOY, enviar notificación ahora
    if (messaging) {
      try {
        const reminderDate = new Date(fecha_proximo_pago);
        const today = new Date();
        // Comparar strings YYYY-MM-DD
        if (
          reminderDate.toISOString().split("T")[0] ===
          today.toISOString().split("T")[0]
        ) {
          const { rows: tokens } = await pool.query(
            "SELECT token FROM user_tokens WHERE user_id = $1",
            [user_id],
          );

          if (tokens.length > 0) {
            // Enviar solo al dueño
            for (const t of tokens) {
              try {
                await messaging.send({
                  notification: {
                    title: "🔔 Nuevo Recordatorio",
                    body: `Para hoy: ${nombre} ($${monto})`,
                  },
                  token: t.token,
                });
              } catch (e) {
                console.error(
                  "Error sending immediate notification:",
                  e.message,
                );
              }
            }
            // Mark notified
            await pool.query(
              "UPDATE reminders SET notified_at = NOW() WHERE reminder_id = $1",
              [newReminder.reminder_id],
            );
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
app.get("/account-balance/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT SUM(balance) as total_initial FROM accounts WHERE user_id = $1",
      [userId],
    );
    // Si no tiene cuentas, retorna 0
    const initialBalance = result.rows[0].total_initial || 0;
    res.json({ success: true, initialBalance: Number(initialBalance) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener balance" });
  }
});

// Crear o actualizar una cuenta (Para el botón de "Ajustar Saldo")
// Simplificado: Crearemos una cuenta llamada "Principal" si no existe, o actualizaremos su saldo
app.post("/set-initial-balance", async (req, res) => {
  const { userId, amount } = req.body;
  try {
    // 1. Buscamos si ya tiene una cuenta "Efectivo/Principal"
    const existing = await pool.query(
      "SELECT * FROM accounts WHERE user_id = $1 AND name = $2",
      [userId, "Principal"],
    );

    if (existing.rows.length > 0) {
      // Actualizar
      await pool.query(
        "UPDATE accounts SET balance = $1 WHERE account_id = $2",
        [amount, existing.rows[0].account_id],
      );
    } else {
      // Crear nueva
      await pool.query(
        "INSERT INTO accounts (user_id, name, balance) VALUES ($1, $2, $3)",
        [userId, "Principal", amount],
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar saldo" });
  }
});

app.get("/reminders", async (req, res) => {
  const { userId, sharedId } = req.query;

  try {
    let query = `
      SELECT t.*, u.name as creator_name 
      FROM reminders t
      LEFT JOIN users u ON t.user_id = u.user_id
    `;
    let values = [];
    let conditions = [];

    if (sharedId) {
      conditions.push(`t.shared_id = $${conditions.length + 1}`);
      values.push(sharedId);
    } else if (userId) {
      conditions.push(`t.user_id = $${conditions.length + 1}`);
      values.push(userId);
      conditions.push(`t.shared_id IS NULL`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY t.next_payment_date ASC";

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
      creator_name: row.creator_name,
    }));

    console.log(
      `✅ Recordatorios obtenidos para ${sharedId ? "shared " + sharedId : "user " + (userId || "todos")}: ${recordatoriosFormateados.length}`,
    );
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
  const { userId, sharedId } = req.query;
  try {
    let query = "SELECT * FROM accounts";
    let values = [];
    let conditions = [];

    if (sharedId) {
      conditions.push(`shared_id = $${conditions.length + 1}`);
      values.push(sharedId);
    } else if (userId) {
      conditions.push(`user_id = $${conditions.length + 1}`);
      values.push(userId);
      conditions.push(`shared_id IS NULL`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
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
      [user_id],
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
      return res
        .status(400)
        .json({ error: "El correo no es de dominio Unimet" });
    }

    if (user.is_premium) {
      return res
        .status(400)
        .json({ error: "La cuenta ya está verificada como Premium" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 3600000);

    await pool.query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE user_id = $3`,
      [verificationToken, tokenExpires, user.user_id],
    );

    try {
      await sendEmail(
        user.email,
        user.name,
        "Verificación Unimet Premium - Biyuyo",
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#2d509e;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
            <h1>Biyuyo</h1><p>Verificación Unimet</p>
          </div>
          <div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px">
            <p>Hola ${user.name},</p>
            <p>Tu código para activar <strong>Premium</strong>:</p>
            <div style="background:white;border:2px solid #2d509e;padding:20px;margin:20px 0;text-align:center;border-radius:8px">
              <span style="font-size:18px;font-weight:bold;color:#2d509e;font-family:monospace">${verificationToken}</span>
            </div>
            <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px;margin:20px 0">
              ⚠️ Expira en <strong>1 hora</strong>
            </div>
            <p>Si no solicitaste esto, ignora este correo.</p>
          </div>
        </div>`,
      );
      console.log(`📧 Token Unimet enviado a ${user.email}`);
      res.json({
        success: true,
        message: "Código de verificación enviado a tu correo",
      });
    } catch (emailError) {
      console.error("❌ Error Postmark:", emailError);
      res
        .status(500)
        .json({ error: `Error al enviar el correo: ${emailError?.message}` });
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
      [user_id, token.trim()],
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Token inválido" });
    }

    const user = userResult.rows[0];
    const expiresAt = new Date(user.reset_token_expires);
    const now = new Date();

    if (now > expiresAt) {
      return res
        .status(400)
        .json({ error: "El token ha expirado. Solicita uno nuevo." });
    }

    await pool.query(
      `UPDATE users SET is_premium = true, reset_token = NULL, reset_token_expires = NULL WHERE user_id = $1`,
      [user.user_id],
    );

    console.log(`⭐ Usuario ${user.email} verificado como Premium`);
    res.json({
      success: true,
      message: "¡Cuenta verificada! Ahora tienes acceso Premium.",
    });
  } catch (err) {
    console.error("Error en verify-unimet-token:", err);
    res.status(500).json({ error: "Error al verificar el token" });
  }
});

// --- ACTUALIZAR DATOS DE USUARIO ---
app.put("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Nombre y correo son requeridos" });
  }

  // Validación de nombre: Solo letras y espacios, máximo 30 caracteres
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!nameRegex.test(name)) {
    return res
      .status(400)
      .json({ error: "El nombre solo puede contener letras y espacios" });
  }
  if (name.length > 30) {
    return res
      .status(400)
      .json({ error: "El nombre no puede exceder los 30 caracteres" });
  }

  // Validación de formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "El formato de correo no es válido" });
  }

  try {
    // Verificar si el correo ya está en uso por OTRO usuario
    const emailCheck = await pool.query(
      "SELECT user_id FROM users WHERE email = $1 AND user_id != $2",
      [email.toLowerCase(), user_id],
    );

    if (emailCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Este correo ya está registrado por otro usuario" });
    }

    // Actualizar usuario
    const result = await pool.query(
      "UPDATE users SET name = $1, email = $2 WHERE user_id = $3 RETURNING user_id, name, email, is_premium",
      [name, email.toLowerCase(), user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log(`✅ Usuario actualizado: ${result.rows[0].email}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en PUT /user/:user_id:", err);
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
});

// --- OBTENER DATOS DE USUARIO ---
app.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT user_id, name, email, is_premium FROM users WHERE user_id = $1",
      [user_id],
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
  if (
    feedback === undefined ||
    feedback === null ||
    ![1, 0, -1].includes(Number(feedback))
  ) {
    return res.status(400).json({
      error:
        "Feedback inválido. Debe ser 1 (buena decisión), 0 (neutral) o -1 (me arrepentí)",
    });
  }

  if (!expense_id || !user_id) {
    return res
      .status(400)
      .json({ error: "expense_id y user_id son requeridos" });
  }

  try {
    // Verificar que el gasto pertenece al usuario
    const checkQuery = `
      SELECT expense_id FROM expenses 
      WHERE expense_id = $1 AND user_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [expense_id, user_id]);

    if (checkResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Gasto no encontrado o no pertenece al usuario" });
    }

    // Guardar el feedback
    const updateQuery = `
      UPDATE expenses 
      SET user_feedback = $1 
      WHERE expense_id = $2 AND user_id = $3
      RETURNING expense_id, user_feedback
    `;
    const result = await pool.query(updateQuery, [
      Number(feedback),
      expense_id,
      user_id,
    ]);

    // También actualizar el label en expense_ml_features si existe
    await pool.query(
      `UPDATE expense_ml_features 
       SET label = $1, updated_at = NOW() 
       WHERE expense_id = $2`,
      [Number(feedback), expense_id],
    );

    console.log(`✅ Feedback guardado: gasto ${expense_id} → ${feedback}`);
    res.json({
      success: true,
      expense_id: result.rows[0].expense_id,
      feedback: result.rows[0].user_feedback,
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
      return res
        .status(404)
        .json({ error: "Features no encontrados para este gasto" });
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
      message:
        parseInt(result.rows[0].labeled_expenses) < 50
          ? `Necesitas ${50 - parseInt(result.rows[0].labeled_expenses)} gastos con feedback más para entrenar el modelo`
          : "¡Tienes suficientes datos para entrenar el modelo!",
    });
  } catch (err) {
    console.error("Error obteniendo resumen ML:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- "ELIMINAR" GASTO (pone total_amount en 0) ---
app.patch("/expenses/:expense_id/zero", async (req, res) => {
  const { expense_id } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id es requerido" });
  }

  try {
    const result = await pool.query(
      `UPDATE expenses
       SET total_amount = 0
       WHERE expense_id = $1::uuid AND user_id = $2::uuid
       RETURNING expense_id`,
      [expense_id, user_id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Gasto no encontrado o no autorizado" });
    }

    console.log(`🚫 Gasto ocultado (amount=0): ${expense_id}`);
    res.json({ success: true, zeroed_id: expense_id });
  } catch (err) {
    console.error("Error ocultando gasto:", err);
    res.status(500).json({ error: err.message });
  }
});
// --- EDITAR GASTO ---
app.put("/expenses/:expense_id", async (req, res) => {
  const { expense_id } = req.params;
  const { user_id, macrocategoria, categoria, negocio, total_amount } =
    req.body;

  if (!user_id) return res.status(400).json({ error: "user_id es requerido" });

  try {
    const check = await pool.query(
      "SELECT expense_id, user_id FROM expenses WHERE expense_id = $1::uuid",
      [expense_id],
    );

    if (check.rows.length === 0)
      return res.status(404).json({ error: "Gasto no encontrado" });
    if (check.rows[0].user_id !== user_id)
      return res.status(403).json({ error: "No autorizado" });

    const result = await pool.query(
      `UPDATE expenses 
       SET macrocategoria = $1, categoria = $2, negocio = $3, total_amount = $4
       WHERE expense_id = $5::uuid AND user_id = $6::uuid
       RETURNING *`,
      [macrocategoria, categoria, negocio, total_amount, expense_id, user_id],
    );

    console.log(`✏️ Gasto editado: ${expense_id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error editando gasto:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- EDITAR INGRESO ---
app.put("/incomes/:income_id", async (req, res) => {
  const { income_id } = req.params;
  const { user_id, macrocategoria, categoria, negocio, total_amount } =
    req.body;

  if (!user_id) return res.status(400).json({ error: "user_id es requerido" });

  try {
    const check = await pool.query(
      "SELECT income_id, user_id FROM incomes WHERE income_id = $1::uuid",
      [income_id],
    );

    if (check.rows.length === 0)
      return res.status(404).json({ error: "Ingreso no encontrado" });
    if (check.rows[0].user_id !== user_id)
      return res.status(403).json({ error: "No autorizado" });

    const result = await pool.query(
      `UPDATE incomes 
       SET macrocategoria = $1, categoria = $2, negocio = $3, total_amount = $4
       WHERE income_id = $5::uuid AND user_id = $6::uuid
       RETURNING *`,
      [macrocategoria, categoria, negocio, total_amount, income_id, user_id],
    );

    console.log(`✏️ Ingreso editado: ${income_id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error editando ingreso:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- EDITAR RECORDATORIO ---
app.put("/reminders/:reminder_id", async (req, res) => {
  const { reminder_id } = req.params;
  const {
    user_id,
    reminder_name,
    macrocategoria,
    categoria,
    negocio,
    total_amount,
    next_payment_date,
    payment_frequency,
    is_installment,
    installment_number,
  } = req.body;

  if (!user_id) return res.status(400).json({ error: "user_id es requerido" });

  try {
    const check = await pool.query(
      "SELECT reminder_id, user_id FROM reminders WHERE reminder_id = $1::uuid",
      [reminder_id],
    );

    if (check.rows.length === 0)
      return res.status(404).json({ error: "Recordatorio no encontrado" });
    if (check.rows[0].user_id !== user_id)
      return res.status(403).json({ error: "No autorizado" });

    const result = await pool.query(
      `UPDATE reminders 
       SET reminder_name = $1, macrocategoria = $2, categoria = $3, negocio = $4,
           total_amount = $5, next_payment_date = $6, payment_frequency = $7,
           is_installment = $8, installment_number = $9
       WHERE reminder_id = $10::uuid AND user_id = $11::uuid
       RETURNING *`,
      [
        reminder_name,
        macrocategoria,
        categoria,
        negocio,
        total_amount,
        next_payment_date,
        payment_frequency,
        is_installment,
        installment_number,
        reminder_id,
        user_id,
      ],
    );

    console.log(`✏️ Recordatorio editado: ${reminder_id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error editando recordatorio:", err);
    res.status(500).json({ error: err.message });
  }
});
// --- "ELIMINAR" INGRESO (pone total_amount en 0) ---
app.patch("/incomes/:income_id/zero", async (req, res) => {
  const { income_id } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id es requerido" });
  }

  try {
    const result = await pool.query(
      `UPDATE incomes
       SET total_amount = 0
       WHERE income_id = $1::uuid AND user_id = $2::uuid
       RETURNING income_id`,
      [income_id, user_id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Ingreso no encontrado o no autorizado" });
    }

    console.log(`🚫 Ingreso ocultado (amount=0): ${income_id}`);
    res.json({ success: true, zeroed_id: income_id });
  } catch (err) {
    console.error("Error ocultando ingreso:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- "ELIMINAR" RECORDATORIO (pone total_amount en 0) ---
app.patch("/reminders/:reminder_id/zero", async (req, res) => {
  const { reminder_id } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id es requerido" });
  }

  try {
    const result = await pool.query(
      `UPDATE reminders
       SET total_amount = 0
       WHERE reminder_id = $1::uuid AND user_id = $2::uuid
       RETURNING reminder_id`,
      [reminder_id, user_id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Recordatorio no encontrado o no autorizado" });
    }

    console.log(`🚫 Recordatorio ocultado (amount=0): ${reminder_id}`);
    res.json({ success: true, zeroed_id: reminder_id });
  } catch (err) {
    console.error("Error ocultando recordatorio:", err);
    res.status(500).json({ error: err.message });
  }
});
// --- PAGAR RECORDATORIO (crea gasto + pone reminder en 0) ---
app.patch("/reminders/:reminder_id/pay", async (req, res) => {
  const { reminder_id } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id es requerido" });
  }

  try {
    // 1. Obtener datos del recordatorio
    const reminderResult = await pool.query(
      `SELECT * FROM reminders
       WHERE reminder_id = $1::uuid AND user_id = $2::uuid`,
      [reminder_id, user_id],
    );

    if (reminderResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Recordatorio no encontrado o no autorizado" });
    }

    const reminder = reminderResult.rows[0];

    // 2. Crear el gasto con los datos del recordatorio
    const expenseResult = await pool.query(
      `INSERT INTO expenses (macrocategoria, categoria, negocio, total_amount, user_id, shared_id)
       VALUES ($1, $2, $3, $4, $5::uuid, $6)
       RETURNING *`,
      [
        reminder.macrocategoria,
        reminder.categoria,
        reminder.negocio,
        reminder.total_amount,
        user_id,
        reminder.shared_id || null,
      ],
    );

    const newExpense = expenseResult.rows[0];

    // 3. Poner el recordatorio en 0 (ocultarlo)
    await pool.query(
      `UPDATE reminders SET total_amount = 0 WHERE reminder_id = $1::uuid`,
      [reminder_id],
    );

    console.log(
      `✅ Recordatorio pagado: ${reminder_id} → gasto creado: ${newExpense.expense_id}`,
    );
    res.json({ success: true, expense: newExpense });
  } catch (err) {
    console.error("Error pagando recordatorio:", err);
    res.status(500).json({ error: err.message });
  }
});
// --- ELIMINAR GASTO ---
app.delete("/expenses/:expense_id", async (req, res) => {
  const { expense_id } = req.params;
  const { user_id } = req.query;

  console.log(`🗑️ DELETE /expenses/${expense_id} - user_id: ${user_id}`);

  if (!user_id) {
    return res.status(400).json({ error: "user_id es requerido" });
  }

  try {
    // 1. Verificar que el gasto existe y pertenece al usuario
    const check = await pool.query(
      "SELECT expense_id, user_id FROM expenses WHERE expense_id = $1::uuid",
      [expense_id],
    );

    console.log(`🔍 Gasto encontrado:`, check.rows);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    if (check.rows[0].user_id !== user_id) {
      return res
        .status(403)
        .json({ error: "No autorizado para eliminar este gasto" });
    }

    // 2. Eliminar ML features primero (foreign key)
    await pool.query(
      "DELETE FROM expense_ml_features WHERE expense_id = $1::uuid",
      [expense_id],
    );

    // 3. Eliminar el gasto
    await pool.query("DELETE FROM expenses WHERE expense_id = $1::uuid", [
      expense_id,
    ]);

    console.log(`✅ Gasto eliminado: ${expense_id}`);
    res.json({ success: true, deleted_id: expense_id });
  } catch (err) {
    console.error("Error eliminando gasto:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- ELIMINAR INGRESO ---
app.delete("/incomes/:income_id", async (req, res) => {
  const { income_id } = req.params;
  const { user_id } = req.query;

  console.log(`🗑️ DELETE /incomes/${income_id} - user_id: ${user_id}`);

  if (!user_id) {
    return res.status(400).json({ error: "user_id es requerido" });
  }

  try {
    const check = await pool.query(
      "SELECT income_id, user_id FROM incomes WHERE income_id = $1::uuid",
      [income_id],
    );

    console.log(`🔍 Ingreso encontrado:`, check.rows);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Ingreso no encontrado" });
    }

    if (check.rows[0].user_id !== user_id) {
      return res
        .status(403)
        .json({ error: "No autorizado para eliminar este ingreso" });
    }

    await pool.query("DELETE FROM incomes WHERE income_id = $1::uuid", [
      income_id,
    ]);

    console.log(`✅ Ingreso eliminado: ${income_id}`);
    res.json({ success: true, deleted_id: income_id });
  } catch (err) {
    console.error("Error eliminando ingreso:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- ELIMINAR RECORDATORIO ---
app.delete("/reminders/:reminder_id", async (req, res) => {
  const { reminder_id } = req.params;
  const { user_id } = req.query;

  console.log(`🗑️ DELETE /reminders/${reminder_id} - user_id: ${user_id}`);

  if (!user_id) {
    return res.status(400).json({ error: "user_id es requerido" });
  }

  try {
    const check = await pool.query(
      "SELECT reminder_id, user_id FROM reminders WHERE reminder_id = $1::uuid",
      [reminder_id],
    );

    console.log(`🔍 Recordatorio encontrado:`, check.rows);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Recordatorio no encontrado" });
    }

    if (check.rows[0].user_id !== user_id) {
      return res
        .status(403)
        .json({ error: "No autorizado para eliminar este recordatorio" });
    }

    await pool.query("DELETE FROM reminders WHERE reminder_id = $1::uuid", [
      reminder_id,
    ]);

    console.log(`✅ Recordatorio eliminado: ${reminder_id}`);
    res.json({ success: true, deleted_id: reminder_id });
  } catch (err) {
    console.error("Error eliminando recordatorio:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- OBTENER ÚLTIMOS FEATURES (Contexto para DecisionPredictor) ---
app.get("/ml/last-features/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const query = `
      SELECT * FROM expense_ml_features 
      WHERE user_id = $1 
      ORDER BY updated_at DESC LIMIT 1
    `;
    const result = await pool.query(query, [user_id]);

    if (result.rows.length === 0) {
      return res.json({ success: true, features: null });
    }

    res.json({ success: true, features: result.rows[0] });
  } catch (err) {
    console.error("Error obteniendo last-features:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- SMART ASSISTANT (GEMINI API) ---
app.post("/api/smart-assistant", async (req, res) => {
  const { text, audio, mimeType, user_id } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  if (!process.env.GEMINI_SMART_ASSISTANT_API_KEY) {
    console.error("Smart Assistant API Key is missing in environment variables.");
    return res.status(500).json({ error: "El servicio de asistente inteligente no está configurado." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_SMART_ASSISTANT_API_KEY });

    const tools = [{
      functionDeclarations: [
        {
          name: "record_expense",
          description: "Records a one-time expense. DO NOT use this for recurring payments like Netflix or Rent.",
          parameters: {
            type: "object",
            properties: {
              macro_category: {
                type: "string",
                enum: [
                  "Alimentos y bebidas", "Vivienda y hogar", "Transporte y movilidad",
                  "Salud y bienestar", "Ropa y accesorios", "Educación y formación",
                  "Entretenimiento y ocio", "Tecnología y digital", "Finanzas y obligaciones",
                  "Familia y dependientes", "Servicios profesionales", "Construcción y obra",
                  "Viajes y turismo", "Regalos y fiestas", "Otros gastos"
                ]
              },
              category: { type: "string", description: "The specific subcategory or keyword matched." },
              business_type: { type: "string", description: "Merchant name (e.g., 'Walmart', 'Uber')." },
              amount: { type: "number" },
              currency: { type: "string", enum: ["USD", "VES"] }
            },
            required: ["macro_category", "category", "business_type", "amount", "currency"]
          }
        },
        {
          name: "record_income",
          description: "Records an income transaction.",
          parameters: {
            type: "object",
            properties: {
              macro_category: {
                type: "string",
                enum: [
                  "Ingresos laborales", "Freelance / Independiente", "Negocio propio",
                  "Inversiones", "Alquileres", "Transferencias / Ayudas",
                  "Finanzas y reembolsos", "Ingresos ocasionales"
                ]
              },
              category: { type: "string" },
              business_type: { type: "string" },
              amount: { type: "number" },
              currency: { type: "string", enum: ["USD", "VES"] }
            },
            required: ["macro_category", "category", "business_type", "amount", "currency"]
          }
        },
        {
          name: "record_reminder",
          description: "Records recurring payments, subscriptions, or installments (e.g., Netflix, Cashea).",
          parameters: {
            type: "object",
            properties: {
              macro_category: { type: "string", enum: ["Recordatorios y Pagos Recurrentes"] },
              category: {
                type: "string",
                enum: [
                  "Créditos y financiamientos", "Vivienda y servicios", "Suscripciones digitales",
                  "Transporte y vehículo", "Salud y seguros", "Educación",
                  "Pagos familiares", "Servicios profesionales", "Compras en cuotas"
                ]
              },
              keyword_detectada: { type: "string" },
              business_type: { type: "string" },
              payment_type: { type: "string" },
              next_payment_date: { type: "string", description: "YYYY-MM-DD" },
              pay_frequency: { type: "string", enum: ["Diario", "Semanal", "Quincenal", "Mensual", "Anual", "Único"] },
              amount: { type: "number" },
              currency: { type: "string", enum: ["USD", "VES"] },
              is_installment: { type: "boolean" },
              total_payments: { type: "number" }
            },
            required: ["macro_category", "category", "business_type", "next_payment_date", "pay_frequency", "amount", "currency"]
          }
        }
      ]
    }];

    const userParts = [];
    if (audio) {
      userParts.push({ inlineData: { data: audio, mimeType: mimeType || 'audio/webm' } });
      userParts.push({ text: `Analyze this audio. Transcription hint: ${text}` });
    } else {
      userParts.push({ text: `Analyze this transaction: ${text}` });
    }

    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash-thinking-preview-01-21",
      systemInstruction: `You are a financial assistant. Current date: ${new Date().toISOString()}.
      
      RULES:
      1. One-time spending -> record_expense (Check macro_category enum).
      2. Recurring/Subscriptions/Debt (Netflix, Cashea, Rent) -> record_reminder.
      3. Receiving money -> record_income.
      
      Output ONLY the tool call.`
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: userParts }],
      tools: tools,
      generationConfig: {
        thinkingConfig: { includeThoughts: true }
      }
    });

    const response = result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      return res.json({
        success: true,
        type: call.name,
        data: call.args,
        thoughts: response.candidates[0].groundingMetadata?.thoughts || ""
      });
    }

    return res.json({
      success: false,
      message: "Could not map text to a transaction.",
      rawResponse: response.text()
    });

  } catch (error) {
    console.error("Error in Smart Assistant API:", error);
    return res.status(500).json({ error: "Error processing the request with AI" });
  }
});

// --- CONFIGURACIÓN DEL PUERTO ---
const PORT = process.env.PORT || 3001;

if (process.env.VERCEL) {
  // Vercel provides its own server, just export the Express app
  module.exports = app;
} else {
  app.listen(PORT, async () => {
    console.log(`🚀 Backend corriendo en el puerto ${PORT}`);

    // Verificar la conexión a la base de datos al iniciar
    try {
      const client = await pool.connect();
      console.log("✅ Conexión a la base de datos exitosa");
      client.release();
    } catch (err) {
      console.error("❌ Error al conectar a la base de datos:", err);
    }
  });
}

