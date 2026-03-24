"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2, Plus, Search, Pencil, Trash2, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/api";

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  author: { name: string };
  readTime: number;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchPosts(p = 1, q = search) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "15" });
      if (q) params.set("search", q);
      const data = await adminFetch<any>(`/posts?${params}`);
      setPosts(data.posts ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e: any) {
      toast.error(e.message || "Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPosts(1, ""); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchPosts(1, search);
  }

  async function togglePublish(post: Post) {
    setToggling(post.id);
    try {
      await adminFetch(`/posts/${post.id}/toggle-publish`, { method: "PATCH" });
      toast.success(post.isPublished ? "Đã ẩn bài viết" : "Đã xuất bản bài viết");
      fetchPosts(page, search);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setToggling(null);
    }
  }

  async function deletePost(id: string) {
    setDeleting(id);
    try {
      await adminFetch(`/posts/${id}`, { method: "DELETE" });
      toast.success("Đã xoá bài viết");
      fetchPosts(page, search);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bài viết & Blog</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý tất cả bài viết xuất bản lên trang chủ
          </p>
        </div>
        <Button asChild>
          <Link href="/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo bài viết
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">
              Tất cả bài viết{" "}
              {!loading && <span className="text-muted-foreground font-normal">({total})</span>}
            </CardTitle>
            <form onSubmit={handleSearch} className="flex gap-2 w-72">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm tiêu đề, danh mục..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Button type="submit" size="sm" variant="outline">Tìm</Button>
            </form>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>Chưa có bài viết nào.</p>
              <Button asChild className="mt-4" variant="outline" size="sm">
                <Link href="/posts/new">Tạo bài viết đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="hidden md:table-cell">Danh mục</TableHead>
                  <TableHead className="hidden lg:table-cell">Tác giả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} className="group">
                    <TableCell>
                      <div className="font-medium text-sm line-clamp-1 max-w-[280px]">
                        {post.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        /{post.slug}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {post.category ? (
                        <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {post.author?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.isPublished ? "default" : "secondary"} className="text-xs">
                        {post.isPublished ? "Đã xuất bản" : "Bản nháp"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(post.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={post.isPublished ? "Ẩn bài" : "Xuất bản"}
                          disabled={toggling === post.id}
                          onClick={() => togglePublish(post)}
                        >
                          {toggling === post.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : post.isPublished
                              ? <EyeOff className="h-4 w-4" />
                              : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Chỉnh sửa"
                          onClick={() => router.push(`/posts/${post.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Xoá"
                              disabled={deleting === post.id}
                            >
                              {deleting === post.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xoá bài viết?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bài viết <strong>"{post.title}"</strong> sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Huỷ</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deletePost(post.id)}
                              >
                                Xoá
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">Trang {page} / {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchPosts(page - 1)}>Trước</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchPosts(page + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
