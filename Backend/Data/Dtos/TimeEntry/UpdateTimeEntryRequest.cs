namespace Data.Dtos.TimeEntry
{
    public record UpdateTimeEntryRequest
    {
        public int? ProjectId { get; init; }
        public int? IssueId { get; init; }
        public DateTime? StartTime { get; init; }
        public DateTime? EndTime { get; init; }
        public string? Description { get; init; }
        public bool? RegisteredInDevOps { get; init; }
    }
}
