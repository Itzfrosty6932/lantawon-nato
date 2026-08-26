-- ============================================================================
-- MIGRATION 16: GUEST DEVICE TRIAL REGISTRY (server-side 30-min enforcement)
-- ============================================================================
-- Ported from setup-guest-table.mjs so the guest trial system survives
-- database resets and is versioned with the rest of the schema.
--
-- The authoritative 30-minute (1800s) trial lives here, keyed by device
-- fingerprint. The browser's localStorage timer is only a display cache.

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

-- Lock the table down: anon/authenticated act only via the RPCs below.
alter table public.guest_devices enable row level security;

revoke all on public.guest_devices from anon, authenticated;
grant usage on schema public to anon, authenticated;

-- ----------------------------------------------------------------------------
-- RPC: register/lookup a device by fingerprint. Returns authoritative remaining
-- seconds. Wall-clock drain between calls is applied server-side.
-- ----------------------------------------------------------------------------
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
    insert into public.guest_devices (fingerprint, seconds_used, is_expired)
    values (p_fingerprint, 0, false)
    returning * into v_device;
  else
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

-- ----------------------------------------------------------------------------
-- RPC: report consumed time (heartbeat). Server clamps everything — a
-- tampering client can't fast-forward the clock beyond wall-clock elapsed.
-- ----------------------------------------------------------------------------
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

  -- Larger of client-reported vs wall-clock-since-last-seen (capped at 120s).
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

-- ============================================================================
-- XP EVENTS: allow authenticated users to log their own XP events
-- ============================================================================
-- The process_xp_event trigger (migration 6) updates profile totals. Users
-- may INSERT only rows for themselves; totals are trigger-computed so no
-- client can inflate xp_total directly.
DROP POLICY IF EXISTS "Users can insert own xp events" ON public.xp_events;
CREATE POLICY "Users can insert own xp events"
    ON public.xp_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);
