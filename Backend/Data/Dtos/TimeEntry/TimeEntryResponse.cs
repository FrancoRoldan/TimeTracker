namespace Data.Dtos.TimeEntry
{
    public record TimeEntryResponse
    {
        public int Id { get; init; }
        public int IssueId { get; init; }
        public string IssueTitle { get; init; } = string.Empty;
        public string ProjectName { get; init; } = string.Empty;
        public int UserId { get; init; }
        public string UserName { get; init; } = string.Empty;
        public DateTime StartTime { get; init; }
        public DateTime? EndTime { get; init; }
        public int? DurationMinutes { get; init; }
        public string? Description { get; init; }
    }
}
