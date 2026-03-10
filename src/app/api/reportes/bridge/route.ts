import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";

const SYSTEM_PROMPT = `Sos un analista financiero especializado en empresas agropecuarias argentinas. Te van a dar documentos contables con dos ejercicios comparativos (balance, estado de resultados). Tu tarea es construir un Bridge de Resultados que explique la variación del resultado entre los dos ejercicios.

El Bridge descompone la variación total del resultado en sus causas principales. Identificá y cuantificá cada factor que contribuyó al cambio:

Factores típicos en empresas agropecuarias:
- Variación en ventas (por precio y/o volumen)
- Variación por cultivo (soja, maíz, girasol, trigo, etc.)
- Variación en costo de ventas / existencias
- Variación en gastos de producción (fletes, alquileres, honorarios, etc.)
- Variación en gastos de administración
- Variación en resultados financieros
- Variación por diferencias de cambio
- Variación en amortizaciones y depreciaciones
- Otros efectos

El JSON debe tener esta estructura exacta:
{
  "empresa": "nombre",
  "cuit": "xx-xxxxxxxx-x",
  "ejercicio": "fecha de cierre del ejercicio actual",
  "periodo_actual": "31/05/2025",
  "periodo_anterior": "31/05/2024",
  "resultado_anterior": 5000000,
  "resultado_actual": 7500000,
  "variacion_total": 2500000,
  "items": [
    {
      "concepto": "Variación en ventas netas",
      "impacto": 3200000,
      "descripcion": "Mayor volumen de ventas de soja (+$2,1M) y maíz (+$1,1M)"
    },
    {
      "concepto": "Variación en costo de ventas",
      "impacto": -800000,
      "descripcion": "Aumento en el costo de producción por mayores insumos"
    }
  ],
  "conclusion": "El resultado del ejercicio mejoró un X% respecto al período anterior, impulsado principalmente por... Los principales factores negativos fueron..."
}

IMPORTANTE:
- Los impactos positivos suman al resultado (favorables)
- Los impactos negativos restan al resultado (desfavorables)
- La suma de todos los items debe aproximarse a variacion_total
- resultado_anterior + variacion_total = resultado_actual
- Incluí entre 4 y 8 factores relevantes
- La conclusión debe ser concisa (2-3 oraciones) y mencionar los factores más importantes
- Los números deben ser valores numéricos simples (sin formato)
Respondé SOLO con el JSON, sin texto adicional, sin bloques de código markdown.`;

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
      text: "Procesá los documentos anteriores y generá el JSON del Bridge de Resultados.",
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
    console.error("Error en /api/reportes/bridge:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
