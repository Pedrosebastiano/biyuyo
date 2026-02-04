const userId = "6221431c-7a17-4acc-9c01-43903e30eb21";
const API_URL = "http://localhost:3001";

async function testAPI() {
    try {
        console.log(`\n=== Testing API endpoints for user: ${userId} ===\n`);

        // Test expenses endpoint
        const expensesRes = await fetch(`${API_URL}/expenses?userId=${userId}`);
        const expenses = await expensesRes.json();
        console.log(`✓ GET /expenses?userId=${userId}`);
        console.log(`  Status: ${expensesRes.status}`);
        console.log(`  Count: ${expenses.length}`);

        // Test incomes endpoint
        const incomesRes = await fetch(`${API_URL}/incomes?userId=${userId}`);
        const incomes = await incomesRes.json();
        console.log(`\n✓ GET /incomes?userId=${userId}`);
        console.log(`  Status: ${incomesRes.status}`);
        console.log(`  Count: ${incomes.length}`);

        // Test reminders endpoint
        const remindersRes = await fetch(`${API_URL}/reminders?userId=${userId}`);
        const reminders = await remindersRes.json();
        console.log(`\n✓ GET /reminders?userId=${userId}`);
        console.log(`  Status: ${remindersRes.status}`);
        console.log(`  Count: ${reminders.length}`);

        // Test accounts endpoint
        const accountsRes = await fetch(`${API_URL}/accounts?userId=${userId}`);
        const accounts = await accountsRes.json();
        console.log(`\n✓ GET /accounts?userId=${userId}`);
        console.log(`  Status: ${accountsRes.status}`);
        console.log(`  Count: ${accounts.length}`);

        console.log(`\n=== Summary ===`);
        console.log(`Total data points: ${expenses.length + incomes.length + reminders.length + accounts.length}`);

    } catch (err) {
        console.error("❌ Error:", err.message);
        console.error("Make sure the server is running on port 3001");
    }
}

testAPI();
