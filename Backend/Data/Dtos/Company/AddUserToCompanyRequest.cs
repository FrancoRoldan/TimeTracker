using Data.Enums;

namespace Data.Dtos.Company
{
    public record AddUserToCompanyRequest
    {
        public int UserId { get; init; }
        public UserRole Role { get; init; }
        public decimal? HourlyRate { get; init; }
    }
}
