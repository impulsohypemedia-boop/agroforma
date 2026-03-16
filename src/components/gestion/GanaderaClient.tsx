"use client";

import { useState, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";
import {
  StockPorCampo,
  CategoriaHacienda,
  CATEGORIAS_HACIENDA,
} from "@/types/gestion";
import { Plus, Trash2, X, Beef, Upload, Loader2, Bell } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";

// ─── Manual Add Modal ─────────────────────────────────────────────────────────
function ManualModal({
  onSave,
  onClose,
}: {
  onSave: (item: StockPorCampo) => void;
  onClose: () => void;
}) {
  const { campos } = useAppContext();
  const defaultCampoId = campos[0]?.id ?? "general";

  const [categoria,      setCategoria]      = useState<CategoriaHacienda>("Vacas");
  const [cantidad,       setCantidad]       = useState("");
  const [pesoPromedio,   setPesoPromedio]   = useState("");
  const [raza,           setRaza]           = useState("");
  const [boletoCamara,   setBoletoCamara]   = useState("");
  const [campoId,        setCampoId]        = useState(defaultCampoId);

  const handleSubmit = () => {
    if (!cantidad) return;
    onSave({
      id:             crypto.randomUUID(),
      campoId,
      categoria,
      cantidad:       parseInt(cantidad) || 0,
      pesoPromedio:   parseFloat(pesoPromedio) || 0,
      raza:           raza.trim() || undefined,
      boletoCamaraNro: boletoCamara.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "#E8E5DE" }}>
          <h2 className="text-base font-semibold" style={{ color: "#1A1A1A" }}>Agregar categoría de hacienda</h2>
          <button onClick={onClose} className="cursor-pointer hover:opacity-70"><X size={18} style={{ color: "#9B9488" }} /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          {campos.length > 0 && (
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6560" }}>Campo</label>
              <select value={campoId} onChange={(e) => setCampoId(e.target.value)} className="input-field">
                <option value="general">Sin campo asignado</option>
                {campos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6560" }}>Categoría *</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaHacienda)} className="input-field">
              {CATEGORIAS_HACIENDA.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6560" }}>Cantidad (cabezas) *</label>
            <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="input-field" placeholder="0" min="0" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6560" }}>Peso promedio (kg)</label>
            <input type="number" value={pesoPromedio} onChange={(e) => setPesoPromedio(e.target.value)} className="input-field" placeholder="opcional" min="0" step="0.1" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6560" }}>Raza</label>
            <input value={raza} onChange={(e) => setRaza(e.target.value)} className="input-field" placeholder="opcional" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6560" }}>N° Boleto de Marca</label>
            <input value={boletoCamara} onChange={(e) => setBoletoCamara(e.target.value)} className="input-field" placeholder="opcional" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm border cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: "#D6D1C8", color: "#6B6560" }}>
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!cantidad}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#3D7A1C" }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GanaderaClient() {
  const { campos, stockHacienda, setStockHacienda, empresaActivaId } = useAppContext();

  const [dragging,      setDragging]      = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [uploadError,   setUploadError]   = useState<string | null>(null);
  const [showManual,    setShowManual]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Inline editing ────────────────────────────────────────────────────────
  const updateRow = (id: string, field: keyof StockPorCampo, value: string | number) => {
    setStockHacienda((prev) =>
      prev.map((r) => r.id === id ? { ...r, [field]: value } : r)
    );
  };

  const deleteRow = (id: string) => {
    setStockHacienda((prev) => prev.filter((r) => r.id !== id));
  };

  const addManual = (item: StockPorCampo) => {
    setStockHacienda((prev) => [...prev, item]);
    setShowManual(false);
  };

  // ── Upload handler ─────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".pdf")) {
      setUploadError("Formato no soportado. Usá Excel (.xlsx, .xls) o PDF.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      // Upload to Supabase Storage first
      const eId = empresaActivaId ?? "sin-empresa";
      const { signedUrl } = await uploadFile(eId, file);

      const res = await fetch("/api/gestion/analizar-hacienda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, url: signedUrl }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);

      // Map AI response to StockPorCampo[]
      // Use first campo's id if available, else "general"
      const defaultCampoId = campos[0]?.id ?? "general";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nuevos: StockPorCampo[] = (body.data?.categorias ?? []).map((cat: any) => {
        // Map AI categoria names to valid CategoriaHacienda values
        const catMap: Record<string, CategoriaHacienda> = {
          "Vacas":          "Vacas",
          "Vacas Preñadas": "Vacas",
          "Vaquillonas":    "Vaquillonas",
          "Novillos":       "Novillos",
          "Novillitos":     "Novillitos",
          "Toros":          "Toros",
          "Terneros":       "Terneros/as",
          "Terneras":       "Terneros/as",
          "Bueyes":         "Bueyes",
          "Otro":           "Otro",
        };
        const categoria: CategoriaHacienda = catMap[cat.categoria] ?? "Otro";
        const cantidad = (cat.cabezas_propias ?? 0) + (cat.cabezas_terceros ?? 0);
        return {
          id:             crypto.randomUUID(),
          campoId:        defaultCampoId,
          categoria,
          cantidad,
          pesoPromedio:   cat.peso_promedio ?? 0,
          raza:           cat.raza ?? undefined,
          boletoCamaraNro: cat.boleto_camara ?? undefined,
        } satisfies StockPorCampo;
      });

      setStockHacienda((prev) => [...prev, ...nuevos]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al analizar el archivo");
    } finally {
      setUploading(false);
    }
  }, [campos, setStockHacienda]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalCabezas = stockHacienda.reduce((s, r) => s + r.cantidad, 0);
  const totalKg      = stockHacienda.reduce((s, r) => s + r.cantidad * (r.pesoPromedio ?? 0), 0);
  const categoriaCount = new Set(stockHacienda.map((r) => r.categoria)).size;

  return (
    <>
      <style>{`.input-field { width: 100%; border: 1px solid #D6D1C8; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #1A1A1A; background: #FAFAF8; outline: none; } .input-field:focus { border-color: #3D7A1C; background: #fff; }`}</style>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: "#E8E5DE" }}>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Gestión Ganadera</h1>
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Stock de hacienda — cargá tu planilla o ingresá manualmente</p>
            </div>
          </header>

          <main className="px-8 py-7 max-w-5xl space-y-6">
            {/* Error banner */}
            {uploadError && (
              <div
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: "#FEE9E9", color: "#C0392B", border: "1px solid #FBCFCF" }}
              >
                <span>{uploadError}</span>
                <button onClick={() => setUploadError(null)} className="ml-4 font-bold text-lg leading-none cursor-pointer hover:opacity-70">×</button>
              </div>
            )}

            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors"
              style={{
                borderColor:     dragging ? "#3D7A1C" : "#D6D1C8",
                backgroundColor: dragging ? "#F5FAF3" : "#FAFAF8",
                cursor:          uploading ? "not-allowed" : "pointer",
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EBF3E8" }}>
                {uploading
                  ? <Loader2 size={22} className="animate-spin" style={{ color: "#3D7A1C" }} />
                  : <Upload size={22} style={{ color: "#3D7A1C" }} />
                }
              </div>
              <div className="text-center">
                <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>
                  {uploading ? "Analizando planilla…" : "Subí tu planilla de hacienda (Excel, PDF)"}
                </p>
                {!uploading && (
                  <p className="text-xs mt-1" style={{ color: "#9B9488" }}>
                    Formatos aceptados: .xlsx, .xls, .pdf · arrastrá o hacé click
                  </p>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.pdf"
                className="hidden"
                onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
              />
            </div>

            {/* Stock table */}
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F0EDE6", backgroundColor: "#F5FAF3" }}>
                <div className="flex items-center gap-3">
                  <Beef size={16} style={{ color: "#3D7A1C" }} />
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Stock de Hacienda</p>
                  {stockHacienda.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}>
                      {stockHacienda.length}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: totalCabezas > 0 ? "#EBF3E8" : "#F0EDE6", color: totalCabezas > 0 ? "#3D7A1C" : "#9B9488" }}>
                    <Bell size={10} /> {totalCabezas.toLocaleString("es-AR")} cab.
                  </span>
                </div>
                <button
                  onClick={() => setShowManual(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#D6D1C8", color: "#3D7A1C" }}
                >
                  <Plus size={12} /> Agregar categoría
                </button>
              </div>

              {stockHacienda.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EBF3E8" }}>
                    <Beef size={26} style={{ color: "#3D7A1C" }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>Sin stock cargado</p>
                    <p className="text-xs mt-1 max-w-xs" style={{ color: "#9B9488" }}>
                      Subí una planilla Excel o PDF para que la IA extraiga el inventario automáticamente, o cargalo de forma manual.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: "#3D7A1C" }}
                    >
                      <Upload size={14} /> Subir planilla
                    </button>
                    <button
                      onClick={() => setShowManual(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "#D6D1C8", color: "#6B6560" }}
                    >
                      <Plus size={14} /> Cargar stock manual
                    </button>
                  </div>
                </div>
              ) : (
                /* Stock rows */
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#FAFAF8" }}>
                      {["Categoría", "Cabezas", "Peso prom. (kg)", "Raza", "Boleto de Marca", ""].map((col) => (
                        <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stockHacienda.map((r, i) => (
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
                          <button onClick={() => deleteRow(r.id)} className="cursor-pointer hover:opacity-70 p-1">
                            <Trash2 size={13} style={{ color: "#C0392B" }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Summary bar */}
              {stockHacienda.length > 0 && (
                <div
                  className="flex items-center gap-6 px-5 py-3 border-t text-xs"
                  style={{ borderColor: "#F0EDE6", backgroundColor: "#FAFAF8", color: "#6B6560" }}
                >
                  <span><strong style={{ color: "#1A1A1A" }}>{categoriaCount}</strong> categoría{categoriaCount !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span><strong style={{ color: "#1A1A1A" }}>{totalCabezas.toLocaleString("es-AR")}</strong> cabezas totales</span>
                  <span>·</span>
                  <span><strong style={{ color: "#1A1A1A" }}>{(totalKg / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}</strong> tn estimadas</span>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {showManual && (
        <ManualModal onSave={addManual} onClose={() => setShowManual(false)} />
      )}
    </>
  );
}
