import { NextRequest, NextResponse } from "next/server";
import { seedWorldCup2026 } from "@/lib/etl/wc2026-seeder";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "manual-2026") {
      const result = await seedWorldCup2026();
      return NextResponse.json({
        success: true,
        message: `Khởi tạo thành công ${result.teamsCount} đội và ${result.matchesCount} trận đấu.`,
        results: result
      });
    }

    // Nếu type khác (teams, matches), trả về lỗi vì các chức năng này đã bị deprecate
    // (hoặc nếu sau này có logic khác thì thêm vào đây)
    return NextResponse.json(
      { success: false, error: "Chức năng này đã bị vô hiệu hóa." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] POST /api/opta/sync error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
