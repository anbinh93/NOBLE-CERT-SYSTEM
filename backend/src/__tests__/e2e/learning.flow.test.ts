import request from 'supertest';
import app from '../../app'; // Import Express App
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('E2E Flow - Đăng ký, Học và Nộp bài thi', () => {
  let token: string;
  let testCourseId: string;

  beforeAll(async () => {
    // Clean DB trước khi test
    await prisma.user.deleteMany({});
    await prisma.course.deleteMany({});
    
    // 1. Tạo user và lấy Token
    const authRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@student.com', password: 'password123', name: 'Test Student' });
    
    token = authRes.body.data?.accessToken; // Fake test, giả sử field là data.accessToken

    // 2. Setup một khóa học miễn phí để test
    const course = await prisma.course.create({
      data: {
        title: 'E2E Testing Course',
        price: 0,
        status: 'PUBLISHED',
        instructorId: authRes.body.data?.user?.id || 'fake-id', // Fake instructor
        units: [{ unitId: 'unit-1', type: 'video', duration: 100 }],
        settings: { passing_score: 100 }
      }
    });
    testCourseId = course.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('[1] Tạo Payment Link (Free Course Auto-Enrollment)', async () => {
    const res = await request(app)
      .post('/api/v1/payment/create-link')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: testCourseId });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Đăng ký thành công khóa học miễn phí');
  });

  it('[2] Gửi Heartbeat Video', async () => {
    const res = await request(app)
      .post(`/api/v1/student/learn/${testCourseId}/unit/unit-1/heartbeat`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPosition: 30, timeAdded: 30 });

    expect(res.status).toBe(200);
    expect(res.body.data.timeSpent).toBe(30);
  });
});
