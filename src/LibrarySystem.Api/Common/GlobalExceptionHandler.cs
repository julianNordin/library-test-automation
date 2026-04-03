using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace LibrarySystem.Api.Common;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (statusCode, title, detail) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Resource not found", exception.Message),
            BookNotAvailableException => (StatusCodes.Status409Conflict, "Book not available", exception.Message),
            LoanLimitExceededException => (StatusCodes.Status409Conflict, "Loan limit exceeded", exception.Message),
            LoanAlreadyReturnedException => (StatusCodes.Status409Conflict, "Loan already returned", exception.Message),
            DeleteConflictException => (StatusCodes.Status409Conflict, "Delete conflict", exception.Message),
            DuplicateValueException => (StatusCodes.Status409Conflict, "Duplicate value", exception.Message),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred", "An unexpected error occurred. Please try again later."),
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception processing {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = statusCode;

        await httpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
        }, cancellationToken);

        return true;
    }
}
