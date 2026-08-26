import { createClient } from "@/lib/supabase/client";

/**
 * AUDIT H2: Payment proofs live in a PRIVATE storage bucket
 * (`payment-proofs`). The stored value in `payment_submissions.proof_image_url`
 * is the storage OBJECT PATH (`{userId}/{timestamp}.{ext}`), never a public
 * URL. Viewing requires a short-lived signed URL minted server-side by
 * Supabase Storage — only the uploader and admins hold SELECT rights.
 *
 * Legacy rows may still contain data: URLs or placeholder strings from
 * before hardening; those are passed through untouched so old records
 * remain visible.
 */

const BUCKET = "payment-proofs";

/** Upload a receipt image to the caller's private folder. Returns the path to persist. */
export async function uploadPaymentProof(
  file: File,
  userId: string
): Promise<{ path?: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are accepted." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "File is too large (max 10MB)." };
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { error: error.message };
  return { path };
}

/**
 * Resolve a stored proof reference into something an <img src>/link can use:
 * - data:/http(s): URLs pass through unchanged (legacy rows)
 * - storage paths get a 10-minute signed URL (works for uploader AND admin,
 *   because Storage enforces the same RLS-backed policies on signing)
 */
export async function resolveProofUrl(
  stored: string | null | undefined
): Promise<string | null> {
  if (!stored) return null;
  if (
    stored.startsWith("data:") ||
    stored.startsWith("http://") ||
    stored.startsWith("https://")
  ) {
    return stored;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(stored, 600);
    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
