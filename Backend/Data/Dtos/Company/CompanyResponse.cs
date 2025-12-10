namespace Data.Dtos.Company
{
    public record CompanyResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public string Code { get; init; } = string.Empty;
        public bool IsActive { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}
