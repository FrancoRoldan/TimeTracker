using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Http.Models
{
    public class HttpRequestException : Exception
    {
        public int StatusCode { get; }

        public HttpRequestException(string message, int statusCode) : base(message)
        {
            StatusCode = statusCode;
        }
    }
}
