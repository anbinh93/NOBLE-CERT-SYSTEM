import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware";
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
} from "../controllers/admin.controller";

const router = Router();

router.use(protect);
router.use(restrictTo("SUPER_ADMIN", "INSTRUCTOR"));

// Dashboard
router.get("/stats", getStats);
router.get("/orders/recent", getRecentOrders);

// Users
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/users/resend-verification", resendVerificationByAdmin);

// Courses
router.get("/courses", getCourses);
router.post("/courses", createCourse);
router.get("/courses/:id", getCourseById);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);
router.patch("/courses/:id/publish", publishCourse);
router.patch("/courses/:id/archive", archiveCourse);

// Instructors
router.get("/instructors", getInstructors);
router.post("/instructors", createInstructor);

// Orders
router.get("/orders", getOrders);

// Certificates
router.get("/certificates", getCertificates);
router.patch("/certificates/:id/revoke", revokeCertificate);

// System Settings
router.get("/settings", getSystemSettings);
router.put("/settings", updateSystemSettings);
router.post("/settings/test-email", sendTestEmail);

// Profile
router.get("/profile", getMyProfile);
router.put("/profile", updateProfile);

export default router;
