using backend.Modules.Reports.Services;
using Microsoft.AspNetCore.Mvc;
using backend.Common.Controllers;

namespace backend.Modules.Reports.Controllers;

[ApiController]
[Route("api/reports")]
public sealed class ReportsController : ApiControllerBase
{
    private readonly ReportsService _service;

    public ReportsController(ReportsService service, ILogger<ReportsController> logger)
        : base(logger)
    {
        _service = service;
    }

    [HttpGet("payments")]
    public Task<IActionResult> GetPayments([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-PAYMENTS", "Payments fetched successfully.", () => _service.GetPaymentsAsync(page, limit, cancellationToken), "Unable to process payments request.", "Reports");

    // Backed by col_db.communication_logs.
    [HttpGet("communication_logs")]
    public Task<IActionResult> GetCommunicationLogs([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-COMMUNICATION-LOGS", "Communication logs fetched successfully.", () => _service.GetCommunicationLogsAsync(page, limit, cancellationToken), "Unable to process communication logs request.", "Reports");

    [HttpGet("strategies")]
    public Task<IActionResult> GetStrategies([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-STRATEGIES", "Strategies fetched successfully.", () => _service.GetStrategiesAsync(page, limit, cancellationToken), "Unable to process strategies request.", "Reports");

    [HttpGet("strategy-execution-log")]
    public Task<IActionResult> GetStrategyExecutionLog([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-STRATEGY-EXECUTION-LOG", "Strategy execution log fetched successfully.", () => _service.GetStrategyExecutionLogAsync(page, limit, cancellationToken), "Unable to process strategy execution log request.", "Reports");

    [HttpGet("dpd-cases")]
    public Task<IActionResult> GetDpdCases([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-DPD-CASES", "DPD cases fetched successfully.", () => _service.GetDpdCasesAsync(page, limit, cancellationToken), "Unable to process dpd cases request.", "Reports");

    [HttpGet("bounce-cases")]
    public Task<IActionResult> GetBounceCases([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-BOUNCE-CASES", "Bounce cases fetched successfully.", () => _service.GetBounceCasesAsync(page, limit, cancellationToken), "Unable to process bounce cases request.", "Reports");

    [HttpGet("ptps")]
    public Task<IActionResult> GetPtps([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-PTPS", "PTPs fetched successfully.", () => _service.GetPtpsAsync(page, limit, cancellationToken), "Unable to process ptps request.", "Reports");

    [HttpGet("branches")]
    public Task<IActionResult> GetBranches([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
       => ExecuteAsync("REPORT-BRANCHES", "Branches fetched successfully.", () => _service.GetBranchesAsync(page, limit, cancellationToken), "Unable to process branches request.", "Reports");

    [HttpGet("agents")]
    public Task<IActionResult> GetAgents([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-AGENTS", "Agents fetched successfully.", () => _service.GetAgentsAsync(page, limit, cancellationToken), "Unable to process agents request.", "Reports");
}
