
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Headphones,
  Mic,
  PenTool,
  PlayCircle,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

async function getCourses() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    // console.log(`LandingPage: Fetching ${apiUrl}/api/public/courses`);
    const res = await fetch(`${apiUrl}/api/public/courses`, {
      cache: 'no-store',
    });
    // console.log(`LandingPage: Status ${res.status}`);
    
    if (!res.ok) {
       console.error("LandingPage Fetch Error:", await res.text());
       return [];
    }
    const data = await res.json();
    // console.log(`LandingPage: Found ${data.length} courses`);
    return data;
  } catch (error) {
    console.error("LandingPage: Failed to fetch courses:", error);
    return [];
  }
}


import FeaturedCoursesCarousel from "@/components/landing/FeaturedCoursesCarousel";
import TestimonialVideo from "@/components/landing/TestimonialVideo";

// ... (existing helper function)

export default async function LandingPage() {
  const courses = await getCourses();
  const featuredCourses = courses.slice(0, 8); // Updated to show more courses in carousel


  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary-foreground">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-transparent -z-10 pointer-events-none" />
        
        {/* Orbit Lines Decoration */}
        <div className="absolute inset-0 flex items-center justify-center -z-20 opacity-20 pointer-events-none">
            <div className="absolute w-[600px] h-[600px] rounded-full border border-primary/30"></div>
            <div className="absolute w-[900px] h-[900px] rounded-full border border-primary/20"></div>
            <div className="absolute w-[1200px] h-[1200px] rounded-full border border-primary/10"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
           <div className="flex flex-col lg:flex-row items-center gap-16">
               {/* Text Content */}
               <div className="flex-1 text-center lg:text-left">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-serif mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                       <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        HỌC VIỆN NGÔN NGỮ NOBLE
                   </div>
                   
                   <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground font-serif leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                       Khai phá tiềm năng, <br/>
                       <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-200 to-primary">kiến tạo tương lai.</span>
                   </h1>
                   
                   <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                       Nền tảng luyện thi chứng chỉ ngoại ngữ hàng đầu (TOEIC, IELTS, JLPT). Nâng cao kỹ năng giao tiếp và nhận chứng chỉ được công nhận toàn cầu.
                   </p>
                   
                   <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                       <Link href="/courses">
                           <Button size="lg" className="h-14 px-8 rounded-full text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:-translate-y-1 transition-[transform,box-shadow] duration-300 font-bold">
                               KHÁM PHÁ NGAY <ArrowRight className="ml-2 w-4 h-4" />
                           </Button>
                       </Link>
                       <Link href="/verify/demo">
                           <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300">
                               Nhận tư vấn
                           </Button>
                       </Link>
                   </div>
                   
                   {/* Metrics */}
                   <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-80">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-4">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                                         <img src={`https://ui-avatars.com/api/?name=${i}&background=random`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-2xl font-bold text-foreground">15,000+</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Học viên hài lòng</span>
                            </div>
                        </div>
                   </div>
               </div>
               
               {/* Hero Visual - Orbit Concept */}
               <div className="flex-1 w-full max-w-xl lg:max-w-none animate-in fade-in zoom-in duration-1000 delay-500 hidden lg:block relative min-h-[600px]">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-100">
                      <div className="relative flex items-center justify-center pointer-events-none select-none h-[450px] w-[450px] lg:h-[600px] lg:w-[600px]">
                        
                        {/* Inner Orbit (Dashed) */}
                        <div className="absolute h-[55%] w-[55%] rounded-full border border-dashed border-primary/40 dark:border-primary/20 animate-spin-cw">
                            {/* Icons on Inner Orbit */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                <div className="animate-spin-ccw flex h-12 w-12 items-center justify-center rounded-full bg-card border border-primary/30 text-primary shadow-lg backdrop-blur-sm dark:shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                                    <Mic size={20} />
                                </div>
                            </div>
                            <div className="absolute top-1/2 -right-6 -translate-y-1/2">
                                <div className="animate-spin-ccw flex h-12 w-12 items-center justify-center rounded-full bg-card border border-primary/30 text-primary shadow-lg backdrop-blur-sm dark:shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                                    <PenTool size={20} />
                                </div>
                            </div>
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                                <div className="animate-spin-ccw flex h-12 w-12 items-center justify-center rounded-full bg-card border border-primary/30 text-primary shadow-lg backdrop-blur-sm dark:shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                                    <BookOpen size={20} />
                                </div>
                            </div>
                            <div className="absolute top-1/2 -left-6 -translate-y-1/2">
                                <div className="animate-spin-ccw flex h-12 w-12 items-center justify-center rounded-full bg-card border border-primary/30 text-primary shadow-lg backdrop-blur-sm dark:shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                                    <Headphones size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Outer Orbit */}
                        <div className="absolute h-full w-full rounded-full border border-primary/20 dark:border-primary/10 animate-spin-ccw">
                            <div className="absolute top-[14.65%] left-[14.65%] -translate-x-1/2 -translate-y-1/2">
                                <div className="animate-spin-cw flex h-16 w-16 items-center justify-center rounded-full bg-card/90 dark:bg-background/90 border border-primary/30 shadow-lg dark:shadow-[0_0_20px_rgba(212,175,55,0.1)] backdrop-blur-md">
                                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">IELTS</span>
                                </div>
                            </div>
                            <div className="absolute top-[14.65%] right-[14.65%] translate-x-1/2 -translate-y-1/2">
                                <div className="animate-spin-cw flex h-16 w-16 items-center justify-center rounded-full bg-card/90 dark:bg-background/90 border border-primary/30 shadow-lg dark:shadow-[0_0_20px_rgba(212,175,55,0.1)] backdrop-blur-md">
                                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">TOEIC</span>
                                </div>
                            </div>
                            <div className="absolute bottom-[14.65%] right-[14.65%] translate-x-1/2 translate-y-1/2">
                                <div className="animate-spin-cw flex h-16 w-16 items-center justify-center rounded-full bg-card/90 dark:bg-background/90 border border-primary/30 shadow-lg dark:shadow-[0_0_20px_rgba(212,175,55,0.1)] backdrop-blur-md">
                                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">GLOBAL</span>
                                </div>
                            </div>
                            <div className="absolute bottom-[14.65%] left-[14.65%] -translate-x-1/2 translate-y-1/2">
                                <div className="animate-spin-cw flex h-16 w-16 items-center justify-center rounded-full bg-card/90 dark:bg-background/90 border border-primary/30 shadow-lg dark:shadow-[0_0_20px_rgba(212,175,55,0.1)] backdrop-blur-md">
                                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">CONNECT</span>
                                </div>
                            </div>
                        </div>

                        {/* Center Logo */}
                        <div className="relative z-10 flex flex-col items-center">
                             <div className="w-32 h-32 border-2 border-primary rounded-full flex items-center justify-center bg-background/50 backdrop-blur-sm shadow-[0_0_30px_rgba(212,175,55,0.2)] overflow-hidden p-4">
                                 <Image 
                                     src="/logo.webp" 
                                     alt="Noble Logo" 
                                     fill 
                                     className="object-contain p-4" 
                                     priority
                                 />
                             </div>
                        </div>

                      </div>
                   </div>
               </div>
           </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="border-y border-primary/10 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                      { label: "Học viên", value: "25k+" },
                      { label: "Khóa học", value: "450+" },
                      { label: "Giảng viên", value: "120+" },
                      { label: "Chứng chỉ", value: "15k+" },
                  ].map((stat, idx) => (
                      <div key={idx} className="text-center group">
                          <h3 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{stat.value}</h3>
                          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- FEATURED COURSES --- */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-serif font-bold text-foreground sm:text-4xl mb-4">Khám phá khóa học nổi bật</h2>
                <div className="h-1 w-24 bg-primary mx-auto rounded-full mb-6"></div>
                <p className="text-lg text-muted-foreground">Các khóa học được tuyển chọn kỹ lưỡng giúp bạn làm chủ kỹ năng mới.</p>
            </div>

            <FeaturedCoursesCarousel courses={featuredCourses} />
            
            <div className="mt-8 text-center sm:hidden">
                <Link href="/courses">
                    <Button variant="outline" size="lg" className="rounded-full px-8 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                        Xem tất cả <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </Link>
            </div>
        </div>
      </section>

      {/* --- VALUE PROPOSITION --- */}
      <section className="py-24 bg-muted/50 relative overflow-hidden transition-colors duration-300">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/30 dark:bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
               <div className="grid lg:grid-cols-2 gap-16 items-center">
                   
                   {/* Left: Heading & Content */}
                   <div className="max-w-xl">
                       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-primary/20 text-primary text-sm font-bold mb-6 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            GIÁ TRỊ CỐT LÕI
                       </div>
                       <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6 leading-tight">
                           Tại sao chọn <br/>
                           <span className="text-primary">Noble Academy?</span>
                       </h2>
                       <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-lg">
                           Hệ thống đào tạo ngôn ngữ chuẩn quốc tế, kết hợp công nghệ hiện đại và phương pháp giảng dạy tiên tiến giúp bạn bứt phá mọi giới hạn.
                       </p>
                       
                       <ul className="space-y-4 text-foreground">
                           {["Cam kết đầu ra bằng văn bản", "Hoàn tiền 100% nếu không đạt mục tiêu", "Hỗ trợ trọn đời ngay cả sau khi tốt nghiệp"].map((item, idx) => (
                               <li key={idx} className="flex items-center gap-3 font-medium">
                                   <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />
                                   {item}
                               </li>
                           ))}
                       </ul>
                   </div>

                   {/* Right: Grid Features */}
                   <div className="grid sm:grid-cols-2 gap-6">
                       {(
                           [
                               {
                                   title: "Giảng viên thực chiến",
                                   desc: "Đội ngũ chuyên gia hàng đầu với chứng chỉ quốc tế (IELTS 8.5+, TESOL, JLPT N1).",
                                   Icon: GraduationCap,
                               },
                               {
                                   title: "Chứng chỉ Blockchain",
                                   desc: "Xác thực năng lực toàn cầu với công nghệ bảo mật không thể làm giả.",
                                   Icon: BadgeCheck,
                               },
                               {
                                   title: "Lộ trình cá nhân hóa",
                                   desc: "Hệ thống AI phân tích và đề xuất lộ trình học tập tối ưu cho riêng bạn.",
                                   Icon: Target,
                               },
                               {
                                   title: "Cộng đồng tinh hoa",
                                   desc: "Mạng lưới kết nối học viên, cựu học viên và các nhà tuyển dụng hàng đầu.",
                                   Icon: Users,
                               },
                           ] as { title: string; desc: string; Icon: LucideIcon }[]
                       ).map((item, i) => (
                           <div key={i} className="group relative bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)] hover:border-primary/30 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1">
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

      {/* --- TESTIMONIAL VIDEO SECTION --- */}
      <section className="py-24 bg-background relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid lg:grid-cols-2 gap-16 items-center">
                   {/* Text */}
                   <div className="order-2 lg:order-1">
                       <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6 leading-tight">
                           Câu chuyện <span className="text-primary">Thành công</span>
                       </h2>
                       <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                           "Noble Academy không chỉ cung cấp kiến thức mà còn mở ra tầm nhìn mới. Nhờ sự hướng dẫn tận tình và giáo trình chuẩn quốc tế, mình đã chinh phục IELTS 8.0 chỉ sau 6 tháng."
                       </p>
                       
                       <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                                <img src="https://ui-avatars.com/api/?name=Nguyen+Ha&background=random&size=128" alt="Student" />
                           </div>
                           <div>
                               <h4 className="text-lg font-bold text-foreground">Nguyễn Thu Hà</h4>
                               <p className="text-sm text-primary font-medium">IELTS 8.0 - Alumni 2024</p>
                           </div>
                       </div>
                   </div>

                   {/* Video Thumbnail */}
                   <div className="order-1 lg:order-2">
                       <TestimonialVideo />
                   </div>
               </div>
          </div>
      </section>

    </div>
  );
}
