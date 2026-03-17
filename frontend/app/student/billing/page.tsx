"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Wallet, ArrowUpRight, Clock, Download, Plus, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

export default function BillingPage() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!email) {
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        // Balance: không có endpoint profile riêng — mặc định 0
        setBalance(0);

        // Fetch enrollments — dùng full URL tới backend, unwrap { status, data }
        const enrollRes = await fetch(
          `${API_ENDPOINTS.STUDENT.MY_COURSES}?email=${encodeURIComponent(email)}`
        );
        const enrollJson = await enrollRes.json();
        const enrollData: any[] = enrollJson?.data ?? (Array.isArray(enrollJson) ? enrollJson : []);

        const txs = enrollData.map((e: any) => ({
          id: e._id,
          description: `Đăng ký: ${e.courseId?.name ?? "Khoá học"}`,
          amount: 0,
          date: e.lastAccessedAt,
          status: "Hoàn thành",
          invoice: "ENR-" + String(e._id).slice(-6).toUpperCase(),
        }));
        setTransactions(txs);
      } catch (e) {
        console.error("Billing Fetch Error", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [email]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-20 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
          <div className="mb-8">
             <h1 className="text-3xl font-serif font-medium text-foreground">Billing & Payments</h1>
             <p className="text-muted-foreground mt-1 text-lg">Manage your wallet and view transaction history.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Balance Card - Premium Look (always dark card as credit card design) */}
              <div className="md:col-span-2 bg-linear-to-br from-slate-900 to-slate-800 dark:from-secondary dark:to-background rounded-[32px] p-10 text-white dark:text-foreground shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] relative overflow-hidden group border border-slate-700 dark:border-border">
                   {/* Gold Accents */}
                   <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-60"></div>
                   
                   <div className="relative z-10 flex flex-col justify-between h-full min-h-[180px]">
                       <div className="flex justify-between items-start">
                           <div>
                               <p className="text-muted-foreground font-medium mb-2 uppercase tracking-wide text-xs">Current Balance</p>
                               <h2 className="text-5xl font-serif font-medium">{formatCurrency(balance)}</h2>
                           </div>
                           <div className="p-4 bg-white/5 dark:bg-primary/10 rounded-2xl backdrop-blur-md border border-white/10 dark:border-primary/20">
                               <Wallet className="h-8 w-8 text-primary" />
                           </div>
                       </div>
                       
                       <div className="flex gap-4 mt-8">
                           <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-[0_4px_15px_-3px_rgba(212,175,55,0.4)] px-8 font-bold text-base h-12">
                               <Plus className="h-5 w-5 mr-2" />
                               Top Up Wallet
                           </Button>
                           <Button variant="outline" className="rounded-full border-white/20 dark:border-border text-white dark:text-muted-foreground hover:bg-white/10 dark:hover:bg-secondary bg-white/5 dark:bg-transparent backdrop-blur-sm px-8 h-12">
                               Payout
                           </Button>
                       </div>
                   </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-[32px] p-8 shadow-sm border border-primary/10 flex flex-col justify-center">
                   <h3 className="font-serif font-medium text-xl text-foreground mb-6">Quick Actions</h3>
                   <div className="space-y-4">
                       <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl py-8 border border-transparent hover:border-primary/10 transition-all group">
                           <div className="p-2 bg-secondary rounded-lg mr-4 group-hover:bg-primary/10">
                                <CreditCard className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" /> 
                           </div>
                           <span className="font-medium text-base">Payment Methods</span>
                       </Button>
                       <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl py-8 border border-transparent hover:border-primary/10 transition-all group">
                           <div className="p-2 bg-secondary rounded-lg mr-4 group-hover:bg-primary/10">
                                <ArrowUpRight className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" /> 
                           </div>
                           <span className="font-medium text-base">Upgrade Plan</span>
                       </Button>
                   </div>
              </div>
          </div>

          {/* Transactions */}
          <div className="mt-10 bg-card rounded-[32px] p-10 shadow-sm border border-primary/10">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-serif font-medium text-foreground">Transaction History</h3>
                  <Button variant="outline" size="sm" className="rounded-full border-primary/20 text-muted-foreground hover:text-foreground">Export CSV</Button>
              </div>
              
              {transactions.length === 0 ? (
                  <div className="text-center py-20 bg-secondary/30 rounded-2xl border border-dashed border-primary/10">
                        <Clock className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                        <p className="text-muted-foreground">No transactions found</p>
                  </div>
              ) : (
                  <div className="overflow-x-auto">
                      <table className="w-full">
                          <thead>
                              <tr className="text-left border-b border-primary/5">
                                  <th className="pb-6 font-bold text-primary uppercase text-xs tracking-wider pl-4">Description</th>
                                  <th className="pb-6 font-bold text-primary uppercase text-xs tracking-wider">Date</th>
                                  <th className="pb-6 font-bold text-primary uppercase text-xs tracking-wider">Amount</th>
                                  <th className="pb-6 font-bold text-primary uppercase text-xs tracking-wider">Status</th>
                                  <th className="pb-6 font-bold text-primary uppercase text-xs tracking-wider text-right pr-4">Invoice</th>
                              </tr>
                          </thead>
                          <tbody className="text-sm">
                              {transactions.map((tx) => (
                                  <tr key={tx.id} className="group hover:bg-primary/5 transition-colors border-b border-primary/5 last:border-0">
                                      <td className="py-6 pl-4 font-medium text-foreground">{tx.description}</td>
                                      <td className="py-6 text-muted-foreground">
                                          <div className="flex items-center gap-2">
                                              <Clock className="h-4 w-4 opacity-50" />
                                              {new Date(tx.date).toLocaleDateString("vi-VN")}
                                          </div>
                                      </td>
                                      <td className="py-6 font-bold text-foreground font-mono">
                                          {tx.amount > 0 ? `-${formatCurrency(tx.amount)}` : "Free"}
                                      </td>
                                      <td className="py-6">
                                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                              <CheckCircle className="w-3 h-3 mr-1" /> {tx.status}
                                          </span>
                                      </td>
                                      <td className="py-6 text-right pr-4">
                                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-secondary">
                                              <Download className="h-4 w-4" />
                                          </Button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
