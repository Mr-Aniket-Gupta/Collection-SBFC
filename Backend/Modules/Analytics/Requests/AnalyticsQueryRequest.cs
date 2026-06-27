namespace backend.Modules.Analytics.Requests;

public sealed class AnalyticsQueryRequest
{
    public string? DateFilter { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public int Limit { get; init; } = 12;
}
