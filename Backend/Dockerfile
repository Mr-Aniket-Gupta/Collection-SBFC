# FROM mcr.microsoft.com/dotnet/sdk:8.0-jammy AS build
# WORKDIR /src

# COPY Backend.csproj .
# RUN dotnet restore

# COPY . .

# RUN dotnet publish -c Release -o /app/publish

# FROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy AS final
# WORKDIR /app

# COPY --from=build /app/publish .

# EXPOSE 8080

# ENTRYPOINT ["dotnet", "Backend.dll"]