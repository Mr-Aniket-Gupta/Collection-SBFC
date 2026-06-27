using backend.Common.Database;
using backend.Modules.Reports.Controllers;
using backend.Modules.Reports.Services;

namespace backend.Modules.Reports.Config;

public static class ReportsModuleRegistration
{
    public static IServiceCollection AddReportsModule(this IServiceCollection services)
    {
        services.AddScoped<DcspQueryRepository>();
        services.AddScoped<ReportsService>();
        return services;
    }
}
