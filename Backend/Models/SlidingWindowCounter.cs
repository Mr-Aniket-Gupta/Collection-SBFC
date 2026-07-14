using System.Collections.Concurrent;

namespace backend.Models;

public class SlidingWindowCounter
{
    public ConcurrentQueue<DateTime> Requests { get; } = new();
}