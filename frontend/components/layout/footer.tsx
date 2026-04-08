"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#223148] text-white/70">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 font-serif font-bold text-2xl text-white tracking-tight hover:opacity-90 transition-opacity">
                <div className="relative w-8 h-8">
                     <Image src="/logo.webp" alt="Noble Language Academy Logo" fill className="object-contain" />
                </div>
                Noble Language Academy
            </Link>
            <p className="text-white/50 text-sm leading-relaxed">
              Tiên phong trong đào tạo ngôn ngữ chuẩn quốc tế và cấp chứng chỉ xác thực trên Blockchain. Kiến tạo tương lai không giới hạn.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white/60 hover:text-white transition-all">
                <Facebook size={18} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white/60 hover:text-white transition-all">
                <Twitter size={18} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white/60 hover:text-white transition-all">
                <Linkedin size={18} />
              </Link>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">Khám phá</h3>
            <ul className="space-y-4">
              <li><Link href="/courses" className="hover:text-amber-300 transition-colors text-sm">Khóa học nổi bật</Link></li>
              <li><Link href="/instructors" className="hover:text-amber-300 transition-colors text-sm">Đội ngũ giảng viên</Link></li>
              <li><Link href="/verify" className="hover:text-amber-300 transition-colors text-sm">Xác thực chứng chỉ</Link></li>
              <li><Link href="/blog" className="hover:text-amber-300 transition-colors text-sm">Tin tức & Sự kiện</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">Hỗ trợ</h3>
            <ul className="space-y-4">
              <li><Link href="/help" className="hover:text-amber-300 transition-colors text-sm">Trung tâm trợ giúp</Link></li>
              <li><Link href="/terms" className="hover:text-amber-300 transition-colors text-sm">Điều khoản sử dụng</Link></li>
              <li><Link href="/privacy" className="hover:text-amber-300 transition-colors text-sm">Chính sách bảo mật</Link></li>
              <li><Link href="/contact" className="hover:text-amber-300 transition-colors text-sm">Liên hệ hợp tác</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">Liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-white/50">
                <MapPin size={18} className="text-amber-300 mt-0.5 shrink-0" />
                <span>Noble Building, No. 1 Thang Long Ave, Hanoi</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/50">
                <Phone size={18} className="text-amber-300 shrink-0" />
                <span>+84 (0) 123 456 789</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/50">
                <Mail size={18} className="text-amber-300 shrink-0" />
                <span>contact@noblecert.edu.vn</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} Noble Language Academy. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
