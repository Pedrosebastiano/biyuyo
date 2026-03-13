import pg from "pg";
const { Pool } = pg;const pool = new Pool({
  connectionString: "postgresql://postgres.nmbzojpyltuztngwzclm:BiyuyoPassword123*@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'accounts'
    `);
    console.log("Accounts table schema:");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
