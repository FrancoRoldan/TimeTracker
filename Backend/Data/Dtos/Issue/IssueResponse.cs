using Data.Enums;

namespace Data.Dtos.Issue
{
    public record IssueResponse
    {
        public int Id { get; init; }
        public int ProjectId { get; init; }
        public string ProjectName { get; init; } = string.Empty;
        public string Title { get; init; } = string.Empty;
        public string? Description { get; init; }
        public IssueType Type { get; init; }
        public IssueStatus Status { get; init; }
        public IssuePriority Priority { get; init; }
        public decimal? EstimatedHours { get; init; }
        public int? AssignedUserId { get; init; }
        public string? AssignedUserName { get; init; }
        public DateTime CreatedAt { get; init; }
        public DateTime UpdatedAt { get; init; }
    }
}
