namespace Core.Common.Exceptions
{
    /// <summary>
    /// Se lanza cuando el <c>X-Company-Id</c> recibido no pertenece a la lista de
    /// empresas del usuario autenticado (claim <c>CompanyIds</c>).
    ///
    /// Antes esto era una <see cref="UnauthorizedAccessException"/> que nadie capturaba
    /// y terminaba como HTTP 500, con lo cual los intentos de cruce de tenant se
    /// contabilizaban como errores del servidor en vez de como 403.
    /// </summary>
    public class TenantAccessDeniedException : Exception
    {
        /// <summary>Empresa solicitada en la cabecera X-Company-Id.</summary>
        public int RequestedCompanyId { get; }

        public TenantAccessDeniedException(int requestedCompanyId)
            : base($"User does not have access to company {requestedCompanyId}")
        {
            RequestedCompanyId = requestedCompanyId;
        }
    }
}
