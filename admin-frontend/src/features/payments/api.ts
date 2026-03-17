// src/features/payments/api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, buildQuery, type PaginatedResult } from '@/lib/api-client';

export interface AdminOrder {
  id: string;
  orderCode: number;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'MISMATCH' | 'PROCESSING';
  memo: string;
  paymentLink?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string } | null;
}

export interface OrderFilters {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  from?: string;
  to?: string;
}

export function useAdminOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'payments', 'orders', filters],
    queryFn: () =>
      adminApi.get<PaginatedResult<AdminOrder>>(`/payments/orders${buildQuery({ ...filters })}`),
  });
}

export function useAdminOrder(orderCode: number | string) {
  return useQuery({
    queryKey: ['admin', 'payments', 'orders', orderCode],
    queryFn: () => adminApi.get<AdminOrder>(`/payments/orders/${orderCode}`),
    enabled: !!orderCode,
  });
}

export function useSyncOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderCode: number) =>
      adminApi.post<{ status: string; orderCode: number; updatedAt: string }>(
        `/payments/orders/${orderCode}/sync`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'payments'] }),
  });
}
