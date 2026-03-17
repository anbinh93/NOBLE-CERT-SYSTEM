'use client';

import { useMemo, useState } from 'react';
import { Users, Search, RefreshCw, BookOpen } from 'lucide-react';
import { useAdminLearners } from '@/features/learners/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

export default function LearnersPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ page: 1, pageSize: 20, q: '' });

  const { data, isLoading, error, refetch } = useAdminLearners(filters);

  const handleSearch = () => setFilters((f) => ({ ...f, q: search, page: 1 }));

  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'enrollments'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'name' | 'createdAt' | 'enrollments') => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  };

  const sortedItems = useMemo(() => {
    if (!data?.items) return [];
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...data.items].sort((a, b) => {
      if (sortBy === 'enrollments') {
        return (a._count.enrollments - b._count.enrollments) * dir;
      }
      if (sortBy === 'createdAt') {
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
        );
      }
      return a.name.localeCompare(b.name, 'vi') * dir;
    });
  }, [data?.items, sortBy, sortDir]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Học viên</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data ? `${new Intl.NumberFormat('vi-VN').format(data.total)} học viên` : 'Quản lý và tra cứu học viên'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc email…"
            aria-label="Tìm kiếm người học"
            value={search}
            className="pl-9 rounded-full border-border bg-card"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="outline" className="rounded-full border-border" onClick={handleSearch}>Tìm</Button>
        <Button variant="outline" size="icon" className="rounded-full border-border" onClick={() => refetch()} aria-label="Làm mới">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead
                className="text-muted-foreground font-semibold cursor-pointer select-none"
                onClick={() => handleSort('name')}
              >
                Học viên
                {sortBy === 'name' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold hidden md:table-cell">Email</TableHead>
              <TableHead
                className="text-muted-foreground font-semibold text-right hidden sm:table-cell cursor-pointer select-none"
                onClick={() => handleSort('enrollments')}
              >
                Khoá học
                {sortBy === 'enrollments' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead
                className="text-muted-foreground font-semibold hidden lg:table-cell cursor-pointer select-none"
                onClick={() => handleSort('createdAt')}
              >
                Ngày tham gia
                {sortBy === 'createdAt' && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="border-border">
                <TableCell colSpan={5}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
              </TableRow>
            ))}
            {error && (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Lỗi tải dữ liệu. <button className="text-primary underline" onClick={() => refetch()}>Thử lại</button>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && data?.items.length === 0 && (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Không tìm thấy học viên</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {sortedItems.map((learner) => (
              <TableRow key={learner.id} className="border-border hover:bg-muted/30 transition-colors duration-150">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                      {learner.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{learner.name}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{learner.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm hidden md:table-cell">{learner.email}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-foreground font-medium">{learner._count.enrollments}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                  {new Date(learner.createdAt).toLocaleDateString('vi-VN')}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/users/${learner.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-primary hover:bg-primary/10 hover:text-primary h-8 px-3 text-xs font-semibold"
                    >
                      Xem chi tiết
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground" aria-live="polite">
          <span>Trang {data.page} / {data.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full border-border"
              disabled={data.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >← Trước</Button>
            <Button variant="outline" size="sm" className="rounded-full border-border"
              disabled={data.page >= data.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >Tiếp →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
