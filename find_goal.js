
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function check() {
    try {
        const res = await pool.query("SELECT id, title, user_id, shared_id FROM goals WHERE title ILIKE '%Ahorrar%' OR title ILIKE '%Ahorro%'");
        console.log(JSON.stringify(res.rows, null, 2));

        if (res.rows.length > 0) {
            const userId = res.rows[0].user_id;
            console.log(`\nUser ID for this goal: ${userId}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
