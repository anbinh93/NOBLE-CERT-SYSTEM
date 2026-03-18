import { Request, Response } from "express";
import { prisma } from "../config/database.config";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/response";

// ─── Dashboard Stats ─────────────────────────────────────────────────
export const getStats = catchAsync(async (_req: Request, res: Response) => {
  const [totalUsers, totalCourses, totalOrders, revenueAgg] = await Promise.all(
    [
      prisma.user.count(),
      prisma.course.count(),
      prisma.order.count({ where: { status: "SUCCESS" } }),
      prisma.order.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
    ],
  );

  sendSuccess(res, 200, {
    totalUsers,
    totalCourses,
    totalOrders,
    totalRevenue: revenueAgg._sum.amount || 0,
  });
});

// ─── Recent Orders (Dashboard widget) ────────────────────────────────
export const getRecentOrders = catchAsync(
  async (_req: Request, res: Response) => {
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });

    sendSuccess(res, 200, { orders });
  },
);

// ─── Users List ──────────────────────────────────────────────────────
export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const search = (req.query.search as string) || "";
  const role = (req.query.role as string) || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) {
    where.role = role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { enrollments: true, courses: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  sendSuccess(res, 200, {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// ─── Courses List ────────────────────────────────────────────────────
export const getCourses = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const search = (req.query.search as string) || "";
  const status = (req.query.status as string) || "";

  const where: any = {};
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }
  if (status) {
    where.status = status;
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        instructor: { select: { name: true, email: true } },
        _count: { select: { enrollments: true, orders: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  sendSuccess(res, 200, {
    courses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// ─── Orders / Transactions List ──────────────────────────────────────
export const getOrders = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const status = (req.query.status as string) || "";

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  sendSuccess(res, 200, {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});
