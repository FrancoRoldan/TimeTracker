using Data.Enums;

namespace Data.Dtos.Company
{
    public record UpdateUserInCompanyRequest
    {
        public UserRole Role { get; init; }
        public decimal? HourlyRate { get; init; }
    }
}
