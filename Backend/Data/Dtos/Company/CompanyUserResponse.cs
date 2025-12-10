namespace Data.Dtos.Company
{
    public class CompanyUserResponse
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public decimal? HourlyRate { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
