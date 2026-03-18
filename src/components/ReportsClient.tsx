"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, Download, FileText, ChevronDown, FileSpreadsheet } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ReportPreviewModal from "@/components/ReportPreviewModal";
import { useAppContext } from "@/context/AppContext";
import { GeneratedReport } from "@/types/report";
import { generateReportPDF } from "@/lib/pdf/report-pdf";

const REPORT_LABELS: Record<string, string> = {
  "situacion-patrimonial": "Situación Patrimonial",
  "margen-bruto":          "Margen Bruto por Cultivo",
  "ratios":                "Ratios e Indicadores",
  "bridge":                "Bridge de Resultados",
  "break-even":            "Punto de Equilibrio",
  "calificacion-bancaria": "Calificación Bancaria",
  "evolucion-historica":   "Evolución Histórica",
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

// ─── Download dropdown ────────────────────────────────────────────────────────
function DownloadDropdown({ report, onError }: { report: GeneratedReport; onError: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
        style={{ backgroundColor: "#3D7A1C" }}
      >
        <Download size={13} />
        Descargar
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-48 rounded-xl border shadow-lg overflow-hidden z-50"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E5DE", top: "100%" }}
        >
          <button
            onClick={async () => {
              setOpen(false);
              try { await triggerExcelDownload(report); }
              catch (err) { onError(err instanceof Error ? err.message : "Error al descargar"); }
            }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-gray-50 text-left"
            style={{ color: "#1A1A1A", borderBottom: "1px solid #F0EDE6" }}
          >
            <FileSpreadsheet size={15} style={{ color: "#1E7E34" }} />
            <div>
              <p className="font-medium text-xs">Descargar Excel</p>
              <p className="text-[10px]" style={{ color: "#9B9488" }}>.xlsx con todas las hojas</p>
            </div>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              generateReportPDF(report);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-gray-50 text-left"
            style={{ color: "#1A1A1A" }}
          >
            <FileText size={15} style={{ color: "#C0392B" }} />
            <div>
              <p className="font-medium text-xs">Descargar PDF</p>
              <p className="text-[10px]" style={{ color: "#9B9488" }}>Formato profesional A4</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReportsClient() {
  const { generatedReports } = useAppContext();
  const [previewReport, setPreviewReport] = useState<GeneratedReport | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const sorted = [...generatedReports].reverse();

  const groups: Record<string, GeneratedReport[]> = {};
  for (const r of sorted) {
    if (!groups[r.reportId]) groups[r.reportId] = [];
    groups[r.reportId].push(r);
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
        <Sidebar />

        <div className="flex-1 overflow-y-auto">
          <header
            className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b bg-white/80 backdrop-blur-sm"
            style={{ borderColor: "#E8E5DE" }}
          >
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Reportes</h1>
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
                {generatedReports.length} reporte{generatedReports.length !== 1 ? "s" : ""} generado{generatedReports.length !== 1 ? "s" : ""}
              </p>
            </div>
          </header>

          <main className="px-8 py-7 space-y-8 max-w-5xl">

            {downloadError && (
              <div
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: "#FEE9E9", color: "#C0392B", border: "1px solid #FBCFCF" }}
              >
                <span>{downloadError}</span>
                <button onClick={() => setDownloadError(null)} className="ml-4 font-bold text-lg leading-none cursor-pointer hover:opacity-70">×</button>
              </div>
            )}

            {generatedReports.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20"
                style={{ borderColor: "#D6D1C8", backgroundColor: "#FAFAF8" }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EBF3E8" }}>
                  <FileText size={22} style={{ color: "#3D7A1C" }} />
                </div>
                <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>Todavía no generaste ningún reporte</p>
                <p className="text-xs text-center max-w-xs" style={{ color: "#9B9488" }}>
                  Subí documentos desde el Dashboard y generá reportes para verlos acá
                </p>
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <div
                  className="rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 border"
                  style={{ backgroundColor: "#FFFFFF", borderColor: "#C8E6C0" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>Total</span>
                    <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}>
                      {generatedReports.length} reporte{generatedReports.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="w-px h-4" style={{ backgroundColor: "#E8E5DE" }} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>Tipos</span>
                    <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{Object.keys(groups).length} tipo{Object.keys(groups).length !== 1 ? "s" : ""}</span>
                  </div>
                  {generatedReports[generatedReports.length - 1]?.data?.empresa && (
                    <>
                      <div className="w-px h-4" style={{ backgroundColor: "#E8E5DE" }} />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>Empresa</span>
                        <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{generatedReports[generatedReports.length - 1].data.empresa}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Reports table */}
                <div className="bg-white rounded-xl border" style={{ borderColor: "#E8E5DE" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#FAFAF8" }}>
                        {["Reporte", "Empresa", "Ejercicio", "Generado", ""].map((col) => (
                          <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((report, i) => {
                        const date = new Date(report.generatedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
                        const time = new Date(report.generatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <tr key={report.id} style={{ borderTop: i > 0 ? "1px solid #F0EDE6" : undefined }}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: report.chatModified ? "#B8922A" : "#3D7A1C" }} />
                                <div>
                                  <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{REPORT_LABELS[report.reportId] ?? report.title}</p>
                                  {report.chatModified && report.chatInstruction && (
                                    <p className="text-[10px] mt-0.5 italic truncate max-w-xs" style={{ color: "#9B9488" }}>
                                      &ldquo;{report.chatInstruction}&rdquo;
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4"><span className="text-sm" style={{ color: "#6B6560" }}>{report.data?.empresa ?? "—"}</span></td>
                            <td className="px-5 py-4"><span className="text-xs" style={{ color: "#9B9488" }}>{report.data?.ejercicio ?? report.data?.periodo_actual ?? "—"}</span></td>
                            <td className="px-5 py-4"><span className="text-xs" style={{ color: "#9B9488" }}>{date} · {time}</span></td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 justify-end">
                                {report.chatModified
                                  ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded mr-1" style={{ backgroundColor: "#FFF8EC", color: "#B8922A" }}>Via chat</span>
                                  : <span className="text-[11px] font-semibold px-2 py-0.5 rounded mr-1" style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}>Listo</span>
                                }
                                <button
                                  onClick={() => setPreviewReport(report)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer hover:bg-gray-50"
                                  style={{ borderColor: "#D6D1C8", color: "#1A1A1A" }}
                                >
                                  <Eye size={13} />
                                  Ver
                                </button>
                                <DownloadDropdown report={report} onError={setDownloadError} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {previewReport && (
        <ReportPreviewModal report={previewReport} onClose={() => setPreviewReport(null)} />
      )}
    </>
  );
}
