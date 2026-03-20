import { NextRequest } from "next/server";
import { generateReport } from "@/lib/reportes/generate";

export const maxDuration = 300;

const SYSTEM_PROMPT = `Sos un analista financiero especializado en empresas agropecuarias argentinas. Te van a dar documentos contables (balances, estados de situación patrimonial, estados de resultados). Tu tarea es calcular los principales ratios financieros y devolverlos en un JSON estructurado.

Calculá los siguientes ratios agrupados por categoría:

RENTABILIDAD:
- ROE = Resultado Neto / Patrimonio Neto (expresado en %)
- ROA = Resultado Neto / Total Activo (expresado en %)
- Margen Bruto = Resultado Bruto / Ventas Netas (expresado en %)
- Margen Neto = Resultado Neto / Ventas Netas (expresado en %)

LIQUIDEZ:
- Liquidez Corriente = Activo Corriente / Pasivo Corriente (expresado en "veces")
- Liquidez Seca = (Activo Corriente - Bienes de Cambio) / Pasivo Corriente (expresado en "veces")
- Capital de Trabajo = Activo Corriente - Pasivo Corriente (expresado en "pesos")

ENDEUDAMIENTO:
- Razón de Endeudamiento = Total Pasivo / Total Activo (expresado en %)
- Deuda sobre Patrimonio = Total Pasivo / Patrimonio Neto (expresado en "veces")

SOLVENCIA:
- Índice de Solvencia = Total Activo / Total Pasivo (expresado en "veces")
- Patrimonio sobre Activo = Patrimonio Neto / Total Activo (expresado en %)

El JSON debe tener esta estructura:
{
  "empresa": "nombre",
  "cuit": "xx-xxxxxxxx-x",
  "ejercicio": "fecha de cierre",
  "periodo_actual": "31/05/2025",
  "periodo_anterior": "31/05/2024",
  "ratios": [
    {
      "categoria": "Rentabilidad",
      "indicador": "ROE",
      "formula": "Resultado Neto / Patrimonio Neto",
      "valor_actual": 15.3,
      "valor_anterior": 12.1,
      "unidad": "pct",
      "interpretacion": "Por cada $100 de capital propio, la empresa generó $15,30 de utilidad"
    }
  ]
}

Las unidades posibles son: "pct" (porcentaje), "veces" (ratio), "pesos" (valor monetario).
Para capital de trabajo usar "pesos".
Calculá con precisión. Si no tenés el dato de un ratio, no lo incluyas.
Respondé SOLO con el JSON, sin texto adicional, sin bloques de código markdown.`;

export async function POST(request: NextRequest) {
  return generateReport(request, {
    name: "ratios",
    systemPrompt: SYSTEM_PROMPT,
    finalInstruction: "Generá el JSON de Ratios e Indicadores.",
  });
}
