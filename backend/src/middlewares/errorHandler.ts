import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { env } from '../config/env.config';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Lỗi Prisma (MongoDB) thông dụng
  if (err.name === 'PrismaClientValidationError') {
    error = new AppError('Dữ liệu đầu vào không hợp lệ', 400);
  }

  // Lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token không hợp lệ. Vui lòng đăng nhập lại.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Phiên đăng nhập đã hết hạn.', 401);
  }

  const statusCode = error.statusCode || 500;
  const status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

  res.status(statusCode).json({
    status: status,
    message: error.isOperational ? error.message : 'Đã có lỗi xảy ra trên Server!',
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
