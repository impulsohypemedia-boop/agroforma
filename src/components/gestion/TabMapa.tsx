"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppContext } from "@/context/AppContext";
import {
  ArchivoPlano,
  PlanoAnalizado,
  LoteExtraido,
  AmbienteDetalle,
  CultivoDetectado,
  CULTIVOS_LISTA,
} from "@/types/gestion";
import type { MapMarker } from "./LeafletMap";
import {
  Upload,
  FileText,
  ImageIcon,
  FileSpreadsheet,
  Eye,
  Loader2,
  Sparkles,
  X,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── Dynamic Leaflet map (no SSR) ─────────────────────────────────────────────
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center" style={{ height: 400, backgroundColor: "#F5FAF3" }}>
      <Loader2 size={22} className="animate-spin" style={{ color: "#3D7A1C" }} />
    </div>
  ),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function inferTipo(file: File): ArchivoPlano["tipo"] {
  if (file.type.startsWith("image/")) return "imagen";
  if (file.type === "application/pdf") return "pdf";
  return "excel";
}

function FileIcon({ tipo, size = 16 }: { tipo: ArchivoPlano["tipo"]; size?: number }) {
  if (tipo === "pdf")    return <FileText size={size} style={{ color: "#C0392B" }} />;
  if (tipo === "imagen") return <ImageIcon size={size} style={{ color: "#3D7A1C" }} />;
  return <FileSpreadsheet size={size} style={{ color: "#1E7E34" }} />;
}

// ─── Robust coordinate parser ─────────────────────────────────────────────────
// Handles:
//   DMS:          35° 54' 38,14'' S, 63° 22' 15,30'' W
//   DMS compact:  35°54'38"S 63°22'15"W
//   Decimal:      -35.9106, -63.371
//   Decimal+card: 35.9106 S, 63.371 W
export function parseCoords(raw: string | null | undefined): [number, number] | null {
  if (!raw) return null;
  const s = raw.trim();

  // ── DMS: degrees° minutes' seconds'' CARDINAL ───────────────────────────
  // Accepts ° or º, ' or ′, '' or " or ″ or ′′, comma or period for decimals
  const dmsRe =
    /(\d{1,3})\s*[°º]\s*(\d{1,2})\s*[''′]\s*(\d{1,2}(?:[.,]\d+)?)\s*["""″''′]{1,2}\s*([NSns])[,;\s]+\s*(\d{1,3})\s*[°º]\s*(\d{1,2})\s*[''′]\s*(\d{1,2}(?:[.,]\d+)?)\s*["""″''′]{1,2}\s*([EWew])/;
  const dm = s.match(dmsRe);
  if (dm) {
    const toDec = (d: string, m: string, sec: string, dir: string) => {
      const val =
        parseFloat(d) +
        parseFloat(m) / 60 +
        parseFloat(sec.replace(",", ".")) / 3600;
      return dir.toUpperCase() === "S" || dir.toUpperCase() === "W" ? -val : val;
    };
    const lat = toDec(dm[1], dm[2], dm[3], dm[4]);
    const lng = toDec(dm[5], dm[6], dm[7], dm[8]);
    if (isValid(lat, lng)) return [lat, lng];
  }

  // ── Decimal ± with optional cardinal ────────────────────────────────────
  // e.g. "-35.9106, -63.371" or "35.9106 S 63.371 W"
  const decRe =
    /([-−]?\d{1,3}(?:[.,]\d+)?)\s*([NSns])?\s*[,;\s]\s*([-−]?\d{1,3}(?:[.,]\d+)?)\s*([EWew])?/;
  const dec = s.match(decRe);
  if (dec) {
    let lat = parseFloat(dec[1].replace(",", ".").replace("−", "-"));
    let lng = parseFloat(dec[3].replace(",", ".").replace("−", "-"));
    const latDir = dec[2]?.toUpperCase();
    const lngDir = dec[4]?.toUpperCase();
    if (latDir === "S") lat = -Math.abs(lat);
    if (latDir === "N") lat =  Math.abs(lat);
    if (lngDir === "W") lng = -Math.abs(lng);
    if (lngDir === "E") lng =  Math.abs(lng);
    if (isValid(lat, lng)) return [lat, lng];
  }

  return null;
}

function isValid(lat: number, lng: number) {
  return !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// ─── Ambiente bar colours ─────────────────────────────────────────────────────
const AMBIENTE_COLORS: Record<string, string> = {
  ">100":  "#1A5C0C",
  "76-100":"#3D7A1C",
  "51-75": "#D4AD3C",
  "26-50": "#E07B39",
  "<25":   "#C0392B",
};

function ambienteColor(tipo: string): string {
  for (const [k, v] of Object.entries(AMBIENTE_COLORS)) {
    if (tipo.includes(k)) return v;
  }
  return "#9B9488";
}

// ─── Vista previa panel ───────────────────────────────────────────────────────
function VistaPrevia({
  archivo, blob, onClose,
}: {
  archivo: ArchivoPlano;
  blob: File | undefined;
  onClose: () => void;
}) {
  const [xlsxRows, setXlsxRows] = useState<string[][]>([]);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  useEffect(() => {
    if (archivo.tipo !== "excel" || !blob) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];
      setXlsxRows(rows.slice(0, 20));
    };
    reader.readAsArrayBuffer(blob);
  }, [archivo, blob]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "#E8E5DE" }}>
          <div className="flex items-center gap-2">
            <FileIcon tipo={archivo.tipo} size={18} />
            <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{archivo.nombre}</span>
          </div>
          <button onClick={onClose} className="cursor-pointer hover:opacity-70">
            <X size={20} style={{ color: "#9B9488" }} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto p-2">
          {archivo.tipo === "pdf" && objectUrl && (
            <iframe src={objectUrl} className="w-full rounded-lg" style={{ height: "75vh" }} title={archivo.nombre} />
          )}
          {archivo.tipo === "imagen" && objectUrl && (
            <div className="flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={objectUrl} alt={archivo.nombre} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
            </div>
          )}
          {archivo.tipo === "excel" && (
            xlsxRows.length > 0 ? (
              <div className="overflow-auto rounded-lg border" style={{ borderColor: "#E8E5DE" }}>
                <table className="text-xs w-full">
                  <tbody>
                    {xlsxRows.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i === 0 ? "#F5FAF3" : i % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-1.5 border-r border-b whitespace-nowrap" style={{ borderColor: "#E8E5DE", fontWeight: i === 0 ? 600 : 400, color: "#1A1A1A" }}>
                            {String(cell ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-3 py-1 text-[10px]" style={{ color: "#9B9488" }}>Mostrando hasta 20 filas · hoja 1</p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm" style={{ color: "#9B9488" }}>Cargando vista previa...</p>
              </div>
            )
          )}
          {!objectUrl && archivo.tipo !== "excel" && (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm" style={{ color: "#9B9488" }}>El archivo ya no está disponible en esta sesión. Volvé a subirlo para visualizarlo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Datos extraídos panel ────────────────────────────────────────────────────
function DatosExtraidos({
  datos,
  onImportarCampo,
  onImportarPlanSiembra,
}: {
  datos: PlanoAnalizado;
  onImportarCampo: (datos: PlanoAnalizado) => void;
  onImportarPlanSiembra: (datos: PlanoAnalizado) => void;
}) {
  const [lotesOpen, setLotesOpen] = useState(true);
  const coords = parseCoords(datos.ubicacion?.coordenadas);

  return (
    <div className="space-y-4 mt-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onImportarCampo(datos)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer hover:opacity-90"
          style={{ backgroundColor: "#3D7A1C" }}
        >
          <CheckCircle2 size={12} /> Importar a Campos
        </button>
        {(datos.cultivos_detectados?.length ?? 0) > 0 && (
          <button
            onClick={() => onImportarPlanSiembra(datos)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer hover:bg-gray-50"
            style={{ borderColor: "#D6D1C8", color: "#3D7A1C" }}
          >
            <CheckCircle2 size={12} /> Importar a Plan de Siembra
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campo info */}
        <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "#E8E5DE", backgroundColor: "#FFFFFF" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9B9488" }}>Campo</p>
          <InfoRow label="Nombre"         value={datos.campo} />
          <InfoRow label="Propietario"    value={datos.propietario} />
          <InfoRow label="Localidad"      value={datos.ubicacion?.localidad} />
          <InfoRow label="Provincia"      value={datos.ubicacion?.provincia} />
          <InfoRow label="Coordenadas"    value={datos.ubicacion?.coordenadas} />
          <InfoRow label="Sup. total"     value={datos.superficie_total ? `${datos.superficie_total} ha` : null} />
          <InfoRow label="Sup. siembra"   value={datos.superficie_siembra ? `${datos.superficie_siembra} ha` : null} />
          <InfoRow label="Campaña"        value={datos.campaña} />
          {(datos.infraestructura?.length ?? 0) > 0 && (
            <InfoRow label="Infraestructura" value={datos.infraestructura.join(", ")} />
          )}
        </div>

        {/* Cultivos */}
        {(datos.cultivos_detectados?.length ?? 0) > 0 && (
          <div className="rounded-xl border p-4" style={{ borderColor: "#E8E5DE", backgroundColor: "#FFFFFF" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9B9488" }}>Cultivos detectados</p>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-1 font-semibold" style={{ color: "#9B9488" }}>Cultivo</th>
                  <th className="text-right py-1 font-semibold" style={{ color: "#9B9488" }}>Hectáreas</th>
                </tr>
              </thead>
              <tbody>
                {datos.cultivos_detectados.map((c: CultivoDetectado, i: number) => (
                  <tr key={i} style={{ borderTop: "1px solid #F0EDE6" }}>
                    <td className="py-2 font-medium" style={{ color: "#1A1A1A" }}>{c.cultivo}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: "#3D7A1C" }}>{c.hectareas?.toLocaleString("es-AR") ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ambientes */}
      {(datos.ambientes?.detalle?.length ?? 0) > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: "#E8E5DE", backgroundColor: "#FFFFFF" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9B9488" }}>Ambientes de suelo</p>
          {datos.ambientes.descripcion && (
            <p className="text-xs mb-3" style={{ color: "#6B6560" }}>{datos.ambientes.descripcion}</p>
          )}
          <div className="space-y-2">
            {datos.ambientes.detalle.map((a: AmbienteDetalle, i: number) => {
              const color = ambienteColor(a.tipo);
              const pct = Math.min(100, Math.max(0, a.porcentaje ?? 0));
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#1A1A1A" }}>{a.tipo}</span>
                    <span className="font-semibold" style={{ color }}>
                      {a.superficie_has ? `${a.superficie_has} ha · ` : ""}{pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F0EDE6" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lotes */}
      {(datos.lotes?.length ?? 0) > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE", backgroundColor: "#FFFFFF" }}>
          <button
            onClick={() => setLotesOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>
              Lotes ({datos.lotes.length})
            </p>
            {lotesOpen
              ? <ChevronDown size={14} style={{ color: "#9B9488" }} />
              : <ChevronRight size={14} style={{ color: "#9B9488" }} />
            }
          </button>
          {lotesOpen && (
            <div className="overflow-auto" style={{ maxHeight: 300 }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: "#FAFAF8" }}>
                    {["Lote", "Ha", "Cultivo", "Ambiente"].map((h) => (
                      <th key={h} className="text-left px-4 py-2 font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.lotes.map((l: LoteExtraido, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid #F0EDE6" }}>
                      <td className="px-4 py-2 font-medium" style={{ color: "#1A1A1A" }}>{l.nombre}</td>
                      <td className="px-4 py-2" style={{ color: "#6B6560" }}>{l.superficie_has ?? "—"}</td>
                      <td className="px-4 py-2" style={{ color: "#6B6560" }}>{l.cultivo ?? "—"}</td>
                      <td className="px-4 py-2 max-w-[200px] truncate" style={{ color: "#9B9488" }}>{l.ambiente ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Per-plano mini map */}
      {coords ? (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E8E5DE", height: 400 }}>
          <LeafletMap markers={[{ lat: coords[0], lng: coords[1], label: datos.campo ?? "Campo" }]} />
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-xs" style={{ borderColor: "#E8E5DE", color: "#9B9488", backgroundColor: "#FAFAF8" }}>
          <MapPin size={13} />
          Sin coordenadas disponibles en este plano — el mapa de todos los campos aparece más abajo
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span style={{ color: "#9B9488" }}>{label}</span>
      <span className="font-medium text-right" style={{ color: "#1A1A1A" }}>{String(value)}</span>
    </div>
  );
}

// ─── Main TabMapa ─────────────────────────────────────────────────────────────
export default function TabMapa() {
  const {
    archivosPlanos, setArchivosPlanos,
    planoBlobMap, setPlanoBlobMap,
    campos, setCampos,
    planSiembra, setPlanSiembra,
    campanaActual,
  } = useAppContext();

  const [dragging,     setDragging]     = useState(false);
  const [previewing,   setPreviewing]   = useState<string | null>(null);
  const [analyzing,    setAnalyzing]    = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ".pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.csv";

  // ── All campos with parseable coordinates → map markers ──────────────────
  const camposMarkers: MapMarker[] = campos
    .map((c) => {
      const coords = parseCoords(c.coordenadas);
      if (!coords) return null;
      return { lat: coords[0], lng: coords[1], label: `${c.nombre} (${c.hectareas} ha)` };
    })
    .filter((m): m is MapMarker => m !== null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const nuevos: ArchivoPlano[] = [];
    const blobUpdates: Record<string, File> = {};
    for (const f of arr) {
      const id = crypto.randomUUID();
      nuevos.push({
        id,
        nombre:      f.name,
        tipo:        inferTipo(f),
        tamano:      f.size,
        fechaSubida: new Date().toISOString(),
        analizado:   false,
        datos:       null,
      });
      blobUpdates[id] = f;
    }
    setArchivosPlanos((prev) => [...prev, ...nuevos]);
    setPlanoBlobMap((prev) => ({ ...prev, ...blobUpdates }));
  }, [setArchivosPlanos, setPlanoBlobMap]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleAnalizar = async (archivo: ArchivoPlano) => {
    const blob = planoBlobMap[archivo.id];
    if (!blob) {
      setAnalyzeError("El archivo no está disponible en esta sesión. Volvé a subirlo.");
      return;
    }
    setAnalyzing(archivo.id);
    setAnalyzeError(null);
    try {
      const fd = new FormData();
      fd.append("file", blob);
      const res = await fetch("/api/gestion/analizar-plano", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
      setArchivosPlanos((prev) =>
        prev.map((a) => a.id === archivo.id ? { ...a, analizado: true, datos: body.data } : a)
      );
      setExpanded(archivo.id);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Error al analizar");
    } finally {
      setAnalyzing(null);
    }
  };

  const handleImportarCampo = (datos: PlanoAnalizado) => {
    if (!datos.campo) return;
    const nuevo = {
      id:          crypto.randomUUID(),
      nombre:      datos.campo,
      provincia:   datos.ubicacion?.provincia ?? "",
      hectareas:   datos.superficie_total ?? 0,
      propietario: datos.propietario ?? undefined,
      coordenadas: datos.ubicacion?.coordenadas ?? undefined,
      notas:       undefined,
    };
    setCampos((prev) => [...prev, nuevo]);
    alert(`Campo "${datos.campo}" importado correctamente.`);
  };

  const handleImportarPlanSiembra = (datos: PlanoAnalizado) => {
    if (!datos.campo) return;
    const campoExistente = campos.find(
      (c) => c.nombre.toLowerCase().trim() === (datos.campo ?? "").toLowerCase().trim()
    );
    if (!campoExistente) {
      alert(`Primero importá el campo "${datos.campo}" en la solapa Campos.`);
      return;
    }
    const nuevosLotes = (datos.cultivos_detectados ?? []).map((cd) => {
      const cultivoNorm =
        CULTIVOS_LISTA.find((cl) =>
          cl.toLowerCase().includes((cd.cultivo ?? "").toLowerCase().split(" ")[0])
        ) ?? "Otros";
      return {
        id:                  crypto.randomUUID(),
        campoId:             campoExistente.id,
        cultivo:             cultivoNorm,
        hectareas:           cd.hectareas ?? 0,
        rendimientoEsperado: 0,
        precioEsperado:      0,
        costosDirectos:      0,
        campana:             datos.campaña ?? campanaActual,
        notas:               `Importado de plano: ${datos.fuente ?? "—"}`,
      };
    });
    setPlanSiembra((prev) => [...prev, ...nuevosLotes]);
    alert(`${nuevosLotes.length} lote(s) importado(s) al Plan de Siembra.`);
  };

  const previewingArchivo = archivosPlanos.find((a) => a.id === previewing);

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {analyzeError && (
        <div
          className="flex items-center justify-between rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEE9E9", color: "#C0392B", border: "1px solid #FBCFCF" }}
        >
          <span>{analyzeError}</span>
          <button onClick={() => setAnalyzeError(null)} className="ml-4 font-bold text-lg leading-none cursor-pointer hover:opacity-70">×</button>
        </div>
      )}

      {/* ── Drop zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-colors"
        style={{
          borderColor:     dragging ? "#3D7A1C" : "#D6D1C8",
          backgroundColor: dragging ? "#F5FAF3" : "#FAFAF8",
        }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EBF3E8" }}>
          <Upload size={22} style={{ color: "#3D7A1C" }} />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>
            Subí planos, mapas o archivos de tus campos
          </p>
          <p className="text-xs mt-1" style={{ color: "#9B9488" }}>
            Formatos soportados: PDF, Excel, imágenes (JPG, PNG) · arrastrá o hacé click
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#C8C3BB" }}>
            Soporte para archivos GIS (Shapefile, KML, GeoJSON) próximamente
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
        />
      </div>

      {/* ── Mapa de todos los campos ── */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E8E5DE" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#F0EDE6", backgroundColor: "#FAFAF8" }}>
          <div className="flex items-center gap-2">
            <MapPin size={14} style={{ color: "#3D7A1C" }} />
            <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
              Mapa de campos
            </p>
          </div>
          <span className="text-xs" style={{ color: "#9B9488" }}>
            {camposMarkers.length} campo{camposMarkers.length !== 1 ? "s" : ""} con coordenadas
          </span>
        </div>

        {camposMarkers.length > 0 ? (
          <div style={{ height: 420 }}>
            <LeafletMap markers={camposMarkers} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-14" style={{ backgroundColor: "#FAFAF8" }}>
            <MapPin size={28} style={{ color: "#D6D1C8" }} />
            <p className="text-sm font-medium" style={{ color: "#9B9488" }}>Sin coordenadas disponibles</p>
            <p className="text-xs text-center max-w-xs" style={{ color: "#C8C3BB" }}>
              Subí un plano con ubicación y usá "Analizar con IA" → "Importar a Campos" para ver los campos en el mapa
            </p>
          </div>
        )}
      </div>

      {/* ── File list ── */}
      {archivosPlanos.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>
            Archivos subidos ({archivosPlanos.length})
          </p>
          {archivosPlanos.map((archivo) => (
            <div key={archivo.id}>
              <div
                className="bg-white rounded-xl border overflow-hidden"
                style={{ borderColor: expanded === archivo.id ? "#3D7A1C" : "#E8E5DE" }}
              >
                {/* File row */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="shrink-0">
                    <FileIcon tipo={archivo.tipo} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{archivo.nombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
                      {archivo.tipo.toUpperCase()} · {formatBytes(archivo.tamano)} ·{" "}
                      {new Date(archivo.fechaSubida).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      {archivo.analizado && (
                        <span className="ml-2 inline-flex items-center gap-1 font-semibold" style={{ color: "#3D7A1C" }}>
                          <CheckCircle2 size={10} /> Analizado
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Ver */}
                    <button
                      onClick={() => setPreviewing(archivo.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "#D6D1C8", color: "#1A1A1A" }}
                    >
                      <Eye size={12} /> Ver
                    </button>

                    {/* Analizar / Ver datos */}
                    {!archivo.analizado ? (
                      <button
                        onClick={() => handleAnalizar(archivo)}
                        disabled={analyzing === archivo.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#3D7A1C" }}
                      >
                        {analyzing === archivo.id ? (
                          <><Loader2 size={12} className="animate-spin" /> Analizando...</>
                        ) : (
                          <><Sparkles size={12} /> Analizar con IA</>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setExpanded((v) => v === archivo.id ? null : archivo.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer hover:bg-gray-50 transition-colors"
                        style={{ borderColor: "#C8E6C0", color: "#3D7A1C" }}
                      >
                        <Sparkles size={12} />
                        {expanded === archivo.id ? "Ocultar datos" : "Ver datos extraídos"}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => {
                        setArchivosPlanos((prev) => prev.filter((a) => a.id !== archivo.id));
                        setPlanoBlobMap((prev) => { const n = { ...prev }; delete n[archivo.id]; return n; });
                        if (expanded === archivo.id) setExpanded(null);
                      }}
                      className="cursor-pointer hover:opacity-70 p-1.5"
                    >
                      <X size={14} style={{ color: "#9B9488" }} />
                    </button>
                  </div>
                </div>

                {/* Datos extraídos expandido */}
                {expanded === archivo.id && archivo.datos && (
                  <div className="px-5 pb-5 border-t" style={{ borderColor: "#F0EDE6" }}>
                    <DatosExtraidos
                      datos={archivo.datos}
                      onImportarCampo={handleImportarCampo}
                      onImportarPlanSiembra={handleImportarPlanSiembra}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewing && previewingArchivo && (
        <VistaPrevia
          archivo={previewingArchivo}
          blob={planoBlobMap[previewing]}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}
