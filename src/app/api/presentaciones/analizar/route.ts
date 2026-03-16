import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.beta.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system:
        "Sos un analista de documentos para empresas agropecuarias argentinas. Extraé información clave de presentaciones, informes y estudios. Respondé en español argentino, de forma clara y estructurada.",
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
          },
          {
            type: "text",
            text: `Analizá este documento: "${file.name}" y devolvé un análisis estructurado con: tipo de documento, resumen del contenido, datos clave (fechas, números, cultivos, campos, recomendaciones), y su relevancia para una empresa agropecuaria argentina.`,
          },
        ],
      }],
      betas: ["pdfs-2024-09-25"],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ data: { resumen: text } });
  } catch (err) {
    console.error("Error en /api/presentaciones/analizar:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}
