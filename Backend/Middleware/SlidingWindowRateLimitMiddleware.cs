using System.Collections.Concurrent;
using backend.Models;

namespace backend.Middleware;

public class SlidingWindowRateLimitMiddleware
{
    private readonly RequestDelegate _next;

    /*
        Key   -> Client IP
        Value -> Request timestamps
    */
    private static readonly ConcurrentDictionary<string, SlidingWindowCounter>
        Counters = new();

    private const int REQUEST_LIMIT = 100000;
    private static readonly TimeSpan WINDOW_SIZE = TimeSpan.FromSeconds(60);

    public SlidingWindowRateLimitMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var counter = Counters.GetOrAdd(
            ip,
            _ => new SlidingWindowCounter());

        var now = DateTime.UtcNow;

        /*
            Remove expired requests
        */
        while (counter.Requests.TryPeek(out var timestamp))
        {
            if (now - timestamp > WINDOW_SIZE)
            {
                counter.Requests.TryDequeue(out _);
            }
            else
            {
                break;
            }
        }

        /*
            Check limit
        */
        if (counter.Requests.Count >= REQUEST_LIMIT)
        {
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;

            await context.Response.WriteAsJsonAsync(new
            {
                message = "Too many requests",
                limit = REQUEST_LIMIT,
                window = WINDOW_SIZE.TotalSeconds
            });

            return;
        }

        /*
            Add current request timestamp
        */
        counter.Requests.Enqueue(now);

        /*
            Add headers
        */
        context.Response.Headers["X-RateLimit-Limit"] =
            REQUEST_LIMIT.ToString();

        context.Response.Headers["X-RateLimit-Remaining"] =
            (REQUEST_LIMIT - counter.Requests.Count).ToString();

        await _next(context);
    }
}