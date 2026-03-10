import { Eye, Download } from "lucide-react";
import { GeneratedReport } from "@/types/report";

type Props = {
  reports: GeneratedReport[];
  onView: (report: GeneratedReport) => void;
  onDownload: (report: GeneratedReport) => void;
};

export default function GeneratedReportsSection({ reports, onView, onDownload }: Props) {
  if (reports.length === 0) return null;

  return (
    <section>
      <h2
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: "#9B9488" }}
      >
        Reportes generados
      </h2>
      <div
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: "#E8E5DE" }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "#E8E5DE" }}
        >
          <span className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>
            Historial de reportes
          </span>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}
          >
            {reports.length} reporte{reports.length !== 1 ? "s" : ""}
          </span>
        </div>

        <ul className="divide-y" style={{ borderColor: "#F0EDE6" }}>
          {[...reports].reverse().map((report) => {
            const date = new Date(report.generatedAt).toLocaleDateString("es-AR", {
              day: "2-digit", month: "2-digit", year: "numeric",
            });
            const time = new Date(report.generatedAt).toLocaleTimeString("es-AR", {
              hour: "2-digit", minute: "2-digit",
            });

            return (
              <li
                key={report.id}
                className="flex items-center gap-4 px-5 py-4"
              >
                {/* Status dot */}
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: "#3D7A1C" }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: "#1A1A1A" }}>
                    {report.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
                    {report.data?.empresa ?? "—"} · {date} a las {time}
                  </p>
                </div>

                {/* Badge */}
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded shrink-0"
                  style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}
                >
                  Listo
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onView(report)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer hover:bg-gray-50"
                    style={{ borderColor: "#D6D1C8", color: "#1A1A1A" }}
                  >
                    <Eye size={13} />
                    Ver
                  </button>
                  <button
                    onClick={() => onDownload(report)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: "#3D7A1C" }}
                  >
                    <Download size={13} />
                    Descargar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
