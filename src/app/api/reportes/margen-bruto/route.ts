import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 60;
const SYSTEM_PROMPT = `Sos un analista agropecuario especializado en empresas agrícolas argentinas. Te van a dar documentos contables (balances, estados de resultados, anexos de ventas y costos). Tu tarea es extraer la información de ventas por cultivo y costos, y generar un JSON con el Margen Bruto por Cultivo.

Buscá en el documento:
- Anexo II o Detalle de Ventas Netas: ventas por cultivo (Girasol, Soja, Maíz, Trigo, Cebada, etc.) con montos del periodo actual y anterior
- Costo de Productos Vendidos: existencias iniciales (cereales, sementeras, insumos), compras, existencias finales
- Estado de Resultados: resultado bruto de producción, gastos de producción desglosados (fletes, alquileres, honorarios técnicos, servicios de cosecha, etc.)

El JSON debe tener esta estructura:
{
  "empresa": "nombre",
  "cuit": "xx-xxxxxxxx-x",
  "ejercicio": "fecha de cierre",
  "periodo_actual": "31/05/2025",
  "periodo_anterior": "31/05/2024",
  "ventas_por_cultivo": [
    {
      "cultivo": "Girasol",
      "ventas_actual": number,
      "ventas_anterior": number,
      "variacion_pct": number
    }
  ],
  "total_ventas_actual": number,
  "total_ventas_anterior": number,
  "costo_ventas": {
    "existencias_iniciales": {
      "cereales": number,
      "sementeras": number,
      "insumos": number,
      "total": number
    },
    "compras": number,
    "existencias_finales": {
      "cereales": number,
      "sementeras": number,
      "insumos": number,
      "total": number
    },
    "costo_total_actual": number,
    "costo_total_anterior": number
  },
  "resultado_bruto_actual": number,
  "resultado_bruto_anterior": number,
  "margen_bruto_pct_actual": number,
  "margen_bruto_pct_anterior": number,
  "gastos_produccion": {
    "fletes": number,
    "alquileres": number,
    "honorarios_tecnicos": number,
    "servicios_cosecha": number,
    "seguros": number,
    "combustibles": number,
    "reparaciones": number,
    "otros": number,
    "total_actual": number,
    "total_anterior": number
  },
  "resultado_operativo_actual": number,
  "resultado_operativo_anterior": number,
  "margen_operativo_pct_actual": number,
  "margen_operativo_pct_anterior": number
}

Extraé los números exactos del documento. Los números deben ser valores numéricos simples. Respondé SOLO con el JSON, sin texto adicional, sin bloques de código markdown.`;

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
        content: `Datos extraídos de los documentos contables:\n${JSON.stringify(extractedData, null, 2)}\n\nGenerá el JSON del Margen Bruto por Cultivo.`,
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
    console.error("Error en /api/reportes/margen-bruto:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
