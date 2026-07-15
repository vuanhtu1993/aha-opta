import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Âm thanh Trắng (White Noise) | Aha-Mind",
  description: "Trình phát âm thanh trắng giúp bé ngủ ngon, thư giãn và tập trung làm việc với tính năng hẹn giờ thông minh.",
};

export default function WhiteNoiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
