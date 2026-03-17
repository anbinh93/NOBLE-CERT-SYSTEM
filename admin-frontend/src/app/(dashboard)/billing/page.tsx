'use client';

import { useMemo } from 'react';
import { useAdminOrders, type AdminOrder } from '@/features/payments/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, TrendingUp, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BillingPage() {
  const { data, isLoading, error } = useAdminOrders({ pageSize: 100 });

  const metrics = useMemo(() => {
    if (!data?.items) return { totalRevenue: 0, successfulOrders: 0, pendingOrders: 0 };
    return data.items.reduce((acc, order) => {
      if (order.status === 'SUCCESS') {
        acc.totalRevenue += order.amount;
        acc.successfulOrders += 1;
      }
      if (order.status === 'PENDING') {
        acc.pendingOrders += 1;
      }
      return acc;
    }, { totalRevenue: 0, successfulOrders: 0, pendingOrders: 0 });
  }, [data]);

  const recentOrders = useMemo(() => {
    return data?.items?.slice(0, 10) || [];
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="p-12 text-center text-destructive">Lỗi tải dữ liệu doanh thu.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doanh thu & Thanh toán</h1>
          <p className="text-muted-foreground text-sm mt-1">Tổng quan tình hình tài chính của nền tảng</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ghi nhận từ các giao dịch thành công</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã thanh toán</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.successfulOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Số lượng đơn hàng thành công</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chờ thanh toán</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Số lượng đơn hàng đang chờ duyệt/chuyển khoản</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Snippet */}
      <Card className="bg-card border-border shadow-sm max-w-5xl">
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
          <CardDescription>10 đơn hàng mới nhất trên hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Mã ĐH</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chưa có giao dịch nào
                    </TableCell>
                  </TableRow>
                )}
                {recentOrders.map((order: AdminOrder) => (
                  <TableRow key={order.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground">#{order.orderCode}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{order.user.name}</span>
                        <span
                          className="text-xs text-muted-foreground max-w-37.5 truncate"
                          title={order.course?.title ?? ''}
                        >
                          {order.course?.title ?? '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}
                    </TableCell>
                    <TableCell>
                      {order.status === 'SUCCESS' && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Thành công</Badge>}
                      {order.status === 'PENDING' && <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Đang chờ</Badge>}
                      {order.status !== 'SUCCESS' && order.status !== 'PENDING' && (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">{order.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-end">
             <Link href="/transactions">
               <Button variant="outline" className="rounded-full">Xem tất cả giao dịch</Button>
             </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
