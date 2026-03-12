"use client";

import { DiagramaPlano, DiagramaLote } from "@/types/gestion";

// ─── Color helpers ────────────────────────────────────────────────────────────
const CULTIVO_COLORS: Record<string, string> = {
  soja:    "#4A7C28",
  maíz:    "#D4AD3C",
  maiz:    "#D4AD3C",
  girasol: "#E8922A",
  trigo:   "#C4A862",
  cebada:  "#C4A862",
  sorgo:   "#A0522D",
  arroz:   "#7BAF5E",
};

const AMBIENTE_COLORS: Record<string, string> = {
  ">100":  "#2B5118",
  "76-100":"#4A7C28",
  "51-75": "#D4AD3C",
  "26-50": "#E07B39",
  "<25":   "#C0392B",
};

function getLoteColor(lote: DiagramaLote, tipo: "cultivos" | "ambientes"): string {
  if (tipo === "cultivos") {
    if (!lote.cultivo) return "#D6D1C8";
    const k = lote.cultivo.toLowerCase();
    for (const [key, val] of Object.entries(CULTIVO_COLORS)) {
      if (k.includes(key)) return val;
    }
    return "#8BAD7C";
  } else {
    if (!lote.ambiente) return "#D6D1C8";
    for (const [key, val] of Object.entries(AMBIENTE_COLORS)) {
      if (lote.ambiente.includes(key)) return val;
    }
    return "#9B9488";
  }
}

// Dark enough for white text?
function needsDarkText(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

// ─── Mini version ─────────────────────────────────────────────────────────────
export function CampoDiagramaMini({ diagrama }: { diagrama: DiagramaPlano }) {
  const sorted = [...diagrama.lotes].sort((a, b) => b.superficie - a.superficie).slice(0, 20);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      {sorted.map((lote, i) => {
        const color = getLoteColor(lote, diagrama.tipo);
        const size  = Math.max(16, Math.min(36, Math.sqrt(lote.porcentaje_del_total) * 8));
        return (
          <div
            key={i}
            title={`${lote.nombre}: ${lote.superficie} ha`}
            style={{
              width: size, height: size,
              backgroundColor: color,
              borderRadius: 4,
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Full version ─────────────────────────────────────────────────────────────
interface CampoDiagramaProps {
  diagrama: DiagramaPlano;
  campNombre?: string | null;
  superficieTotal?: number | null;
}

export default function CampoDiagrama({ diagrama, campNombre, superficieTotal }: CampoDiagramaProps) {
  const sorted = [...diagrama.lotes].sort((a, b) => b.superficie - a.superficie);

  return (
    <div>
      {/* Title */}
      {campNombre && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>{campNombre}</p>
          <p style={{ fontSize: 12, color: "#9B9488", marginTop: 2 }}>
            {superficieTotal ? `${superficieTotal.toLocaleString("es-AR")} ha · ` : ""}
            {diagrama.lotes.length} lote{diagrama.lotes.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Proportional flexbox grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
          padding: 12,
          backgroundColor: "#F5FAF3",
          borderRadius: 12,
          border: "1px solid #E0EDD9",
        }}
      >
        {sorted.map((lote, i) => {
          const color    = getLoteColor(lote, diagrama.tipo);
          const dark     = needsDarkText(color);
          const txtColor = dark ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.95)";
          // flex-grow proportional to pct, height proportional to sqrt of area
          const grow   = Math.max(1, lote.porcentaje_del_total);
          const height = Math.max(52, Math.min(130, Math.sqrt(lote.superficie) * 6));

          return (
            <div
              key={i}
              title={`${lote.nombre}: ${lote.superficie} ha (${lote.porcentaje_del_total.toFixed(1)}%)`}
              style={{
                flexGrow: grow,
                flexShrink: 0,
                flexBasis: `${Math.max(6, lote.porcentaje_del_total)}%`,
                minWidth: 54,
                height,
                backgroundColor: color,
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px 6px",
                cursor: "default",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 800, color: txtColor, textAlign: "center", lineHeight: 1.2, wordBreak: "break-all" }}>
                {lote.nombre}
              </p>
              <p style={{ fontSize: 9, color: txtColor, opacity: 0.85, textAlign: "center", marginTop: 2, lineHeight: 1.1 }}>
                {lote.superficie.toLocaleString("es-AR")} ha
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {diagrama.leyenda.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          {diagrama.leyenda.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#6B6560" }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary table */}
      <div style={{ marginTop: 16, overflowX: "auto", borderRadius: 10, border: "1px solid #E8E5DE", overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#FAFAF8" }}>
              {["Lote", "Ha", "% del total", "Cultivo", "Ambiente"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left", padding: "7px 12px",
                    fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    color: "#9B9488", borderBottom: "1px solid #E8E5DE",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((lote, i) => (
              <tr key={i} style={{ borderBottom: i < sorted.length - 1 ? "1px solid #F0EDE6" : undefined }}>
                <td style={{ padding: "7px 12px", fontWeight: 600, color: "#1A1A1A" }}>{lote.nombre}</td>
                <td style={{ padding: "7px 12px", color: "#3D7A1C", fontWeight: 600 }}>
                  {lote.superficie.toLocaleString("es-AR")}
                </td>
                <td style={{ padding: "7px 12px", color: "#6B6560" }}>
                  {lote.porcentaje_del_total.toFixed(1)}%
                </td>
                <td style={{ padding: "7px 12px", color: "#1A1A1A" }}>{lote.cultivo ?? "—"}</td>
                <td style={{ padding: "7px 12px", color: "#9B9488" }}>{lote.ambiente ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
