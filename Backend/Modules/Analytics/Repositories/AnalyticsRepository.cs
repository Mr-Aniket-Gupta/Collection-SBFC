using backend.Modules.Analytics.DTOs;
using backend.Modules.Analytics.Requests;
using backend.Database;
using Npgsql;
using NpgsqlTypes;

namespace backend.Modules.Analytics.Repositories;

public sealed class AnalyticsRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    private const string BranchFilter = "AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)),'branch',''))) = lower(trim(replace(lower(trim(@branch_name)),'branch',''))))";
    private const string ZoneFilter = "AND (@zone IS NULL OR lower(trim((SELECT zone_code FROM branches b WHERE lower(trim(b.name)) = lower(trim(c.branch_name)) LIMIT 1))) = lower(trim(@zone)))";

    private sealed record AnalyticsKpiSnapshot(
        decimal ClosedOutstandingPrincipal,
        decimal TotalOutstandingPrincipal,
        decimal ClosedOutstandingTotal,
        decimal TotalOutstandingTotal,
        decimal TotalCommunications,
        decimal DeliveredCommunications,
        decimal TotalPtps,
        decimal HonouredPtps);

    public AnalyticsRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<AnalyticsDashboardDto> GetDashboardAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        // Run independent queries in parallel to reduce overall latency.
        var kpiTask = GetKpiCardsAsync(request, cancellationToken);
        var radarTask = GetRadarAsync(request, cancellationToken);
        var strategyTask = GetStrategyPerformanceAsync(request, cancellationToken);
        var communicationTask = GetCommunicationPerformanceAsync(request, cancellationToken);
        var channelTask = GetChannelPerformanceAsync(request, cancellationToken);
        var bucketTask = GetBucketDistributionAsync(request, cancellationToken);
        var branchTask = GetBranchContributorsAsync(request, cancellationToken);
        var agentTask = GetAgentContributorsAsync(request, cancellationToken);

        await Task.WhenAll(kpiTask, radarTask, strategyTask, communicationTask, channelTask, bucketTask, branchTask, agentTask);

        return new AnalyticsDashboardDto(
            await kpiTask,
            await radarTask,
            await strategyTask,
            await communicationTask,
            await channelTask,
            await bucketTask,
            await branchTask,
            await agentTask);
    }

    public async Task<IReadOnlyList<KpiCardDto>> GetKpiCardsAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            WITH filtered_cases AS (
                SELECT c.dpd_case_id, c.strategy_id, c.outstanding_principal, c.total_outstanding, c.loan_status, c.created_at
                FROM dpd_cases c
                LEFT JOIN branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
                WHERE (@state IS NULL OR c.state = @state)
                  AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                  AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                  AND (@start_date IS NULL OR c.created_at >= @start_date)
                  AND (@end_date IS NULL OR c.created_at < @end_date + interval '1 day')
            )
            SELECT
                COALESCE(SUM(outstanding_principal) FILTER (WHERE LOWER(loan_status) IN ('closed', 'settled', 'resolved')), 0) AS closed_outstanding_principal,
                COALESCE(SUM(outstanding_principal), 0) AS total_outstanding_principal,
                COALESCE(SUM(total_outstanding) FILTER (WHERE LOWER(loan_status) IN ('closed', 'settled', 'resolved')), 0) AS closed_outstanding_total,
                COALESCE(SUM(total_outstanding), 0) AS total_outstanding,
                COALESCE((SELECT COUNT(*)::numeric FROM communications comm INNER JOIN filtered_cases fc ON fc.strategy_id = comm.strategy_id AND (@start_date IS NULL OR comm.created_at >= @start_date) AND (@end_date IS NULL OR comm.created_at < @end_date + interval '1 day')), 0) AS total_communications,
                COALESCE((SELECT COUNT(*)::numeric FROM communications comm INNER JOIN filtered_cases fc ON fc.strategy_id = comm.strategy_id AND LOWER(comm.status) = 'delivered' AND (@start_date IS NULL OR comm.created_at >= @start_date) AND (@end_date IS NULL OR comm.created_at < @end_date + interval '1 day')), 0) AS total_delivered,
                COALESCE((SELECT COUNT(*)::numeric FROM ptps p INNER JOIN filtered_cases fc ON fc.strategy_id = p.strategy_id AND (@start_date IS NULL OR p.created_at >= @start_date) AND (@end_date IS NULL OR p.created_at < @end_date + interval '1 day')), 0) AS total_ptps,
                COALESCE((SELECT COUNT(p.ptp_id)::numeric FROM ptps p INNER JOIN filtered_cases fc ON fc.strategy_id = p.strategy_id AND p.honoured = true AND (@start_date IS NULL OR p.created_at >= @start_date) AND (@end_date IS NULL OR p.created_at < @end_date + interval '1 day')), 0) AS honoured_ptps
            FROM filtered_cases;
            """;

        var current = await ReadKpiSnapshotAsync(sql, request.StartDate, request.EndDate, request, cancellationToken);
        var previous = await ReadPreviousKpiSnapshotAsync(sql, request, cancellationToken);

        var closedOutstandingPrincipalLakhs = current.ClosedOutstandingPrincipal / 100000.0m;
        var totalOutstandingPrincipalLakhs = current.TotalOutstandingPrincipal / 100000.0m;
        var closedOutstandingTotalLakhs = current.ClosedOutstandingTotal / 100000.0m;
        var totalOutstandingLakhs = current.TotalOutstandingTotal / 100000.0m;
        var totalCommunications = current.TotalCommunications;
        var deliveredCommunications = current.DeliveredCommunications;
        var totalPtps = current.TotalPtps;
        var honouredPtps = current.HonouredPtps;

        return
        [
            new("total-outstanding-principal", "Total Outstanding Principal", closedOutstandingPrincipalLakhs.ToString("N2") + " L", $"{totalOutstandingPrincipalLakhs:N2} L out of all principal", "Closed principal out of filtered principal total", BuildTrendText(current.ClosedOutstandingPrincipal, previous.ClosedOutstandingPrincipal), BuildTrendDirection(current.ClosedOutstandingPrincipal, previous.ClosedOutstandingPrincipal), "wallet", "#000182", "bg-[var(--color-ice)]"),
            new("total-outstanding", "Total Outstanding", closedOutstandingTotalLakhs.ToString("N2") + " L", $"{totalOutstandingLakhs:N2} L out of all total outstanding", "Closed outstanding out of filtered outstanding total", BuildTrendText(current.ClosedOutstandingTotal, previous.ClosedOutstandingTotal), BuildTrendDirection(current.ClosedOutstandingTotal, previous.ClosedOutstandingTotal), "receipt", "#CE9B01", "bg-[rgba(206,155,1,0.13)]"),
            new("total-delivered", "Total Delivered", deliveredCommunications.ToString("N0"), $"{totalCommunications:N0} out of all communication rows", "Delivered rows out of filtered communications", BuildTrendText(current.DeliveredCommunications, previous.DeliveredCommunications), BuildTrendDirection(current.DeliveredCommunications, previous.DeliveredCommunications), "message-circle", "#050058", "bg-[var(--color-ice)]"),
            new("ptps-honoured", "PTPs Honoured", honouredPtps.ToString("N0"), $"{totalPtps:N0} out of all PTP rows", "Honoured PTPs out of filtered PTPs", BuildTrendText(current.HonouredPtps, previous.HonouredPtps), BuildTrendDirection(current.HonouredPtps, previous.HonouredPtps), "check-circle", "#CE9B01", "bg-[rgba(206,155,1,0.13)]")
        ];
    }

    private async Task<AnalyticsKpiSnapshot> ReadKpiSnapshotAsync(string sql, DateOnly? startDate, DateOnly? endDate, AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        ConfigureCommand(command, request, startDate, endDate);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);
        return new AnalyticsKpiSnapshot(
            reader.GetDecimal(0),
            reader.GetDecimal(1),
            reader.GetDecimal(2),
            reader.GetDecimal(3),
            reader.GetDecimal(4),
            reader.GetDecimal(5),
            reader.GetDecimal(6),
            reader.GetDecimal(7));
    }

    private async Task<AnalyticsKpiSnapshot> ReadPreviousKpiSnapshotAsync(string sql, AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        if (request.StartDate is null || request.EndDate is null)
        {
            return new AnalyticsKpiSnapshot(0, 0, 0, 0, 0, 0, 0, 0);
        }

        var span = request.EndDate.Value.DayNumber - request.StartDate.Value.DayNumber + 1;
        var previousEnd = request.StartDate.Value.AddDays(-1);
        var previousStart = previousEnd.AddDays(-(span - 1));
        return await ReadKpiSnapshotAsync(sql, previousStart, previousEnd, request, cancellationToken);
    }

    private static string? BuildTrendText(decimal current, decimal previous)
    {
        if (previous == 0) return null;
        var pct = ((current - previous) / previous) * 100m;
        var rounded = Math.Round(pct, 1, MidpointRounding.AwayFromZero);
        var sign = rounded > 0 ? "+" : "";
        return $"{sign}{rounded:N1}% vs previous period";
    }

    private static string? BuildTrendDirection(decimal current, decimal previous)
    {
        if (previous == 0) return "neutral";
        if (current > previous) return "up";
        if (current < previous) return "down";
        return "neutral";
    }

    private static void ConfigureCommand(NpgsqlCommand command, AnalyticsQueryRequest request, DateOnly? startDate = null, DateOnly? endDate = null, int? limit = null)
    {
        command.AddNullableText("@state", request.State);
        command.AddNullableText("@branch_name", request.Branch);
        command.AddNullableText("@zone", request.Zone);
        command.AddDateRange(startDate ?? request.StartDate, endDate ?? request.EndDate);

        if (limit.HasValue)
        {
            command.Parameters.AddWithValue("@limit", NpgsqlDbType.Integer, limit.Value);
        }
    }

    public async Task<IReadOnlyList<RadarDataPointDto>> GetRadarAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            WITH filtered_cases AS (
                SELECT c.strategy_id, c.total_outstanding, c.loan_status, c.created_at
                FROM dpd_cases c
                LEFT JOIN branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
                WHERE (@state IS NULL OR c.state = @state)
                  AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                  AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                  AND (@start_date IS NULL OR c.created_at >= @start_date)
                  AND (@end_date IS NULL OR c.created_at < @end_date + interval '1 day')
            )
            SELECT
                -- 1. Contact Rate
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE LOWER(comm.status) = 'delivered')::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                    FROM communications comm
                    INNER JOIN filtered_cases fc ON fc.strategy_id = comm.strategy_id
                    WHERE (@start_date IS NULL OR comm.created_at >= @start_date)
                      AND (@end_date IS NULL OR comm.created_at < @end_date + interval '1 day')
                ), 0) AS contact_rate,

                -- 2. Response Rate
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE comm.response_status IS NOT NULL AND comm.response_status <> '')::numeric / NULLIF(COUNT(*) FILTER (WHERE LOWER(comm.status) = 'delivered'), 0)) * 100, 1)
                    FROM communications comm
                    INNER JOIN filtered_cases fc ON fc.strategy_id = comm.strategy_id
                    WHERE (@start_date IS NULL OR comm.created_at >= @start_date)
                      AND (@end_date IS NULL OR comm.created_at < @end_date + interval '1 day')
                ), 0) AS response_rate,

                -- 3. PTP Success Rate
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE p.honoured = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                    FROM ptps p
                    INNER JOIN filtered_cases fc ON fc.strategy_id = p.strategy_id
                    WHERE (@start_date IS NULL OR p.created_at >= @start_date)
                      AND (@end_date IS NULL OR p.created_at < @end_date + interval '1 day')
                ), 0) AS ptp_success_rate,

                -- 4. Collection Rate
                COALESCE((
                    SELECT ROUND((SUM(pay.amount) FILTER (WHERE LOWER(pay.payment_status) = 'success')::numeric / NULLIF(SUM(fc.total_outstanding), 0)) * 100, 1)
                    FROM payments pay
                    INNER JOIN filtered_cases fc ON fc.strategy_id = pay.strategy_id
                    WHERE (@start_date IS NULL OR pay.created_at >= @start_date)
                      AND (@end_date IS NULL OR pay.created_at < @end_date + interval '1 day')
                ), 0) AS collection_rate,

                -- 5. Payment Success Rate
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE LOWER(pay.payment_status) = 'success')::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                    FROM payments pay
                    INNER JOIN filtered_cases fc ON fc.strategy_id = pay.strategy_id
                    WHERE (@start_date IS NULL OR pay.created_at >= @start_date)
                      AND (@end_date IS NULL OR pay.created_at < @end_date + interval '1 day')
                ), 0) AS payment_success_rate,

                -- 6. Case Closure Rate
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE LOWER(fc.loan_status) IN ('resolved', 'settled', 'closed'))::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                    FROM filtered_cases fc
                ), 0) AS case_closure_rate
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        ConfigureCommand(command, request);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);

        return new[]
        {
            new RadarDataPointDto("Contact Rate", reader.GetDecimal(0), 100),
            new RadarDataPointDto("Response Rate", reader.GetDecimal(1), 100),
            new RadarDataPointDto("PTP Success Rate", reader.GetDecimal(2), 100),
            new RadarDataPointDto("Collection Rate", reader.GetDecimal(3), 100),
            new RadarDataPointDto("Payment Success Rate", reader.GetDecimal(4), 100),
            new RadarDataPointDto("Case Closure Rate", reader.GetDecimal(5), 100)
        };
    }

    public async Task<IReadOnlyList<StrategyRowDto>> GetStrategyPerformanceAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT 
                COALESCE(s.strategy_name, 'Unknown') AS name,
                CASE 
                    WHEN COUNT(c.dpd_case_id) = 0 THEN 0 
                    ELSE ROUND((COUNT(c.dpd_case_id) FILTER (WHERE LOWER(c.loan_status) IN ('resolved', 'settled', 'closed'))::numeric / COUNT(c.dpd_case_id)) * 100, 1) 
                END AS percentage,
                COALESCE(s.dpd_range_to, 0)::numeric AS target
            FROM strategies s
            LEFT JOIN dpd_cases c ON c.strategy_id = s.strategy_id
            LEFT JOIN branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
            WHERE (@state IS NULL OR c.state = @state OR c.dpd_case_id IS NULL)
                AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))) OR c.dpd_case_id IS NULL)
                AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)) OR c.dpd_case_id IS NULL)
            GROUP BY s.strategy_id, s.strategy_name, s.dpd_range_to, s.priority
            ORDER BY percentage DESC, s.priority ASC NULLS LAST, s.strategy_name ASC
            LIMIT @limit;
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        ConfigureCommand(command, request, limit: request.Limit);
        var result = new List<StrategyRowDto>();
        var index = 0;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new StrategyRowDto(reader.GetString(0), reader.GetDecimal(1), reader.GetDecimal(2), index++ % 2 == 0 ? "#000182" : "#CE9B01"));
        }
        return result;
    }

    public async Task<IReadOnlyList<HourlyCallDataDto>> GetCommunicationPerformanceAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
                        SELECT TO_CHAR(date_trunc('hour', comm.created_at), 'HH24:00') AS hour, COUNT(*)::int AS calls, COUNT(*) FILTER (WHERE LOWER(comm.status) = 'delivered')::int AS responses
                        FROM communications comm
                        INNER JOIN dpd_cases c ON c.strategy_id = comm.strategy_id
                        LEFT JOIN branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
                        WHERE (@start_date IS NULL OR comm.created_at >= @start_date)
                            AND (@end_date IS NULL OR comm.created_at < @end_date + interval '1 day')
                            AND (@state IS NULL OR c.state = @state)
                            AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                            AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                        GROUP BY date_trunc('hour', comm.created_at)
                        ORDER BY date_trunc('hour', comm.created_at)
                        LIMIT @limit;
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        ConfigureCommand(command, request, limit: request.Limit);
        var result = new List<HourlyCallDataDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new HourlyCallDataDto(reader.GetString(0), reader.GetInt32(1), reader.GetInt32(2)));
        }
        return result;
    }

    public async Task<IReadOnlyList<ProductDistributionDto>> GetChannelPerformanceAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            WITH CasePayments AS (
                SELECT 
                    strategy_id, 
                    COALESCE(SUM(amount) FILTER (WHERE LOWER(payment_status) = 'success'), 0) AS recovered_amount
                FROM payments
                WHERE (@start_date IS NULL OR created_at >= @start_date)
                  AND (@end_date IS NULL OR created_at < @end_date + interval '1 day')
                GROUP BY strategy_id
            )
            SELECT 
                COALESCE(c.product_name, 'Unknown') AS name,
                COALESCE(ROUND((SUM(cp.recovered_amount)::numeric / NULLIF(SUM(c.total_outstanding), 0)) * 100, 1), 0) AS value
            FROM dpd_cases c
            LEFT JOIN CasePayments cp ON cp.strategy_id = c.strategy_id
            LEFT JOIN branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
            WHERE (@state IS NULL OR c.state = @state)
              AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
              AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
            GROUP BY c.product_name
            ORDER BY value DESC
            LIMIT @limit;
            """;

        return await ReadDistributionAsync(sql, request, cancellationToken);
    }

    public async Task<IReadOnlyList<ProductDistributionDto>> GetBucketDistributionAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT 
                COALESCE(c.bucket, 'Unknown') AS name,
                COUNT(*)::numeric AS value
            FROM dpd_cases c
            LEFT JOIN branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
            WHERE (@start_date IS NULL OR c.created_at >= @start_date)
              AND (@end_date IS NULL OR c.created_at < @end_date + interval '1 day')
              AND (@state IS NULL OR c.state = @state)
              AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
              AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
            GROUP BY c.bucket
            ORDER BY value DESC
            LIMIT @limit;
            """;

        return await ReadDistributionAsync(sql, request, cancellationToken);
    }

    public async Task<IReadOnlyList<PerformanceDto>> GetBranchContributorsAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                COALESCE(c.branch_name, 'Unknown') AS name,
                COALESCE(SUM(c.total_outstanding), 0)::numeric AS value,
                COALESCE(SUM(c.total_outstanding), 0)::numeric AS target
            FROM dpd_cases c
            LEFT JOIN branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
            WHERE (@state IS NULL OR c.state = @state)
              AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
              AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
              AND (@start_date IS NULL OR c.created_at >= @start_date)
              AND (@end_date IS NULL OR c.created_at < @end_date + interval '1 day')
            GROUP BY c.branch_name
            ORDER BY value DESC
            LIMIT @limit;
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        ConfigureCommand(command, request, limit: request.Limit);
        var result = new List<PerformanceDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new PerformanceDto(reader.GetString(0), reader.GetDecimal(1), reader.GetDecimal(2)));
        }
        return result;
    }

    public async Task<IReadOnlyList<AgentPerformanceDto>> GetAgentContributorsAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
        SELECT
            COALESCE(a.agent_name, 'Unassigned') AS agent_name,
            COUNT(DISTINCT c.dpd_case_id)::int AS allocated_cases,
            COUNT(DISTINCT c.dpd_case_id) FILTER (WHERE LOWER(c.loan_status) IN ('closed', 'settled', 'resolved'))::int AS resolved_cases,
            COALESCE(SUM(c.total_outstanding) FILTER (WHERE LOWER(c.loan_status) IN ('closed', 'settled', 'resolved')), 0)::numeric AS recovered_amount
        FROM dpd_cases c
        LEFT JOIN ptps p ON p.strategy_id = c.strategy_id
        LEFT JOIN agents a ON a.agent_id = p.agent_id
        LEFT JOIN branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
        WHERE (@state IS NULL OR c.state = @state)
          AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
          AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
          AND (@start_date IS NULL OR c.created_at >= @start_date)
          AND (@end_date IS NULL OR c.created_at < @end_date + interval '1 day')
        GROUP BY a.agent_name
        ORDER BY resolved_cases DESC, allocated_cases DESC
        LIMIT @limit;
        """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        ConfigureCommand(command, request, limit: request.Limit);
        var result = new List<AgentPerformanceDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new AgentPerformanceDto(reader.GetString(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetDecimal(3)));
        }
        return result;
    }

    private async Task<IReadOnlyList<ProductDistributionDto>> ReadDistributionAsync(string sql, AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        ConfigureCommand(command, request, limit: request.Limit);
        var result = new List<ProductDistributionDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var index = 0;
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new ProductDistributionDto(reader.GetString(0), reader.GetDecimal(1), index++ % 2 == 0 ? "#000182" : "#CE9B01"));
        }
        return result;
    }
}





