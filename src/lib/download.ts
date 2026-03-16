import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "documentos";

/**
 * Download a file from Supabase Storage using the admin client.
 * Used by API routes — receives a storage path, not a URL.
 */
export async function downloadFromStorage(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Error al descargar archivo de storage: ${error?.message ?? "sin datos"}`);
  }

  return Buffer.from(await data.arrayBuffer());
}
