"use client";
import AuthLayout from "@/components/auth/AuthLayout";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// NOTE: Since next-auth/react's signIn is client side, we use it directly.
// OR use server action calling 'signIn'. For MVP client form is easier for loading states.

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Email hoặc mật khẩu không đúng.");
      } else {
        router.push("/student/dashboard"); // Redirect to dashboard
        router.refresh();
      }
    } catch (err) {
      setError("Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/student/dashboard" });
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Chào mừng bạn quay trở lại!"
      isLogin
    >
      <div className="space-y-6">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-card border border-border text-foreground font-semibold py-3.5 rounded-xl hover:bg-secondary transition-all duration-200 shadow-sm active:scale-[0.98]"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Tiếp tục với Google</span>
        </button>

        <div className="relative flex py-2 items-center">
          <div className="grow border-t border-border"></div>
          <span className="shrink-0 mx-4 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Hoặc
          </span>
          <div className="grow border-t border-border"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-secondary focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-foreground"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-foreground">
                Mật khẩu
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-primary hover:text-primary/80 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-secondary focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-foreground"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm">
          Chưa có tài khoản?{" "}
          <Link
            href="/signup"
            className="text-primary font-semibold hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
