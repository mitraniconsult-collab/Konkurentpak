import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  const origin = new URL(base).origin;
  return ["/", "/products", "/custom-packaging", "/contact"].map(path => ({ url: new URL(path, origin).toString(), changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 }));
}
