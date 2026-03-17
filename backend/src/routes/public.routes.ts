import { Router } from 'express';
import {
  getPublicCourses,
  getPublicCourseBySlug,
  healthCheck,
  verifyCertificate,
  certificatePreview,
} from '../controllers/public.controller';

const router = Router();

router.get('/courses', getPublicCourses);
router.get('/courses/:slug', getPublicCourseBySlug);
router.get('/health', healthCheck);

// Đặt /verify/:serial/preview TRƯỚC /verify/:serial
// để Express không match "preview" là một serial
router.get('/verify/:serial/preview', certificatePreview);
router.get('/verify/:serial', verifyCertificate);

export default router;
