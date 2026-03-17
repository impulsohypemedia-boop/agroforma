import { createClient } from "@/lib/supabase/client";
import { Empresa, EmpresaFormData } from "@/types/empresa";

// ── Helpers ──────────────────────────────────────────────────────────────────
function rowToEmpresa(row: Record<string, unknown>): Empresa {
  return {
    id:         row.id as string,
    nombre:     row.nombre as string,
    cuit:       (row.cuit as string | null) ?? undefined,
    actividad:  (row.actividad as Empresa["actividad"]) ?? "mixta",
    provincia:  (row.provincia as string | null) ?? undefined,
    localidad:  (row.localidad as string | null) ?? undefined,
    campana:    (row.campana_activa as string) ?? "2025/26",
    creadaEl:   (row.created_at as string) ?? new Date().toISOString(),
  };
}

// ── Empresa CRUD ──────────────────────────────────────────────────────────────
export async function fetchEmpresas(userId: string): Promise<Empresa[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) { console.error("fetchEmpresas:", error); return []; }
  return (data ?? []).map(rowToEmpresa);
}

export async function createEmpresa(userId: string, data: EmpresaFormData): Promise<Empresa | null> {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("empresas")
    .insert({
      user_id:        userId,
      nombre:         data.nombre,
      cuit:           data.cuit ?? null,
      actividad:      data.actividad,
      provincia:      data.provincia ?? null,
      localidad:      data.localidad ?? null,
      campana_activa: data.campana,
    })
    .select()
    .single();
  if (error) { console.error("createEmpresa:", error); return null; }
  return rowToEmpresa(row as Record<string, unknown>);
}

export async function updateEmpresa(id: string, data: Partial<Empresa>): Promise<void> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {};
  if (data.nombre    !== undefined) payload.nombre         = data.nombre;
  if (data.cuit      !== undefined) payload.cuit           = data.cuit ?? null;
  if (data.actividad !== undefined) payload.actividad      = data.actividad;
  if (data.provincia !== undefined) payload.provincia      = data.provincia ?? null;
  if (data.localidad !== undefined) payload.localidad      = data.localidad ?? null;
  if (data.campana   !== undefined) payload.campana_activa = data.campana;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from("empresas").update(payload).eq("id", id);
  if (error) console.error("updateEmpresa:", error);
}

export async function deleteEmpresa(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("empresas").delete().eq("id", id);
  if (error) console.error("deleteEmpresa:", error);
}

// ── Per-empresa state KV store ────────────────────────────────────────────────
export async function saveState(empresaId: string, key: string, value: unknown): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("empresa_state")
    .upsert(
      { empresa_id: empresaId, key, value, updated_at: new Date().toISOString() },
      { onConflict: "empresa_id,key" }
    );
  if (error) {
    console.error(`[saveState] FAILED key="${key}":`, error);
  } else {
    const preview = Array.isArray(value) ? `[${(value as unknown[]).length} items]` : typeof value;
    console.log(`[saveState] OK key="${key}" → ${preview}`);
  }
}

export async function loadAllState(empresaId: string): Promise<Record<string, unknown>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("empresa_state")
    .select("key, value")
    .eq("empresa_id", empresaId);
  if (error) { console.error("[loadAllState] FAILED:", error); return {}; }
  const result: Record<string, unknown> = {};
  for (const row of data ?? []) result[row.key] = row.value;
  const keys = Object.keys(result);
  console.log(`[loadAllState] Loaded ${keys.length} keys:`, keys);
  for (const k of keys) {
    const v = result[k];
    const preview = Array.isArray(v) ? `[${(v as unknown[]).length} items]` : v === null ? "null" : typeof v;
    console.log(`  "${k}" → ${preview}`);
  }
  return result;
}
