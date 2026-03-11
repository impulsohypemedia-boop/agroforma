import { NextRequest, NextResponse } from "next/server";
import { generateBreakEvenExcel } from "@/lib/excel/break-even";

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    const buffer = await generateBreakEvenExcel(data);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="break-even.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Error en /api/reportes/break-even/download:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}
