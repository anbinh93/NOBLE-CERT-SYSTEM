// src/features/dashboard/api.ts
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';

export interface DashboardStats {
  revenue: number;
  totalEnrollments: number;
  newUsers: number;
  activeCourses: number;
  revenueTrend: number;
  enrollmentsTrend: number;
  usersTrend: number;
  coursesTrend: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminApi.get<DashboardStats>('/dashboard/stats'),
    // Cache stats longer to avoid flickering on dashboard
    staleTime: 5 * 60 * 1000,
  });
}
