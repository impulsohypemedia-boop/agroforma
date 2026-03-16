import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 60;
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
  try {
    const { extractedData } = await request.json();
    if (!extractedData || extractedData.length === 0) {
      return NextResponse.json({ error: "No se recibieron datos" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Datos extraídos de los documentos contables:\n${JSON.stringify(extractedData, null, 2)}\n\nGenerá el JSON de la Situación Patrimonial.`,
      }],
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
    console.error("Error en /api/reportes/situacion-patrimonial:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
