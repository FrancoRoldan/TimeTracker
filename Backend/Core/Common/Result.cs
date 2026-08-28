namespace Core.Common
{
    public class Result<T>
    {
        public bool IsSuccess { get; }
        public T? Value { get; }
        public string? Error { get; }
        public List<string> Errors { get; }

        /// <summary>
        /// Clasificación del fallo. En resultados exitosos es <see cref="ErrorCode.None"/>.
        /// Las sobrecargas de <c>Failure</c> que no reciben un código asumen
        /// <see cref="ErrorCode.Validation"/>, que es el comportamiento histórico (HTTP 400).
        /// </summary>
        public ErrorCode Code { get; }

        private Result(bool isSuccess, T? value, string? error, ErrorCode code, List<string>? errors = null)
        {
            IsSuccess = isSuccess;
            Value = value;
            Error = error;
            Code = code;
            Errors = errors ?? new List<string>();
        }

        public static Result<T> Success(T value) =>
            new Result<T>(true, value, null, ErrorCode.None);

        public static Result<T> Failure(string error) =>
            new Result<T>(false, default, error, ErrorCode.Validation);

        public static Result<T> Failure(List<string> errors) =>
            new Result<T>(false, default, errors.FirstOrDefault(), ErrorCode.Validation, errors);

        public static Result<T> Failure(ErrorCode code, string error) =>
            new Result<T>(false, default, error, code);

        public static Result<T> Failure(ErrorCode code, List<string> errors) =>
            new Result<T>(false, default, errors.FirstOrDefault(), code, errors);

        /// <summary>El recurso no existe o no es visible para el usuario actual. → HTTP 404</summary>
        public static Result<T> NotFound(string error) =>
            new Result<T>(false, default, error, ErrorCode.NotFound);

        /// <summary>El usuario está autenticado pero no tiene permiso. → HTTP 403</summary>
        public static Result<T> Forbidden(string error) =>
            new Result<T>(false, default, error, ErrorCode.Forbidden);

        /// <summary>Falta autenticación o las credenciales son inválidas. → HTTP 401</summary>
        public static Result<T> Unauthorized(string error) =>
            new Result<T>(false, default, error, ErrorCode.Unauthorized);

        /// <summary>El estado actual impide la operación. → HTTP 409</summary>
        public static Result<T> Conflict(string error) =>
            new Result<T>(false, default, error, ErrorCode.Conflict);
    }

    public class Result
    {
        public bool IsSuccess { get; }
        public string? Error { get; }
        public List<string> Errors { get; }

        /// <inheritdoc cref="Result{T}.Code"/>
        public ErrorCode Code { get; }

        private Result(bool isSuccess, string? error, ErrorCode code, List<string>? errors = null)
        {
            IsSuccess = isSuccess;
            Error = error;
            Code = code;
            Errors = errors ?? new List<string>();
        }

        public static Result Success() =>
            new Result(true, null, ErrorCode.None);

        public static Result Failure(string error) =>
            new Result(false, error, ErrorCode.Validation);

        public static Result Failure(List<string> errors) =>
            new Result(false, errors.FirstOrDefault(), ErrorCode.Validation, errors);

        public static Result Failure(ErrorCode code, string error) =>
            new Result(false, error, code);

        public static Result Failure(ErrorCode code, List<string> errors) =>
            new Result(false, errors.FirstOrDefault(), code, errors);

        /// <summary>El recurso no existe o no es visible para el usuario actual. → HTTP 404</summary>
        public static Result NotFound(string error) =>
            new Result(false, error, ErrorCode.NotFound);

        /// <summary>El usuario está autenticado pero no tiene permiso. → HTTP 403</summary>
        public static Result Forbidden(string error) =>
            new Result(false, error, ErrorCode.Forbidden);

        /// <summary>Falta autenticación o las credenciales son inválidas. → HTTP 401</summary>
        public static Result Unauthorized(string error) =>
            new Result(false, error, ErrorCode.Unauthorized);

        /// <summary>El estado actual impide la operación. → HTTP 409</summary>
        public static Result Conflict(string error) =>
            new Result(false, error, ErrorCode.Conflict);
    }
}
