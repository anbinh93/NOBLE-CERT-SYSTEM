"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { CourseProvider, useCourse } from "./course-context";
import { Loader2, PlayCircle, FileText, CheckCircle, ChevronDown, ChevronRight, Menu, X, ArrowLeft, Lock } from "lucide-react";
import { cn } from "@/components/ui/button";
import { Button } from "@/components/ui/button";

// Internal wrapper to use the context
function LearningLayoutContent({ children, params }: { children: React.ReactNode, params: any }) {
    const { course, loading, completedUnits, examScore, isCertified } = useCourse();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedSections, setExpandedSections] = useState<number[]>([]);
    
    // Check if we are in the Player (viewing a unit) or Overview
    // Overview path: /student/learn/[courseId]
    // Player path: /student/learn/[courseId]/[unitId]
    const isOverview = pathname === `/student/learn/${params.courseId}`;
    
    // Auto-expand sidebar sections on load
    useEffect(() => {
        if (course?.sections && expandedSections.length === 0) {
            // Default expand all or just the active one
             // Find active unit from pathname if possible, but pathname parsing is brittle
             // Just expand all for now for better UX
             setExpandedSections(course.sections.map((_, idx) => idx));
        }
    }, [course, expandedSections.length]);

    const toggleSection = (index: number) => {
        setExpandedSections(prev => 
          prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <p className="text-lg font-medium text-foreground">Bạn chưa đăng ký khoá học này</p>
                    <p className="text-sm text-muted-foreground">Vui lòng đăng ký trước khi truy cập nội dung.</p>
                    <a href="/student/dashboard" className="inline-block mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:bg-primary/90 transition-colors">
                        Quay lại Dashboard
                    </a>
                </div>
            </div>
        );
    }

    // IF OVERVIEW: Render plain children (layout is full width)
    // IF PLAYER: Render Sidebar + Content
    if (isOverview) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-background text-foreground font-sans">
             <div className="flex-1 flex overflow-hidden">
                {/* LEFT SIDEBAR - PERSISTENT */}
                <aside 
                    className={cn(
                        "flex-shrink-0 bg-card border-r border-primary/10 flex flex-col transition-all duration-300 z-20 absolute md:relative h-full",
                        sidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full opacity-0 overflow-hidden"
                    )}
                >
                    <div className="flex flex-col border-b border-primary/10 bg-card z-10 p-4">
                        <Link href={`/student/learn/${params.courseId}`} className="group flex items-center gap-3 px-2 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4 rounded-lg hover:bg-primary/10">
                            <div className="p-1 bg-muted group-hover:bg-primary/20 rounded-md transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            Quay lại tổng quan
                        </Link>
                        <h2 className="font-bold text-foreground leading-tight px-2">{course.name}</h2>
                        
                        <div className="flex items-center gap-2 mt-4 px-2 text-xs text-muted-foreground">
                             <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${(completedUnits.length / (course.sections?.reduce((acc, s) => acc + (s.units?.length || 0), 0) || 1)) * 100}%` }}
                                 />
                             </div>
                             <span>{Math.round((completedUnits.length / (course.sections?.reduce((acc, s) => acc + (s.units?.length || 0), 0) || 1)) * 100)}% Hoàn thành</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-card p-4 space-y-4">
                         {(() => {
                            let isPrevUnitCompleted = true;
                            // Pre-calculate locks? No, we can do it in render loop if we iterate sequentially.
                            // However, we are mixing Sections and Units.
                            // We need to know if the FIRST unit of the section is locked.
                            
                            return course.sections?.map((section, sIdx) => {
                                const isExpanded = expandedSections.includes(sIdx);
                                
                                // Check if section is locked based on previous progress
                                // A section is locked if the first unit of it would be locked.
                                // BUT we calculate unit locks sequentially.
                                // Let's peek at the lock state of the first unit of this section.
                                // Actually, `isPrevUnitCompleted` tells us if the NEXT unit is unlocked.
                                // So at the start of this section, `isPrevUnitCompleted` tells us if the FIRST unit of this section is unlocked.
                                // If unlocked, Section is unlocked.
                                
                                // Exception: First section is always unlocked initially (if isPrevUnitCompleted initialized to true)
                                // UNLESS the backend explicitly locks it? We ignore backend locks for now and use client logic.
                                
                                const isSectionLocked = !isPrevUnitCompleted;
                                
                                return (
                                    <div key={sIdx} className="bg-transparent">
                                        <button 
                                            onClick={() => !isSectionLocked && toggleSection(sIdx)}
                                            disabled={isSectionLocked}
                                            className={cn(
                                                "w-full flex items-center justify-between py-2 text-left transition-colors group",
                                                isSectionLocked ? "opacity-50 cursor-not-allowed" : "hover:text-primary"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {isSectionLocked && <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center"><Lock className="w-2.5 h-2.5 text-muted-foreground" /></div>}
                                                <h4 className={cn("text-sm font-bold truncate", isSectionLocked ? "text-muted-foreground" : "text-foreground group-hover:text-primary")}>
                                                    {section.title}
                                                </h4>
                                            </div>
                                            {!isSectionLocked && (isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />)}
                                        </button>
                                        
                                        {!isSectionLocked && isExpanded && (
                                            <div className="mt-1 space-y-1 pl-2">
                                                {section.units?.map((unit, uIdx) => {
                                                    const isActive = pathname === `/student/learn/${params.courseId}/${unit._id}`;
                                                    const isCompleted = unit._id ? completedUnits.includes(unit._id) : false;
                                                    const isUnitLocked = !isPrevUnitCompleted;
                                                    
                                                    // Update for next unit
                                                    if (!isCompleted) isPrevUnitCompleted = false;

                                                    if (isUnitLocked) {
                                                         return (
                                                            <div key={uIdx} className="flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground cursor-not-allowed select-none opacity-50">
                                                                <div className="mt-0.5 flex-shrink-0">
                                                                    <Lock className="w-4 h-4 text-muted-foreground/70" />
                                                                </div>
                                                                <span className="leading-snug">{unit.title}</span>
                                                            </div>
                                                         );
                                                    }

                                                    return (
                                                        <Link 
                                                            key={uIdx}
                                                            href={`/student/learn/${params.courseId}/${unit._id}`}
                                                            className={cn(
                                                                "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm relative group",
                                                                isActive 
                                                                    ? "bg-primary/10 text-primary font-medium" 
                                                                    : "text-muted-foreground hover:bg-muted/60"
                                                            )}
                                                        >
                                                            <div className="mt-0.5 flex-shrink-0">
                                                                {isCompleted ? (
                                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                                ) : (
                                                                    unit.type === "VIDEO" ? <PlayCircle className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} /> : <FileText className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                                                )}
                                                            </div>
                                                            <span className="leading-snug">{unit.title}</span>
                                                            
                                                            {/* Active Indicator */}
                                                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>}
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        )}
                                        {/* If we are skipping rendering units because it's collapsed, we still need to calculate process! 
                                            Wait. If isExpanded is false, we DON'T execute the inner map.
                                            So isPrevUnitCompleted won't be updated!
                                            CRITICAL: We MUST calculate the status for ALL units regardless of expansion.
                                        */}
                                        {!isExpanded && !isSectionLocked && (
                                            <div className="hidden">
                                                {/* Hidden Calculation Loop */}
                                                {(() => {
                                                    section.units?.forEach((unit) => {
                                                        const isCompleted = unit._id ? completedUnits.includes(unit._id) : false;
                                                        if (!isCompleted) isPrevUnitCompleted = false;
                                                    });
                                                    return null;
                                                })()}
                                            </div>
                                        )}
                                        
                                        { /* If section is locked, we assume NO units in it are completed, and all subsequent units/sections are locked.
                                             So we can just set isPrevUnitCompleted = false; (It is already false if we are here) 
                                        */ }
                                    </div>
                                    )
                                })
                          })()}

                        {/* FINAL EXAM SECTION */}
                        <div className="bg-transparent">
                            <button 
                                onClick={() => toggleSection(999)}
                                className="w-full flex items-center justify-between py-2 text-left hover:text-primary transition-colors group"
                            >
                                <h4 className="text-sm font-bold text-foreground group-hover:text-primary flex-1">Bài thi cuối khóa</h4>
                                {expandedSections.includes(999) ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            
                            {expandedSections.includes(999) && (
                                <div className="mt-1 space-y-1 pl-2">
                                     {/* Exam Item */}
                                     {(() => {
                                         // Logic: Exam is locked if course not fully completed.
                                         // Exam is "CheckCircle" if examScore >= 50. (Or isCertified is true)
                                         // Exam is "FileText" (blue/slate) if unlocked but not passed.
                                         
                                         const isCourseCompleted = completedUnits.length >= (course.sections?.reduce((acc, s) => acc + (s.units?.length || 0), 0) || 1);
                                         const isExamPassed = examScore >= 50; 
                                         const isExamLocked = !isCourseCompleted;

                                         // However, if I already passed the exam, it should be unlocked regardless? 
                                         // Theoretically yes. But strict order says you must complete course first.
                                         
                                         return (
                                            <Link 
                                                href={isExamLocked ? "#" : `/student/learn/${params.courseId}/exam`}
                                                className={cn(
                                                    "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm relative group",
                                                    pathname.includes("/exam") 
                                                        ? "bg-primary/10 text-primary font-medium" 
                                                        : isExamLocked ? "text-muted-foreground opacity-50 cursor-not-allowed" : "text-muted-foreground hover:bg-muted/60"
                                                )}
                                                onClick={(e) => isExamLocked && e.preventDefault()}
                                            >
                                                <div className="mt-0.5 flex-shrink-0">
                                                    {isExamPassed ? (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    ) : isExamLocked ? (
                                                        <Lock className="w-4 h-4 text-muted-foreground/70" />
                                                    ) : (
                                                         <FileText className={cn("w-4 h-4", pathname.includes("/exam") ? "text-primary" : "text-muted-foreground")} />
                                                    )}
                                                </div>
                                                <span className="leading-snug">Bài thi trắc nghiệm</span>
                                                {pathname.includes("/exam") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>}
                                            </Link>
                                         );
                                     })()}

                                    {/* Certificate Item */}
                                     {(() => {
                                         // Logic: Cert is locked if Exam not passed (<50).
                                         // Cert is "CheckCircle" if isCertified (user claimed it).
                                         // Cert is "Star/File" if unlocked (ready to claim).
                                         
                                         const isExamPassed = examScore >= 50;
                                         const isCertLocked = !isExamPassed;
                                         const isClaimed = isCertified;

                                         return (
                                            <Link 
                                                href={isCertLocked ? "#" : `/student/certificates/claim/${params.courseId}`}
                                                className={cn(
                                                    "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm relative group",
                                                    pathname.includes("/claim") 
                                                        ? "bg-primary/10 text-primary font-medium" 
                                                        : isCertLocked ? "text-muted-foreground opacity-50 cursor-not-allowed" : "text-muted-foreground hover:bg-muted/60"
                                                )}
                                                onClick={(e) => isCertLocked && e.preventDefault()}
                                            >
                                                <div className="mt-0.5 flex-shrink-0">
                                                    {isClaimed ? (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    ) : isCertLocked ? (
                                                        <Lock className="w-4 h-4 text-muted-foreground/70" />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40" />
                                                    )}
                                                </div>
                                                <span className="leading-snug">Nhận chứng chỉ</span>
                                                {pathname.includes("/claim") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>}
                                            </Link>
                                         )
                                     })()}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                 {/* Main Content Area Wrapper */}
                <main className="flex-1 flex flex-col overflow-hidden relative w-full bg-background">
                    {/* Mobile Toggle */}
                     <div className="md:hidden h-12 border-b border-primary/10 flex items-center px-4 bg-card flex-shrink-0">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1">
                            {sidebarOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
                        </button>
                        <span className="ml-3 font-bold text-sm text-foreground truncate">{course.name}</span>
                     </div>
                     
                     <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                         {/* Toggle Button Desktop (Floating) */}
                         <button 
                             onClick={() => setSidebarOpen(!sidebarOpen)}
                             className="hidden md:flex absolute top-4 left-4 z-30 w-8 h-8 items-center justify-center bg-card border border-primary/20 rounded-full shadow-sm text-muted-foreground hover:text-primary hover:shadow-md transition-all"
                             title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                         >
                             {sidebarOpen ? <ChevronLeftIcon className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                         </button>

                         {children}
                     </div>
                </main>
             </div>
        </div>
    )
}

function ChevronLeftIcon({ className }: { className?: string }) {
    return <ChevronRight className={cn("rotate-180", className)} />
}


export default function LearningLayout({ children, params }: { children: React.ReactNode, params: Promise<any> }) {
  const unwrappedParams = use(params);
  // params.courseId is available via unwrappedParams
  return (
    <CourseProvider courseId={unwrappedParams.courseId}>
       <LearningLayoutContent params={unwrappedParams}>
          {children}
       </LearningLayoutContent>
    </CourseProvider>
  );
}
