import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 300;
const BASE_SYSTEM = `Sos el asistente de AgroForma, la inteligencia artificial de la empresa agropecuaria argentina. Tenés acceso a la documentación que subió el usuario.

Respondé cualquier pregunta que te hagan. Si es sobre la documentación de la empresa, usá los datos que tenés para dar una respuesta precisa con números. Si es una pregunta general sobre el agro, finanzas, impuestos, o cualquier otro tema, respondé con tu conocimiento como lo haría un asesor experto.

Nunca digas que algo está fuera de tu alcance. Siempre respondé de manera razonable y útil. Si la pregunta es sobre la empresa, mencioná que tenés acceso a su documentación y usala. Si no es sobre la empresa, respondé igualmente pero aclarando que para datos más precisos podés usar la documentación cargada.

Sos un analista financiero experto en el sector agropecuario argentino. Respondé en español argentino, profesional pero cercano.

Tu rol:
- Responder cualquier pregunta: sobre la empresa, el agro, finanzas, impuestos, mercados, normativa, etc.
- Generar análisis, comparaciones, cálculos que el usuario pida
- Cuando te pidan una tabla o planilla, devolvé los datos en formato de tabla markdown
- Usá siempre formato numérico argentino (punto para miles, coma para decimales)

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
    const body = await request.json();

    const conversationHistory: { role: "user" | "assistant"; content: string }[] =
      body.messages ?? [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const empresaContext: Record<string, any> | null = body.empresa_context ?? null;
    const presentacionesCtx: string | null = body.presentaciones_context ?? null;

    let systemPrompt = buildSystemPrompt(empresaContext);
    if (presentacionesCtx) {
      systemPrompt += `\n\nCONTEXTO DE PRESENTACIONES Y DOCUMENTOS ADICIONALES:\n${presentacionesCtx}`;
    }

    // Build Anthropic messages array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiMessages: any[] = [];

    for (const msg of conversationHistory) {
      apiMessages.push({ role: msg.role, content: msg.content });
    }

    if (apiMessages.length === 0 || apiMessages[apiMessages.length - 1].role !== "user") {
      return new Response("Mensaje inválido", { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: apiMessages,
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
    console.error("[chat] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
