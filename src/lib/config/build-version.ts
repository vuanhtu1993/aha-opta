/**
 * @file build-version.ts
 * @description Single Source of Truth (SSOT) cho thông tin phiên bản build.
 *
 * TẠI SAO CẦN FILE NÀY? (The "Why"):
 * Trước đây, phiên bản ứng dụng bị hard-code ("v1.0") ở nhiều nơi (Header, Profile).
 * Mỗi lần deploy build mới, tester không biết đang chạy phiên bản nào.
 *
 * Giờ đây, `next.config.ts` tự động inject git hash + version + date vào env vars
 * tại build-time. File này đọc env vars đó và cung cấp các format sẵn cho UI.
 *
 * CÁCH HOẠT ĐỘNG:
 * - `next build` → `next.config.ts` chạy `git rev-parse --short HEAD` → inject vào NEXT_PUBLIC_*
 * - File này đọc NEXT_PUBLIC_* → export object `buildVersion` với các format sẵn
 * - UI components import `buildVersion.compact` hoặc `buildVersion.full` để hiển thị
 *
 * Made by Anh Tu - Share to be share
 */

export const buildVersion = {
  /** Semantic version từ package.json (VD: "0.1.0") */
  version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",

  /** Git short hash 7 ký tự (VD: "837f610") */
  hash: process.env.NEXT_PUBLIC_BUILD_HASH || "dev",

  /** ISO timestamp khi build chạy (VD: "2026-08-22T15:20:00.000Z") */
  date: process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString(),

  /**
   * Format ngắn gọn cho Header Badge (Dùng 3 ký tự cuối của hash)
   * VD: "v1.0-610"
   */
  get compact(): string {
    const shortHash = this.hash.length > 3 ? this.hash.slice(-3) : this.hash;
    return `v${this.version}-${shortHash}`;
  },

  /**
   * Format đầy đủ cho trang Profile
   * VD: "v0.1.0 · Build 837f610 · 22/08/2026, 15:20"
   */
  get full(): string {
    const d = new Date(this.date);
    const dateStr = d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `v${this.version} · Build ${this.hash} · ${dateStr}`;
  },
};
