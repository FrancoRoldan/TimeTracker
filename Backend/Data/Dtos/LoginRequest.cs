

using System.ComponentModel.DataAnnotations;

namespace Data.Dtos
{
    public class LoginRequest
    {
        public required string email {  get; set; }
        public required string password { get; set; }
    }
}
