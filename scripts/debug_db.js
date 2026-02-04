import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function debugFetch() {
    try {
        console.log("Checking table existence and columns...");
        const tableQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'incomes';
    `;
        const tableResult = await pool.query(tableQuery);
        console.log("Columns in 'incomes' table:");
        console.table(tableResult.rows);

        const userId = "6221431c-7a17-4acc-9c01-43903e30eb21";
        console.log(`\nFetching incomes for user: ${userId}...`);
        const query = 'SELECT * FROM incomes WHERE user_id = $1';
        const result = await pool.query(query, [userId]);

        console.log(`Found ${result.rows.length} income(s).`);
        if (result.rows.length > 0) {
            console.log(JSON.stringify(result.rows, null, 2));
        }

    } catch (err) {
        console.error('ERROR DETECTED:', err);
        console.error('Stack:', err.stack);
    } finally {
        await pool.end();
    }
}

debugFetch();
