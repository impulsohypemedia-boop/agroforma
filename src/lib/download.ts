/**
 * Download a file from a signed URL and return it as a Buffer.
 * Used by API routes to fetch files from Supabase Storage.
 */
export async function downloadFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}
