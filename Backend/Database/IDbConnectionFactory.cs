using Npgsql;

namespace backend.Database;

public interface IDbConnectionFactory
{
    NpgsqlConnection CreateConnection();
}
