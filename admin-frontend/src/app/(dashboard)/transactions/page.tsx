'use client';

import { useState } from 'react';
import { RefreshCw, Search, RotateCcw } from 'lucide-react';
import { useAdminOrders, useSyncOrder, type OrderFilters } from '@/features/payments/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:    { label: 'Chờ TT',  className: 'bg-muted text-muted-foreground border-border' },
  SUCCESS:    { label: 'Thành công', className: 'bg-primary/10 text-primary border-primary/20' },
  CANCELLED:  { label: 'Đã huỷ',  className: 'bg-muted text-muted-foreground border-border' },
  FAILED:     { label: 'Thất bại', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  MISMATCH:   { label: 'Lệch tiền', className: 'bg-muted text-muted-foreground border-border' },
  PROCESSING: { label: 'Đang xử lý', className: 'bg-secondary/50 text-secondary-foreground border-border' },
};

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<OrderFilters>({ page: 1, pageSize: 20 });
  const syncMutation = useSyncOrder();

  const { data, isLoading, error, refetch } = useAdminOrders(filters);

  const handleSearch = () => setFilters((f) => ({ ...f, q: search, page: 1 }));
  const handleSync = async (orderCode: number) => {
    try {
      const result = await syncMutation.mutateAsync(orderCode);
      toast.success(`Đồng bộ thành công. Trạng thái: ${result.status}`);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Giao dịch</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data ? `${new Intl.NumberFormat('vi-VN').format(data.total)} giao dịch` : 'Kiểm tra và đối soát thanh toán'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mã đơn / Email..."
            value={search}
            className="pl-9 rounded-full border-border bg-card"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            aria-label="Tìm kiếm giao dịch"
          />
        </div>
        <Select
          value={filters.status ?? 'all'}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v, page: 1 }))}
        >
          <SelectTrigger className="w-36 rounded-full border-border bg-card" aria-label="Lọc trạng thái giao dịch">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="PENDING">Chờ TT</SelectItem>
            <SelectItem value="SUCCESS">Thành công</SelectItem>
            <SelectItem value="CANCELLED">Đã huỷ</SelectItem>
            <SelectItem value="MISMATCH">Lệch tiền</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="rounded-full border-border" onClick={() => refetch()} aria-label="Làm mới">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold">Mã đơn</TableHead>
              <TableHead className="text-muted-foreground font-semibold hidden md:table-cell">Học viên</TableHead>
              <TableHead className="text-muted-foreground font-semibold hidden lg:table-cell">Khoá học</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Trạng thái</TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold hidden sm:table-cell">Số tiền</TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold hidden lg:table-cell">Ngày tạo</TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold">Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="border-border">
                <TableCell colSpan={7}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
              </TableRow>
            ))}
            {error && (
              <TableRow className="border-border">
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Lỗi tải dữ liệu. <button className="text-primary underline" onClick={() => refetch()}>Thử lại</button>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && data?.items.length === 0 && (
              <TableRow className="border-border">
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">Không có giao dịch nào</TableCell>
              </TableRow>
            )}
            {!isLoading && !error && data?.items.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, className: 'bg-muted text-muted-foreground border-border' };
              return (
                <TableRow key={order.id} className="border-border hover:bg-muted/30 transition-colors duration-150">
                  <TableCell>
                    <div className="font-mono text-xs font-semibold text-foreground">
                      #{order.orderCode}
                    </div>
                    <div className="font-sans font-normal text-muted-foreground text-xs mt-1">{order.memo}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                    <p className="text-foreground font-medium">{order.user.name}</p>
                    <p className="text-xs">{order.user.email}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                    <span className="line-clamp-1 max-w-40">
                      {order.course?.title ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs font-semibold ${cfg.className}`}>{cfg.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-foreground font-semibold hidden sm:table-cell">
                    {order.amount === 0 ? (
                      <span className="text-green-600 dark:text-green-400">Miễn phí</span>
                    ) : fmt.format(order.amount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm hidden lg:table-cell">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'PENDING' && (
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                        aria-label={`Đồng bộ đơn hàng #${order.orderCode}`}
                        disabled={syncMutation.isPending}
                        onClick={() => handleSync(order.orderCode)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground" aria-live="polite">
          <span>Trang {data.page} / {data.totalPages} — {data.total} giao dịch</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full border-border"
              disabled={data.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >← Trước</Button>
            <Button variant="outline" size="sm" className="rounded-full border-border"
              disabled={data.page >= data.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >Tiếp →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
