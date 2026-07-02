namespace backend.Modules.Analytics.Requests;

public sealed class AnalyticsQueryRequest
{
    public string? DateFilter { get; init; }
    public string? CustomFromDate { get; init; }
    public string? CustomToDate { get; init; }
    public string? State { get; init; }
    public string? Branch { get; init; }
    public string? Zone { get; init; }

    public DateOnly? StartDate
    {
        get
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (DateFilter == "Custom Range" &&
                DateOnly.TryParse(CustomFromDate, out var customFrom) &&
                DateOnly.TryParse(CustomToDate, out _))
            {
                return customFrom;
            }

            return DateFilter switch
            {
                "This Month" => new DateOnly(today.Year, today.Month, 1),
                "Last 7 Days" => today.AddDays(-7),
                "Last 30 Days" => today.AddDays(-30),
                "Last Quarter" => new DateOnly(today.Year, ((today.Month - 1) / 3) * 3 + 1, 1).AddMonths(-3),
                "Last 6 Months" => today.AddMonths(-6),
                "Custom Range" => DateOnly.TryParse(CustomFromDate, out var parsedFrom) ? parsedFrom : null,
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
            if (DateFilter == "Custom Range" &&
                DateOnly.TryParse(CustomFromDate, out var customFrom) &&
                DateOnly.TryParse(CustomToDate, out var customTo))
            {
                return customTo < customFrom ? customFrom : customTo > today ? today : customTo;
            }

            return DateFilter switch
            {
                "Last Quarter" => new DateOnly(today.Year, ((today.Month - 1) / 3) * 3 + 1, 1).AddDays(-1),
                "Custom Range" => DateOnly.TryParse(CustomToDate, out var parsedTo) ? (parsedTo > today ? today : parsedTo) : today,
                _ => today
            };
        }
    }

    public int Limit { get; init; } = 12;
}
