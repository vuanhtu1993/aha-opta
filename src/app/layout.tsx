import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/mobile-shell/app-shell";
import { MobileHeader } from "@/components/mobile-shell/mobile-header";
import { MobileTabBar } from "@/components/mobile-shell/mobile-tab-bar";
import { PWARegister } from "@/components/mobile-shell/pwa-register";
import { AgentProgressToast } from "@/components/story-shadowing/agent-progress-toast";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#FFBA49",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://aha-mind.vercel.app"),
  title: "Aha-Mind | AI Story Shadowing & Micro-Apps",
  description: "Ứng dụng AI thông minh hỗ trợ học tiếng Anh bằng phương pháp Shadowing và các tiện ích vi mô.",
  openGraph: {
    title: "Aha-Mind | Tổ hợp Ứng dụng AI thông minh",
    description: "Ứng dụng AI agent và micro frontend giúp cuộc sống trở nên dễ dàng hơn.",
    url: "https://aha-mind.vercel.app",
    siteName: "Aha-Mind",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aha-Mind Logo",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aha-Mind | Tổ hợp Ứng dụng AI thông minh",
    description: "Ứng dụng AI agent và micro frontend giúp cuộc sống trở nên dễ dàng hơn.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AHA-MIND",
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
    name: "Aha-Mind",
    url: "https://aha-mind.vercel.app",
    description: "Ứng dụng AI agent và micro frontend giúp cuộc sống trở nên dễ dàng hơn.",
    publisher: {
      "@type": "Organization",
      name: "Anh Tu",
      logo: {
        "@type": "ImageObject",
        url: "https://aha-mind.vercel.app/logo.svg"
      }
    }
  };

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
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
