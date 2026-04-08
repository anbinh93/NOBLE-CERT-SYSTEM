"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PostPublic } from "@/services/blog.service";

const CARD_WIDTH_RATIO = 0.28; // ~28% per card on desktop → ~4 cards visible
const AUTO_SCROLL_INTERVAL = 3500;

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function BlogCarousel({ posts }: { posts: PostPublic[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    const amount = el.clientWidth * CARD_WIDTH_RATIO;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  const startAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const el = containerRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
      el.scrollBy({ left: atEnd ? -el.scrollWidth : el.clientWidth * CARD_WIDTH_RATIO, behavior: "smooth" });
    }, AUTO_SCROLL_INTERVAL);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    startAutoScroll();
    return () => {
      window.removeEventListener("resize", checkScroll);
      stopAutoScroll();
    };
  }, [posts, checkScroll, startAutoScroll, stopAutoScroll]);

  if (!posts.length) return null;

  return (
    <div
      className="relative group/blogcarousel"
      onMouseEnter={stopAutoScroll}
      onMouseLeave={startAutoScroll}
    >
      {/* Left Arrow */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 z-10 -ml-4 md:-ml-8 opacity-0 group-hover/blogcarousel:opacity-100 transition-opacity duration-300">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canScrollLeft}
          onClick={() => scroll("left")}
          className={`h-12 w-12 rounded-full border border-border bg-card/80 backdrop-blur-sm shadow-lg text-primary hover:bg-primary hover:text-primary-foreground transition-all ${!canScrollLeft ? "hidden" : ""}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Right Arrow */}
      <div className="absolute top-1/2 -translate-y-1/2 right-0 z-10 -mr-4 md:-mr-8 opacity-0 group-hover/blogcarousel:opacity-100 transition-opacity duration-300">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canScrollRight}
          onClick={() => scroll("right")}
          className={`h-12 w-12 rounded-full border border-border bg-card/80 backdrop-blur-sm shadow-lg text-primary hover:bg-primary hover:text-primary-foreground transition-all ${!canScrollRight ? "hidden" : ""}`}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Scroll Container */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        className="flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {posts.map((post) => (
          <div
            key={post._id}
            className="min-w-[85%] sm:min-w-[46%] lg:min-w-[23%] snap-center"
          >
            <Link href={`/blog/${post.slug}`}>
              <div className="group h-full flex flex-col bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-[0_8px_30px_-5px_rgba(47,72,109,0.2)] hover:border-primary/40 hover:-translate-y-1 transition-all duration-400">
                {/* Thumbnail */}
                <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                  {post.thumbnail ? (
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 85vw, (max-width: 1024px) 46vw, 23vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/20" />
                  )}
                  {post.category && (
                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                      {post.category}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>

                  <div className="mt-4 pt-3 border-t border-primary/10 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{post.readTime} phút đọc</span>
                    </div>
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}

        {/* View All Card */}
        <div className="min-w-[40%] sm:min-w-[22%] lg:min-w-[13%] snap-center flex items-center justify-center">
          <Link href="/blog" className="flex flex-col items-center gap-3 group">
            <div className="w-14 h-14 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ArrowRight className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors text-center">
              Xem tất cả
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
