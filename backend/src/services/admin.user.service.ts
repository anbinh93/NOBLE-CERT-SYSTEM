import { Role } from '@prisma/client';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';

interface ListUsersOptions {
  page: number;
  pageSize: number;
  q: string;
  role?: Role;
  isActive?: boolean;
}

export class AdminUserService {
  static async listUsers(options: ListUsersOptions) {
    const { page, pageSize, q, role, isActive } = options;

    const where = {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' as const } },
              { name: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(role ? { role } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
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
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    return user;
  }
}
