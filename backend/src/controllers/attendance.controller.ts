import { Request, Response } from "express";
import * as XLSX from "xlsx";
import { prisma } from "../config/database.config";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess } from "../utils/response";
import { AppError } from "../utils/AppError";

// ─── GET /admin/courses/:courseId/students ──────────────────────────
// Trả về danh sách học viên đã đăng ký + trạng thái điểm danh từng buổi
export const getCourseStudents = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, units: true },
  });
  if (!course) throw new AppError("Không tìm thấy khoá học", 404);

  // units là Json[] với shape { unitId, title, type, ... }
  const units = (course.units as any[]).map((u: any) => ({
    id: u.unitId as string,
    title: u.title as string,
    type: u.type as string,
  }));

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      progresses: true,
      attendances: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const students = enrollments.map((e) => ({
    enrollmentId: e.id,
    enrollmentStatus: e.status,
    student: e.user,
    attendance: units.map((unit) => {
      const record = e.attendances.find((a) => a.unitId === unit.id);
      return {
        unitId: unit.id,
        unitTitle: unit.title,
        attended: !!record,
        attendedAt: record?.attendedAt ?? null,
      };
    }),
    completedCount: e.progresses.filter((p) => p.isCompleted).length,
    totalUnits: units.length,
  }));

  sendSuccess(res, 200, {
    course: { id: course.id, title: course.title, units },
    students,
  });
});

// ─── POST /admin/courses/:courseId/attendance ────────────────────────
// Body: { studentId, unitId, note? }
// Điểm danh học viên → tự động cập nhật Progress + kiểm tra hoàn thành
export const markAttendance = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { studentId, unitId, note } = req.body;
  const markerId = (req as any).user.id as string;

  if (!studentId || !unitId) throw new AppError("studentId và unitId là bắt buộc", 400);

  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId, userId: studentId },
  });
  if (!enrollment) throw new AppError("Học viên chưa đăng ký khoá học này", 404);

  // Upsert Attendance (delete + create vì MongoDB có thể không có replica set)
  await prisma.attendance.deleteMany({
    where: { enrollmentId: enrollment.id, unitId },
  });
  const attendance = await prisma.attendance.create({
    data: {
      enrollmentId: enrollment.id,
      unitId,
      markedById: markerId,
      note: note ?? null,
    },
  });

  // Upsert Progress → isCompleted = true
  await prisma.progress.deleteMany({
    where: { enrollmentId: enrollment.id, unitId },
  });
  await prisma.progress.create({
    data: {
      enrollmentId: enrollment.id,
      unitId,
      isCompleted: true,
      timeSpent: 0,
      lastWatchedPosition: 0,
    },
  });

  // Kiểm tra hoàn thành toàn bộ khoá học
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { units: true },
  });
  const totalUnits = (course?.units as any[])?.length ?? 0;
  const completedCount = await prisma.progress.count({
    where: { enrollmentId: enrollment.id, isCompleted: true },
  });

  if (totalUnits > 0 && completedCount >= totalUnits) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "COMPLETED" },
    });
  }

  sendSuccess(res, 200, { attendance }, "Điểm danh thành công");
});

// ─── DELETE /admin/courses/:courseId/attendance ──────────────────────
// Body: { studentId, unitId }
export const unmarkAttendance = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { studentId, unitId } = req.body;

  if (!studentId || !unitId) throw new AppError("studentId và unitId là bắt buộc", 400);

  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId, userId: studentId },
  });
  if (!enrollment) throw new AppError("Không tìm thấy enrollment", 404);

  await prisma.attendance.deleteMany({
    where: { enrollmentId: enrollment.id, unitId },
  });

  await prisma.progress.updateMany({
    where: { enrollmentId: enrollment.id, unitId },
    data: { isCompleted: false },
  });

  // Hoàn tác trạng thái COMPLETED nếu còn thiếu buổi
  await prisma.enrollment.updateMany({
    where: { id: enrollment.id, status: "COMPLETED" },
    data: { status: "ACTIVE" },
  });

  sendSuccess(res, 200, null, "Đã hủy điểm danh");
});

// ─── POST /admin/courses/:courseId/enroll-bulk ───────────────────────
// Multipart: file (Excel/CSV, cột email hoặc cột đầu tiên)
export const bulkEnrollStudents = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  if (!req.file) throw new AppError("Vui lòng upload file Excel/CSV", 400);

  const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (!rows.length) throw new AppError("File rỗng hoặc không đúng định dạng", 400);

  const emails: string[] = rows
    .map((r: any) => {
      const val = r["email"] || r["Email"] || r["EMAIL"] || Object.values(r)[0] || "";
      return val.toString().trim().toLowerCase();
    })
    .filter((e: string) => e.includes("@") && e.includes("."));

  if (!emails.length) throw new AppError("Không tìm thấy email hợp lệ trong file", 400);

  const results = {
    enrolled: 0,
    alreadyEnrolled: 0,
    notFound: 0,
    errors: [] as string[],
  };

  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      results.notFound++;
      results.errors.push(`Không tìm thấy tài khoản: ${email}`);
      continue;
    }

    const existing = await prisma.enrollment.findFirst({
      where: { userId: user.id, courseId },
    });
    if (existing) {
      results.alreadyEnrolled++;
      continue;
    }

    await prisma.enrollment.create({
      data: { userId: user.id, courseId, status: "ACTIVE" },
    });
    results.enrolled++;
  }

  sendSuccess(
    res,
    200,
    results,
    `Đã xử lý ${emails.length} email: ${results.enrolled} mới, ${results.alreadyEnrolled} đã có, ${results.notFound} không tìm thấy`,
  );
});

// ─── POST /admin/courses/:courseId/enroll-single ─────────────────────
// Body: { email } hoặc { userId }
export const enrollSingleStudent = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { email, userId } = req.body;

  let user;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } else if (email) {
    user = await prisma.user.findUnique({ where: { email: email.toString().trim().toLowerCase() } });
  } else {
    throw new AppError("Cần cung cấp email hoặc userId", 400);
  }

  if (!user) throw new AppError("Không tìm thấy học viên", 404);

  const existing = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId },
  });
  if (existing) throw new AppError("Học viên đã được đăng ký vào khoá học này", 400);

  const enrollment = await prisma.enrollment.create({
    data: { userId: user.id, courseId, status: "ACTIVE" },
  });

  sendSuccess(
    res,
    201,
    { enrollment, student: { id: user.id, name: user.name, email: user.email } },
    "Đã thêm học viên vào khoá học",
  );
});
