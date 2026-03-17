import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 300;
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
    const { extractedData, textos_extraidos } = await request.json();
    console.log(`[bridge] extractedData: ${extractedData?.length ?? "null"}, textos: ${textos_extraidos ? Object.keys(textos_extraidos).length + " files" : "null"}`);

    if ((!extractedData || extractedData.length === 0) && !textos_extraidos) {
      return NextResponse.json({ error: "No se recibieron datos" }, { status: 400 });
    }

    let userContent: string;
    if (extractedData && extractedData.length > 0) {
      userContent = `Datos extraídos de los documentos contables:\n${JSON.stringify(extractedData, null, 2)}\n\nGenerá el JSON del Bridge de Resultados.`;
    } else {
      const textos = Object.entries(textos_extraidos as Record<string, string>)
        .map(([name, text]) => `=== ${name} ===\n${text}`)
        .join("\n\n");
      userContent = `Contenido de los documentos contables:\n\n${textos}\n\nGenerá el JSON del Bridge de Resultados.`;
    }
    console.log(`[bridge] prompt length: ${userContent.length} (mode: ${extractedData?.length > 0 ? "structured" : "raw_texts"})`);

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
    console.error("Error en /api/reportes/bridge:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
