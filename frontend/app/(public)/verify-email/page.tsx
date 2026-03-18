"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Không tìm thấy token xác thực trong đường dẫn.");
      return;
    }

    const verify = async () => {
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(
          `${apiBase}/api/v1/auth/verify-email?token=${token}`,
        );
        const json = await res.json();

        if (res.ok && json.status === "success") {
          setStatus("success");
          setMessage(
            json.data?.message ||
              "Xác thực email thành công! Bạn có thể đăng nhập.",
          );
        } else {
          setStatus("error");
          setMessage(
            json.message || "Token xác thực không hợp lệ hoặc đã hết hạn.",
          );
        }
      } catch {
        setStatus("error");
        setMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold text-primary tracking-tighter"
          >
            CertiFlow
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Đang xác thực...
                </h1>
                <p className="mt-2 text-muted-foreground text-sm">
                  Vui lòng đợi trong giây lát.
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Xác thực thành công!
                </h1>
                <p className="mt-2 text-muted-foreground text-sm">{message}</p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
              >
                Đăng nhập ngay
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Xác thực thất bại
                </h1>
                <p className="mt-2 text-muted-foreground text-sm">{message}</p>
              </div>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
                >
                  Về trang đăng nhập
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 justify-center w-full bg-card border border-border text-foreground font-semibold py-3.5 rounded-xl hover:bg-secondary transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Đăng ký lại
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Đang tải...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
