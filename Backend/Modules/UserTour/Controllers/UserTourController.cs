using Microsoft.AspNetCore.Mvc;
using backend.Modules.UserTour.DTOs;
using backend.Modules.UserTour.Repositories;
using backend.Modules.UserTour.Requests;

namespace backend.Modules.UserTour.Controllers;

[ApiController]
[Route("api/user-tour")]
public class UserTourController : ControllerBase
{
    private readonly IUserTourRepository _repository;

    public UserTourController(IUserTourRepository repository)
    {
        _repository = repository;
    }

    [HttpGet("{tourCode}")]
    public async Task<ActionResult<UserTourStatusDto>> GetTourStatus(
        string tourCode,
        [FromQuery] long agentId
    )
    {
        var completed = await _repository.IsTourCompletedAsync(agentId, tourCode);

        return Ok(new UserTourStatusDto { Completed = completed });
    }

    [HttpPost("complete")]
    public async Task<IActionResult> CompleteTour(
        [FromBody] CompleteTourRequest request
    )
    {
        await _repository.MarkTourCompletedAsync(request.AgentId, request.TourCode);

        return Ok(new { message = "Tour marked as completed." });
    }

    [HttpPost("reset")]
    public async Task<IActionResult> ResetTour(
        [FromBody] CompleteTourRequest request
    )
    {
        await _repository.ResetTourAsync(request.AgentId, request.TourCode);

        return Ok(new { message = "Tour reset." });
    }
}