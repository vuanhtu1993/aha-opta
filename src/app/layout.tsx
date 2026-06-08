import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aha Tools - Tiện ích Gia đình",
  description: "Tập hợp các ứng dụng tiện ích nhỏ dành cho gia đình.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 flex flex-col`}>
        {/* Navigation Bar (Header) - Đóng vai trò làm lớp vỏ (Shell) cho các Micro Frontend */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl tracking-tight text-blue-600">
              Aha<span className="text-slate-800">Tools</span>
            </Link>
            
            <nav className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/apps/white-noise">🎵 White Noise</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/apps/opta">⚽ aha-opta</Link>
              </Button>
              {/* Có thể thêm các app con khác ở đây */}
            </nav>
          </div>
        </header>

        {/* Nội dung của từng ứng dụng con (Micro-app) sẽ được render ở đây */}
        <main className="flex-1 container mx-auto p-4 md:p-8">
          {children}
        </main>

        <footer className="py-6 text-center text-sm text-slate-500 mt-auto border-t">
          <p>Made by Anh Tu - Share to be share</p>
        </footer>
      </body>
    </html>
  );
}
