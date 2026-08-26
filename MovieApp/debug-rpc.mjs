// Debug script: exercise guest_device_lookup via the public REST endpoint.
// Project URL + key from environment only — never hardcode.
const URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL && `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/guest_device_lookup`;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before running.");
  process.exit(1);
}

const FP = "test-fp-" + Math.random().toString(36).slice(2, 10);

async function rpc(body) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log(res.status, await res.text());
}

// First call works; run the SAME fingerprint twice
await rpc({ p_fingerprint: FP });
await rpc({ p_fingerprint: FP });
