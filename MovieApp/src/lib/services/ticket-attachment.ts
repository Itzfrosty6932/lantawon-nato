import { createClient } from "@/lib/supabase/client";

/**
 * Support-ticket attachments live in a PRIVATE storage bucket
 * (`ticket-attachments`). The stored value persisted in
 * `support_messages.attachments` (JSONB) is the storage OBJECT PATH
 * (`{userId}/{timestamp}_{name}`), never a public URL. Viewing requires a
 * short-lived signed URL — only the uploader and admins hold SELECT rights.
 */

const BUCKET = "ticket-attachments";

// Images capped at 10MB; short video clips capped at 25MB.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export interface TicketAttachment {
  path: string;
  name: string;
  mime: string;
  size: number;
}

export function validateAttachment(file: File): string | null {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return "Only image or short video files are accepted.";
  }
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return isVideo ? "Video is too large (max 25MB)." : "Image is too large (max 10MB).";
  }
  return null;
}

/** Upload one attachment to the caller's private folder. Returns metadata to persist. */
export async function uploadTicketAttachment(
  file: File,
  userId: string
): Promise<{ attachment?: TicketAttachment; error?: string }> {
  const invalid = validateAttachment(file);
  if (invalid) return { error: invalid };

  const supabase = createClient();
  // Keep the original extension; sanitize the base name for a safe object key.
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { error: error.message };
  return {
    attachment: { path, name: file.name, mime: file.type, size: file.size },
  };
}

/** Mint a 10-minute signed URL for a stored attachment path. */
export async function resolveAttachmentUrl(
  path: string | null | undefined
): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
