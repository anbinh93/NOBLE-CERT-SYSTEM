import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.config';
import { PaymentController } from '../controllers/payment.controller';
import { protect } from '../middlewares/auth.middleware';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

/**
 * Rate limiter riêng cho create-link:
 * Tối đa 5 lần / 10 phút / IP — chống spam tạo đơn hàng.
 */
const createLinkLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  skip: () => env.NODE_ENV === 'development', // Tắt khi dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Bạn đã tạo quá nhiều đơn hàng. Vui lòng thử lại sau 10 phút.',
  },
});

// Webhook: PayOS gọi trực tiếp — KHÔNG dùng protect, KHÔNG rate limit
router.post('/webhook', PaymentController.webhook);

// Các route yêu cầu đăng nhập
router.use(protect);
router.post('/create-link', createLinkLimiter, catchAsync(PaymentController.createLink));
router.post('/certificate', createLinkLimiter, catchAsync(PaymentController.createCertificateLink));
router.get('/status/:orderCode', catchAsync(PaymentController.checkStatus));

export default router;
