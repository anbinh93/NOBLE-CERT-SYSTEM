// src/features/learners/api.ts
import { useQuery } from '@tanstack/react-query';
import { adminApi, buildQuery, type PaginatedResult } from '@/lib/api-client';

export interface AdminLearner {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  _count: { enrollments: number };
  certifiedCount?: number;
}

export interface LearnerEnrollment {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  serial: string | null;
  course: { id: string; title: string; status: string };
  progress: { completedUnits: number; totalUnits: number | null };
  bestAttempt: { score: number; isPassed: boolean; createdAt: string } | null;
}

export function useAdminLearners(filters: { page?: number; pageSize?: number; q?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'learners', filters],
    queryFn: () =>
      adminApi.get<PaginatedResult<AdminLearner>>(`/learners${buildQuery({ ...filters })}`),
  });
}

export function useAdminLearner(id: string) {
  return useQuery({
    queryKey: ['admin', 'learners', id],
    queryFn: () => adminApi.get<AdminLearner>(`/learners/${id}`),
    enabled: !!id,
  });
}

export function useLearnerEnrollments(id: string) {
  return useQuery({
    queryKey: ['admin', 'learners', id, 'enrollments'],
    queryFn: () =>
      adminApi.get<{ items: LearnerEnrollment[]; total: number }>(`/learners/${id}/enrollments`),
    enabled: !!id,
  });
}
