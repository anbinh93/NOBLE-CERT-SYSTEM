"use client";

import { useRef, forwardRef, useImperativeHandle, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Award } from "lucide-react";

interface CertificateCanvasProps {
    studentName: string;
    courseName: string;
    date: string;
    instructor: string;
    certificateId: string;
}

export interface CertificateHandle {
    export: (type: 'png' | 'pdf') => Promise<void>;
}

const CertificateCanvas = forwardRef<CertificateHandle, CertificateCanvasProps>((props, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    useImperativeHandle(ref, () => ({
        export: async (type) => {
            if (!canvasRef.current) return;
            setIsExporting(true);
            try {
                // Wait for fonts to load or layout to stabilize if needed
                await document.fonts.ready;
                
                const canvas = await html2canvas(canvasRef.current, {
                    scale: 2, // High resolution
                    useCORS: true, // If using external images
                    backgroundColor: "#ffffff",
                    logging: false
                });

                if (type === 'png') {
                    const image = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = image;
                    link.download = `Certificate-${props.certificateId}.png`;
                    link.click();
                } else if (type === 'pdf') {
                    const imgData = canvas.toDataURL("image/png");
                    const pdf = new jsPDF({
                        orientation: "landscape",
                        unit: "px",
                        format: [canvas.width, canvas.height] 
                    });
                    // Add image to PDF. 
                    // Note: jsPDF dimensions are tricky. 
                    // Using format equal to canvas dims keeps 1:1 pixel mapping roughly.
                    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                    pdf.save(`Certificate-${props.certificateId}.pdf`);
                }
            } catch (error) {
                console.error("Certificate Export Failed", error);
                alert("Failed to export certificate.");
            } finally {
                setIsExporting(false);
            }
        }
    }));

    return (
        <div style={{ position: 'absolute', top: -9999, left: -9999 }}> 
        {/* We render this off-screen or hidden, BUT html2canvas needs it to be in DOM and visible (not display:none). 
            Absolute positioning off-screen works best. 
        */}
            <div 
                ref={canvasRef}
                className="relative bg-white text-slate-900 font-serif"
                style={{ width: '1000px', height: '707px' }} // Standard A4 Landscape-ish ratio
            >
                {/* Border / Pattern */}
                <div className="absolute inset-4 border-4 border-double border-slate-200"></div>
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #d4af37 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                {/* Content */}
                <div className="flex flex-col items-center justify-center h-full p-16 text-center z-10 relative">
                     <div className="mb-8">
                         <div className="w-24 h-24 mb-4 mx-auto relative flex items-center justify-center">
                             {/* Use standard img for better html2canvas compatibility if needed, or Next Image with unoptimized */}
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo.webp" alt="Noble Cert Logo" className="w-full h-full object-contain drop-shadow-xl" crossOrigin="anonymous" />
                         </div>
                         <h1 className="text-5xl font-bold tracking-wider text-slate-800 mb-2 uppercase">CHỨNG CHỈ</h1>
                         <p className="text-sm font-bold tracking-[0.4em] text-[#d4af37] uppercase">HOÀN THÀNH KHÓA HỌC</p>
                     </div>

                     <div className="mb-8 w-full max-w-2xl">
                         <p className="text-slate-500 italic text-lg mb-4">Chứng nhận này được trao cho</p>
                         <h2 className="text-4xl font-bold text-slate-900 border-b-2 border-slate-200 pb-4 mb-4 mx-auto w-3/4">
                             {props.studentName}
                         </h2>
                         <p className="text-slate-500 italic text-lg mb-2">đã hoàn thành xuất sắc khóa học</p>
                         <h3 className="text-3xl font-bold text-[#d4af37] mb-8">{props.courseName}</h3>
                     </div>

                     {/* Signatures / Footer */}
                     <div className="flex justify-between items-end w-full px-12 mt-auto">
                         <div className="text-center">
                             <p className="font-bold text-lg text-slate-800">{props.date}</p>
                             <div className="w-40 h-px bg-slate-300 my-2"></div>
                             <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Ngày cấp</p>
                         </div>
                         
                         <div className="text-center">
                            {/* Seal */}
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                <Award className="w-20 h-20 text-[#d4af37]" />
                                <div className="absolute inset-0 border-4 border-[#d4af37]/30 rounded-full"></div>
                                <div className="absolute inset-2 border border-[#d4af37]/50 rounded-full"></div>
                            </div>
                         </div>

                         <div className="text-center">
                             <div className="font-audiowide font-bold text-lg text-slate-800 h-7 flex items-end justify-center font-signature" style={{ fontFamily: 'cursive' }}>
                                 {props.instructor}
                             </div>
                             <div className="w-40 h-px bg-slate-300 my-2"></div>
                             <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Giảng viên</p>
                         </div>
                     </div>
                     
                     {/* Verify ID */}
                     <div className="absolute bottom-4 right-4 text-[10px] text-slate-300 monospace">
                         ID: {props.certificateId}
                     </div>
                </div>
            </div>
        </div>
    );
});

CertificateCanvas.displayName = "CertificateCanvas";
export default CertificateCanvas;
