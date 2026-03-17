import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizViewerProps {
  config: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
  };
  onPass?: () => void;
}

export default function QuizViewer({ config, onPass }: QuizViewerProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const question = config?.questions?.[0]; // Simple single question for MVP

  if (!question) return <div>No question configured.</div>;

  const handleSubmit = () => {
      if (selectedOption === null) return;
      
      const correct = selectedOption === question.correctAnswer;
      setIsCorrect(correct);
      setSubmitted(true);
      
      if (correct && onPass) {
          onPass();
      }
  };

  const handleRetry = () => {
      setSubmitted(false);
      setSelectedOption(null);
      setIsCorrect(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
        <div className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-foreground">{question.question}</h3>
            
            <div className="space-y-3">
                {question.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => !submitted && setSelectedOption(idx)}
                        disabled={submitted && isCorrect}
                        className={`w-full p-4 rounded-lg border text-left flex items-center justify-between transition-all bg-background/80 text-foreground
                            ${selectedOption === idx 
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-950 dark:border-blue-400 dark:ring-blue-400' 
                                : 'border-border hover:bg-muted'}
                            ${submitted && idx === question.correctAnswer ? 'bg-primary/10 border-primary' : ''}
                            ${submitted && selectedOption === idx && !isCorrect ? 'bg-red-50 border-red-500 dark:bg-red-950 dark:border-red-500' : ''}
                        `}
                    >
                        <span>{opt}</span>
                        {submitted && idx === question.correctAnswer && <CheckCircle className="text-green-500" size={20}/>}
                        {submitted && selectedOption === idx && !isCorrect && <XCircle className="text-red-500" size={20}/>}
                    </button>
                ))}
            </div>
        </div>

        {submitted && (
            <div className={`p-4 rounded-lg mb-6 ${isCorrect ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {isCorrect ? (
                    <div>
                        <strong>Chính xác!</strong> {question.explanation}
                    </div>
                ) : (
                    <div>
                        <strong>Sai rồi!</strong> Hãy thử lại nhé.
                    </div>
                )}
            </div>
        )}

        <button
            onClick={isCorrect ? undefined : (submitted ? handleRetry : handleSubmit)}
            disabled={selectedOption === null || (submitted && isCorrect)}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all
                ${isCorrect 
                    ? 'bg-primary cursor-default' 
                    : 'bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 shadow-md active:scale-95'}
                ${selectedOption === null ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            {isCorrect ? "ĐÃ HOÀN THÀNH" : (submitted ? "THỬ LẠI" : "KIỂM TRA")}
        </button>
    </div>
  );
}
