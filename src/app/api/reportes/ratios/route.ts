import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 60;
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
  try {
    const { extractedData, textos_extraidos } = await request.json();
    console.log(`[ratios] extractedData: ${extractedData?.length ?? "null"}, textos: ${textos_extraidos ? Object.keys(textos_extraidos).length + " files" : "null"}`);

    if ((!extractedData || extractedData.length === 0) && !textos_extraidos) {
      return NextResponse.json({ error: "No se recibieron datos" }, { status: 400 });
    }

    let userContent: string;
    if (extractedData && extractedData.length > 0) {
      userContent = `Datos extraídos de los documentos contables:\n${JSON.stringify(extractedData, null, 2)}\n\nGenerá el JSON de Ratios e Indicadores.`;
    } else {
      const textos = Object.entries(textos_extraidos as Record<string, string>)
        .map(([name, text]) => `=== ${name} ===\n${text}`)
        .join("\n\n");
      userContent = `Contenido de los documentos contables:\n\n${textos}\n\nGenerá el JSON de Ratios e Indicadores.`;
    }
    console.log(`[ratios] prompt length: ${userContent.length} (mode: ${extractedData?.length > 0 ? "structured" : "raw_texts"})`);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonStr = extractOutermostJSON(responseText);
    if (!jsonStr) {
      console.error("Claude response:", responseText);
      return NextResponse.json({ error: "Claude no devolvió un JSON válido" }, { status: 500 });
    }
    const data = JSON.parse(jsonStr);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error en /api/reportes/ratios:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
