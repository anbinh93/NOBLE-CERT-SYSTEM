import { Prisma, OrderStatus } from '@prisma/client';
import PayOS from '@payos/node';
import { AppError } from '../utils/AppError';
import { prisma } from '../config/database.config';
import { env } from '../config/env.config';

const payos = new PayOS(env.PAYOS_CLIENT_ID, env.PAYOS_API_KEY, env.PAYOS_CHECKSUM_KEY);

/** Thời gian hết hạn link thanh toán (15 phút) */
const PAYMENT_LINK_TTL_MS = 15 * 60 * 1000;

interface CreatePaymentLinkResult {
  checkoutUrl: string | null;
  message: string;
  orderId?: string;
  orderCode?: number;
  qrCode?: string;
  amount?: number;
}

interface WebhookResult {
  success: boolean;
}

/** Sinh mã orderCode duy nhất cho PayOS (6 chữ số timestamp + 3 random) */
function generateOrderCode(): number {
  const timePart = String(Date.now()).slice(-6);
  const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return Number(timePart + randomPart);
}

export class PaymentService {
  /**
   * Khởi tạo đơn hàng + tạo PayOS payment link.
   * Xử lý auto-enroll nếu khoá học miễn phí.
   */
  static async createPaymentLink(userId: string, courseId: string): Promise<CreatePaymentLinkResult> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    await this.assertNotEnrolled(userId, courseId);

    if (course.price === 0) {
      return this.handleFreeEnrollment(userId, courseId);
    }

    return this.handlePaidOrder(userId, courseId, course.price, course.title);
  }

  /**
   * Khởi tạo đơn hàng thanh toán phí cấp chứng chỉ.
   */
  static async createCertificatePaymentLink(userId: string, courseId: string): Promise<CreatePaymentLinkResult> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId, status: 'PENDING_PAYMENT' }
    });

    if (!enrollment) {
      throw new AppError('Bạn chưa đủ điều kiện nhận chứng chỉ hoặc đã nhận rồi.', 400);
    }

    const orderCode = generateOrderCode();
    const memo = `CERT${orderCode}`;
    const expiredAt = new Date(Date.now() + PAYMENT_LINK_TTL_MS);
    const amount = 2000; // Mock fixed fee

    const order = await prisma.order.create({
      data: {
        userId,
        courseId,
        orderCode,
        amount,
        status: OrderStatus.PENDING,
        memo,
        expiredAt,
      },
    });

    const description = `Phi CC ${course.title}`.substring(0, 25);

    const paymentLinkResponse = await this.callPayOS({
      orderCode,
      amount,
      description,
      returnUrl: `${env.CLIENT_URL}/student/certificates/claim/${courseId}?status=success&orderId=${order.id}`,
      cancelUrl: `${env.CLIENT_URL}/student/certificates/claim/${courseId}?status=cancelled&orderId=${order.id}`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentLink: paymentLinkResponse.checkoutUrl },
    });

    return {
      checkoutUrl: paymentLinkResponse.checkoutUrl,
      qrCode: paymentLinkResponse.qrCode,
      message: 'Tạo link thanh toán phí chứng chỉ thành công',
      orderId: order.id,
      orderCode,
      amount,
    };
  }

  /**
   * Xử lý webhook từ PayOS: verify signature → idempotent update → auto-enroll.
   */
  static async handleWebhook(webhookBody: Record<string, unknown>): Promise<WebhookResult> {
    const webhookData = this.verifyWebhookSignature(webhookBody);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.findUnique({ where: { orderCode: Number(webhookData.orderCode) } });
      if (!order || order.status !== OrderStatus.PENDING) return;

      if (order.amount !== webhookData.amount) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.MISMATCH },
        });
        return;
      }

      const isSuccess = webhookData.code === '00' || (webhookBody.success === true);
      if (!isSuccess) return;

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.SUCCESS },
      });

      if (order.memo.startsWith('CERT')) {
        await tx.enrollment.updateMany({
          where: { userId: order.userId, courseId: order.courseId, status: 'PENDING_PAYMENT' },
          data: { status: 'COMPLETED' },
        });
      } else {
        await tx.enrollment.create({
          data: { userId: order.userId, courseId: order.courseId, status: 'ACTIVE' },
        });
      }
    });

    return { success: true };
  }

  /**
   * Đồng bộ hoá trạng thái thanh toán từ PayOS cho môi trường Localhost hoặc Polling
   */
  static async syncPaymentStatus(orderCode: number): Promise<void> {
    try {
      const order = await prisma.order.findUnique({ where: { orderCode } });
      if (!order || order.status !== OrderStatus.PENDING) return;

      const paymentLinkData = await payos.getPaymentLinkInformation(orderCode);
      if (!paymentLinkData) return;

      if (paymentLinkData.status === 'PAID') {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.SUCCESS },
          });

          if (order.memo.startsWith('CERT')) {
            await tx.enrollment.updateMany({
              where: { userId: order.userId, courseId: order.courseId, status: 'PENDING_PAYMENT' },
              data: { status: 'COMPLETED' },
            });
          } else {
            await tx.enrollment.create({
              data: { userId: order.userId, courseId: order.courseId, status: 'ACTIVE' },
            });
          }
        });
      } else if (paymentLinkData.status === 'CANCELLED') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[PayOS] syncPaymentStatus thất bại cho orderCode=${orderCode}: ${message}`);
      // Re-throw để checkStatus controller biết sync lỗi, không trả isPaid=false nhầm
      throw error;
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────

  private static async assertNotEnrolled(userId: string, courseId: string): Promise<void> {
    const existing = await prisma.enrollment.findFirst({
      where: { userId, courseId, status: 'ACTIVE' },
    });
    if (existing) {
      throw new AppError('Bạn đã sở hữu khóa học này rồi', 400);
    }
  }

  private static async handleFreeEnrollment(
    userId: string,
    courseId: string,
  ): Promise<CreatePaymentLinkResult> {
    await prisma.enrollment.create({
      data: { userId, courseId, status: 'ACTIVE' },
    });
    return { checkoutUrl: null, message: 'Đăng ký thành công khóa học miễn phí' };
  }

  private static async handlePaidOrder(
    userId: string,
    courseId: string,
    amount: number,
    courseTitle: string,
  ): Promise<CreatePaymentLinkResult> {
    const orderCode = generateOrderCode();
    const memo = `NC${orderCode}`;
    const expiredAt = new Date(Date.now() + PAYMENT_LINK_TTL_MS);

    const order = await prisma.order.create({
      data: {
        userId,
        courseId,
        orderCode,
        amount,
        status: OrderStatus.PENDING,
        memo,
        expiredAt,
      },
    });

    const description = `NC ${courseTitle}`.substring(0, 25);

    const paymentLinkResponse = await this.callPayOS({
      orderCode,
      amount,
      description,
      returnUrl: `${env.CLIENT_URL}/student/billing?status=success&orderId=${order.id}`,
      cancelUrl: `${env.CLIENT_URL}/student/billing?status=cancelled&orderId=${order.id}`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentLink: paymentLinkResponse.checkoutUrl },
    });

    return {
      checkoutUrl: paymentLinkResponse.checkoutUrl,
      qrCode: paymentLinkResponse.qrCode,
      message: 'Tạo link thanh toán thành công',
      orderId: order.id,
      orderCode,
      amount,
    };
  }

  private static async callPayOS(body: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }) {
    try {
      return await payos.createPaymentLink(body);
    } catch (error) {
      console.error('[PayOS] createPaymentLink failed:', error);
      throw new AppError('Lỗi kết nối đến cổng thanh toán PayOS', 502);
    }
  }

  private static verifyWebhookSignature(body: Record<string, unknown>) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return payos.verifyPaymentWebhookData(body as any);
    } catch {
      throw new AppError('Chữ ký webhook không hợp lệ (Invalid Signature)', 400);
    }
  }
}
