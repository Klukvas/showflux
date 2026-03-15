import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function validatePostMeta(
  data: Record<string, unknown>,
  filename: string,
): BlogPostMeta {
  if (typeof data.slug !== "string" || !VALID_SLUG.test(data.slug)) {
    throw new Error(`Invalid or missing slug in ${filename}`);
  }
  if (typeof data.title !== "string" || !data.title) {
    throw new Error(`Missing title in ${filename}`);
  }
  if (typeof data.description !== "string" || !data.description) {
    throw new Error(`Missing description in ${filename}`);
  }
  const dateStr =
    data.date instanceof Date
      ? data.date.toISOString().split("T")[0]
      : typeof data.date === "string"
        ? data.date
        : null;
  if (!dateStr) {
    throw new Error(`Invalid date in ${filename}`);
  }
  if (!Array.isArray(data.tags)) {
    throw new Error(`tags must be an array in ${filename}`);
  }

  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    date: dateStr,
    author: typeof data.author === "string" ? data.author : "ShowFlux Team",
    tags: data.tags.filter((t): t is string => typeof t === "string"),
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getAllPosts(): BlogPostMeta[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const posts = files.map((filename) => {
    const filePath = path.join(BLOG_DIR, filename);
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(fileContents);
    return validatePostMeta(data, filename);
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!VALID_SLUG.test(slug)) {
    return null;
  }

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  for (const filename of files) {
    const filePath = path.join(BLOG_DIR, filename);
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContents);

    if (data.slug === slug) {
      const meta = validatePostMeta(data, filename);
      const processed = await remark()
        .use(html, { sanitize: true })
        .process(content);

      return {
        ...meta,
        content: processed.toString(),
      };
    }
  }

  return null;
}
