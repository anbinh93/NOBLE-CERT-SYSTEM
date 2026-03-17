
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, Loader2, QrCode } from "lucide-react";

export default function CheckoutPage({ params }: { params: any }) {
  const [status, setStatus] = useState("PENDING"); // PENDING, PAID
  
  useEffect(() => {
    if (status === "PENDING") {
      const interval = setInterval(() => {
          if (Math.random() > 0.8) {
              setStatus("PAID");
          }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
       
       <Link href="/courses" className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground">
           <ChevronLeft className="h-5 w-5" /> Back to Courses
       </Link>

       <div className="w-full max-w-lg bg-card rounded-[32px] shadow-xl border border-border overflow-hidden">
           <div className="bg-primary p-8 text-center text-primary-foreground">
               <h1 className="text-2xl font-bold">Secure Payment</h1>
               <p className="text-primary-foreground/90 mt-2">Order #ORD-2025-001</p>
           </div>
           
           <div className="p-10 flex flex-col items-center">
               
               {status === "PENDING" ? (
                   <>
                       <p className="text-muted-foreground font-medium mb-6">Scan QR with your Banking App</p>
                       
                       <div className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-8 relative group">
                            <div className="h-48 w-48 bg-foreground/90 flex items-center justify-center text-background rounded-lg">
                                 <QrCode className="h-24 w-24" />
                            </div>
                            
                            <div className="absolute inset-0 flex items-center justify-center bg-card/90 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-2xl">
                                <span className="text-xs font-mono font-bold text-foreground">VIETQR DYNAMIC</span>
                            </div>
                       </div>
                       
                       <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Waiting for payment...
                       </div>
                       
                       <div className="w-full mt-8 pt-8 border-t border-border flex justify-between text-foreground">
                           <span>Total Amount</span>
                           <span className="font-bold text-xl">$49.00</span>
                       </div>
                   </>
               ) : (
                   <div className="flex flex-col items-center animate-in zoom-in duration-300">
                       <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                           <CheckCircle2 className="h-12 w-12 text-green-600" />
                       </div>
                       <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
                       <p className="text-muted-foreground text-center mb-8">
                           Thank you for enrolling. You can now start learning.
                       </p>
                       
                       <Link href="/dashboard" className="w-full">
                           <Button size="lg" className="w-full rounded-full h-12 text-base">
                               Go to Dashboard
                           </Button>
                       </Link>
                   </div>
               )}

           </div>
           
           {status === "PENDING" && (
                <div className="bg-muted p-4 text-center text-xs text-muted-foreground">
                    Trusted by Sepay & VietQR
                </div>
           )}
       </div>
    </div>
  );
}
