namespace Data.Dtos.Auth
{
    public record LoginResponse
    {
        public string Token { get; init; } = string.Empty;
        public UserInfo User { get; init; } = null!;
        public List<UserCompanyInfo> Companies { get; init; } = new();
        public int? SelectedCompanyId { get; init; }
    }

    public record UserInfo
    {
        public int Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
    }

    public record UserCompanyInfo
    {
        public int CompanyId { get; init; }
        public string CompanyName { get; init; } = string.Empty;
        public string CompanyCode { get; init; } = string.Empty;
        public string Role { get; init; } = string.Empty;
    }
}
