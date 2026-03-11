import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";

const SYSTEM_PROMPT = `Sos un analista financiero especializado en empresas agropecuarias argentinas. Te dan documentos contables. Tu tarea es extraer toda la información posible para calcular el punto de equilibrio (break-even) por cultivo.

Completá todo lo que puedas encontrar. Lo que NO encuentres marcalo con null y agregalo a datos_faltantes.

Devolvé SOLO este JSON (sin markdown, sin bloques de código):

{
  "empresa": "string",
  "cuit": "string",
  "ejercicio": "string",
  "fecha_generacion": "string",

  "cultivos": [
    {
      "cultivo": "string",
      "superficie_ha": "number|null",
      "costos_fijos_usd_ha": "number|null",
      "costos_variables_usd_ha": "number|null",
      "costo_total_usd_ha": "number|null",
      "precio_usd_tn": "number|null",
      "be_rinde_tn_ha": "number|null",
      "rinde_actual_tn_ha": "number|null",
      "margen_sobre_be_pct": "number|null"
    }
  ],

  "resumen": {
    "superficie_total_ha": "number|null",
    "costos_fijos_total_usd": "number|null",
    "costos_variables_total_usd": "number|null",
    "costo_total_usd": "number|null",
    "ingreso_real_usd": "number|null",
    "margen_sobre_be_pct": "number|null"
  },

  "tabla_sensibilidad": [
    ["Rinde \\ Precio", "precio_1", "precio_2", "precio_3", "precio_4", "precio_5"],
    ["rinde_1", margen_1_1, margen_1_2, margen_1_3, margen_1_4, margen_1_5],
    ["rinde_2", margen_2_1, margen_2_2, margen_2_3, margen_2_4, margen_2_5]
  ],

  "datos_faltantes": [
    {
      "seccion": "string",
      "dato": "string",
      "documento_sugerido": "string"
    }
  ],

  "completitud_pct": 0,
  "nota_general": "string"
}

Instrucciones:
- be_rinde_tn_ha = costo_total_usd_ha / precio_usd_tn (calculalo si tenés los datos)
- margen_sobre_be_pct = (rinde_actual - be_rinde) / be_rinde * 100 (calculalo si tenés los datos)
- tabla_sensibilidad: generá una grilla de 5 precios × 5 rindes representativos. Los valores deben ser el margen neto en USD/ha para cada combinación. Los precios y rindes deben girar en torno a los valores reales detectados (±30%).
- Si no tenés datos suficientes para calcular, completá con null y explicalo en datos_faltantes.
- Para completitud_pct: calculá qué % de los campos principales tienen datos reales (no null).

Cultivos posibles: Arroz, Avena, Caña de azúcar, Cebada, Cebada Cervecera, Centeno, Garbanzo, Girasol, Maíz, Maíz 2°, Maní, Papa, Poroto, Soja, Soja 2°, Sorgo, Trigo.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No se recibieron archivos" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageContent: any[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const name = file.name.toLowerCase();

      if (name.endsWith(".pdf")) {
        messageContent.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
        });
      } else if (name.endsWith(".csv") || file.type === "text/csv") {
        messageContent.push({ type: "text", text: `=== Archivo: ${file.name} ===\n${buffer.toString("utf-8")}` });
      } else if (name.endsWith(".xlsx")) {
        try {
          const wb = new ExcelJS.Workbook();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await wb.xlsx.load(buffer as any);
          let txt = `=== Archivo: ${file.name} ===\n`;
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
          messageContent.push({ type: "text", text: txt });
        } catch {
          messageContent.push({ type: "text", text: `=== Archivo: ${file.name} === [No se pudo leer]` });
        }
      }
    }

    messageContent.push({
      type: "text",
      text: "Procesá los documentos y generá el JSON del Punto de Equilibrio.",
    });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.beta.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: messageContent }],
      betas: ["pdfs-2024-09-25"],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const stripped = responseText.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("Claude response:", responseText);
      return NextResponse.json({ error: "Claude no devolvió un JSON válido" }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error en /api/reportes/break-even:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
