using backend.Common.Database;
using backend.Common.Dtos;

namespace backend.Modules.Reports.Services;

public sealed class ReportsService
{
    private readonly DcspQueryRepository _repository;

    public ReportsService(DcspQueryRepository repository)
    {
        _repository = repository;
    }

    public Task<PagedResult<TableRowDto>> GetCasesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("cases", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetPaymentsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("payments", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetCommunicationsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("communications", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetStrategiesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("strategies", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetStrategyApprovalLogAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("strategy_approval_log", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetStrategyStepsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("strategy_steps", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetStrategyExecutionLogAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("strategy_execution_log", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetAgentsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("agents", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetPreEmiCasesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("pre_emi_cases", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetDpdCasesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("dpd_cases", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetBounceCasesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("bounce_cases", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetAllocationsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("allocations", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetPtpsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("ptps", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetAuditLogsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("audit_logs", page, limit, cancellationToken);
}
