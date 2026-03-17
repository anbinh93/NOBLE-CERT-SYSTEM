import { Router } from 'express';
import {
  LearningController,
  getStudentMyCourses,
  enrollCourse,
  checkEnrollment,
  getCourseContent,
  getCourseStatus,
  getExamQuestions,
  getMyCertificates,
} from '../controllers/learning.controller';
import { catchAsync } from '../utils/catchAsync';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// ── Routes công khai (dùng email từ NextAuth session) ─────────────────────
router.get('/my-courses', catchAsync(getStudentMyCourses));
router.get('/my-certificates', catchAsync(getMyCertificates));
router.get('/course-content/:courseId', catchAsync(getCourseContent));
router.get('/:courseId/status', catchAsync(getCourseStatus));

// ── Routes yêu cầu JWT Bearer ─────────────────────────────────────────────
router.use(protect);

router.post('/enroll', catchAsync(enrollCourse));
router.get('/check-enrollment', catchAsync(checkEnrollment));
router.get('/:courseId/exam', catchAsync(getExamQuestions));
router.get('/:courseId/exam/session', catchAsync(LearningController.getExamSession));
router.post('/:courseId/exam/start', catchAsync(LearningController.startExamSession));
router.patch('/:courseId/exam/session', catchAsync(LearningController.saveExamAnswers));

router.post('/:courseId/unit/:unitId/heartbeat', catchAsync(LearningController.syncHeartbeat));
router.post('/:courseId/unit/:unitId/complete', catchAsync(LearningController.completeUnit));
router.post('/:courseId/exam/submit', catchAsync(LearningController.submitExam));

export default router;
