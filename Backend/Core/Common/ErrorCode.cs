namespace Core.Common
{
    /// <summary>
    /// Clasificación tipada del fallo devuelto por un servicio.
    /// Reemplaza la comparación de strings que hacían los controllers
    /// (por ejemplo <c>result.Error!.Contains("access")</c>) y permite mapear
    /// el resultado a un status HTTP en un único lugar.
    /// </summary>
    public enum ErrorCode
    {
        /// <summary>Sin error. Solo válido en resultados exitosos.</summary>
        None = 0,

        /// <summary>Datos inválidos o regla de negocio incumplida. → 400</summary>
        Validation = 1,

        /// <summary>El recurso solicitado no existe o no es visible. → 404</summary>
        NotFound = 2,

        /// <summary>El usuario está autenticado pero no tiene permiso. → 403</summary>
        Forbidden = 3,

        /// <summary>Falta autenticación o las credenciales son inválidas. → 401</summary>
        Unauthorized = 4,

        /// <summary>El estado actual impide la operación (duplicados, etc.). → 409</summary>
        Conflict = 5,

        /// <summary>Fallo no previsto. → 500</summary>
        Unexpected = 6
    }
}
