using Core.Common;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TimeTracker.Extensions;
using Xunit;

namespace TimeTracker.Tests
{
    /// <summary>
    /// Cubre el mapeo único ErrorCode -> HTTP introducido en la Fase 0 del plan de
    /// observabilidad, que reemplaza el string matching que hacían los controllers
    /// (por ejemplo <c>result.Error!.Contains("access")</c>).
    /// </summary>
    public class ResultErrorMappingTests
    {
        private sealed class TestController : ControllerBase { }

        private static TestController BuildController()
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Path = "/api/time/entries/1";
            httpContext.TraceIdentifier = "trace-de-prueba";

            return new TestController
            {
                ControllerContext = new ControllerContext { HttpContext = httpContext }
            };
        }

        private static ProblemDetails ProblemFrom(IActionResult actionResult)
        {
            var objectResult = actionResult.Should().BeOfType<ObjectResult>().Subject;
            return objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
        }

        [Theory]
        [InlineData(ErrorCode.Validation, StatusCodes.Status400BadRequest)]
        [InlineData(ErrorCode.NotFound, StatusCodes.Status404NotFound)]
        [InlineData(ErrorCode.Forbidden, StatusCodes.Status403Forbidden)]
        [InlineData(ErrorCode.Unauthorized, StatusCodes.Status401Unauthorized)]
        [InlineData(ErrorCode.Conflict, StatusCodes.Status409Conflict)]
        [InlineData(ErrorCode.Unexpected, StatusCodes.Status500InternalServerError)]
        public void ToStatusCode_mapea_cada_ErrorCode_a_su_status_http(ErrorCode code, int expected)
        {
            code.ToStatusCode().Should().Be(expected);
        }

        [Fact]
        public void Failure_sin_codigo_mantiene_el_comportamiento_historico_400()
        {
            // Las llamadas existentes a Failure(string) no deben cambiar de status.
            Result.Failure("algo salió mal").Code.Should().Be(ErrorCode.Validation);
            Result<int>.Failure("algo salió mal").Code.Should().Be(ErrorCode.Validation);
            Result<int>.Failure(new List<string> { "a", "b" }).Code.Should().Be(ErrorCode.Validation);
        }

        [Fact]
        public void Las_fabricas_tipadas_asignan_el_codigo_correspondiente()
        {
            Result.NotFound("x").Code.Should().Be(ErrorCode.NotFound);
            Result.Forbidden("x").Code.Should().Be(ErrorCode.Forbidden);
            Result.Unauthorized("x").Code.Should().Be(ErrorCode.Unauthorized);
            Result.Conflict("x").Code.Should().Be(ErrorCode.Conflict);

            Result<int>.NotFound("x").Code.Should().Be(ErrorCode.NotFound);
            Result<int>.Forbidden("x").Code.Should().Be(ErrorCode.Forbidden);
            Result<int>.Unauthorized("x").Code.Should().Be(ErrorCode.Unauthorized);
            Result<int>.Conflict("x").Code.Should().Be(ErrorCode.Conflict);
        }

        [Fact]
        public void Success_no_lleva_codigo_de_error()
        {
            Result.Success().Code.Should().Be(ErrorCode.None);
            Result<int>.Success(1).Code.Should().Be(ErrorCode.None);
        }

        [Fact]
        public void ToErrorResponse_devuelve_404_para_un_NotFound()
        {
            var controller = BuildController();

            var response = controller.ToErrorResponse(Result<string>.NotFound("Time entry not found"));

            var objectResult = response.Should().BeOfType<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(StatusCodes.Status404NotFound);

            var problem = ProblemFrom(response);
            problem.Status.Should().Be(StatusCodes.Status404NotFound);
            problem.Title.Should().Be("Not Found");
            problem.Detail.Should().Be("Time entry not found");
        }

        [Fact]
        public void ToErrorResponse_devuelve_403_para_un_Forbidden()
        {
            var controller = BuildController();

            var response = controller.ToErrorResponse(
                Result<string>.Forbidden("You don't have access to this entry"));

            response.Should().BeOfType<ObjectResult>()
                .Which.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        }

        [Fact]
        public void ToErrorResponse_conserva_la_propiedad_error_que_consume_el_frontend()
        {
            // extractErrorMessage() en Angular lee error.error.error antes que cualquier
            // otro campo: si se pierde, el usuario ve un mensaje genérico.
            var controller = BuildController();

            var problem = ProblemFrom(
                controller.ToErrorResponse(Result<string>.NotFound("Company not found")));

            problem.Extensions.Should().ContainKey("error");
            problem.Extensions["error"].Should().Be("Company not found");
        }

        [Fact]
        public void ToErrorResponse_incluye_traceId_para_correlacionar_con_logs_y_traces()
        {
            var controller = BuildController();

            var problem = ProblemFrom(
                controller.ToErrorResponse(Result<string>.NotFound("Company not found")));

            problem.Extensions.Should().ContainKey("traceId");
            problem.Extensions["traceId"].Should().NotBeNull();
        }

        [Fact]
        public void ToErrorResponse_expone_la_lista_de_errores_de_validacion()
        {
            var controller = BuildController();
            var errores = new List<string> { "Name is required", "Code is required" };

            var problem = ProblemFrom(
                controller.ToErrorResponse(Result<string>.Failure(errores)));

            problem.Status.Should().Be(StatusCodes.Status400BadRequest);
            problem.Extensions.Should().ContainKey("errors");
            problem.Extensions["errors"].Should().BeEquivalentTo(errores);
        }

        [Fact]
        public void ToErrorResponse_funciona_igual_para_el_Result_no_generico()
        {
            var controller = BuildController();

            var response = controller.ToErrorResponse(Result.Forbidden("sin permisos"));

            response.Should().BeOfType<ObjectResult>()
                .Which.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        }
    }
}
