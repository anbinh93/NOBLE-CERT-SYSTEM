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

// ─── Create Course (Draft) ───────────────────────────────────────────
export const createCourse = catchAsync(async (req: Request, res: Response) => {
  const { title, description, price, instructorId } = req.body;

  if (!title || !title.trim()) {
    return res
      .status(400)
      .json({ status: "fail", message: "Tiêu đề khóa học là bắt buộc!" });
  }

  const course = await prisma.course.create({
    data: {
      title: title.trim(),
      description: description || "",
      price: Number(price) || 0,
      instructorId: instructorId || req.user.id,
      status: "DRAFT",
      units: [],
      settings: { passing_score: 80, is_sequential: true } as any,
    },
    include: { instructor: { select: { name: true, email: true } } },
  });

  sendSuccess(res, 201, { course }, "Tạo khóa học thành công!");
});

// ─── Get Single Course ───────────────────────────────────────────────
export const getCourseById = catchAsync(async (req: Request, res: Response) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      _count: { select: { enrollments: true, orders: true } },
    },
  });

  if (!course) {
    return res
      .status(404)
      .json({ status: "fail", message: "Không tìm thấy khóa học" });
  }

  sendSuccess(res, 200, { course });
});

// ─── Update Course ───────────────────────────────────────────────────
export const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const { title, description, price, instructorId, settings, units } = req.body;

  const existing = await prisma.course.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res
      .status(404)
      .json({ status: "fail", message: "Không tìm thấy khóa học" });
  }

  const data: any = {};
  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = Number(price);
  if (instructorId !== undefined) data.instructorId = instructorId;
  if (settings !== undefined) data.settings = settings;
  if (units !== undefined) data.units = units;

  const course = await prisma.course.update({
    where: { id: req.params.id },
    data,
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      _count: { select: { enrollments: true, orders: true } },
    },
  });

  sendSuccess(res, 200, { course }, "Cập nhật khóa học thành công!");
});

// ─── Delete Course ───────────────────────────────────────────────────
export const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  const existing = await prisma.course.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res
      .status(404)
      .json({ status: "fail", message: "Không tìm thấy khóa học" });
  }

  await prisma.course.delete({ where: { id: req.params.id } });
  sendSuccess(res, 200, null, "Đã xoá khóa học!");
});

// ─── Publish Course ──────────────────────────────────────────────────
export const publishCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await prisma.course.update({
    where: { id: req.params.id },
    data: { status: "PUBLISHED" },
    include: { instructor: { select: { name: true, email: true } } },
  });

  sendSuccess(res, 200, { course }, "Xuất bản khóa học thành công!");
});

// ─── Archive Course ──────────────────────────────────────────────────
export const archiveCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await prisma.course.update({
    where: { id: req.params.id },
    data: { status: "ARCHIVED" },
    include: { instructor: { select: { name: true, email: true } } },
  });

  sendSuccess(res, 200, { course }, "Đã lưu trữ khóa học!");
});

// ─── Get Instructors (for dropdown) ──────────────────────────────────
export const getInstructors = catchAsync(
  async (_req: Request, res: Response) => {
    const instructors = await prisma.user.findMany({
      where: { role: "INSTRUCTOR" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    sendSuccess(res, 200, { instructors });
  },
);

// ─── Get My Profile ──────────────────────────────────────────────────
export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  sendSuccess(res, 200, { user });
});

// ─── Update My Profile ──────────────────────────────────────────────
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;

  const data: any = {};
  if (name !== undefined) data.name = name.trim();

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  sendSuccess(res, 200, { user }, "Cập nhật hồ sơ thành công!");
});
