
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function check() {
    try {
        const res = await pool.query("SELECT id, title, user_id, shared_id FROM goals");
        console.log("--- GOALS TABLE (JSON) ---");
        console.log(JSON.stringify(res.rows, null, 2));

        const shared = await pool.query("SELECT shared_id, name FROM shared");
        console.log("\n--- SHARED TABLE (JSON) ---");
        console.log(JSON.stringify(shared.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
