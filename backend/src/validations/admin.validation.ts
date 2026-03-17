// src/validations/admin.validation.ts
import { z } from 'zod/v4';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const ListQuery = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(50).optional().default(20),
  q: z.string().trim().optional(),
}).strict();

const IdParam = z.object({
  id: z.string().regex(objectIdRegex, 'id không đúng định dạng ObjectId'),
}).strict();

export const listCourses = z.object({ 
  query: ListQuery.extend({
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'price']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }).strict()
});

export const getCourse = z.object({
  params: IdParam,
});

export const createCourse = z.object({
  body: z.object({
    title: z.string().min(3, 'Title quá ngắn').max(100, 'Title quá dài'),
    instructorId: z.string().regex(objectIdRegex, 'instructorId không hợp lệ').optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  }).strict(),
});

export const updateCourse = z.object({
  params: IdParam,
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    instructorId: z.string().regex(objectIdRegex, 'instructorId không hợp lệ').optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
    units: z.array(z.unknown()).optional(),
  }).strict(),
});

export const listLearners = z.object({ query: ListQuery });

export const getLearner = z.object({
  params: IdParam,
});

export const getLearnerEnrollments = z.object({
  params: IdParam,
});

export const listUsers = z.object({
  query: ListQuery.extend({
    role: z.enum(['SUPER_ADMIN', 'INSTRUCTOR', 'STUDENT', 'STAFF']).optional(),
    isActive: z.coerce.boolean().optional(),
  }).strict(),
});

export const getUser = z.object({
  params: IdParam,
});

export const listOrders = z.object({
  query: ListQuery.extend({
    pageSize: z.coerce.number().min(1).max(100).optional().default(20),
    status: z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'MISMATCH']).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }).strict().refine((value) => {
    if (!value.from || !value.to) return true;
    return new Date(value.from).getTime() <= new Date(value.to).getTime();
  }, { message: 'from phải nhỏ hơn hoặc bằng to', path: ['from'] }),
});

export const getOrder = z.object({
  params: z.object({ orderCode: z.coerce.number() }),
});

export const syncOrder = z.object({
  params: z.object({ orderCode: z.coerce.number() }),
});

export const listCerts = z.object({
  query: ListQuery.extend({
    isValid: z.coerce.boolean().optional(),
  }).strict(),
});

export const revokeCert = z.object({
  params: IdParam,
  body: z.object({
    reason: z.string().max(500).optional(),
  }).strict(),
});

export const dashboardStats = z.object({
  query: z.object({}).strict(),
});

export const searchLookup = z.object({
  query: z.object({ q: z.string().trim().min(2).max(120) }).strict(),
});
