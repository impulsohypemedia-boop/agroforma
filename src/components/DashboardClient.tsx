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
    loadingData,
    fileStore, setFileStore,
    documents, setDocuments,
    generatedReports, setGeneratedReports,
    analysisResult, setAnalysisResult,
    extractedDocsData, setExtractedDocsData,
    extractedTexts, setExtractedTexts,
    campos, planSiembra, campanaActual,
    empresas, empresaActivaId, crearEmpresa,
  } = useAppContext();

  const [modalOpen,       setModalOpen]       = useState(false);
  const [nuevaEmpresaOpen, setNuevaEmpresaOpen] = useState(false);
  const [analyzing,       setAnalyzing]       = useState(false);
  // Auto-create empresa flow
  const [detectedEmpresa, setDetectedEmpresa] = useState<{ nombre: string; cuit?: string } | null>(null);
  const [editingEmpresaNombre, setEditingEmpresaNombre] = useState("");
  const pendingFilesRef = useRef<File[]>([]);
  const [extractProgress, setExtractProgress] = useState<{ current: number; total: number } | null>(null);
  const [processingSteps, setProcessingSteps] = useState<{ label: string; status: "pending" | "active" | "done" }[]>([]);
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

    // Prefer structured extractedData; fallback to raw texts from empresa_state
    const useStructured = extractedDocsData.length > 0;
    const payload = useStructured
      ? { extractedData: extractedDocsData }
      : { textos_extraidos: extractedTexts };

    console.log(`[generateOne] ${analysisId} → mode: ${useStructured ? "structured" : "raw_texts"}, extractedDocsData: ${extractedDocsData.length}, extractedTexts keys: ${Object.keys(extractedTexts).length}, textsSize: ${Object.values(extractedTexts).reduce((a, b) => a + b.length, 0)} chars`);

    const res = await fetch(route.apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
  const updateStep = (index: number, status: "pending" | "active" | "done") => {
    setProcessingSteps(prev => prev.map((s, i) => i === index ? { ...s, status } : s));
  };

  const runAnalysisWithProgress = async (files: File[], eId: string) => {
    setAnalyzing(true);
    setAnalysisResult(null);
    setExtractedDocsData([]);

    const fileNames = files.map(f => f.name);
    const steps = [
      { label: `Subiendo ${files.length} documento${files.length > 1 ? "s" : ""}…`, status: "active" as const },
      ...fileNames.map(n => ({ label: `Extrayendo datos de ${n}…`, status: "pending" as const })),
      { label: "Identificando reportes disponibles…", status: "pending" as const },
    ];
    setProcessingSteps(steps);

    // Upload all files to Supabase Storage first
    let uploaded: { name: string; type: string; size: number; path: string }[] = [];
    try {
      uploaded = await uploadFiles(eId, files);
      updateStep(0, "done");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Error al subir archivos");
      setAnalyzing(false);
      setProcessingSteps([]);
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
    const collectedTexts: Record<string, string> = {};

    // Step 1: extract each file individually
    if (fileRefs.length > 1) {
      for (let i = 0; i < fileRefs.length; i++) {
        setExtractProgress({ current: i + 1, total: fileRefs.length });
        updateStep(1 + i, "active");
        try {
          const res = await fetch("/api/analizar-documentos/extraer-uno", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fileRefs[i]),
          });
          const body = await res.json();
          if (res.ok && body.data) {
            collected.push(body.data as ExtractedDocData);
          }
          // Save raw text for post-refresh report generation
          if (body.texto) {
            collectedTexts[fileRefs[i].name] = body.texto;
          }
          updateStep(1 + i, "done");
        } catch {
          updateStep(1 + i, "done");
        }
      }
      setExtractProgress(null);
      setExtractedDocsData(collected);
      if (Object.keys(collectedTexts).length > 0) {
        setExtractedTexts(collectedTexts);
      }
    }

    // Step 2: determine available reports
    const lastStepIdx = steps.length - 1;
    updateStep(lastStepIdx, "active");
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
            // Save raw text for post-refresh report generation
            if (b2.texto) {
              setExtractedTexts({ [fileRefs[0].name]: b2.texto });
            }
          } catch { /* ignore */ }
        }
      }
      const body = await res.json();
      if (res.ok && body.data) {
        setAnalysisResult(body.data);
        // Auto-detect empresa if none exists
        if (empresas.length === 0 && body.data.empresa) {
          setDetectedEmpresa({ nombre: body.data.empresa, cuit: body.data.cuit ?? undefined });
          setEditingEmpresaNombre(body.data.empresa);
        } else if (empresas.length === 0) {
          // AI didn't detect empresa name — ask manually
          setNuevaEmpresaOpen(true);
        }
      }
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

    if (empresaActivaId) {
      runAnalysisWithProgress(allFiles, empresaActivaId);
    } else {
      // No empresa yet — use temp path, store files for later
      pendingFilesRef.current = allFiles;
      runAnalysisWithProgress(allFiles, "sin-empresa");
    }
  };

  // Confirm auto-detected empresa
  const handleConfirmEmpresa = async () => {
    const nombre = editingEmpresaNombre.trim();
    if (!nombre) return;
    const nueva = await crearEmpresa({
      nombre,
      cuit: detectedEmpresa?.cuit,
      actividad: "mixta",
      campana: "2025/26",
    });
    setDetectedEmpresa(null);
    if (nueva) {
      // Re-upload files to the real empresa path if we used temp
      // For now, the files are already in storage under "sin-empresa/" — that's fine
      // The important thing is the empresa exists and state is linked to it
    }
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

  // ── Can generate? (extracted data OR raw texts from Supabase OR files in memory) ──
  const hasTexts = Object.values(extractedTexts).some(t => t && t.length > 10);
  const canGenerate = extractedDocsData.length > 0 || hasTexts || fileStore.length > 0;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Documentos cargados",
      value: String(documents.length),
      sub: documents.length > 0
        ? `${documents.length} archivo${documents.length !== 1 ? "s" : ""} procesado${documents.length !== 1 ? "s" : ""}`
        : "Ningún archivo procesado",
    },
    {
      label: "Reportes generados",
      value: String(generatedReports.length),
      sub: generatedReports.length > 0
        ? `Último: ${generatedReports[generatedReports.length - 1].title}`
        : "Sin reportes generados",
      accent: generatedReports.length > 0,
    },
    {
      label: "Empresa",
      value: analysisResult?.empresa ?? "—",
      sub: analysisResult?.cuit ?? "Subí documentos para detectar",
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

          <main className="px-8 py-7 space-y-8 max-w-6xl">

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
            {loadingData ? (
              <section>
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border py-14"
                  style={{ borderColor: "#E8E5DE", backgroundColor: "#FFFFFF" }}
                >
                  <Loader2 size={28} className="animate-spin" style={{ color: "#3D7A1C" }} />
                  <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>Cargando datos…</p>
                </div>
              </section>
            ) : analyzing ? (
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
                canGenerate={canGenerate}
                latestByAnalysisId={latestByAnalysisId}
                onGenerate={handleGenerate}
                onGenerateMultiple={handleGenerateMultiple}
                onViewReport={(r) => setPreviewReport(r)}
                onUpload={() => setModalOpen(true)}
              />
            ) : generatedReports.length > 0 ? (
              /* No analysis result but have generated reports — show them */
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9B9488" }}>
                    Reportes generados
                  </h2>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#3D7A1C" }}
                  >
                    <Upload size={12} />
                    Subir documentos para generar más
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {generatedReports.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border p-5 flex flex-col gap-3"
                      style={{ borderColor: "#C8E6C0", backgroundColor: "#FFFFFF" }}
                    >
                      <h3 className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>{r.title}</h3>
                      <p className="text-xs" style={{ color: "#9B9488" }}>
                        {new Date(r.generatedAt).toLocaleDateString("es-AR")}
                      </p>
                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => setPreviewReport(r)}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors hover:bg-gray-50"
                          style={{ borderColor: "#3D7A1C", color: "#3D7A1C" }}
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => triggerExcelDownload(r)}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                          style={{ backgroundColor: "#3D7A1C" }}
                        >
                          Descargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : documents.length === 0 ? (
              <section className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: "#1A1A1A" }}>
                    Bienvenido a AgroForma
                  </h2>
                  <p className="text-sm font-medium mb-1" style={{ color: "#3D7A1C" }}>
                    La inteligencia artificial de la empresa agropecuaria argentina
                  </p>
                  <p className="text-sm max-w-lg mx-auto" style={{ color: "#9B9488" }}>
                    Subí la documentación de tu empresa y AgroForma la analiza, estructura y te genera reportes automáticamente.
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

      {/* Auto-detect empresa confirmation modal */}
      {detectedEmpresa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl p-7 mx-4"
            style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E5DE" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#EBF3E8" }}
              >
                <Building2 size={20} style={{ color: "#3D7A1C" }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "#1A1A1A" }}>
                  Empresa detectada
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
                  Encontramos esta información en tus documentos
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6560" }}>
                  Nombre de la empresa
                </label>
                <input
                  type="text"
                  value={editingEmpresaNombre}
                  onChange={(e) => setEditingEmpresaNombre(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:ring-2"
                  style={{ borderColor: "#E8E5DE", color: "#1A1A1A" }}
                />
              </div>
              {detectedEmpresa.cuit && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6560" }}>
                    CUIT
                  </label>
                  <p className="text-sm font-mono px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#F9F8F4", color: "#1A1A1A" }}>
                    {detectedEmpresa.cuit}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setDetectedEmpresa(null); setNuevaEmpresaOpen(true); }}
                className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer hover:bg-gray-50"
                style={{ borderColor: "#E8E5DE", color: "#6B6560" }}
              >
                Editar manualmente
              </button>
              <button
                onClick={handleConfirmEmpresa}
                disabled={!editingEmpresaNombre.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#3D7A1C" }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
