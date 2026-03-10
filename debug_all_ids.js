
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function check() {
    try {
        const res = await pool.query("SELECT id, title, shared_id FROM goals");
        console.log("ALL GOALS IN DB:");
        res.rows.forEach(r => {
            console.log(`- Title: "${r.title}", shared_id: "${r.shared_id}"`);
        });

        const shared = await pool.query("SELECT shared_id, name FROM shared WHERE name = 'Prueba1'");
        if (shared.rows.length > 0) {
            console.log(`\nTARGET PROFILE (Prueba1): ${shared.rows[0].shared_id}`);
        } else {
            console.log("\nPROFILE 'Prueba1' NOT FOUND");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
