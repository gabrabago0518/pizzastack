import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pizzastack.gg";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/profile",
        "/profile/settings",
        "/onboarding",
        "/auth/",
        "/teammates/new",
        "/coaches/new",
        "/search",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
