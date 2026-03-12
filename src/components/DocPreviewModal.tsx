"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import * as XLSX from "xlsx";

interface DocPreviewModalProps {
  file: File;
  onClose: () => void;
}

export default function DocPreviewModal({ file, onClose }: DocPreviewModalProps) {
  const [blobUrl,   setBlobUrl]   = useState<string | null>(null);
  const [xlsxRows, setXlsxRows]  = useState<string[][]>([]);
  const [csvRows,  setCsvRows]   = useState<string[][]>([]);

  const name = file.name.toLowerCase();
  const isPdf   = name.endsWith(".pdf");
  const isImage = name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp");
  const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");
  const isCsv   = name.endsWith(".csv");

  useEffect(() => {
    if (isPdf || isImage) {
      const url = URL.createObjectURL(file);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];
        setXlsxRows(rows.slice(0, 20));
      };
      reader.readAsArrayBuffer(file);
    }
    if (isCsv) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target!.result as string;
        const rows = text.split("\n").slice(0, 20).map((line) => line.split(","));
        setCsvRows(rows);
      };
      reader.readAsText(file, "utf-8");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const tableRows = isExcel ? xlsxRows : isCsv ? csvRows : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col w-full"
        style={{ maxWidth: 960, maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "#E8E5DE" }}
        >
          <p className="text-sm font-semibold truncate" style={{ color: "#1A1A1A" }}>
            {file.name}
          </p>
          <button onClick={onClose} className="ml-4 cursor-pointer hover:opacity-70 shrink-0">
            <X size={20} style={{ color: "#9B9488" }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isPdf && blobUrl && (
            <iframe
              src={blobUrl}
              className="w-full"
              style={{ height: "75vh", border: "none" }}
              title={file.name}
            />
          )}
          {isImage && blobUrl && (
            <div className="flex items-center justify-center p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blobUrl}
                alt={file.name}
                className="max-w-full rounded-lg object-contain"
                style={{ maxHeight: "72vh" }}
              />
            </div>
          )}
          {(isExcel || isCsv) && tableRows.length > 0 && (
            <div className="overflow-auto p-4">
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {tableRows.map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i === 0 ? "#F5FAF3" : i % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="px-3 py-1.5 border whitespace-nowrap"
                          style={{
                            borderColor: "#E8E5DE",
                            fontWeight: i === 0 ? 600 : 400,
                            color: "#1A1A1A",
                          }}
                        >
                          {String(cell ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[10px]" style={{ color: "#9B9488" }}>
                Primeras 20 filas · hoja 1
              </p>
            </div>
          )}
          {!isPdf && !isImage && tableRows.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm" style={{ color: "#9B9488" }}>
                Cargando vista previa…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
