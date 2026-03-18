"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (isAuthenticated) {
      // Instructor → courses, Admin → dashboard
      router.replace("/courses");
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.message || "Đăng nhập thất bại");
        return;
      }

      const data = json?.data ?? json;
      const user = data.user;
      const accessToken = data.accessToken;

      // Check admin role
      const adminRoles = ["SUPER_ADMIN", "INSTRUCTOR", "STAFF"];
      if (!adminRoles.includes(user.role)) {
        toast.error("Tài khoản không có quyền truy cập trang quản trị");
        return;
      }

      // Map backend role to admin display role
      const roleMap: Record<string, string> = {
        SUPER_ADMIN: "Super Admin",
        INSTRUCTOR: "Instructor",
        STAFF: "Support",
      };

      login(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: (roleMap[user.role] || user.role) as any,
          avatar: "",
        },
        accessToken,
      );

      toast.success("Đăng nhập thành công");
      // Admin → dashboard, Instructor → courses
      const redirectPath =
        user.role === "SUPER_ADMIN" ? "/dashboard" : "/courses";
      router.push(redirectPath);
    } catch {
      toast.error("Lỗi kết nối đến server");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Noble-Cert Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Trung tâm quản trị hệ thống
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Đăng nhập</CardTitle>
            <CardDescription>
              Nhập thông tin tài khoản để truy cập hệ thống quản trị.
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="instructor@noblecert.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Sử dụng tài khoản Instructor hoặc Super Admin để đăng nhập.
                </p>
                <Link
                  href="/forgot-password"
                  className="text-xs text-center text-primary hover:underline font-medium"
                >
                  Quên mật khẩu?
                </Link>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
