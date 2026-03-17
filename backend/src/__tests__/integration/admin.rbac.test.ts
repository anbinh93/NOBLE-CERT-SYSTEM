import request from 'supertest';
import app from '../../app';
import { PrismaClient, Role } from '@prisma/client';
import { signToken } from '../../utils/jwt';

const prisma = new PrismaClient();

describe('Integration Test - Admin RBAC & Validation Matrix', () => {
  let superAdminToken: string;
  let staffToken: string;
  let studentToken: string;
  let instructorToken: string;

  beforeAll(async () => {
    // Clear old test users if any, or just create dummy JWTs directly
    // Since we just need tokens for RBAC tests, we can generate them directly if signToken takes an id
    // However, protect middleware checks if user exists in DB. So we must create them.
    
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-rbac-' } }
    });

    const createTestUser = async (role: Role, email: string) => {
      const user = await prisma.user.create({
        data: {
          email,
          password: 'hashed-password',
          name: `Test ${role}`,
          role,
        }
      });
      return signToken(user.id);
    };

    superAdminToken = await createTestUser(Role.SUPER_ADMIN, 'test-rbac-superadmin@example.com');
    staffToken = await createTestUser(Role.STAFF, 'test-rbac-staff@example.com');
    studentToken = await createTestUser(Role.STUDENT, 'test-rbac-student@example.com');
    instructorToken = await createTestUser(Role.INSTRUCTOR, 'test-rbac-instructor@example.com');
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-rbac-' } }
    });
    await prisma.$disconnect();
  });

  describe('RBAC Matrix (Access Control)', () => {
    const endpoints = [
      { method: 'get', path: '/api/v1/admin/courses' },
      { method: 'get', path: '/api/v1/admin/learners' },
      { method: 'get', path: '/api/v1/admin/payments/orders' },
      { method: 'get', path: '/api/v1/admin/lookup/certificates' },
      { method: 'get', path: '/api/v1/admin/dashboard/stats' },
      { method: 'get', path: '/api/v1/admin/users' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`Should DENY access to ${path} for unauthenticated users (401)`, async () => {
        const res = await (request(app) as any)[method](path);
        expect(res.status).toBe(401);
      });

      it(`Should DENY access to ${path} for STUDENT (403)`, async () => {
        const res = await (request(app) as any)[method](path)
          .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(403);
      });

      it(`Should DENY access to ${path} for INSTRUCTOR (403)`, async () => {
        const res = await (request(app) as any)[method](path)
          .set('Authorization', `Bearer ${instructorToken}`);
        expect(res.status).toBe(403);
      });

      it(`Should ALLOW access to ${path} for STAFF (200)`, async () => {
        const res = await (request(app) as any)[method](path)
          .set('Authorization', `Bearer ${staffToken}`);
        expect(res.status).toBe(200);
      });

      it(`Should ALLOW access to ${path} for SUPER_ADMIN (200)`, async () => {
        const res = await (request(app) as any)[method](path)
          .set('Authorization', `Bearer ${superAdminToken}`);
        expect(res.status).toBe(200);
      });
    });
  });

  describe('RBAC Action-level restrictions', () => {
    it('Should DENY STAFF deleting courses (403)', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/courses/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Validation Edge Cases (Zod Schemas)', () => {
    it('Should return 400 Bad Request when pageSize is invalid (>100)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/courses?pageSize=500')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it('Should return 400 Bad Request when order status is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/admin/payments/orders?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    it('Should apply default pagination values when absent', async () => {
      const res = await request(app)
        .get('/api/v1/admin/courses')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(res.status).toBe(200);
      // Validates response payload structure (envelope)
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('pageSize');
    });

    it('Should return 400 when lookup query is too short', async () => {
      const res = await request(app)
        .get('/api/v1/admin/lookup/courses?q=a')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Contract envelope checks', () => {
    it('Should return dashboard stats shape', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('revenue');
      expect(res.body.data).toHaveProperty('totalEnrollments');
    });
  });
});
