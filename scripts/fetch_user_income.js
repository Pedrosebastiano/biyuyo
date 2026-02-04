import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 20000,
});

async function run() {
    console.log('--- START DIAGNOSTIC ---');
    console.log('Connecting to Supabase...');
    try {
        await client.connect();
        console.log('CONNECTED SUCCESSFULLY!');

        const userId = "6221431c-7a17-4acc-9c01-43903e30eb21";
        console.log(`Querying incomes for user: ${userId}`);

        const res = await client.query('SELECT * FROM incomes WHERE user_id = $1', [userId]);
        console.log(`\nFound ${res.rows.length} income(s).`);

        if (res.rows.length > 0) {
            console.log('DATA FOUND:');
            console.log(JSON.stringify(res.rows, null, 2));
            const total = res.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
            console.log(`\nTOTAL INCOME: $${total.toFixed(2)}`);
        } else {
            console.log('NO DATA FOUND FOR THIS USER.');
        }

    } catch (err) {
        console.log('--- ERROR CAPTURED ---');
        console.log('Message:', err.message);
        console.log('Code:', err.code);
        console.log('Detail:', err.detail);
        if (err.stack) console.log('Stack Trace:', err.stack);
    } finally {
        try {
            await client.end();
            console.log('DISCONNECTED.');
        } catch (e) {
            console.log('Error during disconnect:', e.message);
        }
        console.log('--- END DIAGNOSTIC ---');
    }
}

run();
