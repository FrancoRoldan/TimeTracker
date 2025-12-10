using Data.Enums;

namespace Data.Dtos.Reports
{
    public record IssueTypeBreakdown
    {
        public IssueType IssueType { get; init; }
        public int TotalMinutes { get; init; }
        public decimal TotalHours { get; init; }
        public int EntriesCount { get; init; }
    }
}
