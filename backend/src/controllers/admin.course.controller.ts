// src/controllers/admin.course.controller.ts
import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AdminCourseService } from '../services/admin.course.service';
import { parsePagination } from '../utils/pagination';

/**
 * GET /api/v1/admin/courses
 * List all courses (all statuses) with pagination + filter + search.
 */
export const listCourses = catchAsync(async (req: Request, res: Response) => {
  const { page, pageSize, q } = parsePagination(req, { maxPageSize: 50 });
  const status = req.query.status as string | undefined;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

  const result = await AdminCourseService.listCourses({ page, pageSize, q, status, sortBy, sortOrder });
  sendSuccess(res, 200, result);
});

/**
 * GET /api/v1/admin/courses/:id
 */
export const getCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await AdminCourseService.getCourseById(req.params.id);
  sendSuccess(res, 200, course);
});

/**
 * POST /api/v1/admin/courses
 */
export const createCourse = catchAsync(async (req: Request, res: Response) => {
  const { title, instructorId, description, price, settings } = req.body;
  const adminId = req.user.id;
  const course = await AdminCourseService.createCourse({
    instructorId: instructorId || adminId,
    title,
    description,
    price,
    settings,
  });
  sendSuccess(res, 201, course, 'Tạo khoá học thành công');
});

/**
 * PATCH /api/v1/admin/courses/:id
 */
export const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await AdminCourseService.updateCourse(req.params.id, req.body);
  sendSuccess(res, 200, course, 'Cập nhật khoá học thành công');
});

/**
 * PATCH /api/v1/admin/courses/:id/publish
 */
export const publishCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await AdminCourseService.setStatus(req.params.id, 'PUBLISHED');
  sendSuccess(res, 200, course, 'Xuất bản khoá học thành công');
});

/**
 * PATCH /api/v1/admin/courses/:id/archive
 */
export const archiveCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await AdminCourseService.setStatus(req.params.id, 'ARCHIVED');
  sendSuccess(res, 200, course, 'Lưu trữ khoá học thành công');
});

/**
 * DELETE /api/v1/admin/courses/:id
 */
export const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  await AdminCourseService.deleteCourse(req.params.id);
  sendSuccess(res, 200, null, 'Xoá khoá học thành công');
});
