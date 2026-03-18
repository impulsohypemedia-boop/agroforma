import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 300;
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
    const { extractedData, textos_extraidos } = await request.json();
    console.log(`[situacion-patrimonial] extractedData: ${extractedData ? extractedData.length + " items" : "null"}`);
    console.log(`[situacion-patrimonial] textos_extraidos: ${textos_extraidos ? Object.keys(textos_extraidos).length + " files, total " + Object.values(textos_extraidos).reduce((a: number, b: unknown) => a + String(b).length, 0) + " chars" : "null"}`);

    if ((!extractedData || extractedData.length === 0) && !textos_extraidos) {
      return NextResponse.json({ error: "No se recibieron datos" }, { status: 400 });
    }

    // Build user message: combine both structured data and raw texts when available
    let userContent: string;
    const parts: string[] = [];
    if (extractedData && extractedData.length > 0) {
      parts.push(`Datos estructurados extraídos:\n${JSON.stringify(extractedData, null, 2)}`);
    }
    if (textos_extraidos && Object.keys(textos_extraidos).length > 0) {
      const textos = Object.entries(textos_extraidos as Record<string, string>)
        .map(([name, text]) => `=== ${name} ===\n${text}`)
        .join("\n\n");
      parts.push(`Texto completo de los documentos:\n\n${textos}`);
    }
    userContent = parts.join("\n\n---\n\n") + `\n\nUsá TODA la información disponible arriba. Generá el JSON de la Situación Patrimonial.`;
    console.log(`[situacion-patrimonial] userContent length: ${userContent.length} chars (mode: ${extractedData?.length > 0 ? "structured" : "raw_texts"})`);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonStr = extractOutermostJSON(responseText);
    if (!jsonStr) {
      console.error("Claude response:", responseText);
      return NextResponse.json({ error: "Claude no devolvió un JSON válido" }, { status: 500 });
    }
    const data = JSON.parse(jsonStr);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error en /api/reportes/situacion-patrimonial:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
