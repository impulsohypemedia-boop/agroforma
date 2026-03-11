import { NextRequest, NextResponse } from "next/server";
import { generateEvolucionHistoricaExcel } from "@/lib/excel/evolucion-historica";

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    const buffer = await generateEvolucionHistoricaExcel(data);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="evolucion-historica.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
