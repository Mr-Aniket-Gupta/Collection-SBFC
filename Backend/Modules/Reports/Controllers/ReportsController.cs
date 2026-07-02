using backend.Common.Controllers;
using backend.Modules.Reports.Services;
using Microsoft.AspNetCore.Mvc;

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

    [HttpGet("cases")]
    public Task<IActionResult> GetCases([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-CASES", "Cases fetched successfully.", () => _service.GetCasesAsync(page, limit, cancellationToken), "Unable to process cases request.", "Reports");

    [HttpGet("payments")]
    public Task<IActionResult> GetPayments([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-PAYMENTS", "Payments fetched successfully.", () => _service.GetPaymentsAsync(page, limit, cancellationToken), "Unable to process payments request.", "Reports");

    [HttpGet("communications")]
    public Task<IActionResult> GetCommunications([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-COMMUNICATIONS", "Communications fetched successfully.", () => _service.GetCommunicationsAsync(page, limit, cancellationToken), "Unable to process communications request.", "Reports");

    [HttpGet("strategies")]
    public Task<IActionResult> GetStrategies([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-STRATEGIES", "Strategies fetched successfully.", () => _service.GetStrategiesAsync(page, limit, cancellationToken), "Unable to process strategies request.", "Reports");

    [HttpGet("strategy-approval-log")]
    public Task<IActionResult> GetStrategyApprovalLog([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-STRATEGY-APPROVAL-LOG", "Strategy approval log fetched successfully.", () => _service.GetStrategyApprovalLogAsync(page, limit, cancellationToken), "Unable to process strategy approval log request.", "Reports");

    [HttpGet("strategy-steps")]
    public Task<IActionResult> GetStrategySteps([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-STRATEGY-STEPS", "Strategy steps fetched successfully.", () => _service.GetStrategyStepsAsync(page, limit, cancellationToken), "Unable to process strategy steps request.", "Reports");

    [HttpGet("strategy-execution-log")]
    public Task<IActionResult> GetStrategyExecutionLog([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-STRATEGY-EXECUTION-LOG", "Strategy execution log fetched successfully.", () => _service.GetStrategyExecutionLogAsync(page, limit, cancellationToken), "Unable to process strategy execution log request.", "Reports");

    [HttpGet("agents")]
    public Task<IActionResult> GetAgents([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-AGENTS", "Agents fetched successfully.", () => _service.GetAgentsAsync(page, limit, cancellationToken), "Unable to process agents request.", "Reports");

    [HttpGet("pre-emi-cases")]
    public Task<IActionResult> GetPreEmiCases([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-PRE-EMI-CASES", "Pre EMI cases fetched successfully.", () => _service.GetPreEmiCasesAsync(page, limit, cancellationToken), "Unable to process pre emi cases request.", "Reports");

    [HttpGet("dpd-cases")]
    public Task<IActionResult> GetDpdCases([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-DPD-CASES", "DPD cases fetched successfully.", () => _service.GetDpdCasesAsync(page, limit, cancellationToken), "Unable to process dpd cases request.", "Reports");

    [HttpGet("bounce-cases")]
    public Task<IActionResult> GetBounceCases([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-BOUNCE-CASES", "Bounce cases fetched successfully.", () => _service.GetBounceCasesAsync(page, limit, cancellationToken), "Unable to process bounce cases request.", "Reports");

    [HttpGet("allocations")]
    public Task<IActionResult> GetAllocations([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-ALLOCATIONS", "Allocations fetched successfully.", () => _service.GetAllocationsAsync(page, limit, cancellationToken), "Unable to process allocations request.", "Reports");

    [HttpGet("ptps")]
    public Task<IActionResult> GetPtps([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-PTPS", "PTPs fetched successfully.", () => _service.GetPtpsAsync(page, limit, cancellationToken), "Unable to process ptps request.", "Reports");

    [HttpGet("audit-logs")]
    public Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-AUDIT-LOGS", "Audit logs fetched successfully.", () => _service.GetAuditLogsAsync(page, limit, cancellationToken), "Unable to process audit logs request.", "Reports");
}
