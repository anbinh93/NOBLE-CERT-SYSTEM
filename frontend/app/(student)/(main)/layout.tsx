
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export default function MainStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="lg:pl-64">
         <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background/90 shadow-sm px-4 backdrop-blur-md sm:px-6 lg:px-8 border-b border-border">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                </Button>
                <div className="h-8 w-8 rounded-full bg-muted border border-border"></div>
            </div>
         </header>

         <main className="p-4 sm:p-6 lg:p-8">
            {children}
         </main>
      </div>
    </div>
  );
}
