import { ChevronDown, ChevronRight, Circle, CheckCircle, PlayCircle, Lock } from "lucide-react";
import { useState } from "react";

interface Unit {
  id: string;
  title: string;
  type: string;
  isCompleted: boolean;
}

interface Section {
  id: string;
  title: string;
  units: Unit[];
}

interface SidebarProps {
  sections: Section[]; 
  currentUnitId: string | null;
  onSelectUnit: (id: string) => void;
}

export default function Sidebar({ sections, currentUnitId, onSelectUnit }: SidebarProps) {
  // Logic to auto-expand section containing current unit could go here
  // For MVP, simplify to open all or just state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (secId: string) => {
      setExpandedSections(prev => ({...prev, [secId]: !prev[secId]}));
  };

  return (
    <div className="pb-10">
      {sections.map((section) => (
        <div key={section.id} className="border-b border-border">
          <button 
             onClick={() => toggleSection(section.id)}
             className="w-full flex items-center justify-between p-4 bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <span className="font-semibold text-sm text-foreground text-left">{section.title}</span>
            {expandedSections[section.id] ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
          </button>
          
          <div className={`${expandedSections[section.id] === false ? 'hidden' : 'block'}`}>
             {section.units.map((unit) => {
                 const isActive = unit.id === currentUnitId;
                 const isCompleted = unit.isCompleted;
                 
                 return (
                     <button
                        key={unit.id}
                        onClick={() => onSelectUnit(unit.id)}
                        className={`w-full flex items-start gap-3 p-3 pl-6 text-sm transition-colors
                            ${isActive ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'}
                        `}
                     >
                        <div className="mt-0.5 shrink-0">
                            {isActive ? (
                                <PlayCircle size={16} className="text-primary animate-pulse" />
                            ) : isCompleted ? (
                                <CheckCircle size={16} className="text-green-500 dark:text-green-400" />
                            ) : (
                                <Circle size={16} className="text-border" />
                            )}
                        </div>
                        <div className="text-left">
                           <div className={`leading-snug ${isActive ? 'font-medium' : ''}`}>
                             {unit.title}
                           </div>
                           <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{unit.type}</div>
                        </div>
                     </button>
                 );
             })}
          </div>
        </div>
      ))}
    </div>
  );
}
