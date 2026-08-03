import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AHA-MIND — AI Learning Tools",
    short_name: "AHA-MIND",
    description: "Ứng dụng AI thông minh hỗ trợ luyện phát âm tiếng Anh (Story Shadowing) và các tiện ích vi mô.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#FFBA49",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
