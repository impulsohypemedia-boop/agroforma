"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import KpiCard from "@/components/dashboard/KpiCard";
import DocumentsTable from "@/components/dashboard/DocumentsTable";
import GeneratedReportsSection from "@/components/dashboard/GeneratedReportsSection";
import DocumentAnalysis from "@/components/dashboard/DocumentAnalysis";
import UploadModal from "@/components/UploadModal";
import ReportPreviewModal from "@/components/ReportPreviewModal";
import { UploadedDoc } from "@/types/document";
import { GeneratedReport } from "@/types/report";
import { AnalysisResult } from "@/types/analysis";

// ─── Mapa de rutas para reportes implementados ────────────────────────────────
// Clave = analysisId (underscore), valor = datos de ruta
const ROUTE_MAP: Record<string, { reportId: string; apiPath: string; downloadPath: string }> = {
  situacion_patrimonial: {
    reportId:     "situacion-patrimonial",
    apiPath:      "/api/reportes/situacion-patrimonial",
    downloadPath: "/api/reportes/situacion-patrimonial/download",
  },
  margen_bruto: {
    reportId:     "margen-bruto",
    apiPath:      "/api/reportes/margen-bruto",
    downloadPath: "/api/reportes/margen-bruto/download",
  },
  ratios: {
    reportId:     "ratios",
    apiPath:      "/api/reportes/ratios",
    downloadPath: "/api/reportes/ratios/download",
  },
  bridge: {
    reportId:     "bridge",
    apiPath:      "/api/reportes/bridge",
    downloadPath: "/api/reportes/bridge/download",
  },
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

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

export default function DashboardClient() {
  const [documents,        setDocuments]        = useState<UploadedDoc[]>([]);
  const [fileStore,        setFileStore]         = useState<File[]>([]);
  const [modalOpen,        setModalOpen]         = useState(false);
  const [analyzing,        setAnalyzing]         = useState(false);
  const [analysisResult,   setAnalysisResult]    = useState<AnalysisResult | null>(null);
  const [generating,       setGenerating]        = useState<string | null>(null); // analysisId
  const [genError,         setGenError]          = useState<string | null>(null);
  const [generatedReports, setGeneratedReports]  = useState<GeneratedReport[]>([]);
  const [previewReport,    setPreviewReport]     = useState<GeneratedReport | null>(null);

  // ── Análisis de documentos ────────────────────────────────────────────────
  const runAnalysis = async (files: File[]) => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/analizar-documentos", { method: "POST", body: fd });
      const body = await res.json();
      if (res.ok && body.data) {
        setAnalysisResult(body.data);
      } else {
        setGenError(body.error ?? "No se pudo analizar los documentos");
      }
    } catch {
      setGenError("Error al conectar con el servidor de análisis");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Upload confirm → guarda archivos y lanza análisis ────────────────────
  const handleConfirm = (newDocs: UploadedDoc[], newFiles: File[]) => {
    const allFiles = [...fileStore, ...newFiles];
    setDocuments((prev) => [...prev, ...newDocs]);
    setFileStore(allFiles);
    setModalOpen(false);
    runAnalysis(allFiles);
  };

  // ── Generar reporte (por analysisId) ─────────────────────────────────────
  const handleGenerate = async (analysisId: string) => {
    const route = ROUTE_MAP[analysisId];
    if (!route || generating) return;

    const reporte = analysisResult?.reportes_posibles.find((r) => r.id === analysisId);
    const title = reporte?.nombre ?? analysisId;

    setGenerating(analysisId);
    setGenError(null);

    try {
      const fd = new FormData();
      fileStore.forEach((f) => fd.append("files", f));

      const res = await fetch(route.apiPath, { method: "POST", body: fd });
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
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Error al generar el reporte");
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadFromList = async (report: GeneratedReport) => {
    try { await triggerExcelDownload(report); }
    catch (err) { setGenError(err instanceof Error ? err.message : "Error al descargar"); }
  };

  // ── KPIs derivados ────────────────────────────────────────────────────────
  const hasDocuments = documents.length > 0;
  const lastReport = generatedReports.length > 0
    ? formatDate(generatedReports[generatedReports.length - 1].generatedAt.split("T")[0])
    : "--";
  const reportesDisponibles = analysisResult?.reportes_posibles.filter((r) => r.disponible).length ?? 0;

  const kpis = [
    {
      label: "Documentos cargados",
      value: String(documents.length),
      sub: hasDocuments
        ? `${documents.length} archivo${documents.length !== 1 ? "s" : ""} procesado${documents.length !== 1 ? "s" : ""}`
        : "Ningún archivo procesado",
    },
    {
      label: "Reportes disponibles",
      value: analyzing ? "…" : String(reportesDisponibles),
      sub: analysisResult
        ? `${reportesDisponibles} de ${analysisResult.reportes_posibles.length} posibles`
        : analyzing
        ? "Analizando documentos…"
        : "Subí documentos para ver",
      accent: reportesDisponibles > 0,
    },
    {
      label: "Último reporte",
      value: lastReport,
      sub: generatedReports.length > 0
        ? generatedReports[generatedReports.length - 1].title
        : "Sin reportes generados",
    },
    {
      label: "Empresa detectada",
      value: analysisResult?.empresa ? analysisResult.empresa.split(" ")[0] : "—",
      sub: analysisResult?.cuit
        ? `CUIT: ${analysisResult.cuit}`
        : analyzing
        ? "Identificando…"
        : "Sin documentos",
      accent: !!analysisResult?.empresa,
    },
  ];

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <header
            className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-white/80 backdrop-blur-sm"
            style={{ borderColor: "#E8E5DE" }}
          >
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Dashboard</h1>
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>Campaña 2025/26</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#3D7A1C" }}
            >
              <Upload size={15} />
              {hasDocuments ? "Agregar documentos" : "Subir documentos"}
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

            {/* KPIs */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#9B9488" }}>
                Resumen
              </h2>
              <div className="grid grid-cols-4 gap-4">
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
                  <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>
                    Analizando documentación…
                  </p>
                  <p className="text-xs" style={{ color: "#9B9488" }}>
                    Claude está leyendo tus documentos y detectando qué reportes son posibles
                  </p>
                </div>
              </section>
            ) : analysisResult ? (
              <DocumentAnalysis
                analysis={analysisResult}
                generating={generating}
                onGenerate={handleGenerate}
              />
            ) : !hasDocuments ? (
              <section>
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14"
                  style={{ borderColor: "#D6D1C8", backgroundColor: "#FAFAF8" }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#EBF3E8" }}
                  >
                    <Upload size={22} style={{ color: "#3D7A1C" }} />
                  </div>
                  <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>
                    Subí documentos para comenzar
                  </p>
                  <p className="text-xs text-center max-w-xs" style={{ color: "#9B9488" }}>
                    Claude analizará automáticamente qué reportes son posibles con tu documentación
                  </p>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="mt-1 px-5 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: "#3D7A1C" }}
                  >
                    Subir documentos
                  </button>
                </div>
              </section>
            ) : null}

            {/* Reportes generados */}
            <GeneratedReportsSection
              reports={generatedReports}
              onView={(r) => setPreviewReport(r)}
              onDownload={handleDownloadFromList}
            />

            {/* Documentos recientes */}
            <section>
              <DocumentsTable documents={documents} />
            </section>
          </main>
        </div>
      </div>

      {modalOpen && (
        <UploadModal onClose={() => setModalOpen(false)} onConfirm={handleConfirm} />
      )}

      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </>
  );
}
