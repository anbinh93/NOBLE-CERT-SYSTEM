import { Request, Response } from 'express';
import { z } from 'zod/v4';
import { PaymentService } from '../services/payment.service';
import { AppError } from '../utils/AppError';
import { prisma } from '../config/database.config';

const CreateLinkSchema = z.object({
  courseId: z.string().min(1, 'courseId là bắt buộc'),
});

/** Authenticated user from protect middleware */
interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; name: string; role: string };
}

export class PaymentController {
  /**
   * POST /api/v1/payment/create-link
   * Body: { courseId: string }
   */
  static async createLink(req: Request, res: Response): Promise<void> {
    const parsed = CreateLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const { courseId } = parsed.data;
    const userId = (req as AuthenticatedRequest).user.id;

    const result = await PaymentService.createPaymentLink(userId, courseId);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }

  /**
   * POST /api/v1/payment/certificate
   * Body: { courseId: string }
   */
  static async createCertificateLink(req: Request, res: Response): Promise<void> {
    const parsed = CreateLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const { courseId } = parsed.data;
    const userId = (req as AuthenticatedRequest).user.id;

    const result = await PaymentService.createCertificatePaymentLink(userId, courseId);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /api/v1/payment/status/:orderCode
   * Kiểm tra trạng thái đơn hàng (frontend polling sau khi quét QR).
   */
  static async checkStatus(req: Request, res: Response): Promise<void> {
    const orderCode = Number(req.params.orderCode);
    if (isNaN(orderCode)) {
      throw new AppError('orderCode không hợp lệ', 400);
    }

    // Active Sync from PayOS — bỏ qua nếu PayOS API không khả dụng (localhost / network issue)
    try {
      await PaymentService.syncPaymentStatus(orderCode);
    } catch (syncError) {
      const msg = syncError instanceof Error ? syncError.message : String(syncError);
      console.warn(`[checkStatus] PayOS sync failed for orderCode=${orderCode}: ${msg}`);
    }

    const order = await prisma.order.findUnique({ where: { orderCode } });
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng', 404);
    }

    const userId = (req as AuthenticatedRequest).user.id;
    if (order.userId !== userId) {
      throw new AppError('Không có quyền truy cập đơn hàng này', 403);
    }

    const isPaid = order.status === 'SUCCESS';
    const certificateSerial = isPaid
      ? await prisma.enrollment
          .findFirst({ where: { userId, courseId: order.courseId, status: 'COMPLETED' } })
          .then((e) => (e ? `NC-${e.id.slice(-8).toUpperCase()}` : null))
      : null;

    res.status(200).json({
      status: 'success',
      data: {
        orderCode: order.orderCode,
        amount: order.amount,
        orderStatus: order.status,
        isPaid,
        certificate: isPaid ? { serial: certificateSerial } : null,
        message: isPaid ? 'Thanh toán thành công' : 'Chờ thanh toán',
      },
    });
  }

  /**
   * POST /api/v1/payment/webhook
   * PayOS yêu cầu luôn trả 200 JSON để tránh retry loop.
   */
  static async webhook(req: Request, res: Response): Promise<void> {
    try {
      await PaymentService.handleWebhook(req.body as Record<string, unknown>);
      res.json({ error: 0, message: 'Ok', data: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Webhook] Error:', message);
      res.json({ error: -1, message, data: null });
    }
  }
}
