"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, BookOpen, Trophy, Flame, ArrowRight } from "lucide-react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Image from "next/image";

import { API_ENDPOINTS } from "@/constants/api-endpoints";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => (Array.isArray(json) ? json : (json?.data ?? [])));

export default function DashboardPage() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const { data: enrollments } = useSWR(
    email ? `${API_ENDPOINTS.STUDENT.MY_COURSES}?email=${email}` : null,
    fetcher
  );

  const courses = Array.isArray(enrollments) ? enrollments : [];
  const inProgress = courses.filter((c: any) => c.progress > 0 && c.progress < 100).length;
  const completed = courses.filter((c: any) => c.progress === 100).length;
  const recentCourses = courses.slice(0, 2); // Show top 2

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Section */}
      <div className="bg-card border border-primary/20 rounded-[32px] p-8 md:p-10 shadow-lg relative overflow-hidden">
           {/* Decor */}
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
           <div className="relative z-10">
               <h1 className="text-3xl font-serif font-bold text-foreground">Chào mừng trở lại, <span className="text-primary">{session?.user?.name || "Bạn"}</span>! 👋</h1>
               <p className="text-muted-foreground mt-2 text-lg max-w-xl">
                   Bạn đã duy trì phong độ học tập rất tốt. Hãy tiếp tục cố gắng nhé!
               </p>
               <div className="mt-8 flex gap-4">
                   <Link href="/student/learning">
                        <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 border-0 font-bold px-8 h-12 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                            Tiếp tục học
                        </Button>
                   </Link>
               </div>
           </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-[24px] border border-primary/10 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-colors">
              <div className="bg-primary/10 p-3 rounded-full text-primary border border-primary/20">
                  <Flame className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm text-muted-foreground font-medium">Chuỗi ngày học</p>
                  <p className="text-2xl font-bold text-foreground font-serif">3 Ngày</p>
              </div>
          </div>
          <div className="bg-card p-6 rounded-[24px] border border-primary/10 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-colors">
              <div className="bg-primary/10 p-3 rounded-full text-primary border border-primary/20">
                  <BookOpen className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm text-muted-foreground font-medium">Đang học</p>
                  <p className="text-2xl font-bold text-foreground font-serif">{inProgress} Khóa</p>
              </div>
          </div>
          <div className="bg-card p-6 rounded-[24px] border border-primary/10 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-colors">
              <div className="bg-primary/10 p-3 rounded-full text-primary border border-primary/20">
                  <Trophy className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm text-muted-foreground font-medium">Đã hoàn thành</p>
                  <p className="text-2xl font-bold text-foreground font-serif">{completed} Khóa</p>
              </div>
          </div>
      </div>

      {/* Recent Activity (Subset of Learning) */}
      <div>
         <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-foreground font-serif">Tiếp tục học tập</h2>
             <Link href="/student/learning" className="flex items-center gap-1 text-primary font-medium hover:underline">
                 Khóa học của tôi <ArrowRight className="w-4 h-4" />
             </Link>
         </div>
         
         {courses.length === 0 ? (
             <div className="text-center py-12 bg-card rounded-[24px] border border-primary/10 border-dashed">
                 <p className="text-muted-foreground">Chưa có khóa học nào bắt đầu.</p>
             </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {recentCourses.map((enrollment: any) => {
                     const course = enrollment.courseId;
                     if (!course) return null;
                     return (
                        <Link key={enrollment._id} href={`/student/learn/${course._id}`} className="block">
                            <div className="group bg-card rounded-[24px] p-4 pr-6 shadow-sm border border-primary/10 hover:shadow-[0_4px_20px_-5px_rgba(212,175,55,0.15)] hover:border-primary/30 transition-all flex gap-4 items-center">
                                <div className="h-24 w-32 relative rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                                    {course.thumbnail && <Image src={course.thumbnail} alt={course.name} fill className="object-cover" />}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                        <PlayCircle className="w-8 h-8 text-white opacity-90 group-hover:opacity-100 drop-shadow-md" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{course.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Hoạt động gần nhất {new Date(enrollment.lastAccessedAt).toLocaleDateString("vi-VN")}
                                    </p>
                                    <div className="mt-3">
                                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-medium">
                                            <span>{enrollment.progress}%</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${enrollment.progress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                     );
                 })}
             </div>
         )}
      </div>
    </div>
  );
}
