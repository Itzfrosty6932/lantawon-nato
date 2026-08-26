// Debug script: exercise guest trial RPCs via the public REST endpoint.
// Project URL + key from environment only — never hardcode.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL && `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before running.");
  process.exit(1);
}
const FP = "test-fp-" + Math.random().toString(36).slice(2, 10);

async function rpc(fn, body) {
  const res = await fetch(URL + fn, {
    method: "POST",
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

// 1. First lookup → fresh trial
let r = await rpc("guest_device_lookup", { p_fingerprint: FP });
console.log("1. fresh lookup:", r.status, JSON.stringify(r.data));

// 2. Repeat lookup immediately → same remaining
r = await rpc("guest_device_lookup", { p_fingerprint: FP });
console.log("2. repeat lookup:", r.status, "remaining:", r.data[0]?.remaining_seconds);

// 3. Heartbeat of 30s
const deviceId = (await rpc("guest_device_lookup", { p_fingerprint: FP })).data[0].device_id;
r = await rpc("guest_device_heartbeat", { p_device_id: deviceId, p_seconds_elapsed: 30 });
console.log("3. heartbeat +30s:", r.status, "remaining:", r.data[0]?.remaining_seconds);

// 4. Tampering attempt: claim 5000s elapsed in one beat
r = await rpc("guest_device_heartbeat", { p_device_id: deviceId, p_seconds_elapsed: 5000 });
console.log("4. tamper attempt (+5000s):", r.status, "remaining:", r.data[0]?.remaining_seconds);
