namespace Data.Dtos.TimeEntry
{
    public record AddManualEntryRequest
    {
        public int IssueId { get; init; }
        public DateTime StartTime { get; init; }
        public DateTime EndTime { get; init; }
        public string? Description { get; init; }
    }
}
