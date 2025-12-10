namespace Data.Dtos.Auth
{
    public class RegisterUserRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public string Role { get; set; } = "3"; // Default role
        public decimal? HourlyRate { get; set; }
    }
}
