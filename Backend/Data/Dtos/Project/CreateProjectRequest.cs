namespace Data.Dtos.Project
{
    public record CreateProjectRequest
    {
        public string Name { get; init; } = string.Empty;
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
    }
}
