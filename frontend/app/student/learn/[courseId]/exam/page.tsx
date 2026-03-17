"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Clock, AlertCircle, CheckCircle, XCircle,
  Award, Lock, Loader2, ArrowLeft, ArrowRight,
  RotateCcw, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { learningService } from "@/services/learning.service";
import { ExamSubmission } from "@/types/learning";
import { useSession } from "next-auth/react";
import { useCourse } from "../course-context";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface NormalizedOption {
  id: string;    // actual value sent to backend
  text: string;  // display text
  letter: string; // A, B, C, D
}

interface NormalizedQuestion {
  id: string;
  question: string;
  options: NormalizedOption[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Normalize raw questions: handles both string[] and object[] options */
function normalizeQuestions(rawQuestions: unknown[]): NormalizedQuestion[] {
  return (rawQuestions as Record<string, unknown>[]).map((q) => ({
    id: String(q.id ?? ""),
    question: String(q.question ?? ""),
    options: ((q.options as unknown[]) ?? []).map((opt, idx) => {
      if (typeof opt === "string") {
        return { id: opt, text: opt, letter: LETTERS[idx] ?? String(idx + 1) };
      }
      const o = opt as Record<string, unknown>;
      return {
        id: String(o.id ?? o.value ?? opt),
        text: String(o.text ?? o.label ?? opt),
        letter: LETTERS[idx] ?? String(idx + 1),
      };
    }),
  }));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((j) => (j?.data !== undefined ? j.data : j));

// ─── Page Component ───────────────────────────────────────────────────────────
export default function ExamPage() {
  const params = useParams();
  const { data: session } = useSession();
  const courseId = params?.courseId as string;
  const accessToken = (session?.user as Record<string, unknown>)?.accessToken as string | undefined;
  const { refreshProgress } = useCourse();

  type ExamState = "INTRO" | "TAKING" | "RESULT";
  const [examState, setExamState] = useState<ExamState>("INTRO");
  const [loadingExam, setLoadingExam] = useState(false);

  const [examData, setExamData] = useState<{ passingScore?: number; duration?: number } | null>(null);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [, setCurrentIdx] = useState(0);

  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ── Status SWR ────────────────────────────────────────────────────────────
  const { data: statusData, isLoading } = useSWR(
    courseId && session?.user?.email
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/student/${courseId}/status?email=${encodeURIComponent(session.user.email)}`
      : null,
    fetcher
  );

  // Auto-redirect to RESULT if already passed
  useEffect(() => {
    if (statusData?.examScore && statusData.examScore >= (statusData?.passingScore ?? 50) && examState === "INTRO") {
      setScore(statusData.examScore as number);
      setPassed(true);
      setExamState("RESULT");
    }
  }, [statusData, examState]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const submitExamRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (examState !== "TAKING" || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          submitExamRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [examState, timeLeft]);

  // ── Restore session on load (OpenEdX-style: khôi phục khi reload) ─────────
  const tryRestoreSession = useCallback(async (): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      const data = await learningService.getExamSession(courseId, accessToken);
      if (data && data.questions?.length) {
        setExamData({ passingScore: data.passingScore, duration: data.duration });
        setQuestions(normalizeQuestions(data.questions));
        setTimeLeft(data.timeLeft);
        setAnswers((data.answers as Record<string, string>) ?? {});
        setExamState("TAKING");
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }, [courseId, accessToken]);

  // ── Start exam (gửi tín hiệu đến backend, tạo session) ─────────────────────
  const handleStart = async () => {
    if (!accessToken) { toast.error("Phiên đăng nhập hết hạn."); return; }
    setLoadingExam(true);
    try {
      const data = await learningService.startExamSession(courseId, accessToken);
      setExamData({ passingScore: data.passingScore, duration: data.duration });
      setQuestions(normalizeQuestions(data.questions ?? []));
      setTimeLeft(data.timeLeft);
      setAnswers((data.answers as Record<string, string>) ?? {});
      setExamState("TAKING");
      setCurrentIdx(0);
      window.scrollTo(0, 0);
    } catch {
      toast.error("Không thể bắt đầu bài thi. Vui lòng thử lại.");
    } finally {
      setLoadingExam(false);
    }
  };

  // ── Check for active session on mount (khi vào trang exam) ─────────────────
  useEffect(() => {
    if (examState !== "INTRO" || !statusData?.isEligible) return;
    setLoadingExam(true);
    tryRestoreSession().finally(() => setLoadingExam(false));
  }, [examState, statusData?.isEligible, tryRestoreSession]);

  // ── Answer selection + auto-save ─────────────────────────────────────────
  const saveAnswersRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSelect = (questionId: string, optionId: string) => {
    const next = { ...answers, [questionId]: optionId };
    setAnswers(next);
    if (saveAnswersRef.current) clearTimeout(saveAnswersRef.current);
    saveAnswersRef.current = setTimeout(async () => {
      if (!accessToken) return;
      try {
        await learningService.saveExamAnswers(courseId, next, accessToken);
      } catch {
        /* ignore save errors */
      }
      saveAnswersRef.current = null;
    }, 500);
  };

  // ── Scroll to question ────────────────────────────────────────────────────
  const scrollToQuestion = useCallback((idx: number) => {
    setCurrentIdx(idx);
    questionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Submit exam ───────────────────────────────────────────────────────────
  const submitExam = useCallback(async () => {
    // Find first unanswered
    const firstUnanswered = questions.findIndex((q) => !answers[q.id]);
    if (firstUnanswered !== -1) {
      scrollToQuestion(firstUnanswered);
      return;
    }
    if (!accessToken) { toast.error("Phiên đăng nhập hết hạn."); return; }
    setSubmitting(true);
    try {
      const payload: ExamSubmission = { courseId, answers, email: session?.user?.email ?? "" };
      const result = await learningService.submitExam(payload, accessToken);
      setScore(result.score);
      setPassed(result.passed);
      setExamState("RESULT");
      if (result.passed) await refreshProgress();
    } catch {
      toast.error("Lỗi nộp bài. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }, [questions, answers, accessToken, courseId, session, refreshProgress, scrollToQuestion]);

  // Keep ref up to date for timer callback
  useEffect(() => { submitExamRef.current = submitExam; }, [submitExam]);

  const handleRetry = () => {
    setExamState("INTRO");
    setScore(0);
    setPassed(false);
    setAnswers({});
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: INTRO
  // ─────────────────────────────────────────────────────────────────────────
  if (examState === "INTRO") {
    const isEligible = statusData?.isEligible ?? false;
    const missingRequirements = (statusData?.missingRequirements ?? []) as { id: string; title: string; completed: number; total: number }[];

    if (isLoading || loadingExam) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto bg-background p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-card rounded-4xl p-8 md:p-12 shadow-2xl border border-primary/20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-80" />

          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 shadow-inner",
            !isEligible
              ? "bg-secondary text-muted-foreground border-border"
              : "bg-primary/5 text-primary border-primary/20",
          )}>
            {!isEligible ? <Lock className="w-10 h-10" /> : <Award className="w-10 h-10" />}
          </div>

          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Bài thi trắc nghiệm cuối khóa
          </h1>

          {!isEligible ? (
            <div className="bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 p-6 rounded-2xl mb-8 border border-orange-200/50 text-left">
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5" />
                Chưa đủ điều kiện dự thi
              </h3>
              <p className="text-sm mb-4 opacity-90">Hoàn thành các nội dung sau trước khi làm bài:</p>
              <ul className="space-y-2 bg-card/40 dark:bg-foreground/20 p-3 rounded-xl">
                {missingRequirements.map((req) => (
                  <li key={req.id} className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-4 h-4 rounded-full border-2 border-orange-300 shrink-0" />
                    <span className="opacity-80">{req.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground mb-10 leading-relaxed max-w-lg mx-auto">
              Cần đạt ít nhất{" "}
              <b className="text-primary font-bold">{examData?.passingScore ?? statusData?.passingScore ?? 75}%</b>{" "}
              để vượt qua bài kiểm tra và nhận chứng chỉ.
            </p>
          )}

          {isEligible && (
            <div className="bg-secondary/40 rounded-2xl p-6 mb-8 text-left border border-primary/10 relative">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-background border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">
                Thông tin bài thi
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Thời gian", value: "45 phút", icon: <Clock className="w-4 h-4 text-primary" /> },
                  { label: "Điểm yêu cầu", value: `${examData?.passingScore ?? 75}%`, icon: <CheckCircle className="w-4 h-4 text-primary" /> },
                  { label: "Lượt thi", value: "Không giới hạn", icon: <RotateCcw className="w-4 h-4 text-primary" /> },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-muted-foreground w-28">{item.label}</span>
                    <span className="font-semibold text-foreground">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isEligible && (
            <Link href={`/student/learn/${courseId}`}>
              <Button className="rounded-full px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Tiếp tục học
              </Button>
            </Link>
          )}

          {isEligible && (
            <Button
              onClick={handleStart}
              disabled={loadingExam}
              className="w-full h-14 rounded-full text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_20px_-5px_rgba(212,175,55,0.4)] mb-4 hover:scale-[1.02] transition-transform"
            >
              {loadingExam ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Bắt đầu làm bài
            </Button>
          )}

          <Link href={`/student/learn/${courseId}`}>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Quay lại nội dung khóa học
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: TAKING
  // ─────────────────────────────────────────────────────────────────────────
  if (examState === "TAKING") {
    const answeredCount = Object.keys(answers).length;
    const totalQ = questions.length;
    const allAnswered = answeredCount === totalQ;

    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">

        {/* ── Sticky header ────────────────────────────────────────────────── */}
        <div className="shrink-0 sticky top-0 pl-14! z-20 bg-card/95 backdrop-blur-sm border-b border-primary/15 px-4 md:px-6 py-3 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <p className="font-serif font-semibold text-foreground text-sm md:text-base">Bài kiểm tra cuối khóa</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đã trả lời: <span className={cn("font-bold", allAnswered ? "text-green-500" : "text-primary")}>{answeredCount}</span>/{totalQ}
            </p>
          </div>

          {/* Timer */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-base border",
            timeLeft < 300
              ? "bg-red-500/10 text-red-500 border-red-500/20"
              : "bg-primary/10 text-primary border-primary/20",
          )}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>

          {/* Submit */}
          <Button
            onClick={submitExam}
            disabled={submitting}
            className={cn(
              "rounded-full px-4 md:px-6 h-9 text-sm font-bold shadow-sm transition-all",
              allAnswered
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Nộp bài"}
          </Button>
        </div>

        {/* ── Body: content + navigator ─────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex">

          {/* Questions list */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
            {/* Progress bar */}
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(answeredCount / totalQ) * 100}%` }}
              />
            </div>

            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              return (
                <div
                  key={q.id}
                  id={`q-${q.id}`}
                  ref={(el) => { questionRefs.current[idx] = el; }}
                  className={cn(
                    "bg-card rounded-2xl border shadow-sm scroll-mt-20 transition-all",
                    isAnswered ? "border-primary/20" : "border-border",
                  )}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3 p-5 md:p-6 border-b border-border/50">
                    <span className={cn(
                      "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 mt-0.5",
                      isAnswered
                        ? "bg-primary/10 text-primary border-primary/40"
                        : "bg-secondary text-muted-foreground border-border",
                    )}>
                      {idx + 1}
                    </span>
                    <p className="font-medium text-foreground leading-relaxed">{q.question}</p>
                  </div>

                  {/* Options */}
                  <div className="p-4 md:p-5 space-y-2.5">
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelect(q.id, opt.id)}
                          className={cn(
                            "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all text-left",
                            selected
                              ? "border-primary bg-primary/8 shadow-sm shadow-primary/10"
                              : "border-border hover:border-primary/40 hover:bg-primary/3",
                          )}
                        >
                          {/* Letter badge */}
                          <span className={cn(
                            "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary text-muted-foreground border-border",
                          )}>
                            {opt.letter}
                          </span>

                          {/* Option text */}
                          <span className={cn(
                            "font-medium transition-colors",
                            selected ? "text-primary" : "text-foreground",
                          )}>
                            {opt.text}
                          </span>

                          {/* Selected indicator */}
                          {selected && (
                            <CheckCircle className="w-4 h-4 text-primary ml-auto shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Submit footer */}
            <div className="pt-4 pb-20 flex flex-col items-center gap-4">
              {!allAnswered && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Còn {totalQ - answeredCount} câu chưa trả lời
                </p>
              )}
              <Button
                onClick={submitExam}
                disabled={submitting}
                size="lg"
                className="rounded-full px-12 h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_20px_-5px_rgba(212,175,55,0.4)]"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang nộp...</>
                  : "Nộp bài thi"}
              </Button>
            </div>
          </div>

          {/* ── Question navigator (desktop sidebar) ─────────────────────── */}
          <div className="hidden lg:flex shrink-0 w-52 border-l border-border overflow-y-auto p-4 flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Câu hỏi
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => scrollToQuestion(idx)}
                    title={`Câu ${idx + 1}${isAnswered ? " ✓" : ""}`}
                    className={cn(
                      "w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-all hover:scale-105",
                      isAnswered
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border hover:border-primary/40",
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto space-y-2 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-3 h-3 rounded bg-primary inline-block" />
                Đã trả lời ({answeredCount})
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-3 h-3 rounded bg-secondary border border-border inline-block" />
                Chưa trả lời ({totalQ - answeredCount})
              </div>
            </div>

            <Button
              onClick={submitExam}
              disabled={submitting || !allAnswered}
              size="sm"
              className="rounded-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Nộp bài <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* ── Mobile question navigator (bottom strip) ─────────────────── */}
        <div className="lg:hidden shrink-0 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-2 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => scrollToQuestion(idx)}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border-2 shrink-0 transition-all",
                    isAnswered
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border",
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: RESULT
  // ─────────────────────────────────────────────────────────────────────────
  if (examState === "RESULT") {
    const passingScore = examData?.passingScore ?? statusData?.passingScore ?? 75;
    return (
      <div className="h-full overflow-y-auto bg-background p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-lg w-full bg-card rounded-3xl p-10 shadow-xl border border-primary/20 text-center relative overflow-hidden">
          {passed && (
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          )}

          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-opacity-20",
            passed
              ? "bg-primary/10 text-primary ring-primary"
              : "bg-red-100 dark:bg-red-900/30 text-red-600 ring-red-500",
          )}>
            {passed ? <Award className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
          </div>

          <h2 className={cn("text-2xl font-bold mb-2 font-serif", passed ? "text-green-600" : "text-red-600")}>
            {passed ? "Xin chúc mừng!" : "Chưa đạt yêu cầu"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {passed
              ? "Bạn đã xuất sắc vượt qua bài kiểm tra cuối khóa."
              : `Điểm của bạn chưa đạt ngưỡng ${passingScore}% yêu cầu.`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-muted/30 p-4 rounded-2xl border border-primary/10">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold block mb-1">Điểm số</span>
              <span className={cn("text-3xl font-bold", passed ? "text-green-600" : "text-red-600")}>
                {score.toFixed(0)}%
              </span>
            </div>
            <div className="bg-muted/30 p-4 rounded-2xl border border-primary/10">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold block mb-1">Điểm yêu cầu</span>
              <span className="text-3xl font-bold text-foreground">{passingScore}%</span>
            </div>
          </div>

          {passed ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/student/learn/${courseId}`}>
                  <Button variant="outline" className="w-full h-11 rounded-full border-primary/20 text-muted-foreground hover:text-foreground">
                    Quay lại
                  </Button>
                </Link>
                <Link href={`/student/certificates/claim/${courseId}`}>
                  <Button className="w-full h-11 rounded-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(212,175,55,0.35)]">
                    Nhận chứng chỉ <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <Button variant="ghost" onClick={handleRetry} className="text-muted-foreground hover:text-foreground text-sm w-full">
                <RotateCcw className="w-3 h-3 mr-2" /> Làm lại để cải thiện điểm
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full h-12 rounded-full font-bold bg-foreground text-background hover:bg-foreground/90 shadow-lg">
                <RotateCcw className="w-4 h-4 mr-2" /> Thử lại
              </Button>
              <Link href={`/student/learn/${courseId}`}>
                <Button variant="ghost" className="w-full rounded-full text-muted-foreground hover:text-foreground">
                  Ôn tập lại kiến thức
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
