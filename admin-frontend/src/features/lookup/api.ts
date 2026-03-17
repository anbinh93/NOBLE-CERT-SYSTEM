// src/features/lookup/api.ts
import { useQuery } from '@tanstack/react-query';
import { adminApi, buildQuery, type PaginatedResult } from '@/lib/api-client';

export interface AdminCert {
  serial: string;
  issuedAt: string;
  score: number | null;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string };
}

export function useAdminCerts(filters: { page?: number; pageSize?: number; q?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'certificates', filters],
    queryFn: () =>
      adminApi.get<PaginatedResult<AdminCert>>(`/certificates${buildQuery({ ...filters })}`),
  });
}

export function useSearchCerts(q: string) {
  return useQuery({
    queryKey: ['admin', 'lookup', 'certificates', q],
    queryFn: () => adminApi.get<AdminCert[]>(`/lookup/certificates${buildQuery({ q })}`),
    enabled: q.length >= 2,
  });
}

export interface LookupLearner {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  _count: { enrollments: number };
}

export interface LookupCourse {
  id: string;
  title: string;
  status: string;
  price: number;
}

export function useSearchLearners(q: string) {
  return useQuery({
    queryKey: ['admin', 'lookup', 'learners', q],
    queryFn: () =>
      adminApi.get<LookupLearner[]>(
        `/lookup/learners${buildQuery({ q })}`,
      ),
    enabled: q.length >= 2,
  });
}

export function useSearchCourses(q: string) {
  return useQuery({
    queryKey: ['admin', 'lookup', 'courses', q],
    queryFn: () =>
      adminApi.get<LookupCourse[]>(
        `/lookup/courses${buildQuery({ q })}`,
      ),
    enabled: q.length >= 2,
  });
}
