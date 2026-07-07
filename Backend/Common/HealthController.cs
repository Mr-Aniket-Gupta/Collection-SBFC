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

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            using var connection = _connectionFactory.CreateConnection();

            await connection.OpenAsync();

            return Ok(new
            {
                status = "Healthy",
                database = "Connected",
                serverTime = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = "Unhealthy",
                database = "Disconnected",
                error = ex.Message
            });
        }
    }
}
