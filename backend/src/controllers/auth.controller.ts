// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env.config';

// Cấu hình cookie cho Refresh Token
const cookieOptions = {
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
  httpOnly: true, // Ngăn chặn XSS
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await AuthService.register(req.body);
  sendSuccess(res, 201, { user }, 'Đăng ký tài khoản thành công!');
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await AuthService.login(req.body);

  // Lưu refresh token vào HttpOnly Cookie
  res.cookie('jwt_refresh', refreshToken, cookieOptions);

  sendSuccess(res, 200, { user, accessToken }, 'Đăng nhập thành công!');
});

export const googleSync = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await AuthService.googleSync(req.body);
  res.cookie('jwt_refresh', refreshToken, cookieOptions);
  sendSuccess(res, 200, { user, accessToken }, 'Đăng nhập Google thành công!');
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  // Lấy refresh token từ cookie
  const refreshToken = req.cookies.jwt_refresh;

  if (!refreshToken) {
    return res.status(401).json({ status: 'fail', message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại!' });
  }

  const { accessToken } = await AuthService.refresh(refreshToken);
  sendSuccess(res, 200, { accessToken }, 'Refresh token thành công!');
});
