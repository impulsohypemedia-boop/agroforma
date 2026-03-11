import ExcelJS from "exceljs";

const GREEN   = "FF3D7A1C";
const DARK    = "FF1A3311";
const WHITE   = "FFFFFFFF";
const GREY_BG = "FFF4F2EE";
const AMBER   = "FFD4AD3C";
const RED     = "FFC0392B";
const LIGHT_G = "FFEBF3E8";
const LIGHT_R = "FFFDE8E8";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateEvolucionHistoricaExcel(data: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AgroForma";
  wb.created = new Date();

  const periodos: string[] = data.periodos ?? [];
  const empresa: string = data.empresa ?? "Empresa";

  function addTitleRows(ws: ExcelJS.Worksheet, title: string, colCount: number) {
    const colLetter = String.fromCharCode(64 + colCount);
    const titleRow = ws.addRow([`AgroForma · ${title}`]);
    titleRow.getCell(1).font = { bold: true, color: { argb: WHITE }, size: 12 };
    titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    ws.mergeCells(`A1:${colLetter}1`);

    const infoRow = ws.addRow([`${empresa}  ·  ${periodos.join(", ")}  ·  ${new Date().toLocaleDateString("es-AR")}`]);
    infoRow.getCell(1).font = { color: { argb: WHITE }, size: 9 };
    infoRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    ws.mergeCells(`A2:${colLetter}2`);

    if (data.moneda_nota) {
      const notaRow = ws.addRow([data.moneda_nota]);
      notaRow.getCell(1).font = { color: { argb: AMBER }, size: 8, italic: true };
      ws.mergeCells(`A3:${colLetter}3`);
    }
    ws.addRow([]);
  }

  const TOTALES = new Set(["RESULTADO BRUTO", "RESULTADO ANTES DE IG", "RESULTADO NETO",
    "TOTAL ACTIVO CORRIENTE", "TOTAL ACTIVO", "TOTAL PASIVO", "PATRIMONIO NETO"]);
  const SUBTOTALES = new Set(["Ventas Netas", "Costo de Ventas", "Gastos de Producción",
    "Gastos de Administración", "Gastos de Financiación"]);

  // ── Sheet 1: Evolución Resultados ─────────────────────────────────────────
  {
    const ev = data.evolucion_resultados;
    if (ev) {
      const ws = wb.addWorksheet("Evolución Resultados");
      const colCount = (ev.headers?.length ?? 1);
      ws.getColumn(1).width = 38;
      for (let i = 2; i <= colCount; i++) ws.getColumn(i).width = 18;

      addTitleRows(ws, "Evolución de Resultados", colCount);

      // Header row
      const headRow = ws.addRow(ev.headers ?? []);
      headRow.eachCell((cell, idx) => {
        cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx === 1 ? DARK : GREEN } };
        cell.alignment = { horizontal: idx === 1 ? "left" : "right" };
      });

      for (const fila of (ev.filas ?? [])) {
        const isTotal    = TOTALES.has(fila.concepto);
        const isSubtotal = SUBTOTALES.has(fila.concepto);
        const isIndented = fila.concepto.startsWith("  ");
        const row = ws.addRow([fila.concepto.trim(), ...(fila.valores ?? [])]);
        row.eachCell((cell, idx) => {
          const v = idx > 1 ? (fila.valores?.[idx - 2] ?? null) : null;
          if (isTotal) {
            cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
          } else if (isSubtotal) {
            cell.font = { bold: true, size: 9 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREY_BG } };
          } else {
            cell.font = { size: 9, italic: isIndented };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
          }
          if (idx === 1) {
            cell.alignment = { horizontal: "left", indent: isIndented ? 2 : 0 };
          } else {
            cell.numFmt = "#,##0";
            cell.alignment = { horizontal: "right" };
            if (idx > 1 && v !== null && typeof v === "number") {
              cell.font = { ...cell.font, color: { argb: v < 0 ? RED : undefined as unknown as string } };
            }
          }
        });
      }
    }
  }

  // ── Sheet 2: Evolución Patrimonial ────────────────────────────────────────
  {
    const ep = data.evolucion_patrimonial;
    if (ep) {
      const ws = wb.addWorksheet("Evolución Patrimonial");
      const colCount = ep.headers?.length ?? 1;
      ws.getColumn(1).width = 36;
      for (let i = 2; i <= colCount; i++) ws.getColumn(i).width = 18;
      addTitleRows(ws, "Evolución Patrimonial", colCount);

      const headRow = ws.addRow(ep.headers ?? []);
      headRow.eachCell((cell, idx) => {
        cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx === 1 ? DARK : GREEN } };
        cell.alignment = { horizontal: idx === 1 ? "left" : "right" };
      });

      for (const fila of (ep.filas ?? [])) {
        const isTotal = TOTALES.has(fila.concepto);
        const row = ws.addRow([fila.concepto, ...(fila.valores ?? [])]);
        row.eachCell((cell, idx) => {
          if (isTotal) {
            cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
          } else {
            cell.font = { size: 9 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
          }
          cell.alignment = { horizontal: idx === 1 ? "left" : "right" };
          if (idx > 1) cell.numFmt = "#,##0";
        });
      }
    }
  }

  // ── Sheet 3: Ratios Históricos ────────────────────────────────────────────
  {
    const er = data.evolucion_ratios;
    if (er) {
      const ws = wb.addWorksheet("Ratios Históricos");
      const colCount = er.headers?.length ?? 1;
      ws.getColumn(1).width = 28;
      for (let i = 2; i <= colCount; i++) ws.getColumn(i).width = 16;
      addTitleRows(ws, "Ratios Históricos", colCount);

      const headRow = ws.addRow(er.headers ?? []);
      headRow.eachCell((cell, idx) => {
        cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx === 1 ? DARK : GREEN } };
        cell.alignment = { horizontal: idx === 1 ? "left" : "right" };
      });

      for (const fila of (er.filas ?? [])) {
        const row = ws.addRow([fila.ratio, ...(fila.valores ?? [])]);
        const valores: (number | null)[] = fila.valores ?? [];
        row.eachCell((cell, idx) => {
          cell.font = { size: 9 };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
          cell.alignment = { horizontal: idx === 1 ? "left" : "right" };
          if (idx > 1) {
            const v = valores[idx - 2];
            const prev = idx > 2 ? valores[idx - 3] : null;
            if (v !== null && prev !== null && v !== undefined && prev !== undefined) {
              const improved = v > prev;
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: improved ? LIGHT_G : LIGHT_R } };
              cell.font = { size: 9, bold: true, color: { argb: improved ? GREEN : RED } };
            }
            if (fila.formato === "porcentaje" && v !== null) cell.numFmt = "0.0%";
            else if (v !== null) cell.numFmt = "0.00";
          }
        });
      }
    }
  }

  // ── Sheet 4: Análisis ─────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Análisis");
    ws.getColumn("A").width = 100;
    addTitleRows(ws, "Análisis y Tendencias", 1);

    const addSection = (title: string, items: string[]) => {
      const hdr = ws.addRow([title]);
      hdr.getCell(1).font = { bold: true, color: { argb: WHITE }, size: 10 };
      hdr.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
      ws.addRow([]);
      for (const item of items) {
        const r = ws.addRow([item]);
        r.getCell(1).font = { size: 9 };
        r.getCell(1).alignment = { wrapText: true };
      }
      ws.addRow([]);
    };

    // Resumen narrativo
    if (data.resumen_narrativo) {
      const hdr = ws.addRow(["RESUMEN EJECUTIVO"]);
      hdr.getCell(1).font = { bold: true, color: { argb: WHITE }, size: 10 };
      hdr.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
      ws.addRow([]);
      const r = ws.addRow([data.resumen_narrativo]);
      r.getCell(1).font = { size: 10 };
      r.getCell(1).alignment = { wrapText: true };
      ws.addRow([]);
    }

    if (data.tendencias?.length) {
      addSection("TENDENCIAS DETECTADAS",
        data.tendencias.map((t: Record<string, string>) =>
          `${t.indicador} — ${t.tendencia} · Mejor año: ${t.mejor_año} · Peor año: ${t.peor_año} · ${t.valor_actual_vs_promedio}`
        )
      );
    }
    if (data.patrones_detectados?.length) addSection("PATRONES DETECTADOS", data.patrones_detectados);
    if (data.alertas_historicas?.length)   addSection("ALERTAS HISTÓRICAS",  data.alertas_historicas);
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
