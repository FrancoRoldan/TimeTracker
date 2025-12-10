using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Http.Models.SanMiguelApi
{
    public class Usuario
    {
        public int id { get; set; }
        public string userName { get; set; } = null!;
        public string password { get; set; } = null!;
        public DateTime fechaCreado { get; set; }
        public bool? admin { get; set; }
        public bool habilitado { get; set; }
        public string? token { get; set; }
    }
}
