import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/errorHandler";
import { AppError } from "./utils/AppError";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import instructorRoutes from "./routes/instructor.routes";
import studentLearnRoutes from "./routes/student.learn.routes";
import paymentRoutes from "./routes/payment.routes";
import publicRoutes from "./routes/public.routes";
import adminRoutes from "./routes/admin.routes";
import { env } from "./config/env.config";

const app: Application = express();

// 1. Global Middlewares (Security & Parsing)
app.use(helmet()); // Bảo vệ HTTP Headers
app.use(
  cors({
    origin: [env.CLIENT_URL, "http://localhost:3001"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" })); // Body parser (larger for rich text post content)
app.use(cookieParser()); // ĐỂ ĐỌC ĐƯỢC req.cookies

// 2. Rate Limiting (Chống Spam/Brute-force)
const limiter = rateLimit({
  max: 100, // 100 requests
  windowMs: 15 * 60 * 1000, // Trong 15 phút
  message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau!",
});
app.use("/api", limiter);

// 3. Mount Routes
app.use("/api/public", publicRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/instructor", instructorRoutes);
app.use("/api/v1/student", studentLearnRoutes);
app.use("/api/student", studentLearnRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/admin", adminRoutes);
app.get("/api/health", (_req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "success", message: "Noble-Cert API is running smoothly" });
});

// 4. Bắt các Route không tồn tại
app.all("*", (req: Request, res: Response, next) => {
  next(
    new AppError(`Không thể tìm thấy ${req.originalUrl} trên máy chủ!`, 404),
  );
});

// 5. Global Error Handler
app.use(errorHandler);

export default app;
