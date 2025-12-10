using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Http.Models.SanMiguelApi
{
    public class AuthResponse
    {
        public string token { get; set; } = null!;
        public string refreshToken { get; set; } = null!;
        public string message { get; set; } = null!;
        public bool success { get; set; }
    }
}
