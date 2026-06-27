namespace backend.Common.Dtos;

public sealed record TableRowDto(IReadOnlyDictionary<string, object?> Values);
