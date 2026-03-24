// src/routes/instructor.routes.ts
import { Router } from 'express';
import { updateCourse, publishCourse } from '../controllers/course.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Tất cả các route dưới đây đều yêu cầu đăng nhập và có role là INSTRUCTOR hoặc SUPER_ADMIN
router.use(protect);
router.use(restrictTo('INSTRUCTOR', 'SUPER_ADMIN'));

// Instructor chỉ được cập nhật và publish — không được tạo khoá học
router.put('/courses/:id', updateCourse);
router.patch('/courses/:id/publish', publishCourse);

export default router;
