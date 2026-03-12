"use client";

import { useState } from "react";
import { FlaskConical, Eye, Download, FileSpreadsheet, FileText, Trash2, MessageSquare } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ReportPreviewModal from "@/components/ReportPreviewModal";
import { useAppContext } from "@/context/AppContext";
import { GeneratedReport } from "@/types/report";
import { generateReportPDF } from "@/lib/pdf/report-pdf";

const REPORT_LABELS: Record<string, string> = {
  "situacion-patrimonial":  "Situación Patrimonial",
  "margen-bruto":           "Margen Bruto por Cultivo",
  "ratios":                 "Ratios e Indicadores",
  "bridge":                 "Bridge de Resultados",
  "break-even":             "Punto de Equilibrio",
  "calificacion-bancaria":  "Calificación Bancaria",
  "evolucion-historica":    "Evolución Histórica",
};

async function downloadExcel(escenario: GeneratedReport) {
  const res = await fetch(escenario.downloadPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: escenario.data }),
  });
  if (!res.ok) throw new Error("Error al generar Excel");
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `escenario-${escenario.reportId}-${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function EscenariosClient() {
  const { escenarios, setEscenarios } = useAppContext();
  const [preview,    setPreview]    = useState<GeneratedReport | null>(null);
  const [dlError,    setDlError]    = useState<string | null>(null);
  const [dlLoading,  setDlLoading]  = useState<string | null>(null);

  const sorted = [...escenarios].reverse();

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este escenario?")) return;
    setEscenarios(prev => prev.filter(e => e.id !== id));
  }

  async function handleExcel(e: GeneratedReport) {
    setDlLoading(e.id);
    try { await downloadExcel(e); }
    catch (err) { setDlError(err instanceof Error ? err.message : "Error al descargar"); }
    finally { setDlLoading(null); }
  }

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
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#B8922A" }}>
                <FlaskConical size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Escenarios</h1>
                <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
                  Versiones modificadas via chat · {escenarios.length} escenario{escenarios.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Link href="/chat">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-colors hover:bg-gray-50"
                style={{ borderColor: "#D6D1C8", color: "#1A1A1A" }}
              >
                <MessageSquare size={15} />
                Ir al chat
              </button>
            </Link>
          </header>

          <main className="px-8 py-7 max-w-5xl space-y-6">

            {dlError && (
              <div
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: "#FEE9E9", color: "#C0392B", border: "1px solid #FBCFCF" }}
              >
                <span>{dlError}</span>
                <button onClick={() => setDlError(null)} className="ml-4 font-bold text-lg leading-none cursor-pointer hover:opacity-70">×</button>
              </div>
            )}

            {sorted.length === 0 ? (
              /* Empty state */
              <div
                className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-24"
                style={{ borderColor: "#D6D1C8", backgroundColor: "#FAFAF8" }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#FFF3E0" }}>
                  <FlaskConical size={26} style={{ color: "#B8922A" }} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm mb-1" style={{ color: "#1A1A1A" }}>No hay escenarios guardados</p>
                  <p className="text-xs max-w-xs" style={{ color: "#9B9488" }}>
                    Desde el chat, pedile al asistente que modifique un reporte y guardalo acá como escenario what-if.
                  </p>
                </div>
                <Link href="/chat">
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                    style={{ backgroundColor: "#B8922A" }}
                  >
                    <MessageSquare size={14} />
                    Abrir el chat
                  </button>
                </Link>
              </div>
            ) : (
              /* Escenarios list */
              <div className="space-y-3">
                {sorted.map((esc) => {
                  const date = new Date(esc.generatedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
                  const time = new Date(esc.generatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div
                      key={esc.id}
                      className="bg-white rounded-xl border overflow-hidden"
                      style={{ borderColor: "#E8E5DE" }}
                    >
                      {/* Top bar */}
                      <div
                        className="flex items-center justify-between px-5 py-3 border-b"
                        style={{ backgroundColor: "#FFF8EC", borderColor: "#F0E6CC" }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#B8922A", color: "#FFFFFF" }}
                          >
                            Via chat
                          </span>
                          <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                            {REPORT_LABELS[esc.reportId] ?? esc.title}
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: "#9B9488" }}>{date} · {time}</p>
                      </div>

                      {/* Instruction */}
                      {esc.chatInstruction && (
                        <div className="px-5 py-2 border-b" style={{ borderColor: "#F0EDE6", backgroundColor: "#FAFAF8" }}>
                          <p className="text-xs" style={{ color: "#6B6560" }}>
                            <span className="font-semibold">Instrucción:</span>{" "}
                            <span className="italic">&ldquo;{esc.chatInstruction}&rdquo;</span>
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 px-5 py-3">
                        <button
                          onClick={() => setPreview(esc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors hover:bg-gray-50"
                          style={{ borderColor: "#D6D1C8", color: "#1A1A1A" }}
                        >
                          <Eye size={13} /> Ver reporte
                        </button>

                        <button
                          onClick={() => handleExcel(esc)}
                          disabled={dlLoading === esc.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-white transition-opacity"
                          style={{ backgroundColor: "#3D7A1C", opacity: dlLoading === esc.id ? 0.7 : 1 }}
                        >
                          <FileSpreadsheet size={13} />
                          {dlLoading === esc.id ? "Generando…" : "Excel"}
                        </button>

                        <button
                          onClick={() => generateReportPDF(esc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors hover:bg-gray-50"
                          style={{ borderColor: "#D6D1C8", color: "#9B9488" }}
                        >
                          <FileText size={13} /> PDF
                        </button>

                        <div className="flex-1" />

                        <button
                          onClick={() => handleDelete(esc.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors hover:bg-red-50"
                          style={{ color: "#C0392B" }}
                          title="Eliminar escenario"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {preview && (
        <ReportPreviewModal report={preview} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
