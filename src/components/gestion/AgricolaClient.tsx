"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";
import { Campo, Lote, PROVINCIAS_ARG, CULTIVOS_LISTA } from "@/types/gestion";
import { Plus, Trash2, Edit2, X, Sprout, MapPin, FileSpreadsheet, Map } from "lucide-react";
import TabMapa from "./TabMapa";

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
function TabPlanSiembra() {
  const { campos, planSiembra, setPlanSiembra, campanaActual, setCampanaActual } = useAppContext();
  const [modal, setModal] = useState<{ open: boolean; editing?: Lote }>({ open: false });

  const lotesDeCampana = planSiembra.filter((l) => l.campana === campanaActual);

  const totals = lotesDeCampana.reduce(
    (acc, l) => ({
      ha: acc.ha + l.hectareas,
      ingreso: acc.ingreso + l.hectareas * l.rendimientoEsperado * l.precioEsperado,
      costos: acc.costos + l.hectareas * l.costosDirectos,
    }),
    { ha: 0, ingreso: 0, costos: 0 }
  );
  const margenTotal = totals.ingreso - totals.costos;

  const getCampoNombre = (id: string) => campos.find((c) => c.id === id)?.nombre ?? "—";

  const handleSave = (l: Lote) => {
    setPlanSiembra((prev) => {
      const idx = prev.findIndex((x) => x.id === l.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = l; return next; }
      return [...prev, l];
    });
    setModal({ open: false });
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

      {campos.length === 0 ? (
        <EmptyState icon={Sprout} text="Primero cargá campos" sub="Necesitás al menos un campo para crear el plan de siembra" />
      ) : lotesDeCampana.length === 0 ? (
        <EmptyState icon={Sprout} text="Plan de siembra vacío" sub={`Agregá lotes para la campaña ${campanaActual}`} />
      ) : (
        <>
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#FAFAF8" }}>
                  {["Campo", "Cultivo", "Ha", "Rend. (tn/ha)", "Precio (USD/tn)", "Ingreso (USD)", "Costo (USD)", "Margen (USD)", ""].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#9B9488" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lotesDeCampana.map((l, i) => {
                  const ingreso = l.hectareas * l.rendimientoEsperado * l.precioEsperado;
                  const costo = l.hectareas * l.costosDirectos;
                  const margen = ingreso - costo;
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
function TabResumen() {
  const { campos, planSiembra, campanaActual } = useAppContext();
  const lotes = planSiembra.filter((l) => l.campana === campanaActual);

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

  if (lotes.length === 0) {
    return <EmptyState icon={Sprout} text="Sin datos para el resumen" sub={`Cargá el plan de siembra para la campaña ${campanaActual}`} />;
  }

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
