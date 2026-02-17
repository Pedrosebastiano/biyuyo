const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres' });

async function checkCategories() {
    try {
        await client.connect();
        const res = await client.query('SELECT macrocategoria, COUNT(*) FROM expenses GROUP BY macrocategoria');
        console.log('--- Macro Categories in DB ---');
        console.table(res.rows);

        const resSub = await client.query('SELECT categoria, COUNT(*) FROM expenses GROUP BY categoria LIMIT 10');
        console.log('\n--- Sample Sub-Categories in DB ---');
        console.table(resSub.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkCategories();
