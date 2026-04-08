"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  score: string;
  quote: string;
  avatar: string;
  image: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Nguyễn Thu Hà",
    score: "IELTS 8.0",
    quote:
      "Noble Academy không chỉ cung cấp kiến thức mà còn mở ra tầm nhìn mới. Nhờ sự hướng dẫn tận tình và giáo trình chuẩn quốc tế, mình đã chinh phục IELTS 8.0 chỉ sau 6 tháng.",
    avatar: "Nguyen+Ha",
    image: "/image1.png",
  },
  {
    name: "Trần Minh Đức",
    score: "TOEIC 950",
    quote:
      "Phương pháp học tập tại Noble Academy rất khoa học và hiệu quả. Giảng viên luôn sát sao, giúp mình nâng điểm TOEIC từ 650 lên 950 trong vòng 4 tháng.",
    avatar: "Tran+Duc",
    image: "/image2.png",
  },
  {
    name: "Lê Thanh Mai",
    score: "JLPT N2",
    quote:
      "Từ một người mới bắt đầu học tiếng Nhật, mình đã đạt N2 sau 1 năm nhờ lộ trình cá nhân hóa và cộng đồng học tập tuyệt vời tại Noble Academy.",
    avatar: "Le+Mai",
    image: "/image1.png",
  },
];

const AUTO_PLAY_INTERVAL = 5000;

export default function SuccessStories() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex(index);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((activeIndex + 1) % TESTIMONIALS.length);
  }, [activeIndex, goTo]);

  const prev = useCallback(() => {
    goTo((activeIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, [activeIndex, goTo]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  const current = TESTIMONIALS[activeIndex];

  return (
    <section className="py-20 lg:py-28 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            CÂU CHUYỆN THÀNH CÔNG
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4 leading-tight">
            Học viên chia sẻ{" "}
            <span className="text-primary">trải nghiệm</span>
          </h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
        </div>

        {/* Testimonial Slider */}
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Left: Student Image (40%) */}
          <div className="lg:col-span-2 relative">
            <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl bg-muted">
              {TESTIMONIALS.map((t, i) => (
                <img
                  key={i}
                  src={t.image}
                  alt={t.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-600 ease-in-out ${
                    i === activeIndex && !isTransitioning
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-105"
                  }`}
                />
              ))}

              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />

              {/* Name tag on image */}
              <div className="absolute bottom-4 left-4 right-4">
                <div
                  className={`bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg transition-all duration-500 ${
                    isTransitioning
                      ? "opacity-0 translate-y-2"
                      : "opacity-100 translate-y-0"
                  }`}
                >
                  <p className="font-bold text-foreground text-sm">
                    {current.name}
                  </p>
                  <p className="text-primary text-xs font-semibold">
                    {current.score}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation arrows under image */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-foreground/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Dot indicators */}
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      i === activeIndex
                        ? "w-8 bg-primary"
                        : "w-2 bg-primary/30 hover:bg-primary/50"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-foreground/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer"
                aria-label="Next testimonial"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Right: Quote Content (60%) */}
          <div className="lg:col-span-3 relative">
            <Quote className="w-16 h-16 text-primary/10 absolute -top-4 -left-2" />

            <div
              className={`relative z-10 transition-all duration-500 ${
                isTransitioning
                  ? "opacity-0 translate-x-6"
                  : "opacity-100 translate-x-0"
              }`}
            >
              <blockquote className="text-xl lg:text-2xl text-foreground/80 leading-relaxed mb-8 italic font-light">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                  <img
                    src={`https://ui-avatars.com/api/?name=${current.avatar}&background=2f486d&color=f3eae0&size=128`}
                    alt={current.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-lg">
                    {current.name}
                  </h4>
                  <p className="text-primary font-semibold text-sm">
                    {current.score}
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative circle */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full border border-primary/10 hidden lg:block" />
            <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full border border-primary/5 hidden lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
