import { MetadataRoute } from "next";
import { brand } from "@/lib/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.identity.fullName,
    short_name: brand.identity.shortName,
    description: brand.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: brand.colors.backgroundDark,
    theme_color: brand.colors.primary,
    orientation: "portrait",
    icons: [
      {
        src: brand.assets.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brand.assets.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brand.assets.iconMaskable,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: brand.assets.icon1024,
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}


