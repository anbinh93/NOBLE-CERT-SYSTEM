import { Request } from 'express';

export interface PaginationOptions {
  defaultPageSize?: number;
  maxPageSize?: number;
  qKey?: string;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  q: string;
}

export function parsePagination(
  req: Request,
  { defaultPageSize = 20, maxPageSize = 50, qKey = 'q' }: PaginationOptions = {},
): PaginationResult {
  const pageRaw = Number(req.query.page);
  const sizeRaw = Number(req.query.pageSize);

  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);
  const requestedSize = Number.isFinite(sizeRaw) ? sizeRaw : defaultPageSize;
  const pageSize = Math.min(maxPageSize, Math.max(1, requestedSize));

  const q = (req.query[qKey] as string | undefined) || '';

  return { page, pageSize, q };
}

