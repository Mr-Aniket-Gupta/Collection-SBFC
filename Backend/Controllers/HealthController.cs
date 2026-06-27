using backend.Common.Controllers;
using backend.Database;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class HealthController : ApiControllerBase
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public HealthController(IDbConnectionFactory dbConnectionFactory, ILogger<HealthController> logger)
        : base(logger)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    [HttpGet("db")]
    public Task<IActionResult> CheckDatabase(CancellationToken cancellationToken)
        => ExecuteAsync(
            "HEALTH-DB-001",
            "Database connected successfully.",
            async () =>
            {
                await using var connection = _dbConnectionFactory.CreateConnection();
                await connection.OpenAsync(cancellationToken);
                return new { isConnected = true };
            },
            "Database connection failed.",
            "Health");
}
