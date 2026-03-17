// src/routes/admin.routes.ts
import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

import * as courseCtrl from '../controllers/admin.course.controller';
import * as learnerCtrl from '../controllers/admin.learner.controller';
import * as paymentCtrl from '../controllers/admin.payment.controller';
import * as lookupCtrl from '../controllers/admin.lookup.controller';
import * as dashboardCtrl from '../controllers/admin.dashboard.controller';
import * as userCtrl from '../controllers/admin.user.controller';
import * as uploadCtrl from '../controllers/admin.upload.controller';
import * as val from '../validations/admin.validation';
import multer from 'multer';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true);
    cb(new Error('Chỉ cho phép upload file ảnh'));
  },
});

// ─── Guard toàn bộ admin namespace ─────────────────────────────────────────
router.use(protect);
router.use(restrictTo('SUPER_ADMIN', 'STAFF'));

// ─── Courses ────────────────────────────────────────────────────────────────
router.get('/courses', validate(val.listCourses), courseCtrl.listCourses);
router.post('/courses', restrictTo('SUPER_ADMIN'), validate(val.createCourse), courseCtrl.createCourse);
router.get('/courses/:id', validate(val.getCourse), courseCtrl.getCourse);
router.patch('/courses/:id', restrictTo('SUPER_ADMIN', 'STAFF'), validate(val.updateCourse), courseCtrl.updateCourse);
router.delete('/courses/:id', restrictTo('SUPER_ADMIN'), validate(val.getCourse), courseCtrl.deleteCourse);
router.patch('/courses/:id/publish', restrictTo('SUPER_ADMIN', 'STAFF'), validate(val.getCourse), courseCtrl.publishCourse);
router.patch('/courses/:id/archive', restrictTo('SUPER_ADMIN', 'STAFF'), validate(val.getCourse), courseCtrl.archiveCourse);

// ─── Learners ───────────────────────────────────────────────────────────────
router.get('/learners', validate(val.listLearners), learnerCtrl.listLearners);
router.get('/learners/:id', validate(val.getLearner), learnerCtrl.getLearner);
router.get('/learners/:id/enrollments', validate(val.getLearnerEnrollments), learnerCtrl.getLearnerEnrollments);
router.get('/users', validate(val.listUsers), userCtrl.listUsers);
router.get('/users/:id', validate(val.getUser), userCtrl.getUser);

// ─── Payments ───────────────────────────────────────────────────────────────
router.get('/payments/orders', validate(val.listOrders), paymentCtrl.listOrders);
router.get('/payments/orders/:orderCode', validate(val.getOrder), paymentCtrl.getOrder);
router.post('/payments/orders/:orderCode/sync', restrictTo('SUPER_ADMIN', 'STAFF'), validate(val.syncOrder), paymentCtrl.syncOrder);

// ─── Certificates list ──────────────────────────────────────────────────────
router.get('/certificates', validate(val.listCerts), lookupCtrl.listCerts);
router.post('/certificates/:id/revoke', restrictTo('SUPER_ADMIN', 'STAFF'), validate(val.revokeCert), lookupCtrl.revokeCert);

// ─── Lookup ─────────────────────────────────────────────────────────────────
router.get('/lookup/certificates', validate(val.searchLookup), lookupCtrl.searchCerts);
router.get('/lookup/learners', validate(val.searchLookup), lookupCtrl.searchLearners);
router.get('/lookup/courses', validate(val.searchLookup), lookupCtrl.searchCourses);
router.get('/dashboard/stats', validate(val.dashboardStats), dashboardCtrl.getDashboardStats);

// ─── Uploads ───────────────────────────────────────────────────────────────
router.post('/uploads/course-thumbnail', upload.single('file'), uploadCtrl.uploadCourseThumbnail);

export default router;
