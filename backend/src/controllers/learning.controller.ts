import { Request, Response } from 'express';
import { z } from 'zod/v4';
import { LearningService } from '../services/learning.service';
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';

const AnswersSchema = z.record(z.string(), z.string()).default({});

// ─── Helper: lấy enrollment kèm dữ liệu đầy đủ theo email ─────────────────
async function findEnrollmentByEmail(courseId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  return prisma.enrollment.findFirst({
    where: { userId: user.id, courseId },
    include: {
      course: { include: { instructor: { select: { name: true } } } },
      progresses: true,
      attempts: { orderBy: { score: 'desc' }, take: 1 },
    },
  });
}

export class LearningController {
  static async syncHeartbeat(req: Request | any, res: Response) {
    const { currentPosition, timeAdded } = req.body;
    const { courseId, unitId } = req.params;
    
    const data = await LearningService.syncHeartbeat(
      req.user.id, 
      courseId, 
      unitId, 
      currentPosition, 
      timeAdded
    );
    
    res.status(200).json({ status: 'success', data });
  }

  static async completeUnit(req: Request | any, res: Response) {
    const { courseId, unitId } = req.params;
    const clientDuration = req.body?.videoDuration ? Number(req.body.videoDuration) : undefined;
    const forceComplete = req.body?.forceComplete === true;

    const data = await LearningService.completeUnit(
      req.user.id, courseId, unitId, clientDuration, forceComplete,
    );

    res.status(200).json({ status: 'success', data });
  }

  static async submitExam(req: Request | any, res: Response) {
    const { courseId } = req.params;
    const parsed = z.object({ answers: AnswersSchema }).safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Dữ liệu bài làm không hợp lệ', 400, { code: 'INVALID_EXAM_PAYLOAD' });
    }
    
    const data = await LearningService.submitExam(req.user.id, courseId, parsed.data.answers);
    
    res.status(200).json({ status: 'success', data });
  }

  /** POST /:courseId/exam/start - Bắt đầu phiên làm bài (OpenEdX-style) */
  static async startExamSession(req: Request | any, res: Response) {
    const { courseId } = req.params;
    const data = await LearningService.startExamSession(req.user.id, courseId);
    res.status(200).json({ status: 'success', data });
  }

  /** GET /:courseId/exam/session - Lấy phiên đang làm (restore khi reload) */
  static async getExamSession(req: Request | any, res: Response) {
    const { courseId } = req.params;
    const data = await LearningService.getExamSession(req.user.id, courseId);
    res.status(200).json({ status: 'success', data: data ?? null });
  }

  /** PATCH /:courseId/exam/session - Lưu câu trả lời (auto-save) */
  static async saveExamAnswers(req: Request | any, res: Response) {
    const { courseId } = req.params;
    const parsed = z.object({ answers: AnswersSchema }).safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Dữ liệu câu trả lời không hợp lệ', 400, { code: 'INVALID_EXAM_PAYLOAD' });
    }
    await LearningService.saveExamAnswers(req.user.id, courseId, parsed.data.answers);
    res.status(200).json({ status: 'success', data: { success: true } });
  }
}

/**
 * POST /api/student/enroll
 * Đăng ký khoá học miễn phí. Yêu cầu JWT Bearer token.
 */
export async function enrollCourse(req: Request | any, res: Response) {
  const userId: string = req.user?.id;
  const { courseId } = req.body as { courseId?: string };

  if (!courseId) {
    throw new AppError('Thiếu courseId', 400);
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new AppError('Không tìm thấy khoá học', 404);
  }

  const settings = (course.settings as Record<string, unknown>) ?? {};
  const price = Number(settings.price ?? 0);
  if (price > 0) {
    throw new AppError('Khoá học này yêu cầu thanh toán. Vui lòng dùng luồng payment.', 402);
  }

  const existing = await prisma.enrollment.findFirst({
    where: { userId, courseId },
  });

  if (existing) {
    res.status(200).json({ status: 'success', message: 'Bạn đã đăng ký khoá học này rồi.', data: { alreadyEnrolled: true } });
    return;
  }

  await prisma.enrollment.create({
    data: { userId, courseId, status: 'ACTIVE' },
  });

  res.status(201).json({ status: 'success', message: 'Đăng ký khoá học thành công!', data: { enrolled: true } });
}

/**
 * GET /api/student/check-enrollment?courseId=...
 * Kiểm tra trạng thái đăng ký. Yêu cầu JWT Bearer token.
 */
export async function checkEnrollment(req: Request | any, res: Response) {
  const userId: string = req.user?.id;
  const { courseId } = req.query as { courseId?: string };

  if (!courseId) {
    res.status(400).json({ status: 'fail', message: 'Thiếu courseId' });
    return;
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId },
  });

  res.status(200).json({
    status: 'success',
    data: { isEnrolled: !!enrollment },
  });
}

/**
 * GET /api/student/course-content/:courseId?email=...
 * Trả nội dung khóa học + tiến độ học + điểm thi + trạng thái chứng chỉ.
 */
export async function getCourseContent(req: Request, res: Response) {
  const { courseId } = req.params;
  const email = req.query.email as string | undefined;

  if (!email) {
    res.status(400).json({ status: 'fail', message: 'Thiếu tham số email' });
    return;
  }

  const enrollment = await findEnrollmentByEmail(courseId, email);
  if (!enrollment) {
    res.status(403).json({ status: 'fail', message: 'Bạn chưa đăng ký khóa học này' });
    return;
  }

  const course = enrollment.course as any;
  const units = Array.isArray(course.units) ? course.units : [];
  const settings = (course.settings as Record<string, unknown>) ?? {};
  const requiredUnits = units.filter(
    (u: any) => typeof u.type !== 'string' || u.type.toLowerCase() !== 'exam',
  );
  const totalUnits = requiredUnits.length;
  const completedUnits = enrollment.progresses
    .filter((p: any) => p.isCompleted)
    .map((p: any) => p.unitId);
  const completedRequiredCount = requiredUnits.filter((u: any) => completedUnits.includes(u.unitId)).length;
  const progress = totalUnits > 0 ? Math.round((completedRequiredCount / totalUnits) * 100) : 0;

  const bestAttempt = enrollment.attempts[0];
  const examScore = bestAttempt?.score ?? 0;
  const isCertified = enrollment.status === 'COMPLETED';
  const certificateSerial = isCertified ? `NC-${enrollment.id.slice(-8).toUpperCase()}` : undefined;

  // Chuyển cấu trúc units phẳng → sections (frontend mong đợi course.sections)
  const sectionMap = new Map<string, any>();
  const orderedSectionIds: string[] = [];
  for (const unit of units) {
    const sid = unit.sectionId ?? 'default';
    if (!sectionMap.has(sid)) {
      sectionMap.set(sid, {
        _id: sid,
        title: unit.sectionTitle ?? 'Nội dung khóa học',
        isLocked: false,
        units: [],
      });
      orderedSectionIds.push(sid);
    }
    const unitType = unit.type?.toUpperCase() ?? 'DOCUMENT';
    const unitData: Record<string, unknown> = {
      _id: unit.unitId,
      title: unit.title,
      type: unitType,
      contentUrl: unit.contentUrl ?? unit.videoUrl ?? unit.documentUrl ?? '',
      duration: unit.duration ?? 0,
      isCompleted: completedUnits.includes(unit.unitId),
    };
    if ((unitType === 'QUIZ' || unitType === 'EXAM') && Array.isArray(unit.questions)) {
      // Không trả correctAnswer xuống client (chỉ chấm khi submit)
      unitData.questions = (unit.questions ?? []).map((q: any) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      }));
    }
    sectionMap.get(sid).units.push(unitData);
  }
  const sections = orderedSectionIds.map((id) => sectionMap.get(id));

  res.status(200).json({
    status: 'success',
    data: {
      course: {
        _id: course.id,
        id: course.id,
        name: course.title,
        title: course.title,
        description: course.description,
        price: settings.price ?? course.price ?? 0,
        instructor: course.instructor?.name ?? null,
        sections,
        settings,
      },
      completedUnits,
      progress,
      examScore,
      isCertified,
      certificateSerial,
    },
  });
}

/**
 * GET /api/student/:courseId/status?email=...
 * Trạng thái đủ điều kiện thi + nhận chứng chỉ.
 */
export async function getCourseStatus(req: Request, res: Response) {
  const { courseId } = req.params;
  const email = req.query.email as string | undefined;

  const emptyStatus = { isEligible: false, missingRequirements: [], examScore: 0, isEligibleForCertificate: false, progress: 0, passingScore: 80 };

  if (!email) {
    res.status(200).json({ status: 'success', data: emptyStatus });
    return;
  }

  const enrollment = await findEnrollmentByEmail(courseId, email);
  if (!enrollment) {
    res.status(200).json({ status: 'success', data: emptyStatus });
    return;
  }

  const course = enrollment.course as any;
  const units = Array.isArray(course.units) ? course.units as any[] : [];
  const completedUnitIds = enrollment.progresses
    .filter((p: any) => p.isCompleted)
    .map((p: any) => p.unitId);

  const requiredUnits = units.filter((u: any) => typeof u.type !== 'string' || u.type.toLowerCase() !== 'exam');
  const totalRequired = requiredUnits.length;
  const missingRequirements = requiredUnits
    .filter((u: any) => !completedUnitIds.includes(u.unitId))
    .map((u: any) => ({ id: u.unitId, title: u.title, type: 'UNIT', completed: 0, total: 1 }));

  const isEligible = missingRequirements.length === 0;
  const bestAttempt = enrollment.attempts[0];
  const settings = (course.settings as Record<string, unknown>) ?? {};
  const passingScore = Number(settings.passing_score ?? 80);
  const examScore = bestAttempt?.score ?? 0;
  const isEligibleForCertificate = enrollment.status === 'COMPLETED' || (bestAttempt?.isPassed ?? false);
  const completedRequiredCount = requiredUnits.filter((u: any) => completedUnitIds.includes(u.unitId)).length;
  const progress = totalRequired > 0 ? Math.round((completedRequiredCount / totalRequired) * 100) : 0;

  res.status(200).json({
    status: 'success',
    data: { isEligible, missingRequirements, examScore, isEligibleForCertificate, progress, passingScore },
  });
}

/**
 * GET /api/student/:courseId/exam
 * Trả câu hỏi bài thi (ẩn đáp án). Yêu cầu JWT Bearer.
 */
export async function getExamQuestions(req: Request | any, res: Response) {
  const { courseId } = req.params;
  const userId: string = req.user?.id;

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId },
  });
  if (!enrollment) {
    res.status(403).json({ status: 'fail', message: 'Bạn chưa đăng ký khóa học này' });
    return;
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    res.status(404).json({ status: 'fail', message: 'Không tìm thấy khóa học' });
    return;
  }

  const settings = (course.settings as any) ?? {};
  const examUnit = (course.units as any[]).find((u: any) => typeof u.type === 'string' && u.type.toLowerCase() === 'exam');
  if (!examUnit) {
    res.status(404).json({ status: 'fail', message: 'Khóa học này chưa có bài thi' });
    return;
  }

  // Ẩn đáp án trước khi gửi về client
  const questions = (examUnit.questions ?? []).map((q: any) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    // correctAnswer intentionally omitted
  }));

  res.status(200).json({
    status: 'success',
    data: {
      questions,
      duration: examUnit.duration ?? 2700,
      passingScore: settings.passing_score ?? 50,
    },
  });
}

/**
 * GET /api/student/my-certificates?email=...
 * Trả danh sách chứng chỉ (derive từ enrollment COMPLETED + passed exam).
 */
export async function getMyCertificates(req: Request, res: Response) {
  const email = req.query.email as string | undefined;

  if (!email) {
    res.status(200).json({ status: 'success', data: [] });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(200).json({ status: 'success', data: [] });
    return;
  }

  const completedEnrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: 'COMPLETED' },
    include: {
      course: { include: { instructor: { select: { name: true } } } },
      attempts: { orderBy: { score: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const certificates = completedEnrollments
    .filter((e) => e.attempts[0]?.isPassed)
    .map((e) => {
      const course = e.course as any;
      const serialNumber = `NC-${e.id.slice(-8).toUpperCase()}`;
      return {
        _id: e.id,
        serialNumber,
        issuedDate: e.updatedAt,
        courseId: {
          _id: course.id,
          name: course.title,
        },
        issuerId: {
          name: course.instructor?.name ?? 'Noble Cert',
        },
        userInfo: { name: user.name, email: user.email },
      };
    });

  res.status(200).json({ status: 'success', data: certificates });
}

/**
 * GET /api/student/my-courses?email=...
 * Trả danh sách enrollment kèm progress% cho dashboard student.
 */
export async function getStudentMyCourses(req: Request, res: Response) {
  const email = req.query.email as string | undefined;
  if (!email) {
    res.status(400).json({ status: 'fail', message: 'Thiếu tham số email' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(200).json({ status: 'success', data: [] });
    return;
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: { instructor: { select: { name: true } } },
      },
      progresses: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  const data = enrollments.map((e) => {
    const course = e.course as any;
    const settings = (course.settings as Record<string, unknown>) ?? {};
    const totalUnits = Array.isArray(course.units) ? course.units.length : 0;
    const completedUnits = e.progresses.filter((p: any) => p.isCompleted).length;
    const progress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

    return {
      _id: e.id,
      courseId: {
        _id: course.id,
        name: course.title,
        thumbnail: (settings.thumbnail as string | undefined) ?? null,
        author: course.instructor?.name ?? null,
      },
      status: e.status,
      progress,
      lastAccessedAt: e.updatedAt,
    };
  });

  res.status(200).json({ status: 'success', data });
}

