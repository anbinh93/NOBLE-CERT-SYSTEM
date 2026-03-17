// src/services/admin.payment.service.ts
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { PaymentService } from './payment.service';
import { OrderStatus } from '@prisma/client';

export class AdminPaymentService {
  static async listOrders(options: { page: number; pageSize: number; q: string; status?: OrderStatus; from?: Date; to?: Date }) {
    const { page, pageSize, q, status, from, to } = options;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }
    if (q) {
      const numericQ = Number(q);
      where.OR = [
        ...(isNaN(numericQ) ? [] : [{ orderCode: numericQ }]),
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { memo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          userId: true,
          courseId: true,
          orderCode: true,
          amount: true,
          status: true,
          memo: true,
          paymentLink: true,
          expiredAt: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    // Prisma Mongo can return null for missing relations, but schema marks course required.
    // To avoid runtime crash, resolve courses via separate lookup and allow course nullable in response.
    const uniqueCourseIds = Array.from(new Set(orders.map((o) => o.courseId)));
    const courses = await prisma.course.findMany({
      where: { id: { in: uniqueCourseIds } },
      select: { id: true, title: true },
    });
    const courseById = new Map(courses.map((c) => [c.id, c]));
    const items = orders.map((o) => ({
      ...o,
      course: courseById.get(o.courseId) ?? null,
    }));

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getOrder(orderCode: number) {
    if (isNaN(orderCode)) throw new AppError('orderCode không hợp lệ', 400);

    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: {
        id: true,
        userId: true,
        courseId: true,
        orderCode: true,
        amount: true,
        status: true,
        memo: true,
        paymentLink: true,
        expiredAt: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    const course = await prisma.course.findUnique({
      where: { id: order.courseId },
      select: { id: true, title: true, status: true },
    });

    return {
      ...order,
      course: course ?? null,
    };
  }

  static async syncOrder(orderCode: number) {
    if (isNaN(orderCode)) throw new AppError('orderCode không hợp lệ', 400);

    await PaymentService.syncPaymentStatus(orderCode);

    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: { status: true, orderCode: true, updatedAt: true },
    });

    return order;
  }
}
