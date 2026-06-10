import { connectDB } from "@/lib/db/mongoose";
import { Team } from "@/lib/db/models/Team";
import { TeamList } from "../components/TeamList";
import { Trophy, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đội bóng & Xếp hạng Elo WC 2026 | aha-opta",
  description: "Danh sách 48 đội bóng tham gia World Cup 2026 kèm điểm số Elo, xếp hạng FIFA, liên đoàn khu vực và bảng đấu.",
};

export default async function TeamsPage() {
  await connectDB();
  
  // Nạp danh sách đội bóng (chỉ chọn các trường cần hiển thị để tối ưu hóa hiệu suất và tránh lỗi tuần tự hóa)
  const teamsDocs = await Team.find({})
    .select("_id name shortName slug flag group confederation eloRating eloRank fifaRanking eloLastSynced lastUpdated createdAt updatedAt")
    .sort({ eloRating: -1 })
    .lean();
  
  // Chuyển đổi dữ liệu sang dạng plain object để truyền sang Client Component an toàn
  const teams = teamsDocs.map((doc: any) => ({
    ...doc,
    _id: doc._id.toString(),
    eloLastSynced: doc.eloLastSynced ? doc.eloLastSynced.toISOString() : null,
    lastUpdated: doc.lastUpdated ? doc.lastUpdated.toISOString() : null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3B5BDB] flex items-center justify-center shadow-lg shadow-[#3B5BDB]/20 border border-white/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#121C42] tracking-tight">Đội tuyển & Xếp hạng</h1>
            <p className="text-[#121C42]/60 text-sm mt-1 font-medium">
              Bảng xếp hạng hệ số Elo thực tế của 48 đội bóng tranh tài tại FIFA World Cup 2026.
            </p>
          </div>
        </div>
      </div>

      {/* Main List Area */}
      {teams.length > 0 ? (
        <TeamList teams={teams} />
      ) : (
        <div className="border border-dashed border-[#121C42]/20 rounded-3xl p-12 text-center bg-white shadow-sm space-y-6 max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center mx-auto text-[#121C42]/40 border border-[#121C42]/10">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[#121C42]">Chưa có dữ liệu đội tuyển</h3>
            <p className="text-[#121C42]/60 text-sm leading-relaxed">
              Cơ sở dữ liệu MongoDB hiện đang trống. Vui lòng truy cập trang quản trị dữ liệu (Data Pipeline) 
              để khởi tạo dữ liệu WC 2026 tĩnh và đồng bộ điểm xếp hạng Elo trực tuyến.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/apps/opta/sync"
              className="inline-flex items-center gap-2 bg-[#3B5BDB] hover:bg-[#264de4] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[#3B5BDB]/20"
            >
              Đi tới Data Pipeline
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
