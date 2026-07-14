using backend.Modules.Reports.DTOs;
using backend.Database;
using Npgsql;
using NpgsqlTypes;

namespace backend.Modules.Reports.Repositories;

public sealed class DcspQueryRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    private sealed record TableConfig(string Schema, string PhysicalTable, string[] Columns);

    private static IReadOnlyList<string> GetCommunicationLogColumns() =>
        ["communication_id", "case_id", "strategy_id", "queue_id", "channel", "channel_name", "recipient", "status", "provider_message_id", "created_on", "status_updated_on"];

    // Dictionary key is the report's public name (used by the service/controller).
    // PhysicalTable/Schema is the real underlying table, which can differ from the key
    // (e.g. "agents" report reads from auth.users, "communication_logs" report reads from
    // col_db.communication_logs).
    private static readonly Dictionary<string, TableConfig> Tables = new(StringComparer.OrdinalIgnoreCase)
    {
        ["strategies"] = new("col_db", "strategies", ["strategy_id", "strategy_name", "strategy_code", "strategy_version", "journey_type", "dpd_range_from", "dpd_range_to", "bucket", "product_code", "state", "customer_segment", "outstanding_range_min", "outstanding_range_max", "priority", "effective_date", "expiry_date", "status", "description", "created_by", "created_at", "updated_by", "updated_at", "is_active"]),
        ["strategy_execution_log"] = new("col_db", "strategy_execution_log", ["execution_id", "case_type", "case_id", "strategy_id", "status", "assigned_at", "completed_at"]),
        ["agents"] = new("auth", "users", ["agent_id", "username", "agent_name", "branch", "zone", "region", "role_title", "mobile", "email", "account_status", "is_active", "last_login_date", "created_date"]),
        ["branches"] = new("col_db", "branches", ["code", "name", "city", "state", "pincode", "zone_code", "region_code", "cost_center", "status", "branch_type", "branch_office_type", "location", "hub_branch_id", "hub_branch_name", "branch_manager_name", "address", "created_by", "created_at", "updated_by", "updated_at"]),
        ["dpd_cases"] = new("col_db", "dpd_cases", ["dpd_case_id", "case_ref", "pr_number", "customer_id", "customer_name", "mobile_number", "alternate_mobile", "email_id", "state", "branch_name", "product_name", "disbursal_date", "loan_amount", "emi_amount", "outstanding_principal", "outstanding_interest", "total_outstanding", "last_payment_date", "last_payment_amount", "next_emi_date", "dpd", "bucket", "loan_status", "strategy_id", "status", "mifin_batch_ref", "mifin_extraction_date", "is_active", "created_at", "updated_at"]),
        ["bounce_cases"] = new("col_db", "bounce_cases", ["bounce_case_id", "case_ref", "pr_number", "customer_id", "customer_name", "mobile_number", "alternate_mobile", "email_id", "state", "branch_name", "product_name", "disbursal_date", "loan_amount", "emi_amount", "outstanding_principal", "outstanding_interest", "total_outstanding", "last_payment_date", "last_payment_amount", "next_emi_date", "dpd", "bucket", "loan_status", "bounce_date", "bounce_reason", "nach_status", "bounce_cycle", "strategy_id", "status", "mifin_batch_ref", "mifin_extraction_date", "is_active", "created_at", "updated_at"]),
        ["payments"] = new("col_db", "payments", ["payment_id", "strategy_id", "loan_number", "amount", "payment_date", "payment_mode", "pg_transaction_id", "payment_status", "reconciled", "payment_source", "created_at"]),
        ["communication_logs"] = new("col_db", "communication_logs", ["communication_id", "case_id", "strategy_id", "queue_id", "channel", "recipient", "status", "provider_message_id", "created_on", "status_updated_on"]),
        ["ptps"] = new("col_db", "ptps", ["ptp_id", "strategy_id", "agent_id", "ptp_date", "ptp_amount", "honoured", "actual_payment_date", "created_at"])
    };

    public DcspQueryRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

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

        var countSql = $"SELECT COUNT(*)::int FROM {qualifiedTable};";
        var listSql = tableName.Equals("communication_logs", StringComparison.OrdinalIgnoreCase)
            ? """
              SELECT
                  comm.communication_id,
                  comm.case_id,
                  comm.strategy_id,
                  comm.queue_id,
                  comm.channel,
                  COALESCE(cm.channel_name, comm.channel) AS channel_name,
                  comm.recipient,
                  comm.status,
                  comm.provider_message_id,
                  comm.created_on,
                  comm.status_updated_on
              FROM col_db.communication_logs AS comm
              LEFT JOIN col_db.channel_master AS cm ON cm.channel_code = comm.channel
              ORDER BY comm.communication_id DESC LIMIT @limit OFFSET @offset;
              """
            : $"SELECT {string.Join(", ", columns.Select(c => c))} FROM {qualifiedTable} ORDER BY {columns[0]} DESC LIMIT @limit OFFSET @offset;";

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        await using var countCommand = new NpgsqlCommand(countSql, connection);
        var total = Convert.ToInt32(await countCommand.ExecuteScalarAsync(cancellationToken));

        await using var listCommand = new NpgsqlCommand(listSql, connection);
        listCommand.Parameters.AddWithValue("@limit", NpgsqlDbType.Integer, limit);
        listCommand.Parameters.AddWithValue("@offset", NpgsqlDbType.Integer, offset);

        var items = new List<TableRowDto>();
        await using var reader = await listCommand.ExecuteReaderAsync(cancellationToken);
        var resultColumns = tableName.Equals("communication_logs", StringComparison.OrdinalIgnoreCase)
            ? GetCommunicationLogColumns()
            : columns;

        while (await reader.ReadAsync(cancellationToken))
        {
            var values = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            for (var i = 0; i < resultColumns.Count; i++)
            {
                values[resultColumns[i]] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }
            items.Add(new TableRowDto(values));
        }

        return new PagedResult<TableRowDto>(items, total, page, limit);
    }

    public static IReadOnlyList<string> GetColumns(string tableName)
        => tableName.Equals("communication_logs", StringComparison.OrdinalIgnoreCase)
            ? GetCommunicationLogColumns()
            : Tables.TryGetValue(tableName, out var table) ? table.Columns : [];
}
