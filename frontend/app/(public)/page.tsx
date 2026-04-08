
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  Target,
  Users,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

async function getCourses() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(`${apiUrl}/api/public/courses`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      // Only log if it's a real API error, not just "no body"
      const text = await res.text().catch(() => "");
      if (text) console.error("LandingPage Fetch Error:", res.status, text);
      return [];
    }
    const data = await res.json();
    return data;
  } catch {
    // Backend offline — return empty silently
    return [];
  }
}

import FeaturedCoursesCarousel from "@/components/landing/FeaturedCoursesCarousel";
import BlogCarousel from "@/components/landing/BlogCarousel";
import PartnersSection from "@/components/landing/PartnersSection";
import SuccessStories from "@/components/landing/SuccessStories";
import EventBanner from "@/components/landing/EventBanner";
import ServicesSection from "@/components/landing/ServicesSection";
import Section3DReveal from "@/components/landing/Section3DReveal";
import { BlogService } from "@/services/blog.service";

export default async function LandingPage() {
  const courses = await getCourses();
  const featuredCourses = courses.slice(0, 8);
  const posts = await BlogService.getLatestPosts(6);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      
      {/* ═══════════════════════════════════════════
          SECTION 1: HERO — Full-Viewport Dynamic
          ═══════════════════════════════════════════ */}
      <section
        className="relative min-h-[calc(100vh-72px)] flex items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2f486d 30%, #3a5a80 60%, #223148 100%)" }}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E\")", backgroundSize: "40px 40px" }} />
        {/* Radial glow effects */}
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(243,234,224,0.05)_0%,transparent_60%)] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative py-16 lg:py-0">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-8">
            
            {/* ── Left Column: Text Content (55%) ── */}
            <div className="flex-1 text-center lg:text-left relative z-10 lg:max-w-[55%]">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-semibold mb-8 animate-fade-up backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-amber-300" />
                KHOÁ HỌC CHẤT LƯỢNG HÀNG ĐẦU
              </div>
              
              {/* Heading — much larger */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white font-serif leading-[1.05] mb-8 animate-fade-up delay-100">
                Lộ trình Học &<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200">Luyện Thi</span>
                <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300">Toàn Diện</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg lg:text-xl text-white/70 leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0 animate-fade-up delay-200">
                Nền tảng luyện thi chứng chỉ ngoại ngữ hàng đầu — TOEIC, IELTS, JLPT. Nâng cao kỹ năng và nhận chứng chỉ được công nhận toàn cầu.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-up delay-300">
                <Link href="/courses">
                  <Button size="lg" className="h-14 px-10 rounded-full text-base bg-white text-[#2f486d] hover:bg-amber-300 hover:text-[#223148] shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 font-bold cursor-pointer">
                    KHÁM PHÁ NGAY <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/verify/demo">
                  <Button size="lg" className="h-14 px-10 rounded-full text-base bg-amber-400 text-[#1e3a5f] font-bold hover:bg-amber-300 shadow-[0_4px_20px_rgba(251,191,36,0.3)] hover:shadow-[0_8px_30px_rgba(251,191,36,0.4)] hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    Nhận tư vấn miễn phí
                  </Button>
                </Link>
              </div>
              
              {/* Metrics */}
              <div className="mt-14 flex items-center justify-center lg:justify-start gap-8 animate-fade-up delay-400">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-11 h-11 rounded-full border-2 border-white/30 overflow-hidden shadow-md">
                        <img src={`https://ui-avatars.com/api/?name=Student+${i}&background=f3eae0&color=2f486d&size=88`} alt="Student" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-3xl font-extrabold text-white">15,000+</span>
                    <span className="text-xs text-white/50 uppercase tracking-widest font-medium">Học viên hài lòng</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* ── Right Column: Human Figure (45%) ── */}
            <div className="flex-1 w-full relative hidden lg:flex items-center justify-center animate-fade-up delay-500" style={{ perspective: '1200px' }}>
              {/* Luminous glow behind frame */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full bg-[radial-gradient(circle,rgba(243,234,224,0.14)_0%,rgba(255,255,255,0.05)_40%,transparent_65%)] pointer-events-none" />
              
              {/* Decorative rings with 3D depth */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-white/[0.06] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-white/[0.03] pointer-events-none" />

              {/* ── 3D Photo Frame ── */}
              <div className="relative z-10 w-[440px] xl:w-[480px] group hero-3d-frame">
                {/* Outer golden accent ring with depth */}
                <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-300/20 via-amber-200/10 to-transparent pointer-events-none" />
                
                {/* Main frame with image — 3D tilt on hover */}
                <div className="relative rounded-[1.75rem] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.4)] ring-1 ring-white/20 aspect-[3/4] transition-all duration-500 group-hover:shadow-[0_35px_100px_rgba(0,0,0,0.5)]">
                  <Image
                    src="/hero-graduate.png"
                    alt="Sinh viên tốt nghiệp Noble Academy"
                    width={1024}
                    height={1024}
                    className="w-full h-full object-cover object-top group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    priority
                  />
                  {/* Reflection / light sweep on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-[1]" />
                  {/* Bottom gradient fade */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1e3a5f]/80 to-transparent z-[2]" />
                </div>
                
                {/* Subtle floating effect */}
                <div className="absolute -inset-1 rounded-[2rem] bg-white/[0.03] animate-float pointer-events-none" />
              </div>

              {/* Floating badge: IELTS — top right of frame */}
              <div className="absolute top-[8%] right-0 xl:right-[5%] z-20 bg-white/95 backdrop-blur-md rounded-2xl px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-float delay-200">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#2f486d] flex items-center justify-center">
                    <span className="text-sm font-extrabold text-white">8.0</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">IELTS</p>
                    <p className="text-xs text-gray-500">Overall Band</p>
                  </div>
                </div>
              </div>

              {/* Floating badge: TOEIC — left of frame */}
              <div className="absolute top-[38%] -left-2 xl:left-[2%] z-20 bg-white/95 backdrop-blur-md rounded-2xl px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-float delay-400">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center">
                    <span className="text-sm font-extrabold text-gray-900">950</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">TOEIC</p>
                    <p className="text-xs text-gray-500">Total Score</p>
                  </div>
                </div>
              </div>

              {/* Floating badge: Graduation — bottom right */}
              <div className="absolute bottom-[12%] right-[2%] xl:right-[8%] z-20 bg-white/95 backdrop-blur-md rounded-2xl px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-float delay-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Tốt nghiệp</p>
                    <p className="text-xs text-gray-500">Xuất sắc 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2: NEWS / BLOG
          ═══════════════════════════════════════════ */}
      <Section3DReveal as="div">
      <section className="py-20 lg:py-28 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-4">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                KIẾN THỨC & TIN TỨC
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight">
                Cập nhật xu hướng <span className="text-primary">học tập</span>
              </h2>
            </div>
            <Link
              href="/blog"
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
            >
              Xem tất cả bài viết
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <BlogCarousel posts={posts} />

          <div className="mt-6 text-center md:hidden">
            <Link href="/blog" className="text-sm font-semibold text-primary hover:underline">
              Xem tất cả bài viết →
            </Link>
          </div>
        </div>
      </section>
      </Section3DReveal>

      {/* ═══════════════════════════════════════════
          SECTION 3: SERVICES (Courses, Translation, Events)
          ═══════════════════════════════════════════ */}
      <Section3DReveal as="div">
      <ServicesSection />

      </Section3DReveal>

      {/* ═══════════════════════════════════════════
          SECTION 4: STATS
          ═══════════════════════════════════════════ */}
      <Section3DReveal as="div">
      <section className="border-y border-border bg-card/80">
        <div className="container mx-auto px-4 py-14 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {[
              { label: "Học viên", value: "25k+" },
              { label: "Khóa học", value: "450+" },
              { label: "Giảng viên", value: "120+" },
              { label: "Chứng chỉ", value: "15k+" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center group">
                <h3 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight group-hover:scale-110 transition-transform duration-300">{stat.value}</h3>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </Section3DReveal>

      {/* ═══════════════════════════════════════════
          SECTION 5: SUCCESS STORIES
          ═══════════════════════════════════════════ */}
      <Section3DReveal as="div">
      <SuccessStories />
      </Section3DReveal>

      {/* ═══════════════════════════════════════════
          SECTION 6: PARTNERS
          ═══════════════════════════════════════════ */}
      <Section3DReveal as="div">
      <PartnersSection />
      </Section3DReveal>

      {/* ═══════════════════════════════════════════
          SECTION 7: CENTER INFO (Value Proposition)
          ═══════════════════════════════════════════ */}
      <Section3DReveal as="div">
      <section className="py-20 lg:py-28 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border text-primary text-sm font-bold mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                THÔNG TIN TRUNG TÂM
              </div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6 leading-tight">
                Tại sao chọn <br/>
                <span className="text-primary">Noble Academy?</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-lg">
                Hệ thống đào tạo ngôn ngữ chuẩn quốc tế, kết hợp công nghệ hiện đại và phương pháp giảng dạy tiên tiến giúp bạn bứt phá mọi giới hạn.
              </p>
              
              <ul className="space-y-4 text-foreground/80">
                {["Cam kết đầu ra bằng văn bản", "Hoàn tiền 100% nếu không đạt mục tiêu", "Hỗ trợ trọn đời ngay cả sau khi tốt nghiệp"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 font-medium">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {(
                [
                  { title: "Giảng viên thực chiến", desc: "Đội ngũ chuyên gia hàng đầu với chứng chỉ quốc tế (IELTS 8.5+, TESOL, JLPT N1).", Icon: GraduationCap },
                  { title: "Chứng chỉ Blockchain", desc: "Xác thực năng lực toàn cầu với công nghệ bảo mật không thể làm giả.", Icon: BadgeCheck },
                  { title: "Lộ trình cá nhân hóa", desc: "Hệ thống AI phân tích và đề xuất lộ trình học tập tối ưu cho riêng bạn.", Icon: Target },
                  { title: "Cộng đồng tinh hoa", desc: "Mạng lưới kết nối học viên, cựu học viên và các nhà tuyển dụng hàng đầu.", Icon: Users },
                ] as { title: string; desc: string; Icon: LucideIcon }[]
              ).map((item, i) => (
                <div key={i} className="group relative bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                  <item.Icon className="absolute top-4 right-4 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity text-primary" />
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <item.Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      </Section3DReveal>

    </div>
  );
}
