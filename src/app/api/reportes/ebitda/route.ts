import { NextRequest } from "next/server";
import { generateReport } from "@/lib/reportes/generate";

export const maxDuration = 300;

const SYSTEM_PROMPT = `Sos un analista financiero agropecuario. Con los datos del balance que te doy, calculá el EBITDA agropecuario. Extraé los números exactos del documento. Los números deben ser valores numéricos simples. Respondé SOLO con el JSON, sin texto adicional, sin bloques de código markdown.

El JSON debe tener esta estructura:
{
  "empresa": "nombre",
  "ejercicio": "periodo",
  "resultado_operativo": number,
  "amortizaciones": number,
  "depreciaciones": number,
  "impuesto_ganancias": number,
  "resultados_financieros": number,
  "ebitda": number,
  "ebitda_margin_pct": number,
  "ventas_netas": number,
  "detalle": [
    {"concepto": "Resultado Bruto", "monto": number},
    {"concepto": "- Gastos Administración", "monto": number},
    {"concepto": "- Gastos Producción", "monto": number},
    {"concepto": "= Resultado Operativo", "monto": number},
    {"concepto": "+ Amortizaciones y Depreciaciones", "monto": number},
    {"concepto": "= EBITDA", "monto": number}
  ],
  "interpretacion": "texto de 3-4 oraciones explicando qué significa este EBITDA para la empresa"
}`;

export async function POST(request: NextRequest) {
  return generateReport(request, {
    name: "ebitda",
    systemPrompt: SYSTEM_PROMPT,
    finalInstruction: "Generá el JSON del EBITDA Agro.",
  });
}
