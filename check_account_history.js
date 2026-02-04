import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const userId = "6221431c-7a17-4acc-9c01-43903e30eb21";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function checkAccountHistory() {
    try {
        const res = await pool.query("SELECT account_id, name, savings, created_at FROM accounts WHERE user_id = $1 ORDER BY created_at ASC", [userId]);
        console.table(res.rows);
        await pool.end();
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkAccountHistory();
