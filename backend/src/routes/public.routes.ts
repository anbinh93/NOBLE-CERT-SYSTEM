import { Router } from 'express';
import {
  getPublicCourses,
  getPublicCourseBySlug,
  getPublicPosts,
  getPublicPostBySlug,
  healthCheck,
  verifyCertificate,
  certificatePreview,
  certificateDownload,
} from '../controllers/public.controller';

const router = Router();

router.get('/courses', getPublicCourses);
router.get('/courses/:slug', getPublicCourseBySlug);
router.get('/posts', getPublicPosts);
router.get('/posts/:slug', getPublicPostBySlug);
router.get('/health', healthCheck);

// Thứ tự quan trọng: sub-paths trước /:serial
router.get('/verify/:serial/preview', certificatePreview);
router.get('/verify/:serial/download', certificateDownload);
router.get('/verify/:serial', verifyCertificate);

export default router;
