namespace Data.Dtos.Company
{
    public class JoinCompanyRequest
    {
        public int CompanyId { get; set; }
        public string Role { get; set; } = "Developer"; // Default role
        public decimal? HourlyRate { get; set; }
    }
}
