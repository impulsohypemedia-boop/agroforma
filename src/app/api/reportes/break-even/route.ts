import { NextRequest } from "next/server";
import { generateReport } from "@/lib/reportes/generate";

export const maxDuration = 300;

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
  return generateReport(request, {
    name: "break-even",
    systemPrompt: SYSTEM_PROMPT,
    finalInstruction: "Generá el JSON de el Punto de Equilibrio.",
  });
}
