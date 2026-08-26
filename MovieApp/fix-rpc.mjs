import pg from "pg";
const { Client } = pg;

// Credentials from environment only — never hardcode.
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

// NOTE: because RETURNS TABLE declares device_id/remaining_seconds/is_expired
// as PL/pgSQL variables, ALL table columns must be table-qualified.
const SQL = `
create or replace function public.guest_device_lookup(p_fingerprint text)
returns table (device_id uuid, remaining_seconds int, is_expired boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dev public.guest_devices%rowtype;
  v_now timestamptz := now();
begin
  if p_fingerprint is null or length(p_fingerprint) = 0 then
    return;
  end if;

  select gd.* into v_dev from public.guest_devices gd where gd.fingerprint = p_fingerprint;

  if not found then
    insert into public.guest_devices (fingerprint, seconds_used, is_expired, last_seen)
    values (p_fingerprint, 0, false, v_now)
    returning * into v_dev;
  else
    -- Update last_seen only. Timer is paused when not actively watching/heartbeating.
    update public.guest_devices
      set last_seen = v_now
      where guest_devices.device_id = v_dev.device_id;
  end if;

  return query select v_dev.device_id, greatest(0, 1800 - v_dev.seconds_used), v_dev.is_expired;
end;
$$;

create or replace function public.guest_device_heartbeat(
  p_device_id uuid,
  p_seconds_elapsed int
)
returns table (remaining_seconds int, is_expired boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dev public.guest_devices%rowtype;
  v_new_used int;
  v_now timestamptz := now();
begin
  -- Clamp client-reported elapsed so a client can only report between 0 and 60 seconds per beat
  p_seconds_elapsed := greatest(0, least(coalesce(p_seconds_elapsed, 0), 60));

  select gd.* into v_dev from public.guest_devices gd where gd.device_id = p_device_id;

  if not found or v_dev.is_expired then
    return query select 0::int, true;
    return;
  end if;

  -- Only increment by actual active watch elapsed seconds
  v_new_used := least(1800, v_dev.seconds_used + p_seconds_elapsed);

  update public.guest_devices
    set seconds_used = v_new_used,
        last_seen = v_now,
        is_expired = (v_new_used >= 1800)
    where guest_devices.device_id = p_device_id;

  return query select greatest(0, 1800 - v_new_used), (v_new_used >= 1800);
end;
$$;
`;

try {
  await client.connect();
  await client.query(SQL);
  console.log("✅ both RPCs rewritten with qualified columns");
} catch (e) {
  console.error("FAILED:", e.message);
} finally {
  await client.end();
}
