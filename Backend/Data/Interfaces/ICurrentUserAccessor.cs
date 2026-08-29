namespace Data.Interfaces
{
    /// <summary>
    /// Expone el usuario y la empresa (tenant) de la request actual a la capa de datos.
    ///
    /// Existe porque <c>Data</c> no puede referenciar a <c>Core</c> (la dependencia va al revés)
    /// y <see cref="Data.Context.AppDbContext"/> necesita saber quién está ejecutando la
    /// operación para poder estampar CreatedBy/UpdatedBy y escribir la auditoría. Sin esto,
    /// el contexto se construía siempre por el constructor de solo <c>options</c> y todos
    /// los cambios quedaban registrados como "SYSTEM".
    ///
    /// La implementación vive en Core (TenantService) y nunca debe lanzar: si el contexto
    /// no puede resolverse devuelve null.
    /// </summary>
    public interface ICurrentUserAccessor
    {
        /// <summary>Id del usuario autenticado, o null si no hay request o no está autenticado.</summary>
        int? GetUserId();

        /// <summary>Id de la empresa activa (tenant), o null si no puede determinarse.</summary>
        int? GetTenantId();

        /// <summary>
        /// Dirección IP de origen de la request, para el registro de auditoría (§20.2).
        /// Null fuera de un contexto HTTP.
        /// </summary>
        string? GetIpAddress();
    }
}
