using backend.Common;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace backend.Modules.Analytics.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardMapController : ControllerBase
{
    [HttpGet("map")]
    public IActionResult GetMap()
        => ApiResponseHelper.ApiResponse(
            this,
            "DASHBOARD-MAP",
            HttpStatusCode.OK,
            "Dashboard map fetched successfully.",
            "SUCCESS",
            MapDummyData.Response);
}
