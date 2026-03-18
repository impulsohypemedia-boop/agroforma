import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 300;
const SYSTEM_PROMPT = `Sos un analista financiero agropecuario. Con los datos del balance que te doy, calculá el EBITDA agropecuario. Extraé los números exactos del documento. Los números deben ser valores numéricos simples. Respondé SOLO con el JSON, sin texto adicional, sin bloques de código markdown.

El JSON debe tener esta estructura:
{
  "empresa": "nombre",
  "ejercicio": "periodo",
  "resultado_operativo": number,
  "amortizaciones": number,
  "depreciaciones": number,
  "impuesto_ganancias": number,
  "resultados_financieros": number,
  "ebitda": number,
  "ebitda_margin_pct": number,
  "ventas_netas": number,
  "detalle": [
    {"concepto": "Resultado Bruto", "monto": number},
    {"concepto": "- Gastos Administración", "monto": number},
    {"concepto": "- Gastos Producción", "monto": number},
    {"concepto": "= Resultado Operativo", "monto": number},
    {"concepto": "+ Amortizaciones y Depreciaciones", "monto": number},
    {"concepto": "= EBITDA", "monto": number}
  ],
  "interpretacion": "texto de 3-4 oraciones explicando qué significa este EBITDA para la empresa"
}`;

export async function POST(request: NextRequest) {
  try {
    const { extractedData, textos_extraidos } = await request.json();
    console.log(`[ebitda] extractedData: ${extractedData?.length ?? "null"}, textos: ${textos_extraidos ? Object.keys(textos_extraidos).length + " files" : "null"}`);

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
    userContent = parts.join("\n\n---\n\n") + `\n\nUsá TODA la información disponible arriba. Generá el JSON del EBITDA Agro.`;
    console.log(`[ebitda] prompt length: ${userContent.length} (mode: ${extractedData?.length > 0 ? "structured" : "raw_texts"})`);

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
    console.error("Error en /api/reportes/ebitda:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
