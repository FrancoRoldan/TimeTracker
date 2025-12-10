namespace Data.Dtos.Company
{
    public record UpdateCompanyRequest
    {
        public string Name { get; init; } = string.Empty;
        public string Code { get; init; } = string.Empty;
        public bool IsActive { get; init; }
    }
}
