"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { MoveLeft, MoveRight, CheckCircle, Award } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import DocViewer from "./DocViewer";
import QuizViewer from "./QuizViewer";
import CertificateModal from "./CertificateModal";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Mock userId for now - in production use AuthContext
const USER_ID_HEADER = { "x-user-id": "650a..." }; // Demo ID

const fetcher = (url: string) =>
  fetch(url, { headers: USER_ID_HEADER }).then((res) => res.json());

export default function LearningLayout({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { data: course, error } = useSWR(
    `/api/courses/${courseId}/learn`, // Use absolute URL in prod or proxy
    (url) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${url}`, {
        headers: USER_ID_HEADER,
      }).then((res) => res.json())
  );

  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  // Set initial unit
  useEffect(() => {
    if (course && !currentUnitId && course.sections?.length > 0) {
      setCurrentUnitId(course.sections[0].units[0]?.id);
    }
  }, [course, currentUnitId]);

  const handleUnitSelect = (unitId: string) => {
    setCurrentUnitId(unitId);
  };

  const handleProgressUpdate = async (unitId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...USER_ID_HEADER,
          },
          body: JSON.stringify({ courseId, unitId }),
        }
      );
      if (res.ok) {
        mutate(
          `/api/courses/${courseId}/learn`, // Invalidate cache
          async (data: any) => {
             // Optimistic update could go here, but revalidation is safer
             return fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/courses/${courseId}/learn`, {
                headers: USER_ID_HEADER,
             }).then((res) => res.json())
          }
        );
      }
    } catch (err) {
      console.error("Failed to update progress", err);
    }
  };

  const handleNext = () => {
    if (!course || !currentUnitId) return;
    // Flat map all units to find next index
    const allUnits = course.sections.flatMap((s: any) => s.units);
    const idx = allUnits.findIndex((u: any) => u.id === currentUnitId);
    if (idx < allUnits.length - 1) {
      setCurrentUnitId(allUnits[idx + 1].id);
    } else {
        // End of course
        toast.success("Chúc mừng!", { description: "Bạn đã hoàn thành toàn bộ khóa học! 🎉" });
    }
  };

  const handlePrev = () => {
    if (!course || !currentUnitId) return;
    const allUnits = course.sections.flatMap((s: any) => s.units);
    const idx = allUnits.findIndex((u: any) => u.id === currentUnitId);
    if (idx > 0) {
      setCurrentUnitId(allUnits[idx - 1].id);
    }
  };

  const currentUnit = course?.sections
    .flatMap((s: any) => s.units)
    .find((u: any) => u.id === currentUnitId);

  if (error) return <div className="text-center p-10">Failed to load course</div>;
  if (!course) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="flex h-screen bg-background flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-border bg-card flex-shrink-0 h-[30vh] md:h-full overflow-y-auto">
        <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-2 block">
            ← Quay lại Dashboard
          </Link>
          <h2 className="font-bold text-lg leading-tight">{course.courseTitle}</h2>
          
          <div className="mt-4">
             <div className="flex justify-between text-xs mb-1">
                <span>Tiến độ: {course.progress}%</span>
                {course.progress === 100 && <span className="text-green-600 font-bold">Hoàn thành!</span>}
             </div>
             <div className="w-full bg-muted rounded-full h-2">
                 <div 
                   className="bg-primary h-2 rounded-full transition-[width] duration-500" 
                   style={{ width: `${course.progress}%` }}
                 ></div>
             </div>
             
             {course.progress === 100 && (
                 <button 
                   onClick={() => setShowCertModal(true)}
                   className="mt-3 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded flex items-center justify-center gap-2 text-sm shadow-md transition-transform active:scale-95"
                 >
                    <Award size={16} />
                    {course.isCertified ? "XEM CHỨNG CHỈ" : "NHẬN CHỨNG CHỈ"}
                 </button>
             )}
          </div>
        </div>
        
        <Sidebar 
            sections={course.sections} 
            currentUnitId={currentUnitId} 
            onSelectUnit={handleUnitSelect} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-[70vh] md:h-full">
        {/* Mobile Header (Progress only visible in Sidebar on Desktop, but maybe duplicate here if needed) */}
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background md:bg-muted/10 flex justify-center">
            <div className="max-w-4xl w-full bg-card md:shadow-sm md:rounded-xl md:p-6 min-h-125 border border-border/50">
                {currentUnit ? (
                    <>
                         <h1 className="text-2xl font-bold mb-4 border-b border-border pb-2 text-foreground">{currentUnit.title}</h1>
                         
                         {currentUnit.type === 'VIDEO' && (
                             <VideoPlayer 
                                courseId={courseId}
                                unitId={currentUnit.id}
                                url={`https://www.youtube.com/watch?v=${currentUnit.videoConfig?.youtubeId || ''}`}
                                onComplete={() => handleProgressUpdate(currentUnit.id)}
                             />
                         )}
                         
                         {currentUnit.type === 'DOC' && (
                             <DocViewer 
                                content={currentUnit.docContent} 
                                onComplete={() => handleProgressUpdate(currentUnit.id)}
                             />
                         )}
                         
                         {currentUnit.type === 'QUIZ' && (
                             <QuizViewer 
                                config={currentUnit.quizConfig}
                                onPass={() => handleProgressUpdate(currentUnit.id)}
                             />
                         )}
                    </>
                ) : (
                    <div className="text-center text-muted-foreground mt-20">Chọn bài học để bắt đầu</div>
                )}
            </div>
        </main>

        {/* Sticky Footer Navigation */}
        <div className="border-t border-border bg-card p-4 flex justify-between items-center sticky bottom-0 z-10">
             <button 
                onClick={handlePrev}
                disabled={!currentUnitId} // Should check logic
                className="flex items-center gap-2 px-4 py-2 border border-input rounded hover:bg-accent text-foreground disabled:opacity-50"
             >
                <MoveLeft size={16} /> Bài trước
             </button>
             
             <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 font-medium"
             >
                Bài tiếp theo <MoveRight size={16} />
             </button>
        </div>
      </div>

       {showCertModal && (
           <CertificateModal 
              course={course}
              onClose={() => setShowCertModal(false)}
              userId={USER_ID_HEADER["x-user-id"]} // Pass mock ID
           />
       )}
    </div>
  );
}
