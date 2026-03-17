// src/controllers/admin.learner.controller.ts
import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AdminLearnerService } from '../services/admin.learner.service';
import { parsePagination } from '../utils/pagination';

/**
 * GET /api/v1/admin/learners?q=&page=&pageSize=
 */
export const listLearners = catchAsync(async (req: Request, res: Response) => {
  const { page, pageSize, q } = parsePagination(req, { maxPageSize: 50 });

  const result = await AdminLearnerService.listLearners({ page, pageSize, q });

  sendSuccess(res, 200, result);
});

/**
 * GET /api/v1/admin/learners/:id
 */
export const getLearner = catchAsync(async (req: Request, res: Response) => {
  const user = await AdminLearnerService.getLearner(req.params.id);
  sendSuccess(res, 200, user);
});

/**
 * GET /api/v1/admin/learners/:id/enrollments
 */
export const getLearnerEnrollments = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminLearnerService.getLearnerEnrollments(req.params.id);
  sendSuccess(res, 200, result);
});
