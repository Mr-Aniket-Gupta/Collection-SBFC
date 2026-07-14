namespace backend.Modules.Analytics;

public sealed record DashboardMapLocation(
    string Id,
    string Name,
    long Value,
    decimal Lat,
    decimal Lon,
    string Color,
    string Icon,
    string CardSide);

public sealed record DashboardMapResponse(
    int NewUsers,
    string Label,
    IReadOnlyList<DashboardMapLocation> Locations);

public static class MapDummyData
{
    public static readonly DashboardMapResponse Response = new(
        22652,
        "Updated 2 min ago",
        [
            new("delhi", "Delhi NCR", 98320300, 28.6139m, 77.2090m, "#4fa4e0", "Landmark", "right"),
            new("mumbai", "Mumbai", 78245600, 19.0760m, 72.8777m, "#000182", "Building2", "right"),
            new("bengaluru", "Bengaluru", 64891200, 12.9716m, 77.5946m, "#CE9B01", "Library", "left"),
            new("hyderabad", "Hyderabad", 43567800, 17.3850m, 78.4867m, "#4fbf8b", "Warehouse", "left"),
            new("chennai", "Chennai", 59432100, 13.0827m, 80.2707m, "#cf7fdb", "Factory", "left"),
            new("kolkata", "Kolkata", 31876400, 22.5726m, 88.3639m, "#ee7c68", "Building2", "left"),
            new("pune", "Pune", 27456300, 18.5204m, 73.8567m, "#5a8fe0", "School", "right"),
            new("ahmedabad", "Ahmedabad", 42198700, 23.0225m, 72.5714m, "#f2a458", "Landmark", "right")
        ]);
}
