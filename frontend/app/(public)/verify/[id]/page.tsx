"use client";

import { useEffect, useState, use } from "react";
import { CheckCircle, XCircle, Award, Calendar, User, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface VerificationResult {
    isValid: boolean;
    studentName: string;
    courseName: string;
    completedAt: string;
    certificateId: string;
    instructor: string;
    message?: string;
}

export default function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const verify = async () => {
            try {
                // Dùng full backend URL — không dùng relative path
                const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const res = await fetch(`${apiBase}/api/public/verify/${id}`);
                const json = await res.json();

                // Backend trả { status: 'success', data: {...} }
                if (res.ok && json.status === 'success' && json.data) {
                    const certData = json.data;
                    setResult({
                        isValid: true,
                        studentName: certData.userInfo?.name || certData.userInfo?.email || "Học viên",
                        courseName: certData.courseId?.name || "Khoá học",
                        completedAt: certData.issuedDate || certData.createdAt,
                        certificateId: certData.serialNumber || certData._id,
                        instructor: certData.issuerId?.name || "Noble Language Academy",
                        message: "Verified",
                    });
                } else {
                    setError(json.message || "Chứng chỉ không hợp lệ hoặc không tồn tại");
                }
            } catch {
                setError("Không thể kết nối đến máy chủ xác minh");
            } finally {
                setLoading(false);
            }
        };

        if (id) verify();
    }, [id]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Verifying...</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">

            <main className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-0 bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                    
                    {/* LEFT COLUMN: DETAILS */}
                    <div className="p-8 flex flex-col">
                        <div className="mb-8">
                             <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${error ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600 dark:text-green-400"}`}>
                                {error ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                {error ? "Verification Failed" : "Verified Authentic"}
                             </div>
                        </div>

                        {error ? (
                            <div className="text-center py-10">
                                <h1 className="text-xl font-bold text-foreground mb-2">Could not verify certificate</h1>
                                <p className="text-muted-foreground">{error}</p>
                                <div className="mt-6">
                                    <Link href="/">
                                        <Button variant="outline">Return Home</Button>
                                    </Link>
                                </div>
                            </div>
                        ) : result ? (
                            <div className="space-y-8 flex-1">
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Certificate Holder</p>
                                    <h2 className="text-2xl font-serif font-bold text-foreground">{result.studentName}</h2>
                                    <p className="text-sm text-muted-foreground mt-1">{result.studentName === "Unknown Student" ? "User details not available" : ""}</p>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Course</p>
                                            <p className="font-semibold text-foreground">{result.courseName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground shrink-0 mt-1">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Issued On</p>
                                            <p className="font-semibold text-foreground">
                                                {result.completedAt ? new Date(result.completedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0 mt-1">
                                            <Award className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Issued By</p>
                                            <p className="font-semibold text-foreground">{result.instructor}</p>
                                        </div>
                                    </div>

                                     <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-1">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Certificate ID</p>
                                            <p className="font-mono text-muted-foreground bg-muted px-2 py-1 rounded text-sm inline-block">{result.certificateId}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-8 mt-auto">
                                     <p className="text-xs text-muted-foreground">
                                        This certificate confirms that the learner has completed all course requirements and passed the final assessment.
                                     </p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* RIGHT COLUMN: PREVIEW */}
                    <div className="bg-secondary border-l border-border flex flex-col items-center justify-center p-8 relative min-h-[400px]">
                        {!error && result && (
                            <div className="relative w-full aspect-[1.414] shadow-2xl rounded-lg overflow-hidden transition-transform hover:scale-[1.02] duration-500">
                                 {/* Use absolute backend URL based on env or default */}
                                 {/* NOTE: In production, this should be the public backend URL */}
                                 {(() => {
                                     // Hardcode or use env. For now usage logic:
                                     // If we are in browser, we can use process.env.NEXT_PUBLIC_API_URL if set,
                                     // or fallback to localhost:5000 if dev.
                                     // The user asked to call "backendURL".
                                     
                                     const API_Base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                                     const previewUrl = `${API_Base}/api/public/verify/${id}/preview`;
                                     
                                     return (
                                        <Image 
                                            src={previewUrl} 
                                            alt="Certificate Preview" 
                                            fill 
                                            className="object-cover"
                                            unoptimized // Bypass Next.js Image Optimization to hit backend directly
                                        />
                                     );
                                 })()}
                            </div>
                        )}
                        {!error && result && (
                            <Button 
                                className="mt-8 shadow-lg shadow-blue-500/20" 
                                onClick={() => {
                                     const API_Base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                                     window.open(`${API_Base}/api/public/verify/${id}/preview`, '_blank');
                                }}
                            >
                                Download / View Full Size
                            </Button>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
