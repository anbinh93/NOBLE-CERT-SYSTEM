// src/lib/api-client.ts
// Typed API client cho admin-frontend. Tự động gắn Bearer token từ Zustand store.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const ADMIN_BASE = `${API_BASE}/api/v1/admin`;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  // Zustand store đã persist vào localStorage
  const raw = typeof window !== 'undefined' ? localStorage.getItem('noble-cert-auth') : null;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.user?.accessToken ?? parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${ADMIN_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      (json as { message?: string })?.message ?? `HTTP ${res.status}`,
      res.status,
      json,
    );
  }

  return (json?.data ?? json) as T;
}

async function apiFetchForm<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();

  const res = await fetch(`${ADMIN_BASE}${path}`, {
    method: 'POST',
    body: form,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // IMPORTANT: do NOT set Content-Type for FormData; browser will set boundary.
    },
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      (json as { message?: string })?.message ?? `HTTP ${res.status}`,
      res.status,
      json,
    );
  }
  return (json?.data ?? json) as T;
}

export const adminApi = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, form: FormData) => apiFetchForm<T>(path, form),
};

// ─── Pagination helper ────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
