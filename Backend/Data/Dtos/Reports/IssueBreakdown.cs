namespace Data.Dtos.Reports
{
    public record IssueBreakdown
    {
        public int IssueId { get; init; }
        public string IssueTitle { get; init; } = string.Empty;
        public string ProjectName { get; init; } = string.Empty;
        public int TotalMinutes { get; init; }
        public decimal TotalHours { get; init; }
        public int EntriesCount { get; init; }
    }
}
