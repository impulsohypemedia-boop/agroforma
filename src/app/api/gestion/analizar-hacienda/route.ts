import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";
import { extractOutermostJSON } from "@/lib/extractJSON";
import { downloadFromUrl } from "@/lib/download";

export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json({ error: "Falta nombre o URL del archivo" }, { status: 400 });
    }

    const buffer = await downloadFromUrl(url);
    const nameLower = name.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = [];
    let usePdf = false;

    if (nameLower.endsWith(".pdf")) {
      usePdf = true;
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") } });
    } else if (nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls")) {
      const wb = new ExcelJS.Workbook();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await wb.xlsx.load(buffer as any);
      let txt = "";
      wb.eachSheet(sheet => {
        txt += `\n--- ${sheet.name} ---\n`;
        sheet.eachRow(row => {
          txt += (row.values as ExcelJS.CellValue[]).slice(1).map(v => {
            if (v === null || v === undefined) return "";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof v === "object" && (v as any).result !== undefined) return (v as any).result;
            return v.toString();
          }).join("\t") + "\n";
        });
      });
      content.push({ type: "text", text: `=== ${name} ===\n${txt}` });
    } else {
      return NextResponse.json({ error: "Formato no soportado. Usá Excel o PDF." }, { status: 400 });
    }

    content.push({ type: "text", text: "Extraé el inventario de hacienda y devolvé el JSON." });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.beta.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system: `Sos un analista ganadero argentino. Te dan una planilla de stock de hacienda. Extraé el inventario y devolvé SOLO este JSON (sin markdown):
{"categorias": [{"categoria": "Vacas", "cabezas_propias": 120, "cabezas_terceros": 0, "raza": "Aberdeen Angus", "boleto_camara": null, "peso_promedio": 450}]}

Categorías posibles: Vacas, Vacas Preñadas, Vaquillonas, Novillos, Novillitos, Toros, Terneros, Terneras, Bueyes, Otro.
Si un campo no aparece dejalo null. Respondé SOLO el JSON.`,
      messages: [{ role: "user", content }],
      betas: usePdf ? ["pdfs-2024-09-25"] : undefined,
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonStr = extractOutermostJSON(text);
    if (!jsonStr) return NextResponse.json({ error: "No se pudo extraer datos" }, { status: 500 });
    const data = JSON.parse(jsonStr);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
