"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Zap, CheckCircle, ArrowLeft, Download, ShieldCheck, Share2, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { learningService } from "@/services/learning.service";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

const fetcher = (url: string) => learningService.get(url);

export default function ClaimCertificatePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const courseId = params?.courseId as string;
    const email = session?.user?.email;

    const [processing, setProcessing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [certificateSerial, setCertificateSerial] = useState<string | null>(null);
    
    // Payment State
    const [paymentState, setPaymentState] = useState<{
        step: "OFFER" | "PAYMENT" | "SUCCESS";
        qrCode?: string;
        orderCode?: string;
        amount?: number;
        checkoutUrl?: string;
    }>({ step: "OFFER" });

    // Fetch Course & Enrollment Details
    const { data, isLoading, error } = useSWR(
        courseId && email ? `${API_ENDPOINTS.STUDENT.COURSE_CONTENT(courseId)}?email=${email}` : null,
        async (url) => {
            const res = await fetch(url);
            if (!res.ok) {
                const err: Error & { status?: number } = new Error("Failed to fetch data");
                err.status = res.status;
                throw err;
            }
            const json = await res.json();
            return json?.data ?? json;
        }
    );

    // Sync Certificate Serial if available
    useEffect(() => {
        if (data?.certificateSerial || data?.isCertified) {
            if (data?.certificateSerial) setCertificateSerial(data.certificateSerial);
            setPaymentState({ step: "SUCCESS" });
        }
    }, [data]);

    const accessToken = session?.user?.accessToken;

    // Polling Payment Status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (paymentState.step === "PAYMENT" && paymentState.orderCode && accessToken) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(API_ENDPOINTS.PAYMENT.STATUS(paymentState.orderCode!), {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    if (res.ok) {
                        const json = await res.json();
                        const data = json?.data ?? json;
                        if (data.isPaid) {
                            if (data.certificate?.serial) setCertificateSerial(data.certificate.serial);
                            setPaymentState({ step: "SUCCESS" });
                            mutate(`${API_ENDPOINTS.STUDENT.MY_CERTIFICATES}?email=${email}`);
                            mutate(`${API_ENDPOINTS.STUDENT.COURSE_CONTENT(courseId)}?email=${email}`);
                            clearInterval(interval);
                        }
                    }
                } catch (error) {
                    console.error("Payment status check failed:", error);
                }
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [paymentState.step, paymentState.orderCode, accessToken, email, courseId]);

    // Fetch Status for Eligibility
    const { data: statusData, isLoading: isLoadingStatus } = useSWR(
        courseId && email ? `${API_ENDPOINTS.STUDENT.COURSE_STATUS(courseId)}?email=${encodeURIComponent(email)}` : null,
        async (url) => {
            const res = await fetch(url);
            const json = await res.json();
            return json?.data ?? json;
        }
    );

    const course = data?.course;
    
    // Actions
    const handleCreatePayment = async () => {
        if (!accessToken) {
            alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
            return;
        }
        try {
            setProcessing(true);
            const res = await fetch(API_ENDPOINTS.PAYMENT.CREATE_CERTIFICATE_LINK, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ courseId }),
            });
            const json = await res.json();
            const data = json?.data ?? json;
            if (data.qrCode || data.checkoutUrl) {
                setPaymentState({
                    step: "PAYMENT",
                    qrCode: data.qrCode,
                    orderCode: data.orderCode,
                    amount: data.amount,
                    checkoutUrl: data.checkoutUrl,
                });
            } else {
                alert(json.message || "Không tạo được link thanh toán");
            }
        } catch {
            alert("Lỗi khi tạo thanh toán, vui lòng thử lại.");
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!paymentState.orderCode || !accessToken) return;
        try {
            setProcessing(true);
            const res = await fetch(API_ENDPOINTS.PAYMENT.STATUS(paymentState.orderCode), {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const json = await res.json();
            const data = json?.data ?? json;
            if (data.isPaid) {
                if (data.certificate?.serial) setCertificateSerial(data.certificate.serial);
                setPaymentState({ step: "SUCCESS" });
                mutate(`${API_ENDPOINTS.STUDENT.MY_CERTIFICATES}?email=${email}`);
                mutate(`${API_ENDPOINTS.STUDENT.COURSE_CONTENT(courseId)}?email=${email}`);
            } else {
                alert(data.message || "Chưa xác nhận được thanh toán, vui lòng thử lại.");
            }
        } catch {
            alert("Lỗi xác nhận thanh toán, vui lòng thử lại.");
        } finally {
            setProcessing(false);
        }
    };

    const handleDownload = (type: 'png' | 'pdf') => {
        if (!certificateSerial) return;
        
        const API_Base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const url = `${API_Base}/api/public/verify/${certificateSerial}/preview`;

        if (type === 'png') {
            window.open(url, '_blank');
        } else {
            const verifyUrl = `${window.location.origin}/verify/${certificateSerial}`;
            window.open(verifyUrl, '_blank');
        }
    };

    const handleShare = () => {
        if (certificateSerial) {
            const url = `${window.location.origin}/verify/${certificateSerial}`;
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            alert("Serial number not found/loaded.");
        }
    };

    // --- LOADING & ERROR STATES ---
    if (status === "loading" || isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
    }

    if (error || !course) {
        return <div className="p-20 text-center text-muted-foreground">Unable to load course details.</div>;
    }

    const priceString = (() => {
        const rawString = course.price?.toString() || "0";
        const numericValue = parseInt(rawString.replace(/\D/g, '') || "0");
        const isUSD = rawString.includes("$") || numericValue < 1000;
        const finalPrice = isUSD ? numericValue * 25000 : numericValue;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice || 200000);
    })();

    if (isLoadingStatus) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;

    const isEligibleForCertificate = (statusData as any)?.isEligibleForCertificate;
    const examScore = (statusData as any)?.examScore || 0;

    // --- VIEW: NOT ELIGIBLE ---
    if (!isEligibleForCertificate) {
         return (
            <div className="min-h-screen bg-background flex justify-center py-12 px-4">
                 <div className="max-w-md w-full text-center space-y-6 pt-20">
                     <div className="w-24 h-24 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
                         <ShieldCheck className="w-12 h-12" />
                     </div>
                     <h1 className="text-3xl font-serif font-bold text-foreground">Chưa đủ điều kiện</h1>
                     <p className="text-muted-foreground text-lg">
                         Bạn cần hoàn thành bài kiểm tra cuối khóa với điểm số trên <b className="text-foreground">50%</b> để nhận chứng chỉ.
                     </p>
                     
                     <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-sm font-bold text-muted-foreground uppercase">Điểm hiện tại</span>
                             <span className={cn("text-2xl font-bold", examScore >= 50 ? "text-green-600 dark:text-green-400" : "text-destructive")}>{examScore}%</span>
                         </div>
                         <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                             <div className={cn("h-full rounded-full", examScore >= 50 ? "bg-green-500" : "bg-destructive")} style={{ width: `${Math.min(100, examScore)}%` }}></div>
                         </div>
                     </div>

                     <Link href={`/student/learn/${courseId}/exam`}>
                         <Button className="w-full h-12 rounded-full font-bold text-lg shadow-lg">
                             <Zap className="w-4 h-4 mr-2" /> Làm lại bài kiểm tra
                         </Button>
                     </Link>
                     <Link href={`/student/learn/${courseId}`}>
                         <Button variant="ghost" className="text-muted-foreground">Quay lại khóa học</Button>
                     </Link>
                 </div>
            </div>
         )
    }
    
    // --- MAIN RENDER ---
    return (
        <div className="min-h-screen bg-background flex justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-6xl">
                 {/* Back Nav */}
                 <div className="mb-8">
                    <Link href="/student/certificates" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách chứng chỉ
                    </Link>
                </div>

                {/* Main Content Card */}
                <div className="bg-card rounded-[32px] overflow-hidden shadow-sm border border-primary/10 flex flex-col lg:flex-row min-h-[600px]">
                    
                    {/* Left Column: Details & Actions */}
                    <div className="lg:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-card relative">
                        <div className="relative z-10">
                            {/* Header */}
                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-green-200 dark:border-green-900">
                                    <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành
                                </div>
                                <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground leading-tight mb-4">
                                    Xin chúc mừng!
                                </h1>
                                <p className="text-lg text-muted-foreground">
                                    Bạn đã hoàn thành xuất sắc khóa học:
                                </p>
                            </div>

                            {/* Course Info */}
                            <div className="mb-10">
                                <h2 className="text-3xl font-serif font-bold text-primary mb-2">{course.name}</h2>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                                        <Award className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <span className="font-medium">Chứng chỉ Noble®</span>
                                    <span className="text-border">•</span>
                                    <span>{new Date().toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                </div>
                            </div>

                             {/* Actions */}
                             <div className="space-y-4 max-w-md">
                                {paymentState.step === "SUCCESS" ? (
                                    <div className="bg-green-50 dark:bg-green-950/30 rounded-2xl p-6 border border-green-100 dark:border-green-900 border-l-4 border-l-green-500">
                                        <h3 className="font-bold text-green-800 dark:text-green-400 text-lg mb-1 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" /> Chứng chỉ đã mở khóa
                                        </h3>
                                        <p className="text-green-700 dark:text-green-500 text-sm mb-4">Chứng chỉ của bạn đã sẵn sàng để tải xuống hoặc chia sẻ.</p>
                                        <div className="flex flex-col gap-3">
                                            <Link href={`/verify/${certificateSerial}`} target="_blank" className="w-full">
                                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-900/20 h-12 font-bold text-base">
                                                    <Zap className="w-5 h-5 mr-2" /> Xem chứng chỉ trực tuyến
                                                </Button>
                                            </Link>
                                            <div className="flex gap-3">
                                                <Button onClick={() => handleDownload('png')} variant="outline" className="flex-1 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-xl">
                                                    <Download className="w-4 h-4 mr-2" /> Tải ảnh
                                                </Button>
                                                <Button onClick={handleShare} variant="outline" className="flex-1 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-xl">
                                                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />} 
                                                    {copied ? "Đã sao chép" : "Chia sẻ"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : paymentState.step === "PAYMENT" ? (
                                    <div className="bg-secondary rounded-2xl p-6 border border-primary/20 animate-in fade-in zoom-in-95">
                                         <h3 className="font-bold text-foreground mb-4 flex items-center justify-between">
                                             Thanh toán an toàn
                                             <span className="text-xs bg-card border border-border px-2 py-0.5 rounded text-muted-foreground">Bảo mật SSL</span>
                                         </h3>
                                         <div className="flex flex-col md:flex-row items-center gap-6">
                                             <div className="bg-card p-2 rounded-xl border-dashed border-2 border-border">
                                                 {paymentState.qrCode ? (
                                                     <QRCodeSVG value={paymentState.qrCode} size={128} className="rounded-lg" />
                                                 ) : <div className="w-32 h-32 bg-secondary animate-pulse rounded-lg"/>}
                                             </div>
                                             <div className="flex-1 w-full text-center md:text-left">
                                                 <p className="text-sm text-muted-foreground mb-1">Tổng thanh toán</p>
                                                 <p className="text-2xl font-bold text-primary mb-3">{priceString}</p>
                                                 <p className="text-xs text-muted-foreground mb-4">Quét mã bằng ứng dụng ngân hàng</p>
                                                 
                                                 <Button onClick={handleConfirmPayment} disabled={processing} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                                                     {processing ? "Đang xác nhận..." : "Tôi đã thanh toán"}
                                                 </Button>
                                                 <button onClick={() => setPaymentState({ ...paymentState, step: "OFFER" })} className="text-xs text-muted-foreground mt-2 hover:underline w-full text-center">Hủy bỏ</button>
                                             </div>
                                         </div>
                                    </div>
                                ) : (
                                    <div className="bg-card rounded-2xl p-6 border border-primary/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                        <div className="flex justify-between items-end mb-6">
                                            <div>
                                                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Phí xác minh</p>
                                                <p className="text-muted-foreground text-sm max-w-[200px]">Phí một lần cho việc xác minh danh tính và cấp phát kỹ thuật số.</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-3xl font-serif font-bold text-foreground">{priceString}</span>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={handleCreatePayment} 
                                            disabled={processing}
                                            size="lg" 
                                            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-12 shadow-[0_4px_15px_-3px_rgba(212,175,55,0.4)]"
                                        >
                                            {processing ? <Loader2 className="w-5 h-5 animate-spin"/> : "Nhận chứng chỉ ngay"}
                                        </Button>
                                        <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Thanh toán an toàn qua ngân hàng
                                        </p>
                                    </div>
                                )}
                             </div>
                        </div>

                         {/* Background Decor */}
                         <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="lg:w-1/2 bg-secondary flex items-center justify-center p-10 relative overflow-hidden">
                         {/* Pattern */}
                         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #d4af37 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                         
                         <div className="relative w-full max-w-lg aspect-[1.414/1] shadow-2xl shadow-foreground/10 rotate-1 hover:rotate-0 transition-all duration-700 group">
                             
                             {certificateSerial ? (
                                 <div className="relative w-full h-full bg-card rounded-[20px] overflow-hidden">
                                     {/* Server Side Image */}
                                     {(() => {
                                         const API_Base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                                         const previewUrl = `${API_Base}/api/public/verify/${certificateSerial}/preview`;
                                         return (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img 
                                                src={previewUrl} 
                                                alt="Certificate Preview" 
                                                className="w-full h-full object-cover"
                                            />
                                         )
                                     })()}
                                     
                                     {/* Overlay Shine */}
                                     <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-x-full group-hover:translate-x-full" style={{ transition: 'transform 1.5s ease-in-out' }}></div>
                                 </div>
                             ) : (
                                 /* Fallback / Mock Preview */
                                 <div className="relative w-full h-full bg-card rounded-[20px] border-[12px] border-card ring-1 ring-border flex items-center justify-center">
                                      <div className="text-center p-8">
                                          <Award className="w-16 h-16 text-muted/40 mx-auto mb-4" />
                                          <p className="text-muted-foreground font-serif">Xem trước chứng chỉ</p>
                                          <p className="text-xs text-muted-foreground/60 mt-2">Sẽ khả dụng sau khi cấp</p>
                                      </div>
                                 </div>
                             )}

                             {/* Preview Label */}
                             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-muted-foreground shadow-sm border border-border">
                                 {certificateSerial ? "CHỨNG CHỈ CHÍNH THỨC" : "BẢN XEM TRƯỚC"}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
