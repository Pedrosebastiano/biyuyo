
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function check() {
    try {
        const goals = await pool.query("SELECT id, title, user_id, shared_id FROM goals");
        const shared = await pool.query("SELECT shared_id, name FROM shared");

        console.log("--- PROFILES ---");
        shared.rows.forEach(s => console.log(`${s.name}: ${s.shared_id}`));

        console.log("\n--- GOALS ---");
        goals.rows.forEach(g => {
            const profile = g.shared_id ? shared.rows.find(s => s.shared_id === g.shared_id)?.name || 'UNKNOWN' : 'PERSONAL';
            console.log(`[${profile}] ${g.title} (ID: ${g.id})`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
