import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";

const SYSTEM_PROMPT = `Sos un contador especializado en empresas agropecuarias argentinas. Te van a dar documentos contables (balances, estados de situación patrimonial, anexos, notas). Tu tarea es extraer toda la información y generar un JSON estructurado con la Situación Patrimonial completa.

El JSON debe tener esta estructura:
{
  "empresa": "nombre",
  "cuit": "xx-xxxxxxxx-x",
  "ejercicio": "fecha de cierre",
  "moneda": "Pesos Argentinos - Moneda Homogénea",
  "activo_corriente": {
    "disponibilidades": number,
    "creditos_por_ventas": number,
    "creditos_impositivos": number,
    "creditos_sociales": number,
    "inversiones": number,
    "bienes_de_cambio": number,
    "total": number
  },
  "activo_no_corriente": {
    "bienes_de_uso": number,
    "total": number
  },
  "total_activo": number,
  "pasivo_corriente": {
    "deudas_comerciales": number,
    "deudas_bancarias": number,
    "deudas_impositivas": number,
    "deudas_sociales": number,
    "total": number
  },
  "pasivo_no_corriente": {
    "deudas_bancarias": number,
    "deudas_sociales": number,
    "total": number
  },
  "total_pasivo": number,
  "patrimonio_neto": number,
  "periodo_actual": "31/05/2025",
  "periodo_anterior": "31/05/2024",
  "valores_periodo_anterior": { misma estructura con valores del periodo anterior }
}

Extraé los números exactos del documento. Los números deben ser valores numéricos simples (sin formato, sin puntos ni comas). Respondé SOLO con el JSON, sin texto adicional, sin bloques de código markdown.`;

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
      } else if (name.endsWith(".xls")) {
        messageContent.push({ type: "text", text: `=== Archivo: ${file.name} (XLS binario — convertir a .xlsx) ===` });
      }
    }

    messageContent.push({
      type: "text",
      text: "Procesá los documentos anteriores y generá el JSON de la Situación Patrimonial.",
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
    console.error("Error en /api/reportes/situacion-patrimonial:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
