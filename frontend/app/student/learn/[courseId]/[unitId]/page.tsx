"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, ComponentType } from "react";
import Link from "next/link";
import { 
  CheckCircle, ChevronRight, ChevronDown,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { useCourse } from "../course-context";

// Dynamic import to fix Hydration/SSR issues
const VideoPlayer = dynamic(
  () => import("@/components/learning/VideoPlayer").then((m) => ({ default: m.VideoPlayer })),
  { ssr: false }
) as ComponentType<any>;

const QuizViewer = dynamic(
  () => import("@/components/learning/QuizViewer"),
  { ssr: false }
) as ComponentType<any>;

export default function LearningPlayerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;
  const unitId = params?.unitId as string;

  const { course, loading, completedUnits, markUnitComplete } = useCourse();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true) }, []);

  const handleProgress = (completedUnitId: string) => {
    markUnitComplete(completedUnitId);
  };

  // Derived state
  const activeUnit = course?.sections?.flatMap(s => s.units).find(u => u._id === unitId) || null;

  // Check for locked access (Client-side logic)
  useEffect(() => {
    if (!course || !activeUnit) return;

    // Flatten all units to check order
    const allUnits = course.sections?.flatMap(s => s.units) || [];
    const currentIndex = allUnits.findIndex(u => u._id === unitId);
    
    // Logic: A unit is locked if the PREVIOUS unit is not in completedUnits.
    // First unit (index 0) is always unlocked.
    if (currentIndex > 0) {
        const prevUnit = allUnits[currentIndex - 1];
        if (prevUnit._id && !completedUnits.includes(prevUnit._id)) {
             // Redirect to overview if previous unit is not done
             // console.log("Redirecting because prev unit not done:", prevUnit.title);
             router.push(`/student/learn/${courseId}`);
        }
    }
  }, [course, activeUnit, unitId, courseId, router, completedUnits]);
  
  // Navigation Helper
  const getNextUnitUrl = () => {
    if (!course || !activeUnit) return null;
    const sections = course.sections || [];
    let currentSectionIndex = -1;
    let currentUnitIndex = -1;

    sections.forEach((section, sIdx) => {
        const uIdx = section.units.findIndex(u => u._id === activeUnit._id);
        if (uIdx !== -1) {
            currentSectionIndex = sIdx;
            currentUnitIndex = uIdx;
        }
    });

    if (currentSectionIndex === -1) return null;

    const currentSection = sections[currentSectionIndex];
    if (currentUnitIndex < currentSection.units.length - 1) {
        return `/student/learn/${courseId}/${currentSection.units[currentUnitIndex + 1]._id}`;
    } else if (currentSectionIndex < sections.length - 1) {
        const nextSection = sections[currentSectionIndex + 1] as any;
        
        // CHECK IF NEXT SECTION IS LOCKED
        // If locked, we cannot go there.
        // Wait, if it IS locked, we should probably redirect to Exam or Overview or just stop?
        // But usually finishing the last unit of current section UNLOCKS the next section.
        // The problem is that the state update (markComplete) happens, but the `course` data might still be stale 
        // until `refreshProgress` is called or re-fetched.
        // Ideally we assume if we just finished the last unit, the next one SHOULD be open.
        // But if the backend says it's locked, we respect it.
        // We will optimistically assume completing this unit unlocks the next section if requirements met.
        // BUT logic wise, `handleProgress` is called first. 
        // We should trigger a refresh?
        
        if (nextSection.isLocked) {
             // If locked, maybe we shouldn't show "Next" or it should go to Overview?
             // Or maybe we still try, and let the backend re-calculation handle it on the next page load.
             // If we rely on the Guard above, navigating there will redirect us back if it's TRULY locked.
             // But for better UX, let's allow navigation attempts if we just finished the prerequisite.
             // UNLESS it's strictly locked.
             // Let's rely on the Guard. The user clicks "Next", data updates, page loads, 
             // if backend still says locked (e.g. didn't finish other reqs), Guard kicks them out.
             // But usually it should unlock.
             // However, for strictly locked future modules (e.g. drip content), we should block.
             // Since we only have sequential unlocking, it should be fine.
        }

        if (nextSection.units.length > 0) {
            return `/student/learn/${courseId}/${nextSection.units[0]._id}`;
        }
    }
    return `/student/learn/${courseId}/exam`; // Next is Exam
  };

  const getPrevUnitUrl = () => {
      if (!course || !activeUnit) return null;
      const sections = course.sections || [];
      let currentSectionIndex = -1;
      let currentUnitIndex = -1;
  
      sections.forEach((section, sIdx) => {
          const uIdx = section.units.findIndex(u => u._id === activeUnit._id);
          if (uIdx !== -1) {
              currentSectionIndex = sIdx;
              currentUnitIndex = uIdx;
          }
      });
  
      if (currentSectionIndex === -1) return null;
  
      if (currentUnitIndex > 0) {
          const currentSection = sections[currentSectionIndex];
          return `/student/learn/${courseId}/${currentSection.units[currentUnitIndex - 1]._id}`;
      } else if (currentSectionIndex > 0) {
          const prevSection = sections[currentSectionIndex - 1];
          if (prevSection.units.length > 0) {
              return `/student/learn/${courseId}/${prevSection.units[prevSection.units.length - 1]._id}`;
          }
      }
      return `/student/learn/${courseId}`; // Back to overview
  };

  const handleNext = async () => {
    // Only navigate. Completion must be done via "Mark Complete" or Video End.
      const nextUrl = getNextUnitUrl();
      if (nextUrl) router.push(nextUrl);
  };

  // If loading, context handles it or we show simple spinner
  if (loading) return null; // Context layout handles global spinner usually
  if (!course || !activeUnit) return <div className="p-10 text-center text-muted-foreground">Không tìm thấy bài học</div>;

  const breadcrumbItems = [
      { label: "Khóa học", href: `/student/learn/${course._id}` },
      { label: activeUnit.title }
  ];

  const nextUrl = getNextUnitUrl();
  const prevUrl = getPrevUnitUrl();
  const isLast = nextUrl?.includes("claim");
  
  const isCurrentCompleted = activeUnit._id ? completedUnits.includes(activeUnit._id) : false;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
       {/* Top Bar inside Content Area */}
       <div className="h-16 border-b border-primary/10 flex items-center justify-between px-6 shrink-0 bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
           <div className="flex items-center gap-4 pl-8 md:pl-0">
               <div className="hidden sm:block">
                    <Breadcrumbs items={breadcrumbItems} />
               </div>
           </div>

           <div>
               <Button 
                    variant="outline" 
                    size="sm" 
                    className="hidden sm:flex border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-foreground rounded-full transition-all" 
                    onClick={handleNext}
                    disabled={!isCurrentCompleted}
               >
                   {isLast ? "Hoàn thành khóa học" : "Bài tiếp theo"} 
                   {isLast ? <CheckCircle className="w-4 h-4 ml-1 text-green-600" /> : <ChevronRight className="w-4 h-4 ml-1" />}
               </Button>
           </div>
       </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-medium text-foreground leading-tight">{activeUnit.title}</h1>
                </div>

                {activeUnit.type === "VIDEO" ? (
                    <div>
                        {isClient && activeUnit.contentUrl ? (
                            <VideoPlayer
                                courseId={courseId}
                                unitId={unitId}
                                url={activeUnit.contentUrl}
                                onComplete={() => activeUnit._id && handleProgress(activeUnit._id)}
                            />
                        ) : (
                            <div className="aspect-video bg-foreground rounded-[24px] border border-primary/20 flex items-center justify-center text-primary-foreground/50 text-sm">
                                Không tìm thấy liên kết Video
                            </div>
                        )}
                    </div>
                ) : (activeUnit.type === "QUIZ" || activeUnit.type === "EXAM") ? (
                    <div className="bg-card border border-primary/10 rounded-[24px] p-8 md:p-12 shadow-[0_4px_20px_-5px_rgba(212,175,55,0.1)]">
                        {isClient && activeUnit.questions && activeUnit.questions.length > 0 ? (
                            <QuizViewer
                                config={{
                                    questions: activeUnit.questions.map((q: any) => ({
                                        ...q,
                                        correctAnswer: typeof q.correctAnswer === 'string'
                                            ? q.options.indexOf(q.correctAnswer)
                                            : q.correctAnswer,
                                        explanation: q.explanation ?? '',
                                    }))
                                }}
                                onPass={() => activeUnit._id && handleProgress(activeUnit._id)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center min-h-[300px]">
                                <div className="w-20 h-20 bg-primary/10 shadow-sm rounded-full flex items-center justify-center mb-6 border border-primary/20">
                                    <FileText className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="font-serif font-medium text-2xl text-foreground mb-3">{activeUnit.title}</h3>
                                <p className="text-muted-foreground max-w-lg text-lg">Bài kiểm tra chưa được cấu hình.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-card border border-primary/10 rounded-[24px] p-12 min-h-[400px] flex flex-col items-center justify-center text-center shadow-[0_4px_20px_-5px_rgba(212,175,55,0.1)]">
                        <div className="w-20 h-20 bg-primary/10 shadow-sm rounded-full flex items-center justify-center mb-6 border border-primary/20">
                            <FileText className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="font-serif font-medium text-2xl text-foreground mb-3">{activeUnit.title}</h3>
                        <p className="text-muted-foreground max-w-lg mb-8 text-lg">
                            Tài liệu học tập có sẵn. Vui lòng đọc kỹ nội dung để hoàn thành bài học này.
                        </p>
                        {activeUnit.contentUrl ? (
                            <a href={activeUnit.contentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground shadow-[0_4px_15px_-3px_rgba(212,175,55,0.4)] rounded-full text-base font-bold hover:bg-primary/90 hover:-translate-y-1 transition-all">
                                Mở tài liệu <ChevronRight className="w-5 h-5" />
                            </a>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Chưa có liên kết tài liệu.</p>
                        )}
                    </div>
                )}

                 {/* Nav Buttons (Bottom) */}
                <div className="flex items-center justify-between pt-8 border-t border-primary/10 mt-12 pb-20">
                     {prevUrl ? (
                         <Link href={prevUrl}>
                            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-primary/5">
                                <ChevronDown className="w-4 h-4 rotate-90" /> Bài trước
                            </Button>
                         </Link>
                     ) : <div />}
                     
                     <div className="flex gap-4">
                         <Button 
                            variant="outline"
                            className={`px-6 border-primary/10 rounded-full ${completedUnits.includes(activeUnit._id || "") ? "text-primary border-primary/20 bg-primary/10" : "text-muted-foreground hover:text-foreground hover:border-primary/30"}`}
                            onClick={() => activeUnit._id && handleProgress(activeUnit._id)}
                         >
                             {completedUnits.includes(activeUnit._id || "") ? <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Đã hoàn thành</span> : "Đánh dấu hoàn thành"}
                         </Button>

                         <Button 
                            variant="default" 
                            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_15px_-3px_rgba(212,175,55,0.3)] rounded-full px-6 font-bold" 
                            onClick={handleNext}
                            disabled={!isCurrentCompleted}
                         >
                             {isLast ? "Hoàn thành" : "Tiếp theo"} <ChevronRight className="w-4 h-4"/>
                         </Button>
                     </div>
                </div>
            </div>
      </div>
    </div>
  );
}
