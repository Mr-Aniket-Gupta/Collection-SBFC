using backend.Common.Dtos;
using backend.Database;
using Npgsql;
using NpgsqlTypes;
using System.Text;

namespace backend.Common.Database;

public sealed class DcspQueryRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    private static readonly Dictionary<string, string[]> TableColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        ["strategies"] = ["strategy_id", "strategy_name", "strategy_code", "strategy_version", "journey_type", "dpd_range_from", "dpd_range_to", "bucket", "product_code", "state", "customer_segment", "outstanding_range_min", "outstanding_range_max", "priority", "effective_date", "expiry_date", "status", "description", "created_by", "created_at", "updated_by", "updated_at", "is_active"],
        ["strategy_approval_log"] = ["approval_log_id", "strategy_id", "from_status", "to_status", "action", "actor_id", "actor_role", "remarks", "performed_at", "ip_address"],
        ["strategy_steps"] = ["strategy_step_id", "step_number", "step_name", "trigger_delay_value", "channel", "template_code", "retry_count", "retry_delay_hours", "payment_check_before_step", "condition_expression", "escalation_trigger", "escalation_target", "status", "created_by", "created_at", "updated_by", "updated_at", "strategy_id", "is_active"],
        ["strategy_execution_log"] = ["execution_id", "case_type", "case_id", "strategy_id", "status", "assigned_at", "completed_at"],
        ["agents"] = ["agent_id", "agent_name", "role", "branch", "zone", "state", "max_capacity", "current_load", "language", "mobile", "email", "status"],
        ["cases"] = ["case_id", "case_number", "pr_number", "loan_number", "customer_id", "journey_type", "bucket", "dpd", "strategy_id", "assigned_to", "outstanding_principal", "outstanding_interest", "outstanding_total", "status", "branch", "zone", "state", "created_at", "updated_at"],
        ["pre_emi_cases"] = ["pre_emi_case_id", "case_ref", "pr_number", "customer_id", "customer_name", "mobile_number", "alternate_mobile", "email_id", "product_name", "pre_emi_amount", "pre_emi_date", "strategy_id", "status", "mifin_batch_ref", "mifin_extraction_date", "is_active", "created_at", "updated_at"],
        ["dpd_cases"] = ["dpd_case_id", "case_ref", "pr_number", "customer_id", "customer_name", "mobile_number", "alternate_mobile", "email_id", "state", "branch_name", "product_name", "disbursal_date", "loan_amount", "emi_amount", "outstanding_principal", "outstanding_interest", "total_outstanding", "last_payment_date", "last_payment_amount", "next_emi_date", "dpd", "bucket", "loan_status", "strategy_id", "status", "mifin_batch_ref", "mifin_extraction_date", "is_active", "created_at", "updated_at"],
        ["bounce_cases"] = ["bounce_case_id", "case_ref", "pr_number", "customer_id", "customer_name", "mobile_number", "alternate_mobile", "email_id", "state", "branch_name", "product_name", "disbursal_date", "loan_amount", "emi_amount", "outstanding_principal", "outstanding_interest", "total_outstanding", "last_payment_date", "last_payment_amount", "next_emi_date", "dpd", "bucket", "loan_status", "bounce_date", "bounce_reason", "nach_status", "bounce_cycle", "strategy_id", "status", "mifin_batch_ref", "mifin_extraction_date", "is_active", "created_at", "updated_at"],
        ["payments"] = ["payment_id", "case_id", "loan_number", "amount", "payment_date", "payment_mode", "pg_transaction_id", "payment_status", "reconciled", "payment_source", "created_at"],
        ["communications"] = ["communication_id", "case_id", "channel", "template_name", "status", "sent_at", "delivered_at", "read_at", "response_status", "retry_count", "created_at"],
        ["allocations"] = ["allocation_id", "case_id", "allocated_to", "role", "allocated_at", "deallocated_at", "reason", "allocation_status"],
        ["ptps"] = ["ptp_id", "case_id", "agent_id", "ptp_date", "ptp_amount", "honoured", "actual_payment_date", "created_at"],
        ["audit_logs"] = ["log_id", "entity_type", "entity_id", "action", "old_value", "new_value", "user_name", "ip_address", "created_at"]
    };

    public DcspQueryRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<PagedResult<TableRowDto>> GetTablePageAsync(string tableName, int page, int limit, CancellationToken cancellationToken)
    {
        if (!TableColumns.TryGetValue(tableName, out var columns))
        {
            throw new ArgumentException($"Unsupported table '{tableName}'.", nameof(tableName));
        }

        page = page <= 0 ? 1 : page;
        limit = limit is <= 0 or > 200 ? 25 : limit;
        var offset = (page - 1) * limit;
        var selectList = string.Join(", ", columns.Select(c => $"{c}"));

        var countSql = $"SELECT COUNT(*)::int FROM {tableName};";
        var listSql = $"SELECT {selectList} FROM {tableName} ORDER BY {columns[0]} DESC LIMIT @limit OFFSET @offset;";

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

    public static IReadOnlyList<string> GetColumns(string tableName)
        => TableColumns.TryGetValue(tableName, out var columns) ? columns : [];
}
