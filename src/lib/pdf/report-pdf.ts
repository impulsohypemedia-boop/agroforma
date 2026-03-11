// Client-side PDF generation for AgroForma reports
// Only import in "use client" components, called from event handlers

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { GeneratedReport } from "@/types/report";

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  dark:  [26,  51,  17] as [number, number, number],   // #1A3311
  mid:   [61, 122,  28] as [number, number, number],   // #3D7A1C
  light: [235, 243, 232] as [number, number, number],  // #EBF3E8
  amber: [212, 173,  60] as [number, number, number],  // #D4AD3C
  white: [255, 255, 255] as [number, number, number],
  grey:  [250, 250, 248] as [number, number, number],  // #FAFAF8
  text:  [26,  26,  26]  as [number, number, number],  // #1A1A1A
  muted: [155, 148, 136] as [number, number, number],  // #9B9488
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: unknown): string {
  if (n === null || n === undefined) return "—";
  const v = typeof n === "number" ? n : parseFloat(String(n));
  if (isNaN(v)) return "—";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(v);
}
function fmtPct(n: unknown): string {
  const v = typeof n === "number" ? n : parseFloat(String(n));
  if (isNaN(v)) return "—";
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v) + "%";
}
function safe(v: unknown): string {
  if (v === null || v === undefined) return "—";
  return String(v);
}

// ─── Header ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addHeader(doc: jsPDF, d: any, title: string) {
  const pw = doc.internal.pageSize.getWidth();

  // Background bar
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, pw, 22, "F");

  // AgroForma · IA
  doc.setTextColor(...C.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("AgroForma", 14, 10);
  doc.setTextColor(...C.amber);
  doc.text(".", 14 + doc.getTextWidth("AgroForma"), 10);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("IA", 14 + doc.getTextWidth("AgroForma.") + 1, 10);

  // Report title (right aligned)
  doc.setTextColor(...C.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(title, pw - 14, 10, { align: "right" });

  // Company info bar
  doc.setFillColor(...C.mid);
  doc.rect(0, 22, pw, 10, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const empresa = safe(d?.empresa);
  const cuit    = d?.cuit ? ` · CUIT ${d.cuit}` : "";
  const fecha   = new Date().toLocaleDateString("es-AR");
  doc.text(`${empresa}${cuit}`, 14, 29);
  doc.text(`Generado: ${fecha}`, pw - 14, 29, { align: "right" });

  return 38; // return starting Y for content
}

// ─── Section title ────────────────────────────────────────────────────────────
function sectionTitle(doc: jsPDF, text: string, y: number): number {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.mid);
  doc.rect(0, y, pw, 7, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(text, 14, y + 5);
  return y + 7;
}

function lastY(doc: jsPDF): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (doc as any).lastAutoTable?.finalY ?? doc.internal.pageSize.getHeight() / 2;
}

// ─── Table style ──────────────────────────────────────────────────────────────
const HEAD = { fillColor: C.dark, textColor: C.white, fontStyle: "bold" as const, fontSize: 8 };
const ALT  = { fillColor: C.grey };
const BODY = { fontSize: 8, textColor: C.text };

// ─── Per-report renderers ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPatrimonial(doc: jsPDF, d: any, startY: number) {
  const ac  = d.activo_corriente ?? {};
  const acA = d.valores_periodo_anterior?.activo_corriente ?? {};
  const anc = d.activo_no_corriente ?? {};
  const ancA = d.valores_periodo_anterior?.activo_no_corriente ?? {};
  const pc  = d.pasivo_corriente ?? {};
  const pcA = d.valores_periodo_anterior?.pasivo_corriente ?? {};
  const pnc = d.pasivo_no_corriente ?? {};
  const pncA = d.valores_periodo_anterior?.pasivo_no_corriente ?? {};
  const colH = [["Concepto", d.periodo_actual ?? "Actual", d.periodo_anterior ?? "Anterior"]];

  let y = sectionTitle(doc, "ACTIVO CORRIENTE", startY);
  const acItems = [
    ["Disponibilidades", fmtNum(ac.disponibilidades), fmtNum(acA.disponibilidades)],
    ["Créditos por ventas", fmtNum(ac.creditos_por_ventas), fmtNum(acA.creditos_por_ventas)],
    ["Créditos impositivos", fmtNum(ac.creditos_impositivos), fmtNum(acA.creditos_impositivos)],
    ["Bienes de cambio", fmtNum(ac.bienes_de_cambio), fmtNum(acA.bienes_de_cambio)],
    ["Otros activos corrientes", fmtNum(ac.otros_activos_corrientes ?? ac.otros), fmtNum(acA.otros_activos_corrientes ?? acA.otros)],
    [{ content: "TOTAL ACTIVO CORRIENTE", styles: { fontStyle: "bold" as const } }, fmtNum(ac.total), fmtNum(acA.total)],
  ];
  autoTable(doc, { startY: y, head: colH, body: acItems, headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 } });

  y = lastY(doc) + 4;
  y = sectionTitle(doc, "ACTIVO NO CORRIENTE", y);
  const ancItems = [
    ["Bienes de uso", fmtNum(anc.bienes_de_uso), fmtNum(ancA.bienes_de_uso)],
    ["Inversiones", fmtNum(anc.inversiones), fmtNum(ancA.inversiones)],
    [{ content: "TOTAL ACTIVO NO CORRIENTE", styles: { fontStyle: "bold" as const } }, fmtNum(anc.total), fmtNum(ancA.total)],
  ];
  autoTable(doc, { startY: y, head: colH, body: ancItems, headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 } });

  y = lastY(doc) + 4;
  y = sectionTitle(doc, "PASIVO CORRIENTE", y);
  const pcItems = [
    ["Deudas comerciales", fmtNum(pc.deudas_comerciales), fmtNum(pcA.deudas_comerciales)],
    ["Deudas financieras", fmtNum(pc.deudas_financieras), fmtNum(pcA.deudas_financieras)],
    [{ content: "TOTAL PASIVO CORRIENTE", styles: { fontStyle: "bold" as const } }, fmtNum(pc.total), fmtNum(pcA.total)],
  ];
  autoTable(doc, { startY: y, head: colH, body: pcItems, headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 } });

  y = lastY(doc) + 4;
  y = sectionTitle(doc, "PASIVO NO CORRIENTE", y);
  const pncItems = [
    ["Deudas financieras LP", fmtNum(pnc.deudas_financieras_lp), fmtNum(pncA.deudas_financieras_lp)],
    [{ content: "TOTAL PASIVO NO CORRIENTE", styles: { fontStyle: "bold" as const } }, fmtNum(pnc.total), fmtNum(pncA.total)],
  ];
  autoTable(doc, { startY: y, head: colH, body: pncItems, headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 } });

  y = lastY(doc) + 4;
  const pnItems = [
    [{ content: "PATRIMONIO NETO", styles: { fontStyle: "bold" as const, fillColor: C.dark, textColor: C.white } },
     { content: fmtNum(d.patrimonio_neto), styles: { fontStyle: "bold" as const, fillColor: C.dark, textColor: C.white } },
     { content: fmtNum(d.valores_periodo_anterior?.patrimonio_neto), styles: { fontStyle: "bold" as const, fillColor: C.dark, textColor: C.white } }],
  ];
  autoTable(doc, { startY: y, body: pnItems, margin: { left: 14, right: 14 }, bodyStyles: BODY });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderMargenBruto(doc: jsPDF, d: any, startY: number) {
  const cultivos: unknown[] = d.cultivos ?? [];
  let y = sectionTitle(doc, "MARGEN BRUTO POR CULTIVO", startY);
  const head = [["Cultivo", "Superficie (ha)", "Ingresos", "Costos Directos", "Gastos Comercializ.", "Margen Bruto"]];
  const body = cultivos.map((c: unknown) => {
    const cu = c as Record<string, unknown>;
    return [safe(cu.cultivo), fmtNum(cu.superficie_ha), fmtNum(cu.ingresos_total), fmtNum(cu.costos_directos_total), fmtNum(cu.gastos_comercializacion), fmtNum(cu.margen_bruto)];
  });
  if (body.length === 0) body.push(["Sin datos", "—", "—", "—", "—", "—"]);
  autoTable(doc, { startY: y, head, body, headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 } });

  if (d.resultado_ejercicio !== null && d.resultado_ejercicio !== undefined) {
    y = lastY(doc) + 4;
    autoTable(doc, {
      startY: y,
      body: [[{ content: "Resultado del Ejercicio", styles: { fontStyle: "bold" as const } }, fmtNum(d.resultado_ejercicio)]],
      margin: { left: 14, right: 14 }, bodyStyles: { ...BODY, fontStyle: "bold" as const, fillColor: C.dark, textColor: C.white },
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderRatios(doc: jsPDF, d: any, startY: number) {
  const ratios: unknown[] = d.ratios ?? [];
  let y = sectionTitle(doc, "RATIOS E INDICADORES", startY);
  const head = [["Ratio", "Categoría", "Actual", "Anterior", "Variación"]];
  const body = ratios.map((r: unknown) => {
    const ri = r as Record<string, unknown>;
    const unit = safe(ri.unidad);
    const fmtV = (v: unknown) => v === null || v === undefined ? "—" : unit === "pct" ? fmtPct(v) : `${fmtNum(v)}${unit === "veces" ? "x" : ""}`;
    return [safe(ri.nombre), safe(ri.categoria), fmtV(ri.valor_actual), fmtV(ri.valor_anterior), fmtV(ri.variacion)];
  });
  if (body.length === 0) body.push(["Sin datos", "—", "—", "—", "—"]);
  autoTable(doc, { startY: y, head, body, headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 } });
  y = lastY(doc) + 4;
  if (d.nota) {
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(`Nota: ${d.nota}`, 14, y);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBridge(doc: jsPDF, d: any, startY: number) {
  let y = sectionTitle(doc, "BRIDGE DE RESULTADOS", startY);
  autoTable(doc, {
    startY: y,
    body: [
      ["Resultado anterior", fmtNum(d.resultado_anterior)],
      ["Resultado actual",   fmtNum(d.resultado_actual)],
      ["Variación total",    fmtNum(d.variacion_total)],
    ],
    headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 },
  });

  y = lastY(doc) + 4;
  const items: unknown[] = d.items ?? [];
  const head = [["Concepto", "Impacto", "Descripción"]];
  const body = items.map((i: unknown) => {
    const it = i as Record<string, unknown>;
    return [safe(it.concepto), fmtNum(it.impacto), safe(it.descripcion)];
  });
  if (body.length) {
    y = sectionTitle(doc, "DESCOMPOSICIÓN", y);
    autoTable(doc, { startY: y, head, body, headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 } });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBreakEven(doc: jsPDF, d: any, startY: number) {
  let y = sectionTitle(doc, "PUNTO DE EQUILIBRIO POR CULTIVO", startY);
  const cultivos: unknown[] = d.cultivos ?? [];
  const head = [["Cultivo", "Costo Total (USD/ha)", "Precio (USD/tn)", "BE Rinde (tn/ha)", "Rinde Actual", "Margen %"]];
  const body = cultivos.map((c: unknown) => {
    const cu = c as Record<string, unknown>;
    return [safe(cu.cultivo), fmtNum(cu.costo_total_usd_ha), fmtNum(cu.precio_usd_tn), fmtNum(cu.be_rinde_tn_ha), fmtNum(cu.rinde_actual_tn_ha), fmtPct(cu.margen_sobre_be_pct)];
  });
  if (body.length === 0) body.push(["Sin datos", "—", "—", "—", "—", "—"]);
  autoTable(doc, { startY: y, head, body, headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 } });

  const res = d.resumen ?? {};
  y = lastY(doc) + 4;
  y = sectionTitle(doc, "RESUMEN", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["Superficie total", fmtNum(res.superficie_total_ha) + " ha"],
      ["Costo total",       fmtNum(res.costo_total_usd) + " USD"],
      ["Ingreso real",      fmtNum(res.ingreso_real_usd) + " USD"],
      ["Margen sobre BE",   fmtPct(res.margen_sobre_be_pct)],
    ],
    alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCalificacion(doc: jsPDF, d: any, startY: number) {
  const dg = d.datos_generales ?? {};
  let y = sectionTitle(doc, "DATOS GENERALES", startY);
  autoTable(doc, {
    startY: y,
    body: [
      ["Razón Social", safe(dg.razon_social)],
      ["CUIT", safe(dg.cuit)],
      ["Actividad", safe(dg.actividad)],
      ["Domicilio", [dg.domicilio, dg.localidad, dg.provincia].filter(Boolean).join(", ") || "—"],
      ["Capital Social", dg.capital_social ? fmtNum(dg.capital_social) : "—"],
      ["Campaña Actual", safe(dg.campana_actual)],
    ],
    alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 },
  });

  const sp = d.situacion_patrimonial_resumen ?? {};
  y = lastY(doc) + 4;
  y = sectionTitle(doc, "SITUACIÓN PATRIMONIAL", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["Total Activo",        fmtNum(sp.total_activo)],
      ["Total Pasivo",        fmtNum(sp.total_pasivo)],
      ["Patrimonio Neto",     fmtNum(sp.patrimonio_neto)],
      ["Resultado Ejercicio", fmtNum(sp.resultado_ejercicio)],
    ],
    alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 },
  });

  // Campos propios
  const campos: unknown[] = d.campos_propios ?? [];
  if (campos.length > 0) {
    y = lastY(doc) + 4;
    y = sectionTitle(doc, "CAMPOS PROPIOS", y);
    autoTable(doc, {
      startY: y,
      head: [["Nombre", "Provincia", "Sup. (ha)", "Valor USD/ha"]],
      body: campos.map((c: unknown) => {
        const ca = c as Record<string, unknown>;
        return [safe(ca.nombre), safe(ca.provincia), fmtNum(ca.superficie_has), fmtNum(ca.valor_usd_ha)];
      }),
      headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 },
    });
  }

  // Pasivos
  const deudas: unknown[] = d.pasivos?.deudas ?? [];
  if (deudas.length > 0) {
    y = lastY(doc) + 4;
    y = sectionTitle(doc, "PASIVOS — DEUDAS", y);
    autoTable(doc, {
      startY: y,
      head: [["Entidad", "Moneda", "Monto", "Plazo"]],
      body: deudas.map((dd: unknown) => {
        const de = dd as Record<string, unknown>;
        return [safe(de.entidad), safe(de.moneda), fmtNum(de.monto), safe(de.plazo)];
      }),
      headStyles: HEAD, alternateRowStyles: ALT, bodyStyles: BODY, margin: { left: 14, right: 14 },
    });
  }

  const completitud = d.completitud_pct ?? 0;
  y = lastY(doc) + 6;
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text(`Completitud del formulario: ${completitud}%`, 14, y);
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function generateReportPDF(report: GeneratedReport) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const d = report.data;

  const TITLES: Record<string, string> = {
    "situacion-patrimonial": "SITUACIÓN PATRIMONIAL",
    "margen-bruto":          "MARGEN BRUTO POR CULTIVO",
    "ratios":                "RATIOS E INDICADORES",
    "bridge":                "BRIDGE DE RESULTADOS",
    "break-even":            "PUNTO DE EQUILIBRIO",
    "calificacion-bancaria": "CALIFICACIÓN BANCARIA",
  };

  const title = TITLES[report.reportId] ?? report.title.toUpperCase();
  const startY = addHeader(doc, d, title);

  switch (report.reportId) {
    case "situacion-patrimonial": renderPatrimonial(doc, d, startY); break;
    case "margen-bruto":          renderMargenBruto(doc, d, startY); break;
    case "ratios":                renderRatios(doc, d, startY); break;
    case "bridge":                renderBridge(doc, d, startY); break;
    case "break-even":            renderBreakEven(doc, d, startY); break;
    case "calificacion-bancaria": renderCalificacion(doc, d, startY); break;
    default:
      doc.setFontSize(10);
      doc.setTextColor(...C.text);
      doc.text("Reporte sin previsualización específica.", 14, startY + 10);
  }

  // Footer on each page
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.setFillColor(...C.dark);
    doc.rect(0, ph - 10, pw, 10, "F");
    doc.setTextColor(...C.white);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("AgroForma · Herramienta de análisis agropecuario", 14, ph - 4);
    doc.text(`Página ${i} de ${totalPages}`, pw - 14, ph - 4, { align: "right" });
  }

  const filename = `${report.reportId}-${(d?.empresa ?? "empresa").replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
  doc.save(filename);
}

// ─── Chat message PDF ─────────────────────────────────────────────────────────
export function generateChatMessagePDF(content: string, empresa?: string | null) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, pw, 18, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("AgroForma", 14, 9);
  doc.setTextColor(...C.amber);
  doc.text(".", 14 + doc.getTextWidth("AgroForma"), 9);
  doc.setTextColor(...C.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Asistente IA${empresa ? ` · ${empresa}` : ""} · ${new Date().toLocaleDateString("es-AR")}`, pw - 14, 9, { align: "right" });

  // Strip markdown for plain text
  const plain = content
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^\|.*\|$/gm, "")    // remove table lines
    .replace(/^[-|: ]+$/gm, "")  // remove separator lines
    .trim();

  const lines = doc.splitTextToSize(plain, pw - 28);
  let y = 26;
  doc.setFontSize(9);
  doc.setTextColor(...C.text);
  doc.setFont("helvetica", "normal");

  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 14;
    }
    doc.text(line, 14, y);
    y += 5;
  }

  doc.save(`asistente-agroforma-${new Date().toISOString().split("T")[0]}.pdf`);
}
