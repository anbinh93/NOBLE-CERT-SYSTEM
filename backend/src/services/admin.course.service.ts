// src/services/admin.course.service.ts
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { CourseStatus, Role } from '@prisma/client';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

interface ListCoursesOptions {
  page: number;
  pageSize: number;
  q: string;
  status?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export class AdminCourseService {
  /**
   * List tất cả khoá học (kể cả DRAFT/ARCHIVED) với pagination + filter.
   */
  static async listCourses(opts: ListCoursesOptions) {
    const { page, pageSize, q, status, sortBy, sortOrder } = opts;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status && Object.values(CourseStatus).includes(status as CourseStatus)) {
      where.status = status as CourseStatus;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const validSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      title: 'title',
      price: 'price',
    };
    const orderByField = validSortFields[sortBy] ?? 'createdAt';

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          status: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
          instructor: { select: { id: true, name: true, email: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.course.count({ where }),
    ]);

    const items = courses.map((c) => {
      const settings = (c.settings as Record<string, unknown>) ?? {};
      return {
        ...c,
        slug: (settings.slug as string | undefined) ?? slugify(c.title),
        thumbnail: (settings.thumbnail as string | undefined) ?? null,
        category: (settings.category as string | undefined) ?? null,
      };
    });

    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * Lấy chi tiết một khoá học cho admin (không lọc status).
   */
  static async getCourseById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        _count: { select: { enrollments: true, orders: true } },
      },
    });

    if (!course) throw new AppError('Không tìm thấy khoá học', 404);
    return course;
  }

  /**
   * Tạo khoá học mới (draft).
   */
  static async createCourse(input: {
    instructorId: string;
    title: string;
    description?: string;
    price?: number;
    settings?: Record<string, unknown>;
  }) {
    const { instructorId, title, description, price, settings } = input;
    if (!title?.trim()) throw new AppError('Tiêu đề khoá học là bắt buộc', 400);

    // Verify instructor exists
    const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor) throw new AppError('Không tìm thấy instructor', 404);

    return prisma.course.create({
      data: {
        title: title.trim(),
        description: description?.trim() ? description.trim() : undefined,
        price: typeof price === 'number' ? price : 0,
        instructorId,
        status: CourseStatus.DRAFT,
        units: [],
        settings: {
          passing_score: 80,
          is_sequential: true,
          ...(settings ?? {}),
        } as unknown as Parameters<typeof prisma.course.create>[0]['data']['settings'],
      },
    });
  }

  /**
   * Cập nhật khoá học — admin bypass ownership check.
   */
  static async updateCourse(id: string, data: Record<string, unknown>) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) throw new AppError('Không tìm thấy khoá học', 404);

    const allowedFields = ['title', 'description', 'price', 'settings', 'units', 'instructorId'];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }

    if (typeof updateData.instructorId === 'string') {
      const instructor = await prisma.user.findUnique({ where: { id: updateData.instructorId } });
      if (!instructor) throw new AppError('Không tìm thấy instructor', 404);
      if (instructor.role !== Role.INSTRUCTOR) {
        throw new AppError('instructorId phải là tài khoản có role INSTRUCTOR', 400);
      }
    }

    return prisma.course.update({
      where: { id },
      data: updateData as Parameters<typeof prisma.course.update>[0]['data'],
    });
  }

  /**
   * Set status (PUBLISHED / ARCHIVED / DRAFT).
   */
  static async setStatus(id: string, status: CourseStatus | 'PUBLISHED' | 'ARCHIVED' | 'DRAFT') {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) throw new AppError('Không tìm thấy khoá học', 404);

    return prisma.course.update({
      where: { id },
      data: { status: status as CourseStatus },
    });
  }

  /**
   * Xoá khoá học (hard delete — admin only).
   */
  static async deleteCourse(id: string) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) throw new AppError('Không tìm thấy khoá học', 404);

    const [ordersCount, enrollmentsCount] = await Promise.all([
      prisma.order.count({ where: { courseId: id } }),
      prisma.enrollment.count({ where: { courseId: id } }),
    ]);

    if (ordersCount > 0 || enrollmentsCount > 0) {
      throw new AppError(
        'Không thể xoá khoá học vì đã có đơn hàng hoặc học viên đăng ký. Vui lòng lưu trữ (archive) thay vì xoá.',
        400,
      );
    }

    await prisma.course.delete({ where: { id } });
  }
}
