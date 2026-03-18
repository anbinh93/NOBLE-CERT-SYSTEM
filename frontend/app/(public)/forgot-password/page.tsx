"use client";
import AuthLayout from "@/components/auth/AuthLayout";
import Link from "next/link";
import { useState } from "react";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Có lỗi xảy ra");
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Kiểm tra email"
        subtitle="Email đặt lại mật khẩu đã được gửi"
      >
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-medium">
              Nếu email <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ
              nhận được email chứa link đặt lại mật khẩu.
            </p>
            <p className="text-muted-foreground text-sm">
              Link có hiệu lực trong 1 giờ. Hãy kiểm tra cả thư mục spam.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Quên mật khẩu" subtitle="Nhập email để đặt lại mật khẩu">
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-secondary focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-foreground"
              placeholder="name@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex justify-center items-center"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Gửi email đặt lại"
            )}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm">
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline"
          >
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
