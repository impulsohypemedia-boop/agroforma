import { NextRequest } from "next/server";
import { generateReport } from "@/lib/reportes/generate";

export const maxDuration = 300;

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
  return generateReport(request, {
    name: "evolucion-historica",
    systemPrompt: SYSTEM_PROMPT,
    finalInstruction: "Generá el JSON de la Evolución Histórica.",
    maxTokens: 8192,
  });
}
