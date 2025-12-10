using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Http.Models
{
    public class HttpClientOptions
    {
        public string BaseUrl { get; set; } = string.Empty;
        public Dictionary<string, string> DefaultHeaders { get; set; } = new();
        public int Timeout { get; set; } = 30;
    }
}
