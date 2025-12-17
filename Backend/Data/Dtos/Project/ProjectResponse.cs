using Data.Enums;

namespace Data.Dtos.Project
{
    public record ProjectResponse
    {
        public int Id { get; init; }
        public int CompanyId { get; init; }
        public string CompanyName { get; init; } = string.Empty;
        public string Name { get; init; } = string.Empty;
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
        public ProjectStatus Status { get; init; }
        public int IssueCount { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}
