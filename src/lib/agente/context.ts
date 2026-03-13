/**
 * Mega agent context builder.
 * Loads all empresa data from Supabase and builds a structured string
 * for Claude's system prompt so the assistant knows everything about
 * the active empresa.
 */

import { loadAllState } from "@/lib/supabase/db";
import { Empresa } from "@/types/empresa";
import { UploadedDoc } from "@/types/document";
import { GeneratedReport } from "@/types/report";
import { AnalysisResult, ExtractedDocData } from "@/types/analysis";
import { Campo, Lote, StockPorCampo, MovimientoHacienda, ArchivoPlano } from "@/types/gestion";
import { Presentacion } from "@/types/presentacion";

type EmpresaContext = {
  empresa:             Empresa;
  documents:           UploadedDoc[];
  generatedReports:    GeneratedReport[];
  escenarios:          GeneratedReport[];
  analysisResult:      AnalysisResult | null;
  extractedDocsData:   ExtractedDocData[];
  campos:              Campo[];
  planSiembra:         Lote[];
  campanaActual:       string;
  stockHacienda:       StockPorCampo[];
  movimientosHacienda: MovimientoHacienda[];
  archivosPlanos:      ArchivoPlano[];
  presentaciones:      Presentacion[];
};

export async function loadEmpresaContext(empresa: Empresa): Promise<EmpresaContext> {
  const state = await loadAllState(empresa.id);
  return {
    empresa,
    documents:           (state.documents           as UploadedDoc[]        | null) ?? [],
    generatedReports:    (state.reports              as GeneratedReport[]    | null) ?? [],
    escenarios:          (state.escenarios           as GeneratedReport[]    | null) ?? [],
    analysisResult:      (state.analysis             as AnalysisResult       | null) ?? null,
    extractedDocsData:   (state.extracted_docs       as ExtractedDocData[]   | null) ?? [],
    campos:              (state.campos               as Campo[]              | null) ?? [],
    planSiembra:         (state.plan_siembra         as Lote[]               | null) ?? [],
    campanaActual:       (state.campana              as string               | null) ?? "2025/26",
    stockHacienda:       (state.stock_hacienda       as StockPorCampo[]      | null) ?? [],
    movimientosHacienda: (state.movimientos_hacienda as MovimientoHacienda[] | null) ?? [],
    archivosPlanos:      (state.planos               as ArchivoPlano[]       | null) ?? [],
    presentaciones:      (state.presentaciones       as Presentacion[]       | null) ?? [],
  };
}

export function buildAgenteSystemPrompt(ctx: EmpresaContext): string {
  const {
    empresa, documents, generatedReports, escenarios, analysisResult,
    extractedDocsData, campos, planSiembra, campanaActual,
    stockHacienda, movimientosHacienda, archivosPlanos, presentaciones,
  } = ctx;

  const lines: string[] = [];

  lines.push("Sos AgroForma, el asistente de inteligencia artificial de la empresa agropecuaria argentina.");
  lines.push("Respondé siempre en español argentino, de manera profesional y concisa.");
  lines.push("Tenés acceso completo a la información de la empresa activa que se detalla a continuación.");
  lines.push("");

  // ── Empresa ───────────────────────────────────────────────────────────────
  lines.push("## EMPRESA ACTIVA");
  lines.push(`Nombre: ${empresa.nombre}`);
  if (empresa.cuit)      lines.push(`CUIT: ${empresa.cuit}`);
  if (empresa.actividad) lines.push(`Actividad: ${empresa.actividad}`);
  if (empresa.provincia) lines.push(`Provincia: ${empresa.provincia}`);
  if (empresa.localidad) lines.push(`Localidad: ${empresa.localidad}`);
  lines.push(`Campaña activa: ${campanaActual}`);
  lines.push("");

  // ── Documentos cargados ───────────────────────────────────────────────────
  if (documents.length > 0) {
    lines.push("## DOCUMENTOS CARGADOS");
    for (const doc of documents) {
      lines.push(`- ${doc.name} (${doc.type}, ${doc.date})`);
    }
    lines.push("");
  }

  // ── Análisis de documentos ────────────────────────────────────────────────
  if (analysisResult) {
    lines.push("## ANÁLISIS DE DOCUMENTACIÓN");
    lines.push(`Empresa detectada: ${analysisResult.empresa}`);
    if (analysisResult.cuit) lines.push(`CUIT: ${analysisResult.cuit}`);
    if (analysisResult.ejercicios?.length) {
      lines.push(`Ejercicios disponibles: ${analysisResult.ejercicios.join(", ")}`);
    }
    if (analysisResult.documentos_detectados?.length) {
      lines.push("Documentos detectados:");
      for (const doc of analysisResult.documentos_detectados) {
        lines.push(`  - ${doc.tipo}: ${doc.nombre_archivo} (${doc.periodo})`);
      }
    }
    lines.push("");
  }

  // ── Datos extraídos de documentos ─────────────────────────────────────────
  if (extractedDocsData.length > 0) {
    lines.push("## DATOS EXTRAÍDOS DE DOCUMENTOS");
    for (const doc of extractedDocsData) {
      lines.push(`### ${doc.tipo} — ${doc.nombre_archivo} (${doc.periodo})`);
      lines.push(JSON.stringify(doc.datos, null, 2));
      lines.push("");
    }
  }

  // ── Reportes generados ────────────────────────────────────────────────────
  if (generatedReports.length > 0) {
    lines.push("## REPORTES GENERADOS");
    for (const r of generatedReports) {
      lines.push(`- ${r.title} (${r.reportId}, ${r.generatedAt})`);
    }
    lines.push("");
  }

  // ── Escenarios ────────────────────────────────────────────────────────────
  if (escenarios.length > 0) {
    lines.push("## ESCENARIOS GENERADOS");
    for (const e of escenarios) {
      lines.push(`- ${e.title} (basado en: ${e.reportId})`);
      if (e.chatInstruction) lines.push(`  Instrucción: ${e.chatInstruction}`);
    }
    lines.push("");
  }

  // ── Campos ────────────────────────────────────────────────────────────────
  if (campos.length > 0) {
    lines.push("## CAMPOS");
    for (const c of campos) {
      const ha = c.hectareas ? `${c.hectareas} ha` : "";
      const prov = c.provincia ?? "";
      lines.push(`- ${c.nombre}${ha ? " — " + ha : ""}${prov ? " (" + prov + ")" : ""}`);
    }
    lines.push("");

    // ── Plan de siembra ───────────────────────────────────────────────────
    const lotesCampana = planSiembra.filter(l => l.campana === campanaActual);
    if (lotesCampana.length > 0) {
      lines.push(`## PLAN DE SIEMBRA — CAMPAÑA ${campanaActual}`);
      const campoMap: Record<string, string> = {};
      for (const c of campos) campoMap[c.id] = c.nombre;
      for (const l of lotesCampana) {
        lines.push(
          `- ${campoMap[l.campoId] ?? l.campoId}: ${l.cultivo} — ` +
          `${l.hectareas} ha, rinde ${l.rendimientoEsperado} tn/ha, ` +
          `precio USD ${l.precioEsperado}/tn, costos USD ${l.costosDirectos}/ha`
        );
      }
      lines.push("");
    }
  }

  // ── Stock hacienda ────────────────────────────────────────────────────────
  if (stockHacienda.length > 0) {
    lines.push("## STOCK DE HACIENDA");
    const campoMap: Record<string, string> = {};
    for (const c of campos) campoMap[c.id] = c.nombre;
    for (const s of stockHacienda) {
      lines.push(
        `- ${campoMap[s.campoId] ?? s.campoId}: ${s.categoria} — ` +
        `${s.cantidad} cabezas, ${s.pesoPromedio} kg promedio` +
        (s.raza ? ` (${s.raza})` : "")
      );
    }
    lines.push("");

    const recentMov = movimientosHacienda
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 20);
    if (recentMov.length > 0) {
      lines.push("## MOVIMIENTOS DE HACIENDA (últimos 20)");
      for (const m of recentMov) {
        lines.push(
          `- ${m.fecha} | ${m.tipo} | ${m.categoria} x${m.cantidad}` +
          (m.precioTotal ? ` | ARS ${m.precioTotal.toLocaleString("es-AR")}` : "")
        );
      }
      lines.push("");
    }
  }

  // ── Planos de campo ───────────────────────────────────────────────────────
  if (archivosPlanos.length > 0) {
    lines.push("## PLANOS DE CAMPO ANALIZADOS");
    for (const p of archivosPlanos) {
      lines.push(`- ${p.nombre}`);
      if (p.datos) {
        const a = p.datos;
        if (a.campo)            lines.push(`  Campo: ${a.campo}`);
        if (a.superficie_total) lines.push(`  Superficie total: ${a.superficie_total} ha`);
        if (a.lotes?.length)    lines.push(`  Lotes: ${a.lotes.length}`);
        if (a.cultivos_detectados?.length) {
          lines.push(`  Cultivos: ${a.cultivos_detectados.map(c => c.cultivo).join(", ")}`);
        }
        if (a.ubicacion?.provincia) lines.push(`  Provincia: ${a.ubicacion.provincia}`);
      }
    }
    lines.push("");
  }

  // ── Presentaciones ────────────────────────────────────────────────────────
  if (presentaciones.length > 0) {
    lines.push("## PRESENTACIONES E INFORMES");
    for (const p of presentaciones) {
      lines.push(`- ${p.nombre} (${p.tipo}, ${p.fecha})`);
      if (p.analisis) lines.push(`  Resumen IA: ${p.analisis}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("Usá toda esta información para responder las consultas del usuario con precisión.");
  lines.push("Si el usuario pregunta por datos que no están en el contexto, indicá que no están disponibles.");

  return lines.join("\n");
}
