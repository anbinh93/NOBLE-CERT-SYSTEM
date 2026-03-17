import { prisma } from './config/database.config';
async function main() {
  const courseId = '69ab043885e4f145461ec09d';
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (course) {
    const units = course.units as any[];
    const hasExam = units.some(u => u.type === 'exam' || u.type === 'EXAM');
    if (!hasExam) {
      units.push({
        unitId: 'rn-exam-1',
        title: 'Trắc nghiệm React Native',
        type: 'exam',
        questions: [
          {
            id: 'q1',
            question: 'React Native dùng để làm gì?',
            options: ['Web', 'Mobile', 'Desktop'],
            correctAnswer: 'Mobile'
          }
        ]
      });
      await prisma.course.update({
        where: { id: courseId },
        data: { units }
      });
      console.log("Exam unit added successfully to course", courseId);
    } else {
      console.log("Exam unit already exists in course", courseId);
    }
  } else {
    console.log("COURSE NOT FOUND");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
