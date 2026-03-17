"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Clock, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

interface EnrollmentItem {
  _id: string;
  courseId?: { name?: string; thumbnail?: string };
  lastAccessedAt?: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string | undefined;
  status: string;
  invoiceId: string;
  thumbnail?: string;
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (email) {
      const fetchData = async () => {
        try {
            // Dùng full URL backend + unwrap { status, data } envelope
            const enrollRes = await fetch(
              `${API_ENDPOINTS.STUDENT.MY_COURSES}?email=${encodeURIComponent(email)}`
            );
            const enrollJson = await enrollRes.json();
            const enrollData: EnrollmentItem[] = enrollJson?.data ?? (Array.isArray(enrollJson) ? enrollJson : []);
            const txs: Transaction[] = enrollData.map((e) => ({
                id: e._id,
                description: e.courseId?.name ?? "Khoá học",
                amount: 0,
                date: e.lastAccessedAt,
                status: "Hoàn thành",
                invoiceId: "ENR-" + String(e._id).slice(-6).toUpperCase(),
                thumbnail: e.courseId?.thumbnail,
            }));
            txs.sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
            setTransactions(txs);
        } catch (e) {
            console.error("Orders Fetch Error", e);
        } finally {
            setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [email]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold text-foreground">Order History</h1>
            <p className="text-muted-foreground mt-1">View your past purchases and download invoices.</p>
         </div>
      </div>

      {transactions.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
              <div className="w-20 h-20 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-foreground">No orders yet</h3>
              <p className="text-muted-foreground mt-2 mb-8 mx-auto max-w-sm">
                 You haven&apos;t made any purchases yet. Visit the catalog to find your first course.
              </p>
              <Link href="/courses">
                 <Button className="rounded-full px-8 py-6 text-lg">Browse Catalog</Button>
              </Link>
          </div>
      ) : (
          <div className="space-y-4">
              {transactions.map((tx) => (
                  <div key={tx.id} className="group bg-card rounded-3xl p-6 shadow-sm border border-border hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6">
                      {/* Icon / Thumb */}
                      <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 text-primary">
                          <ShoppingBag className="h-8 w-8" />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                              <h3 className="font-bold text-foreground text-lg">{tx.description}</h3>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                  PAID
                              </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}
                              </span>
                              <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{tx.invoiceId}</span>
                          </div>
                      </div>

                      {/* Amount & Actions */}
                      <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 mt-4 md:mt-0 border-t md:border-t-0 border-border pt-4 md:pt-0">
                          <p className="text-xl font-bold text-foreground">{tx.amount > 0 ? formatCurrency(tx.amount) : "Free"}</p>
                          
                          <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="rounded-full text-primary hover:bg-muted hover:text-primary font-medium h-8">
                                  Invoice
                              </Button>
                              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border">
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </Button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
