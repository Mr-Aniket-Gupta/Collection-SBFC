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
                COALESCE((SELECT SUM(amount) FROM payments WHERE payment_status = 'success'), 0) AS total_collected,
                COALESCE((SELECT SUM(outstanding_total) FROM cases), 0) AS total_outstanding,
                COALESCE((SELECT COUNT(*)::numeric FROM communications), 0) AS total_communications,
                COALESCE((SELECT COUNT(*)::numeric FROM ptps WHERE honoured = true), 0) AS honoured_ptps
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);

        return
        [
            new("total-collection", "Total Collection", reader.GetDecimal(0).ToString("N2"), "From payments", null, "neutral", "wallet", "#000182", "bg-[var(--color-ice)]"),
            new("total-outstanding", "Total Outstanding", reader.GetDecimal(1).ToString("N2"), "From cases", null, "neutral", "receipt", "#CE9B01", "bg-[rgba(206,155,1,0.13)]"),
            new("communications", "Communications", reader.GetDecimal(2).ToString("N0"), "From communications", null, "neutral", "message-circle", "#050058", "bg-[var(--color-ice)]"),
            new("ptps-honoured", "PTPs Honoured", reader.GetDecimal(3).ToString("N0"), "From ptps", null, "neutral", "check-circle", "#CE9B01", "bg-[rgba(206,155,1,0.13)]")
        ];
    }

    public async Task<IReadOnlyList<RadarDataPointDto>> GetRadarAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                CASE WHEN COUNT(*) = 0 THEN 0 ELSE ROUND((COUNT(*) FILTER (WHERE c.status IN ('resolved', 'settled', 'closed'))::numeric / COUNT(*)) * 100, 1) END AS resolution_rate,
                CASE WHEN COUNT(*) = 0 THEN 0 ELSE ROUND((COUNT(*) FILTER (WHERE comm.response_status IS NOT NULL)::numeric / COUNT(*)) * 100, 1) END AS response_rate,
                CASE WHEN COUNT(*) = 0 THEN 0 ELSE ROUND((COUNT(*) FILTER (WHERE p.honoured = true)::numeric / COUNT(*)) * 100, 1) END AS ptp_rate
            FROM cases c
            LEFT JOIN communications comm ON comm.case_id = c.case_id
            LEFT JOIN ptps p ON p.case_id = c.case_id
            WHERE (@start_date IS NULL OR c.created_at::date >= @start_date)
              AND (@end_date IS NULL OR c.created_at::date <= @end_date);
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.AddDateRange(request.StartDate, request.EndDate);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);

        return
        [
            new("Resolution", reader.GetDecimal(0), 100),
            new("Response", reader.GetDecimal(1), 100),
            new("PTP", reader.GetDecimal(2), 100)
        ];
    }

    public async Task<IReadOnlyList<StrategyRowDto>> GetStrategyPerformanceAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT COALESCE(strategy_name, 'Unknown') AS name, COALESCE(priority, 0)::numeric AS percentage, COALESCE(dpd_range_to, 0)::numeric AS target
            FROM strategies
            ORDER BY priority ASC NULLS LAST, strategy_name ASC
            LIMIT @limit;
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("@limit", request.Limit);
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
            SELECT TO_CHAR(date_trunc('hour', created_at), 'HH24:00') AS hour, COUNT(*)::int AS calls, COUNT(*) FILTER (WHERE response_status IS NOT NULL)::int AS responses
            FROM communications
            WHERE (@start_date IS NULL OR created_at::date >= @start_date)
              AND (@end_date IS NULL OR created_at::date <= @end_date)
            GROUP BY date_trunc('hour', created_at)
            ORDER BY date_trunc('hour', created_at)
            LIMIT @limit;
            """;

        await using var connection = _dbConnectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.AddDateRange(request.StartDate, request.EndDate);
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
            SELECT COALESCE(channel, 'Unknown') AS name, COUNT(*)::numeric AS value
            FROM communications
            WHERE (@start_date IS NULL OR created_at::date >= @start_date)
              AND (@end_date IS NULL OR created_at::date <= @end_date)
            GROUP BY channel
            ORDER BY value DESC
            LIMIT @limit;
            """;

        return await ReadDistributionAsync(sql, request, cancellationToken);
    }

    public async Task<IReadOnlyList<ProductDistributionDto>> GetBucketDistributionAsync(AnalyticsQueryRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT COALESCE(bucket, 'Unknown') AS name, COUNT(*)::numeric AS value
            FROM cases
            WHERE (@start_date IS NULL OR created_at::date >= @start_date)
              AND (@end_date IS NULL OR created_at::date <= @end_date)
            GROUP BY bucket
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
