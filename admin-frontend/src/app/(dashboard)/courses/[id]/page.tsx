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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  ClipboardList,
  Globe,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/api";

interface Instructor {
  id: string;
  name: string;
  email: string;
}

interface Material {
  id: string;
  type: "pdf" | "docx" | "excel" | "youtube" | "quiz";
  url: string;
}

interface Unit {
  id: string;
  title: string;
  description: string;
  materials: Material[];
  order: number;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  instructorId: string;
  settings: any;
  units: Unit[];
  createdAt: string;
  updatedAt: string;
  instructor: Instructor;
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

const materialTypes = [
  { value: "youtube", label: "YouTube" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "excel", label: "Excel" },
  { value: "quiz", label: "Quiz" },
];

function genId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [category, setCategory] = useState("");
  const [passingScore, setPassingScore] = useState("80");
  const [units, setUnits] = useState<Unit[]>([]);
  const [thumbMode, setThumbMode] = useState<"link" | "upload">("link");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [courseData, instrData] = await Promise.all([
        adminFetch<{ course: CourseDetail }>(`/courses/${courseId}`),
        adminFetch<{ instructors: Instructor[] }>("/instructors"),
      ]);
      const c = courseData.course;
      setCourse(c);
      setTitle(c.title);
      setDescription(c.description || "");
      setPrice(String(c.price));
      setInstructorId(c.instructorId);
      setThumbnail(c.settings?.thumbnail || "");
      setCategory(c.settings?.category || "");
      setPassingScore(String(c.settings?.passing_score || 80));
      setUnits(
        (c.units || []).map((u: any, i: number) => ({
          id: u.id || genId(),
          title: u.title || "",
          description: u.description || u.content || "",
          materials: Array.isArray(u.materials) ? u.materials : [],
          order: u.order ?? i + 1,
        })),
      );
      setInstructors(instrData.instructors);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Validate for publish ──────────────────────────────────────────
  const validateForPublish = (): string[] => {
    const errors: string[] = [];
    if (!title.trim()) errors.push("Tiêu đề khoá học");
    if (!description.trim()) errors.push("Mô tả chi tiết");
    if (!instructorId) errors.push("Người hướng dẫn");
    if (units.length === 0) errors.push("Ít nhất 1 bài học");
    else {
      units.forEach((u, i) => {
        if (!u.title.trim()) errors.push(`Tiêu đề bài học ${i + 1}`);
      });
    }
    return errors;
  };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }
    setSaving(true);
    try {
      await adminFetch(`/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          price: Number(price) || 0,
          instructorId,
          settings: {
            thumbnail,
            category,
            passing_score: Number(passingScore) || 80,
            is_sequential: true,
          },
          units: units.map((u, i) => ({ ...u, order: i + 1 })),
        }),
      });
      toast.success("Đã lưu thay đổi!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Publish ───────────────────────────────────────────────────────
  const handlePublish = async () => {
    const errors = validateForPublish();
    if (errors.length > 0) {
      toast.error(`Chưa điền đủ thông tin bắt buộc:\n• ${errors.join("\n• ")}`);
      return;
    }
    // Save first, then publish
    setPublishing(true);
    try {
      await adminFetch(`/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          price: Number(price) || 0,
          instructorId,
          settings: {
            thumbnail,
            category,
            passing_score: Number(passingScore) || 80,
            is_sequential: true,
          },
          units: units.map((u, i) => ({ ...u, order: i + 1 })),
        }),
      });
      await adminFetch(`/courses/${courseId}/publish`, { method: "PATCH" });
      toast.success("Đã xuất bản khóa học!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPublishing(false);
    }
  };

  // ── Archive ───────────────────────────────────────────────────────
  const handleArchive = async () => {
    setArchiving(true);
    try {
      await adminFetch(`/courses/${courseId}/archive`, { method: "PATCH" });
      toast.success("Đã lưu trữ khóa học!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setArchiving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminFetch(`/courses/${courseId}`, { method: "DELETE" });
      toast.success("Đã xoá khóa học!");
      router.push("/courses");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Unit helpers ──────────────────────────────────────────────────
  const addUnit = () => {
    setUnits([
      ...units,
      {
        id: genId(),
        title: "",
        description: "",
        materials: [],
        order: units.length + 1,
      },
    ]);
  };

  const removeUnit = (id: string) => setUnits(units.filter((u) => u.id !== id));

  const updateUnit = (
    id: string,
    field: "title" | "description",
    value: string,
  ) => {
    setUnits(units.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  };

  // ── Material helpers ──────────────────────────────────────────────
  const addMaterial = (unitId: string) => {
    setUnits(
      units.map((u) =>
        u.id === unitId
          ? {
              ...u,
              materials: [
                ...u.materials,
                { id: genId(), type: "youtube" as const, url: "" },
              ],
            }
          : u,
      ),
    );
  };

  const removeMaterial = (unitId: string, matId: string) => {
    setUnits(
      units.map((u) =>
        u.id === unitId
          ? { ...u, materials: u.materials.filter((m) => m.id !== matId) }
          : u,
      ),
    );
  };

  const updateMaterial = (
    unitId: string,
    matId: string,
    field: "type" | "url",
    value: string,
  ) => {
    setUnits(
      units.map((u) =>
        u.id === unitId
          ? {
              ...u,
              materials: u.materials.map((m) =>
                m.id === matId ? { ...m, [field]: value } : m,
              ),
            }
          : u,
      ),
    );
  };

  // ── Loading / Not found ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!course) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Không tìm thấy khóa học.
      </div>
    );
  }

  const s = statusMap[course.status] || {
    label: course.status,
    variant: "secondary" as const,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/courses")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Chi tiết khoá học
              </h2>
              <Badge variant={s.variant}>{s.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              ID: {course.id}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/courses/${courseId}/attendance`}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Điểm danh
            </Link>
          </Button>
          {(course.status === "DRAFT" || course.status === "ARCHIVED") && (
            <Button
              variant="outline"
              onClick={handlePublish}
              disabled={publishing}
            >
              <Globe className="mr-2 h-4 w-4" />
              {publishing
                ? "Đang xuất bản..."
                : course.status === "ARCHIVED"
                  ? "Xuất bản lại"
                  : "Xuất bản"}
            </Button>
          )}
          {course.status === "PUBLISHED" && (
            <Button
              variant="outline"
              onClick={handleArchive}
              disabled={archiving}
              className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
            >
              <Archive className="mr-2 h-4 w-4" />
              {archiving ? "Đang lưu trữ..." : "Lưu trữ"}
            </Button>
          )}
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
                <AlertDialogTitle>Xoá khoá học?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ
                  bị xoá.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Đang xoá..." : "Xoá"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── Main form (2 cols) ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin chung */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chung</CardTitle>
              <CardDescription>
                Cập nhật tiêu đề và mô tả cho khoá học.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Tiêu đề khoá học <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Lập trình Fullstack Modern Web"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">
                  Mô tả chi tiết <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Viết mô tả ngắn gọn về khoá học này..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Giá khoá học (VND)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Để 0 nếu là khoá học miễn phí.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cấu hình bổ sung */}
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình bổ sung</CardTitle>
              <CardDescription>
                Ảnh bìa, danh mục và người hướng dẫn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Người hướng dẫn <span className="text-destructive">*</span>
                </Label>
                <Select value={instructorId} onValueChange={setInstructorId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn người hướng dẫn..." />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name} ({inst.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Chỉ hiển thị các tài khoản role INSTRUCTOR.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Thumbnail khoá học</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={thumbMode === "link" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThumbMode("link")}
                  >
                    <LinkIcon className="mr-1 h-3 w-3" />
                    Dán link ảnh
                  </Button>
                  <Button
                    type="button"
                    variant={thumbMode === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThumbMode("upload")}
                  >
                    <ImagePlus className="mr-1 h-3 w-3" />
                    Upload file ảnh
                  </Button>
                </div>
                {thumbMode === "link" ? (
                  <Input
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="Dán link ảnh (URL)..."
                  />
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File ảnh tối đa 5MB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () =>
                          setThumbnail(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tối đa 5MB. Nên dùng ảnh ngang (16:9).
                    </p>
                  </div>
                )}
                {thumbnail && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border max-w-xs">
                    <img
                      src={thumbnail}
                      alt="Thumbnail"
                      className="w-full h-auto aspect-video object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="IELTS, TOEIC, JLPT..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passing">Điểm yêu cầu hoàn thành (%)</Label>
                  <Input
                    id="passing"
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    placeholder="80"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Syllabus ────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Chương trình học (Syllabus){" "}
                    <span className="text-destructive">*</span>
                  </CardTitle>
                  <CardDescription>
                    Quản lý các bài giảng trong khoá học.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={addUnit}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm bài học
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {units.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Chưa có bài học nào. Bấm &quot;Thêm bài học&quot; để bắt đầu.
                </p>
              ) : (
                units.map((unit, idx) => (
                  <div
                    key={unit.id}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    {/* Unit header */}
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <Input
                        className="flex-1 font-medium"
                        value={unit.title}
                        onChange={(e) =>
                          updateUnit(unit.id, "title", e.target.value)
                        }
                        placeholder="Tiêu đề bài học *"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => removeUnit(unit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Unit description */}
                    <Textarea
                      value={unit.description}
                      onChange={(e) =>
                        updateUnit(unit.id, "description", e.target.value)
                      }
                      placeholder="Mô tả nội dung bài học..."
                      rows={2}
                    />

                    {/* Materials */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Tài liệu đính kèm
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => addMaterial(unit.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Thêm tài liệu
                        </Button>
                      </div>
                      {unit.materials.map((mat) => (
                        <div
                          key={mat.id}
                          className="flex items-center gap-2 rounded-md border border-dashed border-border p-2"
                        >
                          <Select
                            value={mat.type}
                            onValueChange={(v) =>
                              updateMaterial(unit.id, mat.id, "type", v)
                            }
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {materialTypes.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="relative flex-1">
                            <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              className="pl-7 h-8 text-xs"
                              value={mat.url}
                              onChange={(e) =>
                                updateMaterial(
                                  unit.id,
                                  mat.id,
                                  "url",
                                  e.target.value,
                                )
                              }
                              placeholder="Dán link tài liệu..."
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                            onClick={() => removeMaterial(unit.id, mat.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Sidebar (1 col) ─────────────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Học viên:</span>
                <span className="font-semibold">
                  {course._count.enrollments}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Người hướng dẫn:</span>
                <span className="font-semibold truncate ml-4 text-right">
                  {course.instructor.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạo lúc:</span>
                <span className="font-semibold">
                  {new Date(course.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cập nhật:</span>
                <span className="font-semibold">
                  {new Date(course.updatedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
