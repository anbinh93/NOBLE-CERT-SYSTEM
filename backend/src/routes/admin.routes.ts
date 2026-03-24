import { Router } from "express";
import multer from "multer";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import {
  getCourseStudents,
  markAttendance,
  unmarkAttendance,
  bulkEnrollStudents,
  enrollSingleStudent,
} from "../controllers/attendance.controller";
import {
  getStats,
  getRecentOrders,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCourses,
  getOrders,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
  archiveCourse,
  getInstructors,
  getMyProfile,
  updateProfile,
  getCertificates,
  revokeCertificate,
  createInstructor,
  getSystemSettings,
  updateSystemSettings,
  sendTestEmail,
  resendVerificationByAdmin,
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  togglePublishPost,
} from "../controllers/admin.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);
router.use(restrictTo("SUPER_ADMIN", "INSTRUCTOR", "STAFF"));

// Dashboard
router.get("/stats", getStats);
router.get("/orders/recent", getRecentOrders);

// Users
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", restrictTo("SUPER_ADMIN"), updateUser);
router.delete("/users/:id", restrictTo("SUPER_ADMIN"), deleteUser);
router.post("/users/resend-verification", resendVerificationByAdmin);

// Courses — tạo khoá học chỉ SUPER_ADMIN
router.get("/courses", getCourses);
router.post("/courses", restrictTo("SUPER_ADMIN"), createCourse);
router.get("/courses/:id", getCourseById);
router.put("/courses/:id", restrictTo("SUPER_ADMIN"), updateCourse);
router.delete("/courses/:id", restrictTo("SUPER_ADMIN"), deleteCourse);
router.patch("/courses/:id/publish", restrictTo("SUPER_ADMIN"), publishCourse);
router.patch("/courses/:id/archive", restrictTo("SUPER_ADMIN"), archiveCourse);

// Attendance & Enrollment — SUPER_ADMIN + INSTRUCTOR
router.get("/courses/:courseId/students", restrictTo("SUPER_ADMIN", "INSTRUCTOR"), getCourseStudents);
router.post("/courses/:courseId/attendance", restrictTo("SUPER_ADMIN", "INSTRUCTOR"), markAttendance);
router.delete("/courses/:courseId/attendance", restrictTo("SUPER_ADMIN", "INSTRUCTOR"), unmarkAttendance);
router.post("/courses/:courseId/enroll-bulk", restrictTo("SUPER_ADMIN", "INSTRUCTOR"), upload.single("file"), bulkEnrollStudents);
router.post("/courses/:courseId/enroll-single", restrictTo("SUPER_ADMIN", "INSTRUCTOR"), enrollSingleStudent);

// Instructors
router.get("/instructors", getInstructors);
router.post("/instructors", restrictTo("SUPER_ADMIN"), createInstructor);

// Orders
router.get("/orders", getOrders);

// Certificates — SUPER_ADMIN + STAFF
router.get("/certificates", getCertificates);
router.patch("/certificates/:id/revoke", restrictTo("SUPER_ADMIN"), revokeCertificate);

// System Settings — SUPER_ADMIN only
router.get("/settings", restrictTo("SUPER_ADMIN"), getSystemSettings);
router.put("/settings", restrictTo("SUPER_ADMIN"), updateSystemSettings);
router.post("/settings/test-email", restrictTo("SUPER_ADMIN"), sendTestEmail);

// Profile
router.get("/profile", getMyProfile);
router.put("/profile", updateProfile);

// Blog Posts — SUPER_ADMIN + INSTRUCTOR + STAFF
router.get("/posts", getPosts);
router.post("/posts", createPost);
router.get("/posts/:id", getPostById);
router.put("/posts/:id", updatePost);
router.delete("/posts/:id", deletePost);
router.patch("/posts/:id/toggle-publish", togglePublishPost);

export default router;
