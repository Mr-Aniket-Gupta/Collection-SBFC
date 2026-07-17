using backend.Database;
using Npgsql;

namespace backend.Modules.UserTour.Repositories;

public class UserTourRepository : IUserTourRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public UserTourRepository(
        IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<bool> IsTourCompletedAsync(long agentId, string tourCode)
    {
        const string sql = @"
            SELECT completed
            FROM auth.user_tour_status
            WHERE agent_id = @agent_id
            AND tour_code = @tour_code
            LIMIT 1;
        ";

        await using var connection =
            _dbConnectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            new NpgsqlCommand(sql, connection);

        command.Parameters.AddWithValue("agent_id", agentId);
        command.Parameters.AddWithValue("tour_code", tourCode);

        var result = await command.ExecuteScalarAsync();

        if (result == null || result == DBNull.Value)
        {
            return false;
        }

        return Convert.ToBoolean(result);
    }

    public async Task MarkTourCompletedAsync(long agentId, string tourCode)
    {
        const string sql = @"
            INSERT INTO auth.user_tour_status
            (
                agent_id,
                tour_code,
                completed,
                completed_at,
                created_at,
                updated_at
            )
            VALUES
            (
                @agent_id,
                @tour_code,
                TRUE,
                NOW(),
                NOW(),
                NOW()
            )
            ON CONFLICT (agent_id, tour_code)
            DO UPDATE SET
                completed = TRUE,
                completed_at = NOW(),
                updated_at = NOW();
        ";

        await using var connection =
            _dbConnectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            new NpgsqlCommand(sql, connection);

        command.Parameters.AddWithValue("agent_id", agentId);
        command.Parameters.AddWithValue("tour_code", tourCode);

        await command.ExecuteNonQueryAsync();
    }

    public async Task ResetTourAsync(long agentId, string tourCode)
    {
        const string sql = @"
            UPDATE auth.user_tour_status
            SET completed = FALSE,
                updated_at = NOW()
            WHERE agent_id = @agent_id
            AND tour_code = @tour_code;
        ";

        await using var connection =
            _dbConnectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            new NpgsqlCommand(sql, connection);

        command.Parameters.AddWithValue("agent_id", agentId);
        command.Parameters.AddWithValue("tour_code", tourCode);

        await command.ExecuteNonQueryAsync();
    }
}