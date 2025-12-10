using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Http.Models.SanMiguelApi
{
    public class LoginotherApiResponse
    {
        public AuthResponse? auth { get; set; }
        public Usuario? data { get; set; }
    }
}
