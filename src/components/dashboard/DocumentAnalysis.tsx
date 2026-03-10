"use client";

import {
  Scale, TrendingUp, BarChart2, GitBranch, Target,
  Calendar, Map, Building2, Loader2, LucideIcon, FileText, Lock,
} from "lucide-react";
import { AnalysisResult, ReportePosible } from "@/types/analysis";

// ─── Mapa de íconos por ID de reporte ─────────────────────────────────────────
const REPORT_ICONS: Record<string, LucideIcon> = {
  situacion_patrimonial:  Scale,
  margen_bruto:           TrendingUp,
  ratios:                 BarChart2,
  bridge:                 GitBranch,
  break_even:             Target,
  proyeccion:             Calendar,
  ranking_campos:         Map,
  calificacion_bancaria:  Building2,
};

// IDs con ruta implementada
const IMPLEMENTED = new Set(["situacion_patrimonial", "margen_bruto", "ratios", "bridge"]);

// ─── Card individual ─────────────────────────────────────────────────────────
function AnalysisReportCard({
  reporte,
  loading,
  onGenerate,
}: {
  reporte: ReportePosible;
  loading: boolean;
  onGenerate?: () => void;
}) {
  const Icon = REPORT_ICONS[reporte.id] ?? FileText;
  const implemented = IMPLEMENTED.has(reporte.id);
  const canClick = reporte.disponible && implemented && !loading && !!onGenerate;

  // Estados visuales:
  // disponible + implementado  → verde, botón activo
  // disponible + no implementado → verde outline, botón "Próximamente"
  // no disponible               → gris, muestra motivo, botón deshabilitado

  const cardStyle: React.CSSProperties = reporte.disponible
    ? { borderColor: "#C8E6C0", backgroundColor: "#FFFFFF" }
    : { borderColor: "#E8E5DE", backgroundColor: "#FAFAF8" };

  const iconBg = reporte.disponible ? "#EBF3E8" : "#F0EDE6";
  const iconColor = reporte.disponible ? "#3D7A1C" : "#B0A99F";
  const titleColor = reporte.disponible ? "#1A1A1A" : "#9B9488";

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 border transition-shadow"
      style={cardStyle}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          {reporte.disponible
            ? <Icon size={18} style={{ color: iconColor }} />
            : <Lock size={15} style={{ color: iconColor }} />
          }
        </div>
        {reporte.disponible && implemented && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}
          >
            Disponible
          </span>
        )}
        {reporte.disponible && !implemented && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#FEF3CD", color: "#B8922A" }}
          >
            Próximamente
          </span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-sm mb-1" style={{ color: titleColor }}>
          {reporte.nombre}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: "#9B9488" }}>
          {reporte.disponible ? reporte.descripcion : reporte.motivo}
        </p>
      </div>

      <button
        disabled={!canClick}
        onClick={canClick ? onGenerate : undefined}
        className="mt-1 w-full py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5"
        style={
          loading
            ? { borderColor: "#3D7A1C", color: "#3D7A1C", backgroundColor: "#EBF3E8", cursor: "wait" }
            : canClick
            ? { borderColor: "#3D7A1C", color: "#ffffff", backgroundColor: "#3D7A1C", cursor: "pointer" }
            : reporte.disponible && !implemented
            ? { borderColor: "#D6D1C8", color: "#B8922A", backgroundColor: "#FEF3CD", cursor: "default" }
            : { borderColor: "#D6D1C8", color: "#B0A99F", backgroundColor: "#F4F2EE", cursor: "not-allowed" }
        }
        onMouseEnter={(e) => { if (canClick) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2F6016"; }}
        onMouseLeave={(e) => { if (canClick) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3D7A1C"; }}
      >
        {loading ? (
          <><Loader2 size={13} className="animate-spin" />Generando…</>
        ) : reporte.disponible && !implemented ? (
          "Próximamente"
        ) : reporte.disponible ? (
          "Generar"
        ) : (
          "Sin datos suficientes"
        )}
      </button>
    </div>
  );
}

// ─── Sección completa ─────────────────────────────────────────────────────────
type Props = {
  analysis: AnalysisResult;
  generating: string | null;   // analysisId del reporte en generación
  onGenerate: (analysisId: string) => void;
};

export default function DocumentAnalysis({ analysis, generating, onGenerate }: Props) {
  const available   = analysis.reportes_posibles.filter((r) => r.disponible);
  const unavailable = analysis.reportes_posibles.filter((r) => !r.disponible);

  // Descripción compacta de documentos detectados
  const docSummary = analysis.documentos_detectados
    .map((d) => d.descripcion || d.tipo)
    .join(" · ");

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

      {/* ── Reportes disponibles ── */}
      {available.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#9B9488" }}>
            Reportes disponibles
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {available.map((reporte) => (
              <AnalysisReportCard
                key={reporte.id}
                reporte={reporte}
                loading={generating === reporte.id}
                onGenerate={
                  IMPLEMENTED.has(reporte.id)
                    ? () => onGenerate(reporte.id)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Reportes no disponibles ── */}
      {unavailable.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#B0A99F" }}>
            Requieren más documentación
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {unavailable.map((reporte) => (
              <AnalysisReportCard
                key={reporte.id}
                reporte={reporte}
                loading={false}
                onGenerate={undefined}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
