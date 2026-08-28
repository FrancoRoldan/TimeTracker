using Core.Common;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace TimeTracker.Extensions
{
    /// <summary>
    /// Traduce un <see cref="Result"/> / <see cref="Result{T}"/> fallido a una respuesta HTTP.
    ///
    /// Es el ÚNICO lugar donde se decide el status code a partir de un fallo de negocio.
    /// Antes esa decisión estaba dispersa en los controllers y se tomaba comparando
    /// el texto del error (<c>result.Error!.Contains("access")</c>), lo que impedía
    /// clasificar los fallos en métricas y trazas.
    /// </summary>
    public static class ResultExtensions
    {
        public static IActionResult ToErrorResponse<T>(this ControllerBase controller, Result<T> result)
            => Build(controller, result.Code, result.Error, result.Errors);

        public static IActionResult ToErrorResponse(this ControllerBase controller, Result result)
            => Build(controller, result.Code, result.Error, result.Errors);

        /// <summary>Mapeo canónico ErrorCode → status HTTP.</summary>
        public static int ToStatusCode(this ErrorCode code) => code switch
        {
            ErrorCode.NotFound => StatusCodes.Status404NotFound,
            ErrorCode.Forbidden => StatusCodes.Status403Forbidden,
            ErrorCode.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorCode.Conflict => StatusCodes.Status409Conflict,
            ErrorCode.Unexpected => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status400BadRequest
        };

        private static IActionResult Build(
            ControllerBase controller,
            ErrorCode code,
            string? error,
            List<string> errors)
        {
            var statusCode = code.ToStatusCode();
            var message = error ?? "Request could not be processed";

            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = TitleFor(code),
                Detail = message,
                Instance = controller.HttpContext.Request.Path
            };

            problem.Extensions["traceId"] =
                Activity.Current?.TraceId.ToString() ?? controller.HttpContext.TraceIdentifier;

            // `error` y `errors` se mantienen por compatibilidad con extractErrorMessage()
            // del frontend Angular, que los lee antes que cualquier otro campo.
            problem.Extensions["error"] = message;
            if (errors.Count > 0)
                problem.Extensions["errors"] = errors;

            return new ObjectResult(problem)
            {
                StatusCode = statusCode,
                ContentTypes = { "application/problem+json" }
            };
        }

        private static string TitleFor(ErrorCode code) => code switch
        {
            ErrorCode.NotFound => "Not Found",
            ErrorCode.Forbidden => "Forbidden",
            ErrorCode.Unauthorized => "Unauthorized",
            ErrorCode.Conflict => "Conflict",
            ErrorCode.Unexpected => "Internal Server Error",
            _ => "Bad Request"
        };
    }
}
