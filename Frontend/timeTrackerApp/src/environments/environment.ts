// NOTA: Este archivo es modificado en build-time por Docker.
// Para desarrollo local se usa environment.development.ts (fileReplacements).
// El Dockerfile reemplaza los PLACEHOLDER con los valores de los ARG.
// Fuente canónica: environment.template.ts
export const environment = {
    baseUrl: "API_URL_PLACEHOLDER",

    appVersion: "APP_VERSION_PLACEHOLDER",
    envName: "ENV_NAME_PLACEHOLDER",

    telemetry: {
        enabled: true,
        endpoint: "",
        sampleRate: 1.0
    }
};
