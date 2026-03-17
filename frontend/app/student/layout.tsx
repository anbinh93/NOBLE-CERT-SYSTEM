"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { usePathname } from "next/navigation";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Check if we are in the Learning Section (Overview or Player)
  // We want to HIDE the global sidebar for both /student/learn/[courseId] and /student/learn/[courseId]/[unitId]
  const isLearningSection = pathname?.startsWith("/student/learn/");

  if (isLearningSection) {
      return (
          <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col">
              {children}
          </div>
      );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background/95 flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 w-full animate-in fade-in duration-500 transition-all">
        {children}
      </main>
    </div>
  );
}
