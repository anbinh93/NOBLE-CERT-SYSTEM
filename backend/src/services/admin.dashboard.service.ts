import { prisma } from '../config/database.config';

function percentTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export class AdminDashboardService {
  static async getStats() {
    const now = new Date();
    const startCurrent = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startPrevious = new Date(startCurrent.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalEnrollments,
      currentRevenueAgg,
      prevRevenueAgg,
      currentEnrollments,
      prevEnrollments,
      currentUsers,
      prevUsers,
      activeCourses,
      prevActiveCourses,
    ] = await Promise.all([
      prisma.enrollment.count(),
      prisma.order.aggregate({
        where: { status: 'SUCCESS', createdAt: { gte: startCurrent } },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: { status: 'SUCCESS', createdAt: { gte: startPrevious, lt: startCurrent } },
        _sum: { amount: true },
      }),
      prisma.enrollment.count({ where: { createdAt: { gte: startCurrent } } }),
      prisma.enrollment.count({ where: { createdAt: { gte: startPrevious, lt: startCurrent } } }),
      prisma.user.count({ where: { createdAt: { gte: startCurrent } } }),
      prisma.user.count({ where: { createdAt: { gte: startPrevious, lt: startCurrent } } }),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.course.count({
        where: {
          status: 'PUBLISHED',
          createdAt: { gte: startPrevious, lt: startCurrent },
        },
      }),
    ]);

    const revenue = currentRevenueAgg._sum.amount ?? 0;
    const prevRevenue = prevRevenueAgg._sum.amount ?? 0;

    return {
      revenue,
      totalEnrollments,
      newUsers: currentUsers,
      activeCourses,
      revenueTrend: percentTrend(revenue, prevRevenue),
      enrollmentsTrend: percentTrend(currentEnrollments, prevEnrollments),
      usersTrend: percentTrend(currentUsers, prevUsers),
      coursesTrend: percentTrend(activeCourses, prevActiveCourses),
    };
  }
}
