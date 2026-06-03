"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Campo, Lote, PROVINCIAS_ARG, CULTIVOS_LISTA } from "@/types/gestion";
import { Plus, Trash2, Edit2, X, Sprout, MapPin, FileSpreadsheet, Map, Download, Upload, ChevronDown, Sparkles, Loader2, AlertTriangle, ArrowRightLeft, Receipt, Check } from "lucide-react";
import TabMapa from "./TabMapa";
import { uploadFile } from "@/lib/supabase/storage";
import { saveState, loadAllState } from "@/lib/supabase/db";
import { getBenchmark, getAllBenchmarks } from "@/lib/agro/benchmark";

// ─── Campo Modal ──────────────────────────────────────────────────────────────
function CampoModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Campo;
  onSave: (c: Campo) => void;
  onClose: () => void;
}) {
  const [nombre,      setNombre]      = useState(initial?.nombre ?? "");
  const [provincia,   setProvincia]   = useState(initial?.provincia ?? "");
  const [hectareas,   setHectareas]   = useState(String(initial?.hectareas ?? ""));
  const [propietario, setPropietario] = useState(initial?.propietario ?? "");
  const [coordenadas, setCoordenadas] = useState(initial?.coordenadas ?? "");
  const [notas,       setNotas]       = useState(initial?.notas ?? "");

  const handleSubmit = () => {
    if (!nombre.trim() || !provincia || !hectareas) return;
    onSave({
      id:          initial?.id ?? crypto.randomUUID(),
      nombre:      nombre.trim(),
      provincia,
      hectareas:   parseFloat(hectareas),
      propietario: propietario.trim() || undefined,
      coordenadas: coordenadas.trim() || undefined,
      notas:       notas.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "#E8E5DE" }}>
          <h2 className="text-base font-semibold" style={{ color: "#1A1A1A" }}>{initial ? "Editar campo" : "Nuevo campo"}</h2>
          <button onClick={onClose} className="cursor-pointer hover:opacity-70"><X size={18} style={{ color: "#9B9488" }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <Field label="Nombre del campo *">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="input-field" placeholder="Ej: La Esperanza" />
          </Field>
          <Field label="Provincia *">
            <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className="input-field">
              <option value="">Seleccionar...</option>
              {PROVINCIAS_ARG.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Hectáreas *">
            <input type="number" value={hectareas} onChange={(e) => setHectareas(e.target.value)} className="input-field" placeholder="Ej: 500" min="0" step="0.1" />
          </Field>
          <Field label="Propietario">
            <input value={propietario} onChange={(e) => setPropietario(e.target.value)} className="input-field" placeholder="Opcional" />
          </Field>
          <Field label="Coordenadas">
            <input value={coordenadas} onChange={(e) => setCoordenadas(e.target.value)} className="input-field" placeholder="Ej: -34.6037, -63.4467" />
          </Field>
          <Field label="Notas">
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="input-field resize-none" rows={2} placeholder="Opcional" />
          </Field>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm border cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: "#D6D1C8", color: "#6B6560" }}>Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!nombre.trim() || !provincia || !hectareas}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#3D7A1C" }}
          >
            {initial ? "Guardar cambios" : "Agregar campo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lote (Plan de Siembra) Modal ─────────────────────────────────────────────
function LoteModal({
  initial,
  campos,
  campana,
  onSave,
  onClose,
}: {
  initial?: Lote;
  campos: Campo[];
  campana: string;
  onSave: (l: Lote) => void;
  onClose: () => void;
}) {
  const [campoId,     setCampoId]     = useState(initial?.campoId ?? (campos[0]?.id ?? ""));
  const [cultivo,     setCultivo]     = useState(initial?.cultivo ?? "");
  const [hectareas,   setHectareas]   = useState(String(initial?.hectareas ?? ""));
  const [rendimiento, setRendimiento] = useState(String(initial?.rendimientoEsperado ?? ""));
  const [precio,      setPrecio]      = useState(String(initial?.precioEsperado ?? ""));
  const [costos,      setCostos]      = useState(String(initial?.costosDirectos ?? ""));
  const [notas,       setNotas]       = useState(initial?.notas ?? "");
  // Datos reales (post-cosecha)
  const [rendReal,    setRendReal]    = useState(String(initial?.rendimientoReal ?? ""));
  const [precioReal,  setPrecioReal]  = useState(String(initial?.precioReal ?? ""));
  const [costosReal,  setCostosReal]  = useState(String(initial?.costosReales ?? ""));
  const [realOpen,    setRealOpen]    = useState(!!(initial?.rendimientoReal || initial?.precioReal || initial?.costosReales));

  const handleSubmit = () => {
    if (!campoId || !cultivo || !hectareas || !rendimiento || !precio || !costos) return;
    onSave({
      id:                   initial?.id ?? crypto.randomUUID(),
      campoId,
      cultivo,
      hectareas:            parseFloat(hectareas),
      rendimientoEsperado:  parseFloat(rendimiento),
      precioEsperado:       parseFloat(precio),
      costosDirectos:       parseFloat(costos),
      campana,
      notas:                notas.trim() || undefined,
      rendimientoReal:      rendReal ? parseFloat(rendReal) : undefined,
      precioReal:           precioReal ? parseFloat(precioReal) : undefined,
      costosReales:         costosReal ? parseFloat(costosReal) : undefined,
    });
  };

  const ingreso = campoId && hectareas && rendimiento && precio
    ? parseFloat(hectareas) * parseFloat(rendimiento) * parseFloat(precio)
    : null;
  const costoTotal = campoId && hectareas && costos
    ? parseFloat(hectareas) * parseFloat(costos)
    : null;
  const margen = ingreso !== null && costoTotal !== null ? ingreso - costoTotal : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "#E8E5DE" }}>
          <h2 className="text-base font-semibold" style={{ color: "#1A1A1A" }}>{initial ? "Editar lote" : "Nuevo lote"}</h2>
          <button onClick={onClose} className="cursor-pointer hover:opacity-70"><X size={18} style={{ color: "#9B9488" }} /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Campo *">
              <select value={campoId} onChange={(e) => setCampoId(e.target.value)} className="input-field">
                {campos.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.hectareas} ha)</option>)}
              </select>
            </Field>
          </div>
          <Field label="Cultivo *">
            <select value={cultivo} onChange={(e) => setCultivo(e.target.value)} className="input-field">
              <option value="">Seleccionar...</option>
              {CULTIVOS_LISTA.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Hectáreas *">
            <input type="number" value={hectareas} onChange={(e) => setHectareas(e.target.value)} className="input-field" placeholder="ha" min="0" step="0.1" />
          </Field>
          <Field label="Rend. esperado (tn/ha) *">
            <input type="number" value={rendimiento} onChange={(e) => setRendimiento(e.target.value)} className="input-field" placeholder="tn/ha" min="0" step="0.1" />
          </Field>
          <Field label="Precio esperado (USD/tn) *">
            <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} className="input-field" placeholder="USD/tn" min="0" step="1" />
          </Field>
          <div className="col-span-2">
            <Field label="Costos directos (USD/ha) *">
              <input type="number" value={costos} onChange={(e) => setCostos(e.target.value)} className="input-field" placeholder="USD/ha" min="0" step="1" />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Notas">
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="input-field resize-none" rows={2} placeholder="Opcional" />
            </Field>
          </div>
          {/* Datos reales — collapsible */}
          <div className="col-span-2">
            <button
              type="button"
              onClick={() => setRealOpen(v => !v)}
              className="flex items-center gap-2 text-xs font-semibold cursor-pointer hover:opacity-80 transition-colors"
              style={{ color: "#6B6560" }}
            >
              <ChevronDown size={14} className={`transition-transform ${realOpen ? "rotate-180" : ""}`} />
              Datos reales (post-cosecha)
            </button>
            {realOpen && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Field label="Rinde real (tn/ha)">
                  <input type="number" value={rendReal} onChange={(e) => setRendReal(e.target.value)} className="input-field" placeholder="tn/ha" min="0" step="0.1" />
                </Field>
                <Field label="Precio real (USD/tn)">
                  <input type="number" value={precioReal} onChange={(e) => setPrecioReal(e.target.value)} className="input-field" placeholder="USD/tn" min="0" step="1" />
                </Field>
                <Field label="Costos reales (USD/ha)">
                  <input type="number" value={costosReal} onChange={(e) => setCostosReal(e.target.value)} className="input-field" placeholder="USD/ha" min="0" step="1" />
                </Field>
              </div>
            )}
          </div>
          {margen !== null && (
            <div className="col-span-2 rounded-lg px-4 py-3 grid grid-cols-3 gap-3 text-center" style={{ backgroundColor: "#F5FAF3", border: "1px solid #C8E6C0" }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>Ingreso bruto</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "#3D7A1C" }}>USD {ingreso!.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>Costo total</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "#C0392B" }}>USD {costoTotal!.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>Margen bruto</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: margen >= 0 ? "#3D7A1C" : "#C0392B" }}>
                  USD {margen.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm border cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: "#D6D1C8", color: "#6B6560" }}>Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!campoId || !cultivo || !hectareas || !rendimiento || !precio || !costos}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#3D7A1C" }}
          >
            {initial ? "Guardar cambios" : "Agregar lote"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6560" }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Tab: Campos ──────────────────────────────────────────────────────────────
function TabCampos() {
  const { campos, setCampos } = useAppContext();
  const [modal, setModal] = useState<{ open: boolean; editing?: Campo }>({ open: false });

  const totalHa = campos.reduce((s, c) => s + c.hectareas, 0);

  const handleSave = (c: Campo) => {
    setCampos((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = c; return next; }
      return [...prev, c];
    });
    setModal({ open: false });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{campos.length} campo{campos.length !== 1 ? "s" : ""}</p>
          {totalHa > 0 && <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>{totalHa.toLocaleString("es-AR")} ha en total</p>}
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90"
          style={{ backgroundColor: "#3D7A1C" }}
        >
          <Plus size={14} /> Nuevo campo
        </button>
      </div>

      {campos.length === 0 ? (
        <EmptyState icon={MapPin} text="Todavía no cargaste campos" sub="Agregá el primer campo para comenzar a planificar" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#FAFAF8" }}>
                {["Nombre", "Provincia", "Hectáreas", "Propietario", ""].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campos.map((c, i) => (
                <tr key={c.id} style={{ borderTop: i > 0 ? "1px solid #F0EDE6" : undefined }}>
                  <td className="px-5 py-4 font-medium" style={{ color: "#1A1A1A" }}>{c.nombre}</td>
                  <td className="px-5 py-4" style={{ color: "#6B6560" }}>{c.provincia}</td>
                  <td className="px-5 py-4" style={{ color: "#6B6560" }}>{c.hectareas.toLocaleString("es-AR")} ha</td>
                  <td className="px-5 py-4" style={{ color: "#9B9488" }}>{c.propietario ?? "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setModal({ open: true, editing: c })} className="cursor-pointer hover:opacity-70 p-1"><Edit2 size={14} style={{ color: "#9B9488" }} /></button>
                      <button onClick={() => setCampos((prev) => prev.filter((x) => x.id !== c.id))} className="cursor-pointer hover:opacity-70 p-1"><Trash2 size={14} style={{ color: "#C0392B" }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <CampoModal initial={modal.editing} onSave={handleSave} onClose={() => setModal({ open: false })} />
      )}
    </div>
  );
}

// ─── Tab: Plan de Siembra ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LiquidacionExtraida = { fuente: string; fecha: string; items: any[]; gastos_comerciales: any; confianza: string; notas: string };
type LiquidacionMatch = { loteId: string; campo: string; cultivo: string; rendimiento: number | null; precio: number | null; aplicar: boolean };

function TabPlanSiembra() {
  const { campos, planSiembra, setPlanSiembra, campanaActual, setCampanaActual, empresaActivaId } = useAppContext();
  const { user } = useAuth();
  const [modal, setModal] = useState<{ open: boolean; editing?: Lote }>({ open: false });
  const liqInputRef = useRef<HTMLInputElement>(null);
  const [liqUploading, setLiqUploading] = useState(false);
  const [liqError, setLiqError] = useState<string | null>(null);
  const [liqData, setLiqData] = useState<LiquidacionExtraida | null>(null);
  const [liqMatches, setLiqMatches] = useState<LiquidacionMatch[]>([]);

  const lotesDeCampana = planSiembra.filter((l) => l.campana === campanaActual);
  const hayDatosReales = lotesDeCampana.some((l) => l.rendimientoReal != null || l.precioReal != null || l.costosReales != null);

  const totals = lotesDeCampana.reduce(
    (acc, l) => {
      const ingresoEsp = l.hectareas * l.rendimientoEsperado * l.precioEsperado;
      const costoEsp = l.hectareas * l.costosDirectos;
      const ingresoReal = (l.rendimientoReal != null && l.precioReal != null) ? l.hectareas * l.rendimientoReal * l.precioReal : null;
      const costoReal = l.costosReales != null ? l.hectareas * l.costosReales : null;
      return {
        ha: acc.ha + l.hectareas,
        ingreso: acc.ingreso + ingresoEsp,
        costos: acc.costos + costoEsp,
        ingresoReal: ingresoReal != null ? (acc.ingresoReal ?? 0) + ingresoReal : acc.ingresoReal,
        costosReal: costoReal != null ? (acc.costosReal ?? 0) + costoReal : acc.costosReal,
      };
    },
    { ha: 0, ingreso: 0, costos: 0, ingresoReal: null as number | null, costosReal: null as number | null }
  );
  const margenTotal = totals.ingreso - totals.costos;
  const margenRealTotal = (totals.ingresoReal != null && totals.costosReal != null) ? totals.ingresoReal - totals.costosReal : null;

  const getCampoNombre = (id: string) => campos.find((c) => c.id === id)?.nombre ?? "—";

  const handleSave = (l: Lote) => {
    setPlanSiembra((prev) => {
      const idx = prev.findIndex((x) => x.id === l.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = l; return next; }
      return [...prev, l];
    });
    setModal({ open: false });
  };

  // ── Liquidación upload + extraction ──
  const handleLiquidacionFile = async (file: File) => {
    if (!empresaActivaId || !user) return;
    setLiqUploading(true);
    setLiqError(null);
    setLiqData(null);
    setLiqMatches([]);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const customFile = new File([file], `liquidacion_${Date.now()}_${safeName}`, { type: file.type });
      const { path } = await uploadFile(empresaActivaId, customFile);

      const res = await fetch("/api/gestion/extraer-liquidacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [{ name: file.name, path }] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al extraer datos");

      const data = json.data as LiquidacionExtraida;
      setLiqData(data);

      // Match extracted items to existing lotes by cultivo
      const norm = (s: string) => s.toLowerCase().trim();
      const matches: LiquidacionMatch[] = [];
      for (const item of data.items) {
        const cultivoNorm = norm(item.cultivo);
        const lotesMatch = lotesDeCampana.filter((l) => norm(l.cultivo) === cultivoNorm);
        for (const lote of lotesMatch) {
          matches.push({
            loteId: lote.id,
            campo: getCampoNombre(lote.campoId),
            cultivo: lote.cultivo,
            rendimiento: item.rendimiento_tnha ?? null,
            precio: item.precio_neto_usd_tn ?? item.precio_usd_tn ?? null,
            aplicar: true,
          });
        }
        // If no match found, still show with empty loteId
        if (lotesMatch.length === 0) {
          matches.push({
            loteId: "",
            campo: "Sin lote coincidente",
            cultivo: item.cultivo,
            rendimiento: item.rendimiento_tnha ?? null,
            precio: item.precio_neto_usd_tn ?? item.precio_usd_tn ?? null,
            aplicar: false,
          });
        }
      }
      setLiqMatches(matches);
    } catch (e) {
      setLiqError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLiqUploading(false);
    }
  };

  const handleLiqInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLiquidacionFile(file);
    e.target.value = "";
  };

  const handleAplicarLiquidacion = () => {
    setPlanSiembra((prev) => {
      const next = [...prev];
      for (const match of liqMatches) {
        if (!match.aplicar || !match.loteId) continue;
        const idx = next.findIndex((l) => l.id === match.loteId);
        if (idx < 0) continue;
        const updated = { ...next[idx] };
        if (match.rendimiento != null) updated.rendimientoReal = match.rendimiento;
        if (match.precio != null) updated.precioReal = match.precio;
        next[idx] = updated;
      }
      return next;
    });
    setLiqData(null);
    setLiqMatches([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>Campaña</label>
          <input
            value={campanaActual}
            onChange={(e) => setCampanaActual(e.target.value)}
            className="input-field w-28 text-sm"
            placeholder="2025/26"
          />
        </div>
        <div className="flex items-center gap-3">
          {lotesDeCampana.length > 0 && (
            <button
              onClick={() => liqInputRef.current?.click()}
              disabled={liqUploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ borderColor: "#D4AD3C", color: "#D4AD3C" }}
            >
              {liqUploading ? <Loader2 size={13} className="animate-spin" /> : <Receipt size={13} />}
              {liqUploading ? "Extrayendo..." : "Subir liquidación"}
            </button>
          )}
          <button
            onClick={() => {
              alert("Próximamente: importar desde Excel");
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#D6D1C8", color: "#6B6560" }}
          >
            <FileSpreadsheet size={13} /> Importar Excel
          </button>
          {campos.length > 0 && (
            <button
              onClick={() => setModal({ open: true })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90"
              style={{ backgroundColor: "#3D7A1C" }}
            >
              <Plus size={14} /> Nuevo lote
            </button>
          )}
        </div>
      </div>

      {/* Liquidación file input */}
      <input ref={liqInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" className="hidden" onChange={handleLiqInputChange} />

      {/* Liquidación error */}
      {liqError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: "#FDE8E8", color: "#C0392B" }}>
          <AlertTriangle size={14} />
          <p className="text-xs font-medium">{liqError}</p>
          <button onClick={() => setLiqError(null)} className="ml-auto cursor-pointer hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      {/* Liquidación confirmation panel */}
      {liqData && liqMatches.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#D4AD3C" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F0EDE6", backgroundColor: "#FFFDF5" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Datos extraídos de liquidación</p>
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
                {liqData.fuente && `${liqData.fuente} — `}{liqData.fecha} — Confianza: {liqData.confianza}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setLiqData(null); setLiqMatches([]); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: "#D6D1C8", color: "#6B6560" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAplicarLiquidacion}
                disabled={!liqMatches.some((m) => m.aplicar && m.loteId)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: "#3D7A1C" }}
              >
                <Check size={13} /> Aplicar datos reales
              </button>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: "#FAFAF8" }}>
                {["Aplicar", "Cultivo", "Lote destino", "Rinde real (tn/ha)", "Precio real (USD/tn)"].map((col) => (
                  <th key={col} className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liqMatches.map((m, i) => (
                <tr key={i} style={{ borderTop: i > 0 ? "1px solid #F0EDE6" : undefined, opacity: m.loteId ? 1 : 0.5 }}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={m.aplicar}
                      disabled={!m.loteId}
                      onChange={() => setLiqMatches((prev) => prev.map((x, j) => j === i ? { ...x, aplicar: !x.aplicar } : x))}
                      className="accent-[#3D7A1C] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "#1A1A1A" }}>{m.cultivo}</td>
                  <td className="px-4 py-3" style={{ color: m.loteId ? "#6B6560" : "#C0392B" }}>{m.campo}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: "#3D7A1C" }}>{m.rendimiento != null ? m.rendimiento : "—"}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: "#3D7A1C" }}>{m.precio != null ? `USD ${m.precio}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {liqData.notas && (
            <div className="px-5 py-3 border-t text-xs" style={{ borderColor: "#F0EDE6", color: "#9B9488" }}>
              {liqData.notas}
            </div>
          )}
        </div>
      )}

      {campos.length === 0 ? (
        <EmptyState icon={Sprout} text="Primero cargá campos" sub="Necesitás al menos un campo para crear el plan de siembra" />
      ) : lotesDeCampana.length === 0 ? (
        <EmptyState icon={Sprout} text="Plan de siembra vacío" sub={`Agregá lotes para la campaña ${campanaActual}`} />
      ) : (
        <>
          <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: "#E8E5DE" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#FAFAF8" }}>
                  {[
                    "Campo", "Cultivo", "Ha", "Rend. (tn/ha)", "Precio (USD/tn)", "Ingreso (USD)", "Costo (USD)", "Margen esp. (USD)",
                    ...(hayDatosReales ? ["Margen real (USD)", "Desvío"] : []),
                    "",
                  ].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#9B9488" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lotesDeCampana.map((l, i) => {
                  const ingreso = l.hectareas * l.rendimientoEsperado * l.precioEsperado;
                  const costo = l.hectareas * l.costosDirectos;
                  const margen = ingreso - costo;
                  const tieneReal = l.rendimientoReal != null && l.precioReal != null && l.costosReales != null;
                  const ingresoReal = tieneReal ? l.hectareas * l.rendimientoReal! * l.precioReal! : null;
                  const costoReal = tieneReal ? l.hectareas * l.costosReales! : null;
                  const margenReal = (ingresoReal != null && costoReal != null) ? ingresoReal - costoReal : null;
                  const desvio = (margenReal != null && margen !== 0) ? ((margenReal - margen) / Math.abs(margen)) * 100 : null;
                  return (
                    <tr key={l.id} style={{ borderTop: i > 0 ? "1px solid #F0EDE6" : undefined }}>
                      <td className="px-4 py-3 font-medium text-xs" style={{ color: "#1A1A1A" }}>{getCampoNombre(l.campoId)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B6560" }}>{l.cultivo}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B6560" }}>{l.hectareas.toLocaleString("es-AR")}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B6560" }}>{l.rendimientoEsperado}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B6560" }}>{l.precioEsperado}</td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: "#3D7A1C" }}>{ingreso.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#C0392B" }}>{costo.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: margen >= 0 ? "#3D7A1C" : "#C0392B" }}>{margen.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</td>
                      {hayDatosReales && (
                        <>
                          <td className="px-4 py-3 text-xs font-semibold" style={{ color: margenReal != null ? (margenReal >= 0 ? "#3D7A1C" : "#C0392B") : "#9B9488" }}>
                            {margenReal != null ? margenReal.toLocaleString("es-AR", { maximumFractionDigits: 0 }) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold">
                            {desvio != null ? (
                              <span style={{ color: desvio >= 0 ? "#3D7A1C" : "#C0392B" }}>
                                {desvio >= 0 ? "+" : ""}{desvio.toFixed(1)}%
                              </span>
                            ) : (
                              <span style={{ color: "#9B9488" }}>—</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setModal({ open: true, editing: l })} className="cursor-pointer hover:opacity-70 p-1"><Edit2 size={13} style={{ color: "#9B9488" }} /></button>
                          <button onClick={() => setPlanSiembra((prev) => prev.filter((x) => x.id !== l.id))} className="cursor-pointer hover:opacity-70 p-1"><Trash2 size={13} style={{ color: "#C0392B" }} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #E8E5DE", backgroundColor: "#FAFAF8" }}>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: "#1A1A1A" }} colSpan={2}>TOTALES</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: "#1A1A1A" }}>{totals.ha.toLocaleString("es-AR")}</td>
                  <td colSpan={2} />
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: "#3D7A1C" }}>{totals.ingreso.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: "#C0392B" }}>{totals.costos.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: margenTotal >= 0 ? "#3D7A1C" : "#C0392B" }}>{margenTotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</td>
                  {hayDatosReales && (
                    <>
                      <td className="px-4 py-3 text-xs font-bold" style={{ color: margenRealTotal != null ? (margenRealTotal >= 0 ? "#3D7A1C" : "#C0392B") : "#9B9488" }}>
                        {margenRealTotal != null ? margenRealTotal.toLocaleString("es-AR", { maximumFractionDigits: 0 }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">
                        {margenRealTotal != null && margenTotal !== 0 ? (
                          <span style={{ color: (margenRealTotal - margenTotal) >= 0 ? "#3D7A1C" : "#C0392B" }}>
                            {(margenRealTotal - margenTotal) >= 0 ? "+" : ""}{(((margenRealTotal - margenTotal) / Math.abs(margenTotal)) * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ color: "#9B9488" }}>—</span>
                        )}
                      </td>
                    </>
                  )}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {modal.open && campos.length > 0 && (
        <LoteModal
          initial={modal.editing}
          campos={campos}
          campana={campanaActual}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalisisIA = { resumen: string; ranking: any[]; recomendaciones: any[]; escenarios_rotacion: any[] };

function TabResumen() {
  const { campos, planSiembra, campanaActual } = useAppContext();
  const lotes = planSiembra.filter((l) => l.campana === campanaActual);
  const [analisis, setAnalisis] = useState<AnalisisIA | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [errorIA, setErrorIA] = useState<string | null>(null);

  const totalHa = lotes.reduce((s, l) => s + l.hectareas, 0);
  const totalIngreso = lotes.reduce((s, l) => s + l.hectareas * l.rendimientoEsperado * l.precioEsperado, 0);
  const totalCostos = lotes.reduce((s, l) => s + l.hectareas * l.costosDirectos, 0);
  const margenTotal = totalIngreso - totalCostos;
  const margenHa = totalHa > 0 ? margenTotal / totalHa : 0;

  // Group by cultivo
  const byCultivo: Record<string, { ha: number; ingreso: number; costos: number }> = {};
  for (const l of lotes) {
    if (!byCultivo[l.cultivo]) byCultivo[l.cultivo] = { ha: 0, ingreso: 0, costos: 0 };
    byCultivo[l.cultivo].ha += l.hectareas;
    byCultivo[l.cultivo].ingreso += l.hectareas * l.rendimientoEsperado * l.precioEsperado;
    byCultivo[l.cultivo].costos += l.hectareas * l.costosDirectos;
  }

  // Group by campo
  const byCampo: Record<string, { nombre: string; ha: number; margen: number }> = {};
  for (const l of lotes) {
    const campo = campos.find((c) => c.id === l.campoId);
    if (!campo) continue;
    if (!byCampo[l.campoId]) byCampo[l.campoId] = { nombre: campo.nombre, ha: 0, margen: 0 };
    byCampo[l.campoId].ha += l.hectareas;
    byCampo[l.campoId].margen += l.hectareas * l.rendimientoEsperado * l.precioEsperado - l.hectareas * l.costosDirectos;
  }

  const handleAnalizar = async () => {
    setAnalizando(true);
    setErrorIA(null);
    setAnalisis(null);
    try {
      // Enrich lotes with benchmark for each one
      const lotesEnriquecidos = lotes.map((l) => {
        const campo = campos.find((c) => c.id === l.campoId);
        const bm = campo ? getBenchmark(campo.provincia, l.cultivo) : null;
        return { ...l, benchmark: bm };
      });

      const res = await fetch("/api/gestion/analisis-margen-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotes: lotesEnriquecidos,
          campos,
          benchmarks: getAllBenchmarks(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al analizar");
      setAnalisis(json.data);
    } catch (e) {
      setErrorIA(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setAnalizando(false);
    }
  };

  if (lotes.length === 0) {
    return <EmptyState icon={Sprout} text="Sin datos para el resumen" sub={`Cargá el plan de siembra para la campaña ${campanaActual}`} />;
  }

  const SEMAFORO_COLORS: Record<string, string> = { verde: "#3D7A1C", amarillo: "#D4AD3C", rojo: "#C0392B" };
  const SEMAFORO_BG: Record<string, string> = { verde: "#EBF3E8", amarillo: "#FFF8E1", rojo: "#FDE8E8" };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Hectáreas totales", value: `${totalHa.toLocaleString("es-AR")} ha`, color: "#1A1A1A" },
          { label: "Ingreso bruto", value: `USD ${totalIngreso.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`, color: "#3D7A1C" },
          { label: "Costos directos", value: `USD ${totalCostos.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`, color: "#C0392B" },
          { label: "Margen bruto/ha", value: `USD ${margenHa.toLocaleString("es-AR", { maximumFractionDigits: 0 })}/ha`, color: margenHa >= 0 ? "#3D7A1C" : "#C0392B" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border px-5 py-4" style={{ borderColor: "#E8E5DE" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9B9488" }}>{kpi.label}</p>
            <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* By cultivo */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#F0EDE6" }}>
            <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Por cultivo</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: "#FAFAF8" }}>
                {["Cultivo", "Ha", "Margen (USD)"].map((col) => (
                  <th key={col} className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCultivo).sort(([, a], [, b]) => (b.ingreso - b.costos) - (a.ingreso - a.costos)).map(([cult, data], i) => {
                const margen = data.ingreso - data.costos;
                return (
                  <tr key={cult} style={{ borderTop: i > 0 ? "1px solid #F0EDE6" : undefined }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#1A1A1A" }}>{cult}</td>
                    <td className="px-4 py-3" style={{ color: "#6B6560" }}>{data.ha.toLocaleString("es-AR")}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: margen >= 0 ? "#3D7A1C" : "#C0392B" }}>{margen.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* By campo */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#F0EDE6" }}>
            <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Por campo</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: "#FAFAF8" }}>
                {["Campo", "Ha", "Margen (USD)"].map((col) => (
                  <th key={col} className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCampo).sort(([, a], [, b]) => b.margen - a.margen).map(([id, data], i) => (
                <tr key={id} style={{ borderTop: i > 0 ? "1px solid #F0EDE6" : undefined }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "#1A1A1A" }}>{data.nombre}</td>
                  <td className="px-4 py-3" style={{ color: "#6B6560" }}>{data.ha.toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: data.margen >= 0 ? "#3D7A1C" : "#C0392B" }}>{data.margen.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Análisis con IA */}
      <div className="border-t pt-6" style={{ borderColor: "#E8E5DE" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Análisis de márgenes con IA</p>
            <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Claude analiza tus lotes contra benchmarks de zona y sugiere mejoras</p>
          </div>
          <button
            onClick={handleAnalizar}
            disabled={analizando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: "#3D7A1C" }}
          >
            {analizando ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {analizando ? "Analizando..." : "Analizar márgenes con IA"}
          </button>
        </div>

        {errorIA && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4" style={{ backgroundColor: "#FDE8E8", color: "#C0392B" }}>
            <AlertTriangle size={14} />
            <p className="text-xs font-medium">{errorIA}</p>
          </div>
        )}

        {analisis && (
          <div className="space-y-5">
            {/* Resumen ejecutivo */}
            <div className="bg-white rounded-xl border px-6 py-5" style={{ borderColor: "#E8E5DE" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9B9488" }}>Resumen ejecutivo</p>
              <p className="text-sm leading-relaxed" style={{ color: "#1A1A1A" }}>{analisis.resumen}</p>
            </div>

            {/* Ranking por lote */}
            {analisis.ranking && analisis.ranking.length > 0 && (
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: "#F0EDE6" }}>
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Ranking por lote (peor a mejor)</p>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: "#FAFAF8" }}>
                      {["", "Campo", "Cultivo", "Ha", "Margen/ha", "Benchmark/ha", "vs Benchmark", "Diagnóstico"].map((col) => (
                        <th key={col} className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#9B9488" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analisis.ranking.map((r: Record<string, unknown>, i: number) => {
                      const semaforo = (r.semaforo as string) || "verde";
                      const margenHaVal = (r.margenRealHa ?? r.margenEsperadoHa ?? 0) as number;
                      const benchHa = (r.margenBenchmarkHa ?? 0) as number;
                      const desvio = (r.desvioVsBenchmark ?? 0) as number;
                      return (
                        <tr key={i} style={{ borderTop: i > 0 ? "1px solid #F0EDE6" : undefined }}>
                          <td className="px-4 py-3">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: SEMAFORO_COLORS[semaforo] ?? "#9B9488" }}
                              title={semaforo}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: "#1A1A1A" }}>{r.campo as string}</td>
                          <td className="px-4 py-3" style={{ color: "#6B6560" }}>{r.cultivo as string}</td>
                          <td className="px-4 py-3" style={{ color: "#6B6560" }}>{(r.hectareas as number)?.toLocaleString("es-AR")}</td>
                          <td className="px-4 py-3 font-semibold" style={{ color: margenHaVal >= 0 ? "#3D7A1C" : "#C0392B" }}>
                            USD {margenHaVal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3" style={{ color: "#6B6560" }}>
                            USD {benchHa.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3 font-semibold" style={{ color: desvio >= 0 ? "#3D7A1C" : "#C0392B" }}>
                            {desvio >= 0 ? "+" : ""}{desvio.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 max-w-xs" style={{ color: "#6B6560" }}>{r.diagnostico as string}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recomendaciones */}
            {analisis.recomendaciones && analisis.recomendaciones.length > 0 && (
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: "#F0EDE6" }}>
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Recomendaciones</p>
                </div>
                <div className="divide-y" style={{ borderColor: "#F0EDE6" }}>
                  {analisis.recomendaciones.map((rec: Record<string, unknown>, i: number) => (
                    <div key={i} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: rec.tipo === "rotacion" ? "#EBF3E8" : rec.tipo === "costos" ? "#FDE8E8" : "#F0EDE6",
                            color: rec.tipo === "rotacion" ? "#3D7A1C" : rec.tipo === "costos" ? "#C0392B" : "#6B6560",
                          }}
                        >
                          {rec.tipo as string}
                        </span>
                        <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{rec.titulo as string}</p>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "#6B6560" }}>{rec.detalle as string}</p>
                      {rec.impacto_estimado ? (
                        <p className="text-xs font-semibold mt-1" style={{ color: "#3D7A1C" }}>Impacto estimado: {String(rec.impacto_estimado)}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Escenarios de rotación */}
            {analisis.escenarios_rotacion && analisis.escenarios_rotacion.length > 0 && (
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
                <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#F0EDE6" }}>
                  <ArrowRightLeft size={15} style={{ color: "#3D7A1C" }} />
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Escenarios de rotación sugeridos</p>
                </div>
                <div className="divide-y" style={{ borderColor: "#F0EDE6" }}>
                  {analisis.escenarios_rotacion.map((esc: Record<string, unknown>, i: number) => (
                    <div key={i} className="px-5 py-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded" style={{ backgroundColor: "#FDE8E8", color: "#C0392B" }}>
                          {esc.cultivo_actual as string}
                        </span>
                        <span style={{ color: "#9B9488" }}>&rarr;</span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded" style={{ backgroundColor: SEMAFORO_BG.verde, color: "#3D7A1C" }}>
                          {esc.cultivo_sugerido as string}
                        </span>
                        <span className="text-xs font-bold" style={{ color: "#3D7A1C" }}>
                          +USD {((esc.diferencia_ha as number) ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}/ha
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "#6B6560" }}>{esc.justificacion as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state helper ───────────────────────────────────────────────────────
function EmptyState({ icon: Icon, text, sub }: { icon: React.ElementType; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16" style={{ borderColor: "#D6D1C8", backgroundColor: "#FAFAF8" }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EBF3E8" }}>
        <Icon size={22} style={{ color: "#3D7A1C" }} />
      </div>
      <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{text}</p>
      <p className="text-xs text-center max-w-xs" style={{ color: "#9B9488" }}>{sub}</p>
    </div>
  );
}

// ─── Archivo CREA Card ────────────────────────────────────────────────────────
interface AgricolaArchivo {
  nombre: string;
  path: string;
  fecha: string;
}

function ArchivoCreCard() {
  const { user } = useAuth();
  const { empresaActivaId } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<AgricolaArchivo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load on mount
  useEffect(() => {
    if (!empresaActivaId) return;
    loadAllState(empresaActivaId).then((state) => {
      if (state.agricola_archivo) {
        setArchivo(state.agricola_archivo as AgricolaArchivo);
      }
    });
  }, [empresaActivaId]);

  const handleFile = async (file: File) => {
    if (!empresaActivaId || !user) return;
    setUploading(true);
    setError(null);
    try {
      // Build a sub-path inside the empresa folder using a subfolder prefix in the filename
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const customFile = new File([file], `agricola_${Date.now()}_${safeName}`, { type: file.type });
      const { path } = await uploadFile(empresaActivaId, customFile);
      const entry: AgricolaArchivo = {
        nombre: file.name,
        path,
        fecha: new Date().toISOString(),
      };
      await saveState(empresaActivaId, "agricola_archivo", entry);
      setArchivo(entry);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const fechaFormateada = archivo
    ? new Date(archivo.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: "#E8E5DE" }}>
      <div className="px-6 py-5 border-b flex items-center gap-3" style={{ borderColor: "#F0EDE6" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EBF3E8" }}>
          <FileSpreadsheet size={16} style={{ color: "#3D7A1C" }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Archivo de gestión agrícola CREA</p>
          <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Descargá la plantilla oficial CREA, completala y subila para habilitar reportes avanzados</p>
        </div>
      </div>

      <div className="px-6 py-5">
        {archivo ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EBF3E8" }}>
                <FileSpreadsheet size={17} style={{ color: "#3D7A1C" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{archivo.nombre}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Subido el {fechaFormateada}</p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ borderColor: "#D6D1C8", color: "#6B6560" }}
            >
              <Upload size={13} /> {uploading ? "Subiendo..." : "Reemplazar"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="/plantillas-crea/plantilla-campana-agricola.xlsx"
              download
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors hover:opacity-90"
              style={{ borderColor: "#3D7A1C", color: "#3D7A1C", backgroundColor: "#EBF3E8" }}
            >
              <Download size={14} /> Descargar plantilla CREA
            </a>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !empresaActivaId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: "#3D7A1C" }}
            >
              <Upload size={14} /> {uploading ? "Subiendo..." : "Subir mi archivo"}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs font-medium" style={{ color: "#C0392B" }}>{error}</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xlsm"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type Tab = "campos" | "plan" | "resumen" | "mapa";

export default function AgricolaClient() {
  const [tab, setTab] = useState<Tab>("campos");

  const tabs: { id: Tab; label: string }[] = [
    { id: "campos",  label: "Campos" },
    { id: "plan",    label: "Plan de Siembra" },
    { id: "resumen", label: "Resumen" },
    { id: "mapa",    label: "Mapa" },
  ];

  return (
    <>
      <style>{`.input-field { width: 100%; border: 1px solid #D6D1C8; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #1A1A1A; background: #FAFAF8; outline: none; } .input-field:focus { border-color: #3D7A1C; background: #fff; }`}</style>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: "#E8E5DE" }}>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Gestión Agrícola</h1>
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Campos, plan de siembra y resumen por campaña</p>
            </div>
          </header>
          <main className="px-8 py-7 max-w-6xl space-y-6">
            {/* Archivo CREA */}
            <ArchivoCreCard />

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl border w-fit" style={{ backgroundColor: "#F0EDE6", borderColor: "#E8E5DE" }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${tab === t.id ? "text-white shadow-sm" : "hover:bg-white/60"}`}
                  style={tab === t.id ? { backgroundColor: "#3D7A1C", color: "#FFFFFF" } : { color: "#6B6560" }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "campos"  && <TabCampos />}
            {tab === "plan"    && <TabPlanSiembra />}
            {tab === "resumen" && <TabResumen />}
            {tab === "mapa"    && <TabMapa />}
          </main>
        </div>
      </div>
    </>
  );
}
