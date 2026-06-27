using backend.Modules.Analytics.Repositories;

namespace backend.Modules.Analytics.Config;

public static class AnalyticsModuleRegistration
{
    public static IServiceCollection AddAnalyticsModule(this IServiceCollection services)
    {
        services.AddScoped<AnalyticsRepository>();
        return services;
    }
}
