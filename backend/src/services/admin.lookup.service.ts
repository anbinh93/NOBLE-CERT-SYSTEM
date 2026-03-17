// src/services/admin.lookup.service.ts
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';

export class AdminLookupService {
  /** Shared: tìm enrollment dựa vào serial NC-XXXXXXXX */
  static async findEnrollmentBySerial(serial: string) {
    const hash = serial.replace(/^NC-/i, '').toUpperCase();
    if (!hash || hash.length !== 8) return null;

    const completedEnrollments = await prisma.enrollment.findMany({
      where: { status: 'COMPLETED' },
      include: {
        course: { include: { instructor: { select: { name: true } } } },
        user: { select: { name: true, email: true } },
        attempts: { orderBy: { score: 'desc' }, take: 1 },
      },
    });

    return (
      completedEnrollments.find(
        (e) => e.id.slice(-8).toUpperCase() === hash && e.attempts[0]?.isPassed,
      ) ?? null
    );
  }

  static async listCerts(options: { page: number; pageSize: number; q: string; isValid?: boolean }) {
    const { page, pageSize, q } = options;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status: 'COMPLETED' };
    if (q) {
      where.OR = [
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { course: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
          attempts: { orderBy: { score: 'desc' }, take: 1, select: { score: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.enrollment.count({ where }),
    ]);

    const enrollmentIds = enrollments.map((e) => e.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const revocations: any[] = enrollmentIds.length
      ? await (prisma as any).certificateRevocation.findMany({
          where: { enrollmentId: { in: enrollmentIds } },
        })
      : [];
    const revokedSet = new Set(revocations.map((r) => r.enrollmentId as string));

    const items = enrollments.map((e) => ({
      id: e.id,
      serial: `NC-${e.id.slice(-8).toUpperCase()}`,
      issuedAt: e.updatedAt,
      isValid: !revokedSet.has(e.id),
      user: e.user,
      course: e.course,
      score: e.attempts[0]?.score ?? null,
    }));

    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  static async searchCerts(q: string) {
    if (!q) return [];

    // Try serial lookup first
    const bySerial = await AdminLookupService.findEnrollmentBySerial(q);
    if (bySerial) {
      const serial = `NC-${bySerial.id.slice(-8).toUpperCase()}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revoked: any | null = await (prisma as any).certificateRevocation.findUnique({
        where: { enrollmentId: bySerial.id },
      });
      const isValid = !revoked;
      return [
        {
          id: bySerial.id,
          serial,
          issuedAt: bySerial.updatedAt,
          isValid,
          user: bySerial.user,
          course: bySerial.course,
          score: bySerial.attempts[0]?.score ?? null,
        },
      ];
    }

    // Else search by email/name/course
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { course: { title: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
        attempts: { orderBy: { score: 'desc' }, take: 1, select: { score: true, isPassed: true } },
      },
      take: 20,
    });

    const passed = enrollments.filter((e) => e.attempts[0]?.isPassed);
    const enrollmentIds = passed.map((e) => e.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const revocations: any[] = enrollmentIds.length
      ? await (prisma as any).certificateRevocation.findMany({
          where: { enrollmentId: { in: enrollmentIds } },
        })
      : [];
    const revokedSet = new Set(revocations.map((r) => r.enrollmentId as string));

    const items = passed.map((e) => ({
      id: e.id,
      serial: `NC-${e.id.slice(-8).toUpperCase()}`,
      issuedAt: e.updatedAt,
      isValid: !revokedSet.has(e.id),
      user: e.user,
      course: e.course,
      score: e.attempts[0]?.score ?? null,
    }));

    return items;
  }

  static async revokeCert(enrollmentId: string, adminId: string, reason?: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
        attempts: { orderBy: { score: 'desc' }, take: 1, select: { score: true, isPassed: true } },
      },
    });
    if (!enrollment) {
      throw new AppError('Không tìm thấy chứng chỉ để thu hồi', 404);
    }
    const bestAttempt = enrollment.attempts[0];
    if (!bestAttempt?.isPassed) {
      throw new AppError('Chỉ có thể thu hồi chứng chỉ đã được cấp (bài thi đã đậu)', 400);
    }

    const serial = `NC-${enrollment.id.slice(-8).toUpperCase()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).certificateRevocation.upsert({
      where: { enrollmentId },
      update: {
        serial,
        reason: reason ?? null,
        revokedById: adminId,
      },
      create: {
        enrollmentId,
        serial,
        reason: reason ?? null,
        revokedById: adminId,
      },
    });

    return {
      id: enrollment.id,
      serial,
      isValid: false,
      user: enrollment.user,
      course: enrollment.course,
      score: bestAttempt.score ?? null,
    };
  }

  static async searchLearners(q: string) {
    if (!q) return [];

    const users = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
      take: 20,
    });

    return users;
  }

  static async searchCourses(q: string) {
    if (!q) return [];

    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        price: true,
        settings: true,
        instructor: { select: { name: true } },
      },
      take: 20,
    });

    return courses;
  }
}
