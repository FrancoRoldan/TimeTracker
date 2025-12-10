using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Data.Dtos
{
    public class GetUserResponse
    {
        public int Id { get; set; } 
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;   
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string UsuarioCreacion { get; set; } = string.Empty;
    }
}
