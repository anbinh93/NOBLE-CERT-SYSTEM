"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, BookOpen, Languages, CalendarDays, Mic, FileText, Globe } from "lucide-react";

const services = [
  {
    title: "IELTS",
    desc: "Lộ trình học toàn diện 4 kỹ năng, kết hợp luyện tập thông minh với phương pháp giảng dạy hiện đại.",
    gradient: "from-orange-400 to-amber-500",
    icon: BookOpen,
    href: "/courses",
  },
  {
    title: "TOEIC",
    desc: "Bí kíp dịch nhanh chóng, luyện tập thông minh giúp bạn dễ dàng đạt mục tiêu TOEIC 900+.",
    gradient: "from-amber-400 to-yellow-500",
    icon: FileText,
    href: "/courses",
  },
  {
    title: "VSTEP",
    desc: "Lộ trình 3 chặng từ B1 – B2 – C1, tập trung đúng cấu trúc đề thi và tiêu chí chấm điểm VSTEP.",
    gradient: "from-emerald-400 to-teal-500",
    icon: Globe,
    href: "/courses",
  },
  {
    title: "JLPT",
    desc: "Chinh phục tiếng Nhật từ N5 đến N1 với phương pháp học tập khoa học và giáo trình chuẩn Nhật Bản.",
    gradient: "from-sky-400 to-blue-500",
    icon: BookOpen,
    href: "/courses",
  },
  {
    title: "Phiên dịch",
    desc: "Dịch vụ phiên dịch chuyên nghiệp đa ngôn ngữ cho doanh nghiệp, hội nghị và sự kiện quốc tế.",
    gradient: "from-blue-500 to-indigo-600",
    icon: Languages,
    href: "/courses",
  },
  {
    title: "Sự kiện",
    desc: "Các workshop, seminar và sự kiện kết nối cộng đồng học viên, chuyên gia ngôn ngữ hàng đầu.",
    gradient: "from-violet-500 to-purple-600",
    icon: CalendarDays,
    href: "/courses",
  },
  {
    title: "Luyện nói",
    desc: "Phòng luyện nói AI, thực hành giao tiếp 1:1 với giáo viên bản ngữ theo chủ đề thực tế.",
    gradient: "from-rose-400 to-pink-500",
    icon: Mic,
    href: "/courses",
  },
];

export default function ServicesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    return () => el?.removeEventListener("scroll", checkScroll);
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="py-20 lg:py-28 bg-[#f8f5f1] relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#223148] leading-tight">
              Tinh thông mọi ngôn ngữ<br />
              với bộ chương trình đào tạo<br />
              <span className="text-[#2f486d]">chất lượng cao</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-base lg:text-lg max-w-sm leading-relaxed">
            Học ngoại ngữ thật dễ dàng với lộ trình Học & Luyện Thi toàn diện, cá nhân hóa riêng biệt.
          </p>
        </div>

        {/* Cards Carousel */}
        <div className="relative">
          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Cards container */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory"
          >
            {services.map((svc, idx) => (
              <Link
                key={idx}
                href={svc.href}
                className="group flex-shrink-0 w-[240px] sm:w-[260px] snap-start"
              >
                <div className={`relative h-[340px] rounded-3xl bg-gradient-to-br ${svc.gradient} p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer`}>
                  {/* Background icon watermark */}
                  <svc.icon className="absolute top-4 right-4 w-20 h-20 text-white/10" />
                  
                  {/* Top content */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">{svc.title}</h3>
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-4">{svc.desc}</p>
                  </div>

                  {/* Bottom arrow button */}
                  <div className="flex justify-end">
                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-colors">
                      <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
