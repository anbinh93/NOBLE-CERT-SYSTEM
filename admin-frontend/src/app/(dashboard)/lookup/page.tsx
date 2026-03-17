'use client';

import { useState } from 'react';
import { Search, Loader2, Phone, Mail, Award, BookOpen, CreditCard, ChevronRight } from 'lucide-react';
import { adminApi, type PaginatedResult } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type SearchResult = {
  type: 'learner' | 'course' | 'certificate' | 'order';
  id: string;
  title: string;
  subtitle: string;
  status?: string | boolean;
  meta?: React.ReactNode;
  url: string;
};

// Types for API
interface UserRes { id: string; name: string; email: string; phone?: string | null }
interface CourseRes { id: string; title: string }
interface OrderRes { id: string; orderCode: number; user: UserRes; course: CourseRes; status: string; amount: number }
interface CertRes { id: string; serial: string; user: UserRes; course: CourseRes; isValid: boolean }

export default function LookupPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResults(null);
    
    try {
      // Execute searches in parallel
      const q = encodeURIComponent(query.trim());
      const [learners, certificates, orders] = await Promise.all([
        adminApi.get<PaginatedResult<UserRes>>(`/learners?q=${q}&pageSize=5`).catch(() => null),
        adminApi.get<PaginatedResult<CertRes>>(`/certificates?q=${q}&pageSize=5`).catch(() => null),
        adminApi.get<PaginatedResult<OrderRes>>(`/payments/orders?q=${q}&pageSize=5`).catch(() => null),
      ]);

      const merged: SearchResult[] = [];

      // Map Learners
      if (learners?.items) {
        merged.push(...learners.items.map((l: UserRes) => ({
          type: 'learner' as const,
          id: l.id,
          title: l.name,
          subtitle: l.email,
          meta: l.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {l.phone}</span> : null,
          url: `/learners/${l.id}`,
        })));
      }

      // Map Certificates  
      if (certificates?.items) {
        merged.push(...certificates.items.map((c: CertRes) => ({
          type: 'certificate' as const,
          id: c.id,
          title: `Chứng chỉ #${c.serial}`,
          subtitle: c.course.title,
          status: c.isValid,
          meta: <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.user.email}</span>,
          url: `/certificates?q=${c.serial}`,
        })));
      }

      // Map Orders
      if (orders?.items) {
        merged.push(...orders.items.map((o: OrderRes) => ({
          type: 'order' as const,
          id: o.id,
          title: `Đơn hàng #${o.orderCode}`,
          subtitle: o.user.name,
          status: o.status,
          meta: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.amount),
          url: `/transactions?q=${o.orderCode}`,
        })));
      }

      setResults(merged);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tra cứu');
    } finally {
      setIsSearching(false);
    }
  };

  const renderStatus = (res: SearchResult) => {
    if (res.status === undefined) return null;
    
    if (res.type === 'certificate') {
      return res.status ? (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Hợp lệ</Badge>
      ) : (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Đã thu hồi</Badge>
      );
    }
    
    if (res.type === 'order') {
      let cls = 'bg-muted text-muted-foreground';
      let lbl = res.status as string;
      if (lbl === 'SUCCESS') { cls = 'bg-primary/10 text-primary border-primary/20'; lbl = 'Thành công'; }
      if (lbl === 'PENDING') { cls = 'bg-muted text-muted-foreground border-border'; lbl = 'Chờ TT'; }
      return <Badge variant="outline" className={cls}>{lbl}</Badge>;
    }
    
    return null;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
          <Search className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Tra cứu tổng quát</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Tìm kiếm nhanh chóng học viên, chứng chỉ, hoặc đơn hàng qua Số điện thoại, Email, Mã đơn, hoặc CCCD.
        </p>
      </div>

      <Card className="border-border shadow-md overflow-hidden bg-card">
        <CardContent className="p-2 sm:p-4 border-b border-border bg-muted/10">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              placeholder="Nhập email, SĐT, mã hợp, mã giao dịch…"
              aria-label="Từ khoá tra cứu tổng quát"
              className="pl-12 pr-24 py-6 text-lg border-none shadow-none focus-visible:ring-0 bg-transparent rounded-none h-14"
              autoFocus
            />
            <Button
              onClick={performSearch}
              disabled={isSearching || !query.trim()}
              className="absolute right-2 rounded-full px-6"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tra cứu'}
            </Button>
          </div>
        </CardContent>

        {/* Results Area */}
          <div className="bg-card min-h-100">
          {!isSearching && !results && !error && (
            <div className="flex flex-col items-center justify-center h-100 text-muted-foreground space-y-4 px-4 text-center">
               <Search className="h-12 w-12 opacity-20" />
               <p>Nhập thông tin vào ô tìm kiếm ở trên để bắt đầu tra cứu các nguồn dữ liệu.</p>
               <div className="flex gap-2 text-xs opacity-70">
                 <Badge variant="outline">Email học viên</Badge>
                 <Badge variant="outline">Mã đơn PayOS</Badge>
                 <Badge variant="outline">ID Chứng chỉ</Badge>
               </div>
            </div>
          )}

          {isSearching && (
            <div className="flex flex-col items-center justify-center h-100 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Đang quét dữ liệu tổng hợp…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-100 text-destructive gap-2">
              <p className="font-semibold">Lỗi tra cứu</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!isSearching && results !== null && results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-100 text-muted-foreground text-center">
              <p className="text-lg font-medium text-foreground mb-1">Không tìm thấy kết quả nào</p>
              <p className="text-sm">Vui lòng kiểm tra lại từ khoá tra cứu: <strong className="font-mono bg-muted px-1 py-0.5 rounded">{query}</strong></p>
            </div>
          )}

          {!isSearching && results !== null && results.length > 0 && (
            <div className="divide-y divide-border">
              <div className="px-6 py-3 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tìm thấy {results.length} kết quả phù hợp
              </div>
              {results.map((res, i) => {
                const Icon = res.type === 'learner' ? 'div' : res.type === 'certificate' ? Award : res.type === 'order' ? CreditCard : BookOpen;
                // Inline fix for missing Users icon
                const TypeIcon = res.type === 'learner' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ) : <Icon className="h-5 w-5" />;

                return (
                  <Link href={res.url} key={`${res.type}-${res.id}-${i}`} className="flex items-center p-4 hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-background border border-border mr-4 group-hover:bg-primary/5 transition-colors">
                      {TypeIcon}
                    </div>
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-foreground truncate">{res.title}</span>
                        {renderStatus(res)}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-3 overflow-hidden">
                        <span className="truncate">{res.subtitle}</span>
                        {res.meta && (
                          <>
                            <span className="inline-block w-1 h-1 rounded-full bg-border shrink-0" />
                            <span className="truncate font-medium">{res.meta}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
