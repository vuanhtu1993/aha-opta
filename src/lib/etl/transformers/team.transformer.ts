/**
 * Team Transformer (ETL Phase 2)
 *
 * Nhiệm vụ: Chuyển đổi dữ liệu raw từ API-Football thành dạng chuẩn của Mongoose Team schema.
 */

import { ApiFootballTeam } from "../../services/football-api/teams.service";

/**
 * Normalizer: Tạo URL-friendly slug từ tên đội bóng.
 * Ví dụ: "Costa Rica" → "costa-rica", "Côte d'Ivoire" → "cote-divoire"
 */
export function generateTeamSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD") // Tách dấu ra khỏi chữ
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
    .replace(/[']/g, "") // Xóa apostrophe (e.g. d'Ivoire -> divoire)
    .replace(/[^a-z0-9]+/g, "-") // Thay khoảng trắng và ký tự đặc biệt bằng gạch nối
    .replace(/^-+|-+$/g, ""); // Xóa gạch nối ở đầu/cuối
}

/**
 * Tạm thời map confederation dựa trên country.
 * Trong thực tế, có thể cần 1 dictionary mapping nếu API không cung cấp thẳng.
 * API-Football free tier đôi khi không có confederation info trong endpoint teams.
 */
function determineConfederation(country: string): "UEFA" | "CONMEBOL" | "AFC" | "CAF" | "CONCACAF" | "OFC" {
  // Mock logic: Mapping đơn giản một số nước lớn (có thể mở rộng sau)
  const conmebol = ["Brazil", "Argentina", "Uruguay", "Colombia", "Chile", "Ecuador"];
  const concacaf = ["USA", "Mexico", "Canada", "Costa Rica"];
  const afc = ["Japan", "South Korea", "Iran", "Saudi Arabia", "Australia"]; // Australia đá AFC
  const caf = ["Senegal", "Morocco", "Egypt", "Nigeria", "Cameroon"];
  const ofc = ["New Zealand"];
  
  if (conmebol.includes(country)) return "CONMEBOL";
  if (concacaf.includes(country)) return "CONCACAF";
  if (afc.includes(country)) return "AFC";
  if (caf.includes(country)) return "CAF";
  if (ofc.includes(country)) return "OFC";
  
  return "UEFA"; // Default fallback (vì châu Âu đông nhất)
}

/**
 * Transform data từ API-Football sang payload sẵn sàng lưu vào MongoDB (upsert).
 * Các thông tin như "group" sẽ được cập nhật sau khi có lễ bốc thăm,
 * hiện tại để placeholder "TBD".
 */
export function transformApiTeamToMongoPayload(
  apiData: ApiFootballTeam,
  fifaRankings: Record<number, number>
) {
  const { team } = apiData;

  return {
    apiFootballId: team.id,
    name: team.name,
    shortName: team.code || team.name.substring(0, 3).toUpperCase(),
    slug: generateTeamSlug(team.name),
    country: team.country,
    flag: team.logo, // Dùng logo của API-Football
    group: "TBD", // Sẽ update khi vòng bảng bắt đầu
    confederation: determineConfederation(team.country),
    fifaRanking: fifaRankings[team.id] || 999, // Fallback nếu không có ranking
    // Không override `stats` nếu update (để update strategy handle)
    lastUpdated: new Date(),
  };
}
