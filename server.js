import express from "express";
import pg from "pg";
import cors from "cors";

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json());

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
  res.send("¡Hola! El servidor de Biyuyo está funcionando y listo ☁️");
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
  const { macrocategoria, categoria, negocio, total_amount, user_id } = req.body;

  try {
    const query = `
      INSERT INTO expenses (macrocategoria, categoria, negocio, total_amount, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [macrocategoria, categoria, negocio, total_amount, user_id];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error guardando gasto:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/expenses", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM expenses ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- INGRESOS (INCOMES) ---
app.post("/incomes", async (req, res) => {
  const { macrocategoria, categoria, negocio, total_amount, user_id } = req.body;

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

app.get('/incomes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incomes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- RECORDATORIOS (REMINDERS) ---
// AQUÍ ESTÁ LA CORRECCIÓN IMPORTANTE PARA TU TABLA

app.post("/reminders", async (req, res) => {
  // Recibimos los datos con nombres del Frontend (español)
  const {
    user_id,
    nombre,             // Viene como 'nombre'
    macrocategoria,
    categoria,
    negocio,
    monto,              // Viene como 'monto'
    fecha_proximo_pago, // Viene como 'fecha_proximo_pago'
    frecuencia,         // Viene como 'frecuencia'
    es_cuota,           // Viene como 'es_cuota'
    cuota_actual        // Viene como 'cuota_actual'
  } = req.body;

  try {
    // Insertamos usando los nombres REALES de tu tabla SQL
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

    // Asignamos las variables recibidas al orden correcto
    const values = [
      user_id,
      nombre,              // Va a reminder_name
      macrocategoria,
      categoria,
      negocio,
      monto,               // Va a total_amount
      fecha_proximo_pago,  // Va a next_payment_date
      frecuencia,          // Va a payment_frequency
      es_cuota,            // Va a is_installment
      cuota_actual         // Va a installment_number
    ];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error guardando recordatorio:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/reminders", async (req, res) => {
  try {
    // Ordenamos por fecha más próxima
    const result = await pool.query("SELECT * FROM reminders ORDER BY next_payment_date ASC");

    // Transformamos los datos de vuelta al español para que el Frontend los entienda
    const recordatoriosFormateados = result.rows.map(row => ({
      id: row.reminder_id,           // Tu tabla usa reminder_id
      user_id: row.user_id,
      nombre: row.reminder_name,           // Traducimos a 'nombre'
      macrocategoria: row.macrocategoria,
      categoria: row.categoria,
      negocio: row.negocio,
      monto: row.total_amount,             // Traducimos a 'monto'
      fecha_proximo_pago: row.next_payment_date, // Traducimos
      frecuencia: row.payment_frequency,   // Traducimos
      es_cuota: row.is_installment,        // Traducimos
      cuota_actual: row.installment_number // Traducimos
    }));

    res.json(recordatoriosFormateados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- CUENTAS (ACCOUNTS) ---
app.get("/accounts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM accounts");
    res.json(result.rows);
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