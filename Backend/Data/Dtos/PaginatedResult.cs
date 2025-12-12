namespace Data.Dtos
{
    public record PaginatedResult<T>
    {
        public List<T> Items { get; init; } = new();
        public int TotalCount { get; init; }
        public int PageNumber { get; init; }
        public int PageSize { get; init; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
        public bool HasPreviousPage => PageNumber > 0;
        public bool HasNextPage => PageNumber < TotalPages - 1;
    }
}
