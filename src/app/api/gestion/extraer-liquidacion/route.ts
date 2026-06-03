import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";
import { extractOutermostJSON } from "@/lib/extractJSON";
import { downloadFromStorage } from "@/lib/download";

export const maxDuration = 120;

const SYSTEM_PROMPT = `Sos un analista especializado en liquidaciones de granos y hacienda del sector agropecuario argentino.

Te van a dar una liquidación (de cooperativa, acopio, corredor o exportador). Extraé los datos de venta efectiva.

Respondé SOLO con un JSON con esta estructura:

{
  "fuente": "Nombre de la cooperativa/acopio/corredor",
  "fecha": "fecha de la liquidación (ISO o dd/mm/yyyy)",
  "items": [
    {
      "cultivo": "Soja 1ra | Maíz | Trigo | etc (usar nombres estándar)",
      "rendimiento_tnha": 3.5,
      "precio_usd_tn": 310,
      "toneladas_totales": 350,
      "hectareas_liquidadas": 100,
      "descuentos_porcentaje": 2.5,
      "precio_neto_usd_tn": 302,
      "observaciones": "cualquier dato relevante"
    }
  ],
  "gastos_comerciales": {
    "comision_porcentaje": 2,
    "flete_usd_tn": 15,
    "secado_usd_tn": 5,
    "otros_usd_tn": 0
  },
  "confianza": "alta | media | baja",
  "notas": "Cualquier observación sobre la calidad de los datos extraídos"
}

Reglas:
- Si la liquidación tiene toneladas totales pero no hectáreas, dejá hectareas_liquidadas en null.
- Si no podés determinar el rendimiento por hectárea, dejalo en null.
- El precio_neto_usd_tn debe ser el precio después de descuentos y gastos si están disponibles.
- Si el documento tiene precios en ARS, tratá de identificar si hay un tipo de cambio para convertir a USD. Si no lo hay, informá en las notas.
- Normalizá el nombre del cultivo a los estándar: Soja 1ra, Soja 2da, Maíz, Trigo, Girasol, Sorgo, Cebada, Algodón, Maní, Arroz, Poroto.
- Respondé SOLO con el JSON.`;

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json();

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No se recibieron archivos" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks: any[] = [];

    for (const ref of files as { name: string; path: string }[]) {
      const buffer = await downloadFromStorage(ref.path);
      const name = ref.name.toLowerCase();

      if (name.endsWith(".pdf")) {
        blocks.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
        });
      } else if (name.endsWith(".csv")) {
        blocks.push({ type: "text", text: `=== Archivo: ${ref.name} ===\n${buffer.toString("utf-8")}` });
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        try {
          const wb = new ExcelJS.Workbook();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await wb.xlsx.load(buffer as any);
          let txt = `=== Archivo: ${ref.name} ===\n`;
          wb.eachSheet((sheet) => {
            txt += `\n--- Hoja: ${sheet.name} ---\n`;
            sheet.eachRow((row) => {
              txt += (row.values as ExcelJS.CellValue[]).slice(1).map((v) => {
                if (v === null || v === undefined) return "";
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (typeof v === "object" && (v as any).result !== undefined) return (v as any).result;
                return v.toString();
              }).join("\t") + "\n";
            });
          });
          blocks.push({ type: "text", text: txt });
        } catch {
          blocks.push({ type: "text", text: `=== ${ref.name} === [No se pudo leer]` });
        }
      } else {
        blocks.push({ type: "text", text: `=== ${ref.name} ===\n${buffer.toString("utf-8")}` });
      }
    }

    blocks.push({ type: "text", text: "Extraé los datos de la liquidación y devolvé el JSON." });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const hasPdf = blocks.some((b) => b.type === "document");

    const message = hasPdf
      ? await client.beta.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: blocks }],
          betas: ["pdfs-2024-09-25"],
        })
      : await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: blocks }],
        });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonStr = extractOutermostJSON(responseText);

    if (!jsonStr) {
      console.error("Claude response (no JSON):", responseText);
      return NextResponse.json({ error: "No se pudo extraer datos de la liquidación" }, { status: 500 });
    }

    const data = JSON.parse(jsonStr);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error en /api/gestion/extraer-liquidacion:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}
