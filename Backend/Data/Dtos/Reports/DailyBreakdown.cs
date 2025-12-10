namespace Data.Dtos.Reports
{
    public record DailyBreakdown
    {
        public DateTime Date { get; init; }
        public int TotalMinutes { get; init; }
        public decimal TotalHours { get; init; }
        public int EntriesCount { get; init; }
    }
}
