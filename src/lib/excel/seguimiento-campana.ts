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
  warnYellow: "FFE67E22",
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
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
}

function fmtPct(v: number): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v) + "%";
}

function estadoLabel(estado: string): string {
  const map: Record<string, string> = {
    en_siembra: "En siembra",
    sembrado: "Sembrado",
    en_cosecha: "En cosecha",
    cosechado: "Cosechado",
    pendiente: "Pendiente",
  };
  return map[estado] ?? estado;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExcel(d: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const ws = wb.addWorksheet("Seguimiento Campaña", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  ws.columns = [
    { width: 16 }, // Cultivo
    { width: 14 }, // Has Plan
    { width: 14 }, // Has Sembradas
    { width: 14 }, // Avance Siembra %
    { width: 14 }, // Has Cosechadas
    { width: 14 }, // Avance Cosecha %
    { width: 14 }, // Rinde Esperado
    { width: 14 }, // Rinde Real
    { width: 14 }, // Estado
  ];

  const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

  // Title
  const titleRow = ws.addRow(["SEGUIMIENTO DE CAMPAÑA"]);
  titleRow.height = 32;
  ws.mergeCells(`A${titleRow.number}:I${titleRow.number}`);
  const tc = titleRow.getCell(1);
  tc.value = "SEGUIMIENTO DE CAMPAÑA";
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
  infoRow("Avance general:", fmtPct(num(d.avance_general_pct)));
  ws.addRow([]);

  // Header
  const hdr = ws.addRow([
    "CULTIVO", "HAS PLAN", "HAS SEMBR.", "AV. SIEMBRA %",
    "HAS COSECH.", "AV. COSECHA %", "RINDE ESP.", "RINDE REAL", "ESTADO",
  ]);
  hdr.height = 22;
  cols.forEach((col) => {
    const c = hdr.getCell(col);
    c.fill = fill(C.darkGreen);
    c.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    c.alignment = {
      horizontal: col === "A" || col === "I" ? "left" : "right",
      vertical: "middle",
      wrapText: true,
    };
  });

  // Data rows
  const cultivos: {
    cultivo: string;
    has_plan: number;
    has_sembradas: number;
    avance_siembra_pct: number;
    has_cosechadas: number;
    avance_cosecha_pct: number;
    rinde_esperado: number;
    rinde_real: number;
    estado: string;
  }[] = d.por_cultivo ?? [];

  cultivos.forEach((cu, idx) => {
    const r = ws.addRow([
      cu.cultivo,
      fmtNum(num(cu.has_plan)),
      fmtNum(num(cu.has_sembradas)),
      fmtPct(num(cu.avance_siembra_pct)),
      fmtNum(num(cu.has_cosechadas)),
      fmtPct(num(cu.avance_cosecha_pct)),
      fmtNum(num(cu.rinde_esperado)),
      fmtNum(num(cu.rinde_real)),
      estadoLabel(cu.estado),
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
    r.getCell("I").font = { bold: true, size: 10, name: "Calibri" };
    r.getCell("I").alignment = { horizontal: "left", vertical: "middle" };
  });

  // Alerts section
  const alertas: { cultivo: string; tipo: string; mensaje: string }[] = d.alertas ?? [];
  if (alertas.length > 0) {
    ws.addRow([]);
    const alertTitle = ws.addRow(["ALERTAS"]);
    alertTitle.height = 22;
    ws.mergeCells(`A${alertTitle.number}:I${alertTitle.number}`);
    const atc = alertTitle.getCell(1);
    atc.value = "ALERTAS";
    atc.fill = fill(C.lightGreen);
    atc.font = { bold: true, size: 10, color: { argb: C.white }, name: "Calibri" };
    atc.alignment = { horizontal: "left", vertical: "middle", indent: 1 };

    alertas.forEach((a) => {
      const r = ws.addRow([a.cultivo, "", a.tipo, "", a.mensaje]);
      r.getCell("A").font = { bold: true, size: 10, name: "Calibri" };
      r.getCell("C").font = { size: 10, color: { argb: C.warnYellow }, name: "Calibri" };
      ws.mergeCells(`E${r.number}:I${r.number}`);
      r.getCell("E").font = { size: 9, color: { argb: C.grayText }, name: "Calibri" };
      r.getCell("E").alignment = { wrapText: true, vertical: "top" };
    });
  }

  // Interpretation
  if (d.interpretacion) {
    ws.addRow([]);
    const intRow = ws.addRow([d.interpretacion]);
    ws.mergeCells(`A${intRow.number}:I${intRow.number}`);
    intRow.getCell(1).font = { italic: true, size: 9, color: { argb: C.grayText }, name: "Calibri" };
    intRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
  }

  ws.addRow([]);
  const footer = ws.addRow([`Generado por AgroForma — ${new Date().toLocaleDateString("es-AR")}`]);
  ws.mergeCells(`A${footer.number}:I${footer.number}`);
  footer.getCell(1).font = { italic: true, size: 8, color: { argb: C.gray }, name: "Calibri" };
  footer.getCell(1).alignment = { horizontal: "right" };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
