"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Course } from "@/types/course";
import { learningService } from "@/services/learning.service";
import { useSession } from "next-auth/react";

interface CourseContextType {
  course: Course | null;
  loading: boolean;
  completedUnits: string[];
  markUnitComplete: (unitId: string) => void;
  refreshProgress: () => Promise<void>;
  examScore: number;
  isCertified: boolean;
  certificateSerial?: string;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ 
  children, 
  courseId 
}: { 
  children: ReactNode; 
  courseId: string 
}) {
  const { data: session, status } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedUnits, setCompletedUnits] = useState<string[]>([]);
  const [progress, setProgress] = useState(0); 
  const [examScore, setExamScore] = useState(0);
  const [isCertified, setIsCertified] = useState(false);
  const [certificateSerial, setCertificateSerial] = useState<string | undefined>(undefined);

  const accessToken = session?.user?.accessToken;

  const fetchCourseContent = useCallback(async () => {
    if (!courseId || !session?.user?.email) return;
    
    try {
      setLoading(true);
      const data = await learningService.getCourseContent(courseId, session.user.email);
      
      setCourse(data.course as unknown as Course);
      setCompletedUnits(data.completedUnits || []);
      setProgress(data.progress || 0);
      setExamScore(data.examScore || 0);
      setIsCertified(data.isCertified || false);
      setCertificateSerial(data.certificateSerial);
    } catch (error) {
      console.error("Failed to load course content", error);
    } finally {
      setLoading(false);
    }
  }, [courseId, session?.user?.email]);

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false); 
    } else if (status === "authenticated") {
      fetchCourseContent();
    }
  }, [status, fetchCourseContent]);

  const markUnitComplete = (unitId: string) => {
    if (completedUnits.includes(unitId)) return;

    // Optimistic update — luôn thành công, không rollback
    setCompletedUnits((prev) => [...prev, unitId]);

    // Fire-and-forget: gửi lên server để persist nhưng không block UI
    if (accessToken) {
      learningService.updateProgress(courseId, unitId, accessToken).catch((e) => {
        console.warn("Background progress sync failed (UI not affected):", e);
      });
    }
  };
  
  const refreshProgress = async () => {
      if (session?.user?.email) {
          const data = await learningService.getCourseContent(courseId, session.user.email);
          if (data) {
              if (data.completedUnits) setCompletedUnits(data.completedUnits);
              if (data.examScore !== undefined) setExamScore(data.examScore);
              if (data.isCertified !== undefined) setIsCertified(data.isCertified);
              if (data.certificateSerial !== undefined) setCertificateSerial(data.certificateSerial);
          }
      }
  };

  return (
    <CourseContext.Provider value={{ course, loading, completedUnits, markUnitComplete, refreshProgress, examScore, isCertified, certificateSerial }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error("useCourse must be used within a CourseProvider");
  }
  return context;
}
