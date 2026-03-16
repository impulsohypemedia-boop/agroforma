import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Missing env vars", hasUrl: !!url, hasKey: !!key });
  }

  const supabase = createClient(url, key);

  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    return NextResponse.json({ error: "listBuckets failed", details: bucketsError.message, keyPrefix: key.substring(0, 20) });
  }

  return NextResponse.json({ buckets: buckets.map(b => b.name), keyPrefix: key.substring(0, 20) });
}
