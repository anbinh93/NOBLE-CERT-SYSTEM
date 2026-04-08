"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";

export default function EventBanner() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[500px] lg:min-h-[600px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with parallax */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-parallax"
        style={{ backgroundImage: "url('/event-banner.png')" }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />

      {/* Animated grain texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />

      {/* Content */}
      <div
        className={`relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-3xl mx-auto">
          {/* Glass card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl px-8 py-12 md:px-14 md:py-16 shadow-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-sm font-bold mb-6">
              <CalendarDays size={16} />
              SỰ KIỆN SẮP TỚI
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
              Hội thảo Ngôn ngữ
              <br />
              <span className="text-amber-300">Quốc tế 2026</span>
            </h2>

            {/* Details */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm mb-8">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-amber-300" />
                <span>15 — 17 Tháng 6, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-amber-300" />
                <span>JW Marriott, Hà Nội</span>
              </div>
            </div>

            <p className="text-white/70 text-base max-w-lg mx-auto mb-10 leading-relaxed">
              Quy tụ hơn 500 chuyên gia giáo dục và ngôn ngữ từ 20 quốc gia. 
              Đăng ký sớm để nhận ưu đãi giảm 30%.
            </p>

            {/* CTA */}
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-foreground bg-white hover:bg-amber-300 hover:text-foreground rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 group"
            >
              ĐĂNG KÝ THAM GIA
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
