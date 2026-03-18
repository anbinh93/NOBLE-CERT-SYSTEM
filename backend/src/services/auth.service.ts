// src/services/auth.service.ts
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.config";
import { AppError } from "../utils/AppError";
import { env } from "../config/env.config";
import { EmailService } from "./email.service";

export class AuthService {
  private static signToken(id: string, secret: string, expiresIn: string) {
    return jwt.sign({ id }, secret, { expiresIn: expiresIn as any });
  }

  /**
   * Register student — tạo user isEmailVerified=false, gửi email xác thực
   */
  static async register(data: any) {
    const { email, password, name } = data;

    if (!email || !password || !name) {
      throw new AppError(
        "Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên!",
        400,
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("Email này đã được sử dụng!", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "STUDENT",
        isActive: true,
        isEmailVerified: false,
        verifyToken,
        verifyTokenExpires,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    // Gửi email xác thực (non-blocking)
    EmailService.sendVerificationEmail(email, name, verifyToken).catch((err) =>
      console.error("[Auth] Failed to send verification email:", err.message),
    );

    return newUser;
  }

  /**
   * Verify email — xác thực email bằng token
   */
  static async verifyEmail(token: string) {
    if (!token) {
      throw new AppError("Token xác thực không hợp lệ!", 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new AppError("Token xác thực không hợp lệ hoặc đã hết hạn!", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verifyToken: null,
        verifyTokenExpires: null,
      },
    });

    return { message: "Xác thực email thành công! Bạn có thể đăng nhập." };
  }

  /**
   * Login — kiểm tra isEmailVerified
   */
  static async login(data: any) {
    const { email, password } = data;

    if (!email || !password) {
      throw new AppError("Vui lòng cung cấp email và mật khẩu!", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError("Email hoặc mật khẩu không chính xác!", 401);
    }

    if (!user.isActive) {
      throw new AppError("Tài khoản của bạn đã bị khóa!", 403);
    }

    if (!user.isEmailVerified) {
      throw new AppError(
        "Tài khoản chưa xác thực email! Vui lòng kiểm tra hộp thư.",
        403,
      );
    }

    const accessToken = this.signToken(
      user.id,
      env.JWT_SECRET,
      env.JWT_EXPIRES_IN,
    );
    const refreshToken = this.signToken(
      user.id,
      env.JWT_REFRESH_SECRET,
      env.JWT_REFRESH_EXPIRES_IN,
    );

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return { user: userData, accessToken, refreshToken };
  }

  /**
   * Google OAuth — auto-verify email (vì Google đã xác thực)
   */
  static async googleSync(data: {
    email: string;
    name: string;
    avatar?: string;
    googleId: string;
  }) {
    const { email, name, avatar, googleId } = data;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const placeholder = await bcrypt.hash(googleId, 12);
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: placeholder,
          role: "STUDENT",
          isActive: true,
          isEmailVerified: true,
        },
      });
    }

    const accessToken = this.signToken(
      user.id,
      env.JWT_SECRET,
      env.JWT_EXPIRES_IN,
    );
    const refreshToken = this.signToken(
      user.id,
      env.JWT_REFRESH_SECRET,
      env.JWT_REFRESH_EXPIRES_IN,
    );

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return { user: userData, accessToken, refreshToken };
  }

  static async refresh(token: string) {
    try {
      const decoded: any = jwt.verify(token, env.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user || !user.isActive) {
        throw new AppError("Người dùng không tồn tại hoặc đã bị khóa.", 401);
      }

      const accessToken = this.signToken(
        user.id,
        env.JWT_SECRET,
        env.JWT_EXPIRES_IN,
      );
      return { accessToken };
    } catch (error) {
      throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn!", 401);
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Không tìm thấy tài khoản!", 404);
    }
    if (user.isEmailVerified) {
      throw new AppError("Email đã được xác thực!", 400);
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExpires },
    });

    await EmailService.sendVerificationEmail(email, user.name, verifyToken);
    return { message: "Đã gửi lại email xác thực!" };
  }

  /**
   * Change password — đổi mật khẩu (cần nhập mật khẩu cũ)
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!currentPassword || !newPassword) {
      throw new AppError(
        "Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới!",
        400,
      );
    }

    if (newPassword.length < 6) {
      throw new AppError("Mật khẩu mới phải có ít nhất 6 ký tự!", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("Không tìm thấy tài khoản!", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError("Mật khẩu hiện tại không chính xác!", 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Đổi mật khẩu thành công!" };
  }
}
