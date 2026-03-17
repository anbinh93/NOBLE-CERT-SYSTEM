"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Shield, Bell, Loader2, Save, Camera } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const email = session?.user?.email;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    avatar: "",
    bio: ""
  });

  // Dùng dữ liệu từ NextAuth session thay vì gọi endpoint không tồn tại
  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        avatar: session.user.image || "",
        bio: "",
      });
    }
    setIsLoading(false);
  }, [session]);

  const handleSave = async () => {
      setIsSaving(true);
      try {
          // Cập nhật session local (name, image) — backend chưa có update-profile endpoint
          await update({ name: formData.name, image: formData.avatar });
          toast.success("Cập nhật thông tin thành công!");
      } catch (e) {
          console.error(e);
          toast.error("Cập nhật thất bại, vui lòng thử lại.");
      } finally {
          setIsSaving(false);
      }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <div>
         <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
         <p className="text-muted-foreground mt-1">Quản lý tùy chọn tài khoản và thông tin cá nhân của bạn.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-card p-1 rounded-full border border-border w-full md:w-auto inline-flex h-auto">
           <TabsTrigger value="general" className="rounded-full px-6 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Chung</TabsTrigger>
           <TabsTrigger value="security" className="rounded-full px-6 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Bảo mật</TabsTrigger>
           <TabsTrigger value="notifications" className="rounded-full px-6 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Thông báo</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-8 space-y-6">
            {/* Profile Card */}
            <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Thông tin cá nhân
                </h2>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-muted shadow-inner">
                            {formData.avatar ? (
                                <Image src={formData.avatar} alt="Avatar" fill className="object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                    <User className="h-10 w-10" />
                                </div>
                            )}
                        </div>
                        <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => {
                            const url = prompt("Nhập đường dẫn ảnh (ví dụ từ Google hoặc Facebook):", formData.avatar);
                            if (url !== null) setFormData({...formData, avatar: url});
                        }}>
                            <Camera className="h-3 w-3 mr-2" /> Đổi ảnh
                        </Button>
                    </div>

                    {/* Form Section */}
                    <div className="flex-1 w-full space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Họ và Tên</Label>
                                <Input 
                                    id="name" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                    className="rounded-xl border-input focus:ring-primary/20"
                                    placeholder="Nhập họ tên của bạn"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Địa chỉ Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="email" 
                                        value={email || ""} 
                                        disabled 
                                        className="pl-9 rounded-xl border-input bg-muted text-muted-foreground cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button onClick={handleSave} disabled={isSaving} className="rounded-full bg-primary hover:bg-primary/90 px-8 text-white font-bold">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Lưu thay đổi
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="security" className="mt-8">
            <div className="bg-card rounded-3xl p-8 shadow-sm border border-border text-center py-16">
                 <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-semibold text-foreground">Cài đặt bảo mật</h3>
                 <p className="text-muted-foreground mt-2">Tính năng đổi mật khẩu và bảo mật 2 lớp đang được phát triển.</p>
            </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-8">
            <div className="bg-card rounded-3xl p-8 shadow-sm border border-border text-center py-16">
                 <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-semibold text-foreground">Tùy chọn thông báo</h3>
                 <p className="text-muted-foreground mt-2">Quản lý cách chúng tôi gửi thông báo cho bạn.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
