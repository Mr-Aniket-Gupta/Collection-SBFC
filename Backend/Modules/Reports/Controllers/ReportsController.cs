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

    /**
     * Description of what this function does: GET /api/reports/payments — Returns a paginated list of payment records.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetPaymentsAsync, ApiControllerBase.ExecuteAsync
     */
    [HttpGet("payments")]
    public Task<IActionResult> GetPayments([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-PAYMENTS", "Payments fetched successfully.", () => _service.GetPaymentsAsync(page, limit, cancellationToken), "Unable to process payments request.", "Reports");

    /**
     * Description of what this function does: GET /api/reports/communication_logs — Returns paginated communication_logs rows.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetCommunicationLogsAsync, ApiControllerBase.ExecuteAsync
     */
    // Backed by col_db.communication_logs.
    [HttpGet("communication_logs")]
    public Task<IActionResult> GetCommunicationLogs([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-COMMUNICATION-LOGS", "Communication logs fetched successfully.", () => _service.GetCommunicationLogsAsync(page, limit, cancellationToken), "Unable to process communication logs request.", "Reports");

    /**
     * Description of what this function does: GET /api/reports/strategies — Returns paginated strategies rows.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetStrategiesAsync, ApiControllerBase.ExecuteAsync
     */
    [HttpGet("strategies")]
    public Task<IActionResult> GetStrategies([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-STRATEGIES", "Strategies fetched successfully.", () => _service.GetStrategiesAsync(page, limit, cancellationToken), "Unable to process strategies request.", "Reports");

    /**
     * Description of what this function does: GET /api/reports/strategy-approval-log — Returns paginated approval log rows.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetStrategyApprovalLogAsync, ApiControllerBase.ExecuteAsync
     */

    /**
     * Description of what this function does: GET /api/reports/strategy-steps — Returns paginated strategy steps rows.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetStrategyStepsAsync, ApiControllerBase.ExecuteAsync
     */

    /**
     * Description of what this function does: GET /api/reports/strategy-execution-log — Returns paginated execution log rows.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetStrategyExecutionLogAsync, ApiControllerBase.ExecuteAsync
     */
    [HttpGet("strategy-execution-log")]
    public Task<IActionResult> GetStrategyExecutionLog([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-STRATEGY-EXECUTION-LOG", "Strategy execution log fetched successfully.", () => _service.GetStrategyExecutionLogAsync(page, limit, cancellationToken), "Unable to process strategy execution log request.", "Reports");

    /**
     * Description of what this function does: GET /api/reports/pre-emi-cases — Returns paginated pre-EMI case rows.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetPreEmiCasesAsync, ApiControllerBase.ExecuteAsync
     */

    /**
     * Description of what this function does: GET /api/reports/dpd-cases — Returns paginated DPD case rows.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetDpdCasesAsync, ApiControllerBase.ExecuteAsync
     */
    [HttpGet("dpd-cases")]
    public Task<IActionResult> GetDpdCases([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-DPD-CASES", "DPD cases fetched successfully.", () => _service.GetDpdCasesAsync(page, limit, cancellationToken), "Unable to process dpd cases request.", "Reports");

    /**
     * Description of what this function does: GET /api/reports/bounce-cases — Returns paginated bounce case rows.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetBounceCasesAsync, ApiControllerBase.ExecuteAsync
     */
    [HttpGet("bounce-cases")]
    public Task<IActionResult> GetBounceCases([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-BOUNCE-CASES", "Bounce cases fetched successfully.", () => _service.GetBounceCasesAsync(page, limit, cancellationToken), "Unable to process bounce cases request.", "Reports");



    /**
     * Description of what this function does: GET /api/reports/ptps — Returns paginated PTP (Promise-To-Pay) rows.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetPtpsAsync, ApiControllerBase.ExecuteAsync
     */
    [HttpGet("ptps")]
    public Task<IActionResult> GetPtps([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-PTPS", "PTPs fetched successfully.", () => _service.GetPtpsAsync(page, limit, cancellationToken), "Unable to process ptps request.", "Reports");

    /**
     * Description of what this function does: GET /api/reports/audit-logs — Deprecated endpoint; audit_logs table no longer exists.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetAuditLogsAsync, ApiControllerBase.ExecuteAsync
     */

    /**
     * Description of what this function does: GET /api/reports/branches — Returns paginated branch rows from col_db.branches.
     * Inputs: page: int (query), limit: int (query), cancellationToken: CancellationToken
     * Outputs: IActionResult wrapping PagedResult<TableRowDto>
     * Dependencies: ReportsService.GetBranchesAsync, ApiControllerBase.ExecuteAsync
     */
    [HttpGet("branches")]
    public Task<IActionResult> GetBranches([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
       => ExecuteAsync("REPORT-BRANCHES", "Branches fetched successfully.", () => _service.GetBranchesAsync(page, limit, cancellationToken), "Unable to process branches request.", "Reports");

    [HttpGet("agents")]
    public Task<IActionResult> GetAgents([FromQuery] int page = 1, [FromQuery] int limit = 25, CancellationToken cancellationToken = default)
        => ExecuteAsync("REPORT-AGENTS", "Agents fetched successfully.", () => _service.GetAgentsAsync(page, limit, cancellationToken), "Unable to process agents request.", "Reports");
}
