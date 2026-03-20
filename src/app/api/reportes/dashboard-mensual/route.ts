import { NextRequest } from "next/server";
import { generateReport } from "@/lib/reportes/generate";

export const maxDuration = 300;

const SYSTEM_PROMPT = `Sos un controller agropecuario. Con los datos del balance y documentación disponible, generá una estimación mensualizada de ingresos y egresos del ejercicio. Devolvé SOLO este JSON, sin texto adicional, sin bloques de código markdown:
{
  "empresa": "nombre",
  "ejercicio": "periodo",
  "meses": [
    {"mes": "Jun 2024", "ingresos": number, "egresos": number, "resultado": number, "acumulado": number}
  ],
  "total_ingresos": number,
  "total_egresos": number,
  "resultado_anual": number,
  "mejor_mes": "nombre del mes",
  "peor_mes": "nombre del mes",
  "interpretacion": "texto con análisis de estacionalidad y tendencia"
}
Si no tenés datos mensuales exactos, distribuí el resultado anual según la estacionalidad típica del agro argentino (cosecha gruesa mar-jun, cosecha fina dic-ene). Aclaralo en la interpretación.`;

export async function POST(request: NextRequest) {
  return generateReport(request, {
    name: "dashboard-mensual",
    systemPrompt: SYSTEM_PROMPT,
    finalInstruction: "Generá el JSON del Dashboard Mensual.",
  });
}
