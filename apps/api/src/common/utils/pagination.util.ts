import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export function normalizeSortOrder(order?: string): 'ASC' | 'DESC' {
  return order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}

export async function paginateQueryBuilder<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  query: PaginationQueryDto,
): Promise<PaginatedResult<T>> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const [items, total] = await queryBuilder
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount();

  return {
    items,
    meta: buildPaginationMeta(page, pageSize, total),
  };
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
