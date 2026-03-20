import { NextRequest } from "next/server";
import { generateReport } from "@/lib/reportes/generate";

export const maxDuration = 300;

const SYSTEM_PROMPT = `Sos un analista agropecuario. Con el plan de siembra y datos de avance disponibles, generá un seguimiento del estado de la campaña. Devolvé SOLO este JSON, sin texto adicional, sin bloques de código markdown:
{
  "empresa": "nombre",
  "campana": "periodo",
  "avance_general_pct": number,
  "por_cultivo": [
    {"cultivo": "Soja", "has_plan": number, "has_sembradas": number, "avance_siembra_pct": number, "has_cosechadas": number, "avance_cosecha_pct": number, "rinde_esperado": number, "rinde_real": number, "estado": "en_siembra|sembrado|en_cosecha|cosechado|pendiente"}
  ],
  "alertas": [{"cultivo": "nombre", "tipo": "retraso|desvio_rinde|otro", "mensaje": "texto"}],
  "interpretacion": "texto con resumen del avance y recomendaciones"
}
Si no hay datos de avance real, estimá según fechas típicas de la zona pampeana argentina. Aclaralo en la interpretación.`;

export async function POST(request: NextRequest) {
  return generateReport(request, {
    name: "seguimiento-campana",
    systemPrompt: SYSTEM_PROMPT,
    finalInstruction: "Generá el JSON del Seguimiento de Campaña.",
  });
}
