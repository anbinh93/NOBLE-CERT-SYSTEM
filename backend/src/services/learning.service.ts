import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';

/** Normalize unit type để so sánh không phân biệt hoa thường */
function normalizeType(type: unknown): string {
  return typeof type === 'string' ? type.toLowerCase() : '';
}

export class LearningService {

  // ─── 1. Heartbeat Sync ──────────────────────────────────────────────────
  /**
   * Nhận tọa độ thời gian mỗi 30s từ client.
   * Cộng dồn timeSpent và cập nhật lastWatchedPosition.
   */
  static async syncHeartbeat(
    userId: string,
    courseId: string,
    unitId: string,
    currentPosition: number,
    timeAdded: number,
  ) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId, status: 'ACTIVE' },
    });
    if (!enrollment) throw new AppError('Bạn chưa đăng ký khóa học này', 403);

    return prisma.progress.upsert({
      where: { enrollmentId_unitId: { enrollmentId: enrollment.id, unitId } },
      update: {
        lastWatchedPosition: currentPosition,
        timeSpent: { increment: timeAdded },
      },
      create: {
        enrollmentId: enrollment.id,
        unitId,
        lastWatchedPosition: currentPosition,
        timeSpent: timeAdded,
      },
    });
  }

  // ─── 2. Complete Unit ───────────────────────────────────────────────────
  /**
   * Đánh dấu hoàn thành unit sau khi xác minh thời gian học.
   * clientDuration: duration thực tế của video (giây) do frontend gửi lên từ onDuration callback.
   * Được ưu tiên hơn duration trong DB vì DB có thể lưu metadata sai / dùng placeholder video.
   */
  static async completeUnit(
    userId: string,
    courseId: string,
    unitId: string,
    clientDuration?: number,
    forceComplete = false,
  ) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    const units = course.units as Record<string, unknown>[];
    const unitConfig = units.find((u) => u.unitId === unitId);
    if (!unitConfig) throw new AppError('Unit không tồn tại', 404);

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new AppError('Bạn chưa đăng ký khóa học này', 403);

    const progress = await prisma.progress.findUnique({
      where: { enrollmentId_unitId: { enrollmentId: enrollment.id, unitId } },
    });

    if (!forceComplete) {
      LearningService.enforceWatchTime(unitConfig, progress, clientDuration);
    }

    // ÁP DỤNG TRANSACTION
    await prisma.$transaction(async (tx) => {
      await tx.progress.upsert({
        where: { enrollmentId_unitId: { enrollmentId: enrollment.id, unitId } },
        update: { isCompleted: true },
        create: {
          enrollmentId: enrollment.id,
          unitId,
          isCompleted: true,
          lastWatchedPosition: progress?.lastWatchedPosition ?? 0,
          timeSpent: progress?.timeSpent ?? 0,
        },
      });

      await LearningService.issueCertificateIfEligibleTx(tx, enrollment.id, courseId, units);
    });

    return { success: true, message: 'Hoàn thành bài học' };
  }

  // ─── 3a. Exam Session (OpenEdX-style: track in-progress, restore on reload) ──
  /**
   * Bắt đầu phiên làm bài thi. Tạo ExamSession, trả về đề + thời gian.
   */
  static async startExamSession(userId: string, courseId: string) {
    const { questions, duration, passingScore } = await this.getExamMeta(courseId);
    const enrollment = await prisma.enrollment.findFirst({ where: { userId, courseId } });
    if (!enrollment) throw new AppError('Bạn chưa đăng ký khóa học này', 403);

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + (duration ?? 2700) * 1000);

    await prisma.examSession.updateMany({
      where: { enrollmentId: enrollment.id, courseId, status: 'IN_PROGRESS' },
      data: { status: 'EXPIRED' },
    });

    const session = await prisma.examSession.create({
      data: {
        enrollmentId: enrollment.id,
        courseId,
        startedAt,
        expiresAt,
        answers: {},
        status: 'IN_PROGRESS',
      },
    });

    return {
      sessionId: session.id,
      questions,
      duration: duration ?? 2700,
      passingScore: passingScore ?? 80,
      timeLeft: duration ?? 2700,
      answers: {},
    };
  }

  /**
   * Lấy phiên làm bài đang diễn ra (để restore khi reload).
   */
  static async getExamSession(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findFirst({ where: { userId, courseId } });
    if (!enrollment) return null;

    const session = await prisma.examSession.findFirst({
      where: { enrollmentId: enrollment.id, courseId, status: 'IN_PROGRESS' },
      orderBy: { startedAt: 'desc' },
    });
    if (!session) return null;

    const now = new Date();
    if (now >= session.expiresAt) {
      await prisma.examSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
      return null;
    }

    const timeLeft = Math.max(0, Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000));
    const { questions, duration, passingScore } = await this.getExamMeta(courseId);
    const answers = (session.answers as Record<string, string>) ?? {};

    return {
      sessionId: session.id,
      questions,
      duration,
      passingScore,
      timeLeft,
      answers,
    };
  }

  /**
   * Lưu câu trả lời (auto-save khi user chọn đáp án).
   */
  static async saveExamAnswers(userId: string, courseId: string, answers: Record<string, string>) {
    const enrollment = await prisma.enrollment.findFirst({ where: { userId, courseId } });
    if (!enrollment) throw new AppError('Bạn chưa đăng ký khóa học này', 403);

    const session = await prisma.examSession.findFirst({
      where: { enrollmentId: enrollment.id, courseId, status: 'IN_PROGRESS' },
      orderBy: { startedAt: 'desc' },
    });
    if (!session) throw new AppError('Không tìm thấy phiên làm bài đang hoạt động', 404);

    const now = new Date();
    if (now >= session.expiresAt) {
      await prisma.examSession.update({ where: { id: session.id }, data: { status: 'EXPIRED' } });
      throw new AppError('Thời gian làm bài đã hết', 400);
    }

    await prisma.examSession.update({
      where: { id: session.id },
      data: { answers },
    });
    return { success: true };
  }

  private static async getExamMeta(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);
    const settings = (course.settings as Record<string, unknown>) ?? {};
    const examUnit = (course.units as Record<string, unknown>[]).find(
      (u) => normalizeType(u.type) === 'exam',
    );
    if (!examUnit) throw new AppError('Bài thi không tồn tại', 404);
    const questions = ((examUnit.questions as Array<Record<string, unknown>> | undefined) ?? []).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));
    const duration = Number(examUnit.duration ?? 2700);
    const passingScore = Number(settings.passing_score ?? 80);
    return { questions, duration, passingScore };
  }

  // ─── 3b. Submit Exam ─────────────────────────────────────────────────────
  /**
   * Tự động chấm điểm bài thi và ghi nhận Attempt History.
   * Ưu tiên dùng answers từ ExamSession nếu đang có phiên IN_PROGRESS.
   */
  static async submitExam(
    userId: string,
    courseId: string,
    rawAnswers: unknown,
  ) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    const settings = (course.settings as Record<string, unknown>) ?? {};
    const passingScore = Number(settings.passing_score ?? 80);

    const examUnit = (course.units as Record<string, unknown>[]).find(
      (u) => normalizeType(u.type) === 'exam',
    );
    if (!examUnit) throw new AppError('Bài thi không tồn tại trong hệ thống', 404);

    const systemQuestions = (examUnit.questions as Record<string, unknown>[]) ?? [];
    if (systemQuestions.length === 0) throw new AppError('Bài thi chưa có câu hỏi', 404);

    // Chấp nhận array [{ questionId, answer }] hoặc object { questionId: answer }
    const userAnswers: { questionId: string; answer: string }[] = Array.isArray(rawAnswers)
      ? (rawAnswers as { questionId: string; answer: string }[])
      : Object.entries(rawAnswers as Record<string, string>).map(([questionId, answer]) => ({
          questionId,
          answer,
        }));

    const correctCount = userAnswers.reduce((count, ans) => {
      const question = systemQuestions.find((q) => q.id === ans.questionId);
      return question && question.correctAnswer === ans.answer ? count + 1 : count;
    }, 0);

    const score = (correctCount / systemQuestions.length) * 100;
    const isPassed = score >= passingScore;

    const enrollment = await prisma.enrollment.findFirst({ where: { userId, courseId } });
    if (!enrollment) throw new AppError('Bạn chưa đăng ký khóa học này', 403);

    // ÁP DỤNG TRANSACTION: tạo Attempt + đóng session nếu có
    const attempt = await prisma.$transaction(async (tx) => {
      const newAttempt = await tx.examAttempt.create({
        data: { enrollmentId: enrollment.id, courseId, score, isPassed, answers: userAnswers },
      });

      await tx.examSession.updateMany({
        where: { enrollmentId: enrollment.id, courseId, status: 'IN_PROGRESS' },
        data: { status: 'SUBMITTED' },
      });

      if (isPassed) {
        await LearningService.issueCertificateIfEligibleTx(
          tx,
          enrollment.id,
          courseId,
          course.units as Record<string, unknown>[],
        );
      }
      return newAttempt;
    });

    return { score, passed: isPassed, isPassed, attemptId: attempt.id };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Chốt chặn thời gian học:
   * - Video: (lastWatchedPosition / effectiveDuration) >= 0.95
   *   effectiveDuration = clientDuration nếu có, fallback về unitConfig.duration
   *   clientDuration được truyền từ onDuration callback của YouTube (duration thực tế)
   * - Document: timeSpent >= 70% estimatedTime
   */
  private static enforceWatchTime(
    unitConfig: Record<string, unknown>,
    progress: { lastWatchedPosition: number; timeSpent: number } | null,
    clientDuration?: number,
  ) {
    const unitType = normalizeType(unitConfig.type);
    const lastPos = progress?.lastWatchedPosition ?? 0;
    const timeSpent = progress?.timeSpent ?? 0;

    if (unitType === 'video') {
      // Ưu tiên clientDuration (duration thực tế từ YouTube) hơn DB duration
      const effectiveDuration = clientDuration && clientDuration > 0
        ? clientDuration
        : Number(unitConfig.duration ?? 0);

      if (effectiveDuration === 0) return; // Không có thời lượng → bỏ qua

      // CẬP NHẬT: Đổi 0.9 (90%) thành 0.95 (95%) theo yêu cầu Task
      const required = effectiveDuration * 0.95;
      const isEligible = lastPos >= required || timeSpent >= required;
      if (!isEligible) {
        throw new AppError('Bạn chưa hoàn thành đủ thời lượng video yêu cầu', 400);
      }
    }

    if (unitType === 'document') {
      const estimatedTime = Number(unitConfig.estimatedTime ?? 0);
      if (estimatedTime === 0) return;

      if (timeSpent < estimatedTime * 0.7) {
        throw new AppError('Bạn đọc tài liệu quá nhanh, vui lòng đọc kỹ hơn', 400);
      }
    }
  }

  /**
   * Helper dùng chung bên trong một Prisma Transaction để đảm bảo tính an toàn (ACID)
   */
  private static async issueCertificateIfEligibleTx(
    tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    enrollmentId: string,
    courseId: string,
    allUnits: Record<string, unknown>[],
  ): Promise<void> {
    const enrollment = await tx.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        progresses: { where: { isCompleted: true } },
        attempts: { where: { isPassed: true }, take: 1 },
      },
    });

    if (!enrollment || enrollment.status === 'COMPLETED' || enrollment.status === 'PENDING_PAYMENT') return;

    const nonExamUnits = allUnits.filter((u) => normalizeType(u.type) !== 'exam');
    const completedIds = new Set(enrollment.progresses.map((p) => p.unitId));
    const allUnitsDone = nonExamUnits.every((u) => completedIds.has(u.unitId as string));
    const hasPassed = enrollment.attempts.length > 0;

    if (!allUnitsDone || !hasPassed) return;

    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'PENDING_PAYMENT' },
    });
  }
}
