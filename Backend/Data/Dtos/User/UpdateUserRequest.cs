namespace Data.Dtos.User
{
    public class UpdateUserRequest
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string UsuarioActualizacion { get; set; } = string.Empty;
    }
}
