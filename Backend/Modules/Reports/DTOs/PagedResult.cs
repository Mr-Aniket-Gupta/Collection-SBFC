namespace backend.Modules.Reports.DTOs;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int Limit);