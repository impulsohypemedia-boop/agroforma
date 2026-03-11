import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";

const BASE_SYSTEM_PROMPT = `Sos el asistente de AgroForma, la inteligencia artificial de la empresa agropecuaria argentina. Tenés acceso a la documentación que subió el usuario (balances, estados contables, planillas, liquidaciones).

Tu rol es:
- Responder preguntas sobre la documentación de la empresa
- Generar análisis, comparaciones, cálculos que el usuario pida
- Cuando te pidan una tabla o planilla, devolvé los datos en formato de tabla markdown
- Cuando te pidan un Excel, indicá que pueden descargarlo desde los reportes generados
- Usá siempre formato numérico argentino (punto para miles, coma para decimales)
- Respondé en español argentino, profesional pero cercano
- Si no tenés datos suficientes para responder algo, explicá qué documentación necesitarías

Sos un analista financiero experto en el sector agropecuario argentino. Conocés de balances, márgenes por cultivo, ratios financieros, calificaciones bancarias, proyecciones de campaña, y toda la operatoria del campo argentino.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const messagesRaw = formData.get("messages") as string;
    const analysisRaw = formData.get("analysis") as string | null;
    const files = formData.getAll("files") as File[];

    const conversationHistory: { role: "user" | "assistant"; content: string }[] =
      JSON.parse(messagesRaw ?? "[]");

    // Build system prompt — include analysis context if available
    let systemPrompt = BASE_SYSTEM_PROMPT;
    if (analysisRaw) {
      try {
        const analysis = JSON.parse(analysisRaw);
        systemPrompt += `\n\nCONTEXTO DE LA EMPRESA ANALIZADA:\n${JSON.stringify(analysis, null, 2)}`;
      } catch { /* ignore */ }
    }

    // Build file content blocks for the current message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileBlocks: any[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const name = file.name.toLowerCase();

      if (name.endsWith(".pdf")) {
        fileBlocks.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
        });
      } else if (name.endsWith(".csv") || file.type === "text/csv") {
        fileBlocks.push({ type: "text", text: `=== Archivo: ${file.name} ===\n${buffer.toString("utf-8")}` });
      } else if (name.endsWith(".xlsx")) {
        try {
          const wb = new ExcelJS.Workbook();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await wb.xlsx.load(buffer as any);
          let txt = `=== Archivo: ${file.name} ===\n`;
          wb.eachSheet((sheet) => {
            txt += `\n--- Hoja: ${sheet.name} ---\n`;
            sheet.eachRow((row) => {
              txt += (row.values as ExcelJS.CellValue[]).slice(1).map((v) => {
                if (v === null || v === undefined) return "";
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (typeof v === "object" && (v as any).result !== undefined) return (v as any).result;
                return v.toString();
              }).join("\t") + "\n";
            });
          });
          fileBlocks.push({ type: "text", text: txt });
        } catch {
          fileBlocks.push({ type: "text", text: `=== ${file.name} === [No se pudo leer]` });
        }
      }
    }

    // Build Anthropic messages array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiMessages: any[] = [];

    // If files present, inject them in a setup exchange at the start
    if (fileBlocks.length > 0) {
      apiMessages.push({
        role: "user",
        content: [
          ...fileBlocks,
          { type: "text", text: "Estos son los documentos de la empresa. Tenelos en cuenta para responder mis preguntas." },
        ],
      });
      apiMessages.push({
        role: "assistant",
        content: "Entendido. Analicé los documentos y estoy listo para responder tus preguntas sobre la empresa.",
      });
    }

    // Append conversation history as text
    for (const msg of conversationHistory) {
      apiMessages.push({ role: msg.role, content: msg.content });
    }

    // Ensure last message is from user (required by Anthropic)
    if (apiMessages.length === 0 || apiMessages[apiMessages.length - 1].role !== "user") {
      return new Response("Mensaje inválido", { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessages,
      betas: fileBlocks.length > 0 ? ["pdfs-2024-09-25"] : undefined,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Error en /api/chat:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
