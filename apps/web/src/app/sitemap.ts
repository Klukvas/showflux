import type { MetadataRoute } from "next";
import type { BlogPostMeta } from "@/lib/blog";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";

const featureSlugs = [
  "listings",
  "showings",
  "offers",
  "collaboration",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  let posts: BlogPostMeta[] = [];
  try {
    posts = getAllPosts();
  } catch {
    // blog directory may not exist yet
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/features`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  const featurePages: MetadataRoute.Sitemap = featureSlugs.map((slug) => ({
    url: `${SITE_URL}/features/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...featurePages, ...blogPages];
}
