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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const ws = wb.addWorksheet("EBITDA Agro", {
    pageSetup: { orientation: "portrait", fitToPage: true },
  });

  ws.columns = [
    { width: 40 }, // Concepto
    { width: 24 }, // Monto
  ];

  // Title
  const titleRow = ws.addRow(["EBITDA AGROPECUARIO"]);
  titleRow.height = 32;
  ws.mergeCells(`A${titleRow.number}:B${titleRow.number}`);
  const tc = titleRow.getCell(1);
  tc.value = "EBITDA AGROPECUARIO";
  tc.fill = fill(C.darkGreen);
  tc.font = { bold: true, size: 14, color: { argb: C.white }, name: "Calibri" };
  tc.alignment = { horizontal: "center", vertical: "middle" };

  // Company info
  function infoRow(label: string, value: string) {
    const r = ws.addRow([label, value]);
    r.height = 16;
    r.getCell(1).font = { bold: true, size: 10, name: "Calibri" };
    r.getCell(2).font = { size: 10, name: "Calibri" };
  }
  infoRow("Empresa:", d.empresa ?? "");
  infoRow("Ejercicio:", d.ejercicio ?? "");
  ws.addRow([]);

  // Header
  const hdr = ws.addRow(["CONCEPTO", "MONTO"]);
  hdr.height = 22;
  ["A", "B"].forEach((col) => {
    const c = hdr.getCell(col);
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    c.alignment = {
      horizontal: col === "B" ? "right" : "left",
      vertical: "middle",
      wrapText: true,
    };
    if (col === "A") c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  });

  // Detalle rows
  const detalle: { concepto: string; monto: number }[] = d.detalle ?? [];
  detalle.forEach((item, idx) => {
    const monto = num(item.monto);
    const isTotal = item.concepto.startsWith("=");
    const r = ws.addRow([(isTotal ? "" : "  ") + item.concepto, fmtMoney(monto)]);
    r.height = 18;

    if (idx % 2 === 1) {
      ["A", "B"].forEach((col) => { r.getCell(col).fill = fill(C.rowAlt); });
    }

    r.getCell("A").font = {
      bold: isTotal,
      size: 10,
      name: "Calibri",
    };
    r.getCell("B").font = {
      bold: isTotal,
      size: 10,
      name: "Calibri",
    };
    r.getCell("B").alignment = { horizontal: "right", vertical: "middle" };
  });

  // Summary rows
  ws.addRow([]);

  const summaryItems = [
    { label: "EBITDA", value: num(d.ebitda) },
    { label: "Margen EBITDA %", value: num(d.ebitda_margin_pct) },
  ];

  summaryItems.forEach((s) => {
    const r = ws.addRow([s.label, s.label.includes("%") ? s.value.toFixed(1) + "%" : fmtMoney(s.value)]);
    r.height = 20;
    r.getCell("A").fill = fill(C.lightGreen);
    r.getCell("A").font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    r.getCell("A").alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    r.getCell("B").fill = fill(C.lightGreen);
    r.getCell("B").font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    r.getCell("B").alignment = { horizontal: "right", vertical: "middle" };
  });

  // Interpretacion
  if (d.interpretacion) {
    ws.addRow([]);
    const interpRow = ws.addRow([d.interpretacion]);
    ws.mergeCells(`A${interpRow.number}:B${interpRow.number}`);
    interpRow.getCell(1).font = { italic: true, size: 9, color: { argb: C.grayText }, name: "Calibri" };
    interpRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
    interpRow.height = 48;
  }

  ws.addRow([]);
  const footer = ws.addRow([`Generado por AgroForma — ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`A${footer.number}:B${footer.number}`);
  footer.getCell(1).font = { italic: true, size: 8, color: { argb: C.gray }, name: "Calibri" };
  footer.getCell(1).alignment = { horizontal: "right" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
