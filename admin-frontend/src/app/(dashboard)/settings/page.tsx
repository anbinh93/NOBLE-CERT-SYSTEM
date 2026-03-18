import { Card, CardContent } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h2>
        <p className="text-muted-foreground">
          Cấu hình chung cho nền tảng Noble-Cert.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <SettingsIcon className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Sắp ra mắt</h3>
          <p className="text-muted-foreground max-w-md">
            Tính năng cài đặt hệ thống đang được phát triển. Bạn sẽ có thể cấu
            hình email, thanh toán và các tùy chọn khác tại đây.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
