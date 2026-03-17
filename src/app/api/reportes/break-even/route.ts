import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 60;
const SYSTEM_PROMPT = `Sos un analista financiero especializado en empresas agropecuarias argentinas. Te dan documentos contables. Tu tarea es extraer toda la información posible para calcular el punto de equilibrio (break-even) por cultivo.

Completá todo lo que puedas encontrar. Lo que NO encuentres marcalo con null y agregalo a datos_faltantes.

Devolvé SOLO este JSON (sin markdown, sin bloques de código):

{
  "empresa": "string",
  "cuit": "string",
  "ejercicio": "string",
  "fecha_generacion": "string",

  "cultivos": [
    {
      "cultivo": "string",
      "superficie_ha": "number|null",
      "costos_fijos_usd_ha": "number|null",
      "costos_variables_usd_ha": "number|null",
      "costo_total_usd_ha": "number|null",
      "precio_usd_tn": "number|null",
      "be_rinde_tn_ha": "number|null",
      "rinde_actual_tn_ha": "number|null",
      "margen_sobre_be_pct": "number|null"
    }
  ],

  "resumen": {
    "superficie_total_ha": "number|null",
    "costos_fijos_total_usd": "number|null",
    "costos_variables_total_usd": "number|null",
    "costo_total_usd": "number|null",
    "ingreso_real_usd": "number|null",
    "margen_sobre_be_pct": "number|null"
  },

  "tabla_sensibilidad": [
    ["Rinde \\ Precio", "precio_1", "precio_2", "precio_3", "precio_4", "precio_5"],
    ["rinde_1", margen_1_1, margen_1_2, margen_1_3, margen_1_4, margen_1_5],
    ["rinde_2", margen_2_1, margen_2_2, margen_2_3, margen_2_4, margen_2_5]
  ],

  "datos_faltantes": [
    {
      "seccion": "string",
      "dato": "string",
      "documento_sugerido": "string"
    }
  ],

  "completitud_pct": 0,
  "nota_general": "string"
}

Instrucciones:
- be_rinde_tn_ha = costo_total_usd_ha / precio_usd_tn (calculalo si tenés los datos)
- margen_sobre_be_pct = (rinde_actual - be_rinde) / be_rinde * 100 (calculalo si tenés los datos)
- tabla_sensibilidad: generá una grilla de 5 precios × 5 rindes representativos. Los valores deben ser el margen neto en USD/ha para cada combinación. Los precios y rindes deben girar en torno a los valores reales detectados (±30%).
- Si no tenés datos suficientes para calcular, completá con null y explicalo en datos_faltantes.
- Para completitud_pct: calculá qué % de los campos principales tienen datos reales (no null).

Cultivos posibles: Arroz, Avena, Caña de azúcar, Cebada, Cebada Cervecera, Centeno, Garbanzo, Girasol, Maíz, Maíz 2°, Maní, Papa, Poroto, Soja, Soja 2°, Sorgo, Trigo.`;

export async function POST(request: NextRequest) {
  try {
    const { extractedData, textos_extraidos } = await request.json();
    if ((!extractedData || extractedData.length === 0) && !textos_extraidos) {
      return NextResponse.json({ error: "No se recibieron datos" }, { status: 400 });
    }

    let userContent: string;
    if (extractedData && extractedData.length > 0) {
      userContent = `Datos extraídos de los documentos contables:\n${JSON.stringify(extractedData, null, 2)}\n\nGenerá el JSON del Punto de Equilibrio.`;
    } else {
      const textos = Object.entries(textos_extraidos as Record<string, string>)
        .map(([name, text]) => `=== ${name} ===\n${text}`)
        .join("\n\n");
      userContent = `Contenido de los documentos contables:\n\n${textos}\n\nGenerá el JSON del Punto de Equilibrio.`;
    }

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
    console.error("Error en /api/reportes/break-even:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
