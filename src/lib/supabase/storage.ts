import { createClient } from "@/lib/supabase/client";

const BUCKET = "documentos";

/**
 * Upload a file to Supabase Storage and return its path + signed URL.
 */
export async function uploadFile(
  empresaId: string,
  file: File
): Promise<{ path: string; signedUrl: string }> {
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${empresaId}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw new Error(`Error al subir archivo: ${error.message}`);

  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (!data?.signedUrl) throw new Error("No se pudo generar URL firmada");

  return { path, signedUrl: data.signedUrl };
}

/**
 * Get a fresh signed URL for an existing storage path.
 */
export async function getSignedUrl(path: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  if (!data?.signedUrl) throw new Error("No se pudo generar URL firmada");
  return data.signedUrl;
}

/**
 * Upload multiple files and return their metadata with URLs.
 */
export async function uploadFiles(
  empresaId: string,
  files: File[]
): Promise<{ name: string; type: string; size: number; path: string; signedUrl: string }[]> {
  const results = [];
  for (const file of files) {
    const { path, signedUrl } = await uploadFile(empresaId, file);
    results.push({
      name: file.name,
      type: file.type,
      size: file.size,
      path,
      signedUrl,
    });
  }
  return results;
}
