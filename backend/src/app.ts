import express, { Application, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './utils/AppError';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import instructorRoutes from './routes/instructor.routes';
import studentLearnRoutes from './routes/student.learn.routes';
import paymentRoutes from './routes/payment.routes';
import publicRoutes from './routes/public.routes';
import adminRoutes from './routes/admin.routes';
import filesRoutes from './routes/files.routes';
import { env } from './config/env.config';

const app: Application = express();

// 1. Global Middlewares (Security & Parsing)
app.use(helmet()); // Bảo vệ HTTP Headers
app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser tools (curl/postman) with no origin
      if (!origin) return cb(null, true);

      const normalize = (s: string) => s.replace(/\/+$/, '');
      const requestOrigin = normalize(origin);

      const adminOrigins = env.ADMIN_CLIENT_URL
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(normalize);

      const allowed = new Set([normalize(env.CLIENT_URL), ...adminOrigins]);

      if (allowed.has(requestOrigin)) return cb(null, true);

      // Allow Vercel preview domains for configured *.vercel.app origins
      // If ADMIN_CLIENT_URL includes https://my-admin.vercel.app, then also allow:
      // - https://my-admin-git-branch.vercel.app
      // - https://my-admin-<hash>.vercel.app
      try {
        const reqHost = new URL(requestOrigin).host.toLowerCase();
        if (reqHost.endsWith('.vercel.app')) {
          for (const o of adminOrigins) {
            const host = new URL(o).host.toLowerCase();
            if (!host.endsWith('.vercel.app')) continue;
            const project = host.replace(/\.vercel\.app$/, '');
            if (reqHost === host) return cb(null, true);
            if (reqHost.startsWith(`${project}-`) && reqHost.endsWith('.vercel.app')) return cb(null, true);
          }
        }
      } catch {
        // ignore URL parse errors
      }

      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '10kb' })); // Body parser
app.use(cookieParser()); // ĐỂ ĐỌC ĐƯỢC req.cookies
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 2. Rate Limiting (Chống Spam/Brute-force) — chỉ bật trên production
const limiter = rateLimit({
  max: env.NODE_ENV === 'production' ? 100 : 1000, // 1000 req/15min cho dev
  windowMs: 15 * 60 * 1000,
  skip: () => env.NODE_ENV === 'development', // Tắt hoàn toàn khi dev
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau!'
});
app.use('/api', limiter);

// 3. Mount Routes
app.use('/api/public', publicRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/instructor', instructorRoutes);
app.use('/api/v1/student', studentLearnRoutes);
app.use('/api/student', studentLearnRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/files', filesRoutes);
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Noble-Cert API is running smoothly' });
});

// 4. Bắt các Route không tồn tại
app.all('*', (req: Request, res: Response, next) => {
  next(new AppError(`Không thể tìm thấy ${req.originalUrl} trên máy chủ!`, 404));
});

// 5. Global Error Handler
app.use(errorHandler);

export default app;
