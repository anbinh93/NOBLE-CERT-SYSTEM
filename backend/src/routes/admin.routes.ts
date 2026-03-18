import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import {
  getStats,
  getRecentOrders,
  getUsers,
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
} from "../controllers/admin.controller";

const router = Router();

router.use(protect);
router.use(restrictTo("SUPER_ADMIN", "INSTRUCTOR"));

// Dashboard
router.get("/stats", getStats);
router.get("/orders/recent", getRecentOrders);

// Users
router.get("/users", getUsers);

// Courses
router.get("/courses", getCourses);
router.post("/courses", createCourse);
router.get("/courses/:id", getCourseById);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);
router.patch("/courses/:id/publish", publishCourse);
router.patch("/courses/:id/archive", archiveCourse);

// Instructors (dropdown)
router.get("/instructors", getInstructors);

// Orders
router.get("/orders", getOrders);

// Profile
router.get("/profile", getMyProfile);
router.put("/profile", updateProfile);

export default router;
