namespace Data.Dtos.TimeEntry
{
    public record StartTimerRequest
    {
        public int? IssueId { get; init; }
        public int? ProjectId { get; init; }
        public string? Description { get; init; }
    }
}
