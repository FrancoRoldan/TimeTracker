using Core.Http.Interfaces;
using Core.Http.Models.SanMiguelApi;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.ComponentModel.Design;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Http.Services
{
    public class AuthService:IAuthService
    {
        private readonly IHttpClientService _httpService;

        public AuthService(IHttpClientFactory httpClientFactory,
                          ILogger<HttpClientService> logger)
        {
            HttpClient client = httpClientFactory.CreateClient("AuthApi");
            _httpService = new HttpClientService(client, logger);
        }

        public async Task<LoginotherApiResponse?> LoginAsync(LoginOtherApiRequest req)
        {

            var response = await _httpService.PostAsync<LoginotherApiResponse>(
                $"api/Auth/Login",
                req
            );

            return response.Data;
        }

        
    }
}
