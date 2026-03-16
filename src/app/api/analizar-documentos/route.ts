import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";
import { ExtractedDocData } from "@/types/analysis";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 60;
const SYSTEM_PROMPT = `Sos un analista especializado en documentación de empresas agropecuarias argentinas. Te van a dar uno o más documentos. Analizalos y devolvé un JSON con:

{
  "empresa": "nombre de la empresa si lo encontrás",
  "cuit": "CUIT si lo encontrás",
  "balances_detectados": 3,
  "ejercicios": ["2022", "2023", "2024"],
  "empresa_consistente": true,
  "modo": "historico",
  "documentos_detectados": [
    {
      "nombre_archivo": "nombre.pdf",
      "tipo": "balance | plan_siembra | liquidacion_granos | liquidacion_hacienda | extracto_bancario | factura | planilla_stock | otro",
      "descripcion": "Balance General ejercicio cerrado al 31/05/2025",
      "periodo": "31/05/2025",
      "datos_disponibles": ["situacion_patrimonial", "estado_resultados", "flujo_efectivo", "ventas_por_cultivo", "costos_produccion", "bienes_de_uso", "deudas"]
    }
  ],
  "reportes_posibles": [
    {
      "id": "situacion_patrimonial",
      "nombre": "Situación Patrimonial",
      "descripcion": "Balance de activos, pasivos y patrimonio neto con comparativo",
      "disponible": true,
      "motivo": "Se detectó estado de situación patrimonial completo"
    },
    {
      "id": "margen_bruto",
      "nombre": "Margen Bruto por Cultivo",
      "descripcion": "Análisis de rentabilidad por cultivo con ingresos y costos",
      "disponible": true,
      "motivo": "Se detectó detalle de ventas por cultivo y costos de producción"
    },
    {
      "id": "ratios",
      "nombre": "Ratios e Indicadores",
      "descripcion": "Ratios de rentabilidad, liquidez, endeudamiento y solvencia",
      "disponible": true,
      "motivo": "Hay datos suficientes para calcular ratios financieros"
    },
    {
      "id": "bridge",
      "nombre": "Bridge de Resultados",
      "descripcion": "Descomposición de la variación del resultado entre ejercicios",
      "disponible": true,
      "motivo": "Hay datos comparativos de dos ejercicios"
    },
    {
      "id": "break_even",
      "nombre": "Punto de Equilibrio",
      "descripcion": "Break-even y tabla de sensibilidad precios vs rindes",
      "disponible": true,
      "motivo": "Se generará con la información disponible. Los campos faltantes quedarán marcados como pendientes."
    },
    {
      "id": "evolucion_historica",
      "nombre": "Evolución Histórica",
      "descripcion": "Análisis de evolución de resultados, patrimonio y ratios en todos los ejercicios",
      "disponible": true,
      "motivo": "Se detectaron múltiples balances del mismo ejercicio"
    },
    {
      "id": "proyeccion",
      "nombre": "Proyección de Campaña",
      "descripcion": "Proyección de resultados para próximas campañas",
      "disponible": false,
      "motivo": "Se necesita un plan de siembra con hectáreas, rindes y precios estimados"
    },
    {
      "id": "ranking_campos",
      "nombre": "Ranking de Campos",
      "descripcion": "Productividad por campo ordenada por tn/ha",
      "disponible": false,
      "motivo": "Se necesita detalle de producción por campo"
    },
    {
      "id": "calificacion_bancaria",
      "nombre": "Calificación Bancaria",
      "descripcion": "Formulario unificado para presentación ante bancos",
      "disponible": true,
      "motivo": "Se generará con la información disponible. Los campos faltantes quedarán marcados como pendientes."
    }
  ]
}

Reglas para disponibilidad:
- situacion_patrimonial, ratios, bridge: disponible si hay balance o estado patrimonial.
- margen_bruto: disponible si hay ventas por cultivo o estado de resultados con detalle de ingresos.
- break_even: SIEMPRE disponible si hay al menos un balance.
- calificacion_bancaria: SIEMPRE disponible si hay al menos un balance.
- evolucion_historica: disponible si hay 2 o más balances de distintos ejercicios de la misma empresa (modo = "historico"). Si solo hay 1 balance, no está disponible (modo = "simple").
- proyeccion: solo disponible si hay plan de siembra con hectáreas, rindes y precios estimados.
- ranking_campos: solo disponible si hay detalle de producción por campo.

Reglas para modo histórico:
- Contá cuántos balances de distintos ejercicios hay. Si hay 2 o más balances de la misma empresa: modo = "historico", balances_detectados = N, ejercicios = lista de años detectados, empresa_consistente = true.
- Si hay balances de distintas empresas: empresa_consistente = false.
- Si hay 1 solo balance: modo = "simple".
- Cuando modo = "historico", actualizá las descripciones de los reportes existentes:
  * situacion_patrimonial: "Balance con comparativo de todos los ejercicios disponibles (N años)"
  * ratios: "Evolución de indicadores financieros a lo largo de N años"
  * bridge: "Disponible entre cualquier par de ejercicios detectados"

Evaluá cada reporte según estas reglas y la información real de los documentos. Respondé SOLO con el JSON.`;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageContent: any[] = [];

    if (contentType.includes("application/json")) {
      // New path: receive pre-extracted data from each document
      const body = await request.json();
      const extractedData: ExtractedDocData[] = body.extractedData ?? [];
      if (extractedData.length === 0) {
        return NextResponse.json({ error: "No se recibieron datos extraídos" }, { status: 400 });
      }
      messageContent.push({
        type: "text",
        text: `Datos extraídos de ${extractedData.length} documento(s):\n${JSON.stringify(extractedData, null, 2)}\n\nAnalizá estos datos y devolvé el JSON de análisis.`,
      });
    } else {
      // Legacy path: receive raw files (single-file uploads, backward compat)
      const formData = await request.formData();
      const files = formData.getAll("files") as File[];
      if (files.length === 0) {
        return NextResponse.json({ error: "No se recibieron archivos" }, { status: 400 });
      }
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const name = file.name.toLowerCase();
        if (name.endsWith(".pdf")) {
          messageContent.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") } });
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
            messageContent.push({ type: "text", text: `=== ${file.name} === [No se pudo leer]` });
          }
        }
      }
      messageContent.push({ type: "text", text: "Analizá los documentos anteriores y devolvé el JSON de análisis." });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.beta.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: messageContent }],
      betas: ["pdfs-2024-09-25"],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonStr = extractOutermostJSON(text);

    if (!jsonStr) {
      console.error("Claude response (no JSON found):", text);
      return NextResponse.json({ error: "No se pudo analizar los documentos" }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("JSON.parse failed:", parseErr, "\nRaw jsonStr:", jsonStr.slice(0, 500));
      return NextResponse.json({ error: "Respuesta de Claude no es JSON válido" }, { status: 500 });
    }

    return NextResponse.json({ data: parsed });
  } catch (err) {
    console.error("Error en /api/analizar-documentos:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}
