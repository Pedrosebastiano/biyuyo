import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const userId = "6221431c-7a17-4acc-9c01-43903e30eb21";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function testUserData() {
    try {
        console.log(`\n=== Testing data for user: ${userId} ===\n`);

        const expenses = await pool.query("SELECT COUNT(*) as count FROM expenses WHERE user_id = $1", [userId]);
        console.log(`✓ Expenses: ${expenses.rows[0].count}`);

        const incomes = await pool.query("SELECT COUNT(*) as count FROM incomes WHERE user_id = $1", [userId]);
        console.log(`✓ Incomes: ${incomes.rows[0].count}`);

        const reminders = await pool.query("SELECT COUNT(*) as count FROM reminders WHERE user_id = $1", [userId]);
        console.log(`✓ Reminders: ${reminders.rows[0].count}`);

        const accounts = await pool.query("SELECT COUNT(*) as count FROM accounts WHERE user_id = $1", [userId]);
        console.log(`✓ Accounts: ${accounts.rows[0].count}`);

        console.log(`\n=== Testing API endpoint simulation ===\n`);

        // Simulate what the API would return
        const expensesData = await pool.query("SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        console.log(`API would return ${expensesData.rows.length} expenses`);
        if (expensesData.rows.length > 0) {
            console.log("Sample expense:", JSON.stringify(expensesData.rows[0], null, 2));
        }

        await pool.end();
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testUserData();
