using backend.Modules.Reports.DTOs;
using backend.Database;
using Npgsql;
using NpgsqlTypes;

namespace backend.Modules.Reports.Repositories;

public sealed class DcspQueryRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    private sealed record TableConfig(string Schema, string PhysicalTable, string[] Columns);

    // Dictionary key is the report's public name (used by the service/controller).
    // PhysicalTable/Schema is the real underlying table, which can differ from the key
    // (e.g. "agents" report reads from auth.users, "communication_logs" report reads from
    // col_db.communication_logs).
    private static readonly Dictionary<string, TableConfig> Tables = new(StringComparer.OrdinalIgnoreCase)
    {
        ["strategies"] = new("col_db", "strategies", ["strategy_id", "strategy_name", "strategy_code", "strategy_version", "journey_type", "dpd_range_from", "dpd_range_to", "bucket", "product_code", "state", "customer_segment", "outstanding_range_min", "outstanding_range_max", "priority", "effective_date", "expiry_date", "status", "description", "created_by", "created_at", "updated_by", "updated_at", "is_active"]),
        ["strategy_execution_log"] = new("col_db", "strategy_execution_log", ["execution_id", "case_type", "case_id", "strategy_id", "status", "assigned_at", "completed_at"]),
        // Agents report now reads from auth.users (no more col_db.agents table).
        ["agents"] = new("auth", "users", ["agent_id", "username", "agent_name", "branch", "zone", "region", "role_title", "mobile", "email", "account_status", "is_active", "last_login_date", "created_date"]),
        ["branches"] = new("col_db", "branches", ["code", "name", "city", "state", "pincode", "zone_code", "region_code", "cost_center", "status", "branch_type", "branch_office_type", "location", "hub_branch_id", "hub_branch_name", "branch_manager_name", "address", "created_by", "created_at", "updated_by", "updated_at"]),
        ["dpd_cases"] = new("col_db", "dpd_cases", ["dpd_case_id", "case_ref", "pr_number", "customer_id", "customer_name", "mobile_number", "alternate_mobile", "email_id", "state", "branch_name", "product_name", "disbursal_date", "loan_amount", "emi_amount", "outstanding_principal", "outstanding_interest", "total_outstanding", "last_payment_date", "last_payment_amount", "next_emi_date", "dpd", "bucket", "loan_status", "strategy_id", "status", "mifin_batch_ref", "mifin_extraction_date", "is_active", "created_at", "updated_at"]),
        ["bounce_cases"] = new("col_db", "bounce_cases", ["bounce_case_id", "case_ref", "pr_number", "customer_id", "customer_name", "mobile_number", "alternate_mobile", "email_id", "state", "branch_name", "product_name", "disbursal_date", "loan_amount", "emi_amount", "outstanding_principal", "outstanding_interest", "total_outstanding", "last_payment_date", "last_payment_amount", "next_emi_date", "dpd", "bucket", "loan_status", "bounce_date", "bounce_reason", "nach_status", "bounce_cycle", "strategy_id", "status", "mifin_batch_ref", "mifin_extraction_date", "is_active", "created_at", "updated_at"]),
        // Payments table has no case_id — only strategy_id.
        ["payments"] = new("col_db", "payments", ["payment_id", "strategy_id", "loan_number", "amount", "payment_date", "payment_mode", "pg_transaction_id", "payment_status", "reconciled", "payment_source", "created_at"]),
        // communication_logs reads directly from col_db.communication_logs.
        ["communication_logs"] = new("col_db", "communication_logs", ["communication_id", "case_id", "strategy_id", "queue_id", "channel", "recipient", "status", "provider_message_id", "created_on", "status_updated_on"]),
        // Ptps table has no case_id — only strategy_id.
        ["ptps"] = new("col_db", "ptps", ["ptp_id", "strategy_id", "agent_id", "ptp_date", "ptp_amount", "honoured", "actual_payment_date", "created_at"])
    };

    public DcspQueryRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    /**
     * Description of what this function does: Fetches a paginated page of rows from any registered DCSP table.
     * Inputs: tableName: string (registry key), page: int, limit: int, cancellationToken: CancellationToken
     * Outputs: Task<PagedResult<TableRowDto>>
     * Dependencies: Tables dictionary, IDbConnectionFactory
     */
    public async Task<PagedResult<TableRowDto>> GetTablePageAsync(string tableName, int page, int limit, CancellationToken cancellationToken)
    {
        if (!Tables.TryGetValue(tableName, out var table))
        {
            throw new ArgumentException($"Unsupported table '{tableName}'.", nameof(tableName));
        }

        var columns = table.Columns;
        var qualifiedTable = $"{table.Schema}.{table.PhysicalTable}";

        page = page <= 0 ? 1 : page;
        limit = limit is <= 0 or > 200 ? 25 : limit;
        var offset = (page - 1) * limit;
        var selectList = string.Join(", ", columns.Select(c => $"{c}"));

        var countSql = $"SELECT COUNT(*)::int FROM {qualifiedTable};";
        var listSql = $"SELECT {selectList} FROM {qualifiedTable} ORDER BY {columns[0]} DESC LIMIT @limit OFFSET @offset;";

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        await using var countCommand = new NpgsqlCommand(countSql, connection);
        var total = Convert.ToInt32(await countCommand.ExecuteScalarAsync(cancellationToken));

        await using var listCommand = new NpgsqlCommand(listSql, connection);
        listCommand.Parameters.AddWithValue("@limit", NpgsqlDbType.Integer, limit);
        listCommand.Parameters.AddWithValue("@offset", NpgsqlDbType.Integer, offset);

        var items = new List<TableRowDto>();
        await using var reader = await listCommand.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var values = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            for (var i = 0; i < columns.Length; i++)
            {
                values[columns[i]] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }
            items.Add(new TableRowDto(values));
        }

        return new PagedResult<TableRowDto>(items, total, page, limit);
    }

    /**
     * Description of what this function does: Returns the ordered list of columns registered for a given table name.
     * Inputs: tableName: string
     * Outputs: IReadOnlyList<string> (empty list if table is not found)
     * Dependencies: Tables dictionary
     */
    public static IReadOnlyList<string> GetColumns(string tableName)
        => Tables.TryGetValue(tableName, out var table) ? table.Columns : [];
}
