"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Download, Share2, Award, Calendar, ExternalLink, Loader2 } from "lucide-react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Image from "next/image";

import { Suspense } from "react";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { toast } from "sonner";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => (Array.isArray(json) ? json : (json?.data ?? [])));

function CertificatesContent() { // Inner component using searchParams
  const { data: session } = useSession();
  const email = session?.user?.email;

  const { data: response, error, isLoading, mutate } = useSWR(
    email ? `${API_ENDPOINTS.STUDENT.MY_CERTIFICATES}?email=${email}` : null,
    fetcher
  );
  
  const certificates = Array.isArray(response) ? response : [];

  /* New Logic for Payments */
  // Legacy params and modal states removed

  const handleShare = (cert: any) => {
      const url = `${window.location.origin}/verify/${cert.serialNumber}`;
      if (navigator.share) {
          navigator.share({
              title: `Certificate: ${cert.courseId?.name}`,
              text: `Check out my verified certificate for ${cert.courseId?.name}!`,
              url: url
          }).catch(console.error);
      } else {
          navigator.clipboard.writeText(url);
          // Simple alert or toast could be better, but sticking to alert for simplicity as requested "full functionality"
          toast.success("Đã sao chép link chứng chỉ!"); 
      }
  };

  const handleDownload = (cert: any) => {
       // Open verify page in print mode
       window.open(`/verify/${cert.serialNumber}?print=true`, '_blank');
  };

  const { data: enrollmentsData } = useSWR(
    email ? `${API_ENDPOINTS.STUDENT.MY_COURSES}?email=${email}` : null,
    fetcher
  );

  // Filter for completed but uncertified courses
  const pendingCertificates = enrollmentsData?.filter((enrollment: any) => {
      const isCompleted = enrollment.progress >= 100 || (enrollment.completedUnits && enrollment.courseId && enrollment.completedUnits.length >= enrollment.courseId.totalUnits);
      
      const hasCertificate = certificates?.some((cert: any) => 
          cert.courseId?._id === enrollment.courseId?._id || cert.courseId === enrollment.courseId?._id
      );
      
      return isCompleted && !hasCertificate;
  }) || [];

  // Removed legacy payment modal logic


  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div>Failed to load certificates</div>;

  return (
    <div className="space-y-8 pb-20 relative">

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
           <div>
               <h1 className="text-2xl font-serif font-bold text-foreground">Chứng chỉ của tôi</h1>
               <p className="text-muted-foreground mt-1">Xác minh và tải xuống các chứng chỉ bạn đã đạt được.</p>
           </div>
           
           <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex items-center gap-4">
               <div className="bg-primary/20 p-2 rounded-full text-primary border border-primary/20">
                   <Award className="h-6 w-6" />
               </div>
               <div>
                   <p className="text-sm text-muted-foreground font-medium">Tổng số chứng chỉ</p>
                   <p className="text-xl font-bold text-foreground font-serif">{certificates.length}</p>
               </div>
           </div>
      </div>

      {/* Pending Certificates Section */}
      {pendingCertificates.length > 0 && (
          <div className="mb-10">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 font-serif">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  Sẵn sàng nhận chứng chỉ
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pendingCertificates.map((enrollment: any) => (
                      <div key={enrollment._id} className="bg-card border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center shadow-inner text-primary border border-primary/20">
                                <Award className="w-8 h-8" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-bold text-foreground text-lg title-font">{enrollment.courseId?.name}</h3>
                                <p className="text-sm text-muted-foreground mb-3">Hoàn thành ngày {new Date(enrollment.updatedAt).toLocaleDateString("vi-VN")}</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-xs font-bold text-primary">
                                    CẦN THANH TOÁN
                                </div>
                            </div>
                            <Link href={`/student/certificates/claim/${enrollment.courseId?._id}`}>
                                <Button 
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)] whitespace-nowrap font-bold"
                                >
                                    Thanh toán & Nhận
                                </Button>
                            </Link>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Certificate Grid */}
      <div>
         {!certificates || certificates.length === 0 ? (
             (pendingCertificates.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-3xl border border-primary/10 border-dashed">
                    <div className="w-20 h-20 bg-primary/5 text-primary/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/10">
                        <Award className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground font-serif">Chưa có chứng chỉ nào</h3>
                    <p className="text-muted-foreground mt-2 mb-8 max-w-md mx-auto">
                        Hoàn thành các khóa học để nhận chứng chỉ chuyên nghiệp được công nhận.
                        Thành tích của bạn sẽ xuất hiện tại đây.
                    </p>
                    <Link href="/courses">
                        <Button className="rounded-full px-8 py-6 text-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">Khám phá khóa học</Button>
                    </Link>
                </div>
             ) : null)
         ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {certificates.map((cert: any) => (
                     <div key={cert._id} className="group bg-card rounded-3xl p-6 shadow-sm border border-primary/10 hover:shadow-[0_10px_30px_-5px_rgba(212,175,55,0.15)] hover:border-primary/30 transition-all duration-300">
                         {/* Card Header */}
                         <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Image src="/favicon.ico" alt="Logo" width={24} height={24} className="opacity-80 drop-shadow-sm" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-primary tracking-wide uppercase font-serif">{cert.issuerId?.name || "Noble Cert"}</p>
                                    <h3 className="font-bold text-foreground text-lg mt-0.5 max-w-50 truncate">{cert.courseId?.name || "Chứng chỉ khóa học"}</h3>
                                </div>
                            </div>
                            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20 shadow-sm">
                                ĐÃ XÁC MINH
                            </div>
                         </div>

                         {/* Preview Area (Pseudo-Certificate) */}
                         <div className="relative aspect-16/10 bg-background/50 rounded-xl border border-primary/10 overflow-hidden mb-6 group-hover:border-primary/40 transition-colors">
                            {/* Pattern Background */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat invert dark:invert-0"></div>
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                <Award className="h-16 w-16 text-primary mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                                <h4 className="font-serif text-2xl text-foreground mb-1">Giấy Chứng Nhận</h4>
                                <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] mb-4">Trao tặng cho</p>
                                <p className="font-serif italic text-3xl text-primary mb-4 font-bold drop-shadow-sm">{cert.userInfo?.name}</p>
                                <p className="text-[10px] text-muted-foreground/60 font-mono">ID: {cert.serialNumber}</p>
                            </div>
                         </div>

                         {/* Details */}
                         <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                             <div>
                                 <p className="text-muted-foreground text-xs mb-1">Ngày cấp</p>
                                 <p className="font-medium text-foreground flex items-center gap-2">
                                     <Calendar className="h-3.5 w-3.5 text-primary/70" />
                                     {new Date(cert.issuedDate).toLocaleDateString("vi-VN")}
                                 </p>
                             </div>
                             <div>
                                 <p className="text-muted-foreground text-xs mb-1">Mã xác thực</p>
                                 <p className="font-medium text-foreground font-mono tracking-tight text-xs bg-muted/50 p-1 px-2 rounded inline-block border border-primary/10">
                                     {cert.serialNumber}
                                 </p>
                             </div>
                         </div>

                         {/* Actions */}
                         <div className="flex items-center gap-3 pt-6 border-t border-primary/10">
                             <Button variant="outline" className="flex-1 rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/50 text-muted-foreground" onClick={() => handleDownload(cert)}>
                                 <Download className="h-4 w-4 mr-2" /> PDF
                             </Button>
                             <Button variant="outline" className="flex-1 rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/50 text-muted-foreground" onClick={() => handleShare(cert)}>
                                 <Share2 className="h-4 w-4 mr-2" /> Chia sẻ
                             </Button>
                             <Link href={`/verify/${cert.serialNumber}`} target="_blank" className="flex-1">
                                <Button className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-bold">
                                    Xác minh <ExternalLink className="h-3 w-3 ml-2" />
                                </Button>
                             </Link>
                         </div>
                     </div>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
}

export default function CertificatesPage() {
    return (
        <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <CertificatesContent />
        </Suspense>
    );
}
