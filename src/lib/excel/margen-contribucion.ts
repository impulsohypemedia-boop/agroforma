import ExcelJS from "exceljs";

const C = {
  darkGreen:  "FF1A3311",
  lightGreen: "FF3D7A1C",
  white:      "FFFFFFFF",
  rowAlt:     "FFFAFAF8",
  grayText:   "FF9B9488",
  posGreen:   "FF1E7E34",
  goldBg:     "FFFFF8E7",
};

function fill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function fmt(v: unknown): string {
  const n = typeof v === "number" ? v : 0;
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function pct(v: unknown): string {
  const n = typeof v === "number" ? v : 0;
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n) + "%";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";

  const ws = wb.addWorksheet("Margen Contribucion", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  const acts = d.actividades ?? [];
  const actNames = acts.map((a: { nombre: string }) => a.nombre);
  const colCount = 2 + actNames.length + 1;

  // Set widths
  ws.columns = [
    { width: 4 },
    { width: 34 },
    ...actNames.map(() => ({ width: 16 })),
    { width: 16 },
  ];

  // Title
  const t = ws.addRow(["", "MARGEN DE CONTRIBUCION POR ACTIVIDAD - METODOLOGIA CREA"]);
  t.height = 32;
  ws.mergeCells(`B${t.number}:${String.fromCharCode(65 + colCount - 1)}${t.number}`);
  t.getCell("B").fill = fill(C.darkGreen);
  t.getCell("B").font = { bold: true, size: 13, color: { argb: C.white } };
  t.getCell("B").alignment = { horizontal: "center", vertical: "middle" };

  // Info
  const r1 = ws.addRow(["", "Empresa:", d.empresa ?? ""]);
  r1.getCell("B").font = { bold: true, size: 10 };
  const r2 = ws.addRow(["", "Campana:", d.campana ?? ""]);
  r2.getCell("B").font = { bold: true, size: 10 };
  ws.addRow([]);

  // Header
  const hdrVals = ["", "", ...actNames, "Total"];
  const hdr = ws.addRow(hdrVals);
  hdr.height = 22;
  for (let c = 1; c <= colCount; c++) {
    hdr.getCell(c).fill = fill(C.darkGreen);
    hdr.getCell(c).font = { bold: true, size: 10, color: { argb: C.white } };
    hdr.getCell(c).alignment = { horizontal: c >= 3 ? "right" : "left", vertical: "middle" };
  }

  const rows = [
    { key: "ingreso_neto", label: "Ingreso Neto", sub: false },
    { key: "gastos_variables", label: "Gastos Directos Variables", sub: false },
    { key: "contribucion_marginal", label: "Contribucion Marginal", sub: true },
    { key: "gastos_fijos", label: "Gastos Directos Fijos", sub: false },
    { key: "margen_bruto", label: "Margen Bruto", sub: true },
    { key: "amortizaciones", label: "Amortizaciones Directas", sub: false },
    { key: "impuestos", label: "Impuestos y Tasas Directas", sub: false },
    { key: "tenencia_bc", label: "Tenencia Bienes de Cambio", sub: false },
    { key: "margen_contribucion", label: "Margen de Contribucion", sub: true },
  ];

  for (let i = 0; i < rows.length; i++) {
    const { key, label, sub } = rows[i];
    const vals = [
      i + 1,
      label,
      ...acts.map((a: Record<string, number>) => fmt(a[key] ?? 0)),
      fmt(d.totales?.[key] ?? 0),
    ];
    const r = ws.addRow(vals);
    r.height = 20;

    if (sub) {
      for (let c = 1; c <= colCount; c++) {
        r.getCell(c).fill = fill(C.goldBg);
        r.getCell(c).font = { bold: true, size: 10 };
      }
    } else if (i % 2 === 0) {
      for (let c = 1; c <= colCount; c++) r.getCell(c).fill = fill(C.rowAlt);
    }

    for (let c = 3; c <= colCount; c++) {
      r.getCell(c).alignment = { horizontal: "right", vertical: "middle" };
    }
  }

  // Relative participation
  ws.addRow([]);
  const pctHdr = ws.addRow(["", "Participacion Relativa", ...actNames.map(() => ""), ""]);
  pctHdr.getCell("B").font = { bold: true, size: 10, color: { argb: C.lightGreen } };

  const pctRows = [
    { key: "pct_ingreso_total", label: "% Ingreso Neto" },
    { key: "pct_margen_total", label: "% Margen Contribucion" },
  ];
  for (const pr of pctRows) {
    const vals = [
      "",
      pr.label,
      ...acts.map((a: Record<string, number>) => pct(a[pr.key] ?? 0)),
      "100%",
    ];
    const r = ws.addRow(vals);
    r.getCell("B").font = { size: 10 };
    for (let c = 3; c <= colCount; c++) {
      r.getCell(c).alignment = { horizontal: "right" };
      r.getCell(c).font = { size: 10, color: { argb: C.posGreen } };
    }
  }

  ws.addRow([]);
  const footer = ws.addRow(["", `Generado por AgroForma (CREA) - ${new Date().toLocaleDateString("es-AR")}`]);
  footer.getCell("B").font = { italic: true, size: 8, color: { argb: C.grayText } };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
