// src/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { env } from '../config/env.config';

export class AuthService {
  // Hàm phụ trợ sinh token
  private static signToken(id: string, secret: string, expiresIn: string) {
    return jwt.sign({ id }, secret, { expiresIn: expiresIn as any });
  }

  static async register(data: any) {
    const { email, password, name } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email này đã được sử dụng!', 400);
    }

    // Mã hóa mật khẩu với Salt rounds: 12 theo đúng đặc tả
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: { id: true, email: true, name: true, role: true, isActive: true } // Không trả về password
    });

    return newUser;
  }

  static async login(data: any) {
    const { email, password } = data;

    if (!email || !password) {
      throw new AppError('Vui lòng cung cấp email và mật khẩu!', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Email hoặc mật khẩu không chính xác!', 401);
    }

    if (!user.isActive) {
      throw new AppError('Tài khoản của bạn đã bị khóa!', 403);
    }

    // Cấp phát cặp AccessToken và RefreshToken
    const accessToken = this.signToken(user.id, env.JWT_SECRET, env.JWT_EXPIRES_IN);
    const refreshToken = this.signToken(user.id, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

    const userData = { id: user.id, email: user.email, name: user.name, role: user.role };

    return { user: userData, accessToken, refreshToken };
  }

  static async googleSync(data: { email: string; name: string; avatar?: string; googleId: string }) {
    const { email, name, avatar, googleId } = data;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const placeholder = await bcrypt.hash(googleId, 12);
      user = await prisma.user.create({
        data: { email, name, password: placeholder, role: 'STUDENT', isActive: true },
      });
    }

    const accessToken = this.signToken(user.id, env.JWT_SECRET, env.JWT_EXPIRES_IN);
    const refreshToken = this.signToken(user.id, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

    const userData = { id: user.id, email: user.email, name: user.name, role: user.role };
    return { user: userData, accessToken, refreshToken };
  }

  static async refresh(token: string) {
    try {
      const decoded: any = jwt.verify(token, env.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user || !user.isActive) {
        throw new AppError('Người dùng không tồn tại hoặc đã bị khóa.', 401);
      }

      // Chỉ cấp lại AccessToken mới (có thể cấp lại cả 2 tùy chiến lược)
      const accessToken = this.signToken(user.id, env.JWT_SECRET, env.JWT_EXPIRES_IN);
      return { accessToken };
    } catch (error) {
      throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn!', 401);
    }
  }
}
