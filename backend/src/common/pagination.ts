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

export function getPageParams(req: Request | { query?: any } | any, defaultSort = 'createdAt'): PageParams {
  const query = (req && 'query' in req) ? req.query : req || {};
  const page = Math.max(1, Number(query.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20)));
  const search = typeof query.search === 'string' ? query.search.trim() : undefined;
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : defaultSort;
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';

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

export const parsePagination = getPageParams;

export function buildPagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
