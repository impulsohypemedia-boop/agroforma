"use client";

import { useState } from "react";
import { Upload, FolderOpen, Eye } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import UploadModal from "@/components/UploadModal";
import DocPreviewModal from "@/components/DocPreviewModal";
import { useAppContext } from "@/context/AppContext";
import { UploadedDoc, DocType } from "@/types/document";

const typeColor: Record<DocType, { bg: string; text: string }> = {
  PDF:  { bg: "#FEE9E9", text: "#C0392B" },
  XLSX: { bg: "#E6F4EA", text: "#1E7E34" },
  XLS:  { bg: "#E6F4EA", text: "#1E7E34" },
  CSV:  { bg: "#EAF1FB", text: "#1A5CA0" },
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocsClient() {
  const { fileStore, setFileStore, documents, setDocuments, setAnalysisResult, analysisResult } = useAppContext();
  const [modalOpen,   setModalOpen]   = useState(false);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<string>("Todos");
  const [catFilter,   setCatFilter]   = useState<string>("Todos");
  const [previewFile, setPreviewFile] = useState<File | null>(null);

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
        setError(body.error ?? "No se pudo analizar los documentos");
      }
    } catch {
      setError("Error al conectar con el servidor de análisis");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = (newDocs: UploadedDoc[], newFiles: File[]) => {
    const allFiles = [...fileStore, ...newFiles];
    setDocuments((prev) => [...prev, ...newDocs]);
    setFileStore(allFiles);
    setModalOpen(false);
    runAnalysis(allFiles);
  };

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
              <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>Documentos</h1>
              <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
                {documents.length} archivo{documents.length !== 1 ? "s" : ""} cargado{documents.length !== 1 ? "s" : ""}
                {analyzing && " · Analizando…"}
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#3D7A1C" }}
            >
              <Upload size={15} />
              {documents.length > 0 ? "Agregar documentos" : "Subir documentos"}
            </button>
          </header>

          <main className="px-8 py-7 space-y-6 max-w-5xl">

            {/* Error banner */}
            {error && (
              <div
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: "#FEE9E9", color: "#C0392B", border: "1px solid #FBCFCF" }}
              >
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-4 font-bold text-lg leading-none cursor-pointer hover:opacity-70">×</button>
              </div>
            )}

            {/* Analyzing banner */}
            {analyzing && (
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm border"
                style={{ backgroundColor: "#FFFBEB", borderColor: "#F5D87A", color: "#92680A" }}
              >
                <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
                <span>Analizando documentos con Claude… esto puede tomar unos segundos.</span>
              </div>
            )}

            {/* Empty state */}
            {documents.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20"
                style={{ borderColor: "#D6D1C8", backgroundColor: "#FAFAF8" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#EBF3E8" }}
                >
                  <FolderOpen size={22} style={{ color: "#3D7A1C" }} />
                </div>
                <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>
                  No hay documentos cargados
                </p>
                <p className="text-xs text-center max-w-xs" style={{ color: "#9B9488" }}>
                  Subí balances, liquidaciones, planes de siembra u otros documentos para comenzar
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-1 px-5 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: "#3D7A1C" }}
                >
                  Subir documentos
                </button>
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <div
                  className="rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 border"
                  style={{ backgroundColor: "#FFFFFF", borderColor: "#C8E6C0" }}
                >
                  {(["PDF", "XLSX", "XLS", "CSV"] as DocType[]).map((type) => {
                    const count = documents.filter((d) => d.type === type).length;
                    if (count === 0) return null;
                    const colors = typeColor[type];
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {type}
                        </span>
                        <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                          {count} archivo{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    );
                  })}
                  <div className="ml-auto shrink-0">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ backgroundColor: fileStore.length > 0 ? "#EBF3E8" : "#F4F2EE", color: fileStore.length > 0 ? "#3D7A1C" : "#9B9488" }}
                    >
                      {fileStore.length > 0 ? `${fileStore.length} en memoria` : "Sin archivos en memoria"}
                    </span>
                  </div>
                </div>

                {/* Filter bar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Search */}
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Buscar por nombre de archivo…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{
                        width: "100%", padding: "9px 14px 9px 38px", borderRadius: 10,
                        border: "1px solid #E8E5DE", backgroundColor: "#fff", fontSize: 13,
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9B9488", pointerEvents: "none" }}>
                      🔍
                    </span>
                  </div>

                  {/* Type chips */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#9B9488", alignSelf: "center" }}>Formato:</span>
                    {["Todos", "PDF", "Excel", "CSV"].map(t => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        style={{
                          padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          border: typeFilter === t ? "none" : "1px solid #E8E5DE",
                          backgroundColor: typeFilter === t ? "#1A3311" : "#fff",
                          color: typeFilter === t ? "#fff" : "#6B6560",
                          transition: "all 0.15s",
                        }}
                      >{t}</button>
                    ))}
                  </div>

                  {/* Category chips */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#9B9488", alignSelf: "center" }}>Categoría:</span>
                    {["Todos", "Balance", "Plan de Siembra", "Liquidación", "Otro"].map(c => (
                      <button
                        key={c}
                        onClick={() => setCatFilter(c)}
                        style={{
                          padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          border: catFilter === c ? "none" : "1px solid #E8E5DE",
                          backgroundColor: catFilter === c ? "#3D7A1C" : "#fff",
                          color: catFilter === c ? "#fff" : "#6B6560",
                          transition: "all 0.15s",
                        }}
                      >{c}</button>
                    ))}
                  </div>
                </div>

                {/* Documents table */}
                <div
                  className="bg-white rounded-xl border overflow-hidden"
                  style={{ borderColor: "#E8E5DE" }}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#FAFAF8" }}>
                        {["Nombre", "Tipo", "Tamaño", "Fecha de carga", "Estado", ""].map((col) => (
                          <th
                            key={col}
                            className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: "#9B9488" }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredDocs = [...documents].reverse().filter(doc => {
                          if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
                          if (typeFilter !== "Todos") {
                            if (typeFilter === "Excel" && doc.type !== "XLSX" && doc.type !== "XLS") return false;
                            if (typeFilter === "PDF" && doc.type !== "PDF") return false;
                            if (typeFilter === "CSV" && doc.type !== "CSV") return false;
                          }
                          if (catFilter !== "Todos") {
                            const detected = analysisResult?.documentos_detectados?.find(
                              d => d.nombre_archivo === doc.name
                            );
                            if (catFilter === "Balance" && (!detected || !detected.tipo.includes("balance"))) return false;
                            if (catFilter === "Plan de Siembra" && (!detected || !detected.tipo.includes("plan_siembra"))) return false;
                            if (catFilter === "Liquidación" && (!detected || (!detected.tipo.includes("liquidacion_granos") && !detected.tipo.includes("liquidacion_hacienda")))) return false;
                            if (catFilter === "Otro" && detected && detected.tipo !== "otro") return false;
                          }
                          return true;
                        });
                        return filteredDocs.map((doc, i) => {
                          const colors = typeColor[doc.type];
                          const detected = analysisResult?.documentos_detectados?.find(
                            d => d.nombre_archivo === doc.name
                          );
                          return (
                            <tr
                              key={doc.id}
                              style={{ borderTop: i > 0 ? "1px solid #F0EDE6" : undefined }}
                            >
                              <td className="px-5 py-3">
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                  <span className="font-medium" style={{ color: "#1A1A1A" }}>
                                    {doc.name}
                                  </span>
                                  {detected && (
                                    <span
                                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded w-fit"
                                      style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}
                                    >
                                      {detected.tipo.replace(/_/g, " ")}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className="text-[11px] font-semibold px-2 py-0.5 rounded"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {doc.type}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className="text-xs" style={{ color: "#6B6560" }}>
                                  {formatSize(doc.size)}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className="text-xs" style={{ color: "#6B6560" }}>
                                  {formatDate(doc.date)}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className="text-[11px] font-semibold px-2 py-0.5 rounded"
                                  style={{ backgroundColor: "#E6F4EA", color: "#1E7E34" }}
                                >
                                  Cargado
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                {(() => {
                                  const f = fileStore.find((x) => x.name === doc.name);
                                  if (!f) return null;
                                  return (
                                    <button
                                      onClick={() => setPreviewFile(f)}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer hover:bg-gray-50 transition-colors"
                                      style={{ borderColor: "#D6D1C8", color: "#1A1A1A" }}
                                    >
                                      <Eye size={12} /> Ver
                                    </button>
                                  );
                                })()}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {modalOpen && (
        <UploadModal onClose={() => setModalOpen(false)} onConfirm={handleConfirm} />
      )}

      {previewFile && (
        <DocPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  );
}
