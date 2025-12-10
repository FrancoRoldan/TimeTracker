namespace Data.Dtos.Reports
{
    public record ProjectBreakdown
    {
        public int ProjectId { get; init; }
        public string ProjectName { get; init; } = string.Empty;
        public int TotalMinutes { get; init; }
        public decimal TotalHours { get; init; }
        public int EntriesCount { get; init; }
    }
}
