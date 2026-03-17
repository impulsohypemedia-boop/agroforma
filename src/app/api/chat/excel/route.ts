import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const maxDuration = 300;
// Parse markdown tables from a chat message
function parseMarkdownTables(text: string): { headers: string[]; rows: string[][] }[] {
  const tables: { headers: string[]; rows: string[][] }[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Detect table start: line beginning and ending with |
    if (line.startsWith("|") && line.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("|") || lines[i].trim().match(/^[-|: ]+$/))) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length < 2) continue;

      const parseRow = (l: string) =>
        l.trim().slice(1, -1).split("|").map((c) => c.trim());

      const isSep = (l: string) => l.trim().replace(/[\s|:-]/g, "") === "";

      const dataLines = tableLines.filter((l) => !isSep(l));
      if (dataLines.length < 1) continue;

      const headers = parseRow(dataLines[0]);
      const rows    = dataLines.slice(1).map(parseRow);
      tables.push({ headers, rows });
      continue;
    }
    i++;
  }

  return tables;
}

export async function POST(request: NextRequest) {
  try {
    const { content, empresa } = await request.json();

    const tables = parseMarkdownTables(content ?? "");

    const wb = new ExcelJS.Workbook();
    wb.creator = "AgroForma";
    wb.created = new Date();

    const GREEN   = "FF3D7A1C";
    const DARK    = "FF1A3311";
    const WHITE   = "FFFFFFFF";
    const GREY_BG = "FFF4F2EE";
    const AMBER   = "FFD4AD3C";

    if (tables.length === 0) {
      // No tables found — create a sheet with the plain text
      const ws = wb.addWorksheet("Respuesta");
      ws.getColumn("A").width = 100;

      const titleRow = ws.addRow(["AgroForma · Respuesta del Asistente"]);
      titleRow.getCell(1).font = { bold: true, color: { argb: WHITE }, size: 12 };
      titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };

      const infoRow = ws.addRow([`${empresa ? empresa + " · " : ""}Generado: ${new Date().toLocaleDateString("es-AR")}`]);
      infoRow.getCell(1).font = { color: { argb: WHITE }, size: 9 };
      infoRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };

      ws.addRow([]);

      const plain = (content ?? "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/^#{1,3}\s+/gm, "")
        .replace(/^\|.*\|$/gm, "")
        .replace(/^[-|: ]+$/gm, "")
        .trim();

      for (const line of plain.split("\n")) {
        const r = ws.addRow([line.trim()]);
        r.getCell(1).font = { size: 10 };
      }

    } else {
      // Create one sheet per table
      tables.forEach((table, idx) => {
        const ws = wb.addWorksheet(`Tabla ${idx + 1}`);
        ws.getColumn("A").width = 30;
        table.headers.forEach((_, ci) => {
          if (ci > 0) ws.getColumn(ci + 1).width = 20;
        });

        // Title row
        const titleRow = ws.addRow([`AgroForma · Tabla ${idx + 1}`]);
        titleRow.getCell(1).font = { bold: true, color: { argb: WHITE }, size: 11 };
        titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
        ws.mergeCells(`A1:${String.fromCharCode(64 + table.headers.length)}1`);

        // Sub-info
        const infoRow = ws.addRow([`${empresa ?? ""}  ·  ${new Date().toLocaleDateString("es-AR")}`]);
        infoRow.getCell(1).font = { color: { argb: WHITE }, size: 8 };
        infoRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
        ws.mergeCells(`A2:${String.fromCharCode(64 + table.headers.length)}2`);

        ws.addRow([]);

        // Headers
        const headRow = ws.addRow(table.headers);
        headRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: WHITE }, size: 9 };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
          cell.alignment = { horizontal: "center" };
        });

        // Data rows
        table.rows.forEach((row, ri) => {
          const dr = ws.addRow(row);
          dr.eachCell((cell) => {
            cell.font = { size: 9 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ri % 2 === 0 ? WHITE : GREY_BG } };
          });
        });

        // Amber accent note
        const noteRow = ws.addRow([`Tabla extraída del chat · AgroForma`]);
        noteRow.getCell(1).font = { size: 7, color: { argb: AMBER } };
      });
    }

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="agroforma-chat.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Error en /api/chat/excel:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
