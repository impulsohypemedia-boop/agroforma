import { UploadedDoc, DocType } from "@/types/document";

type Props = {
  documents: UploadedDoc[];
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

const typeColor: Record<DocType, { bg: string; text: string }> = {
  PDF:  { bg: "#FEE9E9", text: "#C0392B" },
  XLSX: { bg: "#E6F4EA", text: "#1E7E34" },
  XLS:  { bg: "#E6F4EA", text: "#1E7E34" },
  CSV:  { bg: "#EAF1FB", text: "#1A5CA0" },
};

export default function DocumentsTable({ documents }: Props) {
  return (
    <div
      className="bg-white rounded-xl border overflow-hidden"
      style={{ borderColor: "#E8E5DE" }}
    >
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "#E8E5DE" }}
      >
        <h2 className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>
          Documentos recientes
        </h2>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ backgroundColor: "#F4F2EE", color: "#9B9488" }}
        >
          {documents.length} archivo{documents.length !== 1 ? "s" : ""}
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "#FAFAF8" }}>
            {["Nombre", "Tipo", "Tamaño", "Fecha", "Estado"].map((col) => (
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
          {documents.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">📄</span>
                  <p className="font-medium text-sm" style={{ color: "#6B6560" }}>
                    No hay documentos cargados
                  </p>
                  <p className="text-xs" style={{ color: "#B0A99F" }}>
                    Subí un documento para comenzar
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            documents.map((doc, i) => {
              const colors = typeColor[doc.type];
              return (
                <tr
                  key={doc.id}
                  style={{
                    borderTop: i > 0 ? "1px solid #F0EDE6" : undefined,
                  }}
                >
                  <td className="px-5 py-3">
                    <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                      {doc.name}
                    </span>
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
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
