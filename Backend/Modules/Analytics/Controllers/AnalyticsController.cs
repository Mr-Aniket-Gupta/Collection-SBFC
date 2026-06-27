using backend.Common.Controllers;
using backend.Modules.Analytics.Repositories;
using backend.Modules.Analytics.Requests;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Analytics.Controllers;

[ApiController]
[Route("api/analytics")]
public sealed class AnalyticsController : ApiControllerBase
{
    private readonly AnalyticsRepository _repository;

    public AnalyticsController(AnalyticsRepository repository, ILogger<AnalyticsController> logger)
        : base(logger)
    {
        _repository = repository;
    }

    [HttpGet("dashboard")]
    public Task<IActionResult> GetDashboard([FromQuery] AnalyticsQueryRequest request, CancellationToken cancellationToken)
        => ExecuteAsync("ANALYTICS-DASHBOARD", "Analytics dashboard fetched successfully.",
            () => _repository.GetDashboardAsync(request, cancellationToken),
            "Unable to process analytics request.", "Analytics");

    [HttpGet("kpi-cards")]
    public Task<IActionResult> GetKpiCards([FromQuery] AnalyticsQueryRequest request, CancellationToken cancellationToken)
        => ExecuteAsync("ANALYTICS-KPI", "KPI cards fetched successfully.",
            () => _repository.GetKpiCardsAsync(request, cancellationToken),
            "Unable to process analytics request.", "Analytics");

    [HttpGet("radar")]
    public Task<IActionResult> GetRadar([FromQuery] AnalyticsQueryRequest request, CancellationToken cancellationToken)
        => ExecuteAsync("ANALYTICS-RADAR", "Radar data fetched successfully.",
            () => _repository.GetRadarAsync(request, cancellationToken),
            "Unable to process analytics request.", "Analytics");

    [HttpGet("strategy-performance")]
    public Task<IActionResult> GetStrategyPerformance([FromQuery] AnalyticsQueryRequest request, CancellationToken cancellationToken)
        => ExecuteAsync("ANALYTICS-STRATEGY", "Strategy performance fetched successfully.",
            () => _repository.GetStrategyPerformanceAsync(request, cancellationToken),
            "Unable to process analytics request.", "Analytics");

    [HttpGet("communication-performance")]
    public Task<IActionResult> GetCommunicationPerformance([FromQuery] AnalyticsQueryRequest request, CancellationToken cancellationToken)
        => ExecuteAsync("ANALYTICS-COMMUNICATION", "Communication performance fetched successfully.",
            () => _repository.GetCommunicationPerformanceAsync(request, cancellationToken),
            "Unable to process analytics request.", "Analytics");

    [HttpGet("channel-performance")]
    public Task<IActionResult> GetChannelPerformance([FromQuery] AnalyticsQueryRequest request, CancellationToken cancellationToken)
        => ExecuteAsync("ANALYTICS-CHANNEL", "Channel performance fetched successfully.",
            () => _repository.GetChannelPerformanceAsync(request, cancellationToken),
            "Unable to process analytics request.", "Analytics");

    [HttpGet("bucket-distribution")]
    public Task<IActionResult> GetBucketDistribution([FromQuery] AnalyticsQueryRequest request, CancellationToken cancellationToken)
        => ExecuteAsync("ANALYTICS-BUCKET", "Bucket distribution fetched successfully.",
            () => _repository.GetBucketDistributionAsync(request, cancellationToken),
            "Unable to process analytics request.", "Analytics");
}
