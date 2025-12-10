export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
}