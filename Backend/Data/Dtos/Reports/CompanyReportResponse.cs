namespace Data.Dtos.Reports
{
    public record CompanyReportResponse
    {
        public int CompanyId { get; init; }
        public string CompanyName { get; init; } = string.Empty;
        public decimal TotalHours { get; init; }
        public int TotalMinutes { get; init; }
        public DateTime? DateFrom { get; init; }
        public DateTime? DateTo { get; init; }
        public List<UserBreakdown> UserBreakdown { get; init; } = new();
        public List<ProjectBreakdown> ProjectBreakdown { get; init; } = new();
        public List<DailyBreakdown> DailyBreakdown { get; init; } = new();
    }
}
