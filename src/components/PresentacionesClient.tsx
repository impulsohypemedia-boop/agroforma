"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  MonitorPlay, Upload, CloudUpload, Trash2, Eye, Sparkles, X, FileText,
  Info,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";
import { Presentacion, PresentacionTipo } from "@/types/presentacion";
import { uploadFile } from "@/lib/supabase/storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function inferTipo(_name: string): PresentacionTipo {
  return "pdf";
}

function formatSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Type icon ────────────────────────────────────────────────────────────────
function TipoIcon({ tipo }: { tipo: PresentacionTipo }) {
  const configs: Record<PresentacionTipo, { label: string; bg: string; color: string }> = {
    pdf:  { label: "PDF",  bg: "#FEE2E2", color: "#DC2626" },
    pptx: { label: "PPT",  bg: "#FEF3C7", color: "#D97706" },
    ppt:  { label: "PPT",  bg: "#FEF3C7", color: "#D97706" },
    docx: { label: "DOC",  bg: "#DBEAFE", color: "#2563EB" },
    otro: { label: "DOC",  bg: "#F3F4F6", color: "#6B7280" },
  };
  const c = configs[tipo];
  return (
    <div
      style={{
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: c.bg, color: c.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 800, letterSpacing: 0.5, flexShrink: 0,
      }}
    >
      {c.label}
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({
  presentacion,
  blobFile,
  onClose,
}: {
  presentacion: Presentacion;
  blobFile: File | null;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (blobFile && presentacion.tipo === "pdf") {
      const url = URL.createObjectURL(blobFile);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [blobFile, presentacion.tipo]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF", borderRadius: 20,
          width: "90%", maxWidth: 900, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px", borderBottom: "1px solid #E8E5DE",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TipoIcon tipo={presentacion.tipo} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: "#1A1A1A" }}>{presentacion.nombre}</p>
              <p style={{ fontSize: 11, color: "#9B9488" }}>{formatSize(presentacion.size)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid #E8E5DE",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", backgroundColor: "#FAFAF8",
            }}
          >
            <X size={16} color="#9B9488" />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {presentacion.tipo === "pdf" && blobUrl ? (
            <iframe
              src={blobUrl}
              style={{ width: "100%", height: "100%", border: "none", minHeight: 500 }}
              title={presentacion.nombre}
            />
          ) : (
            <div style={{ padding: 24, overflow: "auto", maxHeight: "70vh" }}>
              {presentacion.analisis ? (
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "#1A3311", marginBottom: 12 }}>
                    Análisis del documento
                  </p>
                  <div
                    style={{
                      backgroundColor: "#F7FBF5", border: "1px solid #D4E9CC",
                      borderRadius: 12, padding: 16,
                      fontSize: 13, lineHeight: 1.7, color: "#2D2D2D",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {presentacion.analisis}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#9B9488" }}>
                  <FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p style={{ fontSize: 13 }}>
                    La previsualización no está disponible para este tipo de archivo.
                    Analizá el documento para ver su contenido.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PresentacionesClient() {
  const {
    presentaciones,
    setPresentaciones,
    presentacionBlobMap,
    setPresentacionBlobMap,
    empresaActivaId,
  } = useAppContext();

  const [dragging,   setDragging]   = useState(false);
  const [analyzing,  setAnalyzing]  = useState<string | null>(null); // presentacion id being analyzed
  const [preview,    setPreview]    = useState<Presentacion | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const accepted = files.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (accepted.length === 0) {
      setError("Solo se aceptan archivos PDF.");
      return;
    }
    setError(null);

    const newPresentaciones: Presentacion[] = [];
    const newBlobs: Record<string, File> = {};

    for (const file of accepted) {
      const id = `pres_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      newPresentaciones.push({
        id,
        nombre: file.name,
        tipo: inferTipo(file.name),
        size: file.size,
        fecha: new Date().toISOString(),
      });
      newBlobs[id] = file;
    }

    setPresentaciones((prev) => [...prev, ...newPresentaciones]);
    setPresentacionBlobMap((prev) => ({ ...prev, ...newBlobs }));
  }, [setPresentaciones, setPresentacionBlobMap]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleAnalizar = async (p: Presentacion) => {
    const blob = presentacionBlobMap[p.id];
    if (!blob) {
      setError("El archivo no está disponible en memoria. Volvé a subir el documento.");
      return;
    }
    setAnalyzing(p.id);
    setError(null);

    try {
      // Upload to Supabase Storage first
      const eId = empresaActivaId ?? "sin-empresa";
      const { signedUrl, path } = await uploadFile(eId, blob);

      const res = await fetch("/api/presentaciones/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: p.nombre, url: signedUrl }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Error al analizar");

      const resumen: string = json.data?.resumen ?? "";
      setPresentaciones((prev) =>
        prev.map((item) =>
          item.id === p.id
            ? { ...item, analisis: resumen, analisisAt: new Date().toISOString(), storage_path: path }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar el documento");
    } finally {
      setAnalyzing(null);
    }
  };

  const handleEliminar = (id: string) => {
    setPresentaciones((prev) => prev.filter((p) => p.id !== id));
    setPresentacionBlobMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleVer = (p: Presentacion) => {
    setPreview(p);
  };

  const analyzedCount = presentaciones.filter((p) => p.analisis).length;

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header
            className="shrink-0 flex items-center justify-between px-8 py-5 border-b bg-white/80 backdrop-blur-sm"
            style={{ borderColor: "#E8E5DE" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42, height: 42, borderRadius: 12,
                  backgroundColor: "#1A3311",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <MonitorPlay size={20} color="#D4AD3C" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>
                  Presentaciones
                </h1>
                <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
                  Contexto adicional para el asistente
                </p>
              </div>
            </div>

            {analyzedCount > 0 && (
              <span
                style={{
                  fontSize: 12, fontWeight: 600,
                  backgroundColor: "#EBF5E6", color: "#3D7A1C",
                  padding: "6px 14px", borderRadius: 20,
                }}
              >
                {analyzedCount} analizado{analyzedCount !== 1 ? "s" : ""}
              </span>
            )}
          </header>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div style={{ maxWidth: 800, margin: "0 auto" }}>

              {/* Chat integration banner */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  backgroundColor: "#F0F7EC", border: "1px solid #C6E0B8",
                  borderRadius: 12, padding: "10px 16px", marginBottom: 24,
                }}
              >
                <Info size={15} style={{ color: "#3D7A1C", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "#3D7A1C", margin: 0 }}>
                  Los documentos analizados se incluyen como contexto en el Asistente
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2", border: "1px solid #FECACA",
                    borderRadius: 12, padding: "10px 16px", marginBottom: 20,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <p style={{ fontSize: 12, color: "#DC2626" }}>{error}</p>
                  <button onClick={() => setError(null)} style={{ cursor: "pointer", color: "#DC2626", background: "none", border: "none" }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Upload zone */}
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? "#3D7A1C" : "#D6D1C8"}`,
                  borderRadius: 16,
                  padding: "40px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: dragging ? "#F0F7EC" : "#FFFFFF",
                  transition: "all 0.2s",
                  marginBottom: 32,
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  style={{ display: "none" }}
                  onChange={handleInputChange}
                />
                <div
                  style={{
                    width: 56, height: 56, borderRadius: 14,
                    backgroundColor: dragging ? "#3D7A1C" : "#F3F4F6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                    transition: "all 0.2s",
                  }}
                >
                  <CloudUpload size={26} color={dragging ? "#FFFFFF" : "#9B9488"} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>
                  {dragging ? "Soltá los archivos aquí" : "Arrastrá archivos o hacé clic para subir"}
                </p>
                <p style={{ fontSize: 12, color: "#9B9488", maxWidth: 460, margin: "0 auto" }}>
                  Subí presentaciones e informes en formato PDF. Si tenés archivos PowerPoint, guardalos como PDF antes de subirlos.
                </p>
              </div>

              {/* File list */}
              {presentaciones.length === 0 ? (
                <div
                  style={{
                    textAlign: "center", padding: "48px 24px",
                    backgroundColor: "#FFFFFF", borderRadius: 16,
                    border: "1px solid #E8E5DE",
                  }}
                >
                  <MonitorPlay size={40} style={{ color: "#D6D1C8", margin: "0 auto 16px" }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>
                    Sin documentos todavía
                  </p>
                  <p style={{ fontSize: 13, color: "#9B9488", maxWidth: 420, margin: "0 auto" }}>
                    Subí presentaciones, informes de asesores, estudios y cualquier documento que sume contexto.
                    El asistente los usa para responder mejor.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {presentaciones.map((p) => {
                    const isAnalyzing = analyzing === p.id;
                    const blobAvailable = !!presentacionBlobMap[p.id];

                    return (
                      <div
                        key={p.id}
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E8E5DE",
                          borderRadius: 16,
                          overflow: "hidden",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        }}
                      >
                        {/* Card header */}
                        <div
                          style={{
                            display: "flex", alignItems: "center", gap: 14,
                            padding: "16px 20px",
                          }}
                        >
                          <TipoIcon tipo={p.tipo} />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontWeight: 600, fontSize: 13, color: "#1A1A1A",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}
                            >
                              {p.nombre}
                            </p>
                            <p style={{ fontSize: 11, color: "#9B9488", marginTop: 2 }}>
                              {formatSize(p.size)} · {formatDate(p.fecha)}
                              {!blobAvailable && (
                                <span style={{ color: "#F59E0B", marginLeft: 8 }}>
                                  · Archivo no disponible (solo metadata)
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            {!p.analisis && (
                              <button
                                onClick={() => handleAnalizar(p)}
                                disabled={isAnalyzing || !blobAvailable}
                                style={{
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "6px 12px", borderRadius: 8,
                                  border: "1px solid #3D7A1C",
                                  backgroundColor: isAnalyzing ? "#EBF5E6" : "#3D7A1C",
                                  color: isAnalyzing ? "#3D7A1C" : "#FFFFFF",
                                  fontSize: 11, fontWeight: 600,
                                  cursor: isAnalyzing || !blobAvailable ? "not-allowed" : "pointer",
                                  opacity: !blobAvailable ? 0.5 : 1,
                                }}
                              >
                                <Sparkles size={12} />
                                {isAnalyzing ? "Analizando…" : "Analizar"}
                              </button>
                            )}

                            {p.analisis && (
                              <span
                                style={{
                                  display: "flex", alignItems: "center", gap: 4,
                                  fontSize: 11, fontWeight: 600,
                                  color: "#3D7A1C", backgroundColor: "#EBF5E6",
                                  padding: "6px 12px", borderRadius: 8,
                                }}
                              >
                                <Sparkles size={11} />
                                Analizado
                              </span>
                            )}

                            <button
                              onClick={() => handleVer(p)}
                              style={{
                                display: "flex", alignItems: "center", gap: 5,
                                padding: "6px 12px", borderRadius: 8,
                                border: "1px solid #D6D1C8",
                                backgroundColor: "#FAFAF8", color: "#6B7280",
                                fontSize: 11, fontWeight: 600, cursor: "pointer",
                              }}
                            >
                              <Eye size={12} />
                              Ver
                            </button>

                            <button
                              onClick={() => handleEliminar(p.id)}
                              style={{
                                display: "flex", alignItems: "center", gap: 5,
                                padding: "6px 10px", borderRadius: 8,
                                border: "1px solid #FECACA",
                                backgroundColor: "#FEF2F2", color: "#DC2626",
                                fontSize: 11, fontWeight: 600, cursor: "pointer",
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Loading state */}
                        {isAnalyzing && (
                          <div
                            style={{
                              padding: "12px 20px",
                              borderTop: "1px solid #F0EDE6",
                              backgroundColor: "#FAFAF8",
                              display: "flex", alignItems: "center", gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 16, height: 16, borderRadius: "50%",
                                border: "2px solid #3D7A1C", borderTopColor: "transparent",
                                animation: "spin 0.8s linear infinite",
                              }}
                            />
                            <p style={{ fontSize: 12, color: "#3D7A1C" }}>
                              Analizando documento con IA…
                            </p>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                          </div>
                        )}

                        {/* Analysis result */}
                        {p.analisis && !isAnalyzing && (
                          <div
                            style={{
                              padding: "16px 20px",
                              borderTop: "1px solid #E8F2E2",
                              backgroundColor: "#F7FBF5",
                            }}
                          >
                            <div
                              style={{
                                display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                              }}
                            >
                              <Sparkles size={13} color="#3D7A1C" />
                              <p style={{ fontSize: 11, fontWeight: 700, color: "#3D7A1C" }}>
                                Análisis IA
                                {p.analisisAt && (
                                  <span style={{ fontWeight: 400, color: "#9B9488", marginLeft: 8 }}>
                                    · {formatDate(p.analisisAt)}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div
                              style={{
                                fontSize: 12, lineHeight: 1.7, color: "#2D2D2D",
                                whiteSpace: "pre-wrap",
                                maxHeight: 220, overflow: "auto",
                              }}
                            >
                              {p.analisis}
                            </div>
                            <button
                              onClick={() => handleAnalizar(p)}
                              disabled={isAnalyzing || !blobAvailable}
                              style={{
                                marginTop: 10,
                                fontSize: 10, fontWeight: 600,
                                color: "#9B9488", background: "none",
                                border: "1px solid #E8E5DE",
                                borderRadius: 6, padding: "3px 8px",
                                cursor: blobAvailable ? "pointer" : "not-allowed",
                                opacity: blobAvailable ? 1 : 0.5,
                              }}
                            >
                              Volver a analizar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          presentacion={preview}
          blobFile={presentacionBlobMap[preview.id] ?? null}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
