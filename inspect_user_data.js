import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const userId = "6221431c-7a17-4acc-9c01-43903e30eb21";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function inspectData() {
    try {
        console.log(`Inspecting data for userId: ${userId}`);

        // Expenses
        const resExpenses = await pool.query("SELECT * FROM expenses WHERE user_id = $1", [userId]);
        console.log("\n--- Expenses ---");
        console.table(resExpenses.rows.map(r => ({
            cat: r.categoria,
            macro: r.macrocategoria,
            amount: r.total_amount,
            date: r.created_at
        })));

        // Incomes
        const resIncomes = await pool.query("SELECT * FROM incomes WHERE user_id = $1", [userId]);
        console.log("\n--- Incomes ---");
        console.table(resIncomes.rows.map(r => ({
            cat: r.categoria,
            macro: r.macrocategoria,
            amount: r.total_amount,
            date: r.created_at
        })));

        // Accounts
        const resAccounts = await pool.query("SELECT * FROM accounts WHERE user_id = $1", [userId]);
        console.log("\n--- Accounts ---");
        console.table(resAccounts.rows.map(r => ({
            name: r.name,
            balance: r.balance,
            savings: r.savings
        })));

        // Reminders
        const resReminders = await pool.query("SELECT * FROM reminders WHERE user_id = $1", [userId]);
        console.log("\n--- Reminders ---");
        console.table(resReminders.rows.map(r => ({
            name: r.reminder_name,
            amount: r.total_amount,
            due: r.next_payment_date
        })));

        await pool.end();
    } catch (err) {
        console.error("Error:", err.message);
    }
}

inspectData();
