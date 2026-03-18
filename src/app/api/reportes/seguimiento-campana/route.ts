import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 300;
const SYSTEM_PROMPT = `Sos un analista agropecuario. Con el plan de siembra y datos de avance disponibles, generá un seguimiento del estado de la campaña. Devolvé SOLO este JSON, sin texto adicional, sin bloques de código markdown:
{
  "empresa": "nombre",
  "campana": "periodo",
  "avance_general_pct": number,
  "por_cultivo": [
    {"cultivo": "Soja", "has_plan": number, "has_sembradas": number, "avance_siembra_pct": number, "has_cosechadas": number, "avance_cosecha_pct": number, "rinde_esperado": number, "rinde_real": number, "estado": "en_siembra|sembrado|en_cosecha|cosechado|pendiente"}
  ],
  "alertas": [{"cultivo": "nombre", "tipo": "retraso|desvio_rinde|otro", "mensaje": "texto"}],
  "interpretacion": "texto con resumen del avance y recomendaciones"
}
Si no hay datos de avance real, estimá según fechas típicas de la zona pampeana argentina. Aclaralo en la interpretación.`;

export async function POST(request: NextRequest) {
  try {
    const { extractedData, textos_extraidos } = await request.json();
    console.log(`[seguimiento-campana] extractedData: ${extractedData?.length ?? "null"}, textos: ${textos_extraidos ? Object.keys(textos_extraidos).length + " files" : "null"}`);

    if ((!extractedData || extractedData.length === 0) && !textos_extraidos) {
      return NextResponse.json({ error: "No se recibieron datos" }, { status: 400 });
    }

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
    userContent = parts.join("\n\n---\n\n") + `\n\nUsá TODA la información disponible arriba. Generá el JSON del Seguimiento de Campaña.`;
    console.log(`[seguimiento-campana] prompt length: ${userContent.length} (mode: ${extractedData?.length > 0 ? "structured" : "raw_texts"})`);

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
    console.error("Error en /api/reportes/seguimiento-campana:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
