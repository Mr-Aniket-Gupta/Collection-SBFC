using backend.Database;
using backend.Modules.Analytics.Config;
using backend.Modules.Reports.Config;
using System.Text.Json;
using Prometheus;
// using backend.Extensions;
// using backend.Modules.UserTour.Config;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://localhost:5173",
                "http://localhost:3000",
                "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();

builder.Services.AddReportsModule();
builder.Services.AddAnalyticsModule();

// builder.Services.AddUserTourModule();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// required for httpsRedirection
app.UseHttpsRedirection();

// allow frontend to access
app.UseCors("Frontend");

// rate limiting
// app.UseSlidingWindowRateLimiter();

// register before endpoints
// app.UseHttpMetrics();

// routes
app.MapControllers();

// Expose Prometheus metrics
app.MapMetrics();


app.Run();
