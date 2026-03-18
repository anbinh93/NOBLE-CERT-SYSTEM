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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Ban,
  FileCheck2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/api";

interface Certificate {
  id: string;
  serialNumber: string;
  student: { id: string; name: string; email: string };
  course: { id: string; title: string; instructor: string };
  examScore: number;
  issuedDate: string;
  status: string;
}

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCerts = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);

    adminFetch<{
      certificates: Certificate[];
      total: number;
      totalPages: number;
    }>(`/certificates?${params}`)
      .then((data) => {
        setCertificates(data.certificates);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCerts();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCerts();
  };

  const handleRevoke = async (certId: string) => {
    try {
      await adminFetch(`/certificates/${certId}/revoke`, { method: "PATCH" });
      toast.success("Đã thu hồi chứng chỉ!");
      fetchCerts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quản lý chứng chỉ</h2>
        <p className="text-muted-foreground">
          Xem và quản lý chứng chỉ đã cấp cho học viên.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" />
              {total} chứng chỉ
            </CardTitle>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-[300px]"
                placeholder="Tìm theo tên, email hoặc khóa học..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <FileCheck2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Chưa có chứng chỉ nào
              </h3>
              <p className="text-muted-foreground max-w-md">
                Chứng chỉ sẽ được tự động cấp khi học viên hoàn thành khóa học
                và vượt qua bài thi.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã chứng chỉ</TableHead>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Khoá học</TableHead>
                    <TableHead className="text-center">Điểm thi</TableHead>
                    <TableHead>Ngày cấp</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {cert.serialNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className="cursor-pointer hover:underline"
                          onClick={() =>
                            router.push(`/users/${cert.student.id}`)
                          }
                        >
                          <div className="font-medium text-sm">
                            {cert.student.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {cert.student.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="cursor-pointer hover:underline max-w-[220px] truncate text-sm"
                          onClick={() =>
                            router.push(`/courses/${cert.course.id}`)
                          }
                        >
                          {cert.course.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          GV: {cert.course.instructor}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={cert.examScore >= 80 ? "success" : "warning"}
                        >
                          {cert.examScore}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(cert.issuedDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              const frontendUrl =
                                process.env.NEXT_PUBLIC_FRONTEND_URL ||
                                "http://localhost:3000";
                              window.open(
                                `${frontendUrl}/verify/${cert.serialNumber}`,
                                "_blank",
                              );
                            }}
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Xem
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-destructive hover:text-destructive"
                              >
                                <Ban className="mr-1 h-3 w-3" />
                                Thu hồi
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Thu hồi chứng chỉ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Chứng chỉ <strong>{cert.serialNumber}</strong>{" "}
                                  của <strong>{cert.student.name}</strong> sẽ bị
                                  thu hồi. Học viên sẽ cần hoàn thành lại khóa
                                  học để nhận chứng chỉ mới.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRevoke(cert.id)}
                                >
                                  Thu hồi
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
