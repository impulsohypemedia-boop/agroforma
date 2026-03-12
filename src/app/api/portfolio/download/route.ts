import { NextRequest, NextResponse } from "next/server";
import { generatePortfolioExcel } from "@/lib/excel/portfolio";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const buffer = await generatePortfolioExcel(body);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="portfolio-agroforma-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
