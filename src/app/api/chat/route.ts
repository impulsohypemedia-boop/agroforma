import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";

const BASE_SYSTEM_PROMPT = `Sos el asistente de AgroForma, la inteligencia artificial de la empresa agropecuaria argentina. Tenés acceso a la documentación que subió el usuario (balances, estados contables, planillas, liquidaciones) y a los reportes generados.

Tu rol es:
- Responder preguntas sobre la documentación y los reportes de la empresa
- Generar análisis, comparaciones, cálculos que el usuario pida
- Cuando te pidan una tabla o planilla, devolvé los datos en formato de tabla markdown
- Usá siempre formato numérico argentino (punto para miles, coma para decimales)
- Respondé en español argentino, profesional pero cercano
- Si no tenés datos suficientes para responder algo, explicá qué documentación necesitarías
- Sos un analista financiero experto en el sector agropecuario argentino

MODIFICACIÓN DE REPORTES — MUY IMPORTANTE:
Cuando el usuario pida cambiar datos, recalcular, hacer una variante o escenario alternativo de un reporte existente, tu respuesta DEBE seguir EXACTAMENTE este formato, sin markdown, sin bloques de código, sin texto adicional antes o después:

RESPUESTA_TEXTO: Explicación de qué cambió y cuál fue el impacto en los números principales.
REPORT_ID: margen-bruto
REPORTE_MODIFICADO_START
{"empresa":"Nombre","ejercicio":"2024","ventas_por_cultivo":[{"cultivo":"Soja","ventas_actual":1500000}],"total_ventas_actual":1500000}
REPORTE_MODIFICADO_END
INSTRUCCION: texto exacto de lo que pidió el usuario

REGLAS CRÍTICAS:
- REPORTE_MODIFICADO_START y REPORTE_MODIFICADO_END deben estar SOLOS en su línea (sin espacios ni otros caracteres)
- El JSON entre los marcadores: objeto completo con la misma estructura que el original, todos los valores afectados recalculados
- REPORT_ID debe ser exactamente uno de: margen-bruto | situacion-patrimonial | ratios | bridge | break-even | calificacion-bancaria | evolucion-historica
- NO uses bloques \`\`\`json ni ningún otro marcador markdown dentro del JSON
- Si es solo una pregunta o análisis (sin modificación), respondé normalmente SIN ninguno de estos marcadores`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const messagesRaw        = formData.get("messages")              as string;
    const analysisRaw        = formData.get("analysis")              as string | null;
    const reportsRaw         = formData.get("reports")               as string | null;
    const presentacionesCtx  = formData.get("presentaciones_context") as string | null;
    const files              = formData.getAll("files")              as File[];

    const conversationHistory: { role: "user" | "assistant"; content: string }[] =
      JSON.parse(messagesRaw ?? "[]");

    // Build system prompt — include analysis + reports context
    let systemPrompt = BASE_SYSTEM_PROMPT;
    if (analysisRaw) {
      try {
        const analysis = JSON.parse(analysisRaw);
        systemPrompt += `\n\nCONTEXTO DE LA EMPRESA:\n${JSON.stringify(analysis, null, 2)}`;
      } catch { /* ignore */ }
    }
    if (reportsRaw) {
      try {
        const reports = JSON.parse(reportsRaw);
        if (Array.isArray(reports) && reports.length > 0) {
          const reportsSummary = reports.map((r: { reportId: string; title: string; data: unknown }) => ({
            reportId: r.reportId,
            title: r.title,
            data: r.data,
          }));
          systemPrompt += `\n\nREPORTES GENERADOS DISPONIBLES PARA MODIFICAR:\n${JSON.stringify(reportsSummary, null, 2)}`;
        }
      } catch { /* ignore */ }
    }
    if (presentacionesCtx) {
      systemPrompt += `\n\nCONTEXTO DE PRESENTACIONES Y DOCUMENTOS ADICIONALES:\n${presentacionesCtx}`;
    }

    // Build file content blocks
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

    for (const msg of conversationHistory) {
      apiMessages.push({ role: msg.role, content: msg.content });
    }

    if (apiMessages.length === 0 || apiMessages[apiMessages.length - 1].role !== "user") {
      return new Response("Mensaje inválido", { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 8192,
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
