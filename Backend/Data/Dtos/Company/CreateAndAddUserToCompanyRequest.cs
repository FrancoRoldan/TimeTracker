using Data.Enums;

namespace Data.Dtos.Company
{
    public record CreateAndAddUserToCompanyRequest
    {
        public string Name { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
        public string Password { get; init; } = string.Empty;
        public UserRole Role { get; init; }
        public decimal? HourlyRate { get; init; }
    }
}
