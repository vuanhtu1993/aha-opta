import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AHA-MIND — AI Learning Tools",
    short_name: "Aha-Mind",
    description:
      "Ứng dụng AI thông minh hỗ trợ luyện phát âm tiếng Anh (Story Shadowing) và các tiện ích vi mô.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#FFBA49",
    orientation: "portrait",
    icons: [
      {
        src: "/logo2.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo2.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo2.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}

