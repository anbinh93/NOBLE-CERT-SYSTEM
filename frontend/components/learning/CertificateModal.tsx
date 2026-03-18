"use client";
import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, Smartphone } from "lucide-react";
import useSWR from "swr";

const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID || "MB";
const ACCOUNT_NO = process.env.NEXT_PUBLIC_ACCOUNT_NO || "0000909826219";
const ACCOUNT_NAME =
  process.env.NEXT_PUBLIC_ACCOUNT_NAME || "CERTIFLOW EDUCATION";

interface CertificateModalProps {
  course: any; // Type better if possible, but any is strictly better than implicit any for now
  onClose: () => void;
  userId: string;
}

export default function CertificateModal({
  course,
  onClose,
  userId,
}: CertificateModalProps) {
  const [step, setStep] = useState(1); // 1: Review, 2: Payment, 3: Success
  const [order, setOrder] = useState<any>(null); // Use specific type if available, otherwise any to allow access
  const [loading, setLoading] = useState(false);

  const createOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({ courseId: course.courseId }),
        },
      );
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Polling for payment status
  const { data: orderStatus } = useSWR(
    step === 2 && order ? `/api/orders/${order._id}` : null,
    (url) => fetch(url).then((res) => res.json()), // Need endpoint for polling single order or re-use order list
    { refreshInterval: 2000 },
  );

  // NOTE: Simple MVP hack since we assume webhook works or we simulate it.
  // We can add a "Simulate Payment" button for demo.
  const simulatePayment = async () => {
    // In real app, this is done by Sepay Webhook
    // For MVP demo, calling an internal endpoint or just assume it works
    alert("Đang giả lập thanh toán thành công...");
    setStep(3);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
          <h3 className="font-bold text-lg text-foreground">Nhận Chứng Chỉ</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 bg-muted/30 text-center">
                <div className="text-muted-foreground text-sm">
                  Demo Chứng chỉ
                </div>
                <div className="font-serif text-xl font-bold text-primary mt-2">
                  {course.courseTitle}
                </div>
                <div className="text-muted-foreground mt-1">
                  Cấp cho: Student Name
                </div>
              </div>

              <div className="flex justify-between items-center text-lg">
                <span className="text-foreground">Phí cấp bằng:</span>
                <div className="text-right">
                  <span className="block font-bold text-destructive">
                    199.000đ
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    500.000đ
                  </span>
                </div>
              </div>

              <button
                onClick={createOrder}
                disabled={loading}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg shadow-md mt-4 flex justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "THANH TOÁN & NHẬN BẰNG"
                )}
              </button>
            </div>
          )}

          {step === 2 && order && (
            <div className="text-center space-y-4">
              <div className="text-sm text-muted-foreground">
                Quét mã để thanh toán
              </div>

              <div className="mx-auto w-64 h-64 bg-white rounded-lg overflow-hidden border border-border">
                {/* Dynamic VietQR */}
                <img
                  src={`https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?amount=${order.amount}&addInfo=${order.orderCode}`}
                  alt="VietQR"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="bg-primary/10 p-3 rounded text-sm text-primary">
                Nội dung CK:{" "}
                <strong className="font-mono text-lg">{order.orderCode}</strong>
              </div>

              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm animate-pulse">
                <Loader2 size={16} className="animate-spin" />
                Đang chờ xác nhận thanh toán...
              </div>

              {/* DEMO BUTTON */}
              <button
                onClick={simulatePayment}
                className="text-xs text-muted-foreground/50 underline mt-4 hover:text-foreground"
              >
                (Demo: Giả lập thành công)
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-600 mb-4 animate-bounce">
                <CheckCircle size={40} />
              </div>
              <h4 className="text-2xl font-bold text-foreground">
                Thanh toán thành công!
              </h4>
              <p className="text-muted-foreground">
                Chứng chỉ của bạn đã sẵn sàng.
              </p>

              <button
                onClick={() => (window.location.href = `/verify/demo-uuid`)}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg shadow-md mt-6"
              >
                XEM CHỨNG CHỈ NGAY
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
