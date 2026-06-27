using Npgsql;
using NpgsqlTypes;

namespace backend.Common.Database;

public static class NpgsqlCommandExtensions
{
    public static void AddNullableText(this NpgsqlCommand command, string name, string? value)
    {
        command.Parameters.AddWithValue(name, NpgsqlDbType.Text, string.IsNullOrWhiteSpace(value) ? DBNull.Value : value);
    }

    public static void AddDateRange(this NpgsqlCommand command, DateOnly? startDate, DateOnly? endDate)
    {
        command.Parameters.AddWithValue("@start_date", NpgsqlDbType.Date, startDate.HasValue ? startDate.Value : DBNull.Value);
        command.Parameters.AddWithValue("@end_date", NpgsqlDbType.Date, endDate.HasValue ? endDate.Value : DBNull.Value);
    }
}
