import { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function getPagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt((req.query.page as string) || "1"));
  const limit = Math.min(100, parseInt((req.query.limit as string) || "10"));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function getPaginationMeta(
  total: number,
  params: PaginationParams,
): PaginationMeta {
  const totalPages = Math.ceil(total / params.limit);

  return {
    total,
    page: params.page,
    limit: params.limit,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}
