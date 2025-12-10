namespace Data.Dtos.Reports
{
    public record UserBreakdown
    {
        public int UserId { get; init; }
        public string UserName { get; init; } = string.Empty;
        public int TotalMinutes { get; init; }
        public decimal TotalHours { get; init; }
        public int EntriesCount { get; init; }
    }
}
