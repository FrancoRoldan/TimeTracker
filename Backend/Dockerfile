FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine3.18 AS build-env

WORKDIR /app

# Copy csproj and restore as distinct layers
COPY ./TimeTracker/*.csproj ./TimeTracker/
COPY ./Core/*.csproj ./Core/
COPY ./Data/*.csproj ./Data/
RUN dotnet restore "TimeTracker/TimeTracker.Api.csproj"

# Copy everything else and build
COPY . ./
RUN dotnet publish "TimeTracker/TimeTracker.Api.csproj" -c Release -o publish   

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine3.18
WORKDIR /app

COPY --from=build-env /app/publish .

RUN apk add --no-cache tzdata

RUN apk add --no-cache icu-libs krb5-libs libgcc libintl libssl1.1 libstdc++ zlib

ENV TZ America/Argentina/Buenos_Aires

ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT false

ENV ASPNETCORE_URLS http://+:80

# Identidad del despliegue (§29 del plan de observabilidad).
# Se inyecta en el build y la API la expone en GET /info y como atributos de
# recurso de OpenTelemetry, para poder correlacionar una degradación con el deploy
# que la provocó. Ejemplo:
#   docker compose build --build-arg BUILD_VERSION=1.4.0 \
#                        --build-arg BUILD_COMMIT_SHA=$(git rev-parse --short HEAD)
ARG BUILD_VERSION=unknown
ARG BUILD_COMMIT_SHA=unknown
ARG BUILD_NUMBER=unknown

ENV Build__Version=$BUILD_VERSION
ENV Build__CommitSha=$BUILD_COMMIT_SHA
ENV Build__Number=$BUILD_NUMBER

EXPOSE 80

ENTRYPOINT ["dotnet", "TimeTracker.Api.dll"]