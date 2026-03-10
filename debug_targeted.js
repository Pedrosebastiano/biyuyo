
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function check() {
    try {
        const id = '1907a055-3413-4f11-8226-5c6f71fdbb47';
        const res = await pool.query("SELECT id, title, shared_id FROM goals WHERE shared_id = $1 OR shared_id IS NULL", [id]);

        console.log(`Goals for shared_id ${id} or NULL:`);
        res.rows.forEach(r => {
            console.log(`- [${r.shared_id ? 'SHARED' : 'PERSONAL'}] "${r.title}"`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
