"use client";
import AuthLayout from "@/components/auth/AuthLayout";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

export default function SignupPage() {
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
    const name = formData.get("name") as string;

    try {
        // 1. Call Register API
        const res = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
             method: 'POST',
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ email, password, name })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || "Đăng ký thất bại");
        }

        // 2. Auto Login after register
        const loginRes = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (loginRes?.error) {
           // Should not happen if register success
           router.push("/login");
        } else {
           router.push("/student/dashboard");
           router.refresh();
        }

    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/student/dashboard" });
  };

  return (
    <AuthLayout title="Tạo tài khoản" subtitle="Học miễn phí, nhận chứng chỉ thật.">
      <div className="space-y-6">
        <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-card border border-border text-foreground font-semibold py-3.5 rounded-xl hover:bg-secondary transition-all duration-200 shadow-sm active:scale-[0.98]"
        >
             <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
             <span>Đăng ký nhanh với Google</span>
        </button>

        <div className="relative flex py-2 items-center">
            <div className="grow border-t border-border"></div>
            <span className="shrink-0 mx-4 text-muted-foreground text-xs font-semibold uppercase tracking-wider">Hoặc</span>
            <div className="grow border-t border-border"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
             {error && (
                 <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    {error}
                 </div>
             )}
             
             <div className="space-y-1.5">
                 <label className="block text-sm font-semibold text-foreground">Họ và Tên</label>
                 <input 
                    name="name"
                    type="text" 
                    required 
                    className="w-full px-4 py-3.5 rounded-xl border border-input bg-secondary focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-foreground"
                    placeholder="Nguyen Van A"
                 />
                 <p className="text-[11px] text-muted-foreground">Tên này sẽ hiển thị trên chứng chỉ của bạn.</p>
             </div>

             <div className="space-y-1.5">
                 <label className="block text-sm font-semibold text-foreground">Email</label>
                 <input 
                    name="email"
                    type="email" 
                    required 
                    className="w-full px-4 py-3.5 rounded-xl border border-input bg-secondary focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-foreground"
                    placeholder="name@example.com"
                 />
             </div>
             
             <div className="space-y-1.5">
                 <label className="block text-sm font-semibold text-foreground">Mật khẩu</label>
                 <input 
                    name="password"
                    type="password" 
                    required 
                    minLength={6}
                    className="w-full px-4 py-3.5 rounded-xl border border-input bg-secondary focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-foreground"
                    placeholder="Tối thiểu 6 ký tự"
                 />
             </div>

             <div className="flex items-center gap-3">
                 <input type="checkbox" required id="terms" className="w-5 h-5 rounded border-border focus:ring-primary accent-primary" />
                 <label htmlFor="terms" className="text-sm text-muted-foreground">Tôi đồng ý với <Link href="#" className="text-primary font-semibold hover:underline">Điều khoản sử dụng</Link></label>
             </div>

             <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex justify-center items-center"
             >
                 {loading ? <Loader2 className="animate-spin" /> : "Đăng ký tài khoản"}
             </button>
        </form>

        <p className="text-center text-muted-foreground text-sm">
            Đã có tài khoản? <Link href="/login" className="text-primary font-semibold hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
