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

    /**
     * Description of what this function does: Delegates pagination of the col_db.payments table to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */
    public Task<PagedResult<TableRowDto>> GetPaymentsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("payments", page, limit, cancellationToken);

    /**
     * Description of what this function does: Delegates pagination of col_db.communication_logs to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */
    // Backed by col_db.communication_logs (mapped via the "communication_logs" key in the Tables dictionary).
    public Task<PagedResult<TableRowDto>> GetCommunicationLogsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("communication_logs", page, limit, cancellationToken);

    /**
     * Description of what this function does: Delegates pagination of col_db.strategies to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */
    public Task<PagedResult<TableRowDto>> GetStrategiesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("strategies", page, limit, cancellationToken);

    /**
     * Description of what this function does: Delegates pagination of col_db.strategy_approval_log to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */

    /**
     * Description of what this function does: Delegates pagination of col_db.strategy_steps to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */

    /**
     * Description of what this function does: Delegates pagination of col_db.strategy_execution_log to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */
    public Task<PagedResult<TableRowDto>> GetStrategyExecutionLogAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("strategy_execution_log", page, limit, cancellationToken);

    /**
     * Description of what this function does: Delegates pagination of col_db.pre_emi_cases to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */

    /**
     * Description of what this function does: Delegates pagination of col_db.dpd_cases to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */
    public Task<PagedResult<TableRowDto>> GetDpdCasesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("dpd_cases", page, limit, cancellationToken);

    /**
     * Description of what this function does: Delegates pagination of col_db.bounce_cases to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */
    public Task<PagedResult<TableRowDto>> GetBounceCasesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("bounce_cases", page, limit, cancellationToken);



    /**
     * Description of what this function does: Delegates pagination of col_db.ptps to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */
    public Task<PagedResult<TableRowDto>> GetPtpsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("ptps", page, limit, cancellationToken);

    /**
     * Description of what this function does: Delegates pagination of audit_logs (deprecated — table removed in new schema).
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */

    /**
     * Description of what this function does: Delegates pagination of col_db.branches to the repository.
     * Inputs: page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: DcspQueryRepository.GetTablePageAsync
     */
    public Task<PagedResult<TableRowDto>> GetBranchesAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("branches", page, limit, cancellationToken);

    public Task<PagedResult<TableRowDto>> GetAgentsAsync(int page, int limit, CancellationToken cancellationToken)
        => _repository.GetTablePageAsync("agents", page, limit, cancellationToken);
}
