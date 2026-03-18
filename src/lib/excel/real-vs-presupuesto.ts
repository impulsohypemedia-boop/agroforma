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
  catBg:      "FFE8F5E3",
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

function fmtNum(v: number): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const ws = wb.addWorksheet("Real vs Presupuesto", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  ws.columns = [
    { width: 18 }, // Cultivo
    { width: 14 }, // Has Real
    { width: 14 }, // Has Presup
    { width: 14 }, // Rinde Real
    { width: 14 }, // Rinde Presup
    { width: 14 }, // Precio Real
    { width: 14 }, // Precio Presup
    { width: 16 }, // Ingreso Real
    { width: 16 }, // Ingreso Presup
    { width: 16 }, // Costo Real
    { width: 16 }, // Costo Presup
    { width: 16 }, // Margen Real
    { width: 16 }, // Margen Presup
    { width: 12 }, // Desvío %
  ];

  // Title
  const titleRow = ws.addRow(["REAL VS PRESUPUESTADO"]);
  titleRow.height = 32;
  ws.mergeCells(`A${titleRow.number}:N${titleRow.number}`);
  const tc = titleRow.getCell(1);
  tc.value = "REAL VS PRESUPUESTADO";
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
  infoRow("Campaña:", d.campana ?? "");
  ws.addRow([]);

  // --- Resumen ---
  const resumenTitle = ws.addRow(["RESUMEN"]);
  resumenTitle.height = 20;
  ws.mergeCells(`A${resumenTitle.number}:N${resumenTitle.number}`);
  const rc = resumenTitle.getCell(1);
  rc.value = "RESUMEN";
  rc.fill = fill(C.lightGreen);
  rc.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
  rc.alignment = { horizontal: "left", vertical: "middle", indent: 1 };

  const resumen = d.resumen ?? {};

  const resHdr = ws.addRow(["Concepto", "", "Real", "", "Presupuestado", "", "Desvío %"]);
  resHdr.height = 20;
  [1, 3, 5, 7].forEach((col) => {
    const c = resHdr.getCell(col);
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    c.alignment = { horizontal: col === 1 ? "left" : "right", vertical: "middle" };
  });

  function resumenRow(label: string, real: number, presup: number, desvioPct: number, idx: number) {
    const r = ws.addRow([label, "", fmtMoney(real), "", fmtMoney(presup), "", fmtPct(desvioPct)]);
    r.height = 18;
    if (idx % 2 === 0) {
      for (let i = 1; i <= 14; i++) r.getCell(i).fill = fill(C.rowAlt);
    }
    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    [3, 5].forEach((col) => {
      r.getCell(col).font = { size: 10, name: "Calibri" };
      r.getCell(col).alignment = { horizontal: "right" };
    });
    r.getCell(7).font = { bold: true, size: 10, name: "Calibri", color: { argb: desvioPct >= 0 ? C.posGreen : C.negRed } };
    r.getCell(7).alignment = { horizontal: "right" };
  }

  resumenRow("Ingresos", num(resumen.ingreso_real), num(resumen.ingreso_presupuestado), num(resumen.desvio_ingreso_pct), 0);
  resumenRow("Costos", num(resumen.costo_real), num(resumen.costo_presupuestado), num(resumen.desvio_costo_pct), 1);
  resumenRow("Resultado", num(resumen.resultado_real), num(resumen.resultado_presupuestado), num(resumen.desvio_resultado_pct), 2);

  ws.addRow([]);

  // --- Por Cultivo ---
  const cultivoTitle = ws.addRow(["DETALLE POR CULTIVO"]);
  cultivoTitle.height = 20;
  ws.mergeCells(`A${cultivoTitle.number}:N${cultivoTitle.number}`);
  const ctc = cultivoTitle.getCell(1);
  ctc.value = "DETALLE POR CULTIVO";
  ctc.fill = fill(C.lightGreen);
  ctc.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
  ctc.alignment = { horizontal: "left", vertical: "middle", indent: 1 };

  const colHeaders = [
    "CULTIVO", "HAS REAL", "HAS PRESUP", "RINDE REAL", "RINDE PRESUP",
    "PRECIO REAL", "PRECIO PRESUP", "INGRESO REAL", "INGRESO PRESUP",
    "COSTO REAL", "COSTO PRESUP", "MARGEN REAL", "MARGEN PRESUP", "DESVÍO %",
  ];
  const hdr = ws.addRow(colHeaders);
  hdr.height = 22;
  for (let i = 1; i <= 14; i++) {
    const c = hdr.getCell(i);
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 9, color: { argb: C.white }, name: "Calibri" };
    c.alignment = {
      horizontal: i === 1 ? "left" : "right",
      vertical: "middle",
      wrapText: true,
    };
  }

  const cultivos: {
    cultivo: string;
    has_real: number; has_presup: number;
    rinde_real: number; rinde_presup: number;
    precio_real: number; precio_presup: number;
    ingreso_real: number; ingreso_presup: number;
    costo_real: number; costo_presup: number;
    margen_real: number; margen_presup: number;
    desvio_pct: number;
  }[] = d.por_cultivo ?? [];

  cultivos.forEach((cult, idx) => {
    const r = ws.addRow([
      cult.cultivo,
      fmtNum(num(cult.has_real)),
      fmtNum(num(cult.has_presup)),
      fmtNum(num(cult.rinde_real)),
      fmtNum(num(cult.rinde_presup)),
      fmtMoney(num(cult.precio_real)),
      fmtMoney(num(cult.precio_presup)),
      fmtMoney(num(cult.ingreso_real)),
      fmtMoney(num(cult.ingreso_presup)),
      fmtMoney(num(cult.costo_real)),
      fmtMoney(num(cult.costo_presup)),
      fmtMoney(num(cult.margen_real)),
      fmtMoney(num(cult.margen_presup)),
      fmtPct(num(cult.desvio_pct)),
    ]);
    r.height = 18;

    if (idx % 2 === 0) {
      for (let i = 1; i <= 14; i++) r.getCell(i).fill = fill(C.rowAlt);
    }

    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    for (let i = 2; i <= 13; i++) {
      r.getCell(i).font = { size: 9, name: "Calibri" };
      r.getCell(i).alignment = { horizontal: "right", vertical: "middle" };
    }
    const desvio = num(cult.desvio_pct);
    r.getCell(14).font = { bold: true, size: 10, name: "Calibri", color: { argb: desvio >= 0 ? C.posGreen : C.negRed } };
    r.getCell(14).alignment = { horizontal: "right", vertical: "middle" };
  });

  ws.addRow([]);

  // --- Principales Desvíos ---
  const desviosTitle = ws.addRow(["PRINCIPALES DESVÍOS"]);
  desviosTitle.height = 20;
  ws.mergeCells(`A${desviosTitle.number}:N${desviosTitle.number}`);
  const dtc = desviosTitle.getCell(1);
  dtc.value = "PRINCIPALES DESVÍOS";
  dtc.fill = fill(C.lightGreen);
  dtc.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
  dtc.alignment = { horizontal: "left", vertical: "middle", indent: 1 };

  const desvHdr = ws.addRow(["CONCEPTO", "", "", "DESVÍO", "", "", "CAUSA"]);
  desvHdr.height = 20;
  [1, 4, 7].forEach((col) => {
    const c = desvHdr.getCell(col);
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    c.alignment = { horizontal: col === 4 ? "right" : "left", vertical: "middle" };
  });

  const desvios: { concepto: string; desvio: number; causa: string }[] = d.principales_desvios ?? [];

  desvios.forEach((desv, idx) => {
    const desvVal = num(desv.desvio);
    const r = ws.addRow([desv.concepto, "", "", fmtMoney(desvVal), "", "", desv.causa]);
    r.height = 18;
    if (idx % 2 === 0) {
      for (let i = 1; i <= 14; i++) r.getCell(i).fill = fill(C.rowAlt);
    }
    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    r.getCell(4).font = { bold: true, size: 10, name: "Calibri", color: { argb: desvVal >= 0 ? C.posGreen : C.negRed } };
    r.getCell(4).alignment = { horizontal: "right" };
    r.getCell(7).font = { size: 9, color: { argb: C.grayText }, name: "Calibri" };
    r.getCell(7).alignment = { wrapText: true, vertical: "middle" };
  });

  ws.addRow([]);

  // --- Interpretación ---
  if (d.interpretacion) {
    const interpTitle = ws.addRow(["INTERPRETACIÓN"]);
    interpTitle.height = 20;
    ws.mergeCells(`A${interpTitle.number}:N${interpTitle.number}`);
    const itc = interpTitle.getCell(1);
    itc.value = "INTERPRETACIÓN";
    itc.fill = fill(C.lightGreen);
    itc.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    itc.alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    const interpRow = ws.addRow([d.interpretacion]);
    ws.mergeCells(`A${interpRow.number}:N${interpRow.number}`);
    interpRow.getCell(1).font = { size: 10, name: "Calibri" };
    interpRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
    interpRow.height = 60;
  }

  ws.addRow([]);
  const footer = ws.addRow([`Generado por AgroForma — ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`A${footer.number}:N${footer.number}`);
  footer.getCell(1).font = { italic: true, size: 8, color: { argb: C.gray }, name: "Calibri" };
  footer.getCell(1).alignment = { horizontal: "right" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
