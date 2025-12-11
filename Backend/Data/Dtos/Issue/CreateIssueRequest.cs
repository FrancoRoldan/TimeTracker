using Data.Enums;

namespace Data.Dtos.Issue
{
    public record CreateIssueRequest
    {
        public int ProjectId { get; init; }
        public string Title { get; init; } = string.Empty;
        public string? Description { get; init; }
        public IssueType Type { get; init; }
        public IssuePriority Priority { get; init; }
        public decimal? EstimatedHours { get; init; }
        public int? AssignedUserId { get; set; }
    }
}
