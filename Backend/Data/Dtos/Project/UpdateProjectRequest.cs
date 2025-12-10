using Data.Enums;

namespace Data.Dtos.Project
{
    public record UpdateProjectRequest
    {
        public string? Name { get; init; }
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
        public ProjectStatus? Status { get; init; }
    }
}
