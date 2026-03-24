"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {
  ArrowLeft, Loader2, ImagePlus, X, Save, Send, Clock, Hash,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/api";

const CATEGORIES = ["Hướng dẫn", "Mẹo học tập", "Công nghệ", "Sự nghiệp", "Tin tức", "Kỹ năng", "Sự kiện", "Case Study"];

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [readTime, setReadTime] = useState(5);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const post = await adminFetch<any>(`/posts/${id}`);
        setTitle(post.title ?? "");
        setSlug(post.slug ?? "");
        setOriginalSlug(post.slug ?? "");
        setExcerpt(post.excerpt ?? "");
        setContent(post.content ?? "");
        setThumbnail(post.thumbnail ?? "");
        setThumbnailPreview(post.thumbnail ?? "");
        setCategory(post.category ?? "");
        setTags(post.tags ?? []);
        setReadTime(post.readTime ?? 5);
        setIsPublished(post.isPublished ?? false);
      } catch (e: any) {
        toast.error(e.message || "Không thể tải bài viết");
        router.push("/posts");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slug || slug === originalSlug || slug === slugify(title)) {
      setSlug(slugify(val));
    }
  }

  function handleThumbnailUrl(url: string) {
    setThumbnail(url);
    setThumbnailPreview(url);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh tối đa 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setThumbnail(base64);
      setThumbnailPreview(base64);
    };
    reader.readAsDataURL(file);
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((tag) => tag !== t));
  }

  async function handleSave(publish?: boolean) {
    if (!title.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    if (!slug.trim()) { toast.error("Vui lòng nhập slug"); return; }
    if (!excerpt.trim()) { toast.error("Vui lòng nhập tóm tắt"); return; }
    if (!content || content === "<p></p>") { toast.error("Vui lòng nhập nội dung"); return; }

    setSaving(true);
    try {
      await adminFetch(`/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content,
          thumbnail: thumbnail || null,
          category: category || null,
          tags,
          readTime,
          isPublished: publish ?? isPublished,
        }),
      });
      toast.success(publish ? "Đã cập nhật và xuất bản bài viết!" : "Đã lưu bản nháp!");
      router.push("/posts");
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi cập nhật bài viết");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link href="/posts"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Chỉnh sửa bài viết</h1>
            <p className="text-sm text-muted-foreground">Cập nhật nội dung và thông tin bài viết</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu nháp
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Xuất bản
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Tiêu đề, slug và tóm tắt bài viết</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề bài viết..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-base font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">/blog/</span>
                  <Input
                    id="slug"
                    placeholder="tieu-de-bai-viet"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Chỉ chứa chữ thường, số và dấu gạch ngang</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Tóm tắt <span className="text-destructive">*</span></Label>
                <Textarea
                  id="excerpt"
                  placeholder="Mô tả ngắn gọn nội dung bài viết (hiển thị trong danh sách)..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{excerpt.length}/300 ký tự</p>
              </div>
            </CardContent>
          </Card>

          {/* Rich Text Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Nội dung bài viết <span className="text-destructive">*</span></CardTitle>
              <CardDescription>Soạn thảo nội dung đầy đủ với công cụ formatting phong phú</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RichTextEditor
                content={content}
                onChange={setContent}
                className="rounded-none border-0 border-t"
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Thumbnail */}
          <Card>
            <CardHeader>
              <CardTitle>Ảnh bìa</CardTitle>
              <CardDescription>Upload ảnh hoặc dán URL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className="relative aspect-[16/9] rounded-lg border-2 border-dashed border-border bg-muted/30 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => fileInputRef.current?.click()}
              >
                {thumbnailPreview ? (
                  <>
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={() => setThumbnailPreview("")}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-medium">Thay ảnh khác</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setThumbnail(""); setThumbnailPreview(""); }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-destructive transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImagePlus size={28} />
                    <p className="text-xs text-center px-4">Click để upload ảnh<br />hoặc dán URL bên dưới</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              <div className="space-y-1.5">
                <Label className="text-xs">URL ảnh bìa</Label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={thumbnail.startsWith("data:") ? "" : thumbnail}
                  onChange={(e) => handleThumbnailUrl(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Phân loại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Clock size={13} /> Thời gian đọc (phút)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={readTime}
                  onChange={(e) => setReadTime(Number(e.target.value))}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Hash size={13} /> Tags
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Thêm tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    className="h-8 text-sm"
                  />
                  <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={addTag}>+</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs gap-1 pr-1">
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="hover:text-destructive ml-0.5">
                          <X size={10} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publish */}
          <Card>
            <CardHeader>
              <CardTitle>Xuất bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Trạng thái</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isPublished ? "Đang công khai" : "Đang là bản nháp"}
                  </p>
                </div>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <Button className="w-full" onClick={() => handleSave(true)} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Xuất bản ngay
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleSave(false)} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Lưu nháp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
