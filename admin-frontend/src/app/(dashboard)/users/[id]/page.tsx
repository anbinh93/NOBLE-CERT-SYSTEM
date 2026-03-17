'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Award, BookOpen, TrendingUp } from 'lucide-react';

import { adminApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLearnerEnrollments } from '@/features/learners/api';

type Role = 'SUPER_ADMIN' | 'STAFF' | 'INSTRUCTOR' | 'STUDENT';

interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    enrollments: number;
    orders: number;
  };
}

const ROLE_BADGE: Record<Role, { label: string; className: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  STAFF: {
    label: 'Nhân viên',
    className: 'bg-accent text-accent-foreground border-accent/50',
  },
  INSTRUCTOR: {
    label: 'Giảng viên',
    className: 'bg-secondary text-secondary-foreground border-secondary/50',
  },
  STUDENT: {
    label: 'Học viên',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminApi.get<AdminUserDetail>(`/users/${id}`),
    enabled: !!id,
  });

  const {
    data: enrollments,
    isLoading: enrollLoading,
  } = useLearnerEnrollments(typeof id === 'string' ? id : '');

  if (userLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded-full w-48" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Không tìm thấy người dùng.{' '}
        <Link href="/users" className="text-primary underline">
          Quay lại
        </Link>
      </div>
    );
  }

  const roleBadge = ROLE_BADGE[user.role] ?? ROLE_BADGE.STUDENT;

  const isStudent = user.role === 'STUDENT';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link href="/users">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground hover:text-foreground -ml-2"
          aria-label="Quay lại danh sách tài khoản"
        >
          <ChevronLeft className="h-4 w-4" /> Danh sách tài khoản
        </Button>
      </Link>

      {/* Profile card */}
      <Card className="border-border rounded-2xl shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-2xl">
              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 space-y-1">
              <h1 className="text-xl font-bold text-foreground">{user.name ?? 'Chưa có tên'}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs font-semibold ${roleBadge.className}`}>
                  {roleBadge.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    user.isActive
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }
                >
                  {user.isActive ? 'Hoạt động' : 'Đã khoá'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                <BookOpen className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-foreground">{user._count.enrollments}</p>
              <p className="text-xs text-muted-foreground">Khoá học</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                <Award className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {isStudent ? enrollments?.items.filter((e) => e.serial).length ?? 0 : user._count.orders}
              </p>
              <p className="text-xs text-muted-foreground">
                {isStudent ? 'Chứng chỉ / khoá học hoàn thành' : 'Đơn hàng'}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                <TrendingUp className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {isStudent && user._count.enrollments > 0
                  ? Math.round(
                      ((enrollments?.items.filter((e) => e.status === 'COMPLETED').length ?? 0) /
                        user._count.enrollments) *
                        100,
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">
                {isStudent ? 'Tỷ lệ hoàn thành' : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments (chỉ cho học viên) */}
      {isStudent && (
        <Card className="border-border rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Lịch sử học tập</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {enrollLoading && (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            )}
            {!enrollLoading && !enrollments?.items.length && (
              <div className="text-center py-12 text-muted-foreground">Chưa có khoá học nào</div>
            )}
            {enrollments?.items.map((e, i) => {
              const progress = e.progress.totalUnits
                ? Math.round((e.progress.completedUnits / e.progress.totalUnits) * 100)
                : null;

              return (
                <div
                  key={e.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 ${
                    i > 0 ? 'border-t border-border' : ''
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{e.course.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold bg-muted text-muted-foreground border-border"
                      >
                        {e.status}
                      </Badge>
                      {e.serial && (
                        <span className="font-mono text-xs text-muted-foreground">{e.serial}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm shrink-0">
                    {progress !== null && (
                      <div className="text-right hidden sm:block">
                        <p className="font-semibold text-foreground">{progress}%</p>
                        <p className="text-xs text-muted-foreground">Tiến độ</p>
                      </div>
                    )}
                    {e.bestAttempt && (
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{e.bestAttempt.score}</p>
                        <p className="text-xs text-muted-foreground">Điểm cao nhất</p>
                      </div>
                    )}
                    <div className="text-right hidden lg:block">
                      <p className="text-muted-foreground text-xs">
                        {new Date(e.updatedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

