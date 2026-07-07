using Microsoft.AspNetCore.Mvc;
using backend.Database;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IDbConnectionFactory _connectionFactory;

    public HealthController(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    [HttpGet("health")]
public IActionResult Health()
{
    return Ok(new
    {
        status = "Healthy",
        message = "API is running",
        serverTime = DateTime.UtcNow
    });
}
}
