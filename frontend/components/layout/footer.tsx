"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card text-muted-foreground border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 font-serif font-bold text-2xl text-foreground tracking-tight hover:opacity-90 transition-opacity">
                <div className="relative w-8 h-8">
                     <Image src="/logo.webp" alt="Noble Cert Logo" fill className="object-contain" />
                </div>
                Noble Cert
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tiên phong trong đào tạo ngôn ngữ chuẩn quốc tế và cấp chứng chỉ xác thực trên Blockchain. Kiến tạo tương lai không giới hạn.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                <Facebook size={18} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                <Twitter size={18} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                <Linkedin size={18} />
              </Link>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-foreground font-bold mb-6 text-lg">Khám phá</h3>
            <ul className="space-y-4">
              <li><Link href="/courses" className="hover:text-primary transition-colors text-sm">Khóa học nổi bật</Link></li>
              <li><Link href="/instructors" className="hover:text-primary transition-colors text-sm">Đội ngũ giảng viên</Link></li>
              <li><Link href="/verify" className="hover:text-primary transition-colors text-sm">Xác thực chứng chỉ</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors text-sm">Tin tức & Sự kiện</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-foreground font-bold mb-6 text-lg">Hỗ trợ</h3>
            <ul className="space-y-4">
              <li><Link href="/help" className="hover:text-primary transition-colors text-sm">Trung tâm trợ giúp</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors text-sm">Điều khoản sử dụng</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors text-sm">Chính sách bảo mật</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors text-sm">Liên hệ hợp tác</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-foreground font-bold mb-6 text-lg">Liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                <span>Noble Building, No. 1 Thang Long Ave, Hanoi</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone size={18} className="text-primary shrink-0" />
                <span>+84 (0) 123 456 789</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail size={18} className="text-primary shrink-0" />
                <span>contact@noblecert.edu.vn</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Noble Cert. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
