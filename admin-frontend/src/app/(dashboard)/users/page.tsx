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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  MailCheck,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  _count: { enrollments: number; courses: number };
}

const roleMap: Record<
  string,
  { label: string; variant: "default" | "info" | "success" | "secondary" }
> = {
  SUPER_ADMIN: { label: "Super Admin", variant: "default" },
  INSTRUCTOR: { label: "Giảng viên", variant: "info" },
  STUDENT: { label: "Học viên", variant: "success" },
  STAFF: { label: "Nhân viên", variant: "secondary" },
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    user: any;
    tempPassword: string;
  } | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (role && role !== "all") params.set("role", role);

    adminFetch<{ users: User[]; total: number; totalPages: number }>(
      `/users?${params}`,
    )
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [page, role]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleCreateInstructor = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Vui lòng nhập tên và email!");
      return;
    }
    setCreating(true);
    try {
      const data = await adminFetch<{ user: any; tempPassword: string }>(
        "/instructors",
        {
          method: "POST",
          body: JSON.stringify({
            name: newName.trim(),
            email: newEmail.trim(),
          }),
        },
      );
      setCreatedResult(data);
      toast.success("Đã tạo người hướng dẫn!");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const resetCreateDialog = () => {
    setShowCreateDialog(false);
    setNewName("");
    setNewEmail("");
    setCreatedResult(null);
  };

  const handleResendVerification = async (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setResendingId(user.id);
    try {
      await adminFetch("/users/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: user.email }),
      });
      toast.success(`Đã gửi lại email xác thực đến ${user.email}`);
    } catch (err: any) {
      toast.error(err.message || "Gửi email thất bại!");
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Quản lý tài khoản
          </h2>
          <p className="text-muted-foreground">
            Danh sách tất cả người dùng trên hệ thống.
          </p>
        </div>
        <Dialog
          open={showCreateDialog}
          onOpenChange={(v) => {
            if (!v) resetCreateDialog();
            else setShowCreateDialog(true);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Tạo người hướng dẫn
            </Button>
          </DialogTrigger>
          <DialogContent>
            {!createdResult ? (
              <>
                <DialogHeader>
                  <DialogTitle>Tạo người hướng dẫn mới</DialogTitle>
                  <DialogDescription>
                    Nhập thông tin để tạo tài khoản. Email mời xác thực sẽ được
                    gửi tự động.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>
                      Họ tên <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@example.com"
                      type="email"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetCreateDialog}>
                    Hủy
                  </Button>
                  <Button onClick={handleCreateInstructor} disabled={creating}>
                    {creating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {creating ? "Đang tạo..." : "Tạo & Gửi email"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>✅ Tạo thành công!</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm">
                      <strong>Tên:</strong> {createdResult.user.name}
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> {createdResult.user.email}
                    </p>
                    <p className="text-sm">
                      <strong>Mật khẩu tạm:</strong>{" "}
                      <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">
                        {createdResult.tempPassword}
                      </code>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email mời xác thực đã được gửi. Người hướng dẫn cần click
                    link trong email để kích hoạt tài khoản.
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={resetCreateDialog}>Đóng</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg">{total} tài khoản</CardTitle>
            <div className="flex gap-3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 w-[250px]"
                  placeholder="Tìm tên hoặc email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
              <Select
                value={role}
                onValueChange={(v) => {
                  setRole(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="INSTRUCTOR">Giảng viên</SelectItem>
                  <SelectItem value="STUDENT">Học viên</SelectItem>
                  <SelectItem value="STAFF">Nhân viên</SelectItem>
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
          ) : users.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              Không tìm thấy tài khoản nào.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead className="text-center">Khóa học</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Email xác thực</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const r = roleMap[user.role] || {
                      label: user.role,
                      variant: "secondary" as const,
                    };
                    return (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => router.push(`/users/${user.id}`)}
                      >
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={r.variant}>{r.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.role === "INSTRUCTOR"
                            ? `${user._count.courses} khoá`
                            : `${user._count.enrollments} khoá`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? "success" : "destructive"}
                          >
                            {user.isActive ? "Hoạt động" : "Đã khoá"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isEmailVerified ? (
                            <Badge variant="success" className="gap-1">
                              <MailCheck className="h-3 w-3" />
                              Đã xác thực
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-300"
                            >
                              Chưa xác thực
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          {!user.isEmailVerified && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-xs"
                              disabled={resendingId === user.id}
                              onClick={(e) => handleResendVerification(e, user)}
                            >
                              {resendingId === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
                              Gửi lại
                            </Button>
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
