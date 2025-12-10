namespace Data.Dtos.Company
{
    public record CreateCompanyRequest
    {
        public string Name { get; init; } = string.Empty;
        public string Code { get; init; } = string.Empty;
    }
}
