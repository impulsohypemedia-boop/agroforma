"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";
import {
  StockPorCampo,
  MovimientoHacienda,
  CategoriaHacienda,
  TipoMovimiento,
  CATEGORIAS_HACIENDA,
  TIPOS_MOVIMIENTO,
} from "@/types/gestion";
import { Plus, Trash2, X, Beef } from "lucide-react";

// ─── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6560" }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Movimiento Modal ─────────────────────────────────────────────────────────
function MovimientoModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: MovimientoHacienda;
  onSave: (m: MovimientoHacienda) => void;
  onClose: () => void;
}) {
  const { campos } = useAppContext();

  const [fecha,      setFecha]      = useState(initial?.fecha ?? new Date().toISOString().split("T")[0]);
  const [tipo,       setTipo]       = useState<TipoMovimiento>(initial?.tipo ?? "Compra");
  const [campoId,    setCampoId]    = useState(initial?.campoId ?? (campos[0]?.id ?? ""));
  const [categoria,  setCategoria]  = useState<CategoriaHacienda>(initial?.categoria ?? "Vacas");
  const [cantidad,   setCantidad]   = useState(String(initial?.cantidad ?? ""));
  const [pesoTotal,  setPesoTotal]  = useState(String(initial?.pesoTotal ?? ""));
  const [precioTotal,setPrecioTotal]= useState(String(initial?.precioTotal ?? ""));
  const [destino,    setDestino]    = useState(initial?.destino ?? "");
  const [notas,      setNotas]      = useState(initial?.notas ?? "");

  const handleSubmit = () => {
    if (!campoId || !cantidad) return;
    onSave({
      id:          initial?.id ?? crypto.randomUUID(),
      fecha,
      tipo,
      campoId,
      categoria,
      cantidad:    parseInt(cantidad),
      pesoTotal:   pesoTotal ? parseFloat(pesoTotal) : undefined,
      precioTotal: precioTotal ? parseFloat(precioTotal) : undefined,
      destino:     destino.trim() || undefined,
      notas:       notas.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "#E8E5DE" }}>
          <h2 className="text-base font-semibold" style={{ color: "#1A1A1A" }}>{initial ? "Editar movimiento" : "Nuevo movimiento"}</h2>
          <button onClick={onClose} className="cursor-pointer hover:opacity-70"><X size={18} style={{ color: "#9B9488" }} /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <Field label="Fecha">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-field" />
          </Field>
          <Field label="Tipo *">
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimiento)} className="input-field">
              {TIPOS_MOVIMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Campo *">
            <select value={campoId} onChange={(e) => setCampoId(e.target.value)} className="input-field">
              {campos.length === 0
                ? <option value="">Sin campos</option>
                : campos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)
              }
            </select>
          </Field>
          <Field label="Categoría *">
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaHacienda)} className="input-field">
              {CATEGORIAS_HACIENDA.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Cantidad *">
            <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="input-field" placeholder="cabezas" min="0" />
          </Field>
          <Field label="Peso total (kg)">
            <input type="number" value={pesoTotal} onChange={(e) => setPesoTotal(e.target.value)} className="input-field" placeholder="opcional" min="0" />
          </Field>
          <div className="col-span-2">
            <Field label="Precio total (ARS)">
              <input type="number" value={precioTotal} onChange={(e) => setPrecioTotal(e.target.value)} className="input-field" placeholder="opcional" min="0" />
            </Field>
          </div>
          {tipo === "Transferencia" && (
            <div className="col-span-2">
              <Field label="Destino">
                <input value={destino} onChange={(e) => setDestino(e.target.value)} className="input-field" placeholder="Campo o establecimiento destino" />
              </Field>
            </div>
          )}
          <div className="col-span-2">
            <Field label="Notas">
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="input-field resize-none" rows={2} placeholder="Opcional" />
            </Field>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm border cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: "#D6D1C8", color: "#6B6560" }}>Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!campoId || !cantidad}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#3D7A1C" }}
          >
            {initial ? "Guardar cambios" : "Registrar movimiento"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Stock de Hacienda ───────────────────────────────────────────────────
function TabStock() {
  const { campos, stockHacienda, setStockHacienda } = useAppContext();

  const getCampoNombre = (id: string) => campos.find((c) => c.id === id)?.nombre ?? "—";

  const addRow = (campoId: string) => {
    const nuevo: StockPorCampo = {
      id:          crypto.randomUUID(),
      campoId,
      categoria:   "Vacas",
      cantidad:    0,
      pesoPromedio:0,
    };
    setStockHacienda((prev) => [...prev, nuevo]);
  };

  const updateRow = (id: string, field: keyof StockPorCampo, value: string | number) => {
    setStockHacienda((prev) =>
      prev.map((r) => r.id === id ? { ...r, [field]: value } : r)
    );
  };

  const deleteRow = (id: string) => {
    setStockHacienda((prev) => prev.filter((r) => r.id !== id));
  };

  const totalCabezas = stockHacienda.reduce((s, r) => s + r.cantidad, 0);
  const totalKg = stockHacienda.reduce((s, r) => s + r.cantidad * r.pesoPromedio, 0);

  if (campos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16" style={{ borderColor: "#D6D1C8", backgroundColor: "#FAFAF8" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EBF3E8" }}>
          <Beef size={22} style={{ color: "#3D7A1C" }} />
        </div>
        <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>Primero cargá campos en Gestión Agrícola</p>
        <p className="text-xs text-center max-w-xs" style={{ color: "#9B9488" }}>El stock se organiza por campo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {stockHacienda.length > 0 && (
        <div className="rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#C8E6C0" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>Total cabezas</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: "#3D7A1C" }}>{totalCabezas.toLocaleString("es-AR")}</p>
          </div>
          <div className="w-px h-8 self-center" style={{ backgroundColor: "#E8E5DE" }} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>Kilos totales</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: "#1A1A1A" }}>{(totalKg / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} tn</p>
          </div>
        </div>
      )}

      {/* Table per campo */}
      {campos.map((campo) => {
        const rows = stockHacienda.filter((r) => r.campoId === campo.id);
        return (
          <div key={campo.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F0EDE6", backgroundColor: "#FAFAF8" }}>
              <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{campo.nombre}</p>
              <button
                onClick={() => addRow(campo.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: "#D6D1C8", color: "#3D7A1C" }}
              >
                <Plus size={12} /> Agregar categoría
              </button>
            </div>
            {rows.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs" style={{ color: "#9B9488" }}>Sin stock cargado para este campo</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#FAFAF8" }}>
                    {["Categoría", "Cantidad", "Peso prom. (kg)", "Raza", "Boleto Cámara #", "Fecha boleto", ""].map((col) => (
                      <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid #F0EDE6" : undefined }}>
                      <td className="px-4 py-2">
                        <select
                          value={r.categoria}
                          onChange={(e) => updateRow(r.id, "categoria", e.target.value as CategoriaHacienda)}
                          className="input-field text-xs py-1"
                        >
                          {CATEGORIAS_HACIENDA.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={r.cantidad || ""}
                          onChange={(e) => updateRow(r.id, "cantidad", parseInt(e.target.value) || 0)}
                          className="input-field text-xs py-1 w-20"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={r.pesoPromedio || ""}
                          onChange={(e) => updateRow(r.id, "pesoPromedio", parseFloat(e.target.value) || 0)}
                          className="input-field text-xs py-1 w-20"
                          min="0"
                          step="0.1"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={r.raza ?? ""}
                          onChange={(e) => updateRow(r.id, "raza", e.target.value)}
                          className="input-field text-xs py-1 w-28"
                          placeholder="Opcional"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={r.boletoCamaraNro ?? ""}
                          onChange={(e) => updateRow(r.id, "boletoCamaraNro", e.target.value)}
                          className="input-field text-xs py-1 w-28"
                          placeholder="N° boleto"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={r.boletoCamaraFecha ?? ""}
                          onChange={(e) => updateRow(r.id, "boletoCamaraFecha", e.target.value)}
                          className="input-field text-xs py-1"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => deleteRow(r.id)} className="cursor-pointer hover:opacity-70 p-1"><Trash2 size={13} style={{ color: "#C0392B" }} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Movimientos ─────────────────────────────────────────────────────────
function TabMovimientos() {
  const { campos, movimientosHacienda, setMovimientosHacienda } = useAppContext();
  const [modal, setModal] = useState<{ open: boolean; editing?: MovimientoHacienda }>({ open: false });

  const getCampoNombre = (id: string) => campos.find((c) => c.id === id)?.nombre ?? "—";

  const sorted = [...movimientosHacienda].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const TIPO_COLORS: Record<TipoMovimiento, string> = {
    Compra:        "#1E7E34",
    Venta:         "#C0392B",
    Nacimiento:    "#3D7A1C",
    Muerte:        "#9B9488",
    Transferencia: "#D4AD3C",
  };

  const handleSave = (m: MovimientoHacienda) => {
    setMovimientosHacienda((prev) => {
      const idx = prev.findIndex((x) => x.id === m.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = m; return next; }
      return [...prev, m];
    });
    setModal({ open: false });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{movimientosHacienda.length} movimiento{movimientosHacienda.length !== 1 ? "s" : ""} registrado{movimientosHacienda.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90"
          style={{ backgroundColor: "#3D7A1C" }}
        >
          <Plus size={14} /> Nuevo movimiento
        </button>
      </div>

      {movimientosHacienda.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16" style={{ borderColor: "#D6D1C8", backgroundColor: "#FAFAF8" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EBF3E8" }}>
            <Beef size={22} style={{ color: "#3D7A1C" }} />
          </div>
          <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>Sin movimientos registrados</p>
          <p className="text-xs text-center max-w-xs" style={{ color: "#9B9488" }}>Registrá compras, ventas, nacimientos y demás movimientos</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#FAFAF8" }}>
                {["Fecha", "Tipo", "Campo", "Categoría", "Cantidad", "Peso (kg)", "Precio (ARS)", "Notas", ""].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#9B9488" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => (
                <tr key={m.id} style={{ borderTop: i > 0 ? "1px solid #F0EDE6" : undefined }}>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B6560" }}>{new Date(m.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: `${TIPO_COLORS[m.tipo]}18`, color: TIPO_COLORS[m.tipo] }}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: "#1A1A1A" }}>{getCampoNombre(m.campoId)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B6560" }}>{m.categoria}</td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: "#1A1A1A" }}>{m.cantidad.toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B6560" }}>{m.pesoTotal ? m.pesoTotal.toLocaleString("es-AR") : "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6B6560" }}>{m.precioTotal ? `$${m.precioTotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "—"}</td>
                  <td className="px-4 py-3 text-xs max-w-[120px] truncate" style={{ color: "#9B9488" }}>{m.notas ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setMovimientosHacienda((prev) => prev.filter((x) => x.id !== m.id))}
                      className="cursor-pointer hover:opacity-70 p-1"
                    >
                      <Trash2 size={13} style={{ color: "#C0392B" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <MovimientoModal initial={modal.editing} onSave={handleSave} onClose={() => setModal({ open: false })} />
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type Tab = "stock" | "movimientos";

export default function GanaderaClient() {
  const [tab, setTab] = useState<Tab>("stock");

  const tabs: { id: Tab; label: string }[] = [
    { id: "stock",       label: "Stock de Hacienda" },
    { id: "movimientos", label: "Movimientos" },
  ];

  return (
    <>
      <style>{`.input-field { width: 100%; border: 1px solid #D6D1C8; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #1A1A1A; background: #FAFAF8; outline: none; } .input-field:focus { border-color: #3D7A1C; background: #fff; }`}</style>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: "#E8E5DE" }}>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Gestión Ganadera</h1>
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Stock de hacienda y movimientos por campo</p>
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

            {tab === "stock"       && <TabStock />}
            {tab === "movimientos" && <TabMovimientos />}
          </main>
        </div>
      </div>
    </>
  );
}
