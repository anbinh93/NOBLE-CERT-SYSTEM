import { Router } from "express";
import {
  register,
  login,
  refresh,
  googleSync,
  verifyEmail,
  resendVerification,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/google-sync", googleSync);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
