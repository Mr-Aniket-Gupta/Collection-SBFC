namespace backend.Modules.Analytics.DTOs;

public sealed record KpiCardDto(
    string Id,
    string Title,
    string Value,
    string Subtitle,
    string? Trend,
    string? TrendDirection,
    string IconType,
    string IconColor,
    string BgColor);

public sealed record RadarDataPointDto(string Metric, decimal Value, decimal FullMark);

public sealed record StrategyRowDto(string Name, decimal Percentage, decimal Target, string Color);

public sealed record HourlyCallDataDto(string Hour, int Calls, int Responses);

public sealed record ProductDistributionDto(string Name, decimal Value, string Color);

public sealed record BounceReasonDto(string Reason, int Count, decimal Percentage, string Color);

public sealed record TrendPointDto(string Period, decimal Value);

public sealed record PerformanceDto(string Name, decimal Value, decimal Target);

public sealed record AgentPerformanceDto(string AgentName, int AllocatedCases, int ResolvedCases, decimal RecoveredAmount);

public sealed record AnalyticsDashboardDto(
    IReadOnlyList<KpiCardDto> KpiCards,
    IReadOnlyList<RadarDataPointDto> PerformanceRadar,
    IReadOnlyList<StrategyRowDto> StrategyPerformance,
    IReadOnlyList<HourlyCallDataDto> CommunicationPerformance,
    IReadOnlyList<ProductDistributionDto> ChannelPerformance,
    IReadOnlyList<ProductDistributionDto> BucketDistribution);
