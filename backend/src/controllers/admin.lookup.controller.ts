// src/controllers/admin.lookup.controller.ts
import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AdminLookupService } from '../services/admin.lookup.service';
import { parsePagination } from '../utils/pagination';

/**
 * GET /api/v1/admin/certificates
 * List chứng chỉ (enrollments COMPLETED) với filter + pagination
 */
export const listCerts = catchAsync(async (req: Request, res: Response) => {
  const { page, pageSize, q } = parsePagination(req, { maxPageSize: 50 });
  const isValid =
    typeof req.query.isValid === 'string'
      ? req.query.isValid === 'true'
      : undefined;

  const result = await AdminLookupService.listCerts({ page, pageSize, q, isValid });
  sendSuccess(res, 200, result);
});

/**
 * GET /api/v1/admin/lookup/certificates?q=
 * Tìm theo serial / email / tên
 */
export const searchCerts = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const result = await AdminLookupService.searchCerts(q);
  sendSuccess(res, 200, result);
});

/**
 * GET /api/v1/admin/lookup/learners?q=
 */
export const searchLearners = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const result = await AdminLookupService.searchLearners(q);
  sendSuccess(res, 200, result);
});

/**
 * GET /api/v1/admin/lookup/courses?q=
 * Tìm mọi trạng thái khoá học (kể cả DRAFT)
 */
export const searchCourses = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const result = await AdminLookupService.searchCourses(q);
  sendSuccess(res, 200, result);
});

/**
 * POST /api/v1/admin/certificates/:id/revoke
 * Thu hồi chứng chỉ (theo enrollmentId).
 */
export const revokeCert = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user.id;
  const { reason } = (req.body ?? {}) as { reason?: string };
  const result = await AdminLookupService.revokeCert(req.params.id, adminId, reason);
  sendSuccess(res, 200, result, 'Đã thu hồi chứng chỉ');
});
