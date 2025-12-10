namespace Data.Dtos.Auth
{
    public class RegisterUserResponse
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public decimal? HourlyRate { get; set; }
    }
}
