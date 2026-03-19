
import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function checkAccounts() {
    try {
        console.log("Checking 'accounts' table schema...");
        const schemaQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'accounts';
        `;
        const schemaResult = await pool.query(schemaQuery);
        console.log("Columns in 'accounts' table:");
        console.table(schemaResult.rows);

        console.log("\nChecking accounts for users...");
        const accountsQuery = `
            SELECT account_id, user_id, name, balance, savings, created_at
            FROM accounts
            LIMIT 10;
        `;
        const accountsResult = await pool.query(accountsQuery);
        console.table(accountsResult.rows);

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

checkAccounts();
