using backend.Common.Database;
using backend.Modules.Analytics.DTOs;
using backend.Modules.Analytics.Requests;
using backend.Database;
using Npgsql;

namespace backend.Modules.Analytics.Repositories;

public sealed class AnalyticsRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public AnalyticsRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<AnalyticsDashboardDto> GetDashboardAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        var kpiCards = await GetKpiCardsAsync(request, cancellationToken);
        var radar = await GetRadarAsync(request, cancellationToken);
        var strategy = await GetStrategyPerformanceAsync(request, cancellationToken);
        var communication = await GetCommunicationPerformanceAsync(request, cancellationToken);
        var channelPerformance = await GetChannelPerformanceAsync(request, cancellationToken);
        var bucketDistribution = await GetBucketDistributionAsync(request, cancellationToken);
        return new AnalyticsDashboardDto(kpiCards, radar, strategy, communication, channelPerformance, bucketDistribution);
    }

    public async Task<IReadOnlyList<KpiCardDto>> GetKpiCardsAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                COALESCE((SELECT SUM(outstanding_principal) FROM cases WHERE (@state IS NULL OR state = @state) AND (@branch IS NULL OR branch = @branch) AND (@zone IS NULL OR zone = @zone) AND (@start_date IS NULL OR created_at::date >= @start_date) AND (@end_date IS NULL OR created_at::date <= @end_date)), 0) AS total_outstanding_principal,
                COALESCE((SELECT SUM(outstanding_total) FROM cases WHERE (@state IS NULL OR state = @state) AND (@branch IS NULL OR branch = @branch) AND (@zone IS NULL OR zone = @zone) AND (@start_date IS NULL OR created_at::date >= @start_date) AND (@end_date IS NULL OR created_at::date <= @end_date)), 0) AS total_outstanding,
                COALESCE((SELECT COUNT(*)::numeric FROM communications comm INNER JOIN cases c ON c.case_id = comm.case_id WHERE LOWER(comm.status) = 'delivered' AND (@state IS NULL OR c.state = @state) AND (@branch IS NULL OR c.branch = @branch) AND (@zone IS NULL OR c.zone = @zone) AND (@start_date IS NULL OR comm.created_at::date >= @start_date) AND (@end_date IS NULL OR comm.created_at::date <= @end_date)), 0) AS total_delivered,
                COALESCE((SELECT COUNT(p.ptp_id)::numeric FROM ptps p INNER JOIN cases c ON c.case_id = p.case_id WHERE p.honoured = true AND (@state IS NULL OR c.state = @state) AND (@branch IS NULL OR c.branch = @branch) AND (@zone IS NULL OR c.zone = @zone) AND (@start_date IS NULL OR p.created_at::date >= @start_date) AND (@end_date IS NULL OR p.created_at::date <= @end_date)), 0) AS honoured_ptps
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.AddDateRange(request.StartDate, request.EndDate);
        command.AddNullableText("@state", request.State);
        command.AddNullableText("@branch", request.Branch);
        command.AddNullableText("@zone", request.Zone);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);

        var outstandingPrincipalLakhs = reader.GetDecimal(0) / 100000.0m;
        var outstandingTotalLakhs = reader.GetDecimal(1) / 100000.0m;

        return
        [
            new("total-outstanding-principal", "Total Outstanding Principal", outstandingPrincipalLakhs.ToString("N2") + " L", "From cases", null, "neutral", "wallet", "#000182", "bg-[var(--color-ice)]"),
            new("total-outstanding", "Total Outstanding", outstandingTotalLakhs.ToString("N2") + " L", "From cases", null, "neutral", "receipt", "#CE9B01", "bg-[rgba(206,155,1,0.13)]"),
            new("total-delivered", "Total Delivered", reader.GetDecimal(2).ToString("N0"), "From communications", null, "neutral", "message-circle", "#050058", "bg-[var(--color-ice)]"),
            new("ptps-honoured", "PTPs Honoured", reader.GetDecimal(3).ToString("N0"), "From ptps", null, "neutral", "check-circle", "#CE9B01", "bg-[rgba(206,155,1,0.13)]")
        ];
    }

    public async Task<IReadOnlyList<RadarDataPointDto>> GetRadarAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                -- 1. Contact Rate: Delivered ÷ Sent × 100
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE LOWER(comm.status) = 'delivered')::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                    FROM communications comm
                    INNER JOIN cases c ON c.case_id = comm.case_id
                    WHERE (@state IS NULL OR c.state = @state)
                      AND (@branch IS NULL OR c.branch = @branch)
                      AND (@zone IS NULL OR c.zone = @zone)
                      AND (@start_date IS NULL OR comm.created_at::date >= @start_date)
                      AND (@end_date IS NULL OR comm.created_at::date <= @end_date)
                ), 0) AS contact_rate,

                -- 2. Response Rate: Responded ÷ Delivered × 100
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE comm.response_status IS NOT NULL AND comm.response_status <> '')::numeric / NULLIF(COUNT(*) FILTER (WHERE LOWER(comm.status) = 'delivered'), 0)) * 100, 1)
                    FROM communications comm
                    INNER JOIN cases c ON c.case_id = comm.case_id
                    WHERE (@state IS NULL OR c.state = @state)
                      AND (@branch IS NULL OR c.branch = @branch)
                      AND (@zone IS NULL OR c.zone = @zone)
                      AND (@start_date IS NULL OR comm.created_at::date >= @start_date)
                      AND (@end_date IS NULL OR comm.created_at::date <= @end_date)
                ), 0) AS response_rate,

                -- 3. PTP Success Rate: Kept PTP ÷ Total PTP × 100
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE p.honoured = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                    FROM ptps p
                    INNER JOIN cases c ON c.case_id = p.case_id
                    WHERE (@state IS NULL OR c.state = @state)
                      AND (@branch IS NULL OR c.branch = @branch)
                      AND (@zone IS NULL OR c.zone = @zone)
                      AND (@start_date IS NULL OR p.created_at::date >= @start_date)
                      AND (@end_date IS NULL OR p.created_at::date <= @end_date)
                ), 0) AS ptp_success_rate,

                -- 4. Collection Rate: Recovered Amount ÷ Outstanding Amount × 100
                COALESCE((
                    SELECT ROUND((SUM(pay.amount) FILTER (WHERE LOWER(pay.payment_status) = 'success')::numeric / NULLIF(SUM(c.outstanding_total), 0)) * 100, 1)
                    FROM payments pay
                    INNER JOIN cases c ON c.case_id = pay.case_id
                    WHERE (@state IS NULL OR c.state = @state)
                      AND (@branch IS NULL OR c.branch = @branch)
                      AND (@zone IS NULL OR c.zone = @zone)
                      AND (@start_date IS NULL OR pay.created_at::date >= @start_date)
                      AND (@end_date IS NULL OR pay.created_at::date <= @end_date)
                ), 0) AS collection_rate,

                -- 5. Payment Success Rate: Successful Payments ÷ Total Payments × 100
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE LOWER(pay.payment_status) = 'success')::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                    FROM payments pay
                    INNER JOIN cases c ON c.case_id = pay.case_id
                    WHERE (@state IS NULL OR c.state = @state)
                      AND (@branch IS NULL OR c.branch = @branch)
                      AND (@zone IS NULL OR c.zone = @zone)
                      AND (@start_date IS NULL OR pay.created_at::date >= @start_date)
                      AND (@end_date IS NULL OR pay.created_at::date <= @end_date)
                ), 0) AS payment_success_rate,

                -- 6. Case Closure Rate: Closed Cases ÷ Total Cases × 100
                COALESCE((
                    SELECT ROUND((COUNT(*) FILTER (WHERE LOWER(c.status) IN ('resolved', 'settled', 'closed'))::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                    FROM cases c
                    WHERE (@state IS NULL OR c.state = @state)
                      AND (@branch IS NULL OR c.branch = @branch)
                      AND (@zone IS NULL OR c.zone = @zone)
                      AND (@start_date IS NULL OR c.created_at::date >= @start_date)
                      AND (@end_date IS NULL OR c.created_at::date <= @end_date)
                ), 0) AS case_closure_rate
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.AddDateRange(request.StartDate, request.EndDate);
        command.AddNullableText("@state", request.State);
        command.AddNullableText("@branch", request.Branch);
        command.AddNullableText("@zone", request.Zone);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);

        return
        [
            new("Contact Rate", reader.GetDecimal(0), 100),
            new("Response Rate", reader.GetDecimal(1), 100),
            new("PTP Success Rate", reader.GetDecimal(2), 100),
            new("Collection Rate", reader.GetDecimal(3), 100),
            new("Payment Success Rate", reader.GetDecimal(4), 100),
            new("Case Closure Rate", reader.GetDecimal(5), 100)
        ];
    }

    public async Task<IReadOnlyList<StrategyRowDto>> GetStrategyPerformanceAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT 
                COALESCE(s.strategy_name, 'Unknown') AS name,
                CASE 
                    WHEN COUNT(c.case_id) = 0 THEN 0 
                    ELSE ROUND((COUNT(c.case_id) FILTER (WHERE LOWER(c.status) IN ('resolved', 'settled', 'closed'))::numeric / COUNT(c.case_id)) * 100, 1) 
                END AS percentage,
                COALESCE(s.dpd_range_to, 0)::numeric AS target
            FROM strategies s
            LEFT JOIN cases c ON c.strategy_id = s.strategy_id AND (@state IS NULL OR c.state = @state) AND (@branch IS NULL OR c.branch = @branch) AND (@zone IS NULL OR c.zone = @zone)
            GROUP BY s.strategy_id, s.strategy_name, s.dpd_range_to, s.priority
            ORDER BY percentage DESC, s.priority ASC NULLS LAST, s.strategy_name ASC
            LIMIT @limit;
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("@limit", request.Limit);
        command.AddNullableText("@state", request.State);
        command.AddNullableText("@branch", request.Branch);
        command.AddNullableText("@zone", request.Zone);
        var result = new List<StrategyRowDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var index = 0;
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
                        INNER JOIN cases c ON c.case_id = comm.case_id
                        WHERE (@start_date IS NULL OR comm.created_at::date >= @start_date)
                            AND (@end_date IS NULL OR comm.created_at::date <= @end_date)
                            AND (@state IS NULL OR c.state = @state)
                            AND (@branch IS NULL OR c.branch = @branch)
                            AND (@zone IS NULL OR c.zone = @zone)
                        GROUP BY date_trunc('hour', comm.created_at)
                        ORDER BY date_trunc('hour', comm.created_at)
            LIMIT @limit;
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.AddDateRange(request.StartDate, request.EndDate);
        command.AddNullableText("@state", request.State);
        command.AddNullableText("@branch", request.Branch);
        command.AddNullableText("@zone", request.Zone);
        command.Parameters.AddWithValue("@limit", request.Limit);
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
                    case_id, 
                    COALESCE(SUM(amount) FILTER (WHERE LOWER(payment_status) = 'success'), 0) AS recovered_amount
                FROM payments
                WHERE (@start_date IS NULL OR created_at::date >= @start_date)
                  AND (@end_date IS NULL OR created_at::date <= @end_date)
                GROUP BY case_id
            )
            SELECT 
                COALESCE(c.journey_type, 'Unknown') AS name,
                COALESCE(ROUND((SUM(cp.recovered_amount)::numeric / NULLIF(SUM(c.outstanding_total), 0)) * 100, 1), 0) AS value
            FROM cases c
            LEFT JOIN CasePayments cp ON cp.case_id = c.case_id
            WHERE (@state IS NULL OR c.state = @state)
              AND (@branch IS NULL OR c.branch = @branch)
              AND (@zone IS NULL OR c.zone = @zone)
            GROUP BY c.journey_type
            ORDER BY value DESC
            LIMIT @limit;
            """;

        return await ReadDistributionAsync(sql, request, cancellationToken);
    }

    public async Task<IReadOnlyList<ProductDistributionDto>> GetBucketDistributionAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT 
                CASE 
                    WHEN c.dpd >= 0 AND c.dpd <= 30 THEN 'Low Risk (0-30)'
                    WHEN c.dpd >= 31 AND c.dpd <= 60 THEN 'Medium Risk (31-60)'
                    WHEN c.dpd >= 61 AND c.dpd <= 90 THEN 'High Risk (61-90)'
                    WHEN c.dpd > 90 THEN 'Critical (90+)'
                    ELSE 'Unknown'
                END AS name,
                COUNT(*)::numeric AS value
            FROM cases c
            WHERE (@start_date IS NULL OR c.created_at::date >= @start_date)
              AND (@end_date IS NULL OR c.created_at::date <= @end_date)
              AND (@state IS NULL OR c.state = @state)
              AND (@branch IS NULL OR c.branch = @branch)
              AND (@zone IS NULL OR c.zone = @zone)
            GROUP BY 
                CASE 
                    WHEN c.dpd >= 0 AND c.dpd <= 30 THEN 'Low Risk (0-30)'
                    WHEN c.dpd >= 31 AND c.dpd <= 60 THEN 'Medium Risk (31-60)'
                    WHEN c.dpd >= 61 AND c.dpd <= 90 THEN 'High Risk (61-90)'
                    WHEN c.dpd > 90 THEN 'Critical (90+)'
                    ELSE 'Unknown'
                END
            ORDER BY value DESC
            LIMIT @limit;
            """;

        return await ReadDistributionAsync(sql, request, cancellationToken);
    }

    private async Task<IReadOnlyList<ProductDistributionDto>> ReadDistributionAsync(string sql, AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.AddDateRange(request.StartDate, request.EndDate);
        command.AddNullableText("@state", request.State);
        command.AddNullableText("@branch", request.Branch);
        command.AddNullableText("@zone", request.Zone);
        command.Parameters.AddWithValue("@limit", request.Limit);
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
