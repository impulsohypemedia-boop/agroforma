import ExcelJS from "exceljs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateBreakEvenExcel(data: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const GREEN     = "FF3D7A1C";
  const GREEN_BG  = "FFEBF3E8";
  const AMBER     = "FFB8922A";
  const AMBER_BG  = "FFFFF3CD";
  const RED       = "FFC0392B";
  const RED_BG    = "FFFDE8E8";
  const GREY_BG   = "FFF4F2EE";
  const HEADER_BG = "FF2D6A4F";
  const WHITE     = "FFFFFFFF";
  const DARK      = "FF1A1A1A";

  function col(ws: ExcelJS.Worksheet, letter: string, width: number) {
    ws.getColumn(letter).width = width;
  }

  function header(ws: ExcelJS.Worksheet, title: string, cols: string[], widths: number[]) {
    cols.forEach((c, i) => col(ws, c, widths[i]));
    const row = ws.addRow([title]);
    row.getCell(1).font = { bold: true, color: { argb: WHITE }, size: 11 };
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BG } };
    row.getCell(1).alignment = { horizontal: "center" };
    ws.mergeCells(`A${row.number}:${cols[cols.length - 1]}${row.number}`);
    return row.number;
  }

  function subheader(ws: ExcelJS.Worksheet, labels: string[], cols: string[]) {
    const row = ws.addRow(labels);
    row.eachCell((cell, i) => {
      if (i <= cols.length) {
        cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
        cell.alignment = { horizontal: "center" };
        cell.border = { bottom: { style: "thin", color: { argb: GREEN } } };
      }
    });
    return row.number;
  }

  function dataRow(ws: ExcelJS.Worksheet, values: unknown[], shade = false) {
    const row = ws.addRow(values as (string | number | null | undefined)[]);
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: shade ? GREY_BG : WHITE } };
      cell.alignment = { vertical: "middle" };
    });
    return row;
  }

  function pendingCell(cell: ExcelJS.Cell) {
    cell.value = "PENDIENTE";
    cell.font = { color: { argb: AMBER }, bold: true, size: 9 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AMBER_BG } };
  }

  function fmt(v: unknown): string {
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return v.toLocaleString("es-AR");
    return String(v);
  }

  // ── Sheet 1: Portada ──────────────────────────────────────────────────────
  const portada = wb.addWorksheet("Portada");
  portada.getColumn("A").width = 35;
  portada.getColumn("B").width = 30;

  const t = portada.addRow(["PUNTO DE EQUILIBRIO"]);
  t.getCell(1).font = { bold: true, size: 16, color: { argb: GREEN } };
  portada.mergeCells(`A1:B1`);
  portada.addRow([]);
  portada.addRow(["Empresa", data.empresa ?? ""]);
  portada.addRow(["CUIT", data.cuit ?? ""]);
  portada.addRow(["Ejercicio", data.ejercicio ?? ""]);
  portada.addRow(["Fecha de generación", data.fecha_generacion ?? new Date().toLocaleDateString("es-AR")]);
  portada.addRow([]);

  const completitud = data.completitud_pct ?? 0;
  const compRow = portada.addRow(["Completitud del formulario", `${completitud}%`]);
  compRow.getCell(2).font = {
    bold: true,
    color: { argb: completitud >= 70 ? GREEN : completitud >= 40 ? AMBER : RED },
  };
  portada.addRow([]);
  if (data.nota_general) {
    portada.addRow(["Nota", data.nota_general]);
  }

  // ── Sheet 2: Break-Even por Cultivo ───────────────────────────────────────
  const ws = wb.addWorksheet("Break-Even");
  header(ws, "PUNTO DE EQUILIBRIO POR CULTIVO", ["A", "B", "C", "D", "E", "F", "G"], [22, 18, 18, 18, 18, 18, 22]);
  subheader(ws, ["Cultivo", "Costos Fijos (USD/ha)", "Costos Variables (USD/ha)", "Costo Total (USD/ha)", "Precio (USD/tn)", "BE Rinde (tn/ha)", "Rinde Actual (tn/ha)"], ["A", "B", "C", "D", "E", "F", "G"]);

  const cultivos: unknown[] = data.cultivos ?? [];
  if (cultivos.length === 0) {
    const r = ws.addRow(["Sin datos de cultivos"]);
    r.getCell(1).font = { color: { argb: AMBER }, italic: true };
    ws.mergeCells(`A${r.number}:G${r.number}`);
  } else {
    cultivos.forEach((c: unknown, i) => {
      const cu = c as Record<string, unknown>;
      const shade = i % 2 === 1;
      const row = dataRow(ws, [
        cu.cultivo ?? null,
        cu.costos_fijos_usd_ha ?? null,
        cu.costos_variables_usd_ha ?? null,
        cu.costo_total_usd_ha ?? null,
        cu.precio_usd_tn ?? null,
        cu.be_rinde_tn_ha ?? null,
        cu.rinde_actual_tn_ha ?? null,
      ], shade);

      // Highlight BE vs rinde actual
      const be = cu.be_rinde_tn_ha as number | null;
      const rinde = cu.rinde_actual_tn_ha as number | null;
      if (be !== null && rinde !== null) {
        const cell = row.getCell(6);
        cell.fill = {
          type: "pattern", pattern: "solid",
          fgColor: { argb: rinde >= be ? GREEN_BG : RED_BG },
        };
        cell.font = { bold: true, color: { argb: rinde >= be ? GREEN : RED } };
      }

      // Mark pending cells
      [2, 3, 4, 5, 6, 7].forEach((colIdx) => {
        if (row.getCell(colIdx).value === null) pendingCell(row.getCell(colIdx));
      });
    });
  }

  ws.addRow([]);

  // ── Sheet 3: Resumen General ──────────────────────────────────────────────
  const resumen = wb.addWorksheet("Resumen");
  header(resumen, "RESUMEN BREAK-EVEN", ["A", "B"], [35, 28]);

  const res = data.resumen ?? {};
  const resRows: [string, unknown][] = [
    ["Superficie total (ha)", res.superficie_total_ha],
    ["Costos fijos totales (USD)", res.costos_fijos_total_usd],
    ["Costos variables totales (USD)", res.costos_variables_total_usd],
    ["Costo total (USD)", res.costo_total_usd],
    ["Ingreso real (USD)", res.ingreso_real_usd],
    ["Margen sobre BE (%)", res.margen_sobre_be_pct],
  ];

  resRows.forEach(([label, value], i) => {
    const r = resumen.addRow([label, value ?? null]);
    r.getCell(1).font = { bold: true, color: { argb: DARK } };
    r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? WHITE : GREY_BG } };
    r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? WHITE : GREY_BG } };
    if (value === null || value === undefined) pendingCell(r.getCell(2));
    else if (label.includes("%")) {
      const pct = value as number;
      r.getCell(2).font = { bold: true, color: { argb: pct >= 0 ? GREEN : RED } };
    }
  });

  resumen.addRow([]);

  // ── Sheet 4: Tabla de Sensibilidad ────────────────────────────────────────
  const sens = wb.addWorksheet("Sensibilidad");
  header(sens, "TABLA DE SENSIBILIDAD — PRECIO vs. RINDE", ["A", "B", "C", "D", "E", "F", "G"], [20, 16, 16, 16, 16, 16, 16]);

  const tabla = data.tabla_sensibilidad ?? [];
  if (tabla.length === 0) {
    const r = sens.addRow(["Sin datos de sensibilidad"]);
    r.getCell(1).font = { color: { argb: AMBER }, italic: true };
    sens.mergeCells(`A${r.number}:G${r.number}`);
  } else {
    // First row = headers (precios)
    const firstRow = tabla[0] as unknown[];
    const hRow = sens.addRow(firstRow as (string | number | null | undefined)[]);
    hRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: WHITE } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
      cell.alignment = { horizontal: "center" };
    });

    for (let i = 1; i < tabla.length; i++) {
      const dRow = sens.addRow((tabla[i] as unknown[]) as (string | number | null | undefined)[]);
      dRow.eachCell((cell, colIdx) => {
        const v = cell.value;
        if (colIdx === 1) {
          cell.font = { bold: true };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_BG } };
        } else if (typeof v === "number") {
          cell.fill = {
            type: "pattern", pattern: "solid",
            fgColor: { argb: v >= 0 ? GREEN_BG : RED_BG },
          };
          cell.font = { color: { argb: v >= 0 ? GREEN : RED } };
        }
        cell.alignment = { horizontal: "center" };
      });
    }
  }

  // ── Sheet 5: Datos Faltantes ──────────────────────────────────────────────
  const faltantes = wb.addWorksheet("Datos Faltantes");
  header(faltantes, "DATOS FALTANTES", ["A", "B", "C"], [25, 35, 35]);
  subheader(faltantes, ["Sección", "Dato faltante", "Documento sugerido"], ["A", "B", "C"]);

  const df: unknown[] = data.datos_faltantes ?? [];
  if (df.length === 0) {
    const r = faltantes.addRow(["—", "Todos los datos están completos", "—"]);
    r.getCell(1).font = { color: { argb: GREEN } };
  } else {
    df.forEach((d: unknown, i) => {
      const item = d as Record<string, unknown>;
      const r = faltantes.addRow([item.seccion ?? "", item.dato ?? "", item.documento_sugerido ?? ""]);
      r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? WHITE : GREY_BG } };
      r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? WHITE : GREY_BG } };
      r.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? WHITE : GREY_BG } };
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function fmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return v.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  return String(v);
}
