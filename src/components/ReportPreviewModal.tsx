"use client";

import { useState, useRef, useEffect } from "react";
import { X, Download, Loader2, ChevronDown, ChevronRight, FileSpreadsheet, FileText as FilePdf } from "lucide-react";
import { generateReportPDF } from "@/lib/pdf/report-pdf";
import { GeneratedReport } from "@/types/report";

// ─── Helpers numéricos ────────────────────────────────────────────────────────
function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") { const p = parseFloat(v.replace(/\./g, "").replace(",", ".")); return isNaN(p) ? 0 : p; }
  return 0;
}
function fmt(v: unknown): string {
  const n = toNum(v);
  if (isNaN(n)) return "0,00";
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function fmtPct(v: unknown): string {
  const n = toNum(v);
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n) + "%";
}

// ─── Shared table styles ──────────────────────────────────────────────────────
const S = {
  th:      { backgroundColor: "#1A3311", color: "#fff", fontWeight: 700, fontSize: 11, padding: "8px 12px", textAlign: "left"  } as React.CSSProperties,
  thR:     { backgroundColor: "#1A3311", color: "#fff", fontWeight: 700, fontSize: 11, padding: "8px 12px", textAlign: "right" } as React.CSSProperties,
  thC:     { backgroundColor: "#1A3311", color: "#fff", fontWeight: 700, fontSize: 11, padding: "8px 12px", textAlign: "center"} as React.CSSProperties,
  section: { backgroundColor: "#3D7A1C", color: "#fff", fontWeight: 700, fontSize: 11, padding: "7px 12px", letterSpacing: "0.05em" } as React.CSSProperties,
  total:   { backgroundColor: "#1A3311", color: "#fff", fontWeight: 700, fontSize: 12, padding: "9px 12px" } as React.CSSProperties,
  totalR:  { backgroundColor: "#1A3311", color: "#fff", fontWeight: 700, fontSize: 12, padding: "9px 12px", textAlign: "right" } as React.CSSProperties,
  sub:     { fontWeight: 700, fontStyle: "italic", fontSize: 11, padding: "7px 12px", borderTop: "1px solid #D6D1C8", borderBottom: "2px solid #9B9488", backgroundColor: "#FAFAF8" } as React.CSSProperties,
  subR:    { fontWeight: 700, fontStyle: "italic", fontSize: 11, padding: "7px 12px", borderTop: "1px solid #D6D1C8", borderBottom: "2px solid #9B9488", backgroundColor: "#FAFAF8", textAlign: "right" } as React.CSSProperties,
  tdL:     { fontSize: 11, padding: "6px 12px 6px 24px", color: "#1A1A1A" } as React.CSSProperties,
  tdC:     { fontSize: 10, padding: "6px 8px", textAlign: "center", color: "#9B9488" } as React.CSSProperties,
  tdR:     { fontSize: 11, padding: "6px 12px", textAlign: "right", color: "#1A1A1A", fontVariantNumeric: "tabular-nums" } as React.CSSProperties,
  spacer:  { height: 12 } as React.CSSProperties,
};

function useAlt() {
  let alt = false;
  return {
    rowBg: (): React.CSSProperties => { alt = !alt; return { backgroundColor: alt ? "#FAFAF8" : "#FFFFFF" }; },
    reset: () => { alt = false; return null; },
  };
}

// ─── Tabla Situación Patrimonial ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PatrimonialTable({ d }: { d: any }) {
  const ant  = d.valores_periodo_anterior ?? {};
  const ac   = d.activo_corriente ?? {};
  const acA  = ant.activo_corriente ?? {};
  const anc  = d.activo_no_corriente ?? {};
  const ancA = ant.activo_no_corriente ?? {};
  const pc   = d.pasivo_corriente ?? {};
  const pcA  = ant.pasivo_corriente ?? {};
  const pnc  = d.pasivo_no_corriente ?? {};
  const pncA = ant.pasivo_no_corriente ?? {};
  const { rowBg, reset } = useAlt();

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={S.th}>Concepto</th>
          <th style={S.thC}>Nota</th>
          <th style={S.thR}>{d.periodo_actual ?? "Periodo Actual"}</th>
          <th style={S.thR}>{d.periodo_anterior ?? "Periodo Anterior"}</th>
        </tr>
      </thead>
      <tbody>
        {reset()}
        <tr><td colSpan={4} style={S.section}>ACTIVO CORRIENTE</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Disponibilidades</td><td style={S.tdC}>1</td><td style={S.tdR}>{fmt(ac.disponibilidades)}</td><td style={S.tdR}>{fmt(acA.disponibilidades)}</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Créditos por ventas</td><td style={S.tdC}>2</td><td style={S.tdR}>{fmt(ac.creditos_por_ventas)}</td><td style={S.tdR}>{fmt(acA.creditos_por_ventas)}</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Créditos impositivos</td><td style={S.tdC}>3</td><td style={S.tdR}>{fmt(ac.creditos_impositivos)}</td><td style={S.tdR}>{fmt(acA.creditos_impositivos)}</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Créditos sociales</td><td style={S.tdC}>4</td><td style={S.tdR}>{fmt(ac.creditos_sociales)}</td><td style={S.tdR}>{fmt(acA.creditos_sociales)}</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Inversiones</td><td style={S.tdC}>5</td><td style={S.tdR}>{fmt(ac.inversiones)}</td><td style={S.tdR}>{fmt(acA.inversiones)}</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Bienes de cambio</td><td style={S.tdC}>6</td><td style={S.tdR}>{fmt(ac.bienes_de_cambio)}</td><td style={S.tdR}>{fmt(acA.bienes_de_cambio)}</td></tr>
        <tr><td style={S.sub}>Total Activo Corriente</td><td style={S.sub}></td><td style={S.subR}>{fmt(ac.total)}</td><td style={S.subR}>{fmt(acA.total)}</td></tr>

        {reset()}
        <tr><td colSpan={4} style={S.section}>ACTIVO NO CORRIENTE</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Bienes de uso</td><td style={S.tdC}>7</td><td style={S.tdR}>{fmt(anc.bienes_de_uso)}</td><td style={S.tdR}>{fmt(ancA.bienes_de_uso)}</td></tr>
        <tr><td style={S.sub}>Total Activo No Corriente</td><td style={S.sub}></td><td style={S.subR}>{fmt(anc.total)}</td><td style={S.subR}>{fmt(ancA.total)}</td></tr>

        <tr><td style={S.total}>TOTAL ACTIVO</td><td style={S.total}></td><td style={S.totalR}>{fmt(d.total_activo)}</td><td style={S.totalR}>{fmt(ant.total_activo)}</td></tr>
        <tr><td colSpan={4} style={S.spacer}></td></tr>

        {reset()}
        <tr><td colSpan={4} style={S.section}>PASIVO CORRIENTE</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Deudas comerciales</td><td style={S.tdC}>8</td><td style={S.tdR}>{fmt(pc.deudas_comerciales)}</td><td style={S.tdR}>{fmt(pcA.deudas_comerciales)}</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Deudas bancarias</td><td style={S.tdC}>9</td><td style={S.tdR}>{fmt(pc.deudas_bancarias)}</td><td style={S.tdR}>{fmt(pcA.deudas_bancarias)}</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Deudas impositivas</td><td style={S.tdC}>10</td><td style={S.tdR}>{fmt(pc.deudas_impositivas)}</td><td style={S.tdR}>{fmt(pcA.deudas_impositivas)}</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Deudas sociales</td><td style={S.tdC}>11</td><td style={S.tdR}>{fmt(pc.deudas_sociales)}</td><td style={S.tdR}>{fmt(pcA.deudas_sociales)}</td></tr>
        <tr><td style={S.sub}>Total Pasivo Corriente</td><td style={S.sub}></td><td style={S.subR}>{fmt(pc.total)}</td><td style={S.subR}>{fmt(pcA.total)}</td></tr>

        {reset()}
        <tr><td colSpan={4} style={S.section}>PASIVO NO CORRIENTE</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Deudas bancarias</td><td style={S.tdC}>12</td><td style={S.tdR}>{fmt(pnc.deudas_bancarias)}</td><td style={S.tdR}>{fmt(pncA.deudas_bancarias)}</td></tr>
        <tr style={rowBg()}><td style={S.tdL}>Deudas sociales</td><td style={S.tdC}>13</td><td style={S.tdR}>{fmt(pnc.deudas_sociales)}</td><td style={S.tdR}>{fmt(pncA.deudas_sociales)}</td></tr>
        <tr><td style={S.sub}>Total Pasivo No Corriente</td><td style={S.sub}></td><td style={S.subR}>{fmt(pnc.total)}</td><td style={S.subR}>{fmt(pncA.total)}</td></tr>

        <tr><td style={S.total}>TOTAL PASIVO</td><td style={S.total}></td><td style={S.totalR}>{fmt(d.total_pasivo)}</td><td style={S.totalR}>{fmt(ant.total_pasivo)}</td></tr>
        <tr><td colSpan={4} style={S.spacer}></td></tr>
        <tr><td style={{ ...S.total, fontSize: 13 }}>PATRIMONIO NETO</td><td style={S.total}></td><td style={{ ...S.totalR, fontSize: 13 }}>{fmt(d.patrimonio_neto)}</td><td style={{ ...S.totalR, fontSize: 13 }}>{fmt(ant.patrimonio_neto)}</td></tr>
      </tbody>
    </table>
  );
}

// ─── Tabla Margen Bruto ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MargenBrutoTable({ d }: { d: any }) {
  const cv   = d.costo_ventas ?? {};
  const ei   = cv.existencias_iniciales ?? {};
  const ef   = cv.existencias_finales ?? {};
  const gp   = d.gastos_produccion ?? {};
  const { rowBg, reset } = useAlt();

  const pA = d.periodo_actual   ?? "Periodo Actual";
  const pB = d.periodo_anterior ?? "Periodo Anterior";

  const sectionTitle: React.CSSProperties = {
    backgroundColor: "#1A3311", color: "#fff", fontWeight: 700,
    fontSize: 12, padding: "10px 14px", marginTop: 24, borderRadius: "8px 8px 0 0",
    display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── 1. Ventas por Cultivo ── */}
      <div>
        <div style={sectionTitle}>VENTAS POR CULTIVO</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={S.th}>Cultivo</th>
              <th style={S.thR}>{pA}</th>
              <th style={S.thR}>{pB}</th>
              <th style={S.thR}>Variación $</th>
              <th style={S.thR}>Var. %</th>
            </tr>
          </thead>
          <tbody>
            {reset()}
            {(d.ventas_por_cultivo ?? []).map((v: { cultivo: string; ventas_actual: unknown; ventas_anterior: unknown; variacion_pct: unknown }, i: number) => {
              const varPesos = toNum(v.ventas_actual) - toNum(v.ventas_anterior);
              const isPos = varPesos >= 0;
              return (
                <tr key={i} style={rowBg()}>
                  <td style={S.tdL}>{v.cultivo}</td>
                  <td style={S.tdR}>{fmt(v.ventas_actual)}</td>
                  <td style={S.tdR}>{fmt(v.ventas_anterior)}</td>
                  <td style={{ ...S.tdR, color: isPos ? "#1E7E34" : "#C0392B" }}>{fmt(varPesos)}</td>
                  <td style={{ ...S.tdR, color: toNum(v.variacion_pct) >= 0 ? "#1E7E34" : "#C0392B" }}>{fmtPct(v.variacion_pct)}</td>
                </tr>
              );
            })}
            <tr>
              <td style={S.total}>TOTAL VENTAS</td>
              <td style={S.totalR}>{fmt(d.total_ventas_actual)}</td>
              <td style={S.totalR}>{fmt(d.total_ventas_anterior)}</td>
              <td style={S.totalR}>{fmt(toNum(d.total_ventas_actual) - toNum(d.total_ventas_anterior))}</td>
              <td style={S.total}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 2. Costo de Ventas y Margen ── */}
      <div>
        <div style={sectionTitle}>COSTO DE VENTAS Y MARGEN BRUTO</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={S.th}>Concepto</th>
              <th style={S.thR}>{pA}</th>
              <th style={S.thR}>{pB}</th>
            </tr>
          </thead>
          <tbody>
            {reset()}
            <tr><td colSpan={3} style={S.section}>EXISTENCIAS INICIALES</td></tr>
            <tr style={rowBg()}><td style={S.tdL}>Cereales</td><td style={S.tdR}>{fmt(ei.cereales)}</td><td style={S.tdR}>—</td></tr>
            <tr style={rowBg()}><td style={S.tdL}>Sementeras</td><td style={S.tdR}>{fmt(ei.sementeras)}</td><td style={S.tdR}>—</td></tr>
            <tr style={rowBg()}><td style={S.tdL}>Insumos</td><td style={S.tdR}>{fmt(ei.insumos)}</td><td style={S.tdR}>—</td></tr>
            <tr><td style={S.sub}>Total Existencias Iniciales</td><td style={S.subR}>{fmt(ei.total)}</td><td style={S.subR}>—</td></tr>

            {reset()}
            <tr style={rowBg()}><td style={{ ...S.tdL, fontWeight: 600 }}>Compras del período</td><td style={{ ...S.tdR, fontWeight: 600 }}>{fmt(cv.compras)}</td><td style={S.tdR}>—</td></tr>

            {reset()}
            <tr><td colSpan={3} style={S.section}>EXISTENCIAS FINALES</td></tr>
            <tr style={rowBg()}><td style={S.tdL}>Cereales</td><td style={S.tdR}>{fmt(ef.cereales)}</td><td style={S.tdR}>—</td></tr>
            <tr style={rowBg()}><td style={S.tdL}>Sementeras</td><td style={S.tdR}>{fmt(ef.sementeras)}</td><td style={S.tdR}>—</td></tr>
            <tr style={rowBg()}><td style={S.tdL}>Insumos</td><td style={S.tdR}>{fmt(ef.insumos)}</td><td style={S.tdR}>—</td></tr>
            <tr><td style={S.sub}>Total Existencias Finales</td><td style={S.subR}>{fmt(ef.total)}</td><td style={S.subR}>—</td></tr>

            <tr><td colSpan={3} style={{ height: 8 }}></td></tr>
            <tr><td style={S.total}>COSTO TOTAL DE VENTAS</td><td style={S.totalR}>{fmt(cv.costo_total_actual)}</td><td style={S.totalR}>{fmt(cv.costo_total_anterior)}</td></tr>
            <tr><td colSpan={3} style={{ height: 8 }}></td></tr>
            {reset()}
            <tr style={rowBg()}><td style={S.tdL}>Ventas netas</td><td style={S.tdR}>{fmt(d.total_ventas_actual)}</td><td style={S.tdR}>{fmt(d.total_ventas_anterior)}</td></tr>
            <tr><td style={S.total}>RESULTADO BRUTO DE PRODUCCIÓN</td><td style={S.totalR}>{fmt(d.resultado_bruto_actual)}</td><td style={S.totalR}>{fmt(d.resultado_bruto_anterior)}</td></tr>
            <tr>
              <td style={{ ...S.tdL, fontWeight: 700, color: "#3D7A1C" }}>Margen Bruto %</td>
              <td style={{ ...S.tdR, fontWeight: 700, color: "#3D7A1C" }}>{fmtPct(d.margen_bruto_pct_actual)}</td>
              <td style={{ ...S.tdR, fontWeight: 700, color: "#3D7A1C" }}>{fmtPct(d.margen_bruto_pct_anterior)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 3. Gastos de Producción ── */}
      <div>
        <div style={sectionTitle}>GASTOS DE PRODUCCIÓN</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={S.th}>Concepto</th>
              <th style={S.thR}>{pA}</th>
              <th style={S.thR}>{pB}</th>
              <th style={S.thR}>Variación $</th>
            </tr>
          </thead>
          <tbody>
            {reset()}
            {([
              ["Fletes",               "fletes"],
              ["Alquileres",           "alquileres"],
              ["Honorarios técnicos",  "honorarios_tecnicos"],
              ["Servicios de cosecha", "servicios_cosecha"],
              ["Seguros",              "seguros"],
              ["Combustibles",         "combustibles"],
              ["Reparaciones",         "reparaciones"],
              ["Otros",                "otros"],
            ] as [string, string][]).map(([label, key]) => {
              const act = toNum(gp[key]);
              return (
                <tr key={key} style={rowBg()}>
                  <td style={S.tdL}>{label}</td>
                  <td style={S.tdR}>{fmt(act)}</td>
                  <td style={S.tdR}>—</td>
                  <td style={S.tdR}>—</td>
                </tr>
              );
            })}
            <tr><td style={S.total}>TOTAL GASTOS DE PRODUCCIÓN</td><td style={S.totalR}>{fmt(gp.total_actual)}</td><td style={S.totalR}>{fmt(gp.total_anterior)}</td><td style={S.totalR}>{fmt(toNum(gp.total_actual) - toNum(gp.total_anterior))}</td></tr>
            <tr><td colSpan={4} style={{ height: 8 }}></td></tr>
            <tr><td style={{ ...S.total, fontSize: 13 }}>RESULTADO OPERATIVO</td><td style={{ ...S.totalR, fontSize: 13 }}>{fmt(d.resultado_operativo_actual)}</td><td style={{ ...S.totalR, fontSize: 13 }}>{fmt(d.resultado_operativo_anterior)}</td><td style={S.totalR}>{fmt(toNum(d.resultado_operativo_actual) - toNum(d.resultado_operativo_anterior))}</td></tr>
            <tr>
              <td style={{ ...S.tdL, fontWeight: 700, color: "#3D7A1C" }}>Margen Operativo %</td>
              <td style={{ ...S.tdR, fontWeight: 700, color: "#3D7A1C" }}>{fmtPct(d.margen_operativo_pct_actual)}</td>
              <td style={{ ...S.tdR, fontWeight: 700, color: "#3D7A1C" }}>{fmtPct(d.margen_operativo_pct_anterior)}</td>
              <td style={S.tdR}></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ─── Tabla Ratios e Indicadores ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RatiosTable({ d }: { d: any }) {
  const ratios: {
    categoria: string;
    indicador: string;
    formula: string;
    valor_actual: unknown;
    valor_anterior: unknown;
    unidad: string;
    interpretacion: string;
  }[] = d.ratios ?? [];

  const groups = new Map<string, typeof ratios>();
  for (const r of ratios) {
    const cat = r.categoria ?? "General";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(r);
  }

  function fmtVal(v: unknown, unit: string): string {
    const n = toNum(v);
    if (unit === "pct")   return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n) + "%";
    if (unit === "veces") return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + "x";
    return fmt(n);
  }

  const pA = d.periodo_actual   ?? "Actual";
  const pB = d.periodo_anterior ?? "Anterior";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={S.th}>Indicador</th>
            <th style={{ ...S.th, fontSize: 10, fontStyle: "italic", fontWeight: 400 }}>Fórmula</th>
            <th style={S.thR}>{pA}</th>
            <th style={S.thR}>{pB}</th>
            <th style={S.thR}>Variación</th>
            <th style={{ ...S.th, textAlign: "left" }}>Interpretación</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            let alt = false;
            return Array.from(groups.entries()).flatMap(([categoria, items]) => {
              alt = false;
              return [
                <tr key={`cat-${categoria}`}>
                  <td colSpan={6} style={S.section}>{categoria.toUpperCase()}</td>
                </tr>,
                ...items.map((ratio, i) => {
                  alt = !alt;
                  const bg: React.CSSProperties = { backgroundColor: alt ? "#FAFAF8" : "#FFFFFF" };
                  const vAct = toNum(ratio.valor_actual);
                  const vAnt = toNum(ratio.valor_anterior);
                  const varNum = vAct - vAnt;
                  const isPos = varNum >= 0;
                  return (
                    <tr key={`${categoria}-${i}`} style={bg}>
                      <td style={S.tdL}>{ratio.indicador}</td>
                      <td style={{ ...S.tdC, textAlign: "left", fontStyle: "italic", color: "#9B9488", fontSize: 10 }}>{ratio.formula}</td>
                      <td style={{ ...S.tdR, fontWeight: 700 }}>{fmtVal(ratio.valor_actual, ratio.unidad)}</td>
                      <td style={S.tdR}>{fmtVal(ratio.valor_anterior, ratio.unidad)}</td>
                      <td style={{ ...S.tdR, fontWeight: 700, color: isPos ? "#1E7E34" : "#C0392B" }}>
                        {(isPos ? "+" : "") + fmtVal(varNum, ratio.unidad)}
                      </td>
                      <td style={{ ...S.tdC, textAlign: "left", fontSize: 10, color: "#6B6560" }}>{ratio.interpretacion}</td>
                    </tr>
                  );
                }),
              ];
            });
          })()}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tabla Bridge de Resultados ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BridgeTable({ d }: { d: any }) {
  const items: { concepto: string; impacto: unknown; descripcion: string }[] = d.items ?? [];
  const resAnt  = toNum(d.resultado_anterior);
  const resAct  = toNum(d.resultado_actual);
  const varTotal = toNum(d.variacion_total);
  const pA = d.periodo_actual   ?? "Ejercicio actual";
  const pB = d.periodo_anterior ?? "Ejercicio anterior";

  const maxAbs = Math.max(...items.map((it) => Math.abs(toNum(it.impacto))), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
        <div style={{ backgroundColor: "#1A3311", borderRadius: 12, padding: "18px 20px", textAlign: "center" }}>
          <div style={{ color: "#A8C5A0", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{pB}</div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(resAnt)}</div>
        </div>
        <div style={{ textAlign: "center", padding: "0 8px" }}>
          <div style={{ fontSize: 28, color: varTotal >= 0 ? "#1E7E34" : "#C0392B" }}>{varTotal >= 0 ? "→" : "→"}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: varTotal >= 0 ? "#1E7E34" : "#C0392B" }}>
            {(varTotal >= 0 ? "+" : "") + fmt(varTotal)}
          </div>
        </div>
        <div style={{ backgroundColor: "#3D7A1C", borderRadius: 12, padding: "18px 20px", textAlign: "center" }}>
          <div style={{ color: "#C8E6C0", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{pA}</div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(resAct)}</div>
        </div>
      </div>

      {/* Bridge items table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={S.th}>Concepto</th>
            <th style={S.thR}>Impacto ($)</th>
            <th style={{ ...S.th, width: 200 }}>Magnitud</th>
            <th style={{ ...S.th, textAlign: "left" }}>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const imp = toNum(item.impacto);
            const isPos = imp >= 0;
            const barPct = Math.round((Math.abs(imp) / maxAbs) * 100);
            const bg = i % 2 === 0 ? "#FFFFFF" : "#FAFAF8";
            return (
              <tr key={i} style={{ backgroundColor: bg }}>
                <td style={S.tdL}>{item.concepto}</td>
                <td style={{ ...S.tdR, fontWeight: 700, color: isPos ? "#1E7E34" : "#C0392B" }}>
                  {(isPos ? "+" : "") + fmt(imp)}
                </td>
                <td style={{ padding: "6px 12px", verticalAlign: "middle" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {!isPos && <div style={{ flex: 1 }} />}
                    <div
                      style={{
                        height: 10, borderRadius: 5,
                        width: `${barPct}%`, minWidth: 4,
                        backgroundColor: isPos ? "#3D7A1C" : "#C0392B",
                        flex: "none",
                      }}
                    />
                    {isPos && <div style={{ flex: 1 }} />}
                  </div>
                </td>
                <td style={{ ...S.tdC, textAlign: "left", fontSize: 10, color: "#6B6560" }}>{item.descripcion}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Conclusion */}
      {d.conclusion && (
        <div style={{ backgroundColor: "#F0F7EC", border: "1px solid #C8E6C0", borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Conclusión
          </div>
          <p style={{ fontSize: 12, color: "#2A2A2A", lineHeight: 1.6, margin: 0 }}>{d.conclusion}</p>
        </div>
      )}
    </div>
  );
}

// ─── Calificación Bancaria ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CalificacionBancariaTable({ d }: { d: any }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    datos_generales: true,
    campos: false,
    agricultura: false,
    ganaderia: false,
    maquinaria: false,
    gastos: false,
    pasivos: false,
    patrimonial: true,
    accionaria: false,
    faltantes: true,
    recursos: false,
  });

  const toggle = (key: string) => setOpen((p) => ({ ...p, [key]: !p[key] }));

  const pct = toNum(d.completitud_pct ?? 0);
  const pctColor = pct >= 70 ? "#3D7A1C" : pct >= 40 ? "#B8922A" : "#C0392B";
  const pctBg    = pct >= 70 ? "#EBF3E8"  : pct >= 40 ? "#FEF3CD"  : "#FEE9E9";

  // Helpers
  const pending = (v: unknown) => v === null || v === undefined || v === "";

  function PendingBadge({ text }: { text?: string }) {
    return (
      <span style={{ backgroundColor: "#FEF3CD", color: "#92680A", fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 999, border: "1px solid #F5D87A" }}>
        {text ?? "PENDIENTE"}
      </span>
    );
  }

  function Val({ v, suffix }: { v: unknown; suffix?: string }) {
    if (pending(v)) return <PendingBadge />;
    const str = typeof v === "number" ? fmt(v) : String(v);
    return <span style={{ fontWeight: 600, color: "#1A1A1A" }}>{str}{suffix}</span>;
  }

  function SectionHeader({ label, skey, badge }: { label: string; skey: string; badge?: string }) {
    return (
      <button
        onClick={() => toggle(skey)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
        style={{ backgroundColor: "#1A3311", borderRadius: open[skey] ? "10px 10px 0 0" : 10, border: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2F5920")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1A3311")}
      >
        <div className="flex items-center gap-2">
          {open[skey] ? <ChevronDown size={14} color="#fff" /> : <ChevronRight size={14} color="#fff" />}
          <span style={{ fontWeight: 700, fontSize: 11, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        </div>
        {badge && (
          <span style={{ backgroundColor: "#D4AD3C", color: "#1A1A1A", fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 999 }}>{badge}</span>
        )}
      </button>
    );
  }

  function SectionBody({ skey, children }: { skey: string; children: React.ReactNode }) {
    if (!open[skey]) return null;
    return (
      <div style={{ border: "1px solid #E8E5DE", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "12px 16px", backgroundColor: "#FFFFFF", marginBottom: 12 }}>
        {children}
      </div>
    );
  }

  function LabelRow({ label, value, idx = 0 }: { label: string; value: unknown; idx?: number }) {
    return (
      <div style={{ display: "flex", gap: 12, padding: "5px 0", borderBottom: "1px solid #F0EDE6", backgroundColor: idx % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
        <span style={{ minWidth: 180, fontSize: 11, color: "#6B6560", fontWeight: 600 }}>{label}</span>
        <Val v={value} />
      </div>
    );
  }

  const dg  = d.datos_generales ?? {};
  const agri = d.agricultura ?? {};
  const maq  = d.maquinaria ?? {};
  const gi   = d.gastos_indirectos ?? {};
  const pas  = d.pasivos ?? {};
  const sp   = d.situacion_patrimonial_resumen ?? {};
  const pa   = d.participacion_accionaria ?? {};
  const gan  = d.ganaderia ?? {};
  const rf   = gan.recursos_forrajeros ?? {};
  const propios    = (d.campos_propios    ?? []) as Record<string, unknown>[];
  const arrendados = (d.campos_arrendados ?? []) as Record<string, unknown>[];
  const faltantes: { seccion: string; dato: string; documento_sugerido: string }[] = d.datos_faltantes ?? [];

  const camposHdrs = ["Nombre","Provincia","CP","Sup.(ha)","Agríc.(ha)","G.Cría","G.Inv.","G.Tambo","G.Otros","USD/ha"];

  function CampoRow({ c, extra }: { c: Record<string, unknown>; extra?: React.ReactNode }) {
    return (
      <tr>
        {([c.nombre, c.provincia, c.codigo_postal, c.superficie_has, c.aptitud_agricola_has,
           c.aptitud_ganadera_cria_has, c.aptitud_ganadera_invernada_has,
           c.aptitud_ganadera_tambo_has, c.aptitud_ganadera_otros_has, c.valor_usd_ha] as unknown[]).map((v, j) => (
          <td key={j} style={j === 0 ? S.tdL : S.tdR}>{pending(v) ? <PendingBadge /> : (typeof v === "number" ? fmt(v) : String(v))}</td>
        ))}
        {extra}
      </tr>
    );
  }

  type GanCat = Record<string, unknown>;
  function GanTable({ cats }: { cats: [string, GanCat][] }) {
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead><tr>{["Categoría","Propias","Terceros","Compras","Ventas"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          {cats.map(([label2, cat], i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
              <td style={S.tdL}>{label2}</td>
              {(["propias","terceros","compras","ventas"] as const).map(k => (
                <td key={k} style={S.tdR}>{pending(cat[k]) ? <PendingBadge /> : fmt(cat[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function MaqSection({ label, items }: { label: string; items: Record<string, unknown>[] }) {
    if (!items?.length) return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", marginBottom: 4 }}>{label.toUpperCase()}</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr>{["Marca","Modelo","Año","Valor USD"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {items.map((m, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
                {(["marca","modelo","anio","valor_usd"] as const).map(k => (
                  <td key={k} style={k === "valor_usd" ? S.tdR : S.tdC}>{pending(m[k]) ? <PendingBadge /> : (k === "valor_usd" ? fmt(m[k]) : String(m[k]))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function PlanSiembra({ plan, title }: { plan: Record<string, unknown>[]; title: string }) {
    if (!plan?.length) return null;
    return (
      <div>
        <p style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", marginBottom: 4 }}>{title}</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 700 }}>
            <thead>
              <tr>
                {["Cultivo","Propia","Arren.","Aparc.","Rend.","Precio","Implant.","Prot.","Cosecha","Riego"].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {plan.map((p, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
                  <td style={S.tdL}>{pending(p.cultivo) ? <PendingBadge /> : String(p.cultivo)}</td>
                  {(["sup_propia_has","sup_arrendada_has","sup_aparceria_has","rendimiento_tn_ha","precio_usd_tn",
                     "gastos_implantacion_usd_ha","gastos_proteccion_usd_ha","gastos_cosecha_usd_ha"] as const).map(k => (
                    <td key={k} style={S.tdR}>{pending(p[k]) ? <PendingBadge /> : fmt(p[k])}</td>
                  ))}
                  <td style={S.tdC}>{p.riego === null || p.riego === undefined ? <PendingBadge /> : (p.riego ? "SÍ" : "NO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

      {/* Progress bar */}
      <div style={{ marginBottom: 16, padding: "14px 18px", borderRadius: 12, backgroundColor: pctBg, border: `1px solid ${pctColor}30` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: pctColor }}>Completitud del formulario CREA</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: pctColor }}>{pct}%</span>
        </div>
        <div style={{ height: 10, backgroundColor: "#E8E5DE", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, backgroundColor: pctColor, borderRadius: 99, transition: "width 0.5s ease" }} />
        </div>
        {d.nota_general && <p style={{ marginTop: 8, fontSize: 11, color: "#6B6560", lineHeight: 1.5 }}>{d.nota_general}</p>}
      </div>

      {/* 1. Datos Generales */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader label="1. Datos Generales" skey="datos_generales" />
        <SectionBody skey="datos_generales">
          {[
            ["Razón Social",       dg.razon_social],
            ["CUIT",               dg.cuit],
            ["Domicilio",          dg.domicilio],
            ["Localidad",          dg.localidad],
            ["Provincia",          dg.provincia],
            ["Actividad",          dg.actividad],
            ["Campaña Actual",     dg.campana_actual],
            ["Campaña Proyectada", dg.campana_proyectada],
            ["Capital Social ($)", dg.capital_social],
          ].map(([l, v], i) => <LabelRow key={i} label={String(l)} value={v} idx={i} />)}
        </SectionBody>
      </div>

      {/* 2. Campos */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader label="2. Campos" skey="campos" badge={!propios.length && !arrendados.length ? "Sin datos" : undefined} />
        <SectionBody skey="campos">
          {propios.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", marginBottom: 4 }}>CAMPOS PROPIOS</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 700 }}>
                  <thead><tr>{[...camposHdrs, "USD/ha"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>{propios.map((c, i) => <CampoRow key={i} c={c} />)}</tbody>
                </table>
              </div>
            </div>
          ) : <p style={{ color: "#92680A", fontSize: 12, fontStyle: "italic", marginBottom: 8 }}>No se detectaron campos propios. Subí un inventario o memoria descriptiva.</p>}
          {arrendados.length > 0 && (
            <div>
              <p style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", marginBottom: 4 }}>CAMPOS ARRENDADOS</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 800 }}>
                  <thead><tr>{[...camposHdrs, "USD/ha", "Arriendo USD/ha"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>{arrendados.map((c, i) => <CampoRow key={i} c={c} extra={<td style={S.tdR}>{pending(c.valor_arriendo_usd_ha) ? <PendingBadge /> : fmt(c.valor_arriendo_usd_ha)}</td>} />)}</tbody>
                </table>
              </div>
            </div>
          )}
        </SectionBody>
      </div>

      {/* 3. Agricultura */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader label="3. Agricultura" skey="agricultura" badge={agri.disponible ? undefined : "Sin datos"} />
        <SectionBody skey="agricultura">
          {agri.disponible ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {agri.ventas_por_cultivo?.length > 0 && (
                <div>
                  <p style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", marginBottom: 4 }}>VENTAS POR CULTIVO (del Balance)</p>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead><tr>{["Cultivo","Monto Actual ($)","Monto Anterior ($)"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {agri.ventas_por_cultivo.map((v: { cultivo: string; monto_actual: unknown; monto_anterior: unknown }, i: number) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
                          <td style={S.tdL}>{v.cultivo}</td>
                          <td style={S.tdR}>{pending(v.monto_actual) ? <PendingBadge /> : fmt(v.monto_actual)}</td>
                          <td style={S.tdR}>{pending(v.monto_anterior) ? <PendingBadge /> : fmt(v.monto_anterior)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <PlanSiembra plan={agri.plan_siembra_actual ?? []} title="PLAN DE SIEMBRA — CAMPAÑA ACTUAL" />
              <PlanSiembra plan={agri.plan_siembra_proyectado ?? []} title="PLAN DE SIEMBRA — CAMPAÑA PROYECTADA" />
              <div>
                <p style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", marginBottom: 4 }}>ALMACENAJE</p>
                {[["Planta Propia (tn)", agri.almacenaje?.planta_propia_tn],
                  ["Acopiador (tn)",     agri.almacenaje?.acopiador_tn],
                  ["Silo Bolsa (tn)",    agri.almacenaje?.silo_bolsa_tn]
                ].map(([l, v], i) => <LabelRow key={i} label={String(l)} value={v} idx={i} />)}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", marginBottom: 4 }}>LABORES</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead><tr>{["Labor","Propio %","Contratado %"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {([["Roturación", agri.labores?.roturacion_propia_pct, agri.labores?.roturacion_contratada_pct],
                       ["Siembra",    agri.labores?.siembra_propia_pct,    agri.labores?.siembra_contratada_pct],
                       ["Protección", agri.labores?.proteccion_propia_pct, agri.labores?.proteccion_contratada_pct],
                       ["Cosecha",    agri.labores?.cosecha_propia_pct,    agri.labores?.cosecha_contratada_pct],
                    ] as [string, unknown, unknown][]).map(([l, p, c], i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
                        <td style={S.tdL}>{l}</td>
                        <td style={S.tdR}>{pending(p) ? <PendingBadge /> : fmtPct(p)}</td>
                        <td style={S.tdR}>{pending(c) ? <PendingBadge /> : fmtPct(c)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : <p style={{ color: "#92680A", fontSize: 12, fontStyle: "italic" }}>No se detectó información agrícola en los documentos.</p>}
        </SectionBody>
      </div>

      {/* 4. Maquinaria */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader label="4. Maquinaria y Bienes de Uso" skey="maquinaria" badge={maq.disponible ? undefined : "Sin datos"} />
        <SectionBody skey="maquinaria">
          {(maq.bienes_de_uso_total !== null && maq.bienes_de_uso_total !== undefined) && (
            <div style={{ marginBottom: 10 }}><LabelRow label="Total Bienes de Uso ($)" value={maq.bienes_de_uso_total} /></div>
          )}
          {maq.nota && <p style={{ color: "#92680A", fontSize: 11, fontStyle: "italic", marginBottom: 10 }}>{maq.nota}</p>}
          <MaqSection label="Tractores"      items={maq.tractores      ?? []} />
          <MaqSection label="Sembradoras"    items={maq.sembradoras    ?? []} />
          <MaqSection label="Pulverizadoras" items={maq.pulverizadoras ?? []} />
          <MaqSection label="Cosechadoras"   items={maq.cosechadoras   ?? []} />
          <MaqSection label="Otros"          items={maq.otros          ?? []} />
          {!maq.disponible && <p style={{ color: "#92680A", fontSize: 12, fontStyle: "italic" }}>No se detectó información de maquinaria. Subí un inventario de bienes.</p>}
        </SectionBody>
      </div>

      {/* 5. Ganadería */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader label="5. Ganadería" skey="ganaderia" badge={gan.disponible ? undefined : "Sin datos"} />
        <SectionBody skey="ganaderia">
          {gan.disponible ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {gan.cria?.disponible && (
                <div>
                  <p style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", marginBottom: 4 }}>CRÍA</p>
                  <GanTable cats={[["Vacas",gan.cria.vacas ?? {}],["Vacas c/Preñez",gan.cria.vacas_prenadas ?? {}],
                    ["Vaquillonas 2-3",gan.cria.vaquillonas_2_3 ?? {}],["Vaquillonas 1-2",gan.cria.vaquillonas_1_2 ?? {}],
                    ["Terneros/as",gan.cria.terneros ?? {}],["Toros",gan.cria.toros ?? {}]] as [string, GanCat][]} />
                </div>
              )}
              {gan.invernada?.disponible && (
                <div>
                  <p style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", marginBottom: 4 }}>INVERNADA</p>
                  <GanTable cats={[["Novillo 2-3",gan.invernada.novillo_2_3 ?? {}],["Novillo 1-2",gan.invernada.novillo_1_2 ?? {}],
                    ["Vaquillonas",gan.invernada.vaquillonas ?? {}],["Terneros",gan.invernada.terneros ?? {}]] as [string, GanCat][]} />
                </div>
              )}
              {gan.tambo?.disponible && (
                <div>
                  <p style={{ fontWeight: 700, fontSize: 11, color: "#3D7A1C", marginBottom: 4 }}>TAMBO</p>
                  <GanTable cats={[["Vaca Ordeñe",gan.tambo.vaca_ordene ?? {}],["Vaca Seca",gan.tambo.vaca_seca ?? {}],
                    ["Vaquillona Servicio",gan.tambo.vaquillona_servicio ?? {}],["Terneras",gan.tambo.terneras ?? {}]] as [string, GanCat][]} />
                </div>
              )}
            </div>
          ) : <p style={{ color: "#92680A", fontSize: 12, fontStyle: "italic" }}>No se detectó información ganadera. Subí planillas de stock y registros ganaderos.</p>}
        </SectionBody>
      </div>

      {/* 6. Recursos Forrajeros */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader label="6. Recursos Forrajeros" skey="recursos" badge={Object.values(rf).every(v => v === null) ? "Sin datos" : undefined} />
        <SectionBody skey="recursos">
          {[["Pasturas Implantadas (ha)", rf.pasturas_implantadas_has],
            ["Pasturas en Producción (ha)", rf.pasturas_produccion_has],
            ["Pasturas Degradadas (ha)", rf.pasturas_degradadas_has],
            ["Campo Natural Bueno (ha)", rf.campo_natural_bueno_has],
            ["Campo Natural Regular (ha)", rf.campo_natural_regular_has],
            ["Verdeo Invierno (ha)", rf.verdeo_invierno_has],
            ["Verdeo Verano (ha)", rf.verdeo_verano_has],
          ].map(([l, v], i) => <LabelRow key={i} label={String(l)} value={v} idx={i} />)}
        </SectionBody>
      </div>

      {/* 7. Gastos Indirectos */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader label="7. Gastos Indirectos (U$S/Año)" skey="gastos" />
        <SectionBody skey="gastos">
          {[["Administración", gi.administracion_usd_anio],["Estructura", gi.estructura_usd_anio],
            ["Impuestos",      gi.impuestos_usd_anio],     ["Total",      gi.total_usd_anio],
          ].map(([l, v], i) => <LabelRow key={i} label={String(l)} value={v} idx={i} />)}
        </SectionBody>
      </div>

      {/* 8. Pasivos */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader label="8. Pasivos por Entidad" skey="pasivos" />
        <SectionBody skey="pasivos">
          {pas.deudas?.length > 0 ? (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr>{["Entidad","Moneda","Monto","Plazo"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {pas.deudas.map((p: Record<string, unknown>, i: number) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
                      <td style={S.tdL}>{pending(p.entidad) ? <PendingBadge /> : String(p.entidad)}</td>
                      <td style={S.tdC}>{pending(p.moneda) ? <PendingBadge /> : String(p.moneda)}</td>
                      <td style={S.tdR}>{pending(p.monto) ? <PendingBadge /> : fmt(p.monto)}</td>
                      <td style={S.tdC}>{pending(p.plazo) ? <PendingBadge /> : String(p.plazo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 8 }}><LabelRow label="Total Pasivo ($)" value={pas.total_pasivo} /></div>
            </>
          ) : <p style={{ color: "#92680A", fontSize: 12, fontStyle: "italic" }}>No se detectaron pasivos en los documentos.</p>}
        </SectionBody>
      </div>

      {/* 9. Situación Patrimonial */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader label="9. Situación Patrimonial — Resumen" skey="patrimonial" />
        <SectionBody skey="patrimonial">
          {[["Total Activo ($)",sp.total_activo],["Total Pasivo ($)",sp.total_pasivo],
            ["Patrimonio Neto ($)",sp.patrimonio_neto],["Resultado del Ejercicio ($)",sp.resultado_ejercicio],
          ].map(([l, v], i) => <LabelRow key={i} label={String(l)} value={v} idx={i} />)}
        </SectionBody>
      </div>

      {/* 10. Participación Accionaria */}
      <div style={{ marginBottom: 4 }}>
        <SectionHeader label="10. Participación Accionaria" skey="accionaria" badge={pa.disponible ? undefined : "Sin datos"} />
        <SectionBody skey="accionaria">
          {pa.disponible && pa.socios?.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>{["Apellido y Nombre","DNI / CUIT","% Participación"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {pa.socios.map((s: Record<string, unknown>, i: number) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
                    <td style={S.tdL}>{pending(s.apellido_nombre) ? <PendingBadge /> : String(s.apellido_nombre)}</td>
                    <td style={S.tdC}>{pending(s.dni) ? <PendingBadge /> : String(s.dni)}</td>
                    <td style={S.tdR}>{pending(s.participacion_pct) ? <PendingBadge /> : fmtPct(s.participacion_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: "#92680A", fontSize: 12, fontStyle: "italic" }}>No se detectó información accionaria. Subí el estatuto o acta de constitución.</p>}
        </SectionBody>
      </div>

      {/* Datos Faltantes */}
      {faltantes.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <SectionHeader label={`Datos faltantes (${faltantes.length})`} skey="faltantes" badge={`${faltantes.length} pendientes`} />
          <SectionBody skey="faltantes">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {faltantes.map((f, i) => (
                <div key={i} style={{ backgroundColor: "#FFFBEB", border: "1px solid #F5D87A", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#92680A", backgroundColor: "#FEF3CD", padding: "1px 8px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {f.seccion}
                    </span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>{f.dato}</p>
                      <p style={{ fontSize: 11, color: "#6B6560", margin: "2px 0 0", fontStyle: "italic" }}>→ {f.documento_sugerido}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionBody>
        </div>
      )}
    </div>
  );
}

// ─── Tabla Punto de Equilibrio ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BreakEvenTable({ d }: { d: any }) {
  const cultivos: unknown[] = d.cultivos ?? [];
  const res = d.resumen ?? {};
  const tabla: unknown[][] = d.tabla_sensibilidad ?? [];
  const { rowBg, reset } = useAlt();

  function MargenBadge({ v }: { v: unknown }) {
    const n = toNum(v);
    const positive = n >= 0;
    return (
      <span style={{
        display: "inline-block",
        padding: "2px 7px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        backgroundColor: positive ? "#EBF3E8" : "#FDE8E8",
        color: positive ? "#3D7A1C" : "#C0392B",
      }}>
        {positive ? "+" : ""}{fmtPct(v)}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Resumen ── */}
      <div>
        <div style={{ ...S.section, borderRadius: "8px 8px 0 0", marginBottom: 0 }}>RESUMEN GENERAL</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {reset()}
            {([
              ["Superficie total", res.superficie_total_ha, "ha"],
              ["Costos fijos totales", res.costos_fijos_total_usd, "USD"],
              ["Costos variables totales", res.costos_variables_total_usd, "USD"],
              ["Costo total", res.costo_total_usd, "USD"],
              ["Ingreso real", res.ingreso_real_usd, "USD"],
            ] as [string, unknown, string][]).map(([label, val, unit]) => (
              <tr key={label} style={rowBg()}>
                <td style={S.tdL}>{label}</td>
                <td style={{ ...S.tdR, color: "#9B9488", fontSize: 10 }}>{unit}</td>
                <td style={S.tdR}>{val !== null && val !== undefined ? fmt(val) : <span style={{ color: "#B8922A", fontWeight: 700, fontSize: 10 }}>PENDIENTE</span>}</td>
              </tr>
            ))}
            <tr>
              <td style={S.total}>Margen sobre Break-Even</td>
              <td style={{ ...S.totalR, color: "#9B9488", fontSize: 10 }}>%</td>
              <td style={S.totalR}>
                {res.margen_sobre_be_pct !== null && res.margen_sobre_be_pct !== undefined
                  ? <MargenBadge v={res.margen_sobre_be_pct} />
                  : <span style={{ color: "#B8922A", fontWeight: 700, fontSize: 10 }}>PENDIENTE</span>
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Por cultivo ── */}
      {cultivos.length > 0 && (
        <div>
          <div style={{ ...S.section, borderRadius: "8px 8px 0 0" }}>BREAK-EVEN POR CULTIVO</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>Cultivo</th>
                <th style={S.thR}>Sup. (ha)</th>
                <th style={S.thR}>CF (USD/ha)</th>
                <th style={S.thR}>CV (USD/ha)</th>
                <th style={S.thR}>CT (USD/ha)</th>
                <th style={S.thR}>Precio (USD/tn)</th>
                <th style={S.thR}>BE Rinde (tn/ha)</th>
                <th style={S.thR}>Rinde real (tn/ha)</th>
                <th style={S.thC}>Margen</th>
              </tr>
            </thead>
            <tbody>
              {reset()}
              {cultivos.map((c: unknown, i) => {
                const cu = c as Record<string, unknown>;
                const beRinde = cu.be_rinde_tn_ha as number | null;
                const rinde   = cu.rinde_actual_tn_ha as number | null;
                const ok = beRinde !== null && rinde !== null ? rinde >= beRinde : null;
                return (
                  <tr key={i} style={rowBg()}>
                    <td style={{ ...S.tdL, fontWeight: 600 }}>{String(cu.cultivo ?? "—")}</td>
                    <td style={S.tdR}>{cu.superficie_ha !== null ? fmt(cu.superficie_ha) : <span style={{ color: "#B8922A", fontSize: 10 }}>—</span>}</td>
                    <td style={S.tdR}>{cu.costos_fijos_usd_ha !== null ? fmt(cu.costos_fijos_usd_ha) : <span style={{ color: "#B8922A", fontSize: 10 }}>—</span>}</td>
                    <td style={S.tdR}>{cu.costos_variables_usd_ha !== null ? fmt(cu.costos_variables_usd_ha) : <span style={{ color: "#B8922A", fontSize: 10 }}>—</span>}</td>
                    <td style={S.tdR}>{cu.costo_total_usd_ha !== null ? fmt(cu.costo_total_usd_ha) : <span style={{ color: "#B8922A", fontSize: 10 }}>—</span>}</td>
                    <td style={S.tdR}>{cu.precio_usd_tn !== null ? fmt(cu.precio_usd_tn) : <span style={{ color: "#B8922A", fontSize: 10 }}>—</span>}</td>
                    <td style={{
                      ...S.tdR,
                      color: ok === null ? "#1A1A1A" : ok ? "#3D7A1C" : "#C0392B",
                      fontWeight: 700,
                    }}>
                      {beRinde !== null ? fmt(beRinde) : <span style={{ color: "#B8922A", fontSize: 10 }}>—</span>}
                    </td>
                    <td style={S.tdR}>{rinde !== null ? fmt(rinde) : <span style={{ color: "#B8922A", fontSize: 10 }}>—</span>}</td>
                    <td style={{ ...S.tdC, padding: "6px 12px" }}>
                      {cu.margen_sobre_be_pct !== null && cu.margen_sobre_be_pct !== undefined
                        ? <MargenBadge v={cu.margen_sobre_be_pct} />
                        : <span style={{ color: "#B8922A", fontSize: 10 }}>—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tabla de sensibilidad ── */}
      {tabla.length > 1 && (
        <div>
          <div style={{ ...S.section, borderRadius: "8px 8px 0 0" }}>SENSIBILIDAD — PRECIO vs. RINDE (Margen USD/ha)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <tbody>
                {tabla.map((row: unknown[], ri) => (
                  <tr key={ri}>
                    {(row as unknown[]).map((cell: unknown, ci) => {
                      const isHeader = ri === 0 || ci === 0;
                      const n = typeof cell === "number" ? cell : null;
                      const bg = isHeader
                        ? "#1A3311"
                        : n === null ? "#FAFAF8"
                        : n >= 0 ? "#EBF3E8" : "#FDE8E8";
                      const color = isHeader ? "#fff"
                        : n === null ? "#9B9488"
                        : n >= 0 ? "#3D7A1C" : "#C0392B";
                      return (
                        <td key={ci} style={{
                          padding: "7px 10px",
                          textAlign: ci === 0 ? "left" : "center",
                          fontSize: 11,
                          fontWeight: isHeader ? 700 : ci === 0 ? 600 : 400,
                          backgroundColor: bg,
                          color,
                          border: "1px solid #E8E5DE",
                        }}>
                          {n !== null ? (ri === 0 || ci === 0 ? String(cell) : fmt(n)) : String(cell ?? "—")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Datos faltantes ── */}
      {(d.datos_faltantes ?? []).length > 0 && (
        <div>
          <div style={{ ...S.section, borderRadius: "8px 8px 0 0", backgroundColor: "#B8922A" }}>DATOS FALTANTES</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...S.th, backgroundColor: "#92680A" }}>Sección</th>
                <th style={{ ...S.th, backgroundColor: "#92680A" }}>Dato faltante</th>
                <th style={{ ...S.th, backgroundColor: "#92680A" }}>Documento sugerido</th>
              </tr>
            </thead>
            <tbody>
              {reset()}
              {(d.datos_faltantes as { seccion: string; dato: string; documento_sugerido: string }[]).map((item, i) => (
                <tr key={i} style={rowBg()}>
                  <td style={{ ...S.tdL, fontWeight: 600, color: "#92680A" }}>{item.seccion}</td>
                  <td style={S.tdL}>{item.dato}</td>
                  <td style={{ ...S.tdL, color: "#6B6560" }}>{item.documento_sugerido}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ReportTable({ reportId, d }: { reportId: string; d: any }) {
  if (reportId === "margen-bruto")          return <MargenBrutoTable d={d} />;
  if (reportId === "ratios")                return <RatiosTable d={d} />;
  if (reportId === "bridge")                return <BridgeTable d={d} />;
  if (reportId === "break-even")            return <BreakEvenTable d={d} />;
  if (reportId === "calificacion-bancaria") return <CalificacionBancariaTable d={d} />;
  return <PatrimonialTable d={d} />;
}

// ─── Download dropdown ────────────────────────────────────────────────────────
function ModalDownloadDropdown({ report }: { report: GeneratedReport }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleExcel = async () => {
    setOpen(false);
    setDownloading(true);
    try {
      const res = await fetch(report.downloadPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: report.data }),
      });
      if (!res.ok) throw new Error("Error al generar el Excel");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.reportId}-${(report.data?.empresa ?? "empresa").replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setDownloading(false); }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={downloading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer"
        style={{ backgroundColor: "#D4AD3C", color: "#1A1A1A" }}
      >
        {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Descargar
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-52 rounded-xl border shadow-xl overflow-hidden z-50"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E5DE", top: "100%" }}
        >
          <button
            onClick={handleExcel}
            className="w-full flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 text-left"
            style={{ color: "#1A1A1A", borderBottom: "1px solid #F0EDE6" }}
          >
            <FileSpreadsheet size={15} style={{ color: "#1E7E34" }} />
            <div>
              <p className="font-medium text-xs">Descargar Excel</p>
              <p className="text-[10px]" style={{ color: "#9B9488" }}>.xlsx con todas las hojas</p>
            </div>
          </button>
          <button
            onClick={() => { setOpen(false); generateReportPDF(report); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 text-left"
            style={{ color: "#1A1A1A" }}
          >
            <FilePdf size={15} style={{ color: "#C0392B" }} />
            <div>
              <p className="font-medium text-xs">Descargar PDF</p>
              <p className="text-[10px]" style={{ color: "#9B9488" }}>Formato profesional A4</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
type Props = { report: GeneratedReport; onClose: () => void };

export default function ReportPreviewModal({ report, onClose }: Props) {
  const d = report.data;

  const genDate = new Date(report.generatedAt).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(10,20,5,0.6)", backdropFilter: "blur(3px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col bg-white rounded-2xl shadow-2xl mx-4 my-4 overflow-hidden"
        style={{ flex: 1, maxHeight: "calc(100vh - 32px)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0 border-b"
          style={{ backgroundColor: "#1A3311", borderColor: "#0D1F08" }}
        >
          <div>
            <h2 className="font-semibold text-base text-white">{report.title}</h2>
            <p className="text-xs mt-0.5" style={{ color: "#A8C5A0" }}>
              {d.empresa ?? ""}{d.cuit ? ` · ${d.cuit}` : ""} · Generado el {genDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ModalDownloadDropdown report={report} />
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: "#A8C5A0" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Info bar */}
        <div
          className="flex flex-wrap items-center gap-6 px-6 py-3 shrink-0 border-b text-xs"
          style={{ backgroundColor: "#F9F8F4", borderColor: "#E8E5DE" }}
        >
          {[
            { label: "Empresa",   value: d.empresa   ?? "—" },
            { label: "CUIT",      value: d.cuit      ?? "—" },
            { label: "Ejercicio", value: d.ejercicio ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>{label}: </span>
              <span className="font-medium" style={{ color: "#1A1A1A" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-5" style={{ backgroundColor: "#F9F8F4" }}>
          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: "#E8E5DE", maxWidth: 900, margin: "0 auto" }}
          >
            <ReportTable reportId={report.reportId} d={d} />
          </div>
          <p className="text-center mt-4 text-xs" style={{ color: "#B0A99F" }}>
            Generado por AgroForma · {genDate}
          </p>
        </div>
      </div>
    </div>
  );
}
