import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    const { empresasData } = await request.json();

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `Sos un analista financiero que maneja un portfolio de empresas agropecuarias argentinas.
Te doy los datos financieros de varias empresas. Analizá el grupo y devolvé SOLO este JSON (sin markdown):

{
  "empresas_analizadas": number,
  "benchmark": [
    {"indicador": "nombre", "valores": {"NombreEmpresa": number_or_null}, "mejor": "nombre empresa", "peor": "nombre empresa", "promedio": number_or_null}
  ],
  "insights_cruzados": ["insight específico con números"],
  "oportunidades": ["oportunidad detectada al cruzar datos"],
  "riesgos_grupo": ["riesgo que afecta al grupo completo"],
  "resumen": "Párrafo ejecutivo sobre el estado del portfolio"
}

Buscá patrones, anomalías, oportunidades de optimización entre empresas. Sé específico con números y nombres de empresas.`,
      messages: [{
        role: "user",
        content: `Datos financieros de las empresas del portfolio:\n${JSON.stringify(empresasData, null, 2)}\n\nAnalizá el portfolio y devolvé el JSON.`
      }]
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonStr = extractOutermostJSON(text);
    if (!jsonStr) return NextResponse.json({ error: "No se pudo analizar el portfolio" }, { status: 500 });
    const data = JSON.parse(jsonStr);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
