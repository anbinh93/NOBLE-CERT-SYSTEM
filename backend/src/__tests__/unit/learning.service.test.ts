import { LearningService } from '../../services/learning.service';
import { prismaMock } from '../client';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => require('../client').prismaMock),
}));

describe('LearningService - submitExam', () => {
  const mockCourseId = 'course-123';
  const mockUserId = 'user-123';
  const mockEnrollmentId = 'enroll-123';

  const mockCourse = {
    id: mockCourseId,
    settings: { passing_score: 80 },
    units: [
      {
        type: 'exam',
        questions: [
          { id: 'q1', correctAnswer: 'A' },
          { id: 'q2', correctAnswer: 'B' },
        ]
      }
    ]
  };

  it('Nên trả về Passed khi điểm số >= 80%', async () => {
    // Setup Mock Data
    prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
    prismaMock.enrollment.findFirst.mockResolvedValue({ id: mockEnrollmentId } as any);
    prismaMock.examAttempt.create.mockResolvedValue({ id: 'attempt-1' } as any);
    prismaMock.enrollment.update.mockResolvedValue({} as any);

    const userAnswers = [
      { questionId: 'q1', answer: 'A' }, // Đúng
      { questionId: 'q2', answer: 'B' }  // Đúng
    ];

    const result = await LearningService.submitExam(mockUserId, mockCourseId, userAnswers);

    expect(result.score).toBe(100);
    expect(result.isPassed).toBe(true);
    expect(prismaMock.enrollment.update).toHaveBeenCalledWith({
      where: { id: mockEnrollmentId },
      data: { status: 'COMPLETED' }
    });
  });

  it('Nên trả về Failed khi điểm số < 80%', async () => {
    prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
    prismaMock.enrollment.findFirst.mockResolvedValue({ id: mockEnrollmentId } as any);
    prismaMock.examAttempt.create.mockResolvedValue({ id: 'attempt-2' } as any);

    const userAnswers = [
      { questionId: 'q1', answer: 'A' }, // Đúng
      { questionId: 'q2', answer: 'C' }  // Sai
    ];

    const result = await LearningService.submitExam(mockUserId, mockCourseId, userAnswers);

    expect(result.score).toBe(50);
    expect(result.isPassed).toBe(false);
    expect(prismaMock.enrollment.update).not.toHaveBeenCalled(); // Không update trạng thái
  });
});
