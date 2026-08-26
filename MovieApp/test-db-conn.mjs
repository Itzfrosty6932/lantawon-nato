// Debug script: verify direct Postgres connectivity.
// Credentials are read from environment only — NEVER hardcode them.
// Usage: SUPABASE_DB_PASSWORD=... node test-db-conn.mjs
import pg from "pg";

const { Client } = pg;

const host = process.env.SUPABASE_DB_HOST;
const password = process.env.SUPABASE_DB_PASSWORD;

if (!host || !password) {
  console.error(
    "Missing SUPABASE_DB_HOST and/or SUPABASE_DB_PASSWORD env vars. " +
      "Set them in your shell or .env.local (never commit real values)."
  );
  process.exit(1);
}

const client = new Client({
  host,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const res = await client.query("SELECT version()");
  console.log("CONNECTED:", res.rows[0].version.slice(0, 60));
} catch (e) {
  console.error("FAILED:", e.message);
} finally {
  await client.end();
}
