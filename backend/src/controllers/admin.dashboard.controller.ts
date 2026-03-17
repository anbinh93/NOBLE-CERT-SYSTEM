import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AdminDashboardService } from '../services/admin.dashboard.service';

/**
 * GET /api/v1/admin/dashboard/stats
 */
export const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const data = await AdminDashboardService.getStats();
  sendSuccess(res, 200, data);
});
