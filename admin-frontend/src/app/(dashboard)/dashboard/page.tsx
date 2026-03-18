"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CreditCard, TrendingUp, Users, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/api";

interface Stats {
  totalRevenue: number;
  totalUsers: number;
  totalCourses: number;
  totalOrders: number;
}

interface RecentOrder {
  id: string;
  orderCode: number;
  amount: number;
  status: string;
  memo: string;
  createdAt: string;
  user: { name: string; email: string };
  course: { title: string };
}

const statusMap: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "secondary";
  }
> = {
  SUCCESS: { label: "Thành công", variant: "success" },
  PENDING: { label: "Chờ TT", variant: "warning" },
  FAILED: { label: "Thất bại", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "secondary" },
  MISMATCH: { label: "Sai lệch", variant: "destructive" },
};

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminFetch<Stats>("/stats"),
      adminFetch<{ orders: RecentOrder[] }>("/orders/recent"),
    ])
      .then(([s, o]) => {
        setStats(s);
        setRecentOrders(o.orders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Tổng doanh thu",
      value: stats ? formatVND(stats.totalRevenue) : "—",
      icon: TrendingUp,
    },
    {
      title: "Học viên & Giảng viên",
      value: stats?.totalUsers?.toLocaleString("vi-VN") ?? "—",
      icon: Users,
    },
    {
      title: "Khoá học",
      value: stats?.totalCourses?.toLocaleString("vi-VN") ?? "—",
      icon: BookOpen,
    },
    {
      title: "Giao dịch thành công",
      value: stats?.totalOrders?.toLocaleString("vi-VN") ?? "—",
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Tổng quan hệ thống
        </h2>
        <p className="text-muted-foreground">
          Theo dõi hiệu suất nền tảng Noble-Cert.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần nhất</CardTitle>
          <CardDescription>
            10 giao dịch mới nhất trên hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Chưa có giao dịch nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => {
                  const s = statusMap[order.status] || {
                    label: order.status,
                    variant: "secondary" as const,
                  };
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.orderCode}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.user.email}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {order.course.title}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatVND(order.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
