import ExcelJS from "exceljs";

const C = {
  darkGreen:  "FF1A3311",
  lightGreen: "FF3D7A1C",
  white:      "FFFFFFFF",
  rowAlt:     "FFFAFAF8",
  border:     "FFE8E5DE",
  gray:       "FF888888",
  grayText:   "FF9B9488",
  posGreen:   "FF1E7E34",
  negRed:     "FFC0392B",
};

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function fill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function fmtMoney(v: number): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

function fmtPct(v: number): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v) + "%";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const ws = wb.addWorksheet("Resultado por UN", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  ws.columns = [
    { width: 22 }, // Unidad de Negocio
    { width: 18 }, // Ingresos
    { width: 18 }, // Costos Directos
    { width: 18 }, // Margen Bruto
    { width: 14 }, // Margen %
    { width: 18 }, // Gastos Asignados
    { width: 18 }, // Resultado Neto
    { width: 16 }, // Participación %
  ];

  // Title
  const titleRow = ws.addRow(["RESULTADO POR UNIDAD DE NEGOCIO"]);
  titleRow.height = 32;
  ws.mergeCells(`A${titleRow.number}:H${titleRow.number}`);
  const tc = titleRow.getCell(1);
  tc.value = "RESULTADO POR UNIDAD DE NEGOCIO";
  tc.fill = fill(C.darkGreen);
  tc.font = { bold: true, size: 14, color: { argb: C.white }, name: "Calibri" };
  tc.alignment = { horizontal: "center", vertical: "middle" };

  // Company info
  function infoRow(label: string, value: string) {
    const r = ws.addRow([label, "", value]);
    r.height = 16;
    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    r.getCell(3).font = { size: 10, name: "Calibri" };
  }
  infoRow("Empresa:", d.empresa ?? "");
  infoRow("Ejercicio:", d.ejercicio ?? "");
  ws.addRow([]);

  // Header
  const cols = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const hdr = ws.addRow([
    "UNIDAD DE NEGOCIO", "INGRESOS", "COSTOS DIRECTOS", "MARGEN BRUTO",
    "MARGEN %", "GASTOS ASIGNADOS", "RESULTADO NETO", "PARTIC. VENTAS %",
  ]);
  hdr.height = 22;
  cols.forEach((col) => {
    const c = hdr.getCell(col);
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    c.alignment = {
      horizontal: col === "A" ? "left" : "right",
      vertical: "middle",
      wrapText: true,
    };
  });

  // Data rows
  const unidades: {
    nombre: string;
    ingresos: number;
    costos_directos: number;
    margen_bruto: number;
    margen_pct: number;
    gastos_asignados: number;
    resultado_neto: number;
    participacion_ventas_pct: number;
  }[] = d.unidades ?? [];

  unidades.forEach((u, idx) => {
    const r = ws.addRow([
      u.nombre,
      fmtMoney(num(u.ingresos)),
      fmtMoney(num(u.costos_directos)),
      fmtMoney(num(u.margen_bruto)),
      fmtPct(num(u.margen_pct)),
      fmtMoney(num(u.gastos_asignados)),
      fmtMoney(num(u.resultado_neto)),
      fmtPct(num(u.participacion_ventas_pct)),
    ]);
    r.height = 18;

    if (idx % 2 === 1) {
      cols.forEach((col) => { r.getCell(col).fill = fill(C.rowAlt); });
    }

    r.getCell("A").font = { bold: true, size: 10, name: "Calibri" };
    ["B", "C", "D", "E", "F", "G", "H"].forEach((col) => {
      r.getCell(col).font = { size: 10, name: "Calibri" };
      r.getCell(col).alignment = { horizontal: "right", vertical: "middle" };
    });

    const resNeto = num(u.resultado_neto);
    r.getCell("G").font = { bold: true, size: 10, name: "Calibri", color: { argb: resNeto >= 0 ? C.posGreen : C.negRed } };
  });

  // Totals row
  if (d.total) {
    const totRow = ws.addRow([
      "TOTAL",
      fmtMoney(num(d.total.ingresos)),
      fmtMoney(num(d.total.costos)),
      "", "", "",
      fmtMoney(num(d.total.resultado)),
      "",
    ]);
    totRow.height = 22;
    cols.forEach((col) => {
      totRow.getCell(col).fill = fill(C.lightGreen);
      totRow.getCell(col).font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
      if (col !== "A") totRow.getCell(col).alignment = { horizontal: "right", vertical: "middle" };
    });
  }

  // Best/Worst
  ws.addRow([]);
  if (d.mejor_unidad) {
    const r = ws.addRow(["Mejor unidad:", "", d.mejor_unidad]);
    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    r.getCell(3).font = { size: 10, color: { argb: C.posGreen }, name: "Calibri" };
  }
  if (d.peor_unidad) {
    const r = ws.addRow(["Peor unidad:", "", d.peor_unidad]);
    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    r.getCell(3).font = { size: 10, color: { argb: C.negRed }, name: "Calibri" };
  }

  // Interpretation
  if (d.interpretacion) {
    ws.addRow([]);
    const intRow = ws.addRow([d.interpretacion]);
    ws.mergeCells(`A${intRow.number}:H${intRow.number}`);
    intRow.getCell(1).font = { italic: true, size: 9, color: { argb: C.grayText }, name: "Calibri" };
    intRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
  }

  ws.addRow([]);
  const footer = ws.addRow([`Generado por AgroForma — ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`A${footer.number}:H${footer.number}`);
  footer.getCell(1).font = { italic: true, size: 8, color: { argb: C.gray }, name: "Calibri" };
  footer.getCell(1).alignment = { horizontal: "right" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
