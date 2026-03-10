import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";

const SYSTEM_PROMPT = `Sos un analista agropecuario especializado en empresas agrícolas argentinas. Te van a dar documentos contables (balances, estados de resultados, anexos de ventas y costos). Tu tarea es extraer la información de ventas por cultivo y costos, y generar un JSON con el Margen Bruto por Cultivo.

Buscá en el documento:
- Anexo II o Detalle de Ventas Netas: ventas por cultivo (Girasol, Soja, Maíz, Trigo, Cebada, etc.) con montos del periodo actual y anterior
- Costo de Productos Vendidos: existencias iniciales (cereales, sementeras, insumos), compras, existencias finales
- Estado de Resultados: resultado bruto de producción, gastos de producción desglosados (fletes, alquileres, honorarios técnicos, servicios de cosecha, etc.)

El JSON debe tener esta estructura:
{
  "empresa": "nombre",
  "cuit": "xx-xxxxxxxx-x",
  "ejercicio": "fecha de cierre",
  "periodo_actual": "31/05/2025",
  "periodo_anterior": "31/05/2024",
  "ventas_por_cultivo": [
    {
      "cultivo": "Girasol",
      "ventas_actual": number,
      "ventas_anterior": number,
      "variacion_pct": number
    }
  ],
  "total_ventas_actual": number,
  "total_ventas_anterior": number,
  "costo_ventas": {
    "existencias_iniciales": {
      "cereales": number,
      "sementeras": number,
      "insumos": number,
      "total": number
    },
    "compras": number,
    "existencias_finales": {
      "cereales": number,
      "sementeras": number,
      "insumos": number,
      "total": number
    },
    "costo_total_actual": number,
    "costo_total_anterior": number
  },
  "resultado_bruto_actual": number,
  "resultado_bruto_anterior": number,
  "margen_bruto_pct_actual": number,
  "margen_bruto_pct_anterior": number,
  "gastos_produccion": {
    "fletes": number,
    "alquileres": number,
    "honorarios_tecnicos": number,
    "servicios_cosecha": number,
    "seguros": number,
    "combustibles": number,
    "reparaciones": number,
    "otros": number,
    "total_actual": number,
    "total_anterior": number
  },
  "resultado_operativo_actual": number,
  "resultado_operativo_anterior": number,
  "margen_operativo_pct_actual": number,
  "margen_operativo_pct_anterior": number
}

Extraé los números exactos del documento. Los números deben ser valores numéricos simples. Respondé SOLO con el JSON, sin texto adicional, sin bloques de código markdown.`;

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
              const vals = (row.values as ExcelJS.CellValue[]).slice(1);
              txt += vals.map((v) => {
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
      text: "Procesá los documentos anteriores y generá el JSON del Margen Bruto por Cultivo.",
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
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("Claude response:", responseText);
      return NextResponse.json({ error: "Claude no devolvió un JSON válido" }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error en /api/reportes/margen-bruto:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
