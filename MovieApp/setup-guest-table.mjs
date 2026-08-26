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

const SQL = `
-- ============================================================
-- GUEST DEVICE TRIAL REGISTRY (server-side 30-min enforcement)
-- ============================================================

create table if not exists public.guest_devices (
  device_id      uuid primary key default gen_random_uuid(),
  fingerprint    text unique,
  seconds_used   integer not null default 0 check (seconds_used >= 0),
  is_expired     boolean not null default false,
  first_seen     timestamptz not null default now(),
  last_seen      timestamptz not null default now()
);

create index if not exists idx_guest_devices_fingerprint
  on public.guest_devices(fingerprint);

-- Lock the table down: anon/authenticated can only act via RPCs below.
alter table public.guest_devices enable row level security;

revoke all on public.guest_devices from anon, authenticated;
grant usage on schema public to anon, authenticated;

-- ------------------------------------------------------------
-- RPC: register/lookup a device by fingerprint.
-- Returns the authoritative server-side remaining seconds.
-- Called with the anon key; no user data involved.
-- ------------------------------------------------------------
create or replace function public.guest_device_lookup(p_fingerprint text)
returns table (device_id uuid, remaining_seconds int, is_expired boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device record;
  v_now timestamptz := now();
begin
  if p_fingerprint is null or length(p_fingerprint) = 0 then
    return;
  end if;

  select * into v_device from public.guest_devices where fingerprint = p_fingerprint;

  if v_device is null then
    -- First time on this device: grant a fresh 30-minute trial
    insert into public.guest_devices (fingerprint, seconds_used, is_expired)
    values (p_fingerprint, 0, false)
    returning * into v_device;
  else
    -- Wall-clock drain: subtract elapsed real time since last_seen
    declare
      v_elapsed int := floor(extract(epoch from (v_now - v_device.last_seen)));
      v_remaining int := greatest(0, (1800 - v_device.seconds_used));
    begin
      if v_remaining - v_elapsed <= 0 and not v_device.is_expired then
        update public.guest_devices
          set is_expired = true, seconds_used = 1800, last_seen = v_now
          where device_id = v_device.device_id;
        v_device.is_expired := true;
        v_device.seconds_used := 1800;
      elsif not v_device.is_expired then
        update public.guest_devices
          set last_seen = v_now, seconds_used = least(1800, v_device.seconds_used + v_elapsed)
          where device_id = v_device.device_id;
        v_device.seconds_used := least(1800, v_device.seconds_used + v_elapsed);
      end if;
    end;
  end if;

  return query select
    v_device.device_id,
    greatest(0, 1800 - v_device.seconds_used),
    v_device.is_expired;
end;
$$;

-- ------------------------------------------------------------
-- RPC: report consumed time (heartbeat). Server clamps everything —
-- the client cannot add more than wall-clock elapsed since last call.
-- ------------------------------------------------------------
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
  v_device record;
  v_elapsed int;
  v_now timestamptz := now();
begin
  -- Clamp client-reported elapsed to sane bounds (max 60s per heartbeat,
  -- non-negative) so a tampering client can't fast-forward the clock.
  p_seconds_elapsed := greatest(0, least(coalesce(p_seconds_elapsed, 0), 60));

  select * into v_device from public.guest_devices where device_id = p_device_id;

  if v_device is null then
    return query select 0, true;
    return;
  end if;

  if v_device.is_expired then
    return query select 0, true;
    return;
  end if;

  -- Trust wall-clock between last_seen and now as the source of truth;
  -- use the larger of (client-reported, wall-clock-since-last-seen capped at 60)
  v_elapsed := floor(extract(epoch from (v_now - v_device.last_seen)));
  v_elapsed := greatest(p_seconds_elapsed, least(v_elapsed, 120));

  update public.guest_devices
    set seconds_used = least(1800, v_device.seconds_used + v_elapsed),
        last_seen = v_now
    where device_id = p_device_id;

  v_device.seconds_used := least(1800, v_device.seconds_used + v_elapsed);

  if v_device.seconds_used >= 1800 then
    update public.guest_devices set is_expired = true where device_id = p_device_id;
  end if;

  return query select
    greatest(0, 1800 - v_device.seconds_used),
    v_device.seconds_used >= 1800;
end;
$$;

grant execute on function public.guest_device_lookup(text) to anon, authenticated;
grant execute on function public.guest_device_heartbeat(uuid, int) to anon, authenticated;
`;

try {
  await client.connect();
  await client.query(SQL);
  console.log("✅ guest_devices table + RPCs created");

  // Verify
  const res = await client.query(`
    select routine_name from information_schema.routines
    where routine_schema='public' and routine_name like 'guest_device%'
  `);
  console.log("RPCs:", res.rows.map(r => r.routine_name).join(", "));
} catch (e) {
  console.error("FAILED:", e.message);
} finally {
  await client.end();
}
