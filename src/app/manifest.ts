import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#093924",
    icons: [
      { src: "/brand/abide-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/abide-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/abide-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
