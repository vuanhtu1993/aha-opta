/**
 * @file brand.ts
 * @description Single Source of Truth (SSOT) cho toàn bộ hệ thống nhận diện thương hiệu của Aha-Mind.
 *
 * TẠI SAO CẦN FILE NÀY? (The "Why"):
 * Trước đây, các thông tin thương hiệu (Tên app, Theme Color, Domain URL, Logo path)
 * bị rải rác dưới dạng các magic strings ở nhiều file: layout.tsx, manifest.ts, sitemap.ts, robots.ts, sw.js...
 * File này đóng vai trò là "Nguồn chân lý duy nhất" (SSOT), giúp quản lý tập trung,
 * tăng tính nhất quán và dễ dàng bảo trì khi có sự thay đổi về bộ nhận diện.
 *
 * Made by Anh Tu - Share to be share
 */

export const brand = {
  /**
   * 1. Định danh cốt lõi (Identity)
   */
  identity: {
    name: "Aha-Mind",
    shortName: "Aha-Mind",
    fullName: "AHA-MIND — AI Learning Tools",
    tagline: "AI Story Shadowing & Micro-Apps",
    publisherName: "Anh Tu",
  },

  /**
   * 2. Tên miền & Đường dẫn canonical (URLs)
   */
  url: "https://aha-mind.vercel.app",

  /**
   * 3. Bảng màu thương hiệu (Design Tokens)
   */
  colors: {
    primary: "#FFBA49", // Màu vàng hổ phách (Amber) nhận diện chính
    primaryHover: "#e6a640", // Màu khi hover / active
    backgroundDark: "#0f172a", // Slate-950 - Nền tối cho PWA splash screen
    backgroundLight: "#e2e8f0", // Slate-200 - Nền sáng app shell
    accentTeal: "#4FB5B5", // Màu xanh mòng két biểu tượng
    accentGold: "#FDC425", // Màu vàng kim biểu tượng
  },

  /**
   * 4. Tài nguyên đồ họa chuẩn (Canonical Assets Suite)
   */
  assets: {
    // Canonical Main Logo
    logo: "/brand/icon-512.png",
    logoVector: "/brand/logo-final.svg",

    // Icons Suite
    icon: "/brand/icon-512.png",
    icon192: "/brand/icon-192.png",
    icon512: "/brand/icon-512.png",
    icon1024: "/brand/icon-1024.png",
    iconMaskable: "/brand/icon-maskable-512.png",
    appleTouchIcon: "/brand/apple-touch-icon.png",

    // Vector SVGs
    logoIconSvg: "/brand/logo-final.svg",
    logoFullSvg: "/brand/logo-full-final.svg",

    // Raster Full Logos
    logoFullLight: "/brand/logo-full-light.png",
    logoFullDark: "/brand/logo-full-dark.png",

    // Splash & Marketing
    splashScreen: "/brand/splash-screen-1170x2532.png",
    appStoreIcon: "/brand/app-store-icon-512.png",
    featureGraphic: "/brand/feature-graphic-1024x500.png",
    promoBanner: "/brand/promo-banner-1200x630.png",
    ogImage: "/brand/og-image.png",
    favicon: "/brand/favicon.ico",
  },

  /**
   * 5. Nội dung chuẩn hóa cho SEO & Social Media
   */
  seo: {
    titleTemplate: "%s | Aha-Mind",
    defaultTitle: "Aha-Mind | AI Story Shadowing & Micro-Apps",
    description:
      "Ứng dụng AI thông minh hỗ trợ học tiếng Anh bằng phương pháp Shadowing và các tiện ích vi mô.",
    openGraph: {
      title: "Aha-Mind | Tổ hợp Ứng dụng AI thông minh",
      description:
        "Ứng dụng AI agent và micro frontend giúp việc học tập và cuộc sống trở nên dễ dàng hơn.",
      locale: "vi_VN",
    },
  },

  /**
   * 6. Cấu hình PWA & Cache Offline
   * Lưu ý: File public/sw.js sẽ tham chiếu thủ công theo cấu hình này (Option A).
   */
  pwa: {
    cacheName: "aha-mind-cache-v2",
    staticAssets: [
      "/",
      "/brand/favicon.ico",
      "/brand/logo-final.svg",
      "/brand/logo-full-final.svg",
      "/brand/icon-192.png",
      "/brand/icon-512.png",
      "/brand/apple-touch-icon.png",
      "/brand/og-image.png",
    ],
  },
} as const;

export type BrandConfig = typeof brand;
