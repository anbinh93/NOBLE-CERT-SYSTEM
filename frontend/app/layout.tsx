import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import Providers from "@/components/Providers";
import Footer from "@/components/layout/footer";

const inter = Inter({ 
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
});

import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Noble Language Academy - Học viện ngôn ngữ chuyên nghiệp",
    template: "%s | Noble Language Academy"
  },
  description: "Nền tảng đào tạo ngôn ngữ chuẩn quốc tế hàng đầu. Luyện thi TOEIC, IELTS, JLPT với chứng chỉ xác thực Blockchain.",
  keywords: ["Noble Language Academy", "TOEIC", "IELTS", "JLPT", "Học ngôn ngữ", "Chứng chỉ", "LMS", "E-learning"],
  authors: [{ name: "Noble Network" }],
  creator: "Noble Language Academy",
  publisher: "Noble Network",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    title: "Noble Language Academy - Học viện ngôn ngữ chuyên nghiệp",
    description: "Nền tảng đào tạo ngôn ngữ chuẩn quốc tế hàng đầu. Luyện thi TOEIC, IELTS, JLPT với chứng chỉ xác thực Blockchain.",
    siteName: "Noble Language Academy",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Noble Language Academy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noble Language Academy - Học viện ngôn ngữ chuyên nghiệp",
    description: "Nền tảng đào tạo ngôn ngữ chuẩn quốc tế hàng đầu.",
    images: ["/og-image.jpg"],
    creator: "@nobleacademy",
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
      <body className={`${inter.variable} ${playfairDisplay.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}>
        <Providers>
            <Header />
            {children}
            <Footer />
        </Providers>
      </body>
    </html>
  );
}
