namespace backend.Modules.Analytics.Requests;

public sealed class AnalyticsQueryRequest
{
    public string? DateFilter { get; init; }
    public string? State { get; init; }

    public DateOnly? StartDate
    {
        get
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return DateFilter switch
            {
                "This Month" => new DateOnly(today.Year, today.Month, 1),
                "Last 7 Days" => today.AddDays(-7),
                "Last 30 Days" => today.AddDays(-30),
                "Last Quarter" => new DateOnly(today.Year, ((today.Month - 1) / 3) * 3 + 1, 1).AddMonths(-3),
                "This Year" => new DateOnly(today.Year, 1, 1),
                _ => null
            };
        }
    }

    public DateOnly? EndDate
    {
        get
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return DateFilter switch
            {
                "Last Quarter" => new DateOnly(today.Year, ((today.Month - 1) / 3) * 3 + 1, 1).AddDays(-1),
                _ => today
            };
        }
    }

    public int Limit { get; init; } = 12;
}
