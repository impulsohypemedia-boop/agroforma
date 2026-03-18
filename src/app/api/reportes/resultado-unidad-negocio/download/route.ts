import { NextRequest, NextResponse } from "next/server";
import { generateExcel } from "@/lib/excel/resultado-unidad-negocio";

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    const buffer = await generateExcel(data);

    return new NextResponse(buffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="resultado-unidad-negocio-${(data.empresa ?? "empresa").replace(/[^a-zA-Z0-9]/g, "-")}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Error en /api/reportes/resultado-unidad-negocio/download:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
