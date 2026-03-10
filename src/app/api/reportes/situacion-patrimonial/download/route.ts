import { NextRequest, NextResponse } from "next/server";
import { generateExcel } from "@/lib/excel/situacion-patrimonial";

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data) {
      return NextResponse.json({ error: "No se recibió data del reporte" }, { status: 400 });
    }

    const buffer = await generateExcel(data);
    const empresa = (data.empresa as string)
      ?.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ]/g, "-")
      .slice(0, 40) ?? "empresa";

    return new NextResponse(buffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="situacion-patrimonial-${empresa}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Error en /download:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error generando Excel" },
      { status: 500 }
    );
  }
}
