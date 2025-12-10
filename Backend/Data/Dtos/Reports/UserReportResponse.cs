namespace Data.Dtos.Reports
{
    public record UserReportResponse
    {
        public int UserId { get; init; }
        public string UserName { get; init; } = string.Empty;
        public decimal TotalHours { get; init; }
        public int TotalMinutes { get; init; }
        public DateTime? DateFrom { get; init; }
        public DateTime? DateTo { get; init; }
        public List<DailyBreakdown> DailyBreakdown { get; init; } = new();
        public List<ProjectBreakdown> ProjectBreakdown { get; init; } = new();
        public List<IssueBreakdown> IssueBreakdown { get; init; } = new();
        public List<IssueTypeBreakdown> IssueTypeBreakdown { get; init; } = new();
    }
}
