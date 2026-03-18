import { Router } from "express";
import {
  register,
  login,
  refresh,
  googleSync,
  verifyEmail,
  resendVerification,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/google-sync", googleSync);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

export default router;
