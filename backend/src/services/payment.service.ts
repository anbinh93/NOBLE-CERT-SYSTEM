import { Prisma, OrderStatus } from "@prisma/client";
import PayOS from "@payos/node";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/database.config";
import { env } from "../config/env.config";
import { generateCertificatePDF } from "./certificate.service";
import { EmailService } from "./email.service";

const payos = new PayOS(
  env.PAYOS_CLIENT_ID,
  env.PAYOS_API_KEY,
  env.PAYOS_CHECKSUM_KEY,
);

/** Thời gian hết hạn link thanh toán (15 phút) */
const PAYMENT_LINK_TTL_MS = 15 * 60 * 1000;

interface CreatePaymentLinkResult {
  checkoutUrl: string | null;
  message: string;
  orderId?: string;
  qrCode?: string;
  orderCode?: number;
  amount?: number;
}

interface WebhookResult {
  success: boolean;
}

/** Sinh mã orderCode duy nhất cho PayOS (6 chữ số timestamp + 3 random) */
function generateOrderCode(): number {
  const timePart = String(Date.now()).slice(-6);
  const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return Number(timePart + randomPart);
}

export class PaymentService {
  /**
   * Khởi tạo đơn hàng + tạo PayOS payment link.
   * Xử lý auto-enroll nếu khoá học miễn phí.
   */
  static async createPaymentLink(
    userId: string,
    courseId: string,
  ): Promise<CreatePaymentLinkResult> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new AppError("Không tìm thấy khóa học", 404);
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
  static async createCertificatePaymentLink(
    userId: string,
    courseId: string,
  ): Promise<CreatePaymentLinkResult> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new AppError("Không tìm thấy khóa học", 404);
    }

    // Kiểm tra: học viên phải hoàn thành khoá học (COMPLETED từ điểm danh hoặc bài thi)
    // và chưa có đơn chứng chỉ nào SUCCESS cho khoá này
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId, status: "COMPLETED" },
    });

    if (!enrollment) {
      throw new AppError(
        "Bạn chưa hoàn thành khoá học hoặc chưa đủ điều kiện nhận chứng chỉ.",
        400,
      );
    }

    // Kiểm tra xem đã từng thanh toán thành công chưa (tránh trả phí 2 lần)
    const existingSuccessOrder = await prisma.order.findFirst({
      where: { userId, courseId, status: OrderStatus.SUCCESS, memo: { startsWith: "CERT" } },
    });
    if (existingSuccessOrder) {
      throw new AppError(
        "Chứng chỉ của bạn đã được cấp. Hãy kiểm tra email hoặc trang chứng chỉ.",
        400,
      );
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
      orderCode,
      amount,
      message: "Tạo link thanh toán phí chứng chỉ thành công",
      orderId: order.id,
    };
  }

  /**
   * Xử lý webhook từ PayOS: verify signature → idempotent update → auto-enroll.
   */
  static async handleWebhook(
    webhookBody: Record<string, unknown>,
  ): Promise<WebhookResult> {
    const webhookData = this.verifyWebhookSignature(webhookBody);

    let certOrderId: string | null = null;

    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const order = await tx.order.findUnique({
          where: { orderCode: Number(webhookData.orderCode) },
        });
        if (!order || order.status !== OrderStatus.PENDING) return;

        if (order.amount !== webhookData.amount) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.MISMATCH },
          });
          return;
        }

        const isSuccess =
          webhookData.code === "00" || webhookBody.success === true;
        if (!isSuccess) return;

        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.SUCCESS },
        });

        if (order.memo.startsWith("CERT")) {
          // Enrollment đã COMPLETED từ điểm danh — chỉ cần ghi nhận cert issued
          certOrderId = order.id;
        } else {
          await tx.enrollment.create({
            data: {
              userId: order.userId,
              courseId: order.courseId,
              status: "ACTIVE",
            },
          });
        }
      });
    } catch {
      // Nếu transaction fail (non-replica-set MongoDB), dùng fallback
      await this.processPaymentFallback(Number(webhookData.orderCode));
    }

    // Sau transaction: generate PDF + gửi email (async, không block response)
    if (certOrderId) {
      this.issueCertificateAfterPayment(certOrderId).catch((e) =>
        console.error("[CertIssuance] Error after webhook:", e),
      );
    }

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

      if (paymentLinkData.status === "PAID") {
        let certOrderId: string | null = null;

        try {
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: order.id },
              data: { status: OrderStatus.SUCCESS },
            });

            if (order.memo.startsWith("CERT")) {
              certOrderId = order.id;
            } else {
              await tx.enrollment.create({
                data: {
                  userId: order.userId,
                  courseId: order.courseId,
                  status: "ACTIVE",
                },
              });
            }
          });
        } catch {
          await this.processPaymentFallback(orderCode);
        }

        if (certOrderId) {
          this.issueCertificateAfterPayment(certOrderId).catch((e) =>
            console.error("[CertIssuance] Error after sync:", e),
          );
        }
      } else if (paymentLinkData.status === "CANCELLED") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });
      }
    } catch (error) {
      console.warn(
        `[PayOS] Bỏ qua sync thủ công cho ${orderCode} (Có thể chưa thanh toán):`,
      );
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────

  private static async assertNotEnrolled(
    userId: string,
    courseId: string,
  ): Promise<void> {
    const existing = await prisma.enrollment.findFirst({
      where: { userId, courseId, status: "ACTIVE" },
    });
    if (existing) {
      throw new AppError("Bạn đã sở hữu khóa học này rồi", 400);
    }
  }

  private static async handleFreeEnrollment(
    userId: string,
    courseId: string,
  ): Promise<CreatePaymentLinkResult> {
    await prisma.enrollment.create({
      data: { userId, courseId, status: "ACTIVE" },
    });
    return {
      checkoutUrl: null,
      message: "Đăng ký thành công khóa học miễn phí",
    };
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
      message: "Tạo link thanh toán thành công",
      orderId: order.id,
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
      console.error("[PayOS] createPaymentLink failed:", error);
      throw new AppError("Lỗi kết nối đến cổng thanh toán PayOS", 502);
    }
  }

  private static verifyWebhookSignature(body: Record<string, unknown>) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return payos.verifyPaymentWebhookData(body as any);
    } catch {
      throw new AppError(
        "Chữ ký webhook không hợp lệ (Invalid Signature)",
        400,
      );
    }
  }

  /**
   * Fallback cho môi trường MongoDB không có replica set (không dùng transaction).
   */
  private static async processPaymentFallback(orderCode: number): Promise<void> {
    const order = await prisma.order.findUnique({ where: { orderCode } });
    if (!order || order.status === OrderStatus.SUCCESS) return;

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.SUCCESS },
    });

    if (!order.memo.startsWith("CERT")) {
      const existing = await prisma.enrollment.findFirst({
        where: { userId: order.userId, courseId: order.courseId },
      });
      if (!existing) {
        await prisma.enrollment.create({
          data: { userId: order.userId, courseId: order.courseId, status: "ACTIVE" },
        });
      }
    }
  }

  /**
   * Sau khi thanh toán cert thành công:
   * 1. Generate PDF chứng chỉ
   * 2. Gửi email cho học viên (kèm PDF)
   * 3. Gửi thông báo cho Admin/Support
   */
  private static async issueCertificateAfterPayment(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: {
          select: {
            id: true,
            title: true,
            instructor: { select: { name: true } },
          },
        },
      },
    });

    if (!order) return;

    // Tìm enrollment đã COMPLETED
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: order.userId, courseId: order.courseId, status: "COMPLETED" },
    });

    if (!enrollment) {
      console.warn(`[CertIssuance] No COMPLETED enrollment found for order ${orderId}`);
      return;
    }

    const serialNumber = `NC-${enrollment.id.slice(-8).toUpperCase()}`;
    const course = order.course as any;
    const studentName = order.user.name ?? "Học viên";
    const courseName = course?.title ?? "Khoá học";
    const instructorName = course?.instructor?.name ?? "Noble Cert";
    const issuedDate = new Date(enrollment.updatedAt ?? Date.now()).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateCertificatePDF({
        studentName,
        courseName,
        instructorName,
        issuedDate,
        serialNumber,
      });
    } catch (e) {
      console.error("[CertIssuance] PDF generation failed:", e);
      return;
    }

    // Gửi email cho học viên
    await EmailService.sendCertificateToStudent(
      order.user.email,
      studentName,
      courseName,
      serialNumber,
      pdfBuffer,
    ).catch((e) => console.error("[CertIssuance] Student email failed:", e));

    // Lấy danh sách email admin + support để thông báo
    const adminUsers = await prisma.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "STAFF"] }, isActive: true },
      select: { email: true },
    });
    const adminEmails = adminUsers.map((u) => u.email);

    await EmailService.sendCertificateIssuedNotification(
      adminEmails,
      studentName,
      order.user.email,
      courseName,
      serialNumber,
    ).catch((e) => console.error("[CertIssuance] Admin notification failed:", e));

    console.log(`[CertIssuance] ✅ Certificate issued: ${serialNumber} → ${order.user.email}`);
  }
}
