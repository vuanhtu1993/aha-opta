import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { brand } from "@/lib/config/brand";
import { AppShell } from "@/components/mobile-shell/app-shell";
import { MobileHeader } from "@/components/mobile-shell/mobile-header";
import { MobileTabBar } from "@/components/mobile-shell/mobile-tab-bar";
import { PWARegister } from "@/components/mobile-shell/pwa-register";
import { AgentProgressToast } from "@/components/story-shadowing/agent-progress-toast";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: brand.colors.primary,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Khi bàn phím ảo mở trên iOS Safari, Layout Viewport sẽ co lại
  // thay vì bàn phím overlay đè lên nội dung (mặc định: resizes-visual)
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: brand.seo.defaultTitle,
  description: brand.seo.description,
  openGraph: {
    title: brand.seo.openGraph.title,
    description: brand.seo.openGraph.description,
    url: brand.url,
    siteName: brand.identity.name,
    images: [
      {
        url: brand.assets.ogImage,
        width: 1200,
        height: 630,
        alt: `${brand.identity.name} Logo`,
      },
    ],
    locale: brand.seo.openGraph.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: brand.seo.openGraph.title,
    description: brand.seo.openGraph.description,
    images: [brand.assets.ogImage],
  },
  icons: {
    icon: [
      { url: brand.assets.favicon, sizes: "any" },
      { url: brand.assets.icon192, sizes: "192x192", type: "image/png" },
      { url: brand.assets.icon512, sizes: "512x512", type: "image/png" },
      { url: brand.assets.icon1024, sizes: "1024x1024", type: "image/png" },
    ],
    apple: [
      { url: brand.assets.appleTouchIcon, sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brand.identity.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.identity.name,
    url: brand.url,
    description: brand.seo.openGraph.description,
    publisher: {
      "@type": "Organization",
      name: brand.identity.publisherName,
      logo: {
        "@type": "ImageObject",
        url: `${brand.url}${brand.assets.logo}`,
      },
    },
  };

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" href={brand.assets.favicon} sizes="any" />
        <link rel="apple-touch-icon" sizes="180x180" href={brand.assets.appleTouchIcon} />
        <link rel="apple-touch-icon" href={brand.assets.appleTouchIcon} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-slate-200 dark:bg-slate-950`}>
        <AppShell>
          <MobileHeader />
          {children}
          <MobileTabBar />
        </AppShell>
        <AgentProgressToast />
        <PWARegister />
      </body>
    </html>
  );
}
