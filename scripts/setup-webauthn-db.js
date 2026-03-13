import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function setupSchema() {
    try {
        console.log("🚀 Creating webauthn_credentials table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS webauthn_credentials (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                credential_id TEXT NOT NULL UNIQUE,
                public_key TEXT NOT NULL,
                counter BIGINT NOT NULL DEFAULT 0,
                authenticator_attachment TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP WITH TIME ZONE
            );
        `);
        console.log("✅ Table created successfully.");
        await pool.end();
    } catch (err) {
        console.error("❌ Error setting up schema:", err.message);
        process.exit(1);
    }
}

setupSchema();
