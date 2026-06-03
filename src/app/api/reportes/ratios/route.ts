import { NextRequest } from "next/server";
import { generateReport } from "@/lib/reportes/generate";

export const maxDuration = 300;

const SYSTEM_PROMPT = `Sos un analista financiero especializado en empresas agropecuarias argentinas, aplicando la metodología de indicadores CREA. Te van a dar documentos contables (balances, estados de situación patrimonial, estados de resultados). Tu tarea es calcular los 12 indicadores financieros CREA y devolverlos en un JSON estructurado.

Calculá los siguientes indicadores agrupados por categoría CREA:

LIQUIDEZ:
- Liquidez = Activo Corriente / Pasivo Corriente (expresado en "veces"). Referencia CREA: > 1.2
- Prueba Ácida = (Activo Corriente - Bienes de Cambio) / Pasivo Corriente (expresado en "veces"). Referencia CREA: > 1
- Solvencia General = Total Activo / Total Pasivo (expresado en "veces"). Referencia CREA: >= 2
- Capital de Trabajo Neto = Activo Corriente - Pasivo Corriente (expresado en "pesos"). Referencia CREA: > 0
- Capital de Trabajo Relativo = (Activo Corriente - Pasivo Corriente) / Activo Total * 100 (expresado en "pct"). Referencia CREA: > 20%

ENDEUDAMIENTO:
- Endeudamiento sobre Activo = Total Pasivo / Total Activo * 100 (expresado en "pct"). Referencia CREA: entre 20% y 50%
- Endeudamiento sobre Patrimonio Neto = Total Pasivo / Patrimonio Neto * 100 (expresado en "pct"). Referencia CREA: < 100%
- Calidad de Deuda = Pasivo Corriente / Total Pasivo * 100 (expresado en "pct"). Referencia CREA: <= 50%

PERFIL DE RIESGO:
- Apalancamiento = Total Activo / Patrimonio Neto (expresado en "veces"). Referencia CREA: entre 1.5 y 2.5
- Autonomía Financiera = Patrimonio Neto / Total Activo * 100 (expresado en "pct"). Referencia CREA: > 50%
- Inmovilización de Activo = Activo No Corriente / Total Activo * 100 (expresado en "pct"). Referencia CREA: < 70%

RENTABILIDAD:
- ROE = Resultado Neto / Patrimonio Neto * 100 (expresado en "pct"). Referencia CREA: > 15%
- Variación Patrimonial = (Patrimonio Neto Actual - Patrimonio Neto Anterior) / Patrimonio Neto Anterior * 100 (expresado en "pct"). Referencia CREA: > 0%

Para cada ratio, asigná un campo "semaforo" con estos criterios:
- "verde": el valor está dentro del rango de referencia CREA (saludable)
- "amarillo": el valor está cerca del límite del rango (zona de atención, dentro del 10-15% del umbral)
- "rojo": el valor está claramente fuera del rango CREA (zona de alerta)

Para cada ratio, incluí también:
- "valor_referencia": string con el benchmark CREA (ej: "> 1.2", "entre 20% y 50%", "< 100%")
- "accion_sugerida": string con la recomendación concreta si el indicador está en amarillo o rojo. Si está en verde, poné algo como "Mantener la gestión actual". Sé específico para el sector agropecuario argentino.

El JSON debe tener esta estructura:
{
  "empresa": "nombre",
  "cuit": "xx-xxxxxxxx-x",
  "ejercicio": "fecha de cierre",
  "periodo_actual": "31/05/2025",
  "periodo_anterior": "31/05/2024",
  "ratios": [
    {
      "categoria": "Liquidez",
      "indicador": "Liquidez",
      "formula": "Activo Corriente / Pasivo Corriente",
      "valor_actual": 1.5,
      "valor_anterior": 1.2,
      "unidad": "veces",
      "interpretacion": "La empresa puede cubrir 1,5 veces sus obligaciones de corto plazo con sus activos corrientes",
      "semaforo": "verde",
      "valor_referencia": "> 1.2",
      "accion_sugerida": "Mantener la gestión actual"
    }
  ]
}

Las unidades posibles son: "pct" (porcentaje), "veces" (ratio), "pesos" (valor monetario).
Para Capital de Trabajo Neto usar "pesos".
Calculá con precisión. Si no tenés el dato de un ratio, no lo incluyas.
Respondé SOLO con el JSON, sin texto adicional, sin bloques de código markdown.`;

export async function POST(request: NextRequest) {
  return generateReport(request, {
    name: "ratios",
    systemPrompt: SYSTEM_PROMPT,
    finalInstruction: "Generá el JSON de Ratios e Indicadores.",
  });
}
