import { Response } from 'express';

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function ok<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, data });
}

export function paginated<T>(
  res: Response,
  data: T[],
  pagination: Pagination,
  statusCode = 200,
): Response {
  return res.status(statusCode).json({ success: true, data, pagination });
}

export function created<T>(res: Response, data: T): Response {
  return ok(res, data, 201);
}
