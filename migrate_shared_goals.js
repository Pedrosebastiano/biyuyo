
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function migrate() {
    try {
        console.log("🚀 Iniciando migración para metas compartidas...");

        // 1. Añadir shared_id a la tabla goals if it doesn't exist
        await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='shared_id') THEN
          ALTER TABLE goals ADD COLUMN shared_id UUID;
        END IF;
      END $$;
    `);
        console.log("✅ Columna shared_id verificada/añadida en 'goals'");

        // 2. Crear tabla goal_contributions
        await pool.query(`
      CREATE TABLE IF NOT EXISTS goal_contributions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(user_id),
        amount DECIMAL NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log("✅ Tabla 'goal_contributions' verificada/creada");

        console.log("🎉 Migración completada con éxito");
    } catch (err) {
        console.error("❌ Error durante la migración:", err);
    } finally {
        await pool.end();
    }
}

migrate();
