import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  const origin = new URL(base).origin;
  return [{ url: new URL("/", origin).toString(), changeFrequency: "weekly", priority: 1 }];
}
