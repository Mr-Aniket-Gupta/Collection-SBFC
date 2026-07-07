using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace YourProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HealthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetHealth()
        {
            bool dbConnected = await _context.Database.CanConnectAsync();

            if (!dbConnected)
            {
                return StatusCode(500, new
                {
                    status = "Unhealthy",
                    database = "Disconnected"
                });
            }

            return Ok(new
            {
                status = "Healthy",
                database = "Connected",
                serverTime = DateTime.UtcNow
            });
        }
    }
}