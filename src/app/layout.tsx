import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { GlobalFooter } from "@/components/layout/GlobalFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://aha-mind.vercel.app"),
  title: "Aha-Mind | Tổ hợp Ứng dụng AI thông minh",
  description: "Ứng dụng AI agent và micro frontend giúp cuộc sống trở nên dễ dàng hơn. Cung cấp các tiện ích như Luyện nói tiếng Anh (Shadowing), Âm thanh trắng (White Noise), và Thống kê bóng đá (Opta).",
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
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 flex flex-col`}>
        {/* Navigation Bar (Header) - Đóng vai trò làm lớp vỏ (Shell) cho các Micro Frontend */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src="/logo.svg" alt="Aha-Mind Logo" className="h-48 w-auto mix-blend-multiply" />
            </Link>

            <nav className="flex items-center gap-2">
              <Link href="/apps/white-noise" className={buttonVariants({ variant: "ghost" })}>
                🎵 Lullaby
              </Link>
              <Link href="/apps/opta" className={buttonVariants({ variant: "ghost" })}>
                ⚽ WC26
              </Link>
              {/* Có thể thêm các app con khác ở đây */}
            </nav>
          </div>
        </header>

        {/* Nội dung của từng ứng dụng con (Micro-app) sẽ được render ở đây */}
        <main className="flex-1 container mx-auto p-4 md:p-8">
          {children}
        </main>

        <GlobalFooter />
      </body>
    </html>
  );
}
