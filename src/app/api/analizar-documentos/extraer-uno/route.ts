import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";
import { extractOutermostJSON } from "@/lib/extractJSON";
import { downloadFromStorage } from "@/lib/download";

export const maxDuration = 300;

const SYSTEM_PROMPT = `Sos un analista contable especializado en empresas agropecuarias argentinas.
Te dan un único documento contable. Extraé TODOS los datos financieros posibles y devolvelos como JSON estructurado.

Devolvé SOLO este JSON (sin markdown, sin bloques de código):

{
  "nombre_archivo": "string",
  "tipo": "balance | plan_siembra | liquidacion_granos | liquidacion_hacienda | extracto_bancario | planilla_stock | otro",
  "periodo": "string (ej: '31/05/2024' o '2023/24')",
  "empresa": "string",
  "cuit": "string o null",
  "datos": {
    "activo_corriente": null,
    "activo_no_corriente": null,
    "total_activo": null,
    "pasivo_corriente": null,
    "pasivo_no_corriente": null,
    "total_pasivo": null,
    "patrimonio_neto": null,
    "ventas_netas": null,
    "costo_ventas": null,
    "ganancia_bruta": null,
    "gastos_administracion": null,
    "gastos_comercializacion": null,
    "resultado_operativo": null,
    "resultado_financiero": null,
    "resultado_antes_impuestos": null,
    "impuestos": null,
    "resultado_neto": null,
    "ventas_por_cultivo": [],
    "costos_produccion": [],
    "bienes_de_uso_total": null,
    "bienes_de_uso_detalle": [],
    "deudas_bancarias_corrientes": null,
    "deudas_bancarias_no_corrientes": null,
    "deudas_comerciales_corrientes": null,
    "deudas_detalle": [],
    "stock_granos": [],
    "campos": [],
    "disponibilidades": null,
    "creditos_por_ventas": null,
    "creditos_impositivos": null,
    "creditos_sociales": null,
    "inversiones": null,
    "bienes_de_cambio": null,
    "deudas_sociales_corrientes": null,
    "deudas_impositivas_corrientes": null,
    "deudas_sociales_no_corrientes": null,
    "moneda": "ARS",
    "tipo_cambio_usado": null,
    "notas": null,
    "datos_adicionales": {}
  }
}

Reemplazá los null con los valores reales que encuentres en el documento.
Para ventas_por_cultivo: [{ "cultivo": "Soja", "hectareas": number|null, "toneladas": number|null, "precio_promedio": number|null, "monto_total": number }]
Para costos_produccion: [{ "cultivo": "Soja", "costo_semilla": number|null, "costo_fertilizante": number|null, "costo_agroquimicos": number|null, "costo_labores": number|null, "costo_cosecha": number|null, "costo_flete": number|null, "costo_total": number|null, "hectareas": number|null }]
Para deudas_detalle: [{ "entidad": "Banco", "monto": number, "moneda": "ARS|USD", "plazo": "corriente|no corriente" }]

Si un dato no existe en el documento, dejá null. NO inventes datos. Extraé TODO lo que encuentres.

IMPORTANTE: Además del análisis, incluí un campo "texto_completo" en el JSON raíz (al mismo nivel que "nombre_archivo") con TODO el texto del documento tal cual lo ves, sin resumir, con todos los números, tablas y datos. Este texto se usa para generar reportes después sin tener que volver a leer el PDF.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, path } = body;

    if (!name || !path) {
      return NextResponse.json({ error: "Falta nombre o path del archivo" }, { status: 400 });
    }

    const buffer = await downloadFromStorage(path);
    const nameLower = name.toLowerCase();

    // For non-PDF files, we capture text directly. For PDFs, Claude provides texto_completo.
    let rawText = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageContent: any[] = [];

    if (nameLower.endsWith(".pdf")) {
      messageContent.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
      });
    } else if (nameLower.endsWith(".csv")) {
      rawText = buffer.toString("utf-8");
      messageContent.push({ type: "text", text: `=== Archivo: ${name} ===\n${rawText}` });
    } else if (nameLower.endsWith(".xlsx")) {
      try {
        const wb = new ExcelJS.Workbook();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await wb.xlsx.load(buffer as any);
        let txt = `=== Archivo: ${name} ===\n`;
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
        rawText = txt;
        messageContent.push({ type: "text", text: txt });
      } catch {
        messageContent.push({ type: "text", text: `=== ${name} === [No se pudo leer]` });
      }
    }

    messageContent.push({
      type: "text",
      text: `Extraé todos los datos financieros del documento "${name}" y devolvé el JSON completo.`,
    });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const hasPdf = nameLower.endsWith(".pdf");

    const message = hasPdf
      ? await client.beta.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 16384,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: messageContent }],
          betas: ["pdfs-2024-09-25"],
        })
      : await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 16384,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: messageContent }],
        });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonStr = extractOutermostJSON(responseText);
    if (!jsonStr) {
      console.error("Claude extraer-uno response:", responseText);
      return NextResponse.json({ error: "No se pudo extraer datos del documento" }, { status: 500 });
    }
    const data = JSON.parse(jsonStr);
    data.nombre_archivo = name;

    // Extract texto_completo from Claude's response (for PDFs)
    if (data.texto_completo && !rawText) {
      rawText = data.texto_completo;
    }
    // Remove texto_completo from structured data to keep it clean
    const textoCompleto = data.texto_completo || rawText;
    delete data.texto_completo;

    console.log(`[extraer-uno] OK "${name}" → data keys: ${Object.keys(data.datos || {}).filter(k => data.datos[k] !== null).join(", ")}`);
    console.log(`[extraer-uno] OK "${name}" → texto length: ${textoCompleto.length}`);
    return NextResponse.json({ data, texto: textoCompleto });
  } catch (err) {
    console.error("Error en /api/analizar-documentos/extraer-uno:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}
