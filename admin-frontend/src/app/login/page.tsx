'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import type { BackendRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const LOGIN_ENDPOINT = `${API_BASE}/api/v1/auth/login`;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (values: LoginFormValues) => {
    const res = await fetch(LOGIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: values.email,
        password: values.password,
      }),
    });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(json?.message || 'Đăng nhập thất bại');
    }

    const user = json?.data?.user as
      | { id: string; name: string; email: string; role: BackendRole }
      | undefined;
    const accessToken = json?.data?.accessToken as string | undefined;

    if (!user || !accessToken) {
      throw new Error('Phản hồi đăng nhập không hợp lệ');
    }

    login({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      avatar: '',
    });

    toast.success(`Đăng nhập thành công (${user.role})`);
    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background image (decorative) */}
      <Image
        src="/background.png"
        alt=""
        fill
        priority
        aria-hidden="true"
        className="object-cover -z-20"
      />
      <div className="pointer-events-none absolute inset-0 bg-background/40 dark:bg-background/75 backdrop-blur-sm -z-10" />
      <div className="w-full max-w-md space-y-6">


        <Card className="bg-background/92 border-border/80 shadow-xl backdrop-blur-md">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center">
              <Image
                src="/logo.webp"
                alt="Noble-Cert Admin"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Noble-Cert Admin</h1>
            <p className="text-sm text-muted-foreground">Trung tâm quản trị hệ thống</p>
          </div>
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
                          placeholder="example@example.com"
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Quên mật khẩu? Liên hệ Super Admin để đặt lại.
                </p>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
