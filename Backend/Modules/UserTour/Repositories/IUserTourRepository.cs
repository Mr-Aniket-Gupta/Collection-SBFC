namespace backend.Modules.UserTour.Repositories;

public interface IUserTourRepository
{
    Task<bool> IsTourCompletedAsync(long agentId, string tourCode);

    Task MarkTourCompletedAsync(long agentId, string tourCode);

    Task ResetTourAsync(long agentId, string tourCode);
}