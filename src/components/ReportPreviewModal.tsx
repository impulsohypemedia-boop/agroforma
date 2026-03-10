"use client";

import { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
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

// ─── Dispatcher ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ReportTable({ reportId, d }: { reportId: string; d: any }) {
  if (reportId === "margen-bruto") return <MargenBrutoTable d={d} />;
  if (reportId === "ratios")       return <RatiosTable d={d} />;
  if (reportId === "bridge")       return <BridgeTable d={d} />;
  return <PatrimonialTable d={d} />;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
type Props = { report: GeneratedReport; onClose: () => void };

export default function ReportPreviewModal({ report, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const d = report.data;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(report.downloadPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: d }),
      });
      if (!res.ok) throw new Error("Error al generar el Excel");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.reportId}-${(d.empresa ?? "empresa").replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setDownloading(false); }
  };

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
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#D4AD3C", color: "#1A1A1A" }}
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Descargar Excel
            </button>
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
