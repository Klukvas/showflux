import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShowFlux Blog — Real Estate Management Insights",
  description:
    "Tips, best practices, and insights for real estate professionals on managing listings, showings, offers, and team collaboration.",
  openGraph: {
    title: "ShowFlux Blog — Real Estate Management Insights",
    description:
      "Tips, best practices, and insights for real estate professionals.",
    type: "website",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
        Blog
      </h1>
      <p className="mb-10 text-lg text-gray-600">
        Insights and best practices for real estate professionals.
      </p>

      <div className="space-y-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            aria-label={post.title}
            className="block rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-3 text-sm text-gray-500">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span>&middot;</span>
              <span>{post.author}</span>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              {post.title}
            </h2>
            <p className="mb-3 text-gray-600">{post.description}</p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
