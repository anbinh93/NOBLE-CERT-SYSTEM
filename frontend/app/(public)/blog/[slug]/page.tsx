import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Tag } from "lucide-react";
import { BlogService } from "@/services/blog.service";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await BlogService.getPostBySlug(slug);

  if (!post) notFound();

  return (
    <main className="min-h-screen bg-background">
      {/* Back Link */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-primary/10 py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Quay lại Blog
          </Link>
        </div>
      </div>

      <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        {/* Category */}
        {post.category && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20">
              <Tag size={11} />
              {post.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight mb-6">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
              {post.author.name[0]}
            </div>
            <span className="text-sm font-semibold text-foreground">{post.author.name}</span>
          </div>
          <span className="text-muted-foreground text-sm">{formatDate(post.publishedAt)}</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>{post.readTime} phút đọc</span>
          </div>
        </div>

        {/* Thumbnail */}
        {post.thumbnail && (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10 shadow-lg">
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Excerpt */}
        <p className="text-lg text-muted-foreground leading-relaxed mb-8 border-l-4 border-primary/40 pl-4 italic">
          {post.excerpt}
        </p>

        {/* Content */}
        <div
          className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/80 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-primary/10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full border border-primary/10"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Back to Blog */}
        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary/30 text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <ArrowLeft size={16} />
            Xem tất cả bài viết
          </Link>
        </div>
      </article>
    </main>
  );
}
