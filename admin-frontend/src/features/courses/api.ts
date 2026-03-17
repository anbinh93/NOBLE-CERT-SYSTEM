// src/features/courses/api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, buildQuery, type PaginatedResult } from '@/lib/api-client';

export interface AdminCourse {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  instructorId?: string;
  settings?: Record<string, unknown> | null;
  units?: unknown[];
  slug?: string;
  thumbnail?: string | null;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
  instructor: { id: string; name: string; email: string };
  _count: { enrollments: number };
}

export interface CourseFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAdminCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'courses', filters],
    queryFn: () =>
      adminApi.get<PaginatedResult<AdminCourse>>(
        `/courses${buildQuery({ ...filters })}`,
      ),
  });
}

export function useAdminCourse(id: string) {
  return useQuery({
    queryKey: ['admin', 'courses', id],
    queryFn: () => adminApi.get<AdminCourse>(`/courses/${id}`),
    enabled: !!id,
  });
}

export interface CreateCoursePayload {
  title: string;
  instructorId?: string;
  description?: string;
  price?: number;
  settings?: Record<string, unknown>;
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCoursePayload) =>
      adminApi.post<AdminCourse>('/courses', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });
}

export function useUpdateCourse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdminCourse>) =>
      adminApi.patch<AdminCourse>(`/courses/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
      qc.invalidateQueries({ queryKey: ['admin', 'courses', id] });
    },
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.patch<AdminCourse>(`/courses/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });
}

export function useArchiveCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.patch<AdminCourse>(`/courses/${id}/archive`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.delete(`/courses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });
}
