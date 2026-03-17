import { NextRequest, NextResponse } from "next/server";
import { downloadFromStorage } from "@/lib/download";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
};

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    if (!path || typeof path !== "string" || path.includes("..")) {
      return NextResponse.json({ error: "Path inválido" }, { status: 400 });
    }

    const buffer = await downloadFromStorage(path);
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME[ext] ?? "application/octet-stream";
    const filename = path.split("/").pop() ?? "archivo";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("Error en /api/storage/download:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al descargar" },
      { status: 500 }
    );
  }
}
