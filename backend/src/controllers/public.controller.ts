import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { PostService } from '../services/post.service';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { prisma } from '../config/database.config';
import { generateCertificatePDF } from '../services/certificate.service';

/**
 * GET /api/public/courses
 * Trả danh sách khoá học đã xuất bản — không yêu cầu xác thực.
 */
export const getPublicCourses = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const courses = await CourseService.getPublishedCourses(limit);
  res.status(200).json(courses);
});

/**
 * GET /api/public/courses/:slug
 * Lấy thông tin chi tiết của 1 khoá học public qua slug
 */
export const getPublicCourseBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const course = await CourseService.getCourseBySlug(slug);
  res.status(200).json(course);
});

/**
 * GET /api/public/posts
 * Trả danh sách bài viết đã xuất bản.
 */
export const getPublicPosts = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const posts = await PostService.getPublishedPosts(limit);
  sendSuccess(res, 200, posts, 'OK');
});

/**
 * GET /api/public/posts/:slug
 * Lấy chi tiết một bài viết theo slug.
 */
export const getPublicPostBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const post = await PostService.getPostBySlug(slug);
  if (!post) {
    res.status(404).json({ status: 'fail', message: 'Bài viết không tồn tại' });
    return;
  }
  sendSuccess(res, 200, post, 'OK');
});

/**
 * GET /api/public/health
 * Health check endpoint.
 */
export const healthCheck = catchAsync(async (_req: Request, res: Response) => {
  sendSuccess(res, 200, null, 'Noble-Cert API is running smoothly');
});

/**
 * Tìm enrollment dựa vào serial format NC-XXXXXXXX (8 ký tự cuối của enrollment.id)
 */
async function findEnrollmentBySerial(serial: string) {
  const hash = serial.replace(/^NC-/i, '').toUpperCase();
  if (!hash || hash.length !== 8) return null;

  const completedEnrollments = await prisma.enrollment.findMany({
    where: { status: 'COMPLETED' },
    include: {
      course: { include: { instructor: { select: { name: true } } } },
      user: { select: { name: true, email: true } },
      attempts: { orderBy: { score: 'desc' }, take: 1 },
    },
  });

  return completedEnrollments.find(
    (e) => e.id.slice(-8).toUpperCase() === hash && e.attempts[0]?.isPassed
  ) ?? null;
}

/**
 * GET /api/public/verify/:serial
 * Xác minh chứng chỉ theo serial (NC-XXXXXXXX). Public — không cần xác thực.
 */
export const verifyCertificate = catchAsync(async (req: Request, res: Response) => {
  const { serial } = req.params;
  const enrollment = await findEnrollmentBySerial(serial);

  if (!enrollment) {
    res.status(404).json({
      status: 'fail',
      message: 'Chứng chỉ không hợp lệ hoặc không tồn tại',
    });
    return;
  }

  const course = enrollment.course as any;
  const serialNumber = `NC-${enrollment.id.slice(-8).toUpperCase()}`;

  sendSuccess(res, 200, {
    serialNumber,
    issuedDate: enrollment.updatedAt,
    courseId: {
      _id: course.id,
      name: course.title,
    },
    issuerId: {
      name: course.instructor?.name ?? 'Noble Cert',
    },
    userInfo: {
      name: enrollment.user.name,
      email: enrollment.user.email,
    },
  }, 'Chứng chỉ hợp lệ');
});

/**
 * GET /api/public/verify/:serial/preview
 * Trả về ảnh SVG chứng chỉ để nhúng vào trang xác minh.
 */
export const certificatePreview = catchAsync(async (req: Request, res: Response) => {
  const { serial } = req.params;
  const enrollment = await findEnrollmentBySerial(serial);

  if (!enrollment) {
    res.status(404).json({ status: 'fail', message: 'Chứng chỉ không tồn tại' });
    return;
  }

  const course = enrollment.course as any;
  const serialNumber = `NC-${enrollment.id.slice(-8).toUpperCase()}`;
  const studentName = enrollment.user.name ?? 'Học viên';
  const courseName = course.title ?? 'Khoá học';
  const instructorName = (course.instructor?.name as string | undefined) ?? 'Noble Cert';
  const issuedDate = new Date(enrollment.updatedAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="849" viewBox="0 0 1200 849" fill="none">
  <!-- Background -->
  <rect width="1200" height="849" fill="#FAFAF8"/>

  <!-- Gold border frame -->
  <rect x="24" y="24" width="1152" height="801" rx="4" fill="none" stroke="#D4AF37" stroke-width="2"/>
  <rect x="36" y="36" width="1128" height="777" rx="2" fill="none" stroke="#D4AF37" stroke-width="0.5" stroke-dasharray="8 4"/>

  <!-- Top decorative band -->
  <rect x="24" y="24" width="1152" height="6" rx="2" fill="#D4AF37"/>
  <!-- Bottom decorative band -->
  <rect x="24" y="819" width="1152" height="6" rx="2" fill="#D4AF37"/>

  <!-- Corner ornaments TL -->
  <path d="M60 60 L60 80 M60 60 L80 60" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
  <!-- Corner ornaments TR -->
  <path d="M1140 60 L1140 80 M1140 60 L1120 60" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
  <!-- Corner ornaments BL -->
  <path d="M60 789 L60 769 M60 789 L80 789" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
  <!-- Corner ornaments BR -->
  <path d="M1140 789 L1140 769 M1140 789 L1120 789" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>

  <!-- Issuer name -->
  <text x="600" y="120" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-weight="400" fill="#9A7B2A" letter-spacing="6">NOBLE CERT</text>

  <!-- Decorative divider -->
  <line x1="380" y1="136" x2="820" y2="136" stroke="#D4AF37" stroke-width="0.75"/>
  <circle cx="600" cy="136" r="3" fill="#D4AF37"/>

  <!-- Main Title -->
  <text x="600" y="210" text-anchor="middle" font-family="Georgia, serif" font-size="52" font-weight="400" fill="#1A1A1A" letter-spacing="2">Certificate of Completion</text>
  <text x="600" y="252" text-anchor="middle" font-family="Georgia, serif" font-size="18" font-weight="400" fill="#6B7280" letter-spacing="4">CHỨNG NHẬN HOÀN THÀNH KHOÁ HỌC</text>

  <!-- Presented text -->
  <text x="600" y="320" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="400" fill="#9CA3AF" letter-spacing="2">This is to certify that</text>

  <!-- Student Name -->
  <text x="600" y="400" text-anchor="middle" font-family="Georgia, serif" font-size="56" font-weight="700" fill="#1A1A1A">${escapeXml(studentName)}</text>

  <!-- Name underline -->
  <line x1="300" y1="420" x2="900" y2="420" stroke="#D4AF37" stroke-width="1"/>

  <!-- Completion text -->
  <text x="600" y="470" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="400" fill="#9CA3AF" letter-spacing="2">has successfully completed the course</text>

  <!-- Course Name -->
  <text x="600" y="530" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="600" fill="#D4AF37">${escapeXml(courseName)}</text>

  <!-- Bottom info row -->
  <!-- Left: Date -->
  <text x="200" y="660" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="#9CA3AF" letter-spacing="1">NGÀY CẤP</text>
  <text x="200" y="682" text-anchor="middle" font-family="Georgia, serif" font-size="15" font-weight="600" fill="#374151">${escapeXml(issuedDate)}</text>

  <!-- Center: Seal area -->
  <circle cx="600" cy="665" r="52" fill="none" stroke="#D4AF37" stroke-width="1.5"/>
  <circle cx="600" cy="665" r="44" fill="none" stroke="#D4AF37" stroke-width="0.5"/>
  <text x="600" y="658" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="700" fill="#D4AF37" letter-spacing="1">NOBLE</text>
  <text x="600" y="673" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="700" fill="#D4AF37" letter-spacing="1">CERT</text>
  <text x="600" y="690" text-anchor="middle" font-family="Georgia, serif" font-size="8" fill="#9A7B2A" letter-spacing="2">✦ VERIFIED ✦</text>

  <!-- Right: Instructor -->
  <text x="1000" y="660" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="#9CA3AF" letter-spacing="1">GIẢNG VIÊN</text>
  <text x="1000" y="682" text-anchor="middle" font-family="Georgia, serif" font-size="15" font-weight="600" fill="#374151">${escapeXml(instructorName)}</text>

  <!-- Serial number -->
  <text x="600" y="790" text-anchor="middle" font-family="monospace" font-size="11" fill="#9CA3AF" letter-spacing="2">ID: ${escapeXml(serialNumber)}</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.status(200).send(svg);
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * GET /api/public/verify/:serial/download
 * Tạo và trả về file PDF chứng chỉ để download. Public — không cần xác thực.
 */
export const certificateDownload = catchAsync(async (req: Request, res: Response) => {
  const { serial } = req.params;
  const enrollment = await findEnrollmentBySerial(serial);

  if (!enrollment) {
    res.status(404).json({ status: 'fail', message: 'Chứng chỉ không tồn tại' });
    return;
  }

  const course = enrollment.course as any;
  const serialNumber = `NC-${enrollment.id.slice(-8).toUpperCase()}`;
  const studentName = enrollment.user.name ?? 'Học viên';
  const courseName = course.title ?? 'Khoá học';
  const instructorName = course.instructor?.name ?? 'Noble Cert';
  const issuedDate = new Date(enrollment.updatedAt).toLocaleDateString('vi-VN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const pdfBuffer = await generateCertificatePDF({
    studentName,
    courseName,
    instructorName,
    issuedDate,
    serialNumber,
  });

  const filename = `certificate-${serialNumber}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.status(200).end(pdfBuffer);
});
