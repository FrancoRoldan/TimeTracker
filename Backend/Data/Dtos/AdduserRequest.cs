

using System.ComponentModel.DataAnnotations;

namespace Data.Dtos
{
    public class AddUserRequest
    {
        public required string Nombre { get; set; }
        public required string Password {  get; set; }
        public required string Email { get; set; }
        public required string UsuarioCreacion { get; set; }

    }
}
