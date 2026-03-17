"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, MoreVertical, Loader2, BookOpen } from "lucide-react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Image from "next/image";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const { data: enrollments, error, isLoading } = useSWR(
    email ? `/api/student/my-courses?email=${email}` : null,
    fetcher
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (error) return <div>Failed to load courses</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Section */}
      <div className="bg-card rounded-[24px] p-8 shadow-sm border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
           <div>
               <h1 className="text-2xl font-bold text-foreground">Welcome back, {session?.user?.name || "Student"}! 👋</h1>
               <p className="text-muted-foreground mt-2">You are making great progress. Keep it up!</p>
           </div>
           
           <div className="hidden sm:flex bg-muted p-1 rounded-full border border-border">
               <Button variant="ghost" className="rounded-full bg-card shadow-sm text-foreground font-medium h-9 px-6">Overview</Button>
               <Button variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground h-9 px-6">Achievements</Button>
           </div>
      </div>

      {/* Course List */}
      <div>
         <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-foreground">My Courses</h2>
             <Link href="/courses">
                <Button variant="ghost" className="text-primary hover:bg-primary/10 rounded-full">Browse All Courses</Button>
             </Link>
         </div>
         
         {!enrollments || enrollments.length === 0 ? (
             <div className="text-center py-16 bg-card rounded-[24px] border border-border border-dashed">
                 <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                     <BookOpen className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-semibold text-foreground">No enrollments yet</h3>
                 <p className="text-muted-foreground mt-2 mb-6">Explore our catalog and start learning today.</p>
                 <Link href="/courses">
                    <Button className="rounded-full px-8">Browse Catalog</Button>
                 </Link>
             </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {enrollments.map((enrollment: any) => {
                     const course = enrollment.courseId;
                     return (
                     <div key={enrollment._id} className="group bg-card rounded-[24px] p-5 shadow-sm border border-border hover:shadow-xl transition-all hover:-translate-y-1">
                         <div className="aspect-[16/9] bg-muted rounded-2xl mb-4 relative overflow-hidden">
                              {course.thumbnail ? (
                                <Image src={course.thumbnail} alt={course.name} fill className="object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                                   <BookOpen className="w-12 h-12" />
                                </div>
                              )}
                              {/* Overlay Play Button */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                                  <PlayCircle className="h-14 w-14 text-white drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
                              </div>
                         </div>
                         
                         <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-foreground line-clamp-1 text-lg" title={course.name}>{course.name}</h3>
                             <button className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-5 w-5"/></button>
                         </div>
                         
                         <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4 font-medium">
                             <Clock className="h-3.5 w-3.5" /> 
                             {enrollment.lastAccessedAt ? `Last active ${new Date(enrollment.lastAccessedAt).toLocaleDateString()}` : "Not started yet"}
                         </p>
    
                         {/* Progress Bar */}
                         <div className="w-full bg-muted rounded-full h-2 mb-2">
                             <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{ width: `${enrollment.progress}%` }}></div>
                         </div>
                         <div className="flex justify-between text-xs text-muted-foreground mb-5 font-medium">
                             <span>{enrollment.progress}% Complete</span>
                             <span>{course.sections?.reduce((acc:any, sec:any) => acc + sec.units.length, 0) || 0} Lessons</span>
                         </div>
    
                         <Link href={`/learn/${course._id}`}>
                            <Button className="w-full rounded-full shadow-sm bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold transition-all">
                                {enrollment.progress > 0 ? "Continue Learning" : "Start Learning"}
                            </Button>
                         </Link>
                     </div>
                 )})}
             </div>
         )}
      </div>
    </div>
  );
}
