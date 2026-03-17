// src/services/course.service.ts
import { prisma } from '../config/database.config';
import { AppError } from '../utils/AppError';
import { CourseStatus } from '@prisma/client';

/** Chuyển tiêu đề thành URL slug (vi-safe) */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export class CourseService {
  /**
   * Lấy danh sách khoá học đã công khai (PUBLISHED) cho trang Landing Page.
   * Trả về shape tương thích với FeaturedCoursesCarousel của frontend.
   */
  static async getPublishedCourses(limit = 20) {
    const courses = await prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        settings: true,
        instructor: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return courses.map((c) => {
      const settings = (c.settings as Record<string, unknown>) ?? {};
      return {
        _id: c.id,
        name: c.title,
        slug: (settings.slug as string | undefined) ?? slugify(c.title),
        thumbnail: (settings.thumbnail as string | undefined) ?? null,
        category: (settings.category as string | undefined) ?? null,
        description: c.description ?? '',
        price: c.price,
        author: c.instructor.name,
      };
    });
  }

  /**
   * Lấy chi tiết một khóa học public dựa trên slug
   */
  static async getCourseBySlug(slug: string) {
    // Để cho nhanh và tái sử dụng logic mapping, lấy tất cả khóa học public 
    // và lọc theo slug. (Trong thực tế nên query DB trực tiếp nếu schema hỗ trợ)
    const allCourses = await this.getPublishedCourses(1000);
    const course = allCourses.find(c => c.slug === slug);
    
    if (!course) {
        throw new AppError('Không tìm thấy khóa học', 404);
    }
    
    // Nếu frontend hiển thị section/units trong CourseDetailPage, ta nên 
    // lấy thêm data units từ DB cho khóa học này.
    const dbCourse = await prisma.course.findUnique({
      where: { id: course._id },
      select: { units: true }
    });

    const rawUnits = dbCourse?.units || [];
    const sections = rawUnits.length > 0 ? [{
      title: 'Chương trình học',
      units: rawUnits
    }] : [];

    return {
      ...course,
      sections
    };
  }

  // 1. Khởi tạo khoá học (Draft)
  static async createDraft(instructorId: string, title: string) {
    if (!title) {
      throw new AppError('Tiêu đề khóa học là bắt buộc!', 400);
    }

    const course = await prisma.course.create({
      data: {
        title,
        instructorId,
        status: CourseStatus.DRAFT,
        units: [], // Khởi tạo mảng bài học rỗng
        settings: {
          passing_score: 80,
          is_sequential: true
        } as any
      }
    });

    return course;
  }

  // 2. Cập nhật Metadata và Syllabus (Sử dụng Transaction)
  static async updateCourse(instructorId: string, courseId: string, updateData: any) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    
    if (!course) throw new AppError('Không tìm thấy khóa học!', 404);
    if (course.instructorId !== instructorId) {
      throw new AppError('Bạn không có quyền chỉnh sửa khóa học này!', 403);
    }

    // Sử dụng transaction để đảm bảo tính toàn vẹn nếu có nhiều thao tác phụ thuộc
    const updatedCourse = await prisma.$transaction(async (tx: any) => {
      return tx.course.update({
        where: { id: courseId },
        data: {
          title: updateData.title !== undefined ? updateData.title : course.title,
          description: updateData.description !== undefined ? updateData.description : course.description,
          price: updateData.price !== undefined ? updateData.price : course.price,
          settings: updateData.settings !== undefined ? updateData.settings : course.settings as any,
          units: updateData.units !== undefined ? updateData.units : course.units as any,
        }
      });
    });

    return updatedCourse;
  }

  // 3. Logic chốt chặn xuất bản khóa học
  static async publishCourse(instructorId: string, courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) throw new AppError('Không tìm thấy khóa học!', 404);
    if (course.instructorId !== instructorId) {
      throw new AppError('Bạn không có quyền xuất bản khóa học này!', 403);
    }

    // --- LOGIC CHỐT CHẶN (VALIDATION) ---
    if (!course.description || course.description.trim() === '') {
      throw new AppError('Khóa học cần có mô tả trước khi xuất bản.', 400);
    }
        
    const units = course.units as any[];
    if (!units || units.length === 0) {
      throw new AppError('Khóa học phải có ít nhất 1 bài học (Unit).', 400);
    }

    // Kiểm tra phải có ít nhất 1 bài kiểm tra (Quiz/Exam)
    const hasExam = units.some((unit: any) => unit.type === 'quiz' || unit.type === 'exam');
    if (!hasExam) {
      throw new AppError('Khóa học phải có ít nhất 1 bài kiểm tra (Quiz/Exam) để cấp chứng chỉ.', 400);
    }

    // Chuyển trạng thái sang PUBLISHED
    const publishedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.PUBLISHED }
    });

    return publishedCourse;
  }
}
