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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const ws = wb.addWorksheet("Ratios e Indicadores", {
    pageSetup: { orientation: "portrait", fitToPage: true },
  });

  ws.columns = [
    { width: 28 }, // Indicador
    { width: 36 }, // Fórmula
    { width: 16 }, // Actual
    { width: 16 }, // Anterior
    { width: 14 }, // Variación
    { width: 36 }, // Interpretación
  ];

  // Title
  const titleRow = ws.addRow(["RATIOS E INDICADORES FINANCIEROS"]);
  titleRow.height = 32;
  ws.mergeCells(`A${titleRow.number}:F${titleRow.number}`);
  const tc = titleRow.getCell(1);
  tc.value = "RATIOS E INDICADORES FINANCIEROS";
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
  infoRow("CUIT:", d.cuit ?? "");
  infoRow("Ejercicio:", d.ejercicio ?? "");
  ws.addRow([]);

  // Header
  const hdr = ws.addRow([
    "INDICADOR", "FÓRMULA",
    d.periodo_actual ?? "Actual", d.periodo_anterior ?? "Anterior",
    "VARIACIÓN", "INTERPRETACIÓN",
  ]);
  hdr.height = 22;
  ["A","B","C","D","E","F"].forEach((col) => {
    const c = hdr.getCell(col);
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    c.alignment = {
      horizontal: ["C","D","E"].includes(col) ? "right" : "left",
      vertical: "middle",
      wrapText: true,
    };
    if (col === "A") c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  });

  // Group ratios by categoria
  const ratios: {
    categoria: string;
    indicador: string;
    formula: string;
    valor_actual: number;
    valor_anterior: number;
    unidad: string;
    interpretacion: string;
  }[] = d.ratios ?? [];

  const groups = new Map<string, typeof ratios>();
  for (const r of ratios) {
    const cat = r.categoria ?? "General";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(r);
  }

  let rowIdx = 0;
  groups.forEach((items, categoria) => {
    // Category header
    const catRow = ws.addRow([categoria.toUpperCase()]);
    catRow.height = 20;
    ws.mergeCells(`A${catRow.number}:F${catRow.number}`);
    const cc = catRow.getCell(1);
    cc.value = categoria.toUpperCase();
    cc.fill = fill(C.lightGreen);
    cc.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    cc.alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    rowIdx = 0;
    items.forEach((ratio) => {
      rowIdx++;
      const vAct = num(ratio.valor_actual);
      const vAnt = num(ratio.valor_anterior);
      const varNum = vAct - vAnt;

      function fmtVal(v: number, unit: string): string {
        if (unit === "pct")   return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v) + "%";
        if (unit === "veces") return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + "x";
        if (unit === "pesos") return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
        return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
      }

      const r = ws.addRow([
        "  " + ratio.indicador,
        ratio.formula,
        fmtVal(vAct, ratio.unidad),
        fmtVal(vAnt, ratio.unidad),
        (varNum >= 0 ? "+" : "") + fmtVal(varNum, ratio.unidad),
        ratio.interpretacion,
      ]);
      r.height = 18;

      if (rowIdx % 2 === 0) {
        ["A","B","C","D","E","F"].forEach((col) => { r.getCell(col).fill = fill(C.rowAlt); });
      }

      r.getCell("A").font = { size: 10, name: "Calibri" };
      r.getCell("B").font = { size: 9, color: { argb: C.grayText }, name: "Calibri", italic: true };
      r.getCell("B").alignment = { wrapText: false, vertical: "middle" };
      ["C","D"].forEach((col) => {
        r.getCell(col).font = { bold: true, size: 10, name: "Calibri" };
        r.getCell(col).alignment = { horizontal: "right", vertical: "middle" };
      });
      r.getCell("E").font = { bold: true, size: 10, name: "Calibri", color: { argb: varNum >= 0 ? C.posGreen : C.negRed } };
      r.getCell("E").alignment = { horizontal: "right", vertical: "middle" };
      r.getCell("F").font = { size: 9, color: { argb: C.grayText }, name: "Calibri" };
      r.getCell("F").alignment = { wrapText: true, vertical: "middle" };
    });
  });

  ws.addRow([]);
  const footer = ws.addRow([`Generado por AgroForma — ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`A${footer.number}:F${footer.number}`);
  footer.getCell(1).font = { italic: true, size: 8, color: { argb: C.gray }, name: "Calibri" };
  footer.getCell(1).alignment = { horizontal: "right" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
