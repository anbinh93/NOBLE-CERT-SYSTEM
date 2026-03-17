import { Be_Vietnam_Pro, Merriweather } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";
import Footer from "@/components/layout/footer";

const beVietnamPro = Be_Vietnam_Pro({ 
  subsets: ["vietnamese", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

const merriweather = Merriweather({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-serif",
});

import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Noble Cert - Hệ thống chứng chỉ số chuyên nghiệp",
    template: "%s | Noble Cert"
  },
  description: "Nền tảng xác thực và cấp phát chứng chỉ số hàng đầu. Bảo mật, minh bạch và dễ dàng chia sẻ thành tựu của bạn.",
  keywords: ["Noble Cert", "Certificate", "Blockchain", "Xác thực văn bằng", "Chứng chỉ số", "LMS", "E-learning"],
  authors: [{ name: "Noble Network" }],
  creator: "Noble Cert Team",
  publisher: "Noble Network",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    title: "Noble Cert - Hệ thống chứng chỉ số chuyên nghiệp",
    description: "Nền tảng xác thực và cấp phát chứng chỉ số hàng đầu. Bảo mật, minh bạch và dễ dàng chia sẻ thành tựu của bạn.",
    siteName: "Noble Cert",
    images: [
      {
        url: "/og-image.jpg", // Make sure to suggest user to add this
        width: 1200,
        height: 630,
        alt: "Noble Cert Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noble Cert - Hệ thống chứng chỉ số chuyên nghiệp",
    description: "Nền tảng xác thực và cấp phát chứng chỉ số hàng đầu.",
    images: ["/og-image.jpg"],
    creator: "@noblecert",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnamPro.variable} ${merriweather.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`} suppressHydrationWarning>
        <Providers>
            <Header />
            {children}
            <Footer />
            <Toaster richColors position="top-center" duration={3500} />
        </Providers>
      </body>
    </html>
  );
}
