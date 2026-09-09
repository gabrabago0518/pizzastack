import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pizzastack.gg";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: profiles }, { data: posts }] = await Promise.all([
    supabase.from("profiles").select("username, created_at").limit(5000),
    supabase
      .from("lfg_posts")
      .select("id, created_at")
      .eq("status", "open")
      .limit(5000),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/teammates`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/coaches`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/signup`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const playerRoutes: MetadataRoute.Sitemap = (profiles ?? []).map((profile) => ({
    url: `${siteUrl}/players/${profile.username}`,
    lastModified: profile.created_at,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const listingRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${siteUrl}/teammates/${post.id}`,
    lastModified: post.created_at,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...playerRoutes, ...listingRoutes];
}
