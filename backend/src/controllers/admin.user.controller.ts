import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AdminUserService } from '../services/admin.user.service';
import { Role } from '@prisma/client';
import { parsePagination } from '../utils/pagination';

/**
 * GET /api/v1/admin/users
 */
export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, pageSize, q } = parsePagination(req, { maxPageSize: 50 });
  const role = req.query.role as Role | undefined;
  const isActive =
    typeof req.query.isActive === 'string'
      ? req.query.isActive === 'true'
      : undefined;

  const data = await AdminUserService.listUsers({
    page,
    pageSize,
    q,
    role,
    isActive,
  });
  sendSuccess(res, 200, data);
});

/**
 * GET /api/v1/admin/users/:id
 */
export const getUser = catchAsync(async (req: Request, res: Response) => {
  const user = await AdminUserService.getUser(req.params.id);
  sendSuccess(res, 200, user);
});
