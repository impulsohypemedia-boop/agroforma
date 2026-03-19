"use client";

import { useState } from "react";
import {
  Scale, TrendingUp, BarChart2, GitBranch, Target,
  Calendar, Map, Building2, Loader2, LucideIcon, FileText, Lock,
  ChevronDown, ChevronRight, CheckCircle2, XCircle, X, Upload as UploadIcon, History, RefreshCw,
  DollarSign, ArrowLeftRight, PieChart, LayoutDashboard, ClipboardCheck,
} from "lucide-react";
import { AnalysisResult, ReportePosible } from "@/types/analysis";
import { GeneratedReport } from "@/types/report";

// ─── Icon map ─────────────────────────────────────────────────────────────────
const REPORT_ICONS: Record<string, LucideIcon> = {
  situacion_patrimonial:  Scale,
  margen_bruto:           TrendingUp,
  ratios:                 BarChart2,
  bridge:                 GitBranch,
  break_even:             Target,
  proyeccion:             Calendar,
  ranking_campos:         Map,
  calificacion_bancaria:  Building2,
  evolucion_historica:    History,
  ebitda:                 DollarSign,
  real_vs_presupuesto:    ArrowLeftRight,
  resultado_unidad_negocio: PieChart,
  dashboard_mensual:      LayoutDashboard,
  seguimiento_campana:    ClipboardCheck,
};

// ─── Implemented report IDs ───────────────────────────────────────────────────
const IMPLEMENTED = new Set([
  "situacion_patrimonial", "margen_bruto", "ratios",
  "bridge", "break_even", "calificacion_bancaria", "evolucion_historica",
  "ebitda", "real_vs_presupuesto", "resultado_unidad_negocio",
  "dashboard_mensual", "seguimiento_campana",
]);

// ─── Report descriptions (what it IS, not what's needed) ─────────────────────
const REPORT_DESCRIPTIONS: Record<string, string> = {
  situacion_patrimonial:  "Balance de activos, pasivos y patrimonio neto con comparativo entre ejercicios",
  margen_bruto:           "Análisis de rentabilidad por cultivo con ingresos, costos y margen neto",
  ratios:                 "Indicadores clave de rentabilidad, liquidez, endeudamiento y solvencia",
  bridge:                 "Descomposición detallada de la variación del resultado entre dos ejercicios",
  break_even:             "Punto de equilibrio por cultivo con tabla de sensibilidad precio × rinde",
  proyeccion:             "Estimación de resultados futuros por cultivo con análisis de escenarios",
  ranking_campos:         "Productividad por campo ordenada por rendimiento para optimizar decisiones",
  calificacion_bancaria:  "Formulario unificado de calificación para presentación ante entidades bancarias",
  evolucion_historica:    "Análisis de evolución de resultados, patrimonio y ratios a lo largo de múltiples ejercicios",
  ebitda:                 "Resultado operativo antes de impuestos, amortizaciones y financiación",
  real_vs_presupuesto:    "Comparación de resultados reales contra el presupuesto de campaña",
  resultado_unidad_negocio: "Resultado segregado por actividad: agricultura, ganadería, servicios",
  dashboard_mensual:      "Tablero mensual con ingresos, egresos y resultado acumulado",
  seguimiento_campana:    "Avance de siembra y cosecha vs plan, por lote y cultivo",
};

// ─── Hints for available reports ──────────────────────────────────────────────
const REPORT_HINTS: Record<string, string> = {
  situacion_patrimonial:  "Subí más balances para ver evolución histórica",
  margen_bruto:           "Sumá plan de siembra para ver margen por campo",
  ratios:                 "Con más ejercicios se calculan tendencias",
  bridge:                 "Disponible entre cualquier par de ejercicios",
  break_even:             "Necesita plan de siembra con costos por cultivo",
  calificacion_bancaria:  "Sumá datos de campos y hacienda para completar",
  evolucion_historica:    "Disponible con 2 o más balances de la misma empresa",
  ebitda:                 "Se calcula automáticamente desde el balance",
  real_vs_presupuesto:    "Necesita balance + presupuesto de campaña",
  resultado_unidad_negocio: "Mejor con balance que tenga apertura por actividad",
  dashboard_mensual:      "Se estima con estacionalidad típica del agro",
  seguimiento_campana:    "Necesita plan de siembra con datos de avance",
};

// ─── Partial report warnings (available but could be more complete) ──────────
// key = report id, value = { missingTipos: tipos that if absent trigger warning, message: warning text }
const PARTIAL_WARNINGS: Record<string, { missingTipos: string[]; message: string }[]> = {
  margen_bruto: [
    { missingTipos: ["plan_siembra"], message: "Sin plan de siembra, el margen se estima solo con datos del balance" },
  ],
  break_even: [
    { missingTipos: ["plan_siembra"], message: "Sin plan de siembra, los costos directos se estiman desde el balance" },
  ],
  calificacion_bancaria: [
    { missingTipos: ["planilla_stock"], message: "Sin datos de hacienda/maquinaria, el formulario queda incompleto" },
  ],
  resultado_unidad_negocio: [
    { missingTipos: ["plan_siembra"], message: "Sin apertura por actividad, se estima desde el estado de resultados" },
  ],
  dashboard_mensual: [
    { missingTipos: ["extracto_bancario"], message: "Sin extractos bancarios, la mensualización es estimada" },
  ],
};

function getPartialWarning(reportId: string, detectedTipos: string[]): string | null {
  const warnings = PARTIAL_WARNINGS[reportId];
  if (!warnings) return null;
  for (const w of warnings) {
    const allMissing = w.missingTipos.every(t => !detectedTipos.includes(t));
    if (allMissing) return w.message;
  }
  return null;
}

// ─── Required docs per unavailable report ────────────────────────────────────
const REQUIRED_DOCS: Record<string, { label: string; tipos: string[] }[]> = {
  proyeccion: [
    { label: "Plan de siembra con hectáreas, cultivos y rindes estimados", tipos: ["plan_siembra"] },
    { label: "Balance o estado de resultados", tipos: ["balance"] },
  ],
  ranking_campos: [
    { label: "Planilla de producción detallada por campo o potrero", tipos: ["planilla_stock", "plan_siembra"] },
    { label: "Balance o estado de resultados", tipos: ["balance"] },
  ],
  real_vs_presupuesto: [
    { label: "Balance o estado de resultados (datos reales)", tipos: ["balance"] },
    { label: "Presupuesto de campaña (datos proyectados)", tipos: ["otro", "plan_siembra"] },
  ],
  seguimiento_campana: [
    { label: "Plan de siembra con hectáreas y cultivos", tipos: ["plan_siembra"] },
  ],
};

// ─── Required docs modal ──────────────────────────────────────────────────────
function RequiredDocsModal({
  reporte,
  detectedTipos,
  onClose,
  onUpload,
}: {
  reporte: ReportePosible;
  detectedTipos: string[];
  onClose: () => void;
  onUpload: () => void;
}) {
  const required = REQUIRED_DOCS[reporte.id] ?? [];
  const description = REPORT_DESCRIPTIONS[reporte.id] ?? reporte.descripcion;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "#F0EDE6" }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <X size={16} style={{ color: "#9B9488" }} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#F0EDE6" }}
            >
              <Lock size={16} style={{ color: "#B0A99F" }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#9B9488" }}>
                Documentación necesaria
              </p>
              <h3 className="font-semibold text-base" style={{ color: "#1A1A1A" }}>
                {reporte.nombre}
              </h3>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#6B6560" }}>
            {description}
          </p>
        </div>

        {/* Docs list */}
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9B9488" }}>
            Documentos requeridos
          </p>
          {required.length === 0 ? (
            <p className="text-sm" style={{ color: "#9B9488" }}>
              {reporte.motivo}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {required.map((doc) => {
                const have = doc.tipos.some((t) => detectedTipos.includes(t));
                return (
                  <li key={doc.label} className="flex items-start gap-3">
                    {have
                      ? <CheckCircle2 size={17} className="shrink-0 mt-0.5" style={{ color: "#3D7A1C" }} />
                      : <XCircle      size={17} className="shrink-0 mt-0.5" style={{ color: "#C0392B" }} />
                    }
                    <span
                      className="text-sm leading-snug"
                      style={{ color: have ? "#3D7A1C" : "#1A1A1A" }}
                    >
                      {doc.label}
                      {have && (
                        <span
                          className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}
                        >
                          Disponible
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border cursor-pointer transition-colors hover:bg-gray-50"
            style={{ borderColor: "#D6D1C8", color: "#6B6560" }}
          >
            Cerrar
          </button>
          <button
            onClick={() => { onUpload(); onClose(); }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#3D7A1C" }}
          >
            <UploadIcon size={14} />
            Subir documentación
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Available report card ────────────────────────────────────────────────────
function AvailableReportCard({
  reporte,
  isGenerating,
  isAnyBusy,
  isSelected,
  canGenerate,
  latestReport,
  detectedTipos,
  onToggle,
  onGenerate,
  onUpload,
  onViewReport,
}: {
  reporte: ReportePosible;
  isGenerating: boolean;
  isAnyBusy: boolean;
  isSelected: boolean;
  canGenerate: boolean;
  latestReport: GeneratedReport | null;
  detectedTipos: string[];
  onToggle: () => void;
  onGenerate: () => void;
  onUpload: () => void;
  onViewReport: (r: GeneratedReport) => void;
}) {
  const Icon = REPORT_ICONS[reporte.id] ?? FileText;
  const implemented = IMPLEMENTED.has(reporte.id);
  const hasGenerated = latestReport !== null;

  // Button state
  let btnContent: React.ReactNode;
  let btnStyle: React.CSSProperties = {};
  let btnAction: (() => void) | undefined;
  let btnDisabled = false;

  if (isGenerating) {
    btnContent = <><Loader2 size={13} className="animate-spin" />Generando…</>;
    btnStyle = { borderColor: "#3D7A1C", color: "#3D7A1C", backgroundColor: "#EBF3E8", cursor: "wait" };
    btnDisabled = true;
  } else if (!implemented) {
    btnContent = "Próximamente";
    btnStyle = { borderColor: "#D6D1C8", color: "#B8922A", backgroundColor: "#FEF3CD", cursor: "default" };
    btnDisabled = true;
  } else if (!hasGenerated && !canGenerate) {
    btnContent = <><UploadIcon size={13} />Subir documentos</>;
    btnStyle = { borderColor: "#D6D1C8", color: "#6B6560", backgroundColor: "#F9F8F4", cursor: "pointer" };
    btnAction = onUpload;
  } else if (!hasGenerated) {
    btnContent = "Generar";
    btnStyle = { borderColor: "#3D7A1C", color: "#FFFFFF", backgroundColor: "#3D7A1C", cursor: isAnyBusy ? "not-allowed" : "pointer" };
    btnAction = isAnyBusy ? undefined : onGenerate;
    btnDisabled = isAnyBusy;
  }
  // hasGenerated buttons are rendered inline below

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 border transition-shadow"
      style={{ borderColor: isSelected ? "#3D7A1C" : "#C8E6C0", backgroundColor: "#FFFFFF",
               boxShadow: isSelected ? "0 0 0 2px #C8E6C0" : undefined }}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Checkbox + Icon */}
        <div className="flex items-center gap-2">
          {implemented && canGenerate && !hasGenerated && (
            <button
              onClick={onToggle}
              className="shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors"
              style={{
                borderColor: isSelected ? "#3D7A1C" : "#C8E6C0",
                backgroundColor: isSelected ? "#3D7A1C" : "#FFFFFF",
              }}
            >
              {isSelected && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#EBF3E8" }}
          >
            <Icon size={18} style={{ color: "#3D7A1C" }} />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hasGenerated && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}
            >
              Generado
            </span>
          )}
          {!hasGenerated && implemented && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}
            >
              Disponible
            </span>
          )}
          {!implemented && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#FEF3CD", color: "#B8922A" }}
            >
              Próximamente
            </span>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-sm mb-1" style={{ color: "#1A1A1A" }}>
          {reporte.nombre}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: "#9B9488" }}>
          {REPORT_DESCRIPTIONS[reporte.id] ?? reporte.descripcion}
        </p>
      </div>

      {hasGenerated && !isGenerating ? (
        <div className="mt-1 flex flex-col gap-1.5">
          <button
            onClick={() => onViewReport(latestReport!)}
            className="w-full py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-50"
            style={{ borderColor: "#3D7A1C", color: "#3D7A1C", backgroundColor: "#FFFFFF" }}
          >
            Ver reporte
          </button>
          {canGenerate && (
            <button
              onClick={isAnyBusy ? undefined : onGenerate}
              disabled={isAnyBusy}
              className="w-full py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: "#9B9488" }}
            >
              <RefreshCw size={11} />
              Regenerar
            </button>
          )}
        </div>
      ) : (
        <button
          disabled={btnDisabled}
          onClick={btnAction}
          className="mt-1 w-full py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5"
          style={btnStyle}
          onMouseEnter={(e) => {
            if (!btnDisabled && canGenerate && btnAction) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2F6016";
            }
          }}
          onMouseLeave={(e) => {
            if (!btnDisabled && canGenerate && btnAction) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3D7A1C";
            }
          }}
        >
          {btnContent}
        </button>
      )}
      {REPORT_HINTS[reporte.id] && !hasGenerated && (
        <p style={{ fontSize: 10, color: "#B0A99F", lineHeight: 1.4, marginTop: 2, display: "flex", gap: 4, alignItems: "flex-start" }}>
          <span style={{ flexShrink: 0, marginTop: 0.5 }}>💡</span>
          {REPORT_HINTS[reporte.id]}
        </p>
      )}
      {(() => {
        const warning = getPartialWarning(reporte.id, detectedTipos);
        if (!warning) return null;
        return (
          <div
            className="rounded-lg px-3 py-2 flex items-start gap-2"
            style={{ backgroundColor: "#FFF8E7", border: "1px solid #F0E6C8", marginTop: 2 }}
          >
            <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <p style={{ fontSize: 10, color: "#8B7A3E", lineHeight: 1.4, margin: 0 }}>
              {warning}
              {hasGenerated && <span className="font-semibold"> · Reporte parcial</span>}
            </p>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Unavailable report card ──────────────────────────────────────────────────
function UnavailableReportCard({
  reporte,
  detectedTipos,
  onUpload,
}: {
  reporte: ReportePosible;
  detectedTipos: string[];
  onUpload: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const Icon = REPORT_ICONS[reporte.id] ?? FileText;

  return (
    <>
      <div
        className="rounded-xl p-5 flex flex-col gap-3 border transition-shadow"
        style={{ borderColor: "#E8E5DE", backgroundColor: "#FAFAF8" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#F0EDE6" }}
          >
            <Lock size={15} style={{ color: "#B0A99F" }} />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1" style={{ color: "#9B9488" }}>
            {reporte.nombre}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "#9B9488" }}>
            {REPORT_DESCRIPTIONS[reporte.id] ?? reporte.descripcion}
          </p>
        </div>

        {/* Quick checklist */}
        {(REQUIRED_DOCS[reporte.id] ?? []).length > 0 && (
          <ul style={{ margin: "0 0 8px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {(REQUIRED_DOCS[reporte.id] ?? []).map((doc, i) => {
              const have = doc.tipos.some(t => detectedTipos.includes(t));
              return (
                <li key={i} style={{ fontSize: 10, display: "flex", gap: 6, alignItems: "flex-start", color: have ? "#3D7A1C" : "#9B9488" }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}>{have ? "✓" : "✗"}</span>
                  <span style={{ lineHeight: 1.3 }}>{doc.label.split(" con ")[0]}</span>
                </li>
              );
            })}
          </ul>
        )}

        <button
          onClick={() => setModalOpen(true)}
          className="mt-1 w-full py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          style={{ borderColor: "#D6D1C8", color: "#9B9488", backgroundColor: "#F4F2EE" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E8E5DE";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F4F2EE";
          }}
        >
          <Icon size={12} />
          Ver documentación necesaria
        </button>
      </div>

      {modalOpen && (
        <RequiredDocsModal
          reporte={reporte}
          detectedTipos={detectedTipos}
          onClose={() => setModalOpen(false)}
          onUpload={onUpload}
        />
      )}
    </>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
type Props = {
  analysis: AnalysisResult;
  generating: string | null;
  bulkProgress: { current: number; total: number; name: string } | null;
  canGenerate: boolean;
  latestByAnalysisId: Record<string, GeneratedReport>;
  onGenerate: (analysisId: string) => void;
  onGenerateMultiple: (analysisIds: string[]) => void;
  onViewReport: (report: GeneratedReport) => void;
  onUpload: () => void;
};

export default function DocumentAnalysis({
  analysis,
  generating,
  bulkProgress,
  canGenerate,
  latestByAnalysisId,
  onGenerate,
  onGenerateMultiple,
  onViewReport,
  onUpload,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const available   = analysis.reportes_posibles.filter((r) => r.disponible);
  const unavailable = analysis.reportes_posibles.filter((r) => !r.disponible);

  const detectedTipos = analysis.documentos_detectados.map((d) => d.tipo);
  const docSummary    = analysis.documentos_detectados.map((d) => d.descripcion || d.tipo).join(" · ");

  const isAnyBusy = !!generating || !!bulkProgress;

  const toggleSelect = (id: string) => {
    if (!IMPLEMENTED.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerateSelected = () => {
    onGenerateMultiple(Array.from(selected));
    setSelected(new Set());
  };

  // Collapse/expand unavailable section — expanded by default
  const [unavailableOpen, setUnavailableOpen] = useState(true);

  return (
    <section className="space-y-5">

      {/* ── Info bar ── */}
      <div
        className="rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#C8E6C0" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>Empresa</span>
          <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{analysis.empresa || "—"}</span>
        </div>
        <div className="w-px h-4" style={{ backgroundColor: "#E8E5DE" }} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>CUIT</span>
          <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{analysis.cuit || "—"}</span>
        </div>
        <div className="w-px h-4" style={{ backgroundColor: "#E8E5DE" }} />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: "#9B9488" }}>Documentos</span>
          <span className="text-xs truncate" style={{ color: "#6B6560" }}>{docSummary || "—"}</span>
        </div>
        <div className="ml-auto shrink-0">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}
          >
            {available.length} reporte{available.length !== 1 ? "s" : ""} disponible{available.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Available reports ── */}
      {available.length > 0 && (
        <div>
          {/* Section header with bulk action */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B9488" }}>
              Reportes disponibles
            </h2>

            <div className="flex items-center gap-3">
              {/* Bulk progress */}
              {bulkProgress && (
                <div className="flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" style={{ color: "#3D7A1C" }} />
                  <span className="text-xs font-medium" style={{ color: "#3D7A1C" }}>
                    Generando {bulkProgress.name} ({bulkProgress.current}/{bulkProgress.total})…
                  </span>
                </div>
              )}

              {/* Select all toggle — only when can generate */}
              {canGenerate && !isAnyBusy && (
                <button
                  onClick={() => {
                    const implementedIds = available.filter(r => IMPLEMENTED.has(r.id)).map(r => r.id);
                    if (selected.size === implementedIds.length) setSelected(new Set());
                    else setSelected(new Set(implementedIds));
                  }}
                  className="text-xs cursor-pointer transition-colors"
                  style={{ color: "#9B9488" }}
                >
                  {selected.size === available.filter(r => IMPLEMENTED.has(r.id)).length ? "Deseleccionar todo" : "Seleccionar todo"}
                </button>
              )}

              {/* Generate selected button */}
              {selected.size > 0 && canGenerate && !isAnyBusy && (
                <button
                  onClick={handleGenerateSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#3D7A1C" }}
                >
                  Generar seleccionados ({selected.size})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {available.map((reporte) => (
              <AvailableReportCard
                key={reporte.id}
                reporte={reporte}
                isGenerating={generating === reporte.id}
                isAnyBusy={isAnyBusy}
                isSelected={selected.has(reporte.id)}
                canGenerate={canGenerate}
                latestReport={latestByAnalysisId[reporte.id] ?? null}
                detectedTipos={detectedTipos}
                onToggle={() => toggleSelect(reporte.id)}
                onGenerate={() => onGenerate(reporte.id)}
                onUpload={onUpload}
                onViewReport={onViewReport}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Unavailable reports (collapsible) ── */}
      {unavailable.length > 0 && (
        <div
          style={{
            borderLeft: unavailableOpen ? "none" : "3px solid #3D7A1C",
            paddingLeft: unavailableOpen ? 0 : 12,
            transition: "all 0.15s",
          }}
        >
          <button
            className="flex items-center gap-2 mb-3 cursor-pointer group"
            onClick={() => setUnavailableOpen((v) => !v)}
          >
            {unavailableOpen
              ? <ChevronDown size={16} style={{ color: "#3D7A1C" }} />
              : <ChevronRight size={16} style={{ color: "#3D7A1C" }} />
            }
            <h2
              className="text-sm font-semibold uppercase tracking-widest transition-colors"
              style={{ color: "#3D7A1C" }}
            >
              Requieren más documentación ({unavailable.length})
            </h2>
          </button>

          {unavailableOpen && (
            <div className="grid grid-cols-4 gap-4">
              {unavailable.map((reporte) => (
                <UnavailableReportCard
                  key={reporte.id}
                  reporte={reporte}
                  detectedTipos={detectedTipos}
                  onUpload={onUpload}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
