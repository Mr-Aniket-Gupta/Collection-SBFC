using backend.Modules.UserTour.Repositories;

namespace backend.Modules.UserTour.Config;

public static class UserTourModule
{
    public static IServiceCollection AddUserTourModule(
        this IServiceCollection services)
    {
        services.AddScoped<
            IUserTourRepository,
            UserTourRepository>();

        return services;
    }
}