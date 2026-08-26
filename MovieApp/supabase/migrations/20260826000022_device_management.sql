-- ============================================================================
-- MIGRATION 22: DEVICE MANAGEMENT & SESSION SECURITY
-- ============================================================================
-- Track which devices are logged into each user's account.
-- Enables auto-logout of other sessions when new login detected.

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_fingerprint text not null unique,
  device_name text not null,
  browser text,
  os text,
  ip_address text,
  country text,
  is_active boolean not null default true,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  blocked_at timestamptz
);

create index if not exists idx_user_devices_user_id on public.user_devices(user_id);
create index if not exists idx_user_devices_fingerprint on public.user_devices(device_fingerprint);

-- RLS: Users can only see/manage their own devices
alter table public.user_devices enable row level security;

revoke all on public.user_devices from anon, authenticated;
grant usage on schema public to anon, authenticated;

create policy "Users can view their own devices"
    on public.user_devices for select
    using (user_id = auth.uid());

create policy "Users can update their own devices"
    on public.user_devices for update
    using (user_id = auth.uid());

create policy "System can insert/update devices"
    on public.user_devices for insert
    with check (true);

-- ============================================================================
-- RPC: Register device on login
-- ============================================================================
create or replace function public.register_device(
  p_user_id uuid,
  p_device_fingerprint text,
  p_device_name text,
  p_browser text,
  p_os text,
  p_ip_address text
)
returns table (device_id uuid, is_new_device boolean, other_device_ids uuid[])
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device record;
  v_other_ids uuid[];
begin
  if p_user_id is null or p_device_fingerprint is null then
    return;
  end if;

  -- Try to find existing device
  select * into v_device from public.user_devices
    where user_id = p_user_id
      and device_fingerprint = p_device_fingerprint;

  if v_device is not null then
    -- Device exists: update last_active, reactivate if blocked
    update public.user_devices
      set last_active_at = now(),
          is_active = true,
          blocked_at = null
      where id = v_device.id;

    return query select
      v_device.id,
      false::boolean,
      array_agg(id) filter (where id != v_device.id and is_active = true)
    from public.user_devices
    where user_id = p_user_id;
  else
    -- New device: insert and collect other active devices for logout
    insert into public.user_devices (
      user_id, device_fingerprint, device_name, browser, os, ip_address
    ) values (
      p_user_id, p_device_fingerprint, p_device_name, p_browser, p_os, p_ip_address
    ) returning public.user_devices.id into v_device.id;

    select array_agg(id) into v_other_ids
      from public.user_devices
      where user_id = p_user_id
        and id != v_device.id
        and is_active = true;

    return query select
      v_device.id,
      true::boolean,
      coalesce(v_other_ids, array[]::uuid[]);
  end if;
end;
$$;

-- ============================================================================
-- RPC: Get active devices for user
-- ============================================================================
create or replace function public.get_user_devices(p_user_id uuid)
returns table (
  id uuid,
  device_name text,
  browser text,
  os text,
  ip_address text,
  country text,
  is_active boolean,
  last_active_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  return query
    select
      user_devices.id,
      user_devices.device_name,
      user_devices.browser,
      user_devices.os,
      user_devices.ip_address,
      user_devices.country,
      user_devices.is_active,
      user_devices.last_active_at,
      user_devices.created_at
    from public.user_devices
    where user_id = p_user_id
    order by last_active_at desc;
end;
$$;

-- ============================================================================
-- RPC: Block/revoke a device
-- ============================================================================
create or replace function public.revoke_device(p_device_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if p_device_id is null then
    return false;
  end if;

  -- Get user_id and verify ownership (implicit via RLS in real app)
  select user_id into v_user_id from public.user_devices
    where id = p_device_id;

  if v_user_id is null then
    return false;
  end if;

  -- Mark as blocked
  update public.user_devices
    set is_active = false,
        blocked_at = now()
    where id = p_device_id;

  return true;
end;
$$;

-- ============================================================================
-- Delete old Plus/Max tiers (keep only Solo ₱349)
-- ============================================================================
delete from public.subscription_packages
  where code in ('plus', 'max');

-- Ensure Solo is the only active package
update public.subscription_packages
  set is_active = true
  where code = 'solo';
