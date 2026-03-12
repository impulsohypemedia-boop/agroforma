import ExcelJS from "exceljs";

const C = {
  darkGreen:  "FF1A3311",
  lightGreen: "FF3D7A1C",
  gold:       "FFD4AD3C",
  earth:      "FFB8922A",
  rowAlt:     "FFFAFAF8",
  white:      "FFFFFFFF",
  red:        "FFC0392B",
  green:      "FF1E7E34",
};

function fmtNum(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
}

// suppress unused warning — kept for future use
void fmtNum;

export async function generatePortfolioExcel(data: {
  empresas: { nombre: string; metrics: Record<string, number | null> }[];
  consolidado: Record<string, number>;
  aiAnalysis?: { insights_cruzados: string[]; oportunidades: string[]; riesgos_grupo: string[]; resumen: string } | null;
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const METRICS = [
    { key: "ventas_netas", label: "Ventas Netas" },
    { key: "resultado_neto", label: "Resultado Neto" },
    { key: "patrimonio_neto", label: "Patrimonio Neto" },
    { key: "total_activo", label: "Total Activo" },
    { key: "total_pasivo", label: "Total Pasivo" },
    { key: "margen_bruto_pct", label: "Margen Bruto %", isPct: true },
    { key: "margen_neto_pct", label: "Margen Neto %", isPct: true },
    { key: "roe_pct", label: "ROE %", isPct: true },
    { key: "roa_pct", label: "ROA %", isPct: true },
    { key: "liquidez_corriente", label: "Liquidez Corriente", isRatio: true },
    { key: "endeudamiento", label: "Endeudamiento", isRatio: true },
  ];

  // ── Sheet 1: Benchmark ──────────────────────────────────────────────────
  const bench = wb.addWorksheet("Benchmark");
  bench.columns = [
    { width: 25 },
    ...data.empresas.map(() => ({ width: 20 })),
    { width: 15 },
  ];

  // Title
  const titleRow = bench.addRow(["BENCHMARK DE PORTFOLIO — AgroForma"]);
  titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.darkGreen } };
  titleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 13 };
  bench.mergeCells(1, 1, 1, data.empresas.length + 2);
  titleRow.height = 32;

  // Header row
  const headerVals = ["Indicador", ...data.empresas.map(e => e.nombre), "Promedio"];
  const headerRow = bench.addRow(headerVals);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.lightGreen } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  headerRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  headerRow.height = 24;

  // Data rows
  METRICS.forEach((m, idx) => {
    const vals = data.empresas.map(e => e.metrics[m.key] ?? null);
    const validVals = vals.filter(v => v !== null) as number[];
    const avg = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : null;
    const best = validVals.length > 0 ? Math.max(...validVals) : null;
    const worst = validVals.length > 0 ? Math.min(...validVals) : null;

    const rowVals = [
      m.label,
      ...vals.map(v => v !== null ? v : "—"),
      avg !== null ? avg : "—",
    ];
    const row = bench.addRow(rowVals);
    row.getCell(1).font = { bold: true, size: 10 };
    row.height = 20;

    // Color best/worst
    vals.forEach((v, vi) => {
      if (v === null) return;
      const cell = row.getCell(vi + 2);
      if (v === best) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
      if (v === worst) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7DA" } };
      cell.alignment = { horizontal: "right" };
      if (m.isPct) cell.numFmt = "0.00%";
      else if (m.isRatio) cell.numFmt = "0.00";
      else cell.numFmt = "#,##0";
    });

    if (idx % 2 === 0) {
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.rowAlt } };
    }
  });

  // ── Sheet 2: Consolidado ────────────────────────────────────────────────
  const consSheet = wb.addWorksheet("Consolidado");
  consSheet.columns = [{ width: 30 }, { width: 20 }];
  const consTitleRow = consSheet.addRow(["CONSOLIDADO DE PORTFOLIO — AgroForma"]);
  consSheet.mergeCells(1, 1, 1, 2);
  consTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.darkGreen } };
  consTitleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 13 };
  consTitleRow.height = 32;

  consSheet.addRow(["Nota: Consolidado simplificado — no contempla eliminaciones intercompany"]).getCell(1).font = { italic: true, color: { argb: "FF9B9488" }, size: 9 };
  consSheet.addRow([]);

  const consItems: [string, number | string][] = [
    ["Total Ventas del Grupo", data.consolidado.ventas_netas ?? "—"],
    ["Total Resultado Neto", data.consolidado.resultado_neto ?? "—"],
    ["Total Patrimonio Neto", data.consolidado.patrimonio_neto ?? "—"],
    ["Total Activos", data.consolidado.total_activo ?? "—"],
    ["Total Pasivos", data.consolidado.total_pasivo ?? "—"],
  ];
  consItems.forEach(([label, val], i) => {
    const r = consSheet.addRow([label, val]);
    r.getCell(1).font = { bold: true, size: 10 };
    r.getCell(2).numFmt = "#,##0";
    r.getCell(2).alignment = { horizontal: "right" };
    if (i % 2 === 0) r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.rowAlt } };
    r.height = 20;
  });

  // ── Sheet 3: Análisis IA ────────────────────────────────────────────────
  if (data.aiAnalysis) {
    const iaSheet = wb.addWorksheet("Análisis IA");
    iaSheet.columns = [{ width: 10 }, { width: 80 }];
    const iaTitleRow = iaSheet.addRow(["ANÁLISIS IA DEL PORTFOLIO"]);
    iaSheet.mergeCells(1, 1, 1, 2);
    iaTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.darkGreen } };
    iaTitleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 13 };
    iaTitleRow.height = 32;

    iaSheet.addRow([]);
    iaSheet.addRow(["", data.aiAnalysis.resumen]).getCell(2).font = { italic: true, size: 10 };
    iaSheet.addRow([]);
    iaSheet.addRow(["", "INSIGHTS CRUZADOS"]).getCell(2).font = { bold: true, size: 11 };
    data.aiAnalysis.insights_cruzados?.forEach((ins, i) => {
      const r = iaSheet.addRow([`${i + 1}.`, ins]);
      r.getCell(2).alignment = { wrapText: true };
      r.height = 40;
    });
    iaSheet.addRow([]);
    iaSheet.addRow(["", "OPORTUNIDADES"]).getCell(2).font = { bold: true, size: 11, color: { argb: C.green } };
    data.aiAnalysis.oportunidades?.forEach((op, i) => {
      const r = iaSheet.addRow([`${i + 1}.`, op]);
      r.getCell(2).alignment = { wrapText: true };
      r.height = 40;
    });
    iaSheet.addRow([]);
    iaSheet.addRow(["", "RIESGOS DEL GRUPO"]).getCell(2).font = { bold: true, size: 11, color: { argb: C.red } };
    data.aiAnalysis.riesgos_grupo?.forEach((riesgo, i) => {
      const r = iaSheet.addRow([`${i + 1}.`, riesgo]);
      r.getCell(2).alignment = { wrapText: true };
      r.height = 40;
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
