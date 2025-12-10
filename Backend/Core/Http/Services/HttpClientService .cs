using Core.Http.Interfaces;
using Core.Http.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Core.Http.Services
{
    public class HttpClientService : IHttpClientService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<HttpClientService> _logger;

        public HttpClientService(HttpClient httpClient, ILogger<HttpClientService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<ApiResponse<T>> GetAsync<T>(string endpoint, Dictionary<string, string>? headers = null)
        {
            return await SendRequestAsync<T>(HttpMethod.Get, endpoint, null, headers);
        }

        public async Task<ApiResponse<T>> PostAsync<T>(string endpoint, object data, Dictionary<string, string>? headers = null)
        {
            return await SendRequestAsync<T>(HttpMethod.Post, endpoint, data, headers);
        }

        public async Task<ApiResponse<T>> PutAsync<T>(string endpoint, object data, Dictionary<string, string>? headers = null)
        {
            return await SendRequestAsync<T>(HttpMethod.Put, endpoint, data, headers);
        }

        public async Task<ApiResponse<T>> PatchAsync<T>(string endpoint, object data, Dictionary<string, string>? headers = null)
        {
            return await SendRequestAsync<T>(HttpMethod.Patch, endpoint, data, headers);
        }

        public async Task<ApiResponse<T>> DeleteAsync<T>(string endpoint, Dictionary<string, string>? headers = null)
        {
            return await SendRequestAsync<T>(HttpMethod.Delete, endpoint, null, headers);
        }

        private async Task<ApiResponse<T>> SendRequestAsync<T>(HttpMethod method, string endpoint, object? data = null, Dictionary<string, string>? headers = null)
        {
            try
            {
                using var request = new HttpRequestMessage(method, endpoint);

                // Add headers if provided
                if (headers != null)
                {
                    foreach (var header in headers)
                    {
                        request.Headers.Add(header.Key, header.Value);
                    }
                }

                // Add content for POST, PUT, PATCH
                if (data != null && (method == HttpMethod.Post || method == HttpMethod.Put || method == HttpMethod.Patch))
                {
                    var json = JsonSerializer.Serialize(data);
                    request.Content = new StringContent(json, Encoding.UTF8, "application/json");
                }

                // Send request
                using var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                // Log request details
                _logger.LogInformation(
                    "HTTP {Method} {Url} {StatusCode}",
                    method.Method,
                    endpoint,
                    (int)response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError(
                        "HTTP {Method} {Url} failed with status {StatusCode}. Response: {Response}",
                        method.Method,
                        endpoint,
                        (int)response.StatusCode,
                        content);

                    return new ApiResponse<T>
                    {
                        Success = false,
                        Message = $"Request failed with status code {response.StatusCode}",
                        StatusCode = (int)response.StatusCode
                    };
                }

                var result = JsonSerializer.Deserialize<T>(content);
                return new ApiResponse<T>
                {
                    Success = true,
                    Data = result,
                    StatusCode = (int)response.StatusCode
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error making HTTP request to {Endpoint}", endpoint);
                throw new Models.HttpRequestException($"Error making HTTP request: {ex.Message}", 500);
            }
        }
    }
}
