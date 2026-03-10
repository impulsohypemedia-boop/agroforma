import ExcelJS from "exceljs";

const C = {
  darkGreen:  "FF1A3311",
  lightGreen: "FF3D7A1C",
  white:      "FFFFFFFF",
  rowAlt:     "FFFAFAF8",
  border:     "FFE8E5DE",
  gray:       "FF888888",
  grayText:   "FF9B9488",
  positive:   "FF1E7E34",
  negative:   "FFC0392B",
  positiveBg: "FFE6F4EA",
  negativeBg: "FFFEE9E9",
};

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function safe(obj: Record<string, unknown> | undefined, key: string): number {
  return num(obj?.[key]);
}

function fill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

// ─── Shared header/total helpers ─────────────────────────────────────────────
function addTitleRow(ws: ExcelJS.Worksheet, text: string, colCount: number) {
  const r = ws.addRow([text]);
  r.height = 30;
  ws.mergeCells(`A${r.number}:${String.fromCharCode(64 + colCount)}${r.number}`);
  const c = r.getCell(1);
  c.value = text;
  c.fill = fill(C.darkGreen);
  c.font = { bold: true, size: 13, color: { argb: C.white }, name: "Calibri" };
  c.alignment = { horizontal: "center", vertical: "middle" };
}

function addSectionRow(ws: ExcelJS.Worksheet, text: string, colCount: number) {
  const r = ws.addRow([text.toUpperCase()]);
  r.height = 20;
  ws.mergeCells(`A${r.number}:${String.fromCharCode(64 + colCount)}${r.number}`);
  const c = r.getCell(1);
  c.value = text.toUpperCase();
  c.fill = fill(C.lightGreen);
  c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
  c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
}

function addHeaderRow(ws: ExcelJS.Worksheet, labels: string[]) {
  const r = ws.addRow(labels);
  r.height = 22;
  labels.forEach((_, i) => {
    const c = r.getCell(i + 1);
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    c.alignment = { horizontal: i === 0 ? "left" : "right", vertical: "middle" };
    if (i === 0) c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  });
}

function addTotalRow(ws: ExcelJS.Worksheet, values: (string | number)[], numStart = 1) {
  const r = ws.addRow(values);
  r.height = 22;
  values.forEach((_, i) => {
    const c = r.getCell(i + 1);
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    if (i >= numStart && typeof values[i] === "number") {
      c.numFmt = "#,##0.00";
      c.alignment = { horizontal: "right", vertical: "middle" };
    } else if (i === 0) {
      c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    }
  });
}

function addSubtotalRow(ws: ExcelJS.Worksheet, values: (string | number)[], numStart = 1) {
  const r = ws.addRow(values);
  r.height = 20;
  values.forEach((_, i) => {
    const c = r.getCell(i + 1);
    c.font = { bold: true, italic: true, size: 10, name: "Calibri" };
    if (i >= numStart && typeof values[i] === "number") {
      c.numFmt = "#,##0.00";
      c.alignment = { horizontal: "right", vertical: "middle" };
      c.border = {
        top: { style: "thin", color: { argb: C.border } },
        bottom: { style: "double", color: { argb: C.gray } },
      } as ExcelJS.Borders;
    } else {
      c.alignment = { vertical: "middle", indent: 1 };
      c.border = {
        top: { style: "thin", color: { argb: C.border } },
        bottom: { style: "thin", color: { argb: C.border } },
      } as ExcelJS.Borders;
    }
  });
}

// ─── Sheet 1: Ventas por Cultivo ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildVentasSheet(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet("Ventas por Cultivo");
  ws.columns = [
    { width: 28 }, // Cultivo
    { width: 22 }, // Ventas Actual
    { width: 22 }, // Ventas Anterior
    { width: 22 }, // Variación $
    { width: 14 }, // Variación %
  ];

  addTitleRow(ws, "VENTAS POR CULTIVO", 5);
  ws.addRow([`Empresa: ${d.empresa ?? ""}  ·  Ejercicio: ${d.ejercicio ?? ""}  ·  CUIT: ${d.cuit ?? ""}`]);
  ws.getRow(2).getCell(1).font = { size: 10, italic: true, name: "Calibri" };
  ws.addRow([]);

  addHeaderRow(ws, ["Cultivo", d.periodo_actual ?? "Periodo Actual", d.periodo_anterior ?? "Periodo Anterior", "Variación $", "Var. %"]);

  const ventas: { cultivo: string; ventas_actual: number; ventas_anterior: number; variacion_pct: number }[] =
    d.ventas_por_cultivo ?? [];

  let alt = false;
  for (const v of ventas) {
    alt = !alt;
    const varPesos = num(v.ventas_actual) - num(v.ventas_anterior);
    const r = ws.addRow([
      "  " + (v.cultivo ?? ""),
      num(v.ventas_actual),
      num(v.ventas_anterior),
      varPesos,
      num(v.variacion_pct),
    ]);
    r.height = 17;
    if (alt) [1, 2, 3, 4, 5].forEach(i => { r.getCell(i).fill = fill(C.rowAlt); });
    r.getCell(1).font = { size: 10, name: "Calibri" };
    [2, 3, 4].forEach(i => {
      r.getCell(i).numFmt = "#,##0.00";
      r.getCell(i).font = { size: 10, name: "Calibri" };
      r.getCell(i).alignment = { horizontal: "right", vertical: "middle" };
    });
    // Color variación
    const pct = num(v.variacion_pct);
    r.getCell(4).font = { size: 10, name: "Calibri", color: { argb: varPesos >= 0 ? C.positive : C.negative } };
    r.getCell(5).numFmt = '0.0"%"';
    r.getCell(5).font = { size: 10, name: "Calibri", color: { argb: pct >= 0 ? C.positive : C.negative } };
    r.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
  }

  // Total
  addTotalRow(ws, [
    "TOTAL VENTAS",
    num(d.total_ventas_actual),
    num(d.total_ventas_anterior),
    num(d.total_ventas_actual) - num(d.total_ventas_anterior),
    "",
  ], 1);

  ws.addRow([]);
  addFooter(ws, 5);
}

// ─── Sheet 2: Costo y Margen ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCostoMargenSheet(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet("Costo y Margen");
  ws.columns = [
    { width: 40 }, // Concepto
    { width: 22 }, // Actual
    { width: 22 }, // Anterior
  ];

  const cv = d.costo_ventas ?? {};
  const ei = cv.existencias_iniciales ?? {};
  const ef = cv.existencias_finales ?? {};

  addTitleRow(ws, "COSTO DE VENTAS Y MARGEN BRUTO", 3);
  addHeaderRow(ws, ["Concepto", d.periodo_actual ?? "Periodo Actual", d.periodo_anterior ?? "Periodo Anterior"]);

  function dataRow(label: string, actual: number, anterior: number, indent = true) {
    const r = ws.addRow([(indent ? "  " : "") + label, actual, anterior]);
    r.height = 17;
    r.getCell(1).font = { size: 10, name: "Calibri" };
    [2, 3].forEach(i => {
      r.getCell(i).numFmt = "#,##0.00";
      r.getCell(i).font = { size: 10, name: "Calibri" };
      r.getCell(i).alignment = { horizontal: "right", vertical: "middle" };
    });
  }

  // Existencias iniciales
  addSectionRow(ws, "EXISTENCIAS INICIALES", 3);
  dataRow("Cereales",    safe(ei, "cereales"),    0);
  dataRow("Sementeras",  safe(ei, "sementeras"),  0);
  dataRow("Insumos",     safe(ei, "insumos"),     0);
  addSubtotalRow(ws, ["Total Existencias Iniciales", safe(ei, "total"), 0]);

  // Compras
  const r = ws.addRow(["  Compras del período", num(cv.compras), 0]);
  r.height = 17;
  r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
  [2, 3].forEach(i => {
    r.getCell(i).numFmt = "#,##0.00";
    r.getCell(i).font = { bold: true, size: 10, name: "Calibri" };
    r.getCell(i).alignment = { horizontal: "right", vertical: "middle" };
  });

  // Existencias finales
  addSectionRow(ws, "EXISTENCIAS FINALES", 3);
  dataRow("Cereales",   safe(ef, "cereales"),   0);
  dataRow("Sementeras", safe(ef, "sementeras"), 0);
  dataRow("Insumos",    safe(ef, "insumos"),    0);
  addSubtotalRow(ws, ["Total Existencias Finales", safe(ef, "total"), 0]);

  ws.addRow([]);
  addTotalRow(ws, ["COSTO TOTAL DE VENTAS", num(cv.costo_total_actual), num(cv.costo_total_anterior)]);

  ws.addRow([]);

  // Ventas info row
  const vr = ws.addRow(["  Ventas netas", num(d.total_ventas_actual), num(d.total_ventas_anterior)]);
  vr.height = 17;
  vr.getCell(1).font = { size: 10, name: "Calibri" };
  [2, 3].forEach(i => {
    vr.getCell(i).numFmt = "#,##0.00";
    vr.getCell(i).alignment = { horizontal: "right", vertical: "middle" };
  });

  addTotalRow(ws, ["RESULTADO BRUTO DE PRODUCCIÓN", num(d.resultado_bruto_actual), num(d.resultado_bruto_anterior)]);

  // Margen % row
  const mr = ws.addRow(["  Margen Bruto %", `${num(d.margen_bruto_pct_actual).toFixed(1)}%`, `${num(d.margen_bruto_pct_anterior).toFixed(1)}%`]);
  mr.height = 17;
  mr.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
  [2, 3].forEach(i => {
    mr.getCell(i).font = { bold: true, size: 10, name: "Calibri", color: { argb: C.lightGreen } };
    mr.getCell(i).alignment = { horizontal: "right", vertical: "middle" };
  });

  ws.addRow([]);
  addFooter(ws, 3);
}

// ─── Sheet 3: Gastos de Producción ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildGastosSheet(wb: ExcelJS.Workbook, d: any) {
  const ws = wb.addWorksheet("Gastos de Producción");
  ws.columns = [
    { width: 35 }, // Concepto
    { width: 22 }, // Actual
    { width: 22 }, // Anterior
    { width: 22 }, // Variación $
  ];

  const gp = d.gastos_produccion ?? {};

  addTitleRow(ws, "GASTOS DE PRODUCCIÓN", 4);
  addHeaderRow(ws, [
    "Concepto",
    d.periodo_actual ?? "Periodo Actual",
    d.periodo_anterior ?? "Periodo Anterior",
    "Variación $",
  ]);

  const items: [string, string][] = [
    ["Fletes",               "fletes"],
    ["Alquileres",           "alquileres"],
    ["Honorarios técnicos",  "honorarios_tecnicos"],
    ["Servicios de cosecha", "servicios_cosecha"],
    ["Seguros",              "seguros"],
    ["Combustibles",         "combustibles"],
    ["Reparaciones",         "reparaciones"],
    ["Otros",                "otros"],
  ];

  let alt = false;
  for (const [label, key] of items) {
    alt = !alt;
    const act = safe(gp, key);
    const ant = 0;
    const r = ws.addRow(["  " + label, act, ant, act - ant]);
    r.height = 17;
    if (alt) [1, 2, 3, 4].forEach(i => { r.getCell(i).fill = fill(C.rowAlt); });
    r.getCell(1).font = { size: 10, name: "Calibri" };
    [2, 3, 4].forEach(i => {
      r.getCell(i).numFmt = "#,##0.00";
      r.getCell(i).font = { size: 10, name: "Calibri" };
      r.getCell(i).alignment = { horizontal: "right", vertical: "middle" };
    });
  }

  addTotalRow(ws, ["TOTAL GASTOS DE PRODUCCIÓN", safe(gp, "total_actual"), safe(gp, "total_anterior"), safe(gp, "total_actual") - safe(gp, "total_anterior")]);

  ws.addRow([]);

  addTotalRow(ws, ["RESULTADO OPERATIVO", num(d.resultado_operativo_actual), num(d.resultado_operativo_anterior), num(d.resultado_operativo_actual) - num(d.resultado_operativo_anterior)]);

  const mr = ws.addRow(["  Margen Operativo %", `${num(d.margen_operativo_pct_actual).toFixed(1)}%`, `${num(d.margen_operativo_pct_anterior).toFixed(1)}%`, ""]);
  mr.height = 17;
  mr.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
  [2, 3].forEach(i => {
    mr.getCell(i).font = { bold: true, size: 10, name: "Calibri", color: { argb: C.lightGreen } };
    mr.getCell(i).alignment = { horizontal: "right", vertical: "middle" };
  });

  ws.addRow([]);
  addFooter(ws, 4);
}

function addFooter(ws: ExcelJS.Worksheet, colCount: number) {
  const r = ws.addRow([`Generado por AgroForma — ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`A${r.number}:${String.fromCharCode(64 + colCount)}${r.number}`);
  r.getCell(1).font = { italic: true, size: 8, color: { argb: C.gray }, name: "Calibri" };
  r.getCell(1).alignment = { horizontal: "right" };
}

// ─── Main export ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  buildVentasSheet(wb, d);
  buildCostoMargenSheet(wb, d);
  buildGastosSheet(wb, d);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
