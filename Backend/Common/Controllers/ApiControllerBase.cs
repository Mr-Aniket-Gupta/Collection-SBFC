using backend.Common;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace backend.Common.Controllers;

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
