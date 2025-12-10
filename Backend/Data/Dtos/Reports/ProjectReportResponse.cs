namespace Data.Dtos.Reports
{
    public record ProjectReportResponse
    {
        public int ProjectId { get; init; }
        public string ProjectName { get; init; } = string.Empty;
        public decimal TotalHours { get; init; }
        public int TotalMinutes { get; init; }
        public DateTime? DateFrom { get; init; }
        public DateTime? DateTo { get; init; }
        public List<UserBreakdown> UserBreakdown { get; init; } = new();
        public List<IssueBreakdown> IssueBreakdown { get; init; } = new();
        public List<DailyBreakdown> DailyBreakdown { get; init; } = new();
    }
}
