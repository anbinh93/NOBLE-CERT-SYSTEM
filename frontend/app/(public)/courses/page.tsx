import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlayCircle, Star, Users, Clock, Award } from "lucide-react";
import { CourseService } from "@/services/course.service";
import { Course } from "@/types/course";
import Image from "next/image";

export const dynamic = "force-dynamic";

const TOPIC_MAP: Record<string, string> = {
  "english": "Tiếng Anh",
  "japanese": "Tiếng Nhật",
  "korean": "Tiếng Hàn",
  "chinese": "Tiếng Trung",
  "ielts": "Luyện thi IELTS",
  "toeic": "Luyện thi TOEIC"
};

const GOAL_MAP: Record<string, string> = {
  "free": "Khóa học miễn phí",
  "cert": "Chứng chỉ chuyên nghiệp",
  "degree": "Bằng cấp",
  "skill": "Kỹ năng giao tiếp"
};

export default async function CoursesPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  
  const goal = searchParams?.goal as string | undefined;
  const topic = searchParams?.topic as string | undefined;
  const search = searchParams?.search as string | undefined;

  const courses: Course[] = await CourseService.getAllCourses({ topic, goal, search });
  
  const filteredCourses = courses;
  let pageTitle = "Khám phá các khóa học ngoại ngữ";
  let subTitle = "Tuyển chọn bởi CertiFlow";

  if (topic && TOPIC_MAP[topic]) {
      pageTitle = TOPIC_MAP[topic];
      subTitle = "Chủ đề phổ biến";
  } else if (goal && GOAL_MAP[goal]) {
      pageTitle = GOAL_MAP[goal];
      subTitle = "Đạt mục tiêu với";
  } else if (search) {
      pageTitle = `Kết quả cho "${search}"`;
      subTitle = "Kết quả tìm kiếm";
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* 1. HERO / VALUE PROPS */}
      <div className="bg-card border-b border-primary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-12 max-w-4xl leading-tight">
                Chinh phục ngôn ngữ mới cùng <span className="text-primary font-medium">CertiFlow</span>
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="flex flex-col gap-4">
                     <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Users className="w-6 h-6 text-primary" />
                     </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground mb-2">Dành cho mọi trình độ</h3>
                        <p className="text-muted-foreground leading-relaxed">Từ người mới bắt đầu đến nâng cao, chúng tôi có lộ trình phù hợp cho bạn.</p>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                     <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Clock className="w-6 h-6 text-primary" />
                     </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground mb-2">Học theo tốc độ của bạn</h3>
                        <p className="text-muted-foreground leading-relaxed">Linh hoạt thời gian, học mọi lúc mọi nơi trên mọi thiết bị.</p>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                     <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Award className="w-6 h-6 text-primary" />
                     </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground mb-2">Chứng chỉ uy tín</h3>
                        <p className="text-muted-foreground leading-relaxed">Nhận chứng chỉ hoàn thành khóa học để bổ sung vào hồ sơ năng lực.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* 2. COLLECTIONS */}
        <section>
            <div className="mb-8">
                <h2 className="text-sm font-medium text-primary uppercase tracking-wider mb-2 border-b border-primary/20 inline-block pb-1">{subTitle}</h2>
                <h3 className="text-2xl font-serif font-bold text-foreground">{pageTitle}</h3>
            </div>

            {filteredCourses.length === 0 ? (
                <div className="text-center py-20 bg-card/50 rounded-2xl border border-primary/10">
                    <p className="text-muted-foreground text-lg">Không tìm thấy khóa học nào phù hợp.</p>
                    <Link href="/courses">
                        <Button variant="link" className="text-primary mt-2 hover:text-primary/80">Xóa bộ lọc</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredCourses.map((course: any, idx: number) => (
                        <Link key={course._id} href={`/courses/${course.slug}`} className="group flex flex-col h-full bg-card border border-primary/10 rounded-[20px] shadow-sm hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.15)] hover:border-primary/50 transition-all duration-300 overflow-hidden">
                            {/* Thumbnail */}
                            <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                                {course.thumbnail ? (
                                    <Image 
                                        src={course.thumbnail} 
                                        alt={course.name} 
                                        width={400} 
                                        height={250} 
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                                        <PlayCircle className="w-12 h-12 opacity-50" />
                                    </div>
                                )}
                                {/* AI Badge (Mock) -> Changed to TOP */}
                                {idx % 2 === 0 && (
                                    <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-primary shadow-sm border border-primary/20 flex items-center gap-1">
                                        ✨ Phổ biến
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                    {/* Mock Logo */}
                                    <div className="w-6 h-6 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary text-[10px] font-bold">C</div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CertiFlow</span>
                                </div>

                                <h3 className="font-bold text-foreground text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2 title-font">
                                    {course.name}
                                </h3>

                                <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                                    {course.category || "Chứng chỉ chuyên nghiệp"}
                                </p>

                                <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                    <span className="flex items-center gap-1 text-primary">
                                        <Star className="w-3.5 h-3.5 fill-primary" /> 4.8
                                    </span>
                                    <span className="text-primary/20">•</span>
                                    <span>{course.duration || "3 tháng"}</span>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between">
                                    <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-1 rounded-md border border-primary/20">Chứng chỉ</span>
                                    <span className="text-sm font-bold text-primary">
                                         {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price || 0)}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            
            {filteredCourses.length > 0 && (
                <div className="mt-12 text-center">
                    <Button variant="outline" className="px-8 py-6 rounded-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-bold">
                        Xem thêm
                    </Button>
                </div>
            )}
        </section>

        {/* 3. TESTIMONIALS */}
        <section className="bg-card rounded-[32px] p-8 md:p-12 border border-primary/20 shadow-lg relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <h2 className="text-2xl font-serif font-bold text-foreground mb-10 text-center relative z-10">Học viên nói gì về chúng tôi</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                <div className="relative rounded-2xl overflow-hidden aspect-video shadow-xl group cursor-pointer bg-muted border border-primary/10">
                     {/* Placeholder Video Thumb */}
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center text-primary-foreground shadow-[0_0_30px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform">
                            <PlayCircle className="w-8 h-8 fill-current" />
                         </div>
                     </div>
                </div>

                <div className="space-y-10 px-4">
                    <div className="relative">
                        <div className="text-5xl text-primary/20 absolute -top-8 -left-6 select-none font-serif">“</div>
                        <p className="text-xl text-foreground/90 leading-relaxed relative z-10 font-medium">
                            Khóa học Chứng chỉ tại CertiFlow đã <strong className="text-primary">giúp tôi tự tin hơn</strong> khi ứng tuyển vào các công ty đa quốc gia. Tôi không có nền tảng ngôn ngữ từ trước nhưng cách giảng dạy thực tế đã giúp tôi tiến bộ rất nhanh.
                        </p>
                        <div className="flex items-center gap-4 mt-6">
                            <div className="w-10 h-10 bg-muted rounded-full overflow-hidden border border-primary/30">
                                <img src="https://ui-avatars.com/api/?name=Minh+Tuan" alt="User" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">Minh Tuấn</p>
                                <p className="text-xs text-primary font-bold tracking-wider">BUSINESS ANALYST</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="text-5xl text-primary/20 absolute -top-8 -left-6 select-none font-serif">“</div>
                         <p className="text-xl text-foreground/90 leading-relaxed relative z-10 font-medium">
                            Nội dung được <strong className="text-primary">sắp xếp hợp lý và dễ tiếp cận</strong> ngay cả với người mới. Tôi thích sự đa dạng của các bài tập và bài kiểm tra.
                         </p>
                         <div className="flex items-center gap-4 mt-6">
                             <div className="w-10 h-10 bg-muted rounded-full overflow-hidden border border-primary/30">
                                <img src="https://ui-avatars.com/api/?name=Lan+Anh" alt="User" />
                             </div>
                             <div>
                                 <p className="text-sm font-bold text-foreground">Lan Anh</p>
                                 <p className="text-xs text-primary font-bold tracking-wider">MARKETING</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

      </main>
    </div>
  );
}
