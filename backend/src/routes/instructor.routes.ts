// src/routes/instructor.routes.ts
import { Router } from 'express';
import { createCourse, updateCourse, publishCourse } from '../controllers/course.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Tất cả các route dưới đây đều yêu cầu đăng nhập và có role là INSTRUCTOR hoặc SUPER_ADMIN
router.use(protect);
router.use(restrictTo('INSTRUCTOR', 'SUPER_ADMIN'));

// Các endpoint quản trị khóa học
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.patch('/courses/:id/publish', publishCourse);

export default router;
