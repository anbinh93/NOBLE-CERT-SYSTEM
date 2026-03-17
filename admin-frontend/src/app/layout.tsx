import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Merriweather } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import ReactQueryProvider from '@/providers/react-query-provider';
import { Toaster } from '@/components/ui/sonner';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
});

const merriweather = Merriweather({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Noble-Cert Admin Control Center',
  description: 'Dashboard quản trị tốc độ cao, xử lý dữ liệu tài chính và cấu hình khoá học',
  icons: {
    icon: [{ url: '/logo.webp', type: 'image/webp' }],
    apple: [{ url: '/logo.webp', type: 'image/webp' }],
    shortcut: ['/logo.webp'],
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8f6e08' },
    { media: '(prefers-color-scheme: dark)', color: '#d4af37' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnamPro.variable} ${merriweather.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}>
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
