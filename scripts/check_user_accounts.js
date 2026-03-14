
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function checkUserAccounts() {
    const userId = "7fca39e4-44c8-4ae4-b964-c8418ce2d9aa";
    try {
        console.log(`Checking accounts for user: ${userId}`);
        const query = 'SELECT account_id, name, balance, savings FROM accounts WHERE user_id = $1';
        const result = await pool.query(query, [userId]);
        console.log("Results (JSON):");
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

checkUserAccounts();
