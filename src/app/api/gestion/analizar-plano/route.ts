import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam, ImageBlockParam, DocumentBlockParam, TextBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { downloadFromStorage } from "@/lib/download";

export const maxDuration = 60;
const client = new Anthropic();

const CULTIVO_COLORS: Record<string, string> = {
  "Soja": "#4A7C28", "Maíz": "#D4AD3C", "Maiz": "#D4AD3C",
  "Girasol": "#E8922A", "Trigo": "#C4A862", "Sorgo": "#A0522D",
  "Cebada": "#C4A862", "Arroz": "#7BAF5E",
};
const AMBIENTE_COLORS: Record<string, string> = {
  ">100": "#2B5118", "76-100": "#4A7C28", "51-75": "#D4AD3C", "26-50": "#E07B39", "<25": "#C0392B",
};

function buildDiagrama(data: Record<string, unknown>): Record<string, unknown> | null {
  const lotes = (data.lotes as Array<{ nombre: string; superficie_has: number; cultivo: string | null; ambiente: string | null }> | null) ?? [];
  if (lotes.length === 0) return null;
  const total = lotes.reduce((s: number, l) => s + (l.superficie_has ?? 0), 0);
  const hasCultivos = lotes.some((l) => l.cultivo);
  const tipo = hasCultivos ? "cultivos" : "ambientes";

  const diagramaLotes = lotes.map((l) => ({
    nombre: l.nombre ?? "—",
    superficie: l.superficie_has ?? 0,
    cultivo: l.cultivo ?? null,
    ambiente: l.ambiente ?? null,
    porcentaje_del_total: total > 0 ? Math.round((l.superficie_has / total) * 1000) / 10 : 0,
  }));

  const seen = new Set<string>();
  const leyenda: Array<{ label: string; color: string }> = [];
  for (const l of diagramaLotes) {
    const key = tipo === "cultivos" ? (l.cultivo ?? "Sin cultivo") : (l.ambiente ?? "Sin ambiente");
    if (seen.has(key)) continue;
    seen.add(key);
    let color = "#E4DDD0";
    if (tipo === "cultivos") {
      color = CULTIVO_COLORS[l.cultivo ?? ""] ?? "#E4DDD0";
    } else {
      for (const [k, v] of Object.entries(AMBIENTE_COLORS)) {
        if ((l.ambiente ?? "").includes(k)) { color = v; break; }
      }
    }
    leyenda.push({ label: key, color });
  }

  return { tipo, lotes: diagramaLotes, leyenda };
}

const SYSTEM_PROMPT = `Sos un ingeniero agrónomo argentino. Te dan un plano o mapa de un campo. Extraé toda la información que puedas y devolvé SOLO este JSON (sin markdown ni bloques de código):

{
  "campo": "nombre del establecimiento",
  "propietario": "nombre si aparece",
  "ubicacion": {
    "localidad": "string",
    "provincia": "string",
    "coordenadas": "string si aparecen"
  },
  "superficie_total": number,
  "superficie_siembra": number,
  "lotes": [
    {
      "nombre": "LP_12",
      "superficie_has": 181.76,
      "cultivo": "string o null si no se indica",
      "ambiente": "string o null (profundidad de suelo, calidad, etc)"
    }
  ],
  "ambientes": {
    "descripcion": "texto describiendo los ambientes del campo",
    "detalle": [
      {"tipo": "Profundidad >100cm", "superficie_has": number, "porcentaje": number},
      {"tipo": "Profundidad 76-100cm", "superficie_has": number, "porcentaje": number},
      {"tipo": "Profundidad 51-75cm", "superficie_has": number, "porcentaje": number}
    ]
  },
  "cultivos_detectados": [
    {"cultivo": "Maíz", "hectareas": 240},
    {"cultivo": "Soja", "hectareas": 354}
  ],
  "infraestructura": ["corrales", "manga", "casa", "monte"],
  "fuente": "nombre del archivo",
  "campaña": "2014/15 o la que se detecte"
}

Extraé todo lo que encuentres. Si algo no está claro, ponelo como null. Devolvé SOLO el JSON.`;

// Infer media type from file name
function inferMediaType(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  return "image/jpeg"; // jpg, jpeg
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, path } = body;

    if (!name || !path) {
      return NextResponse.json({ error: "Falta nombre o path del archivo" }, { status: 400 });
    }

    const buffer = await downloadFromStorage(path);
    const nameLower = name.toLowerCase();

    const isImage = /\.(jpg|jpeg|png|webp|gif)$/.test(nameLower);
    const isPdf = nameLower.endsWith(".pdf");

    if (!isImage && !isPdf) {
      // For Excel/CSV: send the file name and ask Claude to note it can't read binary
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `El archivo "${name}" es un Excel/planilla. No se puede renderizar visualmente. Devolvé un JSON con los campos en null y fuente = "${name}".`,
        }],
      });
      const text = (response.content[0] as { type: string; text: string }).text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (data) data.diagrama = buildDiagrama(data);
      return NextResponse.json({ data });
    }

    const textBlock: TextBlockParam = {
      type: "text",
      text: `Analizá este archivo y extraé la información del campo. Nombre del archivo: "${name}". Devolvé SOLO el JSON.`,
    };

    let mediaBlock: ContentBlockParam;
    if (isPdf) {
      const docBlock: DocumentBlockParam = {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: buffer.toString("base64"),
        },
      };
      mediaBlock = docBlock;
    } else {
      const mediaType = inferMediaType(name);
      const imgBlock: ImageBlockParam = {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: buffer.toString("base64"),
        },
      };
      mediaBlock = imgBlock;
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [mediaBlock, textBlock],
      }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No se pudo extraer JSON de la respuesta", raw: text }, { status: 500 });

    const data = JSON.parse(jsonMatch[0]);
    data.diagrama = buildDiagrama(data);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error en /api/gestion/analizar-plano:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
