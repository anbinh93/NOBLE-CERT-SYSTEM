"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { toast } from "sonner";

interface EnrollButtonProps {
  courseId: string;
  price: string | number;
}

export default function EnrollButton({ courseId, price }: EnrollButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checking, setChecking] = useState(false);

  const accessToken = session?.user?.accessToken;

  const authHeaders = (extra?: Record<string, string>): HeadersInit => ({
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...extra,
  });

  useEffect(() => {
    if (status === "authenticated" && accessToken) {
      setChecking(true);
      fetch(
        `${API_ENDPOINTS.STUDENT.ENROLL.replace("/enroll", "/check-enrollment")}?courseId=${courseId}`,
        { headers: authHeaders() }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.isEnrolled) setIsEnrolled(true);
        })
        .catch(console.error)
        .finally(() => setChecking(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, accessToken, courseId]);

  const normalizedPrice = typeof price === "number"
    ? price
    : Number(String(price).replace(/[^\d.]/g, "")) || 0;

  const createPaymentLink = async () => {
    const res = await fetch(API_ENDPOINTS.PAYMENT.CREATE_LINK, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || "Không thể tạo link thanh toán.");
    }
    const checkoutUrl = data?.data?.checkoutUrl as string | null | undefined;
    if (!checkoutUrl) {
      // Free course from payment flow fallback
      setIsEnrolled(true);
      toast.success(data?.data?.message || "Đăng ký thành công.");
      router.push("/student/learning");
      return;
    }
    window.location.href = checkoutUrl;
  };

  const handleAction = async () => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    if (isEnrolled) {
      router.push("/student/learning");
      return;
    }

    if (!accessToken) {
      toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      if (normalizedPrice > 0) {
        await createPaymentLink();
        return;
      }
      const res = await fetch(API_ENDPOINTS.STUDENT.ENROLL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsEnrolled(true);
        toast.success("Đăng ký thành công.");
      } else if (res.status === 402) {
        // Backend yêu cầu thanh toán -> chuyển sang tạo payment link
        await createPaymentLink();
      } else {
        toast.error(data?.message || "Đăng ký thất bại, vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
      return <Button disabled className="w-full rounded-full py-6"><Loader2 className="animate-spin" /></Button>;
  }

  return (
    <Button 
        onClick={handleAction} 
        disabled={loading}
        className={`w-full rounded-full font-bold py-6 text-lg shadow-md hover:shadow-lg transition-all ${
            isEnrolled 
            ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
    >
      {loading ? <Loader2 className="animate-spin mr-2" /> : null}
      
      {!loading && isEnrolled && (
        <span className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5" /> Go to Course
        </span>
      )}
      
      {!loading && !isEnrolled && (
          `Enroll Now - ${price}`
      )}
    </Button>
  );
}
