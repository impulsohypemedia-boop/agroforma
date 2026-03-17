import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractOutermostJSON } from "@/lib/extractJSON";

export const maxDuration = 60;
const SYSTEM_PROMPT = `Sos un analista especializado en calificaciones bancarias de empresas agropecuarias argentinas. Te dan documentos contables. Tu tarea es extraer toda la información posible para completar el formulario unificado de calificación bancaria (Formulario CREA).

Completá todo lo que puedas encontrar. Lo que NO encuentres marcalo con null y agregalo a datos_faltantes.

Devolvé SOLO este JSON (sin markdown, sin bloques de código):

{
  "empresa": "string",
  "cuit": "string",
  "ejercicio": "string",
  "fecha_generacion": "string",

  "datos_generales": {
    "razon_social": "string|null",
    "cuit": "string|null",
    "campana_actual": "string|null",
    "campana_proyectada": "string|null",
    "domicilio": "string|null",
    "localidad": "string|null",
    "provincia": "string|null",
    "actividad": "string|null",
    "capital_social": "number|null"
  },

  "campos_propios": [
    {
      "nombre": "string|null",
      "provincia": "string|null",
      "codigo_postal": "string|null",
      "coordenadas": "string|null",
      "superficie_has": "number|null",
      "aptitud_agricola_has": "number|null",
      "aptitud_ganadera_cria_has": "number|null",
      "aptitud_ganadera_invernada_has": "number|null",
      "aptitud_ganadera_tambo_has": "number|null",
      "aptitud_ganadera_otros_has": "number|null",
      "valor_usd_ha": "number|null"
    }
  ],

  "campos_arrendados": [
    {
      "nombre": "string|null",
      "provincia": "string|null",
      "codigo_postal": "string|null",
      "coordenadas": "string|null",
      "superficie_has": "number|null",
      "aptitud_agricola_has": "number|null",
      "aptitud_ganadera_cria_has": "number|null",
      "aptitud_ganadera_invernada_has": "number|null",
      "aptitud_ganadera_tambo_has": "number|null",
      "aptitud_ganadera_otros_has": "number|null",
      "valor_usd_ha": "number|null",
      "valor_arriendo_usd_ha": "number|null"
    }
  ],

  "agricultura": {
    "disponible": true,
    "ventas_por_cultivo": [
      {
        "cultivo": "string",
        "monto_actual": "number",
        "monto_anterior": "number"
      }
    ],
    "plan_siembra_actual": [
      {
        "cultivo": "string",
        "sup_propia_has": "number|null",
        "sup_arrendada_has": "number|null",
        "sup_aparceria_has": "number|null",
        "rendimiento_tn_ha": "number|null",
        "precio_usd_tn": "number|null",
        "gastos_implantacion_usd_ha": "number|null",
        "gastos_proteccion_usd_ha": "number|null",
        "gastos_cosecha_usd_ha": "number|null",
        "comercial_usd_tn": "number|null",
        "riego": "boolean|null"
      }
    ],
    "plan_siembra_proyectado": [],
    "almacenaje": {
      "planta_propia_tn": "number|null",
      "acopiador_tn": "number|null",
      "silo_bolsa_tn": "number|null"
    },
    "labores": {
      "roturacion_propia_pct": "number|null",
      "roturacion_contratada_pct": "number|null",
      "siembra_propia_pct": "number|null",
      "siembra_contratada_pct": "number|null",
      "proteccion_propia_pct": "number|null",
      "proteccion_contratada_pct": "number|null",
      "cosecha_propia_pct": "number|null",
      "cosecha_contratada_pct": "number|null"
    }
  },

  "maquinaria": {
    "disponible": true,
    "bienes_de_uso_total": "number|null",
    "tractores":      [{ "marca": "string|null", "modelo": "string|null", "anio": "number|null", "valor_usd": "number|null" }],
    "sembradoras":    [{ "marca": "string|null", "modelo": "string|null", "anio": "number|null", "valor_usd": "number|null" }],
    "pulverizadoras": [{ "marca": "string|null", "modelo": "string|null", "anio": "number|null", "valor_usd": "number|null" }],
    "cosechadoras":   [{ "marca": "string|null", "modelo": "string|null", "anio": "number|null", "valor_usd": "number|null" }],
    "otros":          [{ "tipo": "string|null", "marca": "string|null", "modelo": "string|null", "anio": "number|null", "valor_usd": "number|null" }],
    "nota": "string|null"
  },

  "ganaderia": {
    "disponible": false,
    "cria": {
      "disponible": false,
      "vacas":               { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "vacas_prenadas":      { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "vaquillonas_2_3":     { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "vaquillonas_1_2":     { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "terneros":            { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "toros":               { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "indicadores": {
        "paricion_pct": null, "destete_pct": null, "reposicion_pct": null,
        "edad_primer_servicio_meses": null, "peso_destete_kg": null, "adpv_kg_dia": null
      }
    },
    "recria": {
      "disponible": false,
      "novillo_2_3":     { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "novillo_1_2":     { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "vaquillonas":     { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "terneros":        { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "toros":           { "propias": null, "terceros": null, "compras": null, "ventas": null }
    },
    "invernada": {
      "disponible": false,
      "novillo_2_3":     { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "novillo_1_2":     { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "vaquillonas":     { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "terneros":        { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "toros":           { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "indicadores": { "duracion_invernada_meses": null, "adpv_kg_dia": null }
    },
    "feedlot": {
      "disponible": false,
      "novillo_2_3": { "propias": null, "terceros": null, "compras": null, "ventas": null },
      "novillo_1_2": { "propias": null, "terceros": null, "compras": null, "ventas": null }
    },
    "tambo": {
      "disponible": false,
      "vaca_ordene":          { "propias": null, "terceros": null },
      "vaca_seca":            { "propias": null, "terceros": null },
      "vaquillona_servicio":  { "propias": null, "terceros": null },
      "vaquillona_recria":    { "propias": null, "terceros": null },
      "terneras":             { "propias": null, "terceros": null },
      "toros":                { "propias": null, "terceros": null },
      "costos": {
        "tambero_pct": null, "personal": null, "reposicion": null,
        "alimento": null, "pasturas": null, "sanidad": null, "inseminacion": null
      }
    },
    "cabaña":   { "disponible": false },
    "porcinos": {
      "disponible": false,
      "cerdas": null, "padrillos": null, "recria_1": null, "recria_2": null, "capones": null
    },
    "ovinos": {
      "disponible": false,
      "ovejas": null, "corderos": null, "capones": null, "borregos": null, "carneros": null
    },
    "recursos_forrajeros": {
      "pasturas_implantadas_has": null,
      "pasturas_produccion_has": null,
      "pasturas_degradadas_has": null,
      "campo_natural_bueno_has": null,
      "campo_natural_regular_has": null,
      "verdeo_invierno_has": null,
      "verdeo_verano_has": null
    }
  },

  "gastos_indirectos": {
    "administracion_usd_anio": null,
    "estructura_usd_anio": null,
    "impuestos_usd_anio": null,
    "total_usd_anio": null
  },

  "pasivos": {
    "deudas": [
      { "entidad": "string", "moneda": "ARS|USD", "monto": number, "plazo": "corriente|no corriente" }
    ],
    "total_pasivo": null
  },

  "situacion_patrimonial_resumen": {
    "total_activo": null,
    "total_pasivo": null,
    "patrimonio_neto": null,
    "resultado_ejercicio": null
  },

  "participacion_accionaria": {
    "disponible": false,
    "socios": [
      { "apellido_nombre": "string|null", "dni": "string|null", "participacion_pct": "number|null" }
    ]
  },

  "datos_faltantes": [
    {
      "seccion": "string",
      "dato": "string",
      "documento_sugerido": "string"
    }
  ],

  "completitud_pct": 0,
  "nota_general": "string"
}

Cultivos posibles: Arroz, Avena, Caña de azúcar, Cebada, Cebada Cervecera, Centeno, Garbanzo, Girasol, Maíz, Maíz 2°, Maní, Papa, Poroto, Soja, Soja 2°, Sorgo, Trigo.

Para completitud_pct: calculá qué % de los campos principales tienen datos reales (no null). Considerá: datos_generales (peso 15%), campos (10%), agricultura (25%), maquinaria (10%), gastos_indirectos (10%), pasivos (15%), situacion_patrimonial (15%).`;

export async function POST(request: NextRequest) {
  try {
    const { extractedData, textos_extraidos } = await request.json();
    if ((!extractedData || extractedData.length === 0) && !textos_extraidos) {
      return NextResponse.json({ error: "No se recibieron datos" }, { status: 400 });
    }

    let userContent: string;
    if (extractedData && extractedData.length > 0) {
      userContent = `Datos extraídos de los documentos contables:\n${JSON.stringify(extractedData, null, 2)}\n\nGenerá el JSON del Formulario de Calificación Bancaria CREA.`;
    } else {
      const textos = Object.entries(textos_extraidos as Record<string, string>)
        .map(([name, text]) => `=== ${name} ===\n${text}`)
        .join("\n\n");
      userContent = `Contenido de los documentos contables:\n\n${textos}\n\nGenerá el JSON del Formulario de Calificación Bancaria CREA.`;
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
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
    console.error("Error en /api/reportes/calificacion-bancaria:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
