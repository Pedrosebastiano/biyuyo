
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function check() {
    try {
        const goals = await pool.query("SELECT id, title, shared_id FROM goals");
        const shared = await pool.query("SELECT shared_id, name FROM shared");

        console.log("PROFILES:");
        shared.rows.forEach(s => console.log(`- ${s.name}: ${s.shared_id}`));

        console.log("\nGOALS:");
        goals.rows.forEach(g => {
            console.log(`- Title: "${g.title}", SharedID: ${g.shared_id || 'NULL'}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
