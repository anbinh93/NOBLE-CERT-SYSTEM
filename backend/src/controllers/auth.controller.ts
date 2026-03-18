// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/response";
import { env } from "../config/env.config";

const cookieOptions = {
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await AuthService.register(req.body);
  sendSuccess(
    res,
    201,
    { user },
    "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
  );
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await AuthService.login(req.body);
  res.cookie("jwt_refresh", refreshToken, cookieOptions);
  sendSuccess(res, 200, { user, accessToken }, "Đăng nhập thành công!");
});

export const googleSync = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await AuthService.googleSync(
    req.body,
  );
  res.cookie("jwt_refresh", refreshToken, cookieOptions);
  sendSuccess(res, 200, { user, accessToken }, "Đăng nhập Google thành công!");
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.jwt_refresh;
  if (!refreshToken) {
    return res.status(401).json({
      status: "fail",
      message: "Bạn chưa đăng nhập. Vui lòng đăng nhập lại!",
    });
  }
  const { accessToken } = await AuthService.refresh(refreshToken);
  sendSuccess(res, 200, { accessToken }, "Refresh token thành công!");
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  const result = await AuthService.verifyEmail(token);
  sendSuccess(res, 200, result);
});

export const resendVerification = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await AuthService.resendVerification(email);
    sendSuccess(res, 200, result);
  },
);

export const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(
      req.user.id,
      currentPassword,
      newPassword,
    );
    sendSuccess(res, 200, result, "Đổi mật khẩu thành công!");
  },
);
