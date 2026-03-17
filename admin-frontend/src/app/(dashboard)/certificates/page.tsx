'use client';

import { useMemo, useState } from 'react';
import { Search, ShieldCheck, Mail, Loader2, ArrowUpRight, Ban } from 'lucide-react';
import { useAdminCertificates, useRevokeCertificate, type CertificateFilters } from '@/features/certificates/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function CertificatesPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CertificateFilters>({ page: 1, pageSize: 20 });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSerial, setPreviewSerial] = useState<string | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  
  const { data, isLoading, error, refetch } = useAdminCertificates(filters);
  const revokeMutation = useRevokeCertificate();

  const handleSearch = () => setFilters((f) => ({ ...f, q: search, page: 1 }));

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const previewUrl = previewSerial ? `${apiBase}/api/public/verify/${previewSerial}/preview` : '';

  const [sortBy, setSortBy] = useState<'serial' | 'issuedAt'>('issuedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'serial' | 'issuedAt') => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  };

  const visibleItems = useMemo(() => {
    const base =
      data?.items.filter((cert) =>
        filters.isValid === undefined ? true : filters.isValid ? cert.isValid : !cert.isValid,
      ) ?? [];
    const dir = sortDir === 'asc' ? 1 : -1;
    return base.sort((a, b) => {
      if (sortBy === 'issuedAt') {
        return (
          (new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime()) * dir
        );
      }
      return a.serial.localeCompare(b.serial, 'vi') * dir;
    });
  }, [data?.items, filters.isValid, sortBy, sortDir]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chứng chỉ</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý và tra cứu chứng chỉ đã cấp phát</p>
        </div>
        <Link href="/lookup">
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" /> Tra cứu nâng cao
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mã số / Email / Tên học viên..."
            value={search}
            className="pl-9 rounded-full border-border bg-card"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Select
          value={filters.isValid === undefined ? 'all' : String(filters.isValid)}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, isValid: v === 'all' ? undefined : v === 'true', page: 1 }))
          }
        >
          <SelectTrigger className="w-40 rounded-full border-border bg-card">
            <SelectValue placeholder="Trạng thái hợp lệ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Hợp lệ (Active)</SelectItem>
            <SelectItem value="false">Đã thu hồi (Revoked)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead
                className="w-[12%] cursor-pointer select-none"
                onClick={() => handleSort('serial')}
              >
                Số hiệu (ID)
                {sortBy === 'serial' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead className="w-[20%]">Học viên</TableHead>
              <TableHead className="w-[28%]">Khoá học</TableHead>
              <TableHead
                className="w-[15%] cursor-pointer select-none"
                onClick={() => handleSort('issuedAt')}
              >
                Ngày cấp
                {sortBy === 'issuedAt' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead className="w-[15%]">Trạng thái</TableHead>
              <TableHead className="w-[10%] text-right">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    <span>Đang tải dữ liệu…</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            
            {error && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-destructive">
                  <p>Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.</p>
                  <Button variant="link" onClick={() => refetch()}>Thử lại</Button>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && visibleItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Không tìm thấy chứng chỉ nào.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && visibleItems.map((cert) => (
              <TableRow key={cert.id} className="border-border hover:bg-muted/30">
                <TableCell className="font-mono text-sm font-medium">{cert.serial}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm text-foreground">{cert.user.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" /> {cert.user.email}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground">
                  <span className="line-clamp-2" title={cert.course.title}>{cert.course.title}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(cert.issuedAt).toLocaleDateString('vi-VN')}
                </TableCell>
                <TableCell>
                  {cert.isValid ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-0.5">
                      <ShieldCheck className="h-3 w-3" /> Hợp lệ
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">Đã thu hồi</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary"
                      title="Xem chứng chỉ"
                      aria-label="Xem chứng chỉ"
                      onClick={() => {
                        setPreviewSerial(cert.serial);
                        setPreviewOpen(true);
                      }}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="sr-only">Xem chứng chỉ</span>
                    </Button>
                    {cert.isValid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        title="Thu hồi chứng chỉ"
                        aria-label="Thu hồi chứng chỉ"
                        onClick={() => {
                          setRevokeTargetId(cert.id);
                          setRevokeReason('');
                          setRevokeOpen(true);
                        }}
                      >
                        <Ban className="h-4 w-4" />
                        <span className="sr-only">Thu hồi chứng chỉ</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Hiển thị trang {data.page} trên {data.totalPages} ({data.total} bản ghi)</span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" className="rounded-full"
              disabled={data.page <= 1}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
            >
              Trước
            </Button>
            <Button
              variant="outline" size="sm" className="rounded-full"
              disabled={data.page >= data.totalPages}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
            >
              Tiếp
            </Button>
          </div>
        </div>
      )}

      {/* Preview dialog */}
      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) setPreviewSerial(null);
        }}
      >
        <DialogContent className="bg-card border-border rounded-2xl max-w-4xl">
          <DialogHeader>
            <DialogTitle>Xem chứng chỉ</DialogTitle>
          </DialogHeader>
          {!previewSerial ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang chuẩn bị…
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Serial: <span className="font-mono text-foreground">{previewSerial}</span>
              </div>
              <div className="relative w-full overflow-hidden rounded-xl border border-border bg-muted/20">
                <div className="relative w-full aspect-[1.414/1]">
                  <Image
                    src={previewUrl}
                    alt={`Certificate preview ${previewSerial}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button asChild variant="outline" className="rounded-full border-border">
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    Mở ảnh full size
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke dialog */}
      <Dialog
        open={revokeOpen}
        onOpenChange={(open) => {
          setRevokeOpen(open);
          if (!open) {
            setRevokeTargetId(null);
            setRevokeReason('');
          }
        }}
      >
        <DialogContent className="bg-card border-border rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Thu hồi chứng chỉ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bạn sắp thu hồi chứng chỉ này. Hành động này sẽ khiến link verify public không còn hợp lệ.
            </p>
            <div className="space-y-2">
              <Label htmlFor="revoke-reason" className="text-sm">Lý do thu hồi (tuỳ chọn)</Label>
              <textarea
                id="revoke-reason"
                className="w-full min-h-24 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                Thông tin lý do sẽ chỉ dùng nội bộ để đối soát.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full border-border"
              onClick={() => setRevokeOpen(false)}
            >
              Huỷ
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={!revokeTargetId || revokeMutation.isPending}
              onClick={async () => {
                if (!revokeTargetId) return;
                try {
                  await revokeMutation.mutateAsync({ id: revokeTargetId, reason: revokeReason || undefined });
                  setRevokeOpen(false);
                  setRevokeTargetId(null);
                  setRevokeReason('');
                } catch {
                  // toast đã xử lý ở nơi khác nếu cần
                }
              }}
            >
              {revokeMutation.isPending ? 'Đang thu hồi…' : 'Thu hồi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
