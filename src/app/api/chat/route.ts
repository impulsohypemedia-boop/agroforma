import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";

export const maxDuration = 60;
const BASE_SYSTEM = `Sos el asistente de AgroForma, la inteligencia artificial de la empresa agropecuaria argentina.

Tu rol:
- Responder preguntas sobre la documentación y los reportes de la empresa
- Generar análisis, comparaciones, cálculos que el usuario pida
- Cuando te pidan una tabla o planilla, devolvé los datos en formato de tabla markdown
- Usá siempre formato numérico argentino (punto para miles, coma para decimales)
- Respondé en español argentino, profesional pero cercano
- Si no tenés datos suficientes, explicá qué documentación necesitarías
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
- REPORTE_MODIFICADO_START y REPORTE_MODIFICADO_END deben estar SOLOS en su línea
- El JSON entre los marcadores: objeto completo con la misma estructura que el original
- REPORT_ID debe ser exactamente uno de: margen-bruto | situacion-patrimonial | ratios | bridge | break-even | calificacion-bancaria | evolucion-historica
- NO uses bloques \`\`\`json ni ningún otro marcador markdown dentro del JSON
- Si es solo una pregunta o análisis (sin modificación), respondé normalmente SIN ninguno de estos marcadores`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSystemPrompt(ctx: Record<string, any> | null): string {
  if (!ctx) return BASE_SYSTEM;

  const lines: string[] = [BASE_SYSTEM, ""];

  // Empresa info
  if (ctx.empresa) {
    const e = ctx.empresa;
    lines.push("## EMPRESA ACTIVA");
    if (e.nombre)    lines.push(`Nombre: ${e.nombre}`);
    if (e.cuit)      lines.push(`CUIT: ${e.cuit}`);
    if (e.actividad) lines.push(`Actividad: ${e.actividad}`);
    if (e.provincia) lines.push(`Provincia: ${e.provincia}`);
    if (e.localidad) lines.push(`Localidad: ${e.localidad}`);
    if (ctx.campanaActual) lines.push(`Campaña activa: ${ctx.campanaActual}`);
    lines.push("");
  }

  // Analysis result
  if (ctx.analysis) {
    const a = ctx.analysis;
    lines.push("## ANÁLISIS DE DOCUMENTACIÓN");
    if (a.empresa)    lines.push(`Empresa detectada: ${a.empresa}`);
    if (a.cuit)       lines.push(`CUIT: ${a.cuit}`);
    if (a.ejercicios?.length) lines.push(`Ejercicios: ${a.ejercicios.join(", ")}`);
    if (a.documentos_detectados?.length) {
      lines.push("Documentos detectados:");
      for (const d of a.documentos_detectados) {
        lines.push(`  - ${d.tipo}: ${d.nombre_archivo} (${d.periodo})`);
      }
    }
    lines.push("");
  }

  // Extracted docs data (the actual financial numbers)
  if (ctx.extractedDocsData?.length > 0) {
    lines.push("## DATOS EXTRAÍDOS DE DOCUMENTOS");
    for (const doc of ctx.extractedDocsData) {
      lines.push(`### ${doc.tipo} — ${doc.nombre_archivo} (${doc.periodo})`);
      lines.push(JSON.stringify(doc.datos, null, 2));
      lines.push("");
    }
  }

  // Generated reports
  if (ctx.generatedReports?.length > 0) {
    lines.push("## REPORTES GENERADOS DISPONIBLES PARA MODIFICAR");
    lines.push(JSON.stringify(ctx.generatedReports.map((r: Record<string, unknown>) => ({
      reportId: r.reportId, title: r.title, data: r.data,
    })), null, 2));
    lines.push("");
  }

  // Campos & siembra
  if (ctx.campos?.length > 0) {
    lines.push("## CAMPOS");
    for (const c of ctx.campos) {
      lines.push(`- ${c.nombre}${c.hectareas ? " — " + c.hectareas + " ha" : ""}${c.provincia ? " (" + c.provincia + ")" : ""}`);
    }
    lines.push("");
  }
  if (ctx.planSiembra?.length > 0) {
    lines.push(`## PLAN DE SIEMBRA — CAMPAÑA ${ctx.campanaActual ?? ""}`);
    const campoMap: Record<string, string> = {};
    for (const c of (ctx.campos ?? [])) campoMap[c.id] = c.nombre;
    for (const l of ctx.planSiembra) {
      lines.push(
        `- ${campoMap[l.campoId] ?? l.campoId}: ${l.cultivo} — ` +
        `${l.hectareas} ha, rinde ${l.rendimientoEsperado} tn/ha, ` +
        `precio USD ${l.precioEsperado}/tn, costos USD ${l.costosDirectos}/ha`
      );
    }
    lines.push("");
  }

  // Hacienda
  if (ctx.stockHacienda?.length > 0) {
    lines.push("## STOCK DE HACIENDA");
    const campoMap: Record<string, string> = {};
    for (const c of (ctx.campos ?? [])) campoMap[c.id] = c.nombre;
    for (const s of ctx.stockHacienda) {
      lines.push(
        `- ${campoMap[s.campoId] ?? s.campoId}: ${s.categoria} — ` +
        `${s.cantidad} cabezas, ${s.pesoPromedio} kg promedio`
      );
    }
    lines.push("");
  }

  // Planos
  if (ctx.archivosPlanos?.length > 0) {
    lines.push("## PLANOS DE CAMPO ANALIZADOS");
    for (const p of ctx.archivosPlanos) {
      lines.push(`- ${p.nombre}`);
      if (p.datos?.superficie_total) lines.push(`  Superficie: ${p.datos.superficie_total} ha`);
      if (p.datos?.cultivos_detectados?.length) {
        lines.push(`  Cultivos: ${p.datos.cultivos_detectados.map((c: Record<string,unknown>) => c.cultivo).join(", ")}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const messagesRaw       = formData.get("messages")        as string;
    const empresaContextRaw = formData.get("empresa_context") as string | null;
    const files             = formData.getAll("files")        as File[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversationHistory: { role: "user" | "assistant"; content: string }[] =
      JSON.parse(messagesRaw ?? "[]");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let empresaContext: Record<string, any> | null = null;
    if (empresaContextRaw) {
      try { empresaContext = JSON.parse(empresaContextRaw); } catch { /* ignore */ }
    }

    console.log("[chat] messages:", conversationHistory.length, "| empresa:", empresaContext?.empresa?.nombre ?? "sin contexto", "| files:", files.length);
    console.log("[chat] último mensaje:", conversationHistory.at(-1)?.content?.slice(0, 100));

    const systemPrompt = buildSystemPrompt(empresaContext);

    // Build file content blocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileBlocks: any[] = [];
    let hasPdfFiles = false;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const name = file.name.toLowerCase();

      if (name.endsWith(".pdf")) {
        hasPdfFiles = true;
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
      console.log("[chat] ERROR: mensaje inválido, últimoRol:", apiMessages.at(-1)?.role);
      return new Response("Mensaje inválido", { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    console.log("[chat] llamando a Claude, mensajes API:", apiMessages.length, "| system length:", systemPrompt.length, "| pdf files:", hasPdfFiles);

    // Use beta endpoint only when PDF files are present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const streamParams: any = {
      model: "claude-opus-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: apiMessages,
    };

    const stream = hasPdfFiles
      ? client.beta.messages.stream({ ...streamParams, betas: ["pdfs-2024-09-25"] })
      : client.messages.stream(streamParams);

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
          console.log("[chat] stream completado");
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
    console.error("[chat] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
