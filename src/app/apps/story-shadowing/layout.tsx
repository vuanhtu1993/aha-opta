import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luyện nói Tiếng Anh (Story Shadowing) | Aha-Mind",
  description: "Ứng dụng luyện nói tiếng Anh bằng phương pháp Shadowing. Hỗ trợ tạo bài học từ text hoặc video YouTube với phiên âm IPA và từ vựng thông minh.",
};

export default function StoryShadowingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
