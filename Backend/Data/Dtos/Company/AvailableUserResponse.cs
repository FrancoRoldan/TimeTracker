namespace Data.Dtos.Company
{
    public record AvailableUserResponse
    {
        public int Id { get; init; }
        public string Nombre { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
    }
}
