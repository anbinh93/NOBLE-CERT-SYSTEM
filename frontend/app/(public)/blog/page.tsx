import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { BlogService } from "@/services/blog.service";
import type { PostPublic } from "@/services/blog.service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog — Kiến thức & Tin tức",
  description: "Cập nhật xu hướng học tập, chia sẻ kinh nghiệm và tin tức mới nhất từ Noble Cert.",
};

const CATEGORIES = ["Tất cả", "Hướng dẫn", "Mẹo học tập", "Công nghệ", "Sự nghiệp", "Tin tức", "Kỹ năng"];

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function PostCard({ post, featured = false }: { post: PostPublic; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <div className={`group h-full flex flex-col bg-card rounded-2xl overflow-hidden border border-primary/10 shadow-sm hover:shadow-[0_8px_30px_-5px_rgba(212,175,55,0.2)] hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 ${featured ? "lg:flex-row" : ""}`}>
        <div className={`relative bg-muted overflow-hidden ${featured ? "lg:w-1/2 aspect-[16/10]" : "aspect-[16/9]"}`}>
          {post.thumbnail ? (
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-amber-100/20" />
          )}
          {post.category && (
            <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
              {post.category}
            </div>
          )}
        </div>

        <div className={`p-6 flex flex-col flex-1 ${featured ? "lg:p-10 lg:justify-center" : ""}`}>
          {featured && (
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Nổi bật</span>
          )}
          <h2 className={`font-bold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors ${featured ? "text-2xl lg:text-3xl" : "text-base line-clamp-2"}`}>
            {post.title}
          </h2>
          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed flex-1">
            {post.excerpt}
          </p>

          <div className="mt-5 pt-4 border-t border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                {post.author.name[0]}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{post.author.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(post.publishedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>{post.readTime} phút</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const posts = await BlogService.getLatestPosts(50);

  const filtered = category && category !== "Tất cả"
    ? posts.filter((p) => p.category === category)
    : posts;

  const [featured, ...rest] = filtered;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-primary/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            KIẾN THỨC & TIN TỨC
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Blog Noble Cert
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Chia sẻ kiến thức, kinh nghiệm học tập và xu hướng giáo dục từ đội ngũ chuyên gia Noble Cert.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => {
            const active = cat === "Tất cả" ? !category || category === "Tất cả" : category === cat;
            return (
              <Link
                key={cat}
                href={cat === "Tất cả" ? "/blog" : `/blog?category=${encodeURIComponent(cat)}`}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-primary/20 hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-lg">Chưa có bài viết nào trong danh mục này.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featured && (
              <div className="mb-10">
                <PostCard post={featured} featured />
              </div>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
