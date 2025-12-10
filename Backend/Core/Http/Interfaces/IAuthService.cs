using Core.Http.Models.SanMiguelApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Http.Interfaces
{
    public interface IAuthService
    {
        public Task<LoginotherApiResponse?> LoginAsync(LoginOtherApiRequest req);
    }
}
