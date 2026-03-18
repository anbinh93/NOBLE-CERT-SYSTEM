// src/services/email.service.ts
import nodemailer from "nodemailer";
import { prisma } from "../config/database.config";

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
}

async function getEmailConfig(): Promise<EmailConfig> {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          "smtp_host",
          "smtp_port",
          "smtp_user",
          "smtp_pass",
          "smtp_from_name",
        ],
      },
    },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return {
    host: map.smtp_host || "smtp.gmail.com",
    port: Number(map.smtp_port) || 587,
    user: map.smtp_user || "",
    pass: map.smtp_pass || "",
    fromName: map.smtp_from_name || "Noble Cert",
  };
}

async function createTransporter() {
  const config = await getEmailConfig();

  if (!config.user || !config.pass) {
    console.warn(
      "[EmailService] SMTP chưa được cấu hình trong Cài đặt hệ thống",
    );
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
}

export class EmailService {
  /**
   * Gửi email xác thực cho student đăng ký mới
   */
  static async sendVerificationEmail(to: string, name: string, token: string) {
    const transporter = await createTransporter();
    if (!transporter) {
      console.log(
        `[EmailService] Skipped verification email to ${to} (SMTP not configured)`,
      );
      return false;
    }

    const config = await getEmailConfig();
    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to,
      subject: "Xác thực tài khoản Noble Cert",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0f766e; margin: 0;">Noble Cert</h1>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
            <h2 style="margin-top: 0; color: #1e293b;">Xin chào ${name}! 👋</h2>
            <p style="color: #475569; line-height: 1.6;">
              Cảm ơn bạn đã đăng ký tài khoản tại <strong>Noble Cert</strong>.
              Vui lòng xác thực email bằng cách bấm nút bên dưới:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}"
                 style="display: inline-block; background: #0f766e; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Xác thực email
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">
              Link xác thực có hiệu lực trong 24 giờ. Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.
            </p>
          </div>
        </div>
      `,
    });

    return true;
  }

  /**
   * Gửi email mời cho instructor do admin tạo
   */
  static async sendInstructorInviteEmail(
    to: string,
    name: string,
    token: string,
    tempPassword: string,
  ) {
    const transporter = await createTransporter();
    if (!transporter) {
      console.log(
        `[EmailService] Skipped invite email to ${to} (SMTP not configured)`,
      );
      return false;
    }

    const config = await getEmailConfig();
    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to,
      subject: "Lời mời làm Người hướng dẫn tại Noble Cert",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0f766e; margin: 0;">Noble Cert</h1>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
            <h2 style="margin-top: 0; color: #1e293b;">Xin chào ${name}! 🎓</h2>
            <p style="color: #475569; line-height: 1.6;">
              Bạn đã được mời làm <strong>Người hướng dẫn</strong> tại <strong>Noble Cert</strong>.
            </p>
            <div style="background: #fff; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 4px 0; color: #334155;"><strong>Email:</strong> ${to}</p>
              <p style="margin: 4px 0; color: #334155;"><strong>Mật khẩu tạm:</strong> <code style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px;">${tempPassword}</code></p>
            </div>
            <p style="color: #475569; line-height: 1.6;">
              Vui lòng xác thực email và đổi mật khẩu sau khi đăng nhập:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}"
                 style="display: inline-block; background: #0f766e; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Xác thực & Bắt đầu
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">
              Link xác thực có hiệu lực trong 24 giờ.
            </p>
          </div>
        </div>
      `,
    });

    return true;
  }

  /**
   * Gửi email test để kiểm tra cấu hình SMTP
   */
  static async sendTestEmail(to: string) {
    const transporter = await createTransporter();
    if (!transporter) {
      throw new Error(
        "SMTP chưa được cấu hình. Vui lòng nhập Gmail và App Password.",
      );
    }

    const config = await getEmailConfig();

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to,
      subject: "[Test] Cấu hình email Noble Cert",
      html: `<p>✅ Email đã được gửi thành công từ hệ thống Noble Cert!</p>`,
    });

    return true;
  }

  /**
   * Gửi email đặt lại mật khẩu
   */
  static async sendResetPasswordEmail(
    to: string,
    name: string,
    token: string,
    role?: string,
  ) {
    const transporter = await createTransporter();
    if (!transporter) {
      console.log(
        `[EmailService] Skipped reset password email to ${to} (SMTP not configured)`,
      );
      return false;
    }

    const config = await getEmailConfig();
    const adminRoles = ["SUPER_ADMIN", "INSTRUCTOR", "STAFF"];
    const baseUrl =
      role && adminRoles.includes(role)
        ? process.env.ADMIN_URL || "http://localhost:3001"
        : process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to,
      subject: "Đặt lại mật khẩu — Noble Cert",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0f766e; margin: 0;">Noble Cert</h1>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
            <h2 style="margin-top: 0; color: #1e293b;">Xin chào ${name}! 🔐</h2>
            <p style="color: #475569; line-height: 1.6;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Noble Cert</strong>.
              Vui lòng bấm nút bên dưới để tạo mật khẩu mới:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}"
                 style="display: inline-block; background: #0f766e; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Đặt lại mật khẩu
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">
              Link đặt lại mật khẩu có hiệu lực trong <strong>1 giờ</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
            </p>
          </div>
        </div>
      `,
    });

    return true;
  }
}
