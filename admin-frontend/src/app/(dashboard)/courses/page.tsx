'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Search, RefreshCw, Archive, Globe, Trash2, Pencil } from 'lucide-react';
import {
  useAdminCourses,
  useCreateCourse,
  usePublishCourse,
  useArchiveCourse,
  useDeleteCourse,
  type AdminCourse,
  type CourseFilters,
} from '@/features/courses/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Bản nháp', className: 'bg-muted text-muted-foreground border-border' },
  PUBLISHED: { label: 'Công khai', className: 'bg-primary/10 text-primary border-primary/20' },
  ARCHIVED: { label: 'Lưu trữ', className: 'bg-muted text-muted-foreground border-border' },
};

export default function CoursesPage() {
  const [filters, setFilters] = useState<CourseFilters>({ page: 1, pageSize: 20, sortBy: 'updatedAt', sortOrder: 'desc' });
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null);

  const { data, isLoading, error, refetch } = useAdminCourses(filters);
  const createMutation = useCreateCourse();
  const publishMutation = usePublishCourse();
  const archiveMutation = useArchiveCourse();
  const deleteMutation = useDeleteCourse();

  const handleSearch = () => setFilters((f) => ({ ...f, q: search, page: 1 }));

  const handleSort = (field: 'title' | 'updatedAt' | 'price') => {
    setFilters((f) => {
      const isSame = f.sortBy === field;
      const nextOrder: 'asc' | 'desc' = isSame && f.sortOrder === 'asc' ? 'desc' : 'asc';
      return { ...f, sortBy: field, sortOrder: nextOrder, page: 1 };
    });
  };

  const sortedItems = useMemo(() => {
    if (!data?.items) return [];
    const items = [...data.items];
    const { sortBy, sortOrder } = filters;
    if (!sortBy) return items;
    const dir = sortOrder === 'asc' ? 1 : -1;
    return items.sort((a, b) => {
      let av: any = a[sortBy as keyof AdminCourse];
      let bv: any = b[sortBy as keyof AdminCourse];
      if (sortBy === 'updatedAt') {
        av = new Date(a.updatedAt).getTime();
        bv = new Date(b.updatedAt).getTime();
      }
      if (sortBy === 'price') {
        av = a.price;
        bv = b.price;
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      return String(av ?? '').localeCompare(String(bv ?? ''), 'vi') * dir;
    });
  }, [data?.items, filters]);
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createMutation.mutateAsync({ title: newTitle.trim() });
      toast.success('Tạo khoá học thành công');
      setShowCreate(false);
      setNewTitle('');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const handleAction = async (action: 'publish' | 'archive' | 'delete', course: AdminCourse) => {
    try {
      if (action === 'publish') { await publishMutation.mutateAsync(course.id); toast.success('Đã xuất bản'); }
      if (action === 'archive') { await archiveMutation.mutateAsync(course.id); toast.success('Đã lưu trữ'); }
      if (action === 'delete') {
        setDeleteTarget(course);
      }
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Đã xoá khoá học');
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Khoá học</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data ? `${data.total} khoá học` : 'Quản lý toàn bộ khoá học trên nền tảng'}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-full gap-2">
          <Plus className="h-4 w-4" /> Tạo khoá học
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên…"
            aria-label="Tìm kiếm khoá học"
            value={search}
            className="pl-9 rounded-full border-border bg-card"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Select
          value={filters.status ?? 'all'}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v, page: 1 }))}
        >
          <SelectTrigger className="w-36 rounded-full border-border bg-card" aria-label="Lọc trạng thái">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="DRAFT">Bản nháp</SelectItem>
            <SelectItem value="PUBLISHED">Công khai</SelectItem>
            <SelectItem value="ARCHIVED">Lưu trữ</SelectItem>
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
              <TableHead
                className="text-muted-foreground font-semibold cursor-pointer select-none"
                onClick={() => handleSort('title')}
              >
                Tên khoá học
                {filters.sortBy === 'title' && (
                  <span className="ml-1 text-xs">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold hidden md:table-cell">Giảng viên</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Trạng thái</TableHead>
              <TableHead className="text-muted-foreground font-semibold hidden lg:table-cell text-right">Học viên</TableHead>
              <TableHead
                className="text-muted-foreground font-semibold hidden lg:table-cell text-right cursor-pointer select-none"
                onClick={() => handleSort('price')}
              >
                Giá
                {filters.sortBy === 'price' && (
                  <span className="ml-1 text-xs">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell colSpan={6}>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            )}
            {error && (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Lỗi tải dữ liệu. <button className="text-primary underline" onClick={() => refetch()}>Thử lại</button>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && data?.items.length === 0 && (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Không có khoá học nào</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {sortedItems.map((course) => {
              const badge = STATUS_BADGE[course.status];
              return (
                <TableRow key={course.id} className="border-border hover:bg-muted/30 transition-colors duration-150">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground line-clamp-1">{course.title}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          {new Date(course.updatedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden md:table-cell">{course.instructor.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-foreground hidden lg:table-cell">
                    {new Intl.NumberFormat('vi-VN').format(course._count.enrollments)}
                  </TableCell>
                  <TableCell className="text-right text-foreground hidden lg:table-cell">
                    {course.price === 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">Miễn phí</span>
                    ) : (
                      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                      >
                        <Link href={`/courses/${course.id}`} aria-label="Chỉnh sửa khoá học">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {course.status === 'DRAFT' && (
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                          aria-label="Xuất bản" onClick={() => handleAction('publish', course)}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      )}
                      {course.status === 'ARCHIVED' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                          aria-label="Mở lại (Công khai)"
                          onClick={() => handleAction('publish', course)}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      )}
                      {course.status === 'PUBLISHED' && (
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted hover:text-muted-foreground"
                          aria-label="Lưu trữ" onClick={() => handleAction('archive', course)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Xoá khoá học" onClick={() => handleAction('delete', course)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
          <span>Trang {data.page} / {data.totalPages}</span>
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

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border rounded-2xl">
          <DialogHeader><DialogTitle>Tạo khoá học mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-course-title">Tên khoá học <span aria-hidden>*</span></Label>
              <Input
                id="new-course-title"
                name="courseTitle"
                autoComplete="off"
                placeholder="VD: React từ Cơ bản đến Nâng cao"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="border-input rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full border-border" onClick={() => setShowCreate(false)}>Huỷ</Button>
            <Button className="rounded-full" onClick={handleCreate} disabled={createMutation.isPending || !newTitle.trim()}>
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo khoá học'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle>Xoá khoá học?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Bạn sắp xoá khoá học{' '}
            <span className="font-semibold text-foreground">
              {deleteTarget?.title ?? ''}
            </span>
            . Hành động này không thể hoàn tác.
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full border-border" onClick={() => setDeleteTarget(null)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xoá...' : 'Xoá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
