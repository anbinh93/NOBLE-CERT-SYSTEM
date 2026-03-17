// src/controllers/admin.payment.controller.ts
import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AdminPaymentService } from '../services/admin.payment.service';
import { OrderStatus } from '@prisma/client';
import { parsePagination } from '../utils/pagination';

/**
 * GET /api/v1/admin/payments/orders
 * Query params: page, pageSize, status, from, to, q (orderCode/email/userId)
 */
export const listOrders = catchAsync(async (req: Request, res: Response) => {
  const { page, pageSize, q } = parsePagination(req, { maxPageSize: 100 });
  const status = req.query.status as OrderStatus | undefined;
  const from = req.query.from ? new Date(req.query.from as string) : undefined;
  const to = req.query.to ? new Date(req.query.to as string) : undefined;

  const result = await AdminPaymentService.listOrders({
    page,
    pageSize,
    q,
    status,
    from,
    to,
  });

  sendSuccess(res, 200, result);
});

/**
 * GET /api/v1/admin/payments/orders/:orderCode
 */
export const getOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await AdminPaymentService.getOrder(Number(req.params.orderCode));
  sendSuccess(res, 200, order);
});

/**
 * POST /api/v1/admin/payments/orders/:orderCode/sync
 * Đồng bộ trạng thái PayOS — admin không cần ownership check.
 */
export const syncOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await AdminPaymentService.syncOrder(Number(req.params.orderCode));
  sendSuccess(res, 200, order, 'Đồng bộ trạng thái thành công');
});
