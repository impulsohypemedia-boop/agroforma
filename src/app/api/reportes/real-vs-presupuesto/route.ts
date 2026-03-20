import { NextRequest } from "next/server";
import { generateReport } from "@/lib/reportes/generate";

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
  return generateReport(request, {
    name: "real-vs-presupuesto",
    systemPrompt: SYSTEM_PROMPT,
    finalInstruction: "Generá el JSON de Real vs Presupuestado.",
  });
}
