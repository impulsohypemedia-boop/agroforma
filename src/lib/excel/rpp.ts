import ExcelJS from "exceljs";

const C = {
  darkGreen:  "FF1A3311",
  lightGreen: "FF3D7A1C",
  white:      "FFFFFFFF",
  rowAlt:     "FFFAFAF8",
  border:     "FFE8E5DE",
  grayText:   "FF9B9488",
  posGreen:   "FF1E7E34",
  negRed:     "FFC0392B",
  gold:       "FFD4AD3C",
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

  const ws = wb.addWorksheet("RPP", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  ws.columns = [
    { width: 4 },
    { width: 36 },
    { width: 8 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
  ];

  // Title
  const t = ws.addRow(["", "RESULTADO POR PRODUCCION (RPP) - METODOLOGIA CREA"]);
  t.height = 32;
  ws.mergeCells(`B${t.number}:L${t.number}`);
  t.getCell("B").fill = fill(C.darkGreen);
  t.getCell("B").font = { bold: true, size: 14, color: { argb: C.white } };
  t.getCell("B").alignment = { horizontal: "center", vertical: "middle" };

  // Info
  const info = [
    ["Empresa:", d.empresa ?? ""],
    ["Campana:", d.campana ?? ""],
    ["Moneda de registro:", d.moneda_registro ?? ""],
  ];
  for (const [l, v] of info) {
    const r = ws.addRow(["", l, "", v]);
    r.getCell("B").font = { bold: true, size: 10 };
    r.getCell("D").font = { size: 10 };
  }
  ws.addRow([]);

  // Currency headers
  const h1 = ws.addRow(["", "", "", "Pesos Corrientes ($)", "", "", "Pesos Constantes ($)", "", "", "Dolares (U$S)"]);
  ws.mergeCells(`D${h1.number}:F${h1.number}`);
  ws.mergeCells(`G${h1.number}:I${h1.number}`);
  ws.mergeCells(`J${h1.number}:L${h1.number}`);
  for (const col of ["D","G","J"]) {
    h1.getCell(col).fill = fill(C.lightGreen);
    h1.getCell(col).font = { bold: true, size: 10, color: { argb: C.white } };
    h1.getCell(col).alignment = { horizontal: "center", vertical: "middle" };
  }

  const h2 = ws.addRow(["", "", "Formula", "Resultado", "% I.Neto", "% EBITDA", "Resultado", "% I.Neto", "% EBITDA", "Resultado", "% I.Neto", "% EBITDA"]);
  h2.height = 20;
  for (let c = 1; c <= 12; c++) {
    h2.getCell(c).fill = fill(C.darkGreen);
    h2.getCell(c).font = { bold: true, size: 9, color: { argb: C.white } };
    h2.getCell(c).alignment = { horizontal: c >= 4 ? "right" : "left", vertical: "middle" };
  }

  // Cascada rows
  const cascada = d.cascada ?? [];
  const subtotales = new Set([3, 5, 9, 12, 14]);

  for (let i = 0; i < cascada.length; i++) {
    const item = cascada[i];
    const isSub = subtotales.has(item.id);
    const r = ws.addRow([
      item.id,
      item.nombre,
      item.formula ?? "",
      fmt(item.pesos_corrientes),
      pct(item.pct_ingreso),
      pct(item.pct_ebitda),
      fmt(item.pesos_constantes),
      pct(item.pct_ingreso),
      pct(item.pct_ebitda),
      fmt(item.dolares),
      pct(item.pct_ingreso),
      pct(item.pct_ebitda),
    ]);
    r.height = 20;

    if (isSub) {
      for (let c = 1; c <= 12; c++) {
        r.getCell(c).fill = fill(C.goldBg);
        r.getCell(c).font = { bold: true, size: 10, color: { argb: "FF1A1A1A" } };
      }
    } else if (i % 2 === 0) {
      for (let c = 1; c <= 12; c++) r.getCell(c).fill = fill(C.rowAlt);
    }

    for (let c = 4; c <= 12; c++) {
      r.getCell(c).alignment = { horizontal: "right", vertical: "middle" };
    }
  }

  // Rentabilidad
  ws.addRow([]);
  const rentRows = [
    ["", "Activo al Inicio", "", fmt(d.activo_inicio)],
    ["", "Rentabilidad Operativa (EBITDA/Activo)", "", pct((d.rentabilidad_operativa ?? 0) * 100)],
    ["", "Rentabilidad por Produccion (RPP/Activo)", "", pct((d.rentabilidad_produccion ?? 0) * 100)],
  ];
  for (const vals of rentRows) {
    const r = ws.addRow(vals);
    r.getCell("B").font = { bold: true, size: 10 };
    r.getCell("D").font = { bold: true, size: 10, color: { argb: C.posGreen } };
    r.getCell("D").alignment = { horizontal: "right" };
  }

  ws.addRow([]);
  const footer = ws.addRow(["", `Generado por AgroForma (CREA) - ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`B${footer.number}:L${footer.number}`);
  footer.getCell("B").font = { italic: true, size: 8, color: { argb: C.grayText } };
  footer.getCell("B").alignment = { horizontal: "right" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
