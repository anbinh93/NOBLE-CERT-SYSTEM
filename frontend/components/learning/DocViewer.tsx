import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface DocViewerProps {
  content?: string;
  onComplete?: () => void;
}

export default function DocViewer({ content, onComplete }: DocViewerProps) {
  const [canComplete, setCanComplete] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCanComplete(false);
    setCompleted(false);
    
    // Disable button for 5 seconds
    const timer = setTimeout(() => {
        setCanComplete(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [content]);

  const handleComplete = () => {
      setCompleted(true);
      if (onComplete) onComplete();
  };

  return (
    <div className="flex flex-col h-full">
        <div className="prose max-w-none flex-1 mb-8 text-foreground">
             {/* Simple renderer for now, upgrade to react-markdown later */}
             <div className="whitespace-pre-wrap">{content || "No content available."}</div>
        </div>
        
        <div className="border-t pt-4">
            <button
                onClick={handleComplete}
                disabled={!canComplete || completed}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                    ${completed 
                        ? 'bg-primary/10 text-primary cursor-default' 
                        : canComplete 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform active:scale-95' 
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }
                `}
            >
                {completed ? (
                    <>
                        <Check size={20} /> ĐÃ ĐỌC XONG
                    </>
                ) : canComplete ? (
                    "XÁC NHẬN ĐÃ ĐỌC"
                ) : (
                    `Đọc tài liệu (5s)...`
                )}
            </button>
        </div>
    </div>
  );
}
