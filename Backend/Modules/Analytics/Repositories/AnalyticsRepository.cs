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
        decimal PendingStrategyOutstandingPrincipal,
        decimal TotalOutstandingPrincipal,
        decimal PendingTotalOutstanding,
        decimal TotalOutstandingTotal,
        decimal TotalCommunications,
        decimal DeliveredCommunications,
        decimal TotalPtps,
        decimal HonouredPtps);

    public AnalyticsRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    /**
     * Description of what this function does: Orchestrates parallel fetching of all dashboard metrics.
     * Inputs: request: AnalyticsQueryRequest, cancellationToken: CancellationToken
     * Outputs: Task<AnalyticsDashboardDto>
     * Dependencies: GetKpiCardsAsync, GetRadarAsync, GetStrategyPerformanceAsync, GetStrategyGapAsync, GetCommunicationPerformanceAsync, GetCommunicationEfficiencyAsync, GetChannelPerformanceAsync, GetBucketDistributionAsync, GetBranchContributorsAsync, GetAgentContributorsAsync
     */
    public async Task<AnalyticsDashboardDto> GetDashboardAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        // Run independent queries in parallel to reduce overall latency.
        var kpiTask = GetKpiCardsAsync(request, cancellationToken);
        var radarTask = GetRadarAsync(request, cancellationToken);
        var strategyTask = GetStrategyPerformanceAsync(request, cancellationToken);
        var strategyGapTask = GetStrategyGapAsync(request, cancellationToken);
        var communicationTask = GetCommunicationPerformanceAsync(request, cancellationToken);
        var communicationEfficiencyTask = GetCommunicationEfficiencyAsync(request, cancellationToken);
        var channelTask = GetChannelPerformanceAsync(request, cancellationToken);
        var bucketTask = GetBucketDistributionAsync(request, cancellationToken);
        var branchTask = GetBranchContributorsAsync(request, cancellationToken);
        var agentTask = GetAgentContributorsAsync(request, cancellationToken);

        await Task.WhenAll(kpiTask, radarTask, strategyTask, strategyGapTask, communicationTask, communicationEfficiencyTask, channelTask, bucketTask, branchTask, agentTask);

        return new AnalyticsDashboardDto(
            await kpiTask,
            await radarTask,
            await strategyTask,
            await strategyGapTask,
            await communicationTask,
            await communicationEfficiencyTask,
            await channelTask,
            await bucketTask,
            await branchTask,
            await agentTask);
    }

    /**
     * Description of what this function does: Computes KPI summary cards comparing current vs previous period.
     * Inputs: request: AnalyticsQueryRequest, cancellationToken: CancellationToken
     * Outputs: Task<IReadOnlyList<KpiCardDto>>
     * Dependencies: ReadKpiSnapshotAsync, ReadPreviousKpiSnapshotAsync, BuildTrendText, BuildTrendDirection
     */
    public async Task<IReadOnlyList<KpiCardDto>> GetKpiCardsAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            WITH filtered_dpd_cases AS (
                SELECT c.dpd_case_id AS case_id, c.strategy_id, c.outstanding_principal, c.total_outstanding, c.loan_status, c.created_at, c.is_active, c.status, c.branch_name, c.state
                FROM col_db.dpd_cases c
                LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
                WHERE (@state IS NULL OR c.state = @state)
                  AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                  AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                  AND (@start_date IS NULL OR c.created_at >= @start_date)
                  AND (@end_date IS NULL OR c.created_at < @end_date + interval '1 day')
            ),
            filtered_bounce_cases AS (
                SELECT c.bounce_case_id AS case_id, c.strategy_id, c.outstanding_principal, c.total_outstanding, c.loan_status, c.created_at, c.is_active, c.status, c.branch_name, c.state
                FROM col_db.bounce_cases c
                LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
                WHERE (@state IS NULL OR c.state = @state)
                  AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                  AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                  AND (@start_date IS NULL OR c.created_at >= @start_date)
                  AND (@end_date IS NULL OR c.created_at < @end_date + interval '1 day')
            ),
            all_cases AS (
                SELECT case_id, strategy_id, outstanding_principal, total_outstanding, loan_status, created_at, is_active, status, branch_name, state FROM filtered_dpd_cases
                UNION ALL
                SELECT case_id, strategy_id, outstanding_principal, total_outstanding, loan_status, created_at, is_active, status, branch_name, state FROM filtered_bounce_cases
            )
            SELECT
                COALESCE(SUM(outstanding_principal) FILTER (WHERE LOWER(status) = 'pending_strategy'), 0) AS pending_strategy_outstanding_principal,
                COALESCE(SUM(outstanding_principal), 0) AS total_outstanding_principal,
                COALESCE(SUM(total_outstanding) FILTER (WHERE LOWER(loan_status) = 'active'), 0) AS pending_total_outstanding,
                COALESCE(SUM(total_outstanding), 0) AS total_outstanding,
                COALESCE((SELECT COUNT(*)::numeric FROM col_db.communication_logs comm INNER JOIN all_cases ac ON ac.strategy_id = comm.strategy_id WHERE (@start_date IS NULL OR comm.created_on >= @start_date) AND (@end_date IS NULL OR comm.created_on < @end_date + interval '1 day')), 0) AS total_communications,
                COALESCE((SELECT COUNT(*)::numeric FROM col_db.communication_logs comm INNER JOIN all_cases ac ON ac.strategy_id = comm.strategy_id WHERE LOWER(comm.status) = 'delivered' AND (@start_date IS NULL OR comm.created_on >= @start_date) AND (@end_date IS NULL OR comm.created_on < @end_date + interval '1 day')), 0) AS total_delivered,
                COALESCE((SELECT COUNT(*)::numeric FROM col_db.ptps p INNER JOIN all_cases ac ON ac.strategy_id = p.strategy_id AND (@start_date IS NULL OR p.created_at >= @start_date) AND (@end_date IS NULL OR p.created_at < @end_date + interval '1 day')), 0) AS total_ptps,
                COALESCE((SELECT COUNT(p.ptp_id)::numeric FROM col_db.ptps p INNER JOIN all_cases ac ON ac.strategy_id = p.strategy_id AND p.honoured = true AND (@start_date IS NULL OR p.created_at >= @start_date) AND (@end_date IS NULL OR p.created_at < @end_date + interval '1 day')), 0) AS honoured_ptps
            FROM all_cases;
            """;

        var current = await ReadKpiSnapshotAsync(sql, request.StartDate, request.EndDate, request, cancellationToken);
        var previous = await ReadPreviousKpiSnapshotAsync(sql, request, cancellationToken);

        var pendingStrategyOutstandingPrincipalLakhs = current.PendingStrategyOutstandingPrincipal / 100000.0m;
        var totalOutstandingPrincipalLakhs = current.TotalOutstandingPrincipal / 100000.0m;
        var pendingTotalOutstandingLakhs = current.PendingTotalOutstanding / 100000.0m;
        var totalOutstandingLakhs = current.TotalOutstandingTotal / 100000.0m;
        var totalCommunications = current.TotalCommunications;
        var deliveredCommunications = current.DeliveredCommunications;
        var totalPtps = current.TotalPtps;
        var honouredPtps = current.HonouredPtps;

        return
        [
            new("total-outstanding-principal", "Total Outstanding Principal", pendingStrategyOutstandingPrincipalLakhs.ToString("N2") + " L", $"{totalOutstandingPrincipalLakhs:N2} L total outstanding principal", "Outstanding principal with PENDING_STRATEGY status", BuildTrendText(current.PendingStrategyOutstandingPrincipal, previous.PendingStrategyOutstandingPrincipal), BuildTrendDirection(current.PendingStrategyOutstandingPrincipal, previous.PendingStrategyOutstandingPrincipal), "wallet", "#000182", "bg-[var(--color-ice)]"),
            new("total-outstanding", "Total Outstanding", pendingTotalOutstandingLakhs.ToString("N2") + " L", $"{totalOutstandingLakhs:N2} L total outstanding", "Total outstanding with ACTIVE loan status", BuildTrendText(current.PendingTotalOutstanding, previous.PendingTotalOutstanding), BuildTrendDirection(current.PendingTotalOutstanding, previous.PendingTotalOutstanding), "receipt", "#CE9B01", "bg-[rgba(206,155,1,0.13)]"),
            new("total-delivered", "Total Delivered", deliveredCommunications.ToString("N0"), $"{totalCommunications:N0} out of all communication rows", "Delivered rows out of filtered communications", BuildTrendText(current.DeliveredCommunications, previous.DeliveredCommunications), BuildTrendDirection(current.DeliveredCommunications, previous.DeliveredCommunications), "message-circle", "#050058", "bg-[var(--color-ice)]"),
            new("ptps-honoured", "PTPs Honoured", honouredPtps.ToString("N0"), $"{totalPtps:N0} out of all PTP rows", "Honoured PTPs out of filtered PTPs", BuildTrendText(current.HonouredPtps, previous.HonouredPtps), BuildTrendDirection(current.HonouredPtps, previous.HonouredPtps), "check-circle", "#CE9B01", "bg-[rgba(206,155,1,0.13)]")
        ];
    }

    /**
     * Description of what this function does: Executes a DB query to build a KPI Snapshot object.
     * Inputs: sql: string, startDate: DateOnly?, endDate: DateOnly?, request: AnalyticsQueryRequest, cancellationToken: CancellationToken
     * Outputs: Task<AnalyticsKpiSnapshot>
     * Dependencies: IDbConnectionFactory, ConfigureCommand
     */
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

    /**
     * Description of what this function does: Fetches KPI values for the previous equivalent time span.
     * Inputs: sql: string, request: AnalyticsQueryRequest, cancellationToken: CancellationToken
     * Outputs: Task<AnalyticsKpiSnapshot>
     * Dependencies: ReadKpiSnapshotAsync
     */
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

    /**
     * Description of what this function does: Constructs display text representing percentage period-over-period differences.
     * Inputs: current: decimal, previous: decimal
     * Outputs: string?
     * Dependencies: none
     */
    private static string? BuildTrendText(decimal current, decimal previous)
    {
        if (previous == 0) return null;
        var pct = ((current - previous) / previous) * 100m;
        var rounded = Math.Round(pct, 1, MidpointRounding.AwayFromZero);
        var sign = rounded > 0 ? "+" : "";
        return $"{sign}{rounded:N1}% vs previous period";
    }

    /**
     * Description of what this function does: Determines the direction keyword (up/down/neutral) representing period differences.
     * Inputs: current: decimal, previous: decimal
     * Outputs: string? (up, down, neutral)
     * Dependencies: none
     */
    private static string? BuildTrendDirection(decimal current, decimal previous)
    {
        if (previous == 0) return "neutral";
        if (current > previous) return "up";
        if (current < previous) return "down";
        return "neutral";
    }

    /**
     * Description of what this function does: Attaches nullable filter params to database command objects.
     * Inputs: command: NpgsqlCommand, request: AnalyticsQueryRequest, startDate?: DateOnly?, endDate?: DateOnly?, limit?: int?
     * Outputs: void
     * Dependencies: none
     */
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

    /**
     * Description of what this function does: Returns contact, response, PTP, case-closure and collection rates.
     * Inputs: request: AnalyticsQueryRequest, cancellationToken: CancellationToken
     * Outputs: Task<IReadOnlyList<RadarDataPointDto>>
     * Dependencies: ConfigureCommand, IDbConnectionFactory
     */
    public async Task<IReadOnlyList<RadarDataPointDto>> GetRadarAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            WITH filtered_dpd_cases AS (
                SELECT c.dpd_case_id AS case_id, c.strategy_id, c.total_outstanding, c.status, c.is_active, c.branch_name, c.state, c.created_at
                FROM col_db.dpd_cases c
                LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
                WHERE (@state IS NULL OR c.state = @state)
                  AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                  AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                  AND (@start_date IS NULL OR c.created_at >= @start_date)
                  AND (@end_date IS NULL OR c.created_at < @end_date + interval '1 day')
            ),
            filtered_bounce_cases AS (
                SELECT c.bounce_case_id AS case_id, c.strategy_id, c.total_outstanding, c.status, c.is_active, c.branch_name, c.state, c.created_at
                FROM col_db.bounce_cases c
                LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
                WHERE (@state IS NULL OR c.state = @state)
                  AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                  AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                  AND (@start_date IS NULL OR c.created_at >= @start_date)
                  AND (@end_date IS NULL OR c.created_at < @end_date + interval '1 day')
            ),
            all_cases AS (
                SELECT case_id, strategy_id, total_outstanding, status, is_active, branch_name, state, created_at FROM filtered_dpd_cases
                UNION ALL
                SELECT case_id, strategy_id, total_outstanding, status, is_active, branch_name, state, created_at FROM filtered_bounce_cases
            )
            SELECT
                -- Contact Rate
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE LOWER(comm.status) = 'delivered')::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                    FROM col_db.communication_logs comm
                    INNER JOIN all_cases ac ON ac.strategy_id = comm.strategy_id
                    WHERE (@start_date IS NULL OR comm.created_on >= @start_date)
                      AND (@end_date IS NULL OR comm.created_on < @end_date + interval '1 day')
                ), 0) AS contact_rate,
                -- Response Rate
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE LOWER(comm.status) IN ('responded'))::numeric / NULLIF(COUNT(*) FILTER (WHERE LOWER(comm.status) = 'delivered'), 0)) * 100, 1)
                    FROM col_db.communication_logs comm
                    INNER JOIN all_cases ac ON ac.strategy_id = comm.strategy_id
                    WHERE (@start_date IS NULL OR comm.created_on >= @start_date)
                      AND (@end_date IS NULL OR comm.created_on < @end_date + interval '1 day')
                ), 0) AS response_rate,
                -- PTP Success Rate
                COALESCE(
                    (SELECT ROUND((COUNT(*) FILTER (WHERE p.honoured = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                     FROM col_db.ptps p
                     INNER JOIN all_cases ac ON ac.strategy_id = p.strategy_id
                     WHERE (@start_date IS NULL OR p.created_at >= @start_date)
                       AND (@end_date IS NULL OR p.created_at < @end_date + interval '1 day')),
                    COALESCE(
                        (SELECT ROUND((COUNT(*) FILTER (WHERE LOWER(ac.status) = 'payment_received')::numeric / NULLIF(COUNT(*) FILTER (WHERE LOWER(ac.status) = 'responded'), 0)) * 100, 1)
                         FROM all_cases ac),
                        0
                    )
                ) AS ptp_success_rate,
                -- Collection Rate
                COALESCE(
                    ROUND(
                        (SELECT SUM(pay.amount) FILTER (WHERE LOWER(pay.payment_status) = 'success')::numeric
                         FROM col_db.payments pay
                         INNER JOIN all_cases ac ON ac.strategy_id = pay.strategy_id
                         WHERE (@start_date IS NULL OR pay.created_at >= @start_date)
                           AND (@end_date IS NULL OR pay.created_at < @end_date + interval '1 day')
                        )
                        /
                        NULLIF(
                            (SELECT SUM(total_outstanding) FROM all_cases)
                        , 0) * 100
                    , 1)
                , 0) AS collection_rate,
                -- Payment Success Rate
                COALESCE(
                    ROUND(
                        (SELECT COUNT(*) FILTER (WHERE LOWER(pay.payment_status) = 'success')::numeric / NULLIF(COUNT(*), 0) * 100
                         FROM col_db.payments pay
                         INNER JOIN all_cases ac ON ac.strategy_id = pay.strategy_id
                         WHERE (@start_date IS NULL OR pay.created_at >= @start_date)
                           AND (@end_date IS NULL OR pay.created_at < @end_date + interval '1 day')
                        )
                    , 1)
                , 0) AS payment_success_rate,
                -- Case Closure Rate
                COALESCE(
                    ROUND(
                        (SELECT COUNT(*) FILTER (WHERE LOWER(status) = 'closed_resolved')::numeric / NULLIF(COUNT(*) FILTER (WHERE is_active = true), 0) * 100
                         FROM all_cases)
                    , 1)
                , 0) AS case_closure_rate
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
                COALESCE(
                    ROUND(
                        (COALESCE((
                            SELECT SUM(p.amount)
                            FROM col_db.payments p
                            WHERE p.strategy_id = s.strategy_id
                              AND LOWER(p.payment_status) = 'success'
                              AND (@start_date IS NULL OR p.created_at >= @start_date)
                              AND (@end_date IS NULL OR p.created_at < @end_date + interval '1 day')
                        ), 0)::numeric
                        /
                        NULLIF(
                            COALESCE((
                                SELECT SUM(c.total_outstanding)
                                FROM col_db.dpd_cases c
                                LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
                                WHERE c.strategy_id = s.strategy_id
                                  AND (@state IS NULL OR c.state = @state)
                                  AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                                  AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                            ), 0)
                            +
                            COALESCE((
                                SELECT SUM(bc.total_outstanding)
                                FROM col_db.bounce_cases bc
                                LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(bc.branch_name))
                                WHERE bc.strategy_id = s.strategy_id
                                  AND (@state IS NULL OR bc.state = @state)
                                  AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(bc.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                                  AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                            ), 0)
                        , 0)) * 100
                    , 1)
                , 0) AS percentage,
                100::numeric AS target
            FROM col_db.strategies s
            GROUP BY s.strategy_id, s.strategy_name, s.priority
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

    public async Task<IReadOnlyList<StrategyRowDto>> GetStrategyGapAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                COALESCE(s.strategy_name, 'Unknown') AS name,
                COALESCE(
                    ROUND(
                        (COUNT(sel.case_id) FILTER (WHERE LOWER(sel.status) IN ('closed_resolved', 'payment_received'))::numeric
                        /
                        NULLIF(COUNT(sel.case_id), 0)) * 100
                    , 1)
                , 0) AS percentage,
                COALESCE(
                    ROUND(
                        (COALESCE((
                            SELECT SUM(p.amount)
                            FROM col_db.payments p
                            WHERE p.strategy_id = s.strategy_id
                              AND LOWER(p.payment_status) = 'success'
                              AND (@start_date IS NULL OR p.created_at >= @start_date)
                              AND (@end_date IS NULL OR p.created_at < @end_date + interval '1 day')
                        ), 0)::numeric
                        /
                        NULLIF(
                            COALESCE((
                                SELECT SUM(c.total_outstanding)
                                FROM col_db.dpd_cases c
                                LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
                                WHERE c.strategy_id = s.strategy_id
                                  AND (@state IS NULL OR c.state = @state)
                                  AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                                  AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                            ), 0)
                            +
                            COALESCE((
                                SELECT SUM(bc.total_outstanding)
                                FROM col_db.bounce_cases bc
                                LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(bc.branch_name))
                                WHERE bc.strategy_id = s.strategy_id
                                  AND (@state IS NULL OR bc.state = @state)
                                  AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(bc.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
                                  AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
                            ), 0)
                        , 0)) * 100
                    , 1)
                , 0) AS target
            FROM col_db.strategies s
            LEFT JOIN col_db.strategy_execution_log sel ON sel.strategy_id = s.strategy_id
            LEFT JOIN (
                SELECT dpd_case_id AS id, 'dpd' AS type, branch_name, state FROM col_db.dpd_cases
                UNION ALL
                SELECT bounce_case_id AS id, 'bounce' AS type, branch_name, state FROM col_db.bounce_cases
            ) case_info ON case_info.id = sel.case_id AND LOWER(case_info.type) = LOWER(sel.case_type)
            LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(case_info.branch_name))
            WHERE (@state IS NULL OR case_info.state = @state)
              AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(case_info.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
              AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
              AND (@start_date IS NULL OR sel.assigned_at >= @start_date)
              AND (@end_date IS NULL OR sel.assigned_at < @end_date + interval '1 day')
            GROUP BY s.strategy_id, s.strategy_name, s.priority
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
            SELECT
                TO_CHAR(date_trunc('hour', comm.created_on), 'HH24:00') AS hour,
                COUNT(*)::int AS calls,
                COUNT(*) FILTER (WHERE comm.status IN ('RESPONDED'))::int AS responses
            FROM col_db.communication_logs comm
            INNER JOIN (
                SELECT dpd_case_id AS id, strategy_id, state, branch_name FROM col_db.dpd_cases
                UNION ALL
                SELECT bounce_case_id AS id, strategy_id, state, branch_name FROM col_db.bounce_cases
            ) c ON c.strategy_id = comm.strategy_id
            LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
            WHERE (@start_date IS NULL OR comm.created_on >= @start_date)
              AND (@end_date IS NULL OR comm.created_on < @end_date + interval '1 day')
              AND (@state IS NULL OR c.state = @state)
              AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
              AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
            GROUP BY date_trunc('hour', comm.created_on)
            ORDER BY date_trunc('hour', comm.created_on)
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

    public async Task<IReadOnlyList<HourlyCommunicationEfficiencyDto>> GetCommunicationEfficiencyAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                TO_CHAR(date_trunc('hour', comm.created_on), 'HH24:00') AS hour,
                COUNT(*)::int AS sent,
                COUNT(*) FILTER (WHERE comm.status = 'DELIVERED')::int AS delivered,
                COALESCE(ROUND((COUNT(*) FILTER (WHERE comm.status = 'DELIVERED')::numeric / NULLIF(COUNT(*), 0)) * 100, 1), 0) AS delivery_rate
            FROM col_db.communication_logs comm
            INNER JOIN (
                SELECT dpd_case_id AS id, strategy_id, state, branch_name FROM col_db.dpd_cases
                UNION ALL
                SELECT bounce_case_id AS id, strategy_id, state, branch_name FROM col_db.bounce_cases
            ) c ON c.strategy_id = comm.strategy_id
            LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
            WHERE (@start_date IS NULL OR comm.created_on >= @start_date)
              AND (@end_date IS NULL OR comm.created_on < @end_date + interval '1 day')
              AND (@state IS NULL OR c.state = @state)
              AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
              AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
            GROUP BY date_trunc('hour', comm.created_on)
            ORDER BY date_trunc('hour', comm.created_on)
            LIMIT @limit;
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        ConfigureCommand(command, request, limit: request.Limit);
        var result = new List<HourlyCommunicationEfficiencyDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new HourlyCommunicationEfficiencyDto(reader.GetString(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetDecimal(3)));
        }
        return result;
    }

    /**
     * Description of what this function does: Computes recovery percentage split by case loan product.
     * Inputs: request: AnalyticsQueryRequest, cancellationToken: CancellationToken
     * Outputs: Task<IReadOnlyList<ProductDistributionDto>>
     * Dependencies: ReadDistributionAsync
     */
    public async Task<IReadOnlyList<ProductDistributionDto>> GetChannelPerformanceAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            WITH CasePayments AS (
                SELECT
                    strategy_id,
                    COALESCE(SUM(amount) FILTER (WHERE LOWER(payment_status) = 'success'), 0) AS recovered_amount
                FROM col_db.payments
                WHERE (@start_date IS NULL OR created_at >= @start_date)
                  AND (@end_date IS NULL OR created_at < @end_date + interval '1 day')
                GROUP BY strategy_id
            )
            SELECT
                COALESCE(c.product_name, 'Unknown') AS name,
                COALESCE(ROUND((SUM(cp.recovered_amount)::numeric / NULLIF(SUM(c.total_outstanding), 0)) * 100, 1), 0) AS value
            FROM col_db.dpd_cases c
            LEFT JOIN CasePayments cp ON cp.strategy_id = c.strategy_id
            LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
            WHERE (@state IS NULL OR c.state = @state)
              AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
              AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
            GROUP BY c.product_name
            ORDER BY value DESC
            LIMIT @limit;
            """;

        return await ReadDistributionAsync(sql, request, cancellationToken);
    }

    /**
     * Description of what this function does: Computes counts of outstanding cases grouped by DPD bucket range.
     * Inputs: request: AnalyticsQueryRequest, cancellationToken: CancellationToken
     * Outputs: Task<IReadOnlyList<ProductDistributionDto>>
     * Dependencies: ReadDistributionAsync
     */
    public async Task<IReadOnlyList<ProductDistributionDto>> GetBucketDistributionAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                COALESCE(c.bucket, 'Unknown') AS name,
                COUNT(*)::numeric AS value
            FROM col_db.dpd_cases c
            LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
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

    /**
     * Description of what this function does: Computes branch-wise totals of case outstanding amounts.
     * Inputs: request: AnalyticsQueryRequest, cancellationToken: CancellationToken
     * Outputs: Task<IReadOnlyList<PerformanceDto>>
     * Dependencies: ConfigureCommand, IDbConnectionFactory
     */
    public async Task<IReadOnlyList<PerformanceDto>> GetBranchContributorsAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                COALESCE(c.branch_name, 'Unknown') AS name,
                COALESCE(SUM(c.total_outstanding), 0)::numeric AS value,
                COALESCE(SUM(c.total_outstanding), 0)::numeric AS target
            FROM col_db.dpd_cases c
            LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
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

    /**
     * Description of what this function does: Computes recovery performance stats grouped by active agent contributors.
     * Inputs: request: AnalyticsQueryRequest, cancellationToken: CancellationToken
     * Outputs: Task<IReadOnlyList<AgentPerformanceDto>>
     * Dependencies: ConfigureCommand, IDbConnectionFactory
     */
    public async Task<IReadOnlyList<AgentPerformanceDto>> GetAgentContributorsAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        // agents table removed in new schema.
        // Agent identity sourced from auth.users; linked via col_db.ptps.agent_id → auth.users.agent_id.
        const string sql = """
            SELECT
                COALESCE(u.agent_name, 'Unassigned') AS agent_name,
                COUNT(DISTINCT c.dpd_case_id)::int AS allocated_cases,
                COUNT(DISTINCT c.dpd_case_id) FILTER (WHERE LOWER(c.loan_status) IN ('closed', 'settled', 'resolved'))::int AS resolved_cases,
                COALESCE(SUM(c.total_outstanding) FILTER (WHERE LOWER(c.loan_status) IN ('closed', 'settled', 'resolved')), 0)::numeric AS recovered_amount
            FROM col_db.dpd_cases c
            LEFT JOIN col_db.ptps p ON p.strategy_id = c.strategy_id
            LEFT JOIN auth.users u ON u.agent_id = p.agent_id
            LEFT JOIN col_db.branches b ON lower(trim(b.name)) = lower(trim(c.branch_name))
            WHERE (@state IS NULL OR c.state = @state)
              AND (@branch_name IS NULL OR lower(trim(replace(lower(trim(c.branch_name)), 'branch', ''))) = lower(trim(replace(lower(trim(@branch_name)), 'branch', ''))))
              AND (@zone IS NULL OR lower(trim(b.zone_code)) = lower(trim(@zone)))
              AND (@start_date IS NULL OR c.created_at >= @start_date)
              AND (@end_date IS NULL OR c.created_at < @end_date + interval '1 day')
            GROUP BY u.agent_name
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

    /**
     * Description of what this function does: Executes SQL query to load distribution data.
     * Inputs: sql: string, request: AnalyticsQueryRequest, cancellationToken: CancellationToken
     * Outputs: Task<IReadOnlyList<ProductDistributionDto>>
     * Dependencies: ConfigureCommand, IDbConnectionFactory
     */
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
