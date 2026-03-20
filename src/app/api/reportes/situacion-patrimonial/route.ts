import { NextRequest } from "next/server";
import { generateReport } from "@/lib/reportes/generate";

export const maxDuration = 300;

const SYSTEM_PROMPT = `Sos un contador especializado en empresas agropecuarias argentinas. Te van a dar documentos contables (balances, estados de situación patrimonial, anexos, notas). Tu tarea es extraer toda la información y generar un JSON estructurado con la Situación Patrimonial completa.

El JSON debe tener esta estructura:
{
  "empresa": "nombre",
  "cuit": "xx-xxxxxxxx-x",
  "ejercicio": "fecha de cierre",
  "moneda": "Pesos Argentinos - Moneda Homogénea",
  "activo_corriente": {
    "disponibilidades": number,
    "creditos_por_ventas": number,
    "creditos_impositivos": number,
    "creditos_sociales": number,
    "inversiones": number,
    "bienes_de_cambio": number,
    "total": number
  },
  "activo_no_corriente": {
    "bienes_de_uso": number,
    "total": number
  },
  "total_activo": number,
  "pasivo_corriente": {
    "deudas_comerciales": number,
    "deudas_bancarias": number,
    "deudas_impositivas": number,
    "deudas_sociales": number,
    "total": number
  },
  "pasivo_no_corriente": {
    "deudas_bancarias": number,
    "deudas_sociales": number,
    "total": number
  },
  "total_pasivo": number,
  "patrimonio_neto": number,
  "periodo_actual": "31/05/2025",
  "periodo_anterior": "31/05/2024",
  "valores_periodo_anterior": { misma estructura con valores del periodo anterior }
}

Extraé los números exactos del documento. Los números deben ser valores numéricos simples (sin formato, sin puntos ni comas). Respondé SOLO con el JSON, sin texto adicional, sin bloques de código markdown.`;

export async function POST(request: NextRequest) {
  return generateReport(request, {
    name: "situacion-patrimonial",
    systemPrompt: SYSTEM_PROMPT,
    finalInstruction: "Generá el JSON de la Situación Patrimonial.",
  });
}
