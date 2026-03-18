"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  BookOpen,
  CreditCard,
  Loader2,
  Save,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/api";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { enrollments: number; courses: number; orders: number };
}

interface StudentStats {
  coursesEnrolled: number;
  totalPaid: number;
  ordersCount: number;
}

interface InstructorStats {
  coursesAssigned: number;
  courses: { id: string; title: string; status: string }[];
}

const roleLabels: Record<
  string,
  { label: string; variant: "success" | "warning" | "secondary" }
> = {
  SUPER_ADMIN: { label: "Super Admin", variant: "success" },
  INSTRUCTOR: { label: "Người hướng dẫn", variant: "warning" },
  STUDENT: { label: "Học viên", variant: "secondary" },
  STAFF: { label: "Nhân viên", variant: "secondary" },
};

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ user: UserDetail; stats: any }>(
        `/users/${userId}`,
      );
      setUser(data.user);
      setStats(data.stats);
      setName(data.user.name);
      setIsActive(data.user.isActive);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Tên không được để trống");
      return;
    }
    setSaving(true);
    try {
      await adminFetch(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ name: name.trim(), isActive }),
      });
      toast.success("Đã cập nhật!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminFetch(`/users/${userId}`, { method: "DELETE" });
      toast.success("Đã xoá người dùng!");
      router.push("/users");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Không tìm thấy người dùng.
      </div>
    );
  }

  const rl = roleLabels[user.role] || {
    label: user.role,
    variant: "secondary" as const,
  };
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/users")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isSuperAdmin ? (
              <ShieldCheck className="h-6 w-6" />
            ) : (
              <User className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <Badge variant={rl.variant}>{rl.label}</Badge>
              <Badge variant={user.isActive ? "success" : "secondary"}>
                {user.isActive ? "Hoạt động" : "Bị khoá"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isSuperAdmin && (
            <>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xoá tài khoản?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này không thể hoàn tác. Tất cả dữ liệu của{" "}
                      {user.name} sẽ bị xoá.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? "Đang xoá..." : "Xoá"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>
                {isSuperAdmin
                  ? "Thông tin tài khoản (chỉ xem)."
                  : "Chỉnh sửa thông tin tài khoản."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Họ tên{" "}
                  {!isSuperAdmin && <span className="text-destructive">*</span>}
                </Label>
                {isSuperAdmin ? (
                  <Input value={user.name} disabled className="opacity-60" />
                ) : (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ tên..."
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email} disabled className="opacity-60" />
              </div>
              {!isSuperAdmin && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Trạng thái tài khoản</p>
                    <p className="text-xs text-muted-foreground">
                      {isActive
                        ? "Tài khoản đang hoạt động"
                        : "Tài khoản đã bị khoá"}
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student stats */}
          {user.role === "STUDENT" && stats && (
            <Card>
              <CardHeader>
                <CardTitle>Thống kê học viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border p-4 text-center">
                    <BookOpen className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">
                      {(stats as StudentStats).coursesEnrolled}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Khoá học đăng ký
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <CreditCard className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">
                      {(stats as StudentStats).ordersCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Đơn hàng</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <CreditCard className="h-5 w-5 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">
                      {formatVND((stats as StudentStats).totalPaid)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tổng đã thanh toán
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructor stats */}
          {user.role === "INSTRUCTOR" && stats && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Khoá học được giao (
                  {(stats as InstructorStats).coursesAssigned})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(stats as InstructorStats).courses.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    Chưa có khoá học nào.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(stats as InstructorStats).courses.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent/50"
                        onClick={() => router.push(`/courses/${c.id}`)}
                      >
                        <span className="font-medium text-sm">{c.title}</span>
                        <Badge
                          variant={
                            c.status === "PUBLISHED"
                              ? "success"
                              : c.status === "DRAFT"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {c.status === "PUBLISHED"
                            ? "Đã xuất bản"
                            : c.status === "DRAFT"
                              ? "Bản nháp"
                              : "Lưu trữ"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <Badge variant={rl.variant}>{rl.label}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tình trạng:</span>
                <span className="font-semibold">
                  {user.isActive ? "✅ Hoạt động" : "🔒 Bị khoá"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tham gia:</span>
                <span className="font-semibold">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cập nhật:</span>
                <span className="font-semibold">
                  {new Date(user.updatedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-xs truncate ml-2">
                  {user.id}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
