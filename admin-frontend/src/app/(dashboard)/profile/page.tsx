"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");

  useEffect(() => {
    adminFetch<{ user: ProfileData }>("/profile")
      .then((data) => {
        setProfile(data.user);
        setName(data.user.name);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Tên không được để trống");
      return;
    }
    setSaving(true);
    try {
      const data = await adminFetch<{ user: ProfileData }>("/profile", {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      setProfile(data.user);
      toast.success("Đã cập nhật hồ sơ!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h2>
        <p className="text-muted-foreground">
          Chỉnh sửa thông tin cá nhân của bạn.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-7 w-7" />
            </div>
            <div>
              <CardTitle>{profile.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {profile.email}
                <Badge variant="secondary" className="text-xs">
                  {profile.role}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Họ tên</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ tên..."
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">
              Email không thể thay đổi.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngày tạo</Label>
              <Input
                value={new Date(profile.createdAt).toLocaleDateString("vi-VN")}
                disabled
                className="opacity-60"
              />
            </div>
            <div className="space-y-2">
              <Label>Cập nhật</Label>
              <Input
                value={new Date(profile.updatedAt).toLocaleDateString("vi-VN")}
                disabled
                className="opacity-60"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
