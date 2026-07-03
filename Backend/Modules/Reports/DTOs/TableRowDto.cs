namespace backend.Modules.Reports.DTOs;

public sealed record TableRowDto(IReadOnlyDictionary<string, object?> Values);