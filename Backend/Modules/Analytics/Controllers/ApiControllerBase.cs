using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace backend.Modules.Analytics.Controllers;

public static class ApiResponseHelper
{
    public static IActionResult ApiResponse(
        ControllerBase controller,
        string apiCode,
        HttpStatusCode statusCode,
        string message,
        string status,
        object? payload)
    {
        return controller.StatusCode((int)statusCode, new
        {
            apiCodeStatus = apiCode,
            statusCode = (int)statusCode,
            message,
            status,
            payload
        });
    }
}

public abstract class ApiControllerBase : ControllerBase
{
    protected readonly ILogger Logger;

    protected ApiControllerBase(ILogger logger)
    {
        Logger = logger;
    }

    protected async Task<IActionResult> ExecuteAsync<T>(
        string apiCode,
        string successMessage,
        Func<Task<T>> action,
        string failureMessage,
        string logCategory)
    {
        try
        {
            var result = await action();
            return ApiResponseHelper.ApiResponse(this, apiCode, HttpStatusCode.OK, successMessage, "SUCCESS", result);
        }
        catch (Exception exception)
        {
            Logger.LogError(exception, "{LogCategory} API failed for {ApiCode}", logCategory, apiCode);
            return ApiResponseHelper.ApiResponse(this, apiCode, HttpStatusCode.InternalServerError, failureMessage, "ERROR", null);
        }
    }
}