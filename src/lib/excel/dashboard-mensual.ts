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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const ws = wb.addWorksheet("Dashboard Mensual", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  ws.columns = [
    { width: 16 }, // Mes
    { width: 20 }, // Ingresos
    { width: 20 }, // Egresos
    { width: 20 }, // Resultado
    { width: 20 }, // Acumulado
  ];

  // Title
  const titleRow = ws.addRow(["DASHBOARD MENSUAL"]);
  titleRow.height = 32;
  ws.mergeCells(`A${titleRow.number}:E${titleRow.number}`);
  const tc = titleRow.getCell(1);
  tc.value = "DASHBOARD MENSUAL";
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
  const cols = ["A", "B", "C", "D", "E"];
  const hdr = ws.addRow(["MES", "INGRESOS", "EGRESOS", "RESULTADO", "ACUMULADO"]);
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
  const meses: {
    mes: string;
    ingresos: number;
    egresos: number;
    resultado: number;
    acumulado: number;
  }[] = d.meses ?? [];

  meses.forEach((m, idx) => {
    const resultado = num(m.resultado);
    const acumulado = num(m.acumulado);
    const r = ws.addRow([
      m.mes,
      fmtMoney(num(m.ingresos)),
      fmtMoney(num(m.egresos)),
      fmtMoney(resultado),
      fmtMoney(acumulado),
    ]);
    r.height = 18;

    if (idx % 2 === 1) {
      cols.forEach((col) => { r.getCell(col).fill = fill(C.rowAlt); });
    }

    r.getCell("A").font = { bold: true, size: 10, name: "Calibri" };
    ["B", "C"].forEach((col) => {
      r.getCell(col).font = { size: 10, name: "Calibri" };
      r.getCell(col).alignment = { horizontal: "right", vertical: "middle" };
    });
    r.getCell("D").font = { bold: true, size: 10, name: "Calibri", color: { argb: resultado >= 0 ? C.posGreen : C.negRed } };
    r.getCell("D").alignment = { horizontal: "right", vertical: "middle" };
    r.getCell("E").font = { bold: true, size: 10, name: "Calibri", color: { argb: acumulado >= 0 ? C.posGreen : C.negRed } };
    r.getCell("E").alignment = { horizontal: "right", vertical: "middle" };
  });

  // Totals row
  const totRow = ws.addRow([
    "TOTAL",
    fmtMoney(num(d.total_ingresos)),
    fmtMoney(num(d.total_egresos)),
    fmtMoney(num(d.resultado_anual)),
    "",
  ]);
  totRow.height = 22;
  cols.forEach((col) => {
    totRow.getCell(col).fill = fill(C.lightGreen);
    totRow.getCell(col).font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    if (col !== "A") totRow.getCell(col).alignment = { horizontal: "right", vertical: "middle" };
  });

  // Best/Worst month
  ws.addRow([]);
  if (d.mejor_mes) {
    const r = ws.addRow(["Mejor mes:", "", d.mejor_mes]);
    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    r.getCell(3).font = { size: 10, color: { argb: C.posGreen }, name: "Calibri" };
  }
  if (d.peor_mes) {
    const r = ws.addRow(["Peor mes:", "", d.peor_mes]);
    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    r.getCell(3).font = { size: 10, color: { argb: C.negRed }, name: "Calibri" };
  }

  // Interpretation
  if (d.interpretacion) {
    ws.addRow([]);
    const intRow = ws.addRow([d.interpretacion]);
    ws.mergeCells(`A${intRow.number}:E${intRow.number}`);
    intRow.getCell(1).font = { italic: true, size: 9, color: { argb: C.grayText }, name: "Calibri" };
    intRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
  }

  ws.addRow([]);
  const footer = ws.addRow([`Generado por AgroForma — ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`A${footer.number}:E${footer.number}`);
  footer.getCell(1).font = { italic: true, size: 8, color: { argb: C.gray }, name: "Calibri" };
  footer.getCell(1).alignment = { horizontal: "right" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
