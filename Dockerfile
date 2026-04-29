# ── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first (layer caching)
COPY AnchorPro.sln ./
COPY AnchorPro/AnchorPro.csproj AnchorPro/
COPY AnchorPro.Tests/AnchorPro.Tests.csproj AnchorPro.Tests/

RUN dotnet restore AnchorPro/AnchorPro.csproj

# Copy everything else and publish
COPY AnchorPro/ AnchorPro/
RUN dotnet publish AnchorPro/AnchorPro.csproj -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# Railway injects $PORT — bind to it
ENV ASPNETCORE_URLS=http://+:$PORT
EXPOSE 8080

ENTRYPOINT ["dotnet", "AnchorPro.dll"]
