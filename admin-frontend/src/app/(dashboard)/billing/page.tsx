import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Doanh thu & Payout
        </h2>
        <p className="text-muted-foreground">
          Tổng hợp doanh thu và chi trả cho giảng viên.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <CreditCard className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Sắp ra mắt</h3>
          <p className="text-muted-foreground max-w-md">
            Tính năng quản lý doanh thu và payout đang được phát triển. Bạn sẽ
            có thể xem báo cáo tài chính chi tiết tại đây.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
