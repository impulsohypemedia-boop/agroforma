"use client";

import { useRef, useState, useCallback } from "react";
import { X, Upload, FileText, Trash2, AlertCircle } from "lucide-react";
import { DocType, UploadedDoc } from "@/types/document";

const ACCEPTED_TYPES: Record<string, DocType> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
  "text/csv": "CSV",
  "application/csv": "CSV",
};

const ACCEPTED_EXTENSIONS = [".pdf", ".xlsx", ".xls", ".csv"];

function getDocType(file: File): DocType | null {
  const byMime = ACCEPTED_TYPES[file.type];
  if (byMime) return byMime;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "xlsx") return "XLSX";
  if (ext === "xls") return "XLS";
  if (ext === "csv") return "CSV";
  return null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type StagedFile = {
  id: string;
  file: File;
  type: DocType;
};

type Props = {
  onClose: () => void;
  onConfirm: (docs: UploadedDoc[], files: File[]) => void;
};

export default function UploadModal({ onClose, onConfirm }: Props) {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid: StagedFile[] = [];
    const invalid: string[] = [];

    for (const file of arr) {
      const type = getDocType(file);
      if (!type) {
        invalid.push(file.name);
        continue;
      }
      // avoid duplicates by name
      setStaged((prev) => {
        if (prev.some((s) => s.file.name === file.name)) return prev;
        return [...prev, { id: crypto.randomUUID(), file, type }];
      });
      valid.push({ id: crypto.randomUUID(), file, type });
    }

    if (invalid.length > 0) {
      setError(`Formato no soportado: ${invalid.join(", ")}. Solo PDF, XLSX, XLS, CSV.`);
    } else {
      setError(null);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const removeFile = (id: string) => {
    setStaged((prev) => prev.filter((s) => s.id !== id));
  };

  const handleConfirm = () => {
    if (staged.length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    const docs: UploadedDoc[] = staged.map((s) => ({
      id: s.id,
      name: s.file.name,
      type: s.type,
      size: s.file.size,
      date: today,
      status: "Cargado",
    }));
    onConfirm(docs, staged.map((s) => s.file));
  };

  const typeColor: Record<DocType, { bg: string; text: string }> = {
    PDF:  { bg: "#FEE9E9", text: "#C0392B" },
    XLSX: { bg: "#E6F4EA", text: "#1E7E34" },
    XLS:  { bg: "#E6F4EA", text: "#1E7E34" },
    CSV:  { bg: "#EAF1FB", text: "#1A5CA0" },
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,20,5,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b shrink-0"
          style={{ borderColor: "#E8E5DE" }}
        >
          <h2 className="font-semibold text-base" style={{ color: "#1A1A1A" }}>
            Subir documentos
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} style={{ color: "#6B6560" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-colors"
            style={{
              borderColor: dragging ? "#3D7A1C" : "#D6D1C8",
              backgroundColor: dragging ? "#EBF3E8" : "#FAFAF8",
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: dragging ? "#C8E6C0" : "#EBF3E8" }}
            >
              <Upload size={20} style={{ color: "#3D7A1C" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                Arrastrá tus archivos acá o{" "}
                <span style={{ color: "#3D7A1C" }}>hacé click para seleccionar</span>
              </p>
              <p className="text-xs mt-1" style={{ color: "#9B9488" }}>
                PDF, XLSX, XLS, CSV — múltiples archivos permitidos
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS.join(",")}
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
              style={{ backgroundColor: "#FEE9E9", color: "#C0392B" }}
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Staged files */}
          {staged.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B9488" }}>
                {staged.length} archivo{staged.length !== 1 ? "s" : ""} seleccionado{staged.length !== 1 ? "s" : ""}
              </p>
              {staged.map((s) => {
                const colors = typeColor[s.type];
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 border"
                    style={{ borderColor: "#E8E5DE", backgroundColor: "#FAFAF8" }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: colors.bg }}
                    >
                      <FileText size={14} style={{ color: colors.text }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "#1A1A1A" }}>
                        {s.file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {s.type}
                        </span>
                        <span className="text-[11px]" style={{ color: "#9B9488" }}>
                          {formatSize(s.file.size)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(s.id)}
                      className="p-1 rounded-md transition-colors hover:bg-red-50 cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} style={{ color: "#C0392B" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0"
          style={{ borderColor: "#E8E5DE" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 cursor-pointer"
            style={{ color: "#6B6560" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={staged.length === 0}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity cursor-pointer"
            style={{
              backgroundColor: staged.length > 0 ? "#3D7A1C" : "#A8C5A0",
              cursor: staged.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            Cargar {staged.length > 0 ? `${staged.length} documento${staged.length !== 1 ? "s" : ""}` : "documentos"}
          </button>
        </div>
      </div>
    </div>
  );
}
