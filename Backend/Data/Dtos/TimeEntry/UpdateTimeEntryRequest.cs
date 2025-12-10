namespace Data.Dtos.TimeEntry
{
    public record UpdateTimeEntryRequest
    {
        public DateTime? StartTime { get; init; }
        public DateTime? EndTime { get; init; }
        public string? Description { get; init; }
    }
}
