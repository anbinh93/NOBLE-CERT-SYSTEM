"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { adminFetch } from "@/lib/api";

interface Order {
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
  PENDING: { label: "Chờ thanh toán", variant: "warning" },
  PROCESSING: { label: "Đang xử lý", variant: "warning" },
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

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status && status !== "all") params.set("status", status);

    adminFetch<{ orders: Order[]; total: number; totalPages: number }>(
      `/orders?${params}`,
    )
      .then((data) => {
        setOrders(data.orders);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Giao dịch</h2>
        <p className="text-muted-foreground">
          Tất cả giao dịch thanh toán trên hệ thống.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg">{total} giao dịch</CardTitle>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="SUCCESS">Thành công</SelectItem>
                <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
                <SelectItem value="FAILED">Thất bại</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              Không có giao dịch nào.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Khóa học</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const s = statusMap[order.status] || {
                      label: order.status,
                      variant: "secondary" as const,
                    };
                    const isCert = order.memo.startsWith("CERT");
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.orderCode}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isCert ? "info" : "default"}
                            className="text-xs"
                          >
                            {isCert ? "Chứng chỉ" : "Khoá học"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {order.user.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order.user.email}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {page}/{totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
