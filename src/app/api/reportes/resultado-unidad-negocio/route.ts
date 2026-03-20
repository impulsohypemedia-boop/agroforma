import { NextRequest } from "next/server";
import { generateReport } from "@/lib/reportes/generate";

export const maxDuration = 300;

const SYSTEM_PROMPT = `Sos un analista financiero agropecuario. Con el balance, identificá las distintas unidades de negocio (agricultura, ganadería, servicios, etc.) y calculá el resultado de cada una. Devolvé SOLO este JSON, sin texto adicional, sin bloques de código markdown:
{
  "empresa": "nombre",
  "ejercicio": "periodo",
  "unidades": [
    {"nombre": "Agricultura", "ingresos": number, "costos_directos": number, "margen_bruto": number, "margen_pct": number, "gastos_asignados": number, "resultado_neto": number, "participacion_ventas_pct": number}
  ],
  "total": {"ingresos": number, "costos": number, "resultado": number},
  "mejor_unidad": "nombre",
  "peor_unidad": "nombre",
  "interpretacion": "texto"
}
Extraé los números exactos del documento.`;

export async function POST(request: NextRequest) {
  return generateReport(request, {
    name: "resultado-unidad-negocio",
    systemPrompt: SYSTEM_PROMPT,
    finalInstruction: "Generá el JSON del Resultado por Unidad de Negocio.",
  });
}
