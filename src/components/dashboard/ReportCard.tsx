"use client";

import { LucideIcon, Loader2 } from "lucide-react";

type ReportCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  enabled?: boolean;
  loading?: boolean;
  onGenerate?: () => void;
};

export default function ReportCard({
  title,
  description,
  icon: Icon,
  enabled = false,
  loading = false,
  onGenerate,
}: ReportCardProps) {
  const canClick = enabled && !loading && !!onGenerate;

  return (
    <div
      className="bg-white rounded-xl p-5 flex flex-col gap-3 border transition-shadow"
      style={{
        borderColor: "#E8E5DE",
        boxShadow: loading ? "0 0 0 2px #3D7A1C44" : undefined,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: "#EBF3E8" }}
      >
        <Icon size={18} style={{ color: "#3D7A1C" }} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm mb-1" style={{ color: "#1A1A1A" }}>
          {title}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: "#9B9488" }}>
          {description}
        </p>
      </div>
      <button
        disabled={!canClick}
        onClick={canClick ? onGenerate : undefined}
        className="mt-1 w-full py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5"
        style={
          loading
            ? {
                borderColor: "#3D7A1C",
                color: "#3D7A1C",
                backgroundColor: "#EBF3E8",
                cursor: "wait",
              }
            : enabled
            ? {
                borderColor: "#3D7A1C",
                color: "#ffffff",
                backgroundColor: "#3D7A1C",
                cursor: onGenerate ? "pointer" : "default",
              }
            : {
                borderColor: "#D6D1C8",
                color: "#B0A99F",
                backgroundColor: "#F4F2EE",
                cursor: "not-allowed",
              }
        }
        onMouseEnter={(e) => {
          if (canClick) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2F6016";
        }}
        onMouseLeave={(e) => {
          if (canClick) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3D7A1C";
        }}
      >
        {loading ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            Generando…
          </>
        ) : (
          "Generar"
        )}
      </button>
    </div>
  );
}
