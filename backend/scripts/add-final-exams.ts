/**
 * Script: Chèn bài thi cuối khóa cho tất cả khóa học chưa có.
 * - Mỗi bài thi gồm 10 câu hỏi
 * - Nội dung câu hỏi: "Câu hỏi x" (x = 1..10)
 * - Mỗi câu có 4 đáp án: 3 đáp án sai + 1 đáp án đúng
 *
 * Chạy: npx ts-node scripts/add-final-exams.ts
 * hoặc: yarn ts-node scripts/add-final-exams.ts
 */

import { prisma } from '../src/config/database.config';

const CORRECT_LABEL = 'Đáp án đúng';
const WRONG_LABELS = ['Đáp án sai 1', 'Đáp án sai 2', 'Đáp án sai 3'];

function createExamQuestions(count: number = 10) {
  const questions = [];
  for (let x = 1; x <= count; x++) {
    const options = [...WRONG_LABELS, CORRECT_LABEL];
    // Xáo trộn thứ tự đáp án (đặt đúng ở vị trí ngẫu nhiên)
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    questions.push({
      id: `q${x}`,
      question: `Câu hỏi ${x}`,
      options,
      correctAnswer: CORRECT_LABEL,
    });
  }
  return questions;
}

async function main() {
  console.log('--- Bắt đầu chèn bài thi cuối khóa ---\n');

  const courses = await prisma.course.findMany({
    select: { id: true, title: true, units: true },
  });

  let added = 0;
  let skipped = 0;

  for (const course of courses) {
    const units = (course.units ?? []) as Array<{ type?: string; unitId?: string }>;
    const hasExam = units.some(
      (u) => typeof u.type === 'string' && u.type.toLowerCase() === 'exam'
    );

    if (hasExam) {
      console.log(`⏭️  Bỏ qua (đã có exam): ${course.title}`);
      skipped++;
      continue;
    }

    const examUnit = {
      unitId: `exam-final-${course.id}`,
      title: 'Bài thi cuối khóa',
      type: 'exam',
      duration: 2700, // 45 phút
      questions: createExamQuestions(10),
    };

    units.push(examUnit);
    await prisma.course.update({
      where: { id: course.id },
      data: { units },
    });

    console.log(`✅ Đã thêm bài thi (10 câu) cho: ${course.title}`);
    added++;
  }

  console.log(`\n--- Hoàn thành: thêm ${added}, bỏ qua ${skipped} ---`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
