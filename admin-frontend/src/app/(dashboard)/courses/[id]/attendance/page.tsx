"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft, UserPlus, Upload, Loader2, CheckCircle2, Clock, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Unit { id: string; title: string; type: string }
interface StudentAttendance { unitId: string; unitTitle: string; attended: boolean; attendedAt: string | null }
interface Student {
  enrollmentId: string;
  enrollmentStatus: "ACTIVE" | "COMPLETED";
  student: { id: string; name: string; email: string };
  attendance: StudentAttendance[];
  completedCount: number;
  totalUnits: number;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("noble-cert-auth");
    if (!raw) return null;
    return JSON.parse(raw)?.state?.accessToken || null;
  } catch { return null; }
}

export default function AttendancePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [toggling, setToggling] = useState<string>("");

  // Dialog: thêm 1 học viên
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Dialog: nhập từ file
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStudents = useCallback(async () => {
    try {
      const data = await adminFetch<any>(`/courses/${courseId}/students`);
      setCourseName(data.course?.title ?? "");
      setUnits(data.course?.units ?? []);
      setStudents(data.students ?? []);
    } catch (e: any) {
      toast.error(e.message || "Không thể tải danh sách học viên");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  async function toggleAttendance(student: Student, unit: Unit) {
    const currentRecord = student.attendance.find((a) => a.unitId === unit.id);
    const attended = !!currentRecord?.attended;
    const key = `${student.enrollmentId}-${unit.id}`;
    setToggling(key);
    try {
      if (attended) {
        await adminFetch(`/courses/${courseId}/attendance`, {
          method: "DELETE",
          body: JSON.stringify({ studentId: student.student.id, unitId: unit.id }),
        });
        toast.success(`Hủy điểm danh: ${student.student.name} — ${unit.title}`);
      } else {
        await adminFetch(`/courses/${courseId}/attendance`, {
          method: "POST",
          body: JSON.stringify({ studentId: student.student.id, unitId: unit.id }),
        });
        toast.success(`Điểm danh: ${student.student.name} — ${unit.title}`);
      }
      await fetchStudents();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi điểm danh");
    } finally {
      setToggling("");
    }
  }

  async function handleAddStudent() {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    try {
      await adminFetch(`/courses/${courseId}/enroll-single`, {
        method: "POST",
        body: JSON.stringify({ email: addEmail.trim().toLowerCase() }),
      });
      toast.success("Đã thêm học viên vào khoá học");
      setAddOpen(false);
      setAddEmail("");
      await fetchStudents();
    } catch (e: any) {
      toast.error(e.message || "Không thể thêm học viên");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleUpload() {
    if (!uploadFile) { toast.error("Vui lòng chọn file"); return; }
    setUploadLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = getAccessToken();
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch(`${apiBase}/api/v1/admin/courses/${courseId}/enroll-bulk`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Upload thất bại");

      const result = json?.data ?? json;
      toast.success(
        `Nhập thành công: ${result.enrolled} mới, ${result.alreadyEnrolled} đã có, ${result.notFound} không tìm thấy`,
      );
      setUploadOpen(false);
      setUploadFile(null);
      await fetchStudents();
    } catch (e: any) {
      toast.error(e.message || "Upload thất bại");
    } finally {
      setUploadLoading(false);
    }
  }

  const completedCount = students.filter((s) => s.enrollmentStatus === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href={`/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Điểm danh</h1>
            <p className="text-sm text-muted-foreground truncate max-w-[400px]">{courseName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Nhập từ Excel
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Thêm học viên
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <Users className="h-8 w-8 text-primary/60" />
            <div>
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-xs text-muted-foreground">Tổng học viên</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500/70" />
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Hoàn thành khoá</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <Clock className="h-8 w-8 text-yellow-500/70" />
            <div>
              <p className="text-2xl font-bold">{units.length}</p>
              <p className="text-xs text-muted-foreground">Buổi học</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bảng điểm danh</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p>Chưa có học viên nào. Thêm học viên để bắt đầu điểm danh.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left font-semibold min-w-[200px]">
                      Học viên
                    </th>
                    <th className="px-3 py-3 text-center font-semibold whitespace-nowrap min-w-[90px]">
                      Tiến độ
                    </th>
                    {units.map((unit) => (
                      <th key={unit.id} className="px-3 py-3 text-center font-medium min-w-[120px] max-w-[160px]">
                        <div className="truncate text-xs" title={unit.title}>{unit.title}</div>
                        <div className="text-[10px] text-muted-foreground font-normal capitalize">{unit.type}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.enrollmentId} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                      {/* Student info — sticky left */}
                      <td className="sticky left-0 z-10 bg-background px-4 py-3 min-w-[200px]">
                        <div className="font-medium truncate">{s.student.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{s.student.email}</div>
                        <Badge
                          variant={s.enrollmentStatus === "COMPLETED" ? "success" : "secondary"}
                          className="mt-1 text-[10px] h-4"
                        >
                          {s.enrollmentStatus === "COMPLETED" ? "Hoàn thành" : "Đang học"}
                        </Badge>
                      </td>
                      {/* Progress */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-sm font-semibold">{s.completedCount}</span>
                        <span className="text-xs text-muted-foreground">/{s.totalUnits}</span>
                      </td>
                      {/* Attendance per unit */}
                      {units.map((unit) => {
                        const record = s.attendance.find((a) => a.unitId === unit.id);
                        const attended = !!record?.attended;
                        const key = `${s.enrollmentId}-${unit.id}`;
                        const isToggling = toggling === key;
                        return (
                          <td key={unit.id} className="px-3 py-3 text-center">
                            <button
                              onClick={() => !isToggling && toggleAttendance(s, unit)}
                              disabled={isToggling}
                              title={attended ? `Điểm danh lúc ${record?.attendedAt ? new Date(record.attendedAt).toLocaleString("vi-VN") : ""}` : "Chưa điểm danh"}
                              className={`
                                w-7 h-7 rounded-md border-2 transition-all flex items-center justify-center mx-auto
                                ${attended
                                  ? "border-green-500 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                  : "border-border bg-background text-transparent hover:border-primary/50 hover:bg-primary/5"
                                }
                                ${isToggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                              `}
                            >
                              {isToggling
                                ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                : attended
                                  ? <CheckCircle2 className="h-4 w-4" />
                                  : null
                              }
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: thêm 1 học viên */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Thêm học viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="add-email">Email học viên</Label>
            <Input
              id="add-email"
              type="email"
              placeholder="hocvien@example.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Học viên phải có tài khoản trong hệ thống. Nếu chưa có, hãy tạo tài khoản trước.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Hủy</Button>
            <Button onClick={handleAddStudent} disabled={addLoading || !addEmail.trim()}>
              {addLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Thêm học viên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: nhập từ Excel */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Nhập học viên từ file</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {uploadFile ? (
                <div className="space-y-1">
                  <p className="font-medium text-sm">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadFile.size / 1024).toFixed(1)} KB — click để đổi file
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-muted-foreground">
                  <Upload className="mx-auto h-8 w-8 opacity-50" />
                  <p className="text-sm font-medium">Kéo thả hoặc click để chọn file</p>
                  <p className="text-xs">Hỗ trợ: .xlsx, .xls, .csv</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Định dạng file:</p>
              <p>• Cột đầu tiên (hoặc cột tên <code className="font-mono bg-muted px-1 rounded">email</code>) chứa email học viên</p>
              <p>• Mỗi dòng = 1 học viên</p>
              <p>• Học viên phải đã có tài khoản trong hệ thống</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); setUploadFile(null); }}>Hủy</Button>
            <Button onClick={handleUpload} disabled={uploadLoading || !uploadFile}>
              {uploadLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Nhập danh sách
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
