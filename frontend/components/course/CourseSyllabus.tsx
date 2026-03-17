"use client";

import { FileText, PlayCircle, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Section } from "@/types/course";

export default function CourseSyllabus({ sections }: { sections: Section[] }) {
  if (!sections || sections.length === 0) return <div>No syllabus available.</div>;

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => (
        <SectionItem key={idx} section={section} isOpenDefault={idx === 0} />
      ))}
    </div>
  );
}

function SectionItem({ section, isOpenDefault }: { section: Section; isOpenDefault: boolean }) {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-muted/50 hover:bg-muted/80 transition-colors text-left"
      >
        <span className="font-bold text-foreground">{section.title}</span>
        {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      
      {isOpen && (
        <div className="divide-y divide-border">
          {section.units.map((unit, uIdx) => (
              <div key={uIdx} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                {unit.type === "VIDEO" ? <PlayCircle className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                <span className="text-foreground text-sm font-medium">{unit.title}</span>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-xs text-muted-foreground font-medium">{unit.duration || "N/A"}</span>
                 {unit.isFree ? (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Preview</span>
                 ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                 )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
