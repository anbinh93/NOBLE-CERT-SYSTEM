import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../config/database.config";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/response";
import { EmailService } from "../services/email.service";
import { AuthService } from "../services/auth.service";

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
        isEmailVerified: true,
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

// ─── Get User By Id ──────────────────────────────────────────────────
export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { enrollments: true, courses: true, orders: true } },
    },
  });

  if (!user) {
    return res
      .status(404)
      .json({ status: "fail", message: "Không tìm thấy người dùng" });
  }

  // Role-specific stats
  let stats: any = {};

  if (user.role === "STUDENT") {
    const [totalPaid, enrollments] = await Promise.all([
      prisma.order.aggregate({
        where: { userId: user.id, status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.enrollment.count({
        where: { userId: user.id },
      }),
    ]);
    stats = {
      coursesEnrolled: enrollments,
      totalPaid: totalPaid._sum.amount || 0,
      ordersCount: user._count.orders,
    };
  }

  if (user.role === "INSTRUCTOR") {
    const courses = await prisma.course.findMany({
      where: { instructorId: user.id },
      select: { id: true, title: true, status: true },
      orderBy: { createdAt: "desc" },
    });
    stats = {
      coursesAssigned: courses.length,
      courses,
    };
  }

  sendSuccess(res, 200, { user, stats });
});

// ─── Update User ─────────────────────────────────────────────────────
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { name, isActive } = req.body;

  const existing = await prisma.user.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res
      .status(404)
      .json({ status: "fail", message: "Không tìm thấy người dùng" });
  }

  const data: any = {};
  if (name !== undefined) data.name = name.trim();
  if (isActive !== undefined) data.isActive = Boolean(isActive);

  const user = await prisma.user.update({
    where: { id: req.params.id },
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

  sendSuccess(res, 200, { user }, "Cập nhật người dùng thành công!");
});

// ─── Delete User ─────────────────────────────────────────────────────
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    return res
      .status(404)
      .json({ status: "fail", message: "Không tìm thấy người dùng" });
  }
  if (user.role === "SUPER_ADMIN") {
    return res.status(403).json({
      status: "fail",
      message: "Không thể xoá tài khoản Super Admin!",
    });
  }

  await prisma.user.delete({ where: { id: req.params.id } });
  sendSuccess(res, 200, null, "Đã xoá người dùng!");
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

  // Instructors can only see their own courses
  if (req.user.role === "INSTRUCTOR") {
    where.instructorId = req.user.id;
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

// ─── Get Certificates (Admin) ────────────────────────────────────────
export const getCertificates = catchAsync(
  async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const search = (req.query.search as string) || "";

    // Certificates = enrollments with status COMPLETED + passed exam
    const whereClause: any = { status: "COMPLETED" };

    // Search by student name/email or course title
    if (search) {
      whereClause.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { course: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: {
            select: {
              id: true,
              title: true,
              instructor: { select: { name: true } },
            },
          },
          attempts: { orderBy: { score: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count({ where: whereClause }),
    ]);

    // Filter only those with passed exam & map to certificate shape
    const certificates = enrollments
      .filter((e) => e.attempts[0]?.isPassed)
      .map((e) => ({
        id: e.id,
        serialNumber: `NC-${e.id.slice(-8).toUpperCase()}`,
        student: e.user,
        course: {
          id: e.course.id,
          title: e.course.title,
          instructor: (e.course as any).instructor?.name ?? "N/A",
        },
        examScore: e.attempts[0]?.score ?? 0,
        issuedDate: e.updatedAt,
        status: "ACTIVE",
      }));

    sendSuccess(res, 200, {
      certificates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  },
);

// ─── Revoke Certificate (set enrollment back to ACTIVE) ──────────────
export const revokeCertificate = catchAsync(
  async (req: Request, res: Response) => {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
    });

    if (!enrollment) {
      return res
        .status(404)
        .json({ status: "fail", message: "Không tìm thấy chứng chỉ" });
    }

    await prisma.enrollment.update({
      where: { id: req.params.id },
      data: { status: "ACTIVE" },
    });

    sendSuccess(res, 200, null, "Đã thu hồi chứng chỉ!");
  },
);

// ─── Create Instructor ───────────────────────────────────────────────

export const createInstructor = catchAsync(
  async (req: Request, res: Response) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ status: "fail", message: "Vui lòng nhập tên và email!" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ status: "fail", message: "Email đã tồn tại trong hệ thống!" });
    }

    const tempPassword = crypto.randomBytes(4).toString("hex"); // 8 chars
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "INSTRUCTOR",
        isActive: true,
        isEmailVerified: false,
        verifyToken,
        verifyTokenExpires,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // Gửi email mời (non-blocking)
    EmailService.sendInstructorInviteEmail(
      email,
      name,
      verifyToken,
      tempPassword,
    ).catch((err) =>
      console.error("[Admin] Failed to send instructor invite:", err.message),
    );

    sendSuccess(
      res,
      201,
      { user, tempPassword },
      "Đã tạo người hướng dẫn và gửi email mời!",
    );
  },
);

// ─── System Settings ─────────────────────────────────────────────────
export const getSystemSettings = catchAsync(
  async (_req: Request, res: Response) => {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });
    sendSuccess(res, 200, { settings: map });
  },
);

export const updateSystemSettings = catchAsync(
  async (req: Request, res: Response) => {
    const { settings } = req.body as { settings: Record<string, string> };

    if (!settings || typeof settings !== "object") {
      return res
        .status(400)
        .json({ status: "fail", message: "Dữ liệu không hợp lệ!" });
    }

    // Upsert each key
    const ops = Object.entries(settings).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      }),
    );
    await Promise.all(ops);

    sendSuccess(res, 200, null, "Đã lưu cài đặt hệ thống!");
  },
);

// ─── Send Test Email ─────────────────────────────────────────────────
export const sendTestEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ status: "fail", message: "Vui lòng nhập email nhận test!" });
  }

  await EmailService.sendTestEmail(email);
  sendSuccess(res, 200, null, "Đã gửi email test thành công!");
});

// ─── Blog Posts CRUD ──────────────────────────────────────────────────
export const getPosts = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const search = (req.query.search as string) || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: { name: true } } },
    }),
    prisma.post.count({ where }),
  ]);

  sendSuccess(res, 200, { posts, total, page, totalPages: Math.ceil(total / limit) });
});

export const getPostById = catchAsync(async (req: Request, res: Response) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { author: { select: { id: true, name: true } } },
  });
  if (!post) {
    res.status(404).json({ status: "fail", message: "Bài viết không tồn tại" });
    return;
  }
  sendSuccess(res, 200, post);
});

export const createPost = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { title, slug, excerpt, content, thumbnail, category, tags, readTime, isPublished } = req.body;

  if (!title || !slug || !excerpt || !content) {
    res.status(400).json({ status: "fail", message: "Thiếu thông tin bắt buộc (title, slug, excerpt, content)" });
    return;
  }

  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) {
    res.status(400).json({ status: "fail", message: "Slug đã tồn tại, vui lòng chọn slug khác" });
    return;
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      thumbnail: thumbnail || null,
      category: category || null,
      tags: tags || [],
      readTime: Number(readTime) || 5,
      isPublished: Boolean(isPublished),
      publishedAt: isPublished ? new Date() : null,
      authorId: user.id,
    },
  });

  sendSuccess(res, 201, post, "Tạo bài viết thành công!");
});

export const updatePost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, slug, excerpt, content, thumbnail, category, tags, readTime, isPublished } = req.body;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: "fail", message: "Bài viết không tồn tại" });
    return;
  }

  if (slug && slug !== existing.slug) {
    const slugConflict = await prisma.post.findUnique({ where: { slug } });
    if (slugConflict) {
      res.status(400).json({ status: "fail", message: "Slug đã tồn tại" });
      return;
    }
  }

  const wasPublished = existing.isPublished;
  const nowPublished = isPublished !== undefined ? Boolean(isPublished) : existing.isPublished;

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content !== undefined && { content }),
      thumbnail: thumbnail !== undefined ? thumbnail || null : existing.thumbnail,
      ...(category !== undefined && { category: category || null }),
      ...(tags !== undefined && { tags }),
      ...(readTime !== undefined && { readTime: Number(readTime) }),
      isPublished: nowPublished,
      publishedAt: nowPublished && !wasPublished ? new Date() : existing.publishedAt,
    },
  });

  sendSuccess(res, 200, post, "Cập nhật bài viết thành công!");
});

export const deletePost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: "fail", message: "Bài viết không tồn tại" });
    return;
  }
  await prisma.post.delete({ where: { id } });
  sendSuccess(res, 200, null, "Đã xoá bài viết");
});

export const togglePublishPost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ status: "fail", message: "Bài viết không tồn tại" });
    return;
  }
  const nowPublished = !existing.isPublished;
  const post = await prisma.post.update({
    where: { id },
    data: {
      isPublished: nowPublished,
      publishedAt: nowPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });
  sendSuccess(res, 200, post, nowPublished ? "Đã xuất bản bài viết" : "Đã ẩn bài viết");
});

// ─── Admin: Resend Verification Email ────────────────────────────────
export const resendVerificationByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ status: "fail", message: "Vui lòng cung cấp email!" });
    }

    const result = await AuthService.resendVerification(email);
    sendSuccess(res, 200, result, "Đã gửi lại email xác thực!");
  },
);
