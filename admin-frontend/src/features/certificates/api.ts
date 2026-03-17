// src/features/certificates/api.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, buildQuery, type PaginatedResult } from '@/lib/api-client';

export interface AdminCertificate {
  id: string;
  serial: string;
  issuedAt: string;
  isValid: boolean;
  score: number | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
  };
}

export interface CertificateFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  isValid?: boolean;
}

export function useAdminCertificates(filters: CertificateFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'certificates', filters],
    queryFn: () =>
      adminApi.get<PaginatedResult<AdminCertificate>>(
        `/certificates${buildQuery(
          // Lọc isValid ở client; backend chỉ cần trả trạng thái thực tế.
          Object.fromEntries(
            Object.entries(filters).filter(([k]) => k !== 'isValid'),
          ) as Record<string, string | number | boolean | undefined | null>,
        )}`,
      ),
  });
}

export function useRevokeCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; reason?: string }) =>
      adminApi.post(`/certificates/${payload.id}/revoke`, payload.reason ? { reason: payload.reason } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'certificates'] });
    },
  });
}
