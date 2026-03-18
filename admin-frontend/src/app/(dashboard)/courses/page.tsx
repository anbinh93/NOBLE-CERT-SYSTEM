"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  createdAt: string;
  instructor: { name: string; email: string };
  _count: { enrollments: number; orders: number };
}

const statusMap: Record<
  string,
  { label: string; variant: "success" | "warning" | "secondary" }
> = {
  PUBLISHED: { label: "Đã xuất bản", variant: "success" },
  DRAFT: { label: "Bản nháp", variant: "warning" },
  ARCHIVED: { label: "Lưu trữ", variant: "secondary" },
};

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "Super Admin";
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const fetchCourses = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status && status !== "all") params.set("status", status);

    adminFetch<{ courses: Course[]; total: number; totalPages: number }>(
      `/courses?${params}`,
    )
      .then((data) => {
        setCourses(data.courses);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề khóa học");
      return;
    }
    setCreating(true);
    try {
      const data = await adminFetch<{ course: { id: string } }>("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          price: Number(newPrice) || 0,
        }),
      });
      toast.success("Tạo khóa học thành công!");
      setDialogOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewPrice("");
      // Navigate to the new course detail page
      router.push(`/courses/${data.course.id}`);
    } catch (err: any) {
      toast.error(err.message || "Tạo khóa học thất bại");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Quản lý khoá học
          </h2>
          <p className="text-muted-foreground">
            Danh sách tất cả khoá học trên hệ thống.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tạo khoá học
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tạo khoá học mới</DialogTitle>
                <DialogDescription>
                  Khoá học sẽ được tạo ở trạng thái Bản nháp. Bạn có thể chỉnh
                  sửa và xuất bản sau.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề khoá học *</Label>
                  <Input
                    id="title"
                    placeholder="VD: Lập trình Web từ A đến Z"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Mô tả</Label>
                  <Textarea
                    id="desc"
                    placeholder="Mô tả ngắn gọn về nội dung khoá học..."
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Giá (VND)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0 = Miễn phí"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo khoá học"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg">{total} khoá học</CardTitle>
            <div className="flex gap-3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 w-[250px]"
                  placeholder="Tìm theo tên khoá học..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                  <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  <SelectItem value="ARCHIVED">Lưu trữ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              Không tìm thấy khoá học nào.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên khoá học</TableHead>
                    <TableHead>Giảng viên</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-center">Học viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => {
                    const s = statusMap[course.status] || {
                      label: course.status,
                      variant: "secondary" as const,
                    };
                    return (
                      <TableRow
                        key={course.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => router.push(`/courses/${course.id}`)}
                      >
                        <TableCell className="font-medium max-w-[280px] truncate">
                          {course.title}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {course.instructor.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {course.instructor.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {course.price === 0 ? (
                            <span className="text-green-600 font-medium">
                              Miễn phí
                            </span>
                          ) : (
                            formatVND(course.price)
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {course._count.enrollments}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(course.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
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
