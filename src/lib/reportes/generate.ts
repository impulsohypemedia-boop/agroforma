import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";
import { NextRequest, NextResponse } from "next/server";

type ReportConfig = {
  name: string;           // e.g. "situacion-patrimonial"
  systemPrompt: string;   // the full system prompt for this report
  finalInstruction: string; // e.g. "Generá el JSON de situación patrimonial."
  maxTokens?: number;     // default 4096
};

export async function generateReport(request: NextRequest, config: ReportConfig) {
  const { name, systemPrompt, finalInstruction, maxTokens = 4096 } = config;

  try {
    const { extractedData, textos_extraidos } = await request.json();

    if ((!extractedData || extractedData.length === 0) && !textos_extraidos) {
      return NextResponse.json({ error: "No se recibieron datos" }, { status: 400 });
    }

    const parts: string[] = [];
    if (extractedData && extractedData.length > 0) {
      parts.push(`Datos estructurados extraídos:\n${JSON.stringify(extractedData, null, 2)}`);
    }
    if (textos_extraidos && Object.keys(textos_extraidos).length > 0) {
      const textos = Object.entries(textos_extraidos as Record<string, string>)
        .map(([fileName, text]) => `=== ${fileName} ===\n${text}`)
        .join("\n\n");
      parts.push(`Texto completo de los documentos:\n\n${textos}`);
    }

    const userContent =
      parts.join("\n\n---\n\n") +
      `\n\nUsá TODA la información disponible arriba. ${finalInstruction}`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonStr = extractOutermostJSON(responseText);
    if (!jsonStr) {
      console.error("Claude response:", responseText);
      return NextResponse.json(
        { error: "Claude no devolvió un JSON válido" },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonStr);
    return NextResponse.json({ data });
  } catch (err) {
    console.error(`Error en /api/reportes/${name}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
