import { prisma } from './config/database.config';

async function main() {
  const courses = await prisma.course.findMany();
  for (const course of courses) {
    const units = course.units as any[];
    const hasExam = units.some(u => typeof u.type === 'string' && u.type.toLowerCase() === 'exam');
    if (!hasExam) {
      units.push({
        unitId: `exam-auto-${course.id}`,
        title: `Bài kiểm tra cuối khóa: ${course.title}`,
        type: 'exam',
        questions: [
          {
            id: 'q1',
            question: 'Kiến thức quan trọng nhất trong khóa học này là gì?',
            options: ['Tự học', 'Thực hành', 'Kiên trì', 'Tất cả các ý trên'],
            correctAnswer: 'Tất cả các ý trên'
          }
        ]
      });
      await prisma.course.update({
        where: { id: course.id },
        data: { units }
      });
      console.log(`✅ Đã thêm bài kiểm tra cho khóa học: ${course.title}`);
    } else {
      console.log(`ℹ️ Khóa học đã có bài kiểm tra: ${course.title}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
