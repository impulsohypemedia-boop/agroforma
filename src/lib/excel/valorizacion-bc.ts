import ExcelJS from "exceljs";

const C = {
  darkGreen:  "FF1A3311",
  lightGreen: "FF3D7A1C",
  white:      "FFFFFFFF",
  rowAlt:     "FFFAFAF8",
  grayText:   "FF9B9488",
  posGreen:   "FF1E7E34",
  negRed:     "FFC0392B",
  goldBg:     "FFFFF8E7",
};

function fill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function fmt(v: unknown): string {
  const n = typeof v === "number" ? v : 0;
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addItemSection(ws: ExcelJS.Worksheet, item: any, tipo: "producto" | "insumo") {
  // Item header
  const h = ws.addRow(["", item.nombre?.toUpperCase() ?? tipo.toUpperCase()]);
  h.height = 24;
  ws.mergeCells(`B${h.number}:H${h.number}`);
  h.getCell("B").fill = fill(C.lightGreen);
  h.getCell("B").font = { bold: true, size: 11, color: { argb: C.white } };
  h.getCell("B").alignment = { horizontal: "left", vertical: "middle" };

  // Column headers
  const cols = ["", "", "Unidades", "$ Corrientes", "$/Unidad", "U$S", "U$S/Unidad"];
  const ch = ws.addRow(cols);
  ch.height = 20;
  for (let c = 1; c <= 7; c++) {
    ch.getCell(c).fill = fill(C.darkGreen);
    ch.getCell(c).font = { bold: true, size: 9, color: { argb: C.white } };
    ch.getCell(c).alignment = { horizontal: c >= 3 ? "right" : "left", vertical: "middle" };
  }

  const filas = tipo === "producto"
    ? ["Stock al Inicio", "Produccion Valorizada", "Ventas Netas", "Cesiones Netas", "Stock Cierre (Calculado)", "Tenencia", "Stock Cierre (Ajustado)", "Exposicion Inflacion/Devaluacion"]
    : ["Stock al Inicio", "Compras Netas", "Cesiones Netas (Entradas)", "Consumo Valorizado", "Stock Cierre (Calculado)", "Tenencia", "Stock Cierre (Ajustado)", "Exposicion Inflacion/Devaluacion"];

  const u = item.unidades ?? {};
  const pc = item.pesos_corrientes ?? {};
  const dl = item.dolares ?? {};
  const subRows = new Set([4, 5, 6, 7]);

  for (let i = 0; i < filas.length; i++) {
    const label = filas[i];
    const key = label.toLowerCase().replace(/[^a-z]/g, "_").replace(/_+/g, "_");
    const uVal = u[key] ?? 0;
    const pcVal = pc[key] ?? 0;
    const dlVal = dl[key] ?? 0;
    const perUnit = uVal !== 0 ? pcVal / uVal : 0;
    const perUnitD = uVal !== 0 ? dlVal / uVal : 0;

    const r = ws.addRow(["", label, fmt(uVal), fmt(pcVal), fmt(perUnit), fmt(dlVal), fmt(perUnitD)]);
    r.height = 18;

    if (subRows.has(i)) {
      for (let c = 1; c <= 7; c++) {
        r.getCell(c).fill = fill(C.goldBg);
        r.getCell(c).font = { bold: true, size: 10 };
      }
    } else if (i % 2 === 0) {
      for (let c = 1; c <= 7; c++) r.getCell(c).fill = fill(C.rowAlt);
    }

    for (let c = 3; c <= 7; c++) {
      r.getCell(c).alignment = { horizontal: "right", vertical: "middle" };
      if (label.includes("Tenencia") || label.includes("Exposicion")) {
        const val = c === 3 ? uVal : (c <= 5 ? pcVal : dlVal);
        r.getCell(c).font = { size: 10, color: { argb: val >= 0 ? C.posGreen : C.negRed } };
      }
    }
  }

  ws.addRow([]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";

  const ws = wb.addWorksheet("Valorizacion BC", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  ws.columns = [
    { width: 4 },
    { width: 34 },
    { width: 14 },
    { width: 18 },
    { width: 14 },
    { width: 18 },
    { width: 14 },
  ];

  // Title
  const t = ws.addRow(["", "VALORIZACION DE BIENES DE CAMBIO - METODOLOGIA CREA"]);
  t.height = 32;
  ws.mergeCells(`B${t.number}:G${t.number}`);
  t.getCell("B").fill = fill(C.darkGreen);
  t.getCell("B").font = { bold: true, size: 13, color: { argb: C.white } };
  t.getCell("B").alignment = { horizontal: "center", vertical: "middle" };

  const r1 = ws.addRow(["", "Empresa:", d.empresa ?? ""]);
  r1.getCell("B").font = { bold: true, size: 10 };
  const r2 = ws.addRow(["", "Campana:", d.campana ?? ""]);
  r2.getCell("B").font = { bold: true, size: 10 };
  ws.addRow([]);

  // Productos (granos)
  const productos = d.productos ?? [];
  if (productos.length > 0) {
    const ph = ws.addRow(["", "PRODUCTOS (GRANOS)"]);
    ph.height = 22;
    ws.mergeCells(`B${ph.number}:G${ph.number}`);
    ph.getCell("B").font = { bold: true, size: 12, color: { argb: C.lightGreen } };
    ws.addRow([]);

    for (const p of productos) {
      addItemSection(ws, p, "producto");
    }
  }

  // Insumos
  const insumos = d.insumos ?? [];
  if (insumos.length > 0) {
    const ih = ws.addRow(["", "INSUMOS"]);
    ih.height = 22;
    ws.mergeCells(`B${ih.number}:G${ih.number}`);
    ih.getCell("B").font = { bold: true, size: 12, color: { argb: C.lightGreen } };
    ws.addRow([]);

    for (const ins of insumos) {
      addItemSection(ws, ins, "insumo");
    }
  }

  const footer = ws.addRow(["", `Generado por AgroForma (CREA) - ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`B${footer.number}:G${footer.number}`);
  footer.getCell("B").font = { italic: true, size: 8, color: { argb: C.grayText } };
  footer.getCell("B").alignment = { horizontal: "right" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
