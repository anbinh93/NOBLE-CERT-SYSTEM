import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import {
  getStats,
  getRecentOrders,
  getUsers,
  getCourses,
  getOrders,
} from "../controllers/admin.controller";

const router = Router();

// Tất cả admin routes yêu cầu đăng nhập + role SUPER_ADMIN hoặc INSTRUCTOR
router.use(protect);
router.use(restrictTo("SUPER_ADMIN", "INSTRUCTOR"));

router.get("/stats", getStats);
router.get("/orders/recent", getRecentOrders);
router.get("/users", getUsers);
router.get("/courses", getCourses);
router.get("/orders", getOrders);

export default router;
