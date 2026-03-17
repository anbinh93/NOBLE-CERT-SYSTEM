// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { Role } from '@prisma/client';
import { env } from '../config/env.config';

// Mở rộng interface Request của Express để chứa thông tin user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// 1. Middleware xác thực JWT
export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập! Vui lòng đăng nhập để truy cập.', 401));
  }

  // Xác minh token
  const decoded: any = jwt.verify(token, env.JWT_SECRET);

  // Kiểm tra user có còn tồn tại không
  const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!currentUser) {
    return next(new AppError('Tài khoản thuộc về token này không còn tồn tại.', 401));
  }

  // Gắn thông tin user vào request để các controller/middleware sau sử dụng
  req.user = currentUser;
  next();
});

// 2. Middleware phân quyền (RBAC)
export const restrictTo = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user được gán từ middleware protect phía trước
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này (403 Forbidden)!', 403));
    }
    next();
  };
};
