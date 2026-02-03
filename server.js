// server.js (Modo Supabase)
import express from 'express';
import pg from 'pg';
import cors from 'cors';

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json());


const connectionString = 'postgresql://postgres:[dZzKGzHnjS6ajIRldZzKGzHnjS6ajIRl]@db.pmjjguyibxydzxnofcjx.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Requerido para conectar a Supabase/Neon desde Node
  },
});
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Crear Gasto
app.post('/expenses', async (req, res) => {
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
    console.error("Error guardando:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Leer Gastos
app.get('/expenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// 4. CREAR UN INGRESO (Ruta Nueva)
app.post('/incomes', async (req, res) => {
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

app.listen(3001, () => {
  console.log('🚀 Backend conectado a Supabase corriendo en http://localhost:3001');
});