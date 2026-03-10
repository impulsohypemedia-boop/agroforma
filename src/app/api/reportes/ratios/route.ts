import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";

const SYSTEM_PROMPT = `Sos un analista financiero especializado en empresas agropecuarias argentinas. Te van a dar documentos contables (balances, estados de situación patrimonial, estados de resultados). Tu tarea es calcular los principales ratios financieros y devolverlos en un JSON estructurado.

Calculá los siguientes ratios agrupados por categoría:

RENTABILIDAD:
- ROE = Resultado Neto / Patrimonio Neto (expresado en %)
- ROA = Resultado Neto / Total Activo (expresado en %)
- Margen Bruto = Resultado Bruto / Ventas Netas (expresado en %)
- Margen Neto = Resultado Neto / Ventas Netas (expresado en %)

LIQUIDEZ:
- Liquidez Corriente = Activo Corriente / Pasivo Corriente (expresado en "veces")
- Liquidez Seca = (Activo Corriente - Bienes de Cambio) / Pasivo Corriente (expresado en "veces")
- Capital de Trabajo = Activo Corriente - Pasivo Corriente (expresado en "pesos")

ENDEUDAMIENTO:
- Razón de Endeudamiento = Total Pasivo / Total Activo (expresado en %)
- Deuda sobre Patrimonio = Total Pasivo / Patrimonio Neto (expresado en "veces")

SOLVENCIA:
- Índice de Solvencia = Total Activo / Total Pasivo (expresado en "veces")
- Patrimonio sobre Activo = Patrimonio Neto / Total Activo (expresado en %)

El JSON debe tener esta estructura:
{
  "empresa": "nombre",
  "cuit": "xx-xxxxxxxx-x",
  "ejercicio": "fecha de cierre",
  "periodo_actual": "31/05/2025",
  "periodo_anterior": "31/05/2024",
  "ratios": [
    {
      "categoria": "Rentabilidad",
      "indicador": "ROE",
      "formula": "Resultado Neto / Patrimonio Neto",
      "valor_actual": 15.3,
      "valor_anterior": 12.1,
      "unidad": "pct",
      "interpretacion": "Por cada $100 de capital propio, la empresa generó $15,30 de utilidad"
    }
  ]
}

Las unidades posibles son: "pct" (porcentaje), "veces" (ratio), "pesos" (valor monetario).
Para capital de trabajo usar "pesos".
Calculá con precisión. Si no tenés el dato de un ratio, no lo incluyas.
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
      text: "Procesá los documentos anteriores y generá el JSON de Ratios e Indicadores.",
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
    console.error("Error en /api/reportes/ratios:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
