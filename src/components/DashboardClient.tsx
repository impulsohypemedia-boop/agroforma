"use client";

import { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { ExtractedDocData } from "@/types/analysis";
import { Upload, Loader2, Bell, Building2, FileText, FileSpreadsheet, Wheat, Landmark, ClipboardList, Beef } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import KpiCard from "@/components/dashboard/KpiCard";
import DocumentAnalysis from "@/components/dashboard/DocumentAnalysis";
import UploadModal from "@/components/UploadModal";
import ReportPreviewModal from "@/components/ReportPreviewModal";
import NuevaEmpresaModal from "@/components/NuevaEmpresaModal";
import { UploadedDoc } from "@/types/document";
import { GeneratedReport } from "@/types/report";
import { uploadFiles } from "@/lib/supabase/storage";

// ─── Route map ────────────────────────────────────────────────────────────────
const ROUTE_MAP: Record<string, { reportId: string; apiPath: string; downloadPath: string }> = {
  situacion_patrimonial: {
    reportId: "situacion-patrimonial",
    apiPath: "/api/reportes/situacion-patrimonial",
    downloadPath: "/api/reportes/situacion-patrimonial/download",
  },
  margen_bruto: {
    reportId: "margen-bruto",
    apiPath: "/api/reportes/margen-bruto",
    downloadPath: "/api/reportes/margen-bruto/download",
  },
  ratios: {
    reportId: "ratios",
    apiPath: "/api/reportes/ratios",
    downloadPath: "/api/reportes/ratios/download",
  },
  bridge: {
    reportId: "bridge",
    apiPath: "/api/reportes/bridge",
    downloadPath: "/api/reportes/bridge/download",
  },
  calificacion_bancaria: {
    reportId: "calificacion-bancaria",
    apiPath: "/api/reportes/calificacion-bancaria",
    downloadPath: "/api/reportes/calificacion-bancaria/download",
  },
  break_even: {
    reportId: "break-even",
    apiPath: "/api/reportes/break-even",
    downloadPath: "/api/reportes/break-even/download",
  },
  evolucion_historica: {
    reportId: "evolucion-historica",
    apiPath: "/api/reportes/evolucion-historica",
    downloadPath: "/api/reportes/evolucion-historica/download",
  },
};

async function triggerExcelDownload(report: GeneratedReport) {
  const res = await fetch(report.downloadPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: report.data }),
  });
  if (!res.ok) throw new Error("Error al generar el Excel");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.reportId}-${(report.data?.empresa ?? "empresa").replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Enrich analysis with gestión data ────────────────────────────────────────
function enrichAnalysis(
  analysis: import("@/types/analysis").AnalysisResult | null,
  hasCampos: boolean,
  hasPlanSiembra: boolean,
): import("@/types/analysis").AnalysisResult | null {
  if (!analysis) return null;
  if (!hasCampos && !hasPlanSiembra) return analysis;
  return {
    ...analysis,
    reportes_posibles: analysis.reportes_posibles.map((r) => {
      if (r.id === "proyeccion_campana" && hasCampos && hasPlanSiembra) {
        return { ...r, disponible: true, nota: "Datos del plan de siembra disponibles." };
      }
      if (r.id === "ranking_campos" && hasCampos) {
        return { ...r, disponible: true, nota: "Campos cargados en Gestión." };
      }
      return r;
    }),
  };
}

export default function DashboardClient() {
  const {
    fileStore, setFileStore,
    documents, setDocuments,
    generatedReports, setGeneratedReports,
    analysisResult, setAnalysisResult,
    extractedDocsData, setExtractedDocsData,
    campos, planSiembra, campanaActual,
    empresas, empresaActivaId,
  } = useAppContext();

  const [modalOpen,       setModalOpen]       = useState(false);
  const [nuevaEmpresaOpen, setNuevaEmpresaOpen] = useState(false);
  const [analyzing,       setAnalyzing]       = useState(false);
  const [extractProgress, setExtractProgress] = useState<{ current: number; total: number } | null>(null);
  const [generating,      setGenerating]      = useState<string | null>(null);
  const [bulkProgress,    setBulkProgress]    = useState<{ current: number; total: number; name: string } | null>(null);
  const [genError,        setGenError]        = useState<string | null>(null);
  const [previewReport,   setPreviewReport]   = useState<GeneratedReport | null>(null);

  // ── Notification bell ─────────────────────────────────────────────────────
  const [bellOpen,   setBellOpen]   = useState(false);
  const [seenCount,  setSeenCount]  = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("agroforma_notif_seen");
    if (stored) setSeenCount(parseInt(stored, 10) || 0);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unseenCount = Math.max(0, generatedReports.length - seenCount);

  const openBell = () => {
    setBellOpen((v) => !v);
    setSeenCount(generatedReports.length);
    localStorage.setItem("agroforma_notif_seen", String(generatedReports.length));
  };

  // ── Core generation ───────────────────────────────────────────────────────
  const generateOne = async (analysisId: string) => {
    const route = ROUTE_MAP[analysisId];
    if (!route) return;
    const reporte = analysisResult?.reportes_posibles.find((r) => r.id === analysisId);
    const title = reporte?.nombre ?? analysisId;

    if (extractedDocsData.length === 0) {
      throw new Error("No hay datos extraídos. Volvé a subir los documentos.");
    }

    const res = await fetch(route.apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extractedData: extractedDocsData }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
    setGeneratedReports((prev) => [
      ...prev,
      {
        id:           crypto.randomUUID(),
        reportId:     route.reportId,
        title,
        generatedAt:  new Date().toISOString(),
        downloadPath: route.downloadPath,
        data:         body.data,
      },
    ]);
  };

  const handleGenerate = async (analysisId: string) => {
    if (generating || bulkProgress) return;
    setGenerating(analysisId);
    setGenError(null);
    try { await generateOne(analysisId); }
    catch (err) { setGenError(err instanceof Error ? err.message : "Error al generar"); }
    finally { setGenerating(null); }
  };

  const handleGenerateMultiple = async (analysisIds: string[]) => {
    const valid = analysisIds.filter((id) => ROUTE_MAP[id]);
    if (!valid.length || generating || bulkProgress) return;
    setGenError(null);
    for (let i = 0; i < valid.length; i++) {
      const id = valid[i];
      const nombre = analysisResult?.reportes_posibles.find((r) => r.id === id)?.nombre ?? id;
      setBulkProgress({ current: i + 1, total: valid.length, name: nombre });
      setGenerating(id);
      try { await generateOne(id); }
      catch (err) { setGenError(err instanceof Error ? err.message : "Error al generar"); }
      finally { setGenerating(null); }
    }
    setBulkProgress(null);
  };

  // ── Upload & extraction flow ───────────────────────────────────────────────
  const runAnalysisWithProgress = async (files: File[]) => {
    if (!empresaActivaId) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    setExtractedDocsData([]);

    // Upload all files to Supabase Storage first
    let uploaded: { name: string; type: string; size: number; path: string }[] = [];
    try {
      uploaded = await uploadFiles(empresaActivaId, files);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Error al subir archivos");
      setAnalyzing(false);
      return;
    }

    // Update documents with storage paths
    setDocuments((prev) =>
      prev.map((doc) => {
        const match = uploaded.find((u) => u.name === doc.name);
        return match ? { ...doc, storage_path: match.path } : doc;
      })
    );

    const fileRefs = uploaded.map((u) => ({
      name: u.name, type: u.type, size: u.size, path: u.path,
    }));

    const collected: ExtractedDocData[] = [];

    // Step 1: extract each file individually
    if (fileRefs.length > 1) {
      for (let i = 0; i < fileRefs.length; i++) {
        setExtractProgress({ current: i + 1, total: fileRefs.length });
        try {
          const res = await fetch("/api/analizar-documentos/extraer-uno", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fileRefs[i]),
          });
          const body = await res.json();
          if (res.ok && body.data) collected.push(body.data as ExtractedDocData);
        } catch {
          // continue even if one file fails
        }
      }
      setExtractProgress(null);
      setExtractedDocsData(collected);
    }

    // Step 2: determine available reports
    try {
      let res: Response;
      if (collected.length > 0) {
        res = await fetch("/api/analizar-documentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ extractedData: collected }),
        });
      } else {
        // Single file: send URL reference
        res = await fetch("/api/analizar-documentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: fileRefs }),
        });

        // Also extract the single file for report generation
        if (fileRefs.length === 1) {
          try {
            const r2 = await fetch("/api/analizar-documentos/extraer-uno", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(fileRefs[0]),
            });
            const b2 = await r2.json();
            if (r2.ok && b2.data) {
              collected.push(b2.data as ExtractedDocData);
              setExtractedDocsData(collected);
            }
          } catch { /* ignore */ }
        }
      }
      const body = await res.json();
      if (res.ok && body.data) setAnalysisResult(body.data);
      else setGenError(body.error ?? "No se pudo analizar los documentos");
    } catch {
      setGenError("Error al conectar con el servidor de análisis");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = (newDocs: UploadedDoc[], newFiles: File[]) => {
    const allFiles = [...fileStore, ...newFiles];
    setDocuments((prev) => [...prev, ...newDocs]);
    setFileStore(allFiles);
    setModalOpen(false);
    runAnalysisWithProgress(allFiles);
  };

  // ── Enrich analysis with gestión data ────────────────────────────────────
  const hasCampos = campos.length > 0;
  const hasPlanSiembra = planSiembra.filter((l) => l.campana === campanaActual).length > 0;
  const enrichedAnalysis = enrichAnalysis(analysisResult, hasCampos, hasPlanSiembra);

  // ── Latest report per analysisId (for "Ver reporte" button) ──────────────
  const latestByAnalysisId: Record<string, GeneratedReport> = {};
  for (const [analysisId, route] of Object.entries(ROUTE_MAP)) {
    const matching = generatedReports.filter((r) => r.reportId === route.reportId);
    if (matching.length > 0) latestByAnalysisId[analysisId] = matching[matching.length - 1];
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const reportesDisponibles = enrichedAnalysis?.reportes_posibles.filter((r) => r.disponible).length ?? 0;

  const kpis = [
    {
      label: "Documentos cargados",
      value: String(documents.length),
      sub: documents.length > 0
        ? `${documents.length} archivo${documents.length !== 1 ? "s" : ""} procesado${documents.length !== 1 ? "s" : ""}`
        : "Ningún archivo procesado",
    },
    {
      label: "Reportes disponibles",
      value: analyzing ? "…" : String(reportesDisponibles),
      sub: analysisResult
        ? `${reportesDisponibles} de ${enrichedAnalysis!.reportes_posibles.length} posibles`
        : analyzing ? "Analizando documentos…" : "Subí documentos para ver",
      accent: reportesDisponibles > 0,
    },
    {
      label: "Reportes generados",
      value: String(generatedReports.length),
      sub: generatedReports.length > 0
        ? `Último: ${generatedReports[generatedReports.length - 1].title}`
        : "Sin reportes generados",
      accent: generatedReports.length > 0,
    },
  ];

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <header
            className="sticky top-0 z-10 flex items-center gap-4 px-8 py-5 border-b bg-white/80 backdrop-blur-sm"
            style={{ borderColor: "#E8E5DE" }}
          >
            <div className="flex-1">
              <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Dashboard</h1>
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Campaña 2025/26</p>
            </div>

            {/* Empresa detectada */}
            {analysisResult?.empresa && (
              <div
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm"
                style={{ borderColor: "#C8E6C0", backgroundColor: "#F5FAF3" }}
              >
                <span className="font-semibold truncate max-w-[180px]" style={{ color: "#1A1A1A" }}>
                  {analysisResult.empresa}
                </span>
                {analysisResult.cuit && (
                  <>
                    <span style={{ color: "#C8E6C0" }}>·</span>
                    <span className="text-xs font-mono" style={{ color: "#6B6560" }}>
                      {analysisResult.cuit}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Bell */}
            <div ref={bellRef} className="relative">
              <button
                onClick={openBell}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50"
                style={{ borderColor: "#E8E5DE" }}
              >
                <Bell size={17} style={{ color: "#6B6560" }} />
                {unseenCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white px-1"
                    style={{ backgroundColor: "#3D7A1C" }}
                  >
                    {unseenCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-xl border shadow-lg overflow-hidden z-50"
                  style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E5DE", top: "100%" }}
                >
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#F0EDE6" }}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>
                      Reportes generados
                    </span>
                    <Link href="/reportes" onClick={() => setBellOpen(false)}>
                      <span className="text-xs font-semibold cursor-pointer" style={{ color: "#3D7A1C" }}>
                        Ver todos →
                      </span>
                    </Link>
                  </div>

                  {generatedReports.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs" style={{ color: "#9B9488" }}>No hay reportes generados todavía</p>
                    </div>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: "#F0EDE6" }}>
                      {[...generatedReports].reverse().slice(0, 6).map((r) => {
                        const date = new Date(r.generatedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
                        const time = new Date(r.generatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <li key={r.id} className="px-4 py-3 flex items-center gap-3">
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: "#3D7A1C" }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{r.title}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
                                {r.data?.empresa ?? "—"} · {date} {time}
                              </p>
                            </div>
                            <button
                              onClick={() => { setPreviewReport(r); setBellOpen(false); }}
                              className="text-xs font-semibold shrink-0 cursor-pointer"
                              style={{ color: "#3D7A1C" }}
                            >
                              Ver
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Upload button */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#3D7A1C" }}
            >
              <Upload size={15} />
              {documents.length > 0 ? "Agregar documentos" : "Subir documentos"}
            </button>
          </header>

          {/* Empty state: no empresas */}
          {empresas.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm py-20">
                <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Bienvenido a AgroForma</h2>
                <p className="text-gray-500 mb-6">Creá tu primera empresa para comenzar a cargar documentos y generar reportes.</p>
                <button onClick={() => setNuevaEmpresaOpen(true)} className="px-6 py-3 rounded-xl font-semibold text-white" style={{ backgroundColor: "#1A3311" }}>
                  Crear mi primera empresa
                </button>
              </div>
            </div>
          )}

          <main className="px-8 py-7 space-y-8 max-w-6xl" style={{ display: empresas.length === 0 ? "none" : undefined }}>

            {/* Error banner */}
            {genError && (
              <div
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: "#FEE9E9", color: "#C0392B", border: "1px solid #FBCFCF" }}
              >
                <span>{genError}</span>
                <button onClick={() => setGenError(null)} className="ml-4 font-bold text-lg leading-none cursor-pointer hover:opacity-70">×</button>
              </div>
            )}

            {/* Modo histórico banner */}
            {enrichedAnalysis?.modo === "historico" && enrichedAnalysis.ejercicios && enrichedAnalysis.ejercicios.length >= 2 && (
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-medium"
                style={{ backgroundColor: "#F5FAF3", borderColor: "#3D7A1C", color: "#1A3311" }}
              >
                <span className="text-lg">📊</span>
                <div>
                  <span className="font-bold" style={{ color: "#3D7A1C" }}>
                    {enrichedAnalysis.balances_detectados} balances detectados ({enrichedAnalysis.ejercicios[0]}–{enrichedAnalysis.ejercicios[enrichedAnalysis.ejercicios.length - 1]})
                  </span>
                  <span className="ml-2" style={{ color: "#6B6560" }}>· Modo Análisis Histórico activado</span>
                  {enrichedAnalysis.empresa_consistente === false && (
                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: "#FEF3CD", color: "#92680A" }}>
                      ⚠ Empresas distintas detectadas
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* KPIs */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#9B9488" }}>
                Resumen
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
              </div>
            </section>

            {/* Análisis / Reportes disponibles */}
            {analyzing ? (
              <section>
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border py-14"
                  style={{ borderColor: "#E8E5DE", backgroundColor: "#FFFFFF" }}
                >
                  <Loader2 size={28} className="animate-spin" style={{ color: "#3D7A1C" }} />
                  {extractProgress ? (
                    <>
                      <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>
                        Procesando documento {extractProgress.current} de {extractProgress.total}…
                      </p>
                      <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E8E5DE" }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ backgroundColor: "#3D7A1C", width: `${(extractProgress.current / extractProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs" style={{ color: "#9B9488" }}>
                        Extrayendo datos de cada balance por separado
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>Analizando documentación…</p>
                      <p className="text-xs" style={{ color: "#9B9488" }}>
                        Claude está detectando qué reportes son posibles
                      </p>
                    </>
                  )}
                </div>
              </section>
            ) : enrichedAnalysis ? (
              <DocumentAnalysis
                analysis={enrichedAnalysis}
                generating={generating}
                bulkProgress={bulkProgress}
                hasFiles={extractedDocsData.length > 0}
                latestByAnalysisId={latestByAnalysisId}
                onGenerate={handleGenerate}
                onGenerateMultiple={handleGenerateMultiple}
                onViewReport={(r) => setPreviewReport(r)}
                onUpload={() => setModalOpen(true)}
              />
            ) : documents.length === 0 ? (
              <section className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2" style={{ color: "#1A1A1A" }}>
                    Subí la documentación de tu empresa para comenzar
                  </h2>
                  <p className="text-sm" style={{ color: "#9B9488" }}>
                    AgroForma analiza tus documentos y genera reportes automáticamente
                  </p>
                </div>

                {/* Upload button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#3D7A1C" }}
                  >
                    <Upload size={18} />
                    Subir documentos
                  </button>
                </div>

                {/* Document type cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      icon: FileText,
                      iconColor: "#C0392B",
                      iconBg: "#FEE2E2",
                      title: "Balances y estados contables",
                      desc: "PDF del balance anual, estado de resultados, situación patrimonial",
                      badge: "Recomendado para empezar",
                      genera: "Situación patrimonial, ratios, margen bruto, bridge de resultados",
                    },
                    {
                      icon: Wheat,
                      iconColor: "#3D7A1C",
                      iconBg: "#EBF3E8",
                      title: "Plan de siembra",
                      desc: "Excel con hectáreas por cultivo, rindes, precios y costos por campo",
                      genera: "Proyección de campaña, ranking de campos, punto de equilibrio",
                    },
                    {
                      icon: Beef,
                      iconColor: "#8B5E34",
                      iconBg: "#FEF3C7",
                      title: "Planilla de hacienda",
                      desc: "Excel con stock de hacienda por categoría y campo",
                      genera: "Valuación del rodeo, sección ganadera de calificación bancaria",
                    },
                    {
                      icon: ClipboardList,
                      iconColor: "#D97706",
                      iconBg: "#FEF9C3",
                      title: "Liquidaciones de granos",
                      desc: "PDF de liquidaciones primarias del acopio",
                      genera: "Análisis de comercialización, posición de granos",
                    },
                    {
                      icon: Landmark,
                      iconColor: "#2563EB",
                      iconBg: "#DBEAFE",
                      title: "Extractos bancarios",
                      desc: "PDF de extractos de cuenta de cualquier banco",
                      genera: "Flujo de caja real, saldos por banco",
                    },
                    {
                      icon: FileSpreadsheet,
                      iconColor: "#059669",
                      iconBg: "#D1FAE5",
                      title: "Presupuesto de campaña",
                      desc: "Excel con costos e ingresos proyectados",
                      genera: "Presupuesto vs real, control de gestión",
                    },
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.title}
                        className="rounded-xl border p-5 flex flex-col gap-3"
                        style={{ borderColor: "#E8E5DE", backgroundColor: "#FFFFFF" }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: card.iconBg }}
                          >
                            <Icon size={20} style={{ color: card.iconColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{card.title}</p>
                            {card.badge && (
                              <span
                                className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}
                              >
                                {card.badge}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "#6B6560" }}>{card.desc}</p>
                        <div
                          className="rounded-lg px-3 py-2 mt-auto"
                          style={{ backgroundColor: "#F9F8F4" }}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B9488" }}>
                            Qué genera
                          </p>
                          <p className="text-xs" style={{ color: "#3D7A1C" }}>{card.genera}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </main>
        </div>
      </div>

      {modalOpen && (
        <UploadModal onClose={() => setModalOpen(false)} onConfirm={handleConfirm} />
      )}

      {previewReport && (
        <ReportPreviewModal report={previewReport} onClose={() => setPreviewReport(null)} />
      )}

      <NuevaEmpresaModal
        open={nuevaEmpresaOpen}
        onClose={() => setNuevaEmpresaOpen(false)}
      />
    </>
  );
}
