using backend.Middleware;

namespace backend.Extensions;

public static class RateLimitingExtensions
{
    public static IApplicationBuilder UseSlidingWindowRateLimiter(
        this IApplicationBuilder app)
    {
        return app.UseMiddleware<SlidingWindowRateLimitMiddleware>();
    }
}