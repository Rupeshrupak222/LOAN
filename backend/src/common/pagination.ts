import { Request } from 'express';

export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortDir: 'asc' | 'desc';
}

export function getPageParams(req: Request, defaultSort = 'createdAt'): PageParams {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : defaultSort;
  const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
    search: search || undefined,
    sortBy,
    sortDir,
  };
}

export function buildPagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
