import { Card, CardContent } from "@/components/ui/card";
import { FileCheck2 } from "lucide-react";

export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quản lý chứng chỉ</h2>
        <p className="text-muted-foreground">
          Xem và quản lý chứng chỉ đã cấp.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <FileCheck2 className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Sắp ra mắt</h3>
          <p className="text-muted-foreground max-w-md">
            Tính năng quản lý chứng chỉ đang được phát triển. Bạn sẽ có thể xem,
            tìm kiếm và thu hồi chứng chỉ tại đây.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
