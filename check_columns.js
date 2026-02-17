import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function checkColumns() {
    try {
        const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('expenses', 'incomes', 'reminders', 'accounts')
      ORDER BY table_name, ordinal_position;
    `);
        console.log(JSON.stringify(res.rows, null, 2));
        await pool.end();
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkColumns();
