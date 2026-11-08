import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private areas are also marked noindex by the proxy.
      disallow: ["/library", "/journal", "/flashcards", "/account", "/admin", "/auth", "/guidance/saved", "/api"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
