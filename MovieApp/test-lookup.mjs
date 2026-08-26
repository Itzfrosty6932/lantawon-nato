// Debug script: exercise guest_device_lookup / guest_device_heartbeat RPCs directly.
// Credentials from environment only — never hardcode.
import pg from "pg";
const { Client } = pg;

if (!process.env.SUPABASE_DB_HOST || !process.env.SUPABASE_DB_PASSWORD) {
  console.error("Set SUPABASE_DB_HOST and SUPABASE_DB_PASSWORD before running.");
  process.exit(1);
}

const client = new Client({
  host: process.env.SUPABASE_DB_HOST,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT * FROM public.guest_device_lookup('test_fingerprint')`);
  console.log("Lookup:", res.rows);
  const res2 = await client.query(`SELECT * FROM public.guest_device_heartbeat($1, 10)`, [res.rows[0].device_id]);
  console.log("Heartbeat:", res2.rows);
  const res3 = await client.query(`SELECT * FROM public.guest_device_lookup('test_fingerprint')`);
  console.log("Lookup again:", res3.rows);
  await client.end();
}
run().catch(console.error);
