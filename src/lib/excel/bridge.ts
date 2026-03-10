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
  posBg:      "FFE8F5E3",
  negBg:      "FFFDE8E8",
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

function fmtNum(v: number): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const ws = wb.addWorksheet("Bridge de Resultados", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  ws.columns = [
    { width: 38 }, // Concepto
    { width: 20 }, // Impacto $
    { width: 14 }, // Signo
    { width: 46 }, // Descripción
  ];

  // Title
  const titleRow = ws.addRow(["BRIDGE DE RESULTADOS"]);
  titleRow.height = 32;
  ws.mergeCells(`A${titleRow.number}:D${titleRow.number}`);
  const tc = titleRow.getCell(1);
  tc.value = "BRIDGE DE RESULTADOS";
  tc.fill = fill(C.darkGreen);
  tc.font = { bold: true, size: 14, color: { argb: C.white }, name: "Calibri" };
  tc.alignment = { horizontal: "center", vertical: "middle" };

  function infoRow(label: string, value: string) {
    const r = ws.addRow([label, "", value]);
    r.height = 16;
    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    r.getCell(3).font = { size: 10, name: "Calibri" };
  }
  infoRow("Empresa:", d.empresa ?? "");
  infoRow("CUIT:", d.cuit ?? "");
  infoRow("Ejercicio:", d.ejercicio ?? "");
  ws.addRow([]);

  // Summary boxes
  const resAnt = num(d.resultado_anterior);
  const resAct = num(d.resultado_actual);
  const varTotal = num(d.variacion_total);

  const summaryHdr = ws.addRow(["RESULTADO ANTERIOR", "VARIACIÓN TOTAL", "RESULTADO ACTUAL", ""]);
  summaryHdr.height = 22;
  ["A","B","C"].forEach((col) => {
    summaryHdr.getCell(col).fill = fill(C.darkGreen);
    summaryHdr.getCell(col).font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    summaryHdr.getCell(col).alignment = { horizontal: "center", vertical: "middle" };
  });

  const summaryVal = ws.addRow([fmtNum(resAnt), (varTotal >= 0 ? "+" : "") + fmtNum(varTotal), fmtNum(resAct), ""]);
  summaryVal.height = 28;
  summaryVal.getCell("A").fill = fill(C.lightGreen);
  summaryVal.getCell("A").font = { bold: true, size: 13, color: { argb: C.white }, name: "Calibri" };
  summaryVal.getCell("A").alignment = { horizontal: "center", vertical: "middle" };
  summaryVal.getCell("B").fill = fill(varTotal >= 0 ? "FF1E7E34" : "FFC0392B");
  summaryVal.getCell("B").font = { bold: true, size: 13, color: { argb: C.white }, name: "Calibri" };
  summaryVal.getCell("B").alignment = { horizontal: "center", vertical: "middle" };
  summaryVal.getCell("C").fill = fill(C.lightGreen);
  summaryVal.getCell("C").font = { bold: true, size: 13, color: { argb: C.white }, name: "Calibri" };
  summaryVal.getCell("C").alignment = { horizontal: "center", vertical: "middle" };

  ws.addRow([]);

  // Header for bridge items
  const hdr = ws.addRow([
    "CONCEPTO / PUENTE DE RESULTADOS", "IMPACTO ($)", "SIGNO", "DESCRIPCIÓN",
  ]);
  hdr.height = 22;
  ["A","B","C","D"].forEach((col) => {
    const c = hdr.getCell(col);
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    c.alignment = {
      horizontal: col === "B" || col === "C" ? "right" : "left",
      vertical: "middle",
    };
    if (col === "A") c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  });

  // Starting row
  const startRow = ws.addRow(["Resultado del ejercicio anterior", fmtNum(resAnt), "", d.periodo_anterior ?? ""]);
  startRow.height = 22;
  ["A","B","C","D"].forEach((col) => {
    startRow.getCell(col).fill = fill(C.lightGreen);
    startRow.getCell(col).font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
  });
  startRow.getCell("A").alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  startRow.getCell("B").alignment = { horizontal: "right", vertical: "middle" };
  startRow.getCell("C").alignment = { horizontal: "right", vertical: "middle" };

  // Bridge items
  const items: { concepto: string; impacto: number; descripcion: string }[] = d.items ?? [];
  let rowIdx = 0;
  for (const item of items) {
    rowIdx++;
    const imp = num(item.impacto);
    const isPos = imp >= 0;
    const r = ws.addRow([
      "  " + item.concepto,
      (isPos ? "+" : "") + fmtNum(imp),
      isPos ? "▲" : "▼",
      item.descripcion,
    ]);
    r.height = 18;
    if (rowIdx % 2 === 0) {
      ["A","B","C","D"].forEach((col) => { r.getCell(col).fill = fill(C.rowAlt); });
    }
    r.getCell("A").font = { size: 10, name: "Calibri" };
    r.getCell("A").alignment = { vertical: "middle" };
    r.getCell("B").font = { bold: true, size: 10, name: "Calibri", color: { argb: isPos ? C.posGreen : C.negRed } };
    r.getCell("B").alignment = { horizontal: "right", vertical: "middle" };
    r.getCell("C").font = { bold: true, size: 12, name: "Calibri", color: { argb: isPos ? C.posGreen : C.negRed } };
    r.getCell("C").alignment = { horizontal: "center", vertical: "middle" };
    r.getCell("D").font = { size: 9, italic: true, color: { argb: "FF9B9488" }, name: "Calibri" };
    r.getCell("D").alignment = { wrapText: true, vertical: "middle" };
  }

  // Final row
  const endRow = ws.addRow(["Resultado del ejercicio actual", fmtNum(resAct), "", d.periodo_actual ?? ""]);
  endRow.height = 24;
  ["A","B","C","D"].forEach((col) => {
    endRow.getCell(col).fill = fill(C.darkGreen);
    endRow.getCell(col).font = { bold: true, size: 11, color: { argb: C.white }, name: "Calibri" };
  });
  endRow.getCell("A").alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  endRow.getCell("B").alignment = { horizontal: "right", vertical: "middle" };

  // Conclusion
  if (d.conclusion) {
    ws.addRow([]);
    const conclHdr = ws.addRow(["CONCLUSIÓN"]);
    conclHdr.height = 20;
    ws.mergeCells(`A${conclHdr.number}:D${conclHdr.number}`);
    conclHdr.getCell(1).fill = fill(C.lightGreen);
    conclHdr.getCell(1).font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    conclHdr.getCell(1).alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    const conclRow = ws.addRow([d.conclusion]);
    conclRow.height = 50;
    ws.mergeCells(`A${conclRow.number}:D${conclRow.number}`);
    conclRow.getCell(1).font = { size: 10, name: "Calibri" };
    conclRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
    conclRow.getCell(1).fill = fill(C.rowAlt);
  }

  ws.addRow([]);
  const footer = ws.addRow([`Generado por AgroForma — ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`A${footer.number}:D${footer.number}`);
  footer.getCell(1).font = { italic: true, size: 8, color: { argb: C.gray }, name: "Calibri" };
  footer.getCell(1).alignment = { horizontal: "right" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
