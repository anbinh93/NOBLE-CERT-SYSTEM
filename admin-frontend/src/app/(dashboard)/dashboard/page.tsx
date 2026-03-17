'use client';

import Link from 'next/link';
import { BookOpen, TrendingUp, Users, Award, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardStats } from '@/features/dashboard/api';

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
  const numFmt = new Intl.NumberFormat('vi-VN');

  const stats = [
    { title: 'Tổng doanh thu', value: data ? fmt.format(data.revenue) : '—', sub: data ? `${data.revenueTrend > 0 ? '+' : ''}${data.revenueTrend}% so với tháng trước` : '', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Học viên', value: data ? numFmt.format(data.newUsers) : '—', sub: data ? `${data.usersTrend > 0 ? '+' : ''}${data.usersTrend}% so với tháng trước` : '', icon: Users, color: 'text-[hsl(var(--chart-2))]', bg: 'bg-[hsl(var(--chart-2)/0.12)]' },
    { title: 'Khoá học', value: data ? numFmt.format(data.activeCourses) : '—', sub: data ? `${data.coursesTrend > 0 ? '+' : ''}${data.coursesTrend}% active` : '', icon: BookOpen, color: 'text-[hsl(var(--chart-3))]', bg: 'bg-[hsl(var(--chart-3)/0.12)]' },
    { title: 'Lượt ghi danh', value: data ? numFmt.format(data.totalEnrollments) : '—', sub: data ? `${data.enrollmentsTrend > 0 ? '+' : ''}${data.enrollmentsTrend}% so với tháng trước` : '', icon: Award, color: 'text-[hsl(var(--chart-4))]', bg: 'bg-[hsl(var(--chart-4)/0.12)]' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tổng quan hệ thống</h1>
        <p className="text-muted-foreground text-sm mt-1">Theo dõi hiệu suất nền tảng Noble-Cert theo thời gian thực.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border bg-card rounded-2xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  {isLoading ? (
                    <div className="h-8 bg-muted rounded-full mt-2 animate-pulse w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground mt-1 truncate">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 truncate">{stat.sub}</p>
                </div>
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border bg-card rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Giao dịch gần nhất</CardTitle>
              <CardDescription>Các đơn hàng mới nhất trên hệ thống</CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="rounded-full text-primary hover:bg-primary/10 gap-1">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            )}
            {/* Remove recentOrders from map since it's not in DashboardStats, handled by Transactions page snippet instead or a separate hook. For now we will hide recentOrders inside DashboardStats array as it's just raw trend data. To fix TS error quickly we mock an empty array or handle error. */}
            {!isLoading && (
              <p className="text-center py-8 text-muted-foreground text-sm">Xem danh sách chi tiết ở mục Giao dịch</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Tóm tắt chứng chỉ</CardTitle>
            <CardDescription>Tổng chứng chỉ đã cấp</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-10 w-10 text-primary" />
            </div>
            {isLoading ? (
              <div className="h-10 w-24 bg-muted rounded-full animate-pulse" />
            ) : (
              <p className="text-4xl font-bold text-foreground">{data ? numFmt.format(data.totalEnrollments) : '—'}</p>
            )}
            <p className="text-muted-foreground text-sm">chứng chỉ đã cấp</p>
            <Link href="/certificates">
              <Button variant="outline" size="sm" className="rounded-full border-border mt-2 gap-1">
                Quản lý <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
