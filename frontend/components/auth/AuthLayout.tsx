import Image from "next/image";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  isLogin?: boolean;
}

export default function AuthLayout({ children, title, subtitle, isLogin }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Side - Artwork (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-muted/30 flex-col justify-between p-12 relative overflow-hidden">
         <div className="z-10">
             <Link href="/" className="text-2xl font-bold text-primary tracking-tighter">
                CertiFlow
             </Link>
             <div className="mt-20 max-w-md">
                 <h2 className="text-4xl font-bold text-foreground leading-tight">
                     {isLogin ? "Chào mừng trở lại!" : "Học tập không giới hạn."}
                 </h2>
                 <p className="mt-4 text-lg text-muted-foreground">
                     {isLogin 
                        ? "Tiếp tục hành trình nâng cao kỹ năng của bạn ngay hôm nay." 
                        : "Tham gia cộng đồng hơn 5000 học viên và nhận chứng chỉ uy tín."}
                 </p>
             </div>
         </div>
         
         <div className="z-10">
             <div className="flex items-center gap-4">
                 <div className="flex -space-x-4">
                     {[1,2,3].map(i => (
                         <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                              <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="User" />
                         </div>
                     ))}
                 </div>
                 <div className="text-sm font-medium text-muted-foreground">
                     Hơn 500+ chứng chỉ được cấp tuần qua.
                 </div>
             </div>
         </div>
         
         {/* Abstract Decoration */}
         <div className="absolute top-1/2 right-0 transform translate-x-1/3 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full opacity-50 blur-3xl"></div>
         <div className="absolute bottom-0 left-0 transform -translate-x-1/3 translate-y-1/3 w-80 h-80 bg-yellow-200 rounded-full opacity-50 blur-3xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
              <div className="lg:hidden text-center mb-8">
                  <Link href="/" className="text-2xl font-bold text-primary">CertiFlow</Link>
              </div>
              
              <div className="text-center lg:text-left">
                  <h2 className="text-3xl font-bold text-foreground">{title}</h2>
                  {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
              </div>

              {children}
          </div>
      </div>
    </div>
  );
}
