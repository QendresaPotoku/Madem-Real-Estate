import type { SelectQueryBuilder } from 'typeorm';
import type { PaginationQuery } from '../schemas/common';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Apply page/limit + optional sort to a query builder and return `{ data, meta }`.
 * `sortable` whitelists which columns may be sorted (maps API field → entity column).
 */
export async function paginate<T extends object>(
  qb: SelectQueryBuilder<T>,
  query: PaginationQuery,
  sortable: Record<string, string>,
  defaultSort: string,
): Promise<{ data: T[]; meta: PageMeta }> {
  const { page, limit, order } = query;
  const sortKey = query.sort && sortable[query.sort] ? sortable[query.sort] : defaultSort;

  qb.orderBy(sortKey, order).skip((page - 1) * limit).take(limit);

  const [data, total] = await qb.getManyAndCount();
  return {
    data,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}
