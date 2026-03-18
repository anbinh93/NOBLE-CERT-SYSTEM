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
import { Loader2, Mail, Save, Send, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("Noble Cert");
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    adminFetch<{ settings: Record<string, string> }>("/settings")
      .then(({ settings }) => {
        if (settings.smtp_host) setSmtpHost(settings.smtp_host);
        if (settings.smtp_port) setSmtpPort(settings.smtp_port);
        if (settings.smtp_user) setSmtpUser(settings.smtp_user);
        if (settings.smtp_pass) setSmtpPass(settings.smtp_pass);
        if (settings.smtp_from_name) setSmtpFromName(settings.smtp_from_name);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!smtpUser || !smtpPass) {
      toast.error("Vui lòng nhập Gmail và App Password!");
      return;
    }
    setSaving(true);
    try {
      await adminFetch("/settings", {
        method: "PUT",
        body: JSON.stringify({
          settings: {
            smtp_host: smtpHost,
            smtp_port: smtpPort,
            smtp_user: smtpUser,
            smtp_pass: smtpPass,
            smtp_from_name: smtpFromName,
          },
        }),
      });
      toast.success("Đã lưu cài đặt!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Nhập email nhận test!");
      return;
    }
    setTesting(true);
    try {
      await adminFetch("/settings/test-email", {
        method: "POST",
        body: JSON.stringify({ email: testEmail }),
      });
      toast.success("Đã gửi email test! Kiểm tra hộp thư.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h2>
        <p className="text-muted-foreground">
          Cấu hình email gửi thông báo cho người dùng.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Cấu hình Email (SMTP)
          </CardTitle>
          <CardDescription>
            Sử dụng Gmail + App Password để gửi email xác thực và thông báo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Gmail <span className="text-destructive">*</span>
            </Label>
            <Input
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="your-email@gmail.com"
              type="email"
            />
          </div>

          <div className="space-y-2">
            <Label>
              App Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                type={showPass ? "text" : "password"}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tạo App Password tại{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                myaccount.google.com/apppasswords
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tên người gửi</Label>
            <Input
              value={smtpFromName}
              onChange={(e) => setSmtpFromName(e.target.value)}
              placeholder="Noble Cert"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gửi email test</CardTitle>
          <CardDescription>
            Kiểm tra cấu hình SMTP bằng cách gửi email thử.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Nhập email nhận test..."
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleTestEmail}
              disabled={testing}
            >
              <Send className="mr-2 h-4 w-4" />
              {testing ? "Đang gửi..." : "Gửi test"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
