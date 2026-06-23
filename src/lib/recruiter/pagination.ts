export const TABLE_PAGE_SIZE = 10;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parsePage(value?: string | number | null) {
  const page = Number(value) || 1;
  return Math.max(1, Math.floor(page));
}

export function paginateArray<T>(
  items: T[],
  page: number,
  pageSize = TABLE_PAGE_SIZE,
): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(parsePage(page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize = TABLE_PAGE_SIZE,
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(parsePage(page), totalPages);

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function pageRange(page: number, pageSize: number, total: number) {
  if (total === 0) return { start: 0, end: 0 };
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return { start, end };
}
