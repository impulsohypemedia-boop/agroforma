import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 60;
const SYSTEM_PROMPT = `Sos un analista financiero experto en empresas agropecuarias argentinas. Te dan múltiples balances de la misma empresa de distintos ejercicios. Tu tarea es analizar la evolución completa y devolver un JSON con:

{
  "empresa": "nombre",
  "cuit": "cuit",
  "periodos": ["2018", "2019", "2020"],
  "moneda_nota": "2018 en moneda nominal, 2019 en adelante en moneda homogénea",

  "evolucion_resultados": {
    "headers": ["Concepto", "2018", "2019", "2020"],
    "filas": [
      {"concepto": "Ventas Netas", "valores": [number, number, number]},
      {"concepto": "  Venta Girasol", "valores": [number, number, number]},
      {"concepto": "  Venta Soja", "valores": [number, number, number]},
      {"concepto": "  Venta Maíz", "valores": [number, number, number]},
      {"concepto": "  Venta Trigo", "valores": [number, number, number]},
      {"concepto": "  Venta Cebada", "valores": [number, number, number]},
      {"concepto": "Costo de Ventas", "valores": [number, number, number]},
      {"concepto": "RESULTADO BRUTO", "valores": [number, number, number]},
      {"concepto": "Gastos de Producción", "valores": [number, number, number]},
      {"concepto": "Gastos de Administración", "valores": [number, number, number]},
      {"concepto": "Gastos de Financiación", "valores": [number, number, number]},
      {"concepto": "Resultado Vta Bienes Uso", "valores": [number, number, number]},
      {"concepto": "Resultado Financiero (RECPAM)", "valores": [number, number, number]},
      {"concepto": "RESULTADO ANTES DE IG", "valores": [number, number, number]},
      {"concepto": "Impuesto a las Ganancias", "valores": [number, number, number]},
      {"concepto": "RESULTADO NETO", "valores": [number, number, number]}
    ]
  },

  "evolucion_patrimonial": {
    "headers": ["Concepto", "2018", "2019", "2020"],
    "filas": [
      {"concepto": "Disponibilidades", "valores": [number, null, number]},
      {"concepto": "Créditos por Ventas", "valores": [number, number, number]},
      {"concepto": "Créditos Impositivos", "valores": [number, number, number]},
      {"concepto": "Bienes de Cambio", "valores": [number, number, number]},
      {"concepto": "TOTAL ACTIVO CORRIENTE", "valores": [number, number, number]},
      {"concepto": "Bienes de Uso", "valores": [number, number, number]},
      {"concepto": "TOTAL ACTIVO", "valores": [number, number, number]},
      {"concepto": "Deudas Comerciales", "valores": [number, number, number]},
      {"concepto": "Deudas Bancarias", "valores": [number, number, number]},
      {"concepto": "TOTAL PASIVO", "valores": [number, number, number]},
      {"concepto": "PATRIMONIO NETO", "valores": [number, number, number]}
    ]
  },

  "evolucion_ratios": {
    "headers": ["Ratio", "2018", "2019", "2020"],
    "filas": [
      {"ratio": "Margen Bruto %", "valores": [number, number, number], "formato": "porcentaje"},
      {"ratio": "Margen Neto %", "valores": [number, number, number], "formato": "porcentaje"},
      {"ratio": "ROE %", "valores": [number, number, number], "formato": "porcentaje"},
      {"ratio": "ROA %", "valores": [number, number, number], "formato": "porcentaje"},
      {"ratio": "Liquidez Corriente", "valores": [number, number, number], "formato": "veces"},
      {"ratio": "Endeudamiento", "valores": [number, number, number], "formato": "veces"},
      {"ratio": "Solvencia %", "valores": [number, number, number], "formato": "porcentaje"}
    ]
  },

  "ventas_por_cultivo_historico": [
    {"cultivo": "Girasol", "valores": [number, number, number]},
    {"cultivo": "Soja", "valores": [number, number, number]},
    {"cultivo": "Maíz", "valores": [number, number, number]},
    {"cultivo": "Trigo", "valores": [number, number, number]},
    {"cultivo": "Cebada", "valores": [number, number, number]}
  ],

  "tendencias": [
    {
      "indicador": "nombre",
      "tendencia": "creciente",
      "mejor_año": "2022",
      "peor_año": "2024",
      "valor_actual_vs_promedio": "texto comparativo"
    }
  ],

  "patrones_detectados": [
    "texto del patrón detectado"
  ],

  "alertas_historicas": [
    "texto de la alerta"
  ],

  "resumen_narrativo": "Un párrafo de 5-6 oraciones contando la historia de la empresa en estos años"
}

Extraé TODOS los números exactos de cada balance. Si un dato no está en algún año, poné null. Respondé SOLO con el JSON.`;

export async function POST(request: NextRequest) {
  try {
    const { extractedData } = await request.json();
    if (!extractedData || extractedData.length === 0) {
      return NextResponse.json({ error: "No se recibieron datos" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Datos extraídos de ${extractedData.length} balances:\n${JSON.stringify(extractedData, null, 2)}\n\nAnalizá todos los balances y devolvé el JSON de evolución histórica.`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonStr = extractOutermostJSON(text);
    if (!jsonStr) {
      console.error("Claude response:", text);
      return NextResponse.json({ error: "Claude no devolvió un JSON válido" }, { status: 500 });
    }
    const data = JSON.parse(jsonStr);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error en /api/reportes/evolucion-historica:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
