import ExcelJS from "exceljs";

const C = {
  darkGreen:  "FF1A3311",
  lightGreen: "FF3D7A1C",
  white:      "FFFFFFFF",
  rowAlt:     "FFFAFAF8",
  border:     "FFE8E5DE",
  gray:       "FF888888",
  grayText:   "FF9B9488",
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const ws = wb.addWorksheet("Situación Patrimonial", {
    pageSetup: { orientation: "portrait", fitToPage: true },
  });

  ws.columns = [
    { width: 42 },
    { width: 8  },
    { width: 22 },
    { width: 22 },
  ];

  const ant = d.valores_periodo_anterior ?? {};

  function fill(argb: string): ExcelJS.Fill {
    return { type: "pattern", pattern: "solid", fgColor: { argb } };
  }

  function borderPartial(top = false, bottom: "thin" | "double" | false = false): Partial<ExcelJS.Borders> {
    const b: Partial<ExcelJS.Borders> = {};
    if (top)    b.top    = { style: "thin",   color: { argb: C.border } };
    if (bottom) b.bottom = { style: bottom,   color: { argb: C.gray }  };
    return b;
  }

  function titleRow(text: string) {
    const r = ws.addRow([text]);
    r.height = 32;
    ws.mergeCells(`A${r.number}:D${r.number}`);
    const c = r.getCell(1);
    c.value = text;
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 14, color: { argb: C.white }, name: "Calibri" };
    c.alignment = { horizontal: "center", vertical: "middle" };
  }

  function infoRow(label: string, value: string) {
    const r = ws.addRow([label, "", value]);
    r.height = 16;
    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    r.getCell(3).font = { size: 10, name: "Calibri" };
  }

  function headerRow(pActual: string, pAnterior: string) {
    const r = ws.addRow(["CONCEPTO", "NOTA", pActual, pAnterior]);
    r.height = 22;
    ["A", "B", "C", "D"].forEach((col) => {
      const c = r.getCell(col);
      c.fill = fill(C.darkGreen);
      c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
      c.alignment = {
        horizontal: col === "A" ? "left" : col === "B" ? "center" : "right",
        vertical: "middle",
      };
    });
    r.getCell("A").alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  }

  function sectionRow(label: string) {
    const r = ws.addRow([label.toUpperCase()]);
    r.height = 20;
    ws.mergeCells(`A${r.number}:D${r.number}`);
    const c = r.getCell(1);
    c.value = label.toUpperCase();
    c.fill = fill(C.lightGreen);
    c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  }

  let _rowIdx = 0;
  function dataRow(label: string, actual: number, anterior: number, nota = "") {
    _rowIdx++;
    const r = ws.addRow(["  " + label, nota, actual, anterior]);
    r.height = 17;
    if (_rowIdx % 2 === 0) {
      ["A", "B", "C", "D"].forEach((col) => {
        r.getCell(col).fill = fill(C.rowAlt);
      });
    }
    r.getCell("A").font = { size: 10, name: "Calibri" };
    r.getCell("B").font = { size: 9, color: { argb: C.grayText }, name: "Calibri" };
    r.getCell("B").alignment = { horizontal: "center", vertical: "middle" };
    r.getCell("C").numFmt = "#,##0.00";
    r.getCell("C").font = { size: 10, name: "Calibri" };
    r.getCell("C").alignment = { horizontal: "right", vertical: "middle" };
    r.getCell("D").numFmt = "#,##0.00";
    r.getCell("D").font = { size: 10, name: "Calibri" };
    r.getCell("D").alignment = { horizontal: "right", vertical: "middle" };
  }

  function subtotalRow(label: string, actual: number, anterior: number) {
    const r = ws.addRow([label, "", actual, anterior]);
    r.height = 20;
    r.getCell("A").font = { bold: true, italic: true, size: 10, name: "Calibri" };
    r.getCell("A").alignment = { vertical: "middle", indent: 1 };
    r.getCell("A").border = borderPartial(true, "thin") as ExcelJS.Borders;
    r.getCell("B").border = borderPartial(true, "thin") as ExcelJS.Borders;
    ["C", "D"].forEach((col) => {
      r.getCell(col).numFmt = "#,##0.00";
      r.getCell(col).font = { bold: true, italic: true, size: 10, name: "Calibri" };
      r.getCell(col).alignment = { horizontal: "right", vertical: "middle" };
      r.getCell(col).border = borderPartial(true, "double") as ExcelJS.Borders;
    });
  }

  function totalRow(label: string, actual: number, anterior: number) {
    const r = ws.addRow([label.toUpperCase(), "", actual, anterior]);
    r.height = 22;
    ["A", "B", "C", "D"].forEach((col) => {
      r.getCell(col).fill = fill(C.darkGreen);
      r.getCell(col).font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    });
    r.getCell("A").alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    r.getCell("B").alignment = { horizontal: "center", vertical: "middle" };
    ["C", "D"].forEach((col) => {
      r.getCell(col).numFmt = "#,##0.00";
      r.getCell(col).alignment = { horizontal: "right", vertical: "middle" };
    });
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  titleRow("ESTADO DE SITUACIÓN PATRIMONIAL");
  infoRow("Empresa:", d.empresa ?? "");
  infoRow("CUIT:", d.cuit ?? "");
  infoRow("Ejercicio:", d.ejercicio ?? "");
  infoRow("Moneda:", d.moneda ?? "Pesos Argentinos - Moneda Homogénea");
  ws.addRow([]);
  headerRow(d.periodo_actual ?? "Periodo Actual", d.periodo_anterior ?? "Periodo Anterior");

  const ac = d.activo_corriente ?? {};
  const acAnt = ant.activo_corriente ?? {};
  sectionRow("ACTIVO CORRIENTE");
  dataRow("Disponibilidades",     safe(ac, "disponibilidades"),     safe(acAnt, "disponibilidades"),     "1");
  dataRow("Créditos por ventas",  safe(ac, "creditos_por_ventas"),  safe(acAnt, "creditos_por_ventas"),  "2");
  dataRow("Créditos impositivos", safe(ac, "creditos_impositivos"), safe(acAnt, "creditos_impositivos"), "3");
  dataRow("Créditos sociales",    safe(ac, "creditos_sociales"),    safe(acAnt, "creditos_sociales"),    "4");
  dataRow("Inversiones",          safe(ac, "inversiones"),          safe(acAnt, "inversiones"),          "5");
  dataRow("Bienes de cambio",     safe(ac, "bienes_de_cambio"),     safe(acAnt, "bienes_de_cambio"),     "6");
  subtotalRow("Total Activo Corriente", safe(ac, "total"), safe(acAnt, "total"));

  const anc = d.activo_no_corriente ?? {};
  const ancAnt = ant.activo_no_corriente ?? {};
  sectionRow("ACTIVO NO CORRIENTE");
  dataRow("Bienes de uso", safe(anc, "bienes_de_uso"), safe(ancAnt, "bienes_de_uso"), "7");
  subtotalRow("Total Activo No Corriente", safe(anc, "total"), safe(ancAnt, "total"));

  totalRow("TOTAL ACTIVO", num(d.total_activo), num(ant.total_activo));
  ws.addRow([]);

  const pc = d.pasivo_corriente ?? {};
  const pcAnt = ant.pasivo_corriente ?? {};
  sectionRow("PASIVO CORRIENTE");
  dataRow("Deudas comerciales",  safe(pc, "deudas_comerciales"),  safe(pcAnt, "deudas_comerciales"),  "8");
  dataRow("Deudas bancarias",    safe(pc, "deudas_bancarias"),    safe(pcAnt, "deudas_bancarias"),    "9");
  dataRow("Deudas impositivas",  safe(pc, "deudas_impositivas"),  safe(pcAnt, "deudas_impositivas"),  "10");
  dataRow("Deudas sociales",     safe(pc, "deudas_sociales"),     safe(pcAnt, "deudas_sociales"),     "11");
  subtotalRow("Total Pasivo Corriente", safe(pc, "total"), safe(pcAnt, "total"));

  const pnc = d.pasivo_no_corriente ?? {};
  const pncAnt = ant.pasivo_no_corriente ?? {};
  sectionRow("PASIVO NO CORRIENTE");
  dataRow("Deudas bancarias", safe(pnc, "deudas_bancarias"), safe(pncAnt, "deudas_bancarias"), "12");
  dataRow("Deudas sociales",  safe(pnc, "deudas_sociales"),  safe(pncAnt, "deudas_sociales"),  "13");
  subtotalRow("Total Pasivo No Corriente", safe(pnc, "total"), safe(pncAnt, "total"));

  totalRow("TOTAL PASIVO", num(d.total_pasivo), num(ant.total_pasivo));
  ws.addRow([]);

  totalRow("PATRIMONIO NETO", num(d.patrimonio_neto), num(ant.patrimonio_neto));
  ws.addRow([]);

  const footer = ws.addRow([`Generado por AgroForma — ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`A${footer.number}:D${footer.number}`);
  footer.getCell(1).font = { italic: true, size: 8, color: { argb: C.gray }, name: "Calibri" };
  footer.getCell(1).alignment = { horizontal: "right" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
