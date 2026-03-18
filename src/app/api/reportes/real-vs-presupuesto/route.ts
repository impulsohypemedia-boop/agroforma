import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 300;
const SYSTEM_PROMPT = `Sos un controller agropecuario. Te doy datos de un balance (resultados reales) y un presupuesto de campaña (datos proyectados). Compará ambos y devolvé SOLO este JSON, sin texto adicional, sin bloques de código markdown:
{
  "empresa": "nombre",
  "campana": "periodo",
  "resumen": {
    "ingreso_real": number, "ingreso_presupuestado": number, "desvio_ingreso_pct": number,
    "costo_real": number, "costo_presupuestado": number, "desvio_costo_pct": number,
    "resultado_real": number, "resultado_presupuestado": number, "desvio_resultado_pct": number
  },
  "por_cultivo": [
    {"cultivo": "Soja", "has_real": number, "has_presup": number, "rinde_real": number, "rinde_presup": number, "precio_real": number, "precio_presup": number, "ingreso_real": number, "ingreso_presup": number, "costo_real": number, "costo_presup": number, "margen_real": number, "margen_presup": number, "desvio_pct": number}
  ],
  "principales_desvios": [
    {"concepto": "texto", "desvio": number, "causa": "texto explicativo"}
  ],
  "interpretacion": "texto con análisis de los principales desvíos y recomendaciones"
}

Extraé los números exactos. Si un dato no está disponible, estimalo con lo que tengas y aclaralo en la interpretación.`;

export async function POST(request: NextRequest) {
  try {
    const { extractedData, textos_extraidos } = await request.json();
    console.log(`[real-vs-presupuesto] extractedData: ${extractedData?.length ?? "null"}, textos: ${textos_extraidos ? Object.keys(textos_extraidos).length + " files" : "null"}`);

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
    userContent = parts.join("\n\n---\n\n") + `\n\nUsá TODA la información disponible arriba. Generá el JSON de Real vs Presupuestado.`;
    console.log(`[real-vs-presupuesto] prompt length: ${userContent.length} (mode: ${extractedData?.length > 0 ? "structured" : "raw_texts"})`);

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
    console.error("Error en /api/reportes/real-vs-presupuesto:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
