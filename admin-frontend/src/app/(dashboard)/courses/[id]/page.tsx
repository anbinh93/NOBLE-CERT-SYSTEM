'use client';

import { use, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminCourse, useUpdateCourse, usePublishCourse, useArchiveCourse, useDeleteCourse } from '@/features/courses/api';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Globe, Archive, Loader2, Trash2, Plus, GripVertical, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminApi, buildQuery, type PaginatedResult } from '@/lib/api-client';

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface CourseUnitDraft {
  id: string;
  unitId?: string;
  title: string;
  type: 'VIDEO' | 'DOCUMENT' | 'EXAM';
  videoConfig?: { youtubeId?: string };
  content?: string;
  contentUrl?: string;
  duration?: number;
  questions?: ExamQuestion[];
  sectionId?: string;
  sectionTitle?: string;
}

interface InstructorOption {
  id: string;
  name: string;
  email: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Bản nháp', className: 'bg-muted text-muted-foreground border-border' },
  PUBLISHED: { label: 'Công khai', className: 'bg-primary/10 text-primary border-primary/20' },
  ARCHIVED: { label: 'Lưu trữ', className: 'bg-muted text-muted-foreground border-border' },
};

function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  // If user pasted raw ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0] ?? '';
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'embed' || p === 'shorts');
      if (idx >= 0 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) return parts[idx + 1];
    }
  } catch {
    // ignore
  }
  return null;
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const { data: course, isLoading, error } = useAdminCourse(id);
  const updateMutation = useUpdateCourse(id);
  const publishMutation = usePublishCourse();
  const archiveMutation = useArchiveCourse();
  const deleteMutation = useDeleteCourse();

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    instructorId: '',
    settings: {
      thumbnail: '',
      category: '',
      passing_score: 80,
    },
    units: [] as CourseUnitDraft[],
  });

  const { data: instructorsData } = useQuery({
    queryKey: ['admin', 'users', 'instructors'],
    queryFn: () =>
      adminApi.get<PaginatedResult<InstructorOption>>(
        `/users${buildQuery({ page: 1, pageSize: 50, role: 'INSTRUCTOR' })}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
  const instructorOptions = instructorsData?.items ?? [];

  // Sync remote course data → local form state once when data first arrives
  const syncedCourseId = useRef<string | null>(null);
  useEffect(() => {
    if (!course || syncedCourseId.current === course.id) return;
    syncedCourseId.current = course.id;

    interface RawUnit {
      unitId?: string; id?: string; title?: string; type?: string;
      contentUrl?: string; content?: string; duration?: number;
      questions?: ExamQuestion[]; sectionId?: string; sectionTitle?: string;
    }
    const parsedSettings = (typeof course.settings === 'object' && course.settings
      ? (course.settings as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const rawUnits: RawUnit[] = Array.isArray(course.units) ? (course.units as RawUnit[]) : [];
    const mappedUnits: CourseUnitDraft[] = rawUnits.map((u, index) => {
      const uid = u.id || u.unitId || crypto.randomUUID();
      const rawType = String(u.type ?? 'VIDEO').toUpperCase() as CourseUnitDraft['type'];
      const youtubeId =
        rawType === 'VIDEO' && typeof u.contentUrl === 'string'
          ? parseYouTubeId(u.contentUrl) ?? ''
          : '';

      return {
        id: uid,
        unitId: u.unitId,
        title: u.title ?? `Bài học ${index + 1}`,
        type: rawType,
        videoConfig: rawType === 'VIDEO' ? { youtubeId } : undefined,
        content: rawType === 'DOCUMENT' ? (u.content ?? u.contentUrl ?? '') : u.content,
        contentUrl: u.contentUrl,
        duration: u.duration,
        questions: u.questions,
        sectionId: u.sectionId,
        sectionTitle: u.sectionTitle,
      };
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional one-time sync from server data to local form
    setFormData({
      title: course.title || '',
      description: course.description || '',
      price: course.price || 0,
      instructorId: course.instructor?.id || '',
      settings: {
        thumbnail: typeof parsedSettings.thumbnail === 'string' ? parsedSettings.thumbnail : '',
        category: typeof parsedSettings.category === 'string' ? parsedSettings.category : '',
        passing_score: typeof parsedSettings.passing_score === 'number' ? parsedSettings.passing_score : 80,
      },
      units: mappedUnits,
    });
  }, [course]);

  const thumbnailUrl = formData.settings.thumbnail;
  const hasThumbnail = typeof thumbnailUrl === 'string' && thumbnailUrl.trim().length > 0;
  const [thumbnailMode, setThumbnailMode] = useState<'url' | 'upload'>(() =>
    hasThumbnail ? 'url' : 'upload',
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center p-12 space-y-4">
        <p className="text-destructive font-medium">Lỗi tải dữ liệu khoá học</p>
        <Button onClick={() => router.back()} variant="outline">Quay lại</Button>
      </div>
    );
  }

  const handleAddUnit = () => {
    const newId = crypto.randomUUID();
    setFormData({
      ...formData,
      units: [
        ...formData.units,
        {
          id: newId,
          unitId: newId,
          title: 'Bài học mới \u00b7 ' + (formData.units.length + 1),
          type: 'VIDEO',
          videoConfig: { youtubeId: '' },
          content: '',
        },
      ],
    });
  };

  const handleUpdateUnit = (index: number, field: keyof CourseUnitDraft, value: unknown) => {
    const newUnits = [...formData.units];
    newUnits[index] = { ...newUnits[index], [field]: value } as CourseUnitDraft;
    setFormData({ ...formData, units: newUnits });
  };
  
  const handleRemoveUnit = (index: number) => {
    const newUnits = formData.units.filter((_, i) => i !== index);
    setFormData({ ...formData, units: newUnits });
  };

  const handleSave = async () => {
    try {
      // Validate EXAM questions before saving to backend
      const examIssues: string[] = [];
      for (const [uIdx, unit] of formData.units.entries()) {
        if (unit.type !== 'EXAM') continue;
        const questions = unit.questions ?? [];
        if (questions.length === 0) {
          examIssues.push(`Bài kiểm tra #${uIdx + 1}: cần ít nhất 1 câu hỏi`);
          continue;
        }
        for (const [qIdx, q] of questions.entries()) {
          const questionText = (q.question ?? '').trim();
          const options = (q.options ?? []).map((o) => (o ?? '').trim()).filter(Boolean);
          const correct = (q.correctAnswer ?? '').trim();
          if (!questionText) examIssues.push(`Bài kiểm tra #${uIdx + 1} · Câu ${qIdx + 1}: nội dung câu hỏi không được rỗng`);
          if (options.length < 2) examIssues.push(`Bài kiểm tra #${uIdx + 1} · Câu ${qIdx + 1}: cần ít nhất 2 lựa chọn`);
          if (!correct) examIssues.push(`Bài kiểm tra #${uIdx + 1} · Câu ${qIdx + 1}: cần chọn đáp án đúng`);
          if (correct && options.length > 0 && !options.includes(correct)) {
            examIssues.push(`Bài kiểm tra #${uIdx + 1} · Câu ${qIdx + 1}: đáp án đúng phải thuộc danh sách lựa chọn`);
          }
        }
      }

      if (examIssues.length > 0) {
        toast.error(`Không thể lưu: ${examIssues[0]}`, {
          description: examIssues.length > 1 ? `Còn ${examIssues.length - 1} lỗi khác cần sửa.` : undefined,
        });
        return;
      }

      const normalizedUnits = formData.units.map((u, index) => {
        const unitId = u.unitId || u.id || `unit-${index + 1}`;
        const base = {
          unitId,
          title: u.title,
          sectionId: u.sectionId,
          sectionTitle: u.sectionTitle,
        };

        if (u.type === 'VIDEO') {
          const raw = u.videoConfig?.youtubeId ?? '';
          const parsed = parseYouTubeId(String(raw));
          const youtubeId = (parsed ?? String(raw).trim()) || '';
          const contentUrl =
            youtubeId.length === 11
              ? `https://www.youtube.com/embed/${youtubeId}`
              : (u.contentUrl ?? '');

          return {
            ...base,
            type: 'video',
            contentUrl,
            duration: typeof u.duration === 'number' ? u.duration : 0,
          };
        }

        if (u.type === 'DOCUMENT') {
          return {
            ...base,
            type: 'document',
            contentUrl: u.content ?? (u.contentUrl ?? ''),
          };
        }

        if (u.type === 'EXAM') {
          const cleanedQuestions = (u.questions ?? [])
            .map((q) => ({
              id: q.id,
              question: q.question.trim(),
              options: q.options.map((o) => o.trim()).filter(Boolean),
              correctAnswer: q.correctAnswer.trim(),
            }))
            .filter((q) => q.question && q.options.length >= 2 && q.correctAnswer && q.options.includes(q.correctAnswer));

          return {
            ...base,
            type: 'exam',
            questions: cleanedQuestions,
          };
        }

        // Fallback giữ schema cũ nếu có
        return {
          ...base,
          type: (u as unknown as { type?: string }).type ?? 'document',
          contentUrl: u.contentUrl ?? '',
        };
      });

      await updateMutation.mutateAsync({ ...formData, units: normalizedUnits });
      toast.success('Đã lưu thay đổi');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const handleUploadThumbnail = async (file: File) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await adminApi.postForm<{ url: string; path: string }>(
        '/uploads/course-thumbnail',
        form,
      );
      setFormData((prev) => ({
        ...prev,
        settings: { ...prev.settings, thumbnail: res.url },
      }));
      setThumbnailMode('url');
      toast.success('Đã upload ảnh bìa');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync(id);
      toast.success('Đã xuất bản khoá học');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(id);
      toast.success('Đã lưu trữ khoá học');
      setShowArchiveConfirm(false);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Đã xoá khoá học');
      setShowDeleteConfirm(false);
      router.replace('/courses');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const badge = STATUS_BADGE[course.status] || STATUS_BADGE.DRAFT;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full" aria-label="Quay lại">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Chi tiết khoá học</h1>
              <Badge variant="outline" className={`ml-2 ${badge.className}`}>
                {badge.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">ID: {course.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {course.status === 'DRAFT' && (
            <Button variant="outline" className="rounded-full text-primary border-primary/30 hover:bg-primary/10" onClick={handlePublish} disabled={publishMutation.isPending}>
              <Globe className="mr-2 h-4 w-4" /> {publishMutation.isPending ? 'Đang xử lý...' : 'Xuất bản'}
            </Button>
          )}
          {course.status === 'ARCHIVED' && (
            <Button
              variant="outline"
              className="rounded-full text-primary border-primary/30 hover:bg-primary/10"
              onClick={handlePublish}
              disabled={publishMutation.isPending}
            >
              <Globe className="mr-2 h-4 w-4" /> {publishMutation.isPending ? 'Đang xử lý...' : 'Mở lại (Công khai)'}
            </Button>
          )}
          {course.status === 'PUBLISHED' && (
            <Button
              variant="outline"
              className="rounded-full text-muted-foreground border-border hover:bg-muted"
              onClick={() => setShowArchiveConfirm(true)}
              disabled={archiveMutation.isPending}
            >
              <Archive className="mr-2 h-4 w-4" /> {archiveMutation.isPending ? 'Đang xử lý...' : 'Lưu trữ'}
            </Button>
          )}
          <Button className="rounded-full" onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" /> {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" /> {deleteMutation.isPending ? 'Đang xoá...' : 'Xoá'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle>Thông tin chung</CardTitle>
              <CardDescription>Cập nhật tiêu đề và mô tả cho khoá học.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề khoá học <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề khoá học..."
                  className="rounded-xl border-border bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả chi tiết</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Viết mô tả ngắn gọn về khoá học này..."
                  className="min-h-37.5 rounded-xl border-border bg-background resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Giá khoá học (VNĐ)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="rounded-xl border-border bg-background max-w-sm"
                />
                <p className="text-xs text-muted-foreground">Để 0 nếu là khoá học miễn phí.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm mt-6">
            <CardHeader>
              <CardTitle>Cấu hình bổ sung</CardTitle>
              <CardDescription>Ảnh bìa, danh mục và yêu cầu chứng chỉ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructorId">Giảng viên phụ trách</Label>
                <Select
                  value={formData.instructorId || ''}
                  onValueChange={(v) => setFormData((p) => ({ ...p, instructorId: v }))}
                >
                  <SelectTrigger className="w-full rounded-xl border-border bg-background" aria-label="Chọn giảng viên">
                    <SelectValue placeholder="Chọn giảng viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructorOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} — {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Chỉ hiển thị các tài khoản role INSTRUCTOR.</p>
              </div>

              <div className="space-y-3">
                <Label>Thumbnail khoá học</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={thumbnailMode === 'url' ? 'default' : 'outline'}
                    className="rounded-full"
                    onClick={() => setThumbnailMode('url')}
                  >
                    Dán link ảnh
                  </Button>
                  <Button
                    type="button"
                    variant={thumbnailMode === 'upload' ? 'default' : 'outline'}
                    className="rounded-full"
                    onClick={() => setThumbnailMode('upload')}
                  >
                    Upload file ảnh
                  </Button>
                </div>

                {thumbnailMode === 'url' && (
                  <div className="space-y-2">
                    <Input
                      id="thumbnail"
                      value={formData.settings.thumbnail}
                      onChange={(e) =>
                        setFormData({ ...formData, settings: { ...formData.settings, thumbnail: e.target.value } })
                      }
                      placeholder="https://example.com/image.jpg"
                      className="rounded-xl border-border bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      Dán URL ảnh. Khi bạn chọn upload file, hệ thống sẽ tự điền URL ảnh sau khi upload thành công.
                    </p>
                  </div>
                )}

                {thumbnailMode === 'upload' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      aria-label="Upload ảnh bìa"
                      className="rounded-xl border-border bg-background"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleUploadThumbnail(f);
                      }}
                    />
                    <p className="text-xs text-muted-foreground sm:max-w-64">
                      Tối đa 5MB. Nên dùng ảnh ngang (16:9).
                    </p>
                  </div>
                )}

                {hasThumbnail && (
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-24 overflow-hidden rounded-xl border border-border bg-card">
                      <Image
                        src={thumbnailUrl}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-border"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          settings: { ...p.settings, thumbnail: '' },
                        }))
                      }
                    >
                      Xoá thumbnail
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Input
                    id="category"
                    value={formData.settings.category}
                    onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, category: e.target.value } })}
                    placeholder="VD: Programming, Design..."
                    className="rounded-xl border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passing_score">Điểm yêu cầu hoàn thành (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.settings.passing_score}
                    onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, passing_score: Number(e.target.value) } })}
                    className="rounded-xl border-border bg-background"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Syllabus Info */}
          <Card className="bg-card border-border shadow-sm mt-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Chương trình học (Syllabus)</CardTitle>
                <CardDescription>Quản lý các bài giảng trong khoá học.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddUnit} variant="outline" size="sm" className="rounded-full">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Thêm bài học
                </Button>
                {!formData.units.some(u => u.type === 'EXAM') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => {
                      const examId = `exam-final-${id}`;
                      setFormData((prev) => ({
                        ...prev,
                        units: [
                          ...prev.units,
                          {
                            id: examId,
                            unitId: examId,
                            title: 'Bài thi cuối khoá',
                            type: 'EXAM' as const,
                            questions: [{ id: 'q-1', question: '', options: ['', '', ''], correctAnswer: '' }],
                          },
                        ],
                      }));
                    }}
                  >
                    <FileQuestion className="h-3.5 w-3.5 mr-1" /> Thêm bài thi cuối khoá
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.units.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl bg-muted/20">
                  Chưa có bài giảng nào. Bấm nút Thêm để bắt đầu.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.units.map((unit, index) => (
                    <div key={unit.id || index} className="flex items-start gap-4 p-5 border border-border/80 rounded-xl bg-background shadow-sm hover:border-primary/30 transition-colors">
                      <div className="mt-2 text-primary/50 font-bold w-6 text-center">{index + 1}</div>
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                           <Input 
                             value={unit.title} 
                             onChange={(e) => handleUpdateUnit(index, 'title', e.target.value)} 
                             className="font-bold flex-1 rounded-lg"
                             placeholder="Tên bài giảng"
                           />
                           <select 
                             value={unit.type} 
                             onChange={(e) => handleUpdateUnit(index, 'type', e.target.value)}
                             className="h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background text-foreground"
                           >
                             <option value="VIDEO">Video YouTube</option>
                             <option value="DOCUMENT">Tài liệu Text</option>
                             <option value="EXAM">Bài kiểm tra</option>
                           </select>
                        </div>
                        {unit.type === 'VIDEO' && (
                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground text-xs font-medium">YT ID</div>
                            <Input 
                               value={unit.videoConfig?.youtubeId || ''} 
                               onChange={(e) => handleUpdateUnit(index, 'videoConfig', { youtubeId: e.target.value })} 
                               placeholder="Dán link YouTube hoặc ID…"
                               className="pl-14 text-sm rounded-lg"
                            />
                          </div>
                        )}
                        {unit.type === 'DOCUMENT' && (
                          <Textarea 
                             value={unit.content || ''} 
                             onChange={(e) => handleUpdateUnit(index, 'content', e.target.value)} 
                             placeholder="Nội dung bài học..."
                             className="text-sm min-h-20 rounded-lg resize-y"
                          />
                        )}
                        {unit.type === 'EXAM' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground font-medium">
                                <FileQuestion className="inline h-3.5 w-3.5 mr-1" />
                                {(unit.questions?.length ?? 0)} câu hỏi
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs h-7 px-3"
                                onClick={() => {
                                  const qs: ExamQuestion[] = [...(unit.questions ?? [])];
                                  qs.push({ id: `q-${crypto.randomUUID().slice(0, 8)}`, question: '', options: ['', '', ''], correctAnswer: '' });
                                  handleUpdateUnit(index, 'questions', qs);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Thêm câu hỏi
                              </Button>
                            </div>
                            {(unit.questions ?? []).map((q, qIdx) => (
                              <div key={q.id || qIdx} className="border border-border/60 rounded-lg p-3 space-y-2 bg-muted/10">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                  <span className="text-xs font-bold text-muted-foreground shrink-0 w-6">Q{qIdx + 1}</span>
                                  <Input
                                    value={q.question}
                                    onChange={(e) => {
                                      const qs = [...(unit.questions ?? [])];
                                      qs[qIdx] = { ...qs[qIdx], question: e.target.value };
                                      handleUpdateUnit(index, 'questions', qs);
                                    }}
                                    placeholder="Nội dung câu hỏi…"
                                    className="flex-1 text-sm rounded-lg h-8"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                                    onClick={() => {
                                      const qs = (unit.questions ?? []).filter((_, i) => i !== qIdx);
                                      handleUpdateUnit(index, 'questions', qs);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                                  {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-1.5">
                                      <input
                                        type="radio"
                                        name={`correct-${unit.id}-${qIdx}`}
                                        checked={q.correctAnswer === opt && opt !== ''}
                                        onChange={() => {
                                          const qs = [...(unit.questions ?? [])];
                                          qs[qIdx] = { ...qs[qIdx], correctAnswer: opt };
                                          handleUpdateUnit(index, 'questions', qs);
                                        }}
                                        className="accent-primary"
                                        title="Đáp án đúng"
                                      />
                                      <Input
                                        value={opt}
                                        onChange={(e) => {
                                          const qs = [...(unit.questions ?? [])];
                                          const newOpts = [...qs[qIdx].options];
                                          const oldOpt = newOpts[oIdx];
                                          newOpts[oIdx] = e.target.value;
                                          const wasCorrect = qs[qIdx].correctAnswer === oldOpt;
                                          qs[qIdx] = { ...qs[qIdx], options: newOpts, correctAnswer: wasCorrect ? e.target.value : qs[qIdx].correctAnswer };
                                          handleUpdateUnit(index, 'questions', qs);
                                        }}
                                        placeholder={`Lựa chọn ${String.fromCharCode(65 + oIdx)}`}
                                        className="flex-1 text-xs h-7 rounded-lg"
                                      />
                                      {q.options.length > 2 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-full shrink-0"
                                          onClick={() => {
                                            const qs = [...(unit.questions ?? [])];
                                            const newOpts = qs[qIdx].options.filter((_, i) => i !== oIdx);
                                            const newCorrect = newOpts.includes(qs[qIdx].correctAnswer) ? qs[qIdx].correctAnswer : '';
                                            qs[qIdx] = { ...qs[qIdx], options: newOpts, correctAnswer: newCorrect };
                                            handleUpdateUnit(index, 'questions', qs);
                                          }}
                                        >
                                          <Trash2 className="h-2.5 w-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="pl-8">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-6 px-2 text-muted-foreground hover:text-primary"
                                    onClick={() => {
                                      const qs = [...(unit.questions ?? [])];
                                      qs[qIdx] = { ...qs[qIdx], options: [...qs[qIdx].options, ''] };
                                      handleUpdateUnit(index, 'questions', qs);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Thêm lựa chọn
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveUnit(index)} className="text-destructive hover:text-white hover:bg-destructive mt-1 h-8 w-8 rounded-full shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Học viên:</span>
                <span className="font-semibold text-foreground">{new Intl.NumberFormat('vi-VN').format(course._count?.enrollments || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Giảng viên:</span>
                <span className="font-medium text-foreground text-sm truncate max-w-30 ml-4" title={course.instructor?.name}>{course.instructor?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Tạo lúc:</span>
                <span className="font-medium text-foreground text-sm">{new Date(course.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Cập nhật:</span>
                <span className="font-medium text-foreground text-sm">{new Date(course.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Archive confirm dialog */}
      <Dialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <DialogContent className="bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle>Lưu trữ khoá học?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Học viên mới sẽ không thể đăng ký khoá học này sau khi lưu trữ.
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full border-border" onClick={() => setShowArchiveConfirm(false)}>
              Huỷ
            </Button>
            <Button className="rounded-full" onClick={handleArchive} disabled={archiveMutation.isPending}>
              {archiveMutation.isPending ? 'Đang lưu trữ...' : 'Lưu trữ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle>Xoá khoá học?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Bạn sắp xoá khoá học <span className="font-semibold text-foreground">{course.title}</span>. Hành động này không thể hoàn tác.
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full border-border" onClick={() => setShowDeleteConfirm(false)}>
              Huỷ
            </Button>
            <Button variant="destructive" className="rounded-full" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Đang xoá...' : 'Xoá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
