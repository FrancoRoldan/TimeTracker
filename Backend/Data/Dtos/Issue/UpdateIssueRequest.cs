using Data.Enums;

namespace Data.Dtos.Issue
{
    public record UpdateIssueRequest
    {
        public string? Title { get; init; }
        public string? Description { get; init; }
        public IssueStatus? Status { get; init; }
        public IssuePriority? Priority { get; init; }
        public decimal? EstimatedHours { get; init; }
        public int? AssignedUserId { get; init; }
    }
}
