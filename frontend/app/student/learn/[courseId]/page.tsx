"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { useCourse } from "./course-context";
import { Loader2, PlayCircle, FileText, CheckCircle, Trophy, Clock, BookOpen, ChevronLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function CourseOverviewPage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const { course, loading, completedUnits, isCertified, certificateSerial } = useCourse();

  const resumeUnitId = useMemo(() => {
    if (!course?.sections) return null;
    let firstIncomplete: string | null = null;
    for (const section of course.sections) {
      if (section.units) {
        for (const unit of section.units) {
          if (unit._id && !completedUnits.includes(unit._id)) {
            firstIncomplete = unit._id;
            break;
          }
        }
      }
      if (firstIncomplete) break;
    }
    return firstIncomplete || course.sections?.[0]?.units?.[0]?._id || null;
  }, [course, completedUnits]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) return null;
  
  const totalUnits = course.sections?.reduce((bcc, s) => bcc + (s.units?.length || 0), 0) || 0;
  const completedCount = completedUnits.length;
  const progressPercent = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Nav */}
        <div>
            <Link href="/student/learning" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-4 py-2 hover:bg-card rounded-full">
                <ChevronLeft className="w-4 h-4" /> Quay lại khoá học của tôi
            </Link>
        </div>

        {/* Header Block */}
        <div className="bg-card rounded-[32px] p-8 md:p-12 shadow-sm border border-primary/10 relative overflow-hidden group">
             {/* Decorative Background */}
             <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                 <div className="flex-1">
                     <div className="flex items-center gap-3 text-primary mb-4 text-sm font-bold uppercase tracking-wider">
                         <span className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Course</span>
                         <span>{course.sections?.length} Module</span>
                     </div>
                     <h1 className="text-3xl md:text-5xl font-serif font-medium text-foreground leading-tight mb-6">{course.name}</h1>
                     <p className="text-muted-foreground text-lg max-w-2xl line-clamp-2">{course.description}</p>
                     
                     <div className="flex items-center gap-6 mt-8">
                         <Link href={resumeUnitId ? `/student/learn/${courseId}/${resumeUnitId}` : "#"}>
                            <Button size="lg" className="rounded-full h-14 px-8 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_20px_-5px_rgba(212,175,55,0.4)]">
                                {progressPercent > 0 ? "Tiếp tục học" : "Bắt đầu học ngay"} <PlayCircle className="w-5 h-5 ml-2" />
                            </Button>
                         </Link>
                         <div className="hidden md:flex flex-col">
                             <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Đã hoàn thành {progressPercent}%</span>
                             <div className="w-32 h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                                 <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                             </div>
                         </div>
                     </div>
                 </div>
                 
                 {course.thumbnail && (
                     <div className="hidden md:block w-72 h-48 relative rounded-2xl overflow-hidden shadow-lg border border-primary/20 rotate-3 group-hover:rotate-0 transition-all duration-500">
                         <Image src={course.thumbnail} alt={course.name} fill className="object-cover" />
                     </div>
                 )}
             </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column: Syllabus */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-serif font-medium text-foreground flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-primary" /> Nội dung khóa học
                    </h2>
                    <span className="text-sm text-muted-foreground font-medium">{completedCount} / {totalUnits} bài học</span>
                </div>

                <div className="space-y-6">
                <div className="space-y-6">
                    {(() => {
                        let isPrevUnitCompleted = true;
                        return course.sections?.map((section, sIdx) => (
                            <div key={sIdx} className="bg-card rounded-[24px] border border-primary/10 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 bg-card border-b border-primary/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-primary partially-underline uppercase tracking-widest mb-1">Phần {sIdx + 1}</p>
                                        <h3 className="text-lg font-medium text-foreground">{section.title}</h3>
                                    </div>
                                    <span className="text-xs font-medium bg-secondary border border-primary/10 px-3 py-1 rounded-full text-muted-foreground">
                                        {section.units?.length} bài
                                    </span>
                                </div>
                                <div className="divide-y divide-primary/5">
                                    {section.units?.map((unit, uIdx) => {
                                        const isDone = unit._id ? completedUnits.includes(unit._id) : false;
                                        const isLocked = !isPrevUnitCompleted;
                                        
                                        if (!isDone) {
                                            isPrevUnitCompleted = false;
                                        }

                                        return (
                                            <Link 
                                                key={uIdx} 
                                                href={isLocked ? "#" : `/student/learn/${courseId}/${unit._id}`}
                                                className={`group flex items-center gap-5 px-8 py-5 transition-colors ${
                                                    isLocked 
                                                        ? "opacity-50 cursor-not-allowed bg-muted/30" 
                                                        : "hover:bg-primary/5 cursor-pointer"
                                                }`}
                                                onClick={(e) => isLocked && e.preventDefault()}
                                            >
                                                <div className="flex-shrink-0">
                                                    {isDone ? (
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                            <CheckCircle className="w-5 h-5" />
                                                        </div>
                                                    ) : isLocked ? (
                                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
                                                            <Lock className="w-4 h-4" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors border border-primary/10">
                                                            {unit.type === "VIDEO" ? <PlayCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium text-base truncate ${isDone ? "text-muted-foreground line-through" : isLocked ? "text-muted-foreground/50" : "text-foreground group-hover:text-primary"}`}>
                                                        {unit.title}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" /> {unit.duration}
                                                        </span>
                                                        {isLocked && <span className="text-xs text-orange-400 font-medium">Chưa mở</span>}
                                                    </div>
                                                </div>
                                                <div className={`opacity-0 ${!isLocked && "group-hover:opacity-100"} transition-opacity`}>
                                                     <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="rounded-full h-9 px-4 text-xs font-bold bg-card/80 hover:bg-card text-primary border border-primary/20"
                                                        disabled={isLocked}
                                                     >
                                                        {isLocked ? "Bị khóa" : "Vào học"}
                                                     </Button>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
                 {/* FINAL EXAM SECTION */}
                 <div className="bg-card rounded-[24px] border border-primary/10 shadow-sm overflow-hidden mt-6">
                    <div className="px-8 py-6 bg-card border-b border-primary/5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-primary partially-underline uppercase tracking-widest mb-1">Đánh giá cuối khóa</p>
                            <h3 className="text-lg font-medium text-foreground">Bài kiểm tra & Chứng nhận</h3>
                        </div>
                    </div>
                    <div className="divide-y divide-primary/5">
                        {(() => {
                           const isExamLocked = progressPercent < 100;
                           const isExamPassed = isCertified || false;
                           
                           return (
                               <Link 
                                    href={isExamLocked ? "#" : `/student/learn/${courseId}/exam`}
                                     className={`group flex items-center gap-5 px-8 py-5 transition-colors ${
                                         isExamLocked 
                                             ? "opacity-50 cursor-not-allowed bg-muted/30" 
                                             : "hover:bg-primary/5 cursor-pointer"
                                     }`}
                                    onClick={(e) => isExamLocked && e.preventDefault()}
                                >
                                    <div className="flex-shrink-0">
                                        {isExamPassed ? (
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                        ) : isExamLocked ? (
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors border border-primary/10">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium text-base truncate ${isExamLocked ? "text-muted-foreground/50" : "text-foreground group-hover:text-primary"}`}>
                                            Bài thi trắc nghiệm cuối khóa
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" /> 45 phút
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5" /> 10 câu hỏi
                                            </span>
                                            {isExamLocked && <span className="text-xs text-orange-400 font-medium">Chưa mở</span>}
                                        </div>
                                    </div>
                                    <div className={`opacity-0 ${!isExamLocked && "group-hover:opacity-100"} transition-opacity`}>
                                            <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="rounded-full h-9 px-4 text-xs font-bold bg-card/80 hover:bg-card text-primary border border-primary/20"
                                            disabled={isExamLocked}
                                            >
                                            {isExamLocked ? "Bị khóa" : "Làm bài"}
                                            </Button>
                                    </div>
                                </Link>
                           );
                        })()}
                    </div>
                </div>
                </div>
            </div>

            {/* Sidebar Column: Cert & Stats */}
            <div className="space-y-6">
                <div className="bg-card rounded-[24px] border border-primary/10 p-8 shadow-sm">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 border border-primary/20">
                        <Trophy className="w-7 h-7" />
                    </div>
                    <h3 className="font-serif font-medium text-xl text-foreground mb-3">Chứng nhận hoàn thành</h3>
                    <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                        Hoàn thành tất cả các bài học để nhận chứng chỉ xác nhận kỹ năng của bạn từ CertiFlow.
                    </p>
                    <div className="p-5 bg-secondary/50 rounded-2xl border border-primary/5 mb-6">
                        <div className="flex justify-between text-sm font-medium mb-3">
                             <span className="text-foreground">Tiến độ hiện tại</span>
                             <span className="text-primary">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                             <div className="bg-primary h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                    {isCertified ? (
                        <Link href={certificateSerial ? `/verify/${certificateSerial}` : `/student/certificates/claim/${courseId}`} className="block w-full" target={certificateSerial ? "_blank" : "_self"}>
                            <Button className="w-full rounded-full py-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" size="lg">
                                <CheckCircle className="w-5 h-5 mr-2" /> Xem chứng chỉ
                            </Button>
                        </Link>
                    ) : progressPercent >= 100 ? (
                         <Link href={`/student/certificates/claim/${courseId}`} className="block w-full">
                            <Button className="w-full rounded-full py-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_20px_-5px_rgba(212,175,55,0.4)] animate-pulse" size="lg">
                                <Trophy className="w-5 h-5 mr-2" /> Nhận chứng chỉ ngay
                            </Button>
                        </Link>
                    ) : (
                        <Button className="w-full rounded-full py-6 font-bold bg-secondary text-muted-foreground hover:bg-secondary cursor-not-allowed shadow-none border border-primary/5" variant="secondary" disabled>
                            Nhận chứng chỉ (Chưa mở)
                        </Button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
