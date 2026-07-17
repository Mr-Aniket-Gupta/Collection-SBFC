using backend.Modules.Reports.DTOs;
using backend.Modules.Reports.Repositories;

namespace backend.Modules.Reports.Services;

public sealed class ReportsService
{
    private readonly DcspQueryRepository _repository;

    public ReportsService(DcspQueryRepository repository)
    {
        _repository = repository;
    }

    public Task<PagedResult<TableRowDto>> GetPaymentsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("payments", page, limit, cancellationToken);

    // Backed by col_db.communication_logs (mapped via the "communication_logs" key in the Tables dictionary).
    public Task<PagedResult<TableRowDto>> GetCommunicationLogsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("communication_logs", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetStrategiesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("strategies", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetStrategyExecutionLogAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("strategy_execution_log", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetDpdCasesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("dpd_cases", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetBounceCasesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("bounce_cases", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetPtpsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("ptps", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetBranchesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("branches", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetAgentsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("agents", page, limit, cancellationToken);
}
