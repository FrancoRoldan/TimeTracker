using Core.Http.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Http.Interfaces
{
    public interface IHttpClientService
    {
        Task<ApiResponse<T>> GetAsync<T>(string endpoint, Dictionary<string, string>? headers = null);
        Task<ApiResponse<T>> PostAsync<T>(string endpoint, object data, Dictionary<string, string>? headers = null);
        Task<ApiResponse<T>> PutAsync<T>(string endpoint, object data, Dictionary<string, string>? headers = null);
        Task<ApiResponse<T>> PatchAsync<T>(string endpoint, object data, Dictionary<string, string>? headers = null);
        Task<ApiResponse<T>> DeleteAsync<T>(string endpoint, Dictionary<string, string>? headers = null);
    }
}
