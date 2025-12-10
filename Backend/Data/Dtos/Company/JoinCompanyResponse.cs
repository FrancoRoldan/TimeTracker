namespace Data.Dtos.Company
{
    public class JoinCompanyResponse
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyCode { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public decimal? HourlyRate { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
