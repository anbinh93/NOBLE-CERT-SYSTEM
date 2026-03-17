import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookOpen, CreditCard, TrendingUp, Users } from 'lucide-react';

const stats = [
  {
    title: 'Tổng doanh thu',
    value: '₫45,231,890',
    change: '+20.1% so với tháng trước',
    icon: TrendingUp,
  },
  {
    title: 'Học viên đang học',
    value: '+2,350',
    change: '+180.1% so với tháng trước',
    icon: Users,
  },
  {
    title: 'Khoá học đã bán',
    value: '+12,234',
    change: '+19% so với tháng trước',
    icon: BookOpen,
  },
  {
    title: 'Giao dịch hôm nay',
    value: '+573',
    change: '+201 trong giờ qua',
    icon: CreditCard,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tổng quan hệ thống</h2>
        <p className="text-muted-foreground">
          Theo dõi hiệu suất nền tảng Noble-Cert theo thời gian thực.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Doanh thu theo thời gian</CardTitle>
            <CardDescription>Tổng quan 6 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="mx-4 mb-4 flex h-[200px] items-center justify-center rounded-md border-2 border-dashed border-slate-200 text-slate-500 text-sm">
              [Biểu đồ doanh thu — sẽ tích hợp ở Task tiếp theo]
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Giao dịch gần nhất</CardTitle>
            <CardDescription>265 giao dịch thành công tháng này.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center rounded-md border-2 border-dashed border-slate-200 text-slate-500 text-sm">
              [Danh sách giao dịch — sẽ tích hợp ở Task tiếp theo]
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
