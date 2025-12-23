namespace Data.Dtos.User
{
    public class UserProfileResponse
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public string? UsuarioCreacion { get; set; }
        public string? UsuarioActualizacion { get; set; }
    }
}
