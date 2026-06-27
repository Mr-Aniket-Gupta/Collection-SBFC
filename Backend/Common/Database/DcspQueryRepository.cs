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
        ["agents"] = ["agent_id", "agent_name", "role", "branch", "zone", "state", "max_capacity", "current_load", "language", "mobile", "email", "status"],
        ["allocations"] = ["allocation_id", "case_id", "allocated_to", "role", "allocated_at", "deallocated_at", "reason", "allocation_status"],
        ["audit_logs"] = ["log_id", "entity_type", "entity_id", "action", "old_value", "new_value", "user_name", "ip_address", "created_at"],
        ["cases"] = ["case_id", "case_number", "pr_number", "loan_number", "customer_id", "journey_type", "bucket", "dpd", "strategy_id", "assigned_to", "outstanding_principal", "outstanding_interest", "outstanding_total", "status", "branch", "zone", "state", "created_at", "updated_at"],
        ["communications"] = ["communication_id", "case_id", "channel", "template_name", "status", "sent_at", "delivered_at", "read_at", "response_status", "retry_count", "created_at"],
        ["payments"] = ["payment_id", "case_id", "loan_number", "amount", "payment_date", "payment_mode", "pg_transaction_id", "payment_status", "reconciled", "payment_source", "created_at"],
        ["ptps"] = ["ptp_id", "case_id", "agent_id", "ptp_date", "ptp_amount", "honoured", "actual_payment_date", "created_at"],
        ["strategies"] = ["strategy_id", "strategy_code", "version", "strategy_name", "journey_type", "bucket", "dpd_from", "dpd_to", "priority", "status", "effective_date", "expiry_date", "created_at"]
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

        var countSql = $"SELECT COUNT(*)::int FROM dcsp.{tableName};";
        var listSql = $"SELECT {selectList} FROM dcsp.{tableName} ORDER BY {columns[0]} DESC LIMIT @limit OFFSET @offset;";

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
