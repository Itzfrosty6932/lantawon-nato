import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lantawon-nato.com";
  const routes = [
    "",
    "/discover",
    "/movies",
    "/series",
    "/anime",
    "/where-to-watch",
    "/studios",
    "/networks",
    "/people",
    "/trending",
    "/top-rated",
    "/library",
    "/statistics",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
