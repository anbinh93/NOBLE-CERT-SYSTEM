// src/services/admin.learner.service.ts
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';

export class AdminLearnerService {
  static async listLearners(options: { page: number; pageSize: number; q: string }) {
    const { page, pageSize, q } = options;

    const where = q
      ? {
          role: 'STUDENT' as const,
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : { role: 'STUDENT' as const };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: users,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getLearner(id: string) {
    const user = await prisma.user.findUnique({
      where: { id, role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            orders: true,
          },
        },
      },
    });

    if (!user) throw new AppError('Không tìm thấy học viên', 404);

    const certifiedCount = await prisma.enrollment.count({
      where: { userId: id, status: 'COMPLETED' },
    });

    return { ...user, certifiedCount };
  }

  static async getLearnerEnrollments(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            status: true,
            settings: true,
          },
        },
        attempts: {
          orderBy: { score: 'desc' },
          take: 1,
          select: { score: true, isPassed: true, createdAt: true },
        },
        progresses: {
          select: { isCompleted: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const items = enrollments.map((e) => {
      const totalUnits = (e.course.settings as Record<string, unknown> | null)?.totalUnits as number | undefined;
      const completedUnits = e.progresses.filter((p) => p.isCompleted).length;
      const serial = e.status === 'COMPLETED' ? `NC-${e.id.slice(-8).toUpperCase()}` : null;

      return {
        id: e.id,
        status: e.status,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        serial,
        course: {
          id: e.course.id,
          title: e.course.title,
          status: e.course.status,
        },
        progress: {
          completedUnits,
          totalUnits: totalUnits ?? null,
        },
        bestAttempt: e.attempts[0] ?? null,
      };
    });

    return { items, total: items.length };
  }
}
