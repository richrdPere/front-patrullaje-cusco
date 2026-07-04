// Main
export interface PaginadoResponse<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
