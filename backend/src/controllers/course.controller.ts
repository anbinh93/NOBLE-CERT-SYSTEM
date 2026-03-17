// src/controllers/course.controller.ts
import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';

export const createCourse = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user.id;
  const { title } = req.body;

  const course = await CourseService.createDraft(instructorId, title);
  sendSuccess(res, 201, { course }, 'Khởi tạo khóa học thành công!');
});

export const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user.id;
  const courseId = req.params.id;
  
  const course = await CourseService.updateCourse(instructorId, courseId, req.body);
  sendSuccess(res, 200, { course }, 'Cập nhật nội dung khóa học thành công!');
});

export const publishCourse = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user.id;
  const courseId = req.params.id;

  const course = await CourseService.publishCourse(instructorId, courseId);
  sendSuccess(res, 200, { course }, 'Khóa học đã được xuất bản thành công!');
});
