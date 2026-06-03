import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 120;

const SYSTEM_PROMPT = `Sos un asesor agronómico-económico especializado en empresas agropecuarias argentinas (metodología CREA).

Te van a dar:
1. Un array de lotes con datos esperados y (opcionalmente) reales de rendimiento, precio y costos.
2. Un dataset de benchmark promedio por zona/cultivo.

Tu tarea: analizar los márgenes por lote, comparar contra el benchmark, y generar recomendaciones accionables.

Respondé SOLO con un JSON con esta estructura:

{
  "resumen": "Párrafo ejecutivo de 2-3 oraciones sobre la situación general de márgenes",
  "ranking": [
    {
      "loteId": "id del lote",
      "campo": "nombre del campo",
      "cultivo": "cultivo",
      "hectareas": 100,
      "margenEsperadoHa": 500,
      "margenRealHa": 450,
      "margenBenchmarkHa": 600,
      "desvioVsBenchmark": -25.0,
      "diagnostico": "Explicación breve de por qué este lote rinde más/menos que el benchmark",
      "semaforo": "verde | amarillo | rojo"
    }
  ],
  "recomendaciones": [
    {
      "loteId": "id del lote (o null si es general)",
      "tipo": "rotacion | costos | precio | general",
      "titulo": "Título corto de la recomendación",
      "detalle": "Explicación de la recomendación con números concretos",
      "impacto_estimado": "USD X/ha o porcentaje de mejora estimado"
    }
  ],
  "escenarios_rotacion": [
    {
      "loteId": "id del lote con peor margen",
      "cultivo_actual": "Soja 1ra",
      "cultivo_sugerido": "Maíz",
      "margen_actual_ha": 200,
      "margen_estimado_ha": 600,
      "diferencia_ha": 400,
      "justificacion": "Breve justificación agronómica y económica"
    }
  ]
}

Reglas:
- El ranking debe estar ordenado de PEOR a MEJOR margen/ha.
- Semáforo: rojo si margen/ha < 50% del benchmark, amarillo si 50-85%, verde si >= 85%.
- Si hay datos reales, usá esos para el análisis. Si no, usá los esperados.
- Las recomendaciones deben ser accionables y específicas (no genéricas).
- Los escenarios de rotación solo para lotes con semáforo rojo o amarillo.
- Si no hay benchmark disponible para un cultivo/zona, indicalo en el diagnóstico.
- Respondé SOLO con el JSON, sin texto adicional.`;

export async function POST(request: NextRequest) {
  try {
    const { lotes, campos, benchmarks } = await request.json();

    if (!lotes || lotes.length === 0) {
      return NextResponse.json({ error: "No se recibieron lotes" }, { status: 400 });
    }

    // Build user message with all context
    const lotesConCampo = lotes.map((l: Record<string, unknown>) => ({
      ...l,
      campoNombre: (campos as Record<string, unknown>[])?.find(
        (c: Record<string, unknown>) => c.id === l.campoId
      )?.nombre ?? "Sin campo",
    }));

    const userContent = `## Lotes del plan de siembra

${JSON.stringify(lotesConCampo, null, 2)}

## Benchmark de referencia por zona/cultivo

${JSON.stringify(benchmarks, null, 2)}

Analizá los márgenes de cada lote, compará contra el benchmark y generá el JSON de análisis con ranking, recomendaciones y escenarios de rotación.`;

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
      console.error("Claude response (no JSON):", responseText);
      return NextResponse.json({ error: "Claude no devolvió un JSON válido" }, { status: 500 });
    }

    const data = JSON.parse(jsonStr);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error en /api/gestion/analisis-margen-lote:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}
